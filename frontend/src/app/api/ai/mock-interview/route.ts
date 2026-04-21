import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAdminClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  if (file.type === 'application/pdf') return (await require('pdf-parse')(buffer)).text
  return (await require('mammoth').extractRawText({ buffer })).value
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

// ─── System Prompts ────────────────────────────────────────────────────────────

const START_PROMPT = `You are a strict, senior technical recruiter conducting a high-stakes interview for a {role} position.

TONE: Professional, realistic, slightly pressuring. You represent a real company. You will catch lies, inconsistencies, and vague answers. Be conversational but rigorous.

Resume summary:
{resume}

Instructions:
1. Start with a brief professional greeting (your name as "Alex from Talent Acquisition")
2. Ask ONE focused interview question tailored to their experience and the {role} role
3. The first question should be either:
   - A behavioral question ("Tell me about a time you...")
   - Or a role-specific technical question based on their resume

Keep greeting + first question under 80 words total. Start the interview immediately — no preamble.
Respond ONLY with the greeting + first question as plain text.`

const CONTINUE_PROMPT = `You are a strict, senior technical recruiter conducting an interview for a {role} position.

TONE: Serious, realistic, slightly pressuring. Catch vague answers immediately.

Conversation history:
{history}

Latest candidate answer: "{answer}"

Instructions:
1. Give 1-2 sentences of DIRECT feedback on their answer (what was strong, what was weak)
2. Score their answer out of 10 with brief justification
3. Ask the NEXT interview question (go deeper on the topic, or introduce a new relevant dimension)

CRITICAL:
- If their answer is vague ("I usually try my best"), call it out directly: "That's vague. Give a specific example..."
- If they ramble, interrupt them: "I appreciate the detail, but focus on the result..."
- Push for specifics: "What was the exact impact? Give me a number..."

Respond ONLY with valid JSON:
{
  "feedback": "[1-2 sentence direct feedback]",
  "score": [integer 1-10],
  "nextQuestion": "[next interview question, specific and tailored]"
}`

const STAR_FEEDBACK_PROMPT = `Analyze this interview answer using the STAR method:

Answer: "{answer}"

Provide:
1. STAR breakdown: Identify the Situation, Task, Action, and Result in their answer
2. Score each component 1-10
3. Overall STAR score (0-100)
4. One specific improvement suggestion

Respond ONLY with valid JSON:
{
  "situation": "[what was the context]",
  "task": "[what was their responsibility]",
  "action": "[what specifically did they do]",
  "result": "[what measurable outcome]",
  "situationScore": [1-10],
  "taskScore": [1-10],
  "actionScore": [1-10],
  "resultScore": [1-10],
  "overallStarScore": [0-100],
  "improvement": "[one specific thing they could improve]"
}`

const FINISH_PROMPT = `You are wrapping up an interview for {role}.

Conversation:
{history}

Final answer: "{answer}"

Score this final answer, provide overall feedback, and write a professional closing.

Respond ONLY with valid JSON:
{
  "score": [integer 1-10],
  "feedback": "[2 sentence feedback on last answer]",
  "overallAssessment": "[2-3 sentence overall assessment of candidate]",
  "closingMessage": "[warm but professional closing message]"
}`

const OVERALL_REPORT_PROMPT = `Generate an interview report for a candidate who just completed an interview.

Conversation summary:
{history}

Total questions answered: {count}

Provide:
1. Overall interview score (0-100)
2. Category breakdowns: Communication, Technical Relevance, STAR Method Usage, Confidence
3. Top 3 strengths
4. Top 3 improvements
5. 2-3 sentence final verdict

Respond ONLY with valid JSON:
{
  "overallScore": [0-100],
  "communicationScore": [0-100],
  "technicalScore": [0-100],
  "starMethodScore": [0-100],
  "confidenceScore": [0-100],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "verdict": "[2-3 sentence overall verdict]"
}`

// ─── Helper ────────────────────────────────────────────────────────────────────

function parseJSONResponse(text: string) {
  const cleaned = text.replace(/```json\n?|```\n?/g, '').trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Failed to parse AI response')
  return JSON.parse(match[0])
}

// ─── API Route ────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    // START: FormData with file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File
      const userId = formData.get('userId') as string
      const jobTitle = formData.get('jobTitle') as string
      const interviewType = formData.get('interviewType') as string || 'technical'

      const supabase = await createAdminClient()
      const { data: profile } = await supabase.from('profiles').select('scans').eq('id', userId).single()
      if (!profile || profile.scans < 5) {
        return NextResponse.json({ error: 'Need 5 scans to start interview' }, { status: 402 })
      }

      const resumeText = await extractText(file)
      const prompt = START_PROMPT
        .replace('{role}', jobTitle)
        .replace('{resume}', resumeText.substring(0, 2000))

      const result = await model.generateContent(prompt)
      const firstQuestion = result.response.text()

      const sessionId = randomUUID()

      await supabase.from('profiles').update({ scans: profile.scans - 5 }).eq('id', userId)
      await supabase.from('scan_logs').insert({
        user_id: userId,
        action_type: 'mock_interview',
        scans_used: 5,
        created_at: new Date().toISOString()
      })

      return NextResponse.json({
        sessionId,
        firstQuestion,
        interviewType,
        jobTitle
      })
    }

    // CONTINUE / FINISH: JSON body
    const body = await request.json()
    const { action, answer, jobTitle, history, questionCount } = body

    if (action === 'continue') {
      const historyText = (history || [])
        .map((m: any) => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
        .join('\n')

      const prompt = CONTINUE_PROMPT
        .replace('{role}', jobTitle)
        .replace('{history}', historyText)
        .replace('{answer}', answer)

      const result = await model.generateContent(prompt)
      const parsed = parseJSONResponse(result.response.text())

      // Also generate STAR feedback
      const starResult = await model.generateContent(STAR_FEEDBACK_PROMPT.replace('{answer}', answer))
      let starData = null
      try { starData = parseJSONResponse(starResult.response.text()) } catch { }

      return NextResponse.json({
        ...parsed,
        starFeedback: starData
      })
    }

    if (action === 'finish') {
      const historyText = (history || [])
        .map((m: any) => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
        .join('\n')

      const prompt = FINISH_PROMPT
        .replace('{role}', jobTitle)
        .replace('{history}', historyText)
        .replace('{answer}', answer)

      const result = await model.generateContent(prompt)
      const parsed = parseJSONResponse(result.response.text())

      // Generate overall report
      const reportResult = await model.generateContent(
        OVERALL_REPORT_PROMPT
          .replace('{history}', historyText)
          .replace('{count}', String(questionCount || 5))
      )
      let reportData = null
      try { reportData = parseJSONResponse(reportResult.response.text()) } catch { }

      return NextResponse.json({
        ...parsed,
        report: reportData
      })
    }

    return NextResponse.json({ error: 'Invalid action. Use: start, continue, or finish' }, { status: 400 })

  } catch (error) {
    console.error('Mock interview error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Interview failed. Please try again.' },
      { status: 500 }
    )
  }
}
