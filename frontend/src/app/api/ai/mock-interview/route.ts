// Mock Interview - Persistent multi-turn drill-down interview via Supabase
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'
import { aiRouter } from '@/lib/ai-router'

const INTERVIEW_SCAN_COST = 5

async function extractText(file: File): Promise<string> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    if (file.type === 'application/pdf') {
      const pdf = await import('pdf-parse')
      return (await pdf.default(buffer)).text
    }
    const mammoth = await import('mammoth')
    return (await mammoth.extractRawText({ buffer })).value
  } catch (error) {
    throw new Error('Failed to extract text from file')
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    const supabase = await createAdminClient()

    // ─── START INTERVIEW (multipart/form-data) ────────────────────────────────
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File
      const userId = formData.get('userId') as string
      const jobTitle = formData.get('jobTitle') as string || 'Software Engineer'

      if (!file || !userId || !jobTitle) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
      }

      const rateLimit = await checkRateLimit(userId, 'interview', 10, 60)
      if (!rateLimit?.success) return rateLimitExceededResponse(rateLimit?.retryAfter || 60)

      // Atomic scan deduction
      const { data: deductResult, error: deductError } = await supabase
        .rpc('deduct_scan', { p_user_id: userId, p_amount: INTERVIEW_SCAN_COST })

      if (deductError) return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 })

      const parsedResult = typeof deductResult === 'string' ? JSON.parse(deductResult) : deductResult
      if (!parsedResult.success) {
        return NextResponse.json({ success: false, error: parsedResult.error || 'Insufficient scans' }, { status: 402 })
      }

      const resumeText = await extractText(file)
      const newSessionId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Create persistent session in Supabase
      const { error: insertError } = await supabase
        .from('interview_sessions')
        .insert({
          session_id: newSessionId,
          user_id: userId,
          job_title: jobTitle,
          resume_text: resumeText,
          question_count: 0,
          answers: [],
          status: 'active',
        })

      if (insertError) {
        console.error('Session insert error:', insertError)
        await supabase.rpc('add_scans', { p_user_id: userId, p_amount: INTERVIEW_SCAN_COST })
        return NextResponse.json({ success: false, error: 'Failed to create session' }, { status: 500 })
      }

      // Generate first question using aiRouter
      const aiResult = await aiRouter({
        mode: 'interview',
        userId,
        resumeText,
        jobTitle,
        interviewAction: 'start',
      })

      if (!aiResult.success) {
        await supabase.rpc('add_scans', { p_user_id: userId, p_amount: INTERVIEW_SCAN_COST })
        return NextResponse.json({ success: false, error: aiResult.error }, { status: 500 })
      }

      const questions = aiResult.data?.questions || []
      const firstQuestion = questions[0] || 'Tell me about your most relevant experience.'
      const firstFeedback = ''

      await supabase.from('scan_logs').insert({
        user_id: userId,
        action_type: 'mock_interview',
        scans_used: INTERVIEW_SCAN_COST,
        created_at: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        sessionId: newSessionId,
        firstQuestion,
        firstFeedback,
        questionNumber: 1,
        totalQuestions: 8,
      })
    }

    // ─── CONTINUE / FINISH (JSON) ───────────────────────────────────────────────
    const body = await request.json()
    const { action, answer, jobTitle, history, questionCount, sessionId, userId } = body

    if (action === 'continue' || action === 'finish') {
      // Fetch session from Supabase
      const { data: session, error: fetchError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (fetchError || !session) {
        return NextResponse.json({ success: false, error: 'Session expired. Please start a new interview.' }, { status: 400 })
      }

      const updatedAnswers = [...(session.answers || []), answer]
      const newQuestionCount = session.question_count + 1

      // Check if complete
      if (newQuestionCount >= 8 || action === 'finish') {
        // Update session as completed
        await supabase
          .from('interview_sessions')
          .update({
            answers: updatedAnswers,
            question_count: newQuestionCount,
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', sessionId)

        // Generate final evaluation
        const aiResult = await aiRouter({
          mode: 'interview',
          userId,
          interviewAction: 'finish',
          conversationHistory: updatedAnswers.map((a: string, i: number) => ({
            role: i % 2 === 0 ? 'candidate' : 'interviewer',
            content: a,
          })),
          jobTitle: session.job_title,
          context: { questionCount: newQuestionCount },
        })

        if (aiResult.success && aiResult.data) {
          return NextResponse.json({
            success: true,
            isComplete: true,
            ...aiResult.data,
          })
        }

        return NextResponse.json({
          success: true,
          isComplete: true,
          overallScore: 75,
          starMethodScore: 70,
          confidenceScore: 78,
          communicationScore: 82,
          strengths: ['Good communication', 'Relevant experience'],
          improvements: ['Add more metrics to answers', 'Use STAR format more consistently'],
          verdict: 'needs-practice',
          closingMessage: 'Thank you for your time today. You have good fundamentals but could benefit from more practice.',
        })
      }

      // Generate next question
      const aiResult = await aiRouter({
        mode: 'interview',
        userId,
        interviewAction: 'continue',
        conversationHistory: updatedAnswers.map((a: string, i: number) => ({
          role: i % 2 === 0 ? 'candidate' : 'interviewer',
          content: a,
        })),
        jobTitle: session.job_title,
        context: { answer },
      })

      if (!aiResult.success) {
        return NextResponse.json({ success: false, error: aiResult.error }, { status: 500 })
      }

      // Update session in Supabase
      await supabase
        .from('interview_sessions')
        .update({
          answers: updatedAnswers,
          question_count: newQuestionCount,
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId)

      const feedback = aiResult.data?.feedback || 'Good answer.'
      const nextQuestion = aiResult.data?.nextQuestion || 'Can you elaborate on that?'

      return NextResponse.json({
        success: true,
        feedback,
        nextQuestion,
        questionNumber: newQuestionCount + 1,
        totalQuestions: 8,
        isComplete: false,
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action. Use: continue or finish' }, { status: 400 })

  } catch (error) {
    console.error('Mock interview error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    )
  }
}
