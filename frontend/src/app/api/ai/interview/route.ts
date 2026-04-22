// AI Interviewer with Streaming Support
// State-managed multi-turn interview with drill-down method

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'
import { getGenerativeModel, GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

const INTERVIEW_SCAN_COST = 5

interface Message {
  role: 'user' | 'assistant' | 'interviewer'
  content: string
}

interface InterviewState {
  sessionId: string
  questionCount: number
  answers: string[]
  startTime: number
}

// In-memory session store (use Redis for production)
const sessions = new Map<string, InterviewState>()

const DRILL_DOWN_PROMPT = `You are an expert technical recruiter conducting a rigorous mock interview. Your methodology:

1. Ask ONE focused question at a time
2. If answer is weak/vague, drill down with follow-up (use STAR: Situation, Task, Action, Result)
3. Push for SPECIFIC metrics and examples
4. After exactly {count} satisfactory answers, provide final evaluation
5. Keep questions relevant to the candidate's background and target role

FINAL OUTPUT (after {count} questions):
{{"confidence_score": 0-100, "star_method_rating": "A-F", "suggested_improvement": "actionable feedback", "strengths": ["list"], "weaknesses": ["list"]}}

Candidate Background:
{resumeSummary}

Target Role: {targetJob}

Previous Conversation:
{history}

{"instruction": "Start with a brief greeting and ask about their most relevant experience."}`

function getGenAI() {
  return new GoogleGenerativeAI(GEMINI_API_KEY)
}

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  if (file.type === 'application/pdf') {
    const pdfParse = await import('pdf-parse')
    return (await pdfParse.default(buffer)).text
  }
  const mammoth = await import('mammoth')
  return (await mammoth.extractRawText({ buffer })).value
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

    // ─── START NEW INTERVIEW ───────────────────────────────────────────────────
    if (action === 'start') {
      if (!file && !resumeTextParam) {
        return NextResponse.json({ error: 'Missing resume file or text' }, { status: 400 })
      }

      const rateLimit = await checkRateLimit(userId, 'interview', 10, 60)
      if (!rateLimit?.success) return rateLimitExceededResponse(rateLimit.retryAfter || 60)

      const supabase = await createAdminClient()

      // Atomic scan deduction
      const { data: deductResult, error: deductError } = await supabase
        .rpc('deduct_scan', { p_user_id: userId, p_amount: INTERVIEW_SCAN_COST })

      if (deductError) return NextResponse.json({ error: 'Database error' }, { status: 500 })

      const parsedResult = typeof deductResult === 'string' ? JSON.parse(deductResult) : deductResult
      if (!parsedResult.success) {
        return NextResponse.json({ error: parsedResult.error || 'Insufficient scans' }, { status: 402 })
      }

      const resumeText = file ? await extractText(file) : resumeTextParam

      // Create new session
      const newSessionId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessions.set(newSessionId, {
        sessionId: newSessionId,
        questionCount: 0,
        answers: [],
        startTime: Date.now(),
      })

      // Generate first question
      const genAI = getGenAI()
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

      const prompt = DRILL_DOWN_PROMPT
        .replace('{count}', '5')
        .replace('{resumeSummary}', resumeText || 'No resume provided')
        .replace('{targetJob}', jobTitle)
        .replace('{history}', 'No previous conversation yet.')

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 500 }
      })

      let question = result.response.text().trim()

      // Parse out JSON if it appears at the end
      const jsonMatch = question.match(/\{[\s\S]*\}$/)
      if (jsonMatch) {
        question = question.replace(/\{[\s\S]*\}$/, '').trim()
      }

      // Log usage
      await supabase.from('scan_logs').insert({
        user_id: userId,
        action_type: 'interview_start',
        scans_used: INTERVIEW_SCAN_COST,
        created_at: new Date().toISOString(),
      })

      return NextResponse.json({
        sessionId: newSessionId,
        question,
        questionNumber: 1,
        totalQuestions: 5,
      })
    }

    // ─── CONTINUE INTERVIEW (user answered) ─────────────────────────────────────
    if (action === 'continue' && sessionId && message) {
      const session = sessions.get(sessionId)
      if (!session) {
        return NextResponse.json({ error: 'Session expired. Please start a new interview.' }, { status: 400 })
      }

      session.answers.push(message)
      session.questionCount++

      // Check if interview is complete
      if (session.questionCount >= 5) {
        // Generate final evaluation
        const genAI = getGenAI()
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

        const evalPrompt = `Based on this interview, provide final evaluation:

Answers:
{session.answers.map((a, i) => `Q${i + 1}: ${a}`).join('\n')}

Respond ONLY with JSON:
{{"confidence_score": 0-100, "star_method_rating": "A-F", "suggested_improvement": "feedback", "strengths": ["s1", "s2"], "weaknesses": ["w1", "w2"]}}`

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: evalPrompt }] }],
          generationConfig: { temperature: 0.3 }
        })

        const evalText = result.response.text()
        const evalMatch = evalText.match(/\{[\s\S]*\}/)

        sessions.delete(sessionId) // Clean up session

        if (evalMatch) {
          return NextResponse.json({
            isComplete: true,
            evaluation: JSON.parse(evalMatch[0]),
          })
        }

        return NextResponse.json({
          isComplete: true,
          evaluation: {
            confidence_score: 75,
            star_method_rating: 'B',
            suggested_improvement: 'Practice using more specific metrics in your answers',
            strengths: ['Good communication', 'Relevant experience'],
            weaknesses: ['Need more quantifiable results', 'Follow STAR format more clearly']
          }
        })
      }

      // Generate next question based on answer quality
      const genAI = getGenAI()
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

      const drillDownPrompt = `The candidate just answered question ${session.questionCount}:
"${message}"

Tasks:
1. Give 1 sentence of feedback on their answer
2. Ask the next targeted follow-up question (dig deeper or new angle)
3. If answer was strong, acknowledge briefly then ask next topic question

Keep the interview flowing naturally. Ask ONE question only.

Format your response as:
FEEDBACK: [1 sentence]
QUESTION: [your next question]`

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: drillDownPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
      })

      const response = result.response.text()
      const feedbackMatch = response.match(/FEEDBACK:\s*([\s\S]*?)(?=QUESTION:)/i)
      const questionMatch = response.match(/QUESTION:\s*([\s\S]*?)$/i)

      const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'Good answer.'
      const nextQuestion = questionMatch ? questionMatch[1].trim() : response.replace(/FEEDBACK:[\s\S]*?QUESTION:/i, '').trim()

      return NextResponse.json({
        feedback,
        question: nextQuestion,
        questionNumber: session.questionCount + 1,
        totalQuestions: 5,
      })
    }

    // ─── GET SESSION STATUS ─────────────────────────────────────────────────────
    if (action === 'status' && sessionId) {
      const session = sessions.get(sessionId)
      if (!session) {
        return NextResponse.json({ error: 'Session expired' }, { status: 400 })
      }
      return NextResponse.json({
        questionCount: session.questionCount,
        answersCount: session.answers.length,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Interview error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    )
  }
}

// Streaming endpoint for real-time response (optional enhancement)
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId')
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  const session = sessions.get(sessionId)
  if (!session) {
    return NextResponse.json({ status: 'expired' }, { status: 200 })
  }

  return NextResponse.json({
    status: 'active',
    questionCount: session.questionCount,
    answersCount: session.answers.length,
  })
}