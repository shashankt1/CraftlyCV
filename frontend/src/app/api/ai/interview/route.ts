// AI Interviewer - Persistent multi-turn interview via Supabase
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'
import { aiRouter } from '@/lib/ai-router'

const INTERVIEW_SCAN_COST = 5

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  if (file.type === 'application/pdf') {
    const pdfParse = await import('pdf-parse')
    return (await pdfParse.default(buffer)).text
  }
  const mammoth = await import('mammoth')
  return (await mammoth.extractRawText({ buffer })).value
}

// Helper to parse JSON from AI responses
function parseJSON(text: string): any | null {
  try {
    const match = text.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string
    const jobTitle = formData.get('jobTitle') as string || 'Software Engineer'
    const action = formData.get('action') as string
    const sessionId = formData.get('sessionId') as string | null
    const message = formData.get('message') as string | null
    const resumeTextParam = formData.get('resumeText') as string | null

    const supabase = await createAdminClient()

    // ─── START NEW INTERVIEW ───────────────────────────────────────────────────
    if (action === 'start') {
      if (!file && !resumeTextParam) {
        return NextResponse.json({ success: false, error: 'Missing resume file or text' }, { status: 400 })
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

      const resumeText = file ? await extractText(file) : (resumeTextParam || '')

      // Create persistent session in Supabase
      const newSessionId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

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
        // Refund scan
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
      const firstQuestion = questions[0] || 'Tell me about your most relevant experience for this role.'

      // Log usage
      await supabase.from('scan_logs').insert({
        user_id: userId,
        action_type: 'interview_start',
        scans_used: INTERVIEW_SCAN_COST,
        created_at: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        sessionId: newSessionId,
        question: firstQuestion,
        questionNumber: 1,
        totalQuestions: 5,
      })
    }

    // ─── CONTINUE INTERVIEW (user answered) ─────────────────────────────────────
    if (action === 'continue' && sessionId && message) {
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

      const updatedAnswers = [...(session.answers || []), message]
      const newQuestionCount = session.question_count + 1

      // Check if interview is complete
      if (newQuestionCount >= 5) {
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

        // Get overall report
        const aiResult = await aiRouter({
          mode: 'interview',
          userId,
          interviewAction: 'finish',
          conversationHistory: updatedAnswers.map((a: string, i: number) => ({
            role: i % 2 === 0 ? 'candidate' : 'interviewer',
            content: a,
          })),
          jobTitle: session.job_title,
          context: { answer: message, questionCount: newQuestionCount },
        })

        const evaluation = aiResult.success ? aiResult.data : {
          confidence_score: 75,
          star_method_rating: 'B',
          suggested_improvement: 'Practice using more specific metrics in your answers',
          strengths: ['Good communication', 'Relevant experience'],
          weaknesses: ['Need more quantifiable results'],
        }

        return NextResponse.json({
          success: true,
          isComplete: true,
          evaluation,
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
        context: { answer: message },
      })

      if (!aiResult.success) {
        return NextResponse.json({ success: false, error: aiResult.error }, { status: 500 })
      }

      const feedback = aiResult.data?.feedback || 'Good answer.'
      const nextQuestion = aiResult.data?.nextQuestion || 'Can you elaborate on that experience?'

      // Update session in Supabase
      await supabase
        .from('interview_sessions')
        .update({
          answers: updatedAnswers,
          question_count: newQuestionCount,
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId)

      return NextResponse.json({
        success: true,
        feedback,
        question: nextQuestion,
        questionNumber: newQuestionCount + 1,
        totalQuestions: 5,
      })
    }

    // ─── GET SESSION STATUS ─────────────────────────────────────────────────────
    if (action === 'status' && sessionId) {
      const { data: session, error } = await supabase
        .from('interview_sessions')
        .select('question_count, answers, status')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single()

      if (error || !session) {
        return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        questionCount: session.question_count,
        answersCount: (session.answers || []).length,
        status: session.status,
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Interview error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId')
  const userId = request.nextUrl.searchParams.get('userId')

  if (!sessionId || !userId) {
    return NextResponse.json({ success: false, error: 'Missing sessionId or userId' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  const { data: session, error } = await supabase
    .from('interview_sessions')
    .select('status, question_count, answers')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single()

  if (error || !session) {
    return NextResponse.json({ success: true, status: 'expired' }, { status: 200 })
  }

  return NextResponse.json({
    success: true,
    status: session.status,
    questionCount: session.question_count,
    answersCount: (session.answers || []).length,
  })
}
