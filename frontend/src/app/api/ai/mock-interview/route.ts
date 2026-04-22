import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

const INTERVIEW_SCAN_COST = 5

interface Message {
  role: 'interviewer' | 'candidate'
  content: string
}

// Session store (use Redis for production)
const sessions = new Map<string, {
  sessionId: string
  questionCount: number
  answers: string[]
  startTime: number
  resumeText: string
  jobTitle: string
}>()

const DRILL_DOWN_SYSTEM = `You are an expert technical recruiter conducting a rigorous mock interview using the STAR method.

RULES:
1. Ask ONE focused question at a time
2. If answer is weak/vague, drill down with follow-up questions (use STAR: Situation, Task, Action, Result)
3. Push for SPECIFIC metrics, numbers, and quantifiable outcomes
4. Do NOT reveal you're an AI - act as a professional recruiter
5. Keep questions relevant to the candidate's background and target role

TRACKING:
- After exactly 8 satisfactory answers, provide final evaluation
- Evaluate: confidence, STAR method usage, specificity, communication

FINAL OUTPUT (after 8 questions):
{"overallScore": 0-100, "starMethodScore": 0-100, "confidenceScore": 0-100, "communicationScore": 0-100, "strengths": ["list"], "improvements": ["list"], "verdict": "hiring-ready/needs-practice/not-ready", "closingMessage": "encouraging farewell message"}`

function getGenAI() {
  return new GoogleGenerativeAI(GEMINI_API_KEY)
}

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

function buildPrompt(session: any, history: Message[], newAnswer?: string) {
  const historyText = history.map(m =>
    `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`
  ).join('\n')

  return `${DRILL_DOWN_SYSTEM}

Target Role: ${session.jobTitle}

Candidate Resume Summary:
${session.resumeText.substring(0, 1500)}

Conversation History:
${historyText}
${newAnswer ? `\nLatest Answer: "${newAnswer}"` : ''}

${history.length === 0
    ? 'Start with: "Hi! I\'m your interviewer today. Let\'s talk about your most relevant experience for this role. Can you describe a challenging project you worked on?"'
    : `Based on their latest answer, provide feedback and ask the next question.`
  }

Format your response as:
FEEDBACK: [1-2 sentences of constructive feedback on their answer]
NEXT_QUESTION: [the next interview question]`
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
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
      }

      const rateLimit = await checkRateLimit(userId, 'interview', 10, 60)
      if (!rateLimit?.success) return rateLimitExceededResponse(rateLimit?.retryAfter || 60)

      // Atomic scan deduction
      const { data: deductResult, error: deductError } = await supabase
        .rpc('deduct_scan', { p_user_id: userId, p_amount: INTERVIEW_SCAN_COST })

      if (deductError) return NextResponse.json({ error: 'Database error' }, { status: 500 })

      const parsedResult = typeof deductResult === 'string' ? JSON.parse(deductResult) : deductResult
      if (!parsedResult.success) {
        return NextResponse.json({ error: parsedResult.error || 'Insufficient scans' }, { status: 402 })
      }

      const resumeText = await extractText(file)
      const newSessionId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      sessions.set(newSessionId, {
        sessionId: newSessionId,
        questionCount: 0,
        answers: [],
        startTime: Date.now(),
        resumeText,
        jobTitle,
      })

      const genAI = getGenAI()
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

      const session = sessions.get(newSessionId)!
      const prompt = buildPrompt(session, [])

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 400 }
      })

      const response = result.response.text()
      const questionMatch = response.match(/NEXT_QUESTION:\s*([\s\S]*?)$/i)
      const feedbackMatch = response.match(/FEEDBACK:\s*([\s\S]*?)(?=NEXT_QUESTION:)/i)

      const firstQuestion = questionMatch
        ? questionMatch[1].trim()
        : response.replace(/FEEDBACK:[\s\S]*/i, '').trim()

      const firstFeedback = feedbackMatch ? feedbackMatch[1].trim() : ''

      await supabase.from('scan_logs').insert({
        user_id: userId,
        action_type: 'mock_interview',
        scans_used: INTERVIEW_SCAN_COST,
        created_at: new Date().toISOString(),
      })

      return NextResponse.json({
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
      const session = sessions.get(sessionId)
      if (!session) {
        return NextResponse.json({ error: 'Session expired. Please start a new interview.' }, { status: 400 })
      }

      const parsedHistory: Message[] = history || []
      session.answers.push(answer)
      session.questionCount++

      // Check if complete
      if (session.questionCount >= 8 || action === 'finish') {
        const genAI = getGenAI()
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

        const evalPrompt = `${DRILL_DOWN_SYSTEM}

FINAL EVALUATION REQUEST

Target Role: ${session.jobTitle}
Answers provided: ${session.answers.map((a, i) => `Q${i + 1}: ${a}`).join('\n')}

Provide final evaluation in JSON format.`

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: evalPrompt }] }],
          generationConfig: { temperature: 0.3 }
        })

        const response = result.response.text()
        const jsonMatch = response.match(/\{[\s\S]*\}/)

        sessions.delete(sessionId)

        if (jsonMatch) {
          return NextResponse.json({ isComplete: true, ...JSON.parse(jsonMatch[0]) })
        }

        return NextResponse.json({
          isComplete: true,
          overallScore: 75,
          starMethodScore: 70,
          confidenceScore: 78,
          communicationScore: 82,
          strengths: ['Good communication', 'Relevant experience'],
          improvements: ['Add more metrics to answers', 'Use STAR format more consistently'],
          verdict: 'needs-practice',
          closingMessage: 'Thank you for your time today. You have good fundamentals but could benefit from more practice with the STAR method.'
        })
      }

      // Generate next question
      const genAI = getGenAI()
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

      const prompt = buildPrompt(session, parsedHistory, answer)
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
      })

      const response = result.response.text()
      const feedbackMatch = response.match(/FEEDBACK:\s*([\s\S]*?)(?=NEXT_QUESTION:)/i)
      const questionMatch = response.match(/NEXT_QUESTION:\s*([\s\S]*?)$/i)

      const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'Good answer. Let\'s continue.'
      const nextQuestion = questionMatch ? questionMatch[1].trim() : response.replace(/FEEDBACK:[\s\S]*?NEXT_QUESTION:/i, '').trim()

      return NextResponse.json({
        feedback,
        nextQuestion,
        questionNumber: session.questionCount + 1,
        totalQuestions: 8,
        isComplete: false
      })
    }

    return NextResponse.json({ error: 'Invalid action. Use: start, continue, or finish' }, { status: 400 })

  } catch (error) {
    console.error('Mock interview error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    )
  }
}