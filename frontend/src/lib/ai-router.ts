/**
 * CraftlyCV AI Router — Single Brain System
 * All AI logic flows through here. No AI logic outside this file.
 *
 * Modes:
 * - resume  → ATS resume generator
 * - interview → FAANG recruiter simulation (multi-turn)
 * - career  → income + job strategy advisor
 * - convert → multilingual resume transformer
 * - general → structured assistant
 *
 * Rules:
 * - strict structured output
 * - no hallucination
 * - adaptive context memory
 * - interview is dynamic (not static questions)
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

// ─── Configuration ────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''

let genAIInstance: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!genAIInstance) {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }
    genAIInstance = new GoogleGenerativeAI(GEMINI_API_KEY)
  }
  return genAIInstance
}

// ─── Timeout Wrapper ────────────────────────────────────────────────────────────

async function generateWithTimeout(
  model: any,
  prompt: string,
  timeoutMs: number = 8000
): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      signal: controller.signal,
    })
    return result.response.text()
  } finally {
    clearTimeout(timeout)
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type AIMode = 'resume' | 'interview' | 'career' | 'convert' | 'general'

export interface AIRequest {
  mode: AIMode
  userId: string
  // Resume mode
  resumeText?: string
  jobDescription?: string
  improvements?: string[]
  // Interview mode
  conversationHistory?: Array<{ role: string; content: string }>
  interviewAction?: 'start' | 'continue' | 'finish'
  jobTitle?: string
  // Career mode
  skills?: string[]
  experienceYears?: number
  timePerWeek?: number
  country?: string
  // Convert mode
  sourceLanguage?: string
  targetLanguage?: string
  // General
  query?: string
  context?: Record<string, any>
}

export interface AIResponse {
  success: boolean
  data?: any
  error?: string
}

// ─── Prompt Templates ─────────────────────────────────────────────────────────

// RESUME MODE
const RESUME_ANALYSIS_PROMPT = `You are the world's toughest and most thorough ATS resume analyzer.
Analyze every single aspect of this resume with the highest standards used by top companies like Google, Amazon, Microsoft, and McKinsey.

Be ruthlessly thorough. Check everything:
- Keyword density and ATS parsing
- Action verbs and impact language
- Quantifiable achievements (numbers, %, $)
- Format and structure
- Skills alignment
- Grammar and clarity
- Section completeness
- Industry-specific requirements
- Seniority signals
- Recruiter 6-second scan test

Respond ONLY with valid JSON in this exact format:
{
  "score": [integer 0-100, be honest - most resumes score 45-75],
  "detectedField": "[primary career field]",
  "experienceYears": [estimated years as integer],
  "strengthStatement": "[one sentence validating their background]",
  "realWorldContext": "[2-3 sentences on what this score means in job market]",
  "summary": "[2 sentence overall assessment]",
  "projectedScore": [score + 18-28 after fixes, max 97],
  "scorePercentile": [what percentile they're in],
  "keywordMatches": ["keyword1", "keyword2", ...],
  "missingKeywords": ["gap1", "gap2", ...],
  "strengths": ["specific strength 1", "specific strength 2", ...],
  "improvements": ["specific improvement 1", "specific improvement 2", ...],
  "opportunities": [
    {
      "icon": "emoji",
      "title": "Opportunity title",
      "whatsHappening": "specific issue",
      "theFix": "[specific fix]",
      "impact": [10-15],
      "proOnly": false
    }
  ]
}

RESUME TEXT:
{resumeText}`

const RESUME_TAILOR_PROMPT = `You are an expert ATS resume writer. Rewrite this resume to PERFECTLY match the job description.

ORIGINAL RESUME:
{resumeText}

JOB DESCRIPTION:
{jobDescription}

RULES:
- Mirror keywords and phrases from the job description naturally
- Keep ALL factual info accurate (names, companies, dates)
- Use ALL CAPS for section headers
- Use "- " for every bullet point
- Add metrics where logical and truthful
- No markdown, no JSON, no code fences

After the resume, on a new line write exactly:
MATCH_SCORE: [number between 75-98]
IMPROVEMENTS:
- [improvement 1]
- [improvement 2]
- [improvement 3]`

const RESUME_IMPROVE_PROMPT = `You are an expert resume writer. Rewrite this resume to be more ATS-friendly and impactful.

ORIGINAL RESUME:
{resumeText}

IMPROVEMENTS TO APPLY:
{improvements}

STRICT FORMATTING RULES:
- First line must be the person's full name only
- Use ALL CAPS for every section header
- Use "- " to start every bullet point
- Keep all facts accurate
- No markdown, no JSON, no code fences

Return ONLY the plain text resume.`

const BUILD_SUMMARY_PROMPT = `You are an expert resume writer. Write a powerful 3-sentence professional summary for this person.

Name: {name}
Current/Recent Role: {role}
Companies: {companies}
Skills: {skills}
Education: {education}

Rules:
- Start with their role/expertise
- Include years of experience if available
- Mention 2-3 key technologies/skills
- End with a value statement
- No buzzwords
- ATS-optimized
- Max 60 words

Respond with ONLY the summary text, no quotes, no labels.`

const BUILD_BULLETS_PROMPT = `You are an expert resume writer. Rewrite these job bullets to be ATS-optimized, impact-focused, and quantified.

Company: {company}
Role: {role}
Current bullets:
{bullets}

Rules:
- Start with strong action verbs (Built, Led, Increased, Reduced, Designed, Deployed, Scaled)
- Add realistic metrics where logical
- ATS-friendly
- Keep under 20 words per bullet
- If empty, write a strong generic one

Respond ONLY with valid JSON array of strings, same count as input:
["bullet 1", "bullet 2", "bullet 3"]`

// INTERVIEW MODE
const INTERVIEW_START_PROMPT = `You are a strict, senior technical recruiter conducting a high-stakes interview for a {role} position.

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

const INTERVIEW_CONTINUE_PROMPT = `You are a strict, senior technical recruiter conducting an interview for a {role} position.

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

const INTERVIEW_STAR_PROMPT = `Analyze this interview answer using the STAR method:

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

const INTERVIEW_FINISH_PROMPT = `You are wrapping up an interview for {role}.

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

const INTERVIEW_REPORT_PROMPT = `Generate an interview report for a candidate who just completed an interview.

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

const INTERVIEW_QUESTIONS_GENERATE_PROMPT = `You are an expert interviewer at a top tech company. Based on the resume and job details below, generate exactly 10 interview questions that are highly tailored and realistic.

RESUME:
{resume}

JOB TITLE: {jobTitle}

JOB DESCRIPTION:
{jobDescription}

Generate a mix of:
- 3 behavioral questions (STAR format, based on candidate's actual experience)
- 3 technical/role-specific questions (based on job requirements and resume skills)
- 2 situational questions (realistic scenarios for this role)
- 1 strengths/weakness question (relevant to this job)
- 1 career goals question (connecting their background to this role)

Make questions specific — reference actual technologies, experiences, or requirements from the resume and JD. Do NOT generate generic questions.

Respond ONLY with valid JSON in this exact format:
{
  "questions": [
    {"question": "Tell me about a time you...", "category": "Behavioral", "difficulty": "Easy|Medium|Hard"},
    {"question": "...", "category": "Technical", "difficulty": "Easy|Medium|Hard"}
  ]
}`

const INTERVIEW_GRADE_PROMPT = `You are an expert interviewer evaluating a candidate's answer for a {jobTitle} role.

QUESTION: {question}
CANDIDATE'S ANSWER: {answer}

Evaluate and respond ONLY with valid JSON:
{
  "score": [integer 1-10],
  "feedback": "[2-3 sentences of specific constructive feedback]",
  "betterAnswer": "[A concise model answer in 3-4 sentences]"
}`

// CAREER MODE
const CAREER_JOBS_PROMPT = `You are a career counselor AI. Analyze this resume and provide comprehensive career guidance.

RESUME:
{resume}

Respond ONLY with valid JSON in this exact format (no extra text):
{
  "currentLevel": "Junior/Mid/Senior/Executive",
  "summary": "2-sentence career overview",
  "jobRoles": [
    {"title": "Role Title", "matchPercent": 92, "reason": "why this fits", "salaryRange": "₹8-15 LPA"},
    {"title": "Role Title", "matchPercent": 85, "reason": "why this fits", "salaryRange": "₹10-18 LPA"},
    {"title": "Role Title", "matchPercent": 78, "reason": "why this fits", "salaryRange": "₹12-20 LPA"},
    {"title": "Role Title", "matchPercent": 70, "reason": "why this fits", "salaryRange": "₹15-25 LPA"}
  ],
  "careerSwitch": {
    "from": "current domain",
    "to": "suggested new domain with high demand",
    "timeframe": "6-12 months",
    "steps": ["step 1", "step 2", "step 3", "step 4", "step 5"]
  },
  "freelancePaths": [
    {"platform": "Upwork", "url": "https://www.upwork.com", "niche": "specific niche", "howToStart": ["step 1", "step 2", "step 3"], "earnings": "₹2,000-8,000/hour"},
    {"platform": "Fiverr", "url": "https://www.fiverr.com", "niche": "another niche", "howToStart": ["step 1", "step 2", "step 3"], "earnings": "$50-200/project"}
  ],
  "courses": [
    {"name": "Course Name", "provider": "Coursera/Udemy/YouTube/etc", "url": "https://coursera.org/...", "free": false},
    {"name": "Course Name", "provider": "YouTube", "url": "https://youtube.com/...", "free": true}
  ],
  "certifications": ["Cert 1", "Cert 2", "Cert 3", "Cert 4", "Cert 5"],
  "dsaTopics": ["Arrays", "Dynamic Programming", "Graphs", "Trees", "System Design"]
}

Note: dsaTopics should be null if not technical. Use Indian salary ranges (LPA). Use real course URLs.`

const CAREER_ROADMAP_PROMPT = `You are a career counselor building a highly specific, actionable career roadmap for someone.

Current field: {detectedField}
Target goal: {targetGoal}
Current ATS score: {score}/100
Context: Indian job market, use Indian salary ranges in LPA (Lakhs Per Annum)

Build a realistic, step-by-step roadmap to get them from where they are to their target goal.

Rules:
- Steps must be concrete and specific
- Include real resources with real URLs
- Mix free and paid resources
- Timeline must be realistic
- DSA topics only if technical role
- Salary jump should be realistic for Indian market

Respond ONLY with valid JSON:
{
  "currentGoal": "{detectedField}",
  "targetGoal": "{targetGoal}",
  "timeframe": "X-Y months",
  "salaryJump": "₹XL → ₹YL LPA",
  "steps": [
    {"week": "Week 1-2", "action": "Specific action", "resource": "Resource", "resourceUrl": "https://url.com", "free": true},
    {"week": "Week 3-4", "action": "Next action", "resource": "Resource", "resourceUrl": "https://url.com", "free": false},
    {"week": "Month 2", "action": "Action", "resource": "Resource", "resourceUrl": "https://url.com", "free": true},
    {"week": "Month 3", "action": "Action", "resource": "Resource", "resourceUrl": "https://url.com", "free": true},
    {"week": "Month 4-5", "action": "Build portfolio project", "resource": "GitHub", "resourceUrl": "https://github.com", "free": true},
    {"week": "Month 5-6", "action": "Apply + network", "resource": "LinkedIn", "resourceUrl": "https://linkedin.com/jobs", "free": true}
  ],
  "certifications": ["Cert 1", "Cert 2", "Cert 3", "Cert 4"],
  "dsaTopics": ["Arrays", "Strings", "Dynamic Programming", "Trees", "Graphs", "System Design", "SQL"]
}`

const LINKEDIN_OPTIMIZE_PROMPT = `You are a LinkedIn profile optimization expert. Analyze this LinkedIn profile content and provide detailed scoring and suggestions.

PROFILE CONTENT:
{profileText}

Respond ONLY with valid JSON in this exact format:
{
  "overallScore": [integer 0-100],
  "summary": "[2 sentence overall assessment]",
  "sectionScores": [
    {"section": "Headline", "score": [0-100], "current": "[what they have]", "suggestion": "[specific improvement]"},
    {"section": "About/Summary", "score": [0-100], "current": "[what they have]", "suggestion": "[specific improvement]"},
    {"section": "Experience", "score": [0-100], "current": "[what they have]", "suggestion": "[specific improvement]"},
    {"section": "Skills", "score": [0-100], "current": "[assessment]", "suggestion": "[specific improvement]"},
    {"section": "Keywords & SEO", "score": [0-100], "current": "[assessment]", "suggestion": "[specific improvement]"}
  ],
  "topFixes": ["[fix 1]", "[fix 2]", "[fix 3]", "[fix 4]", "[fix 5]"],
  "keywordsMissing": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"]
}`

// CONVERT MODE
const ENGLISH_TO_RIREKISHO_PROMPT = `You are an expert Japanese resume (履歴書 - Rirekisho) converter.

Convert the following English resume into a proper Japanese Rirekisho format.

IMPORTANT RULES:
- Rirekisho is a standardized Japanese resume format
- Use Japanese era dates (令和) for dates
- All text must be in Japanese
- Include these sections:
  1. 氏名 (Name) - full name
  2. 生年月日 (Date of Birth) - use Japanese era format (令和__)
  3. 住所 (Address) - prefecture and city
  4. 電話番号 (Phone)
  5. メールアドレス (Email)
  6. 学歴 (Education) - most recent first, use era format
  7. 職歴 (Work Experience) - most recent first, include company and position
  8. 保有スキル (Skills) - relevant skills
  9. 資格 (Certifications) - any certifications
  10. 自己PR (Self Introduction) - brief self-introduction

Format requirements:
- Clean, formal Japanese business format
- Use proper spacing (全角 spaces)
- Dates in 令和 format: 令和__年__月
- Be concise and formal

Original resume:
{resumeText}

Output ONLY the converted Rirekisho in Japanese text format. No JSON, no markdown.`

const ENGLISH_TO_JIGISOGESEO_PROMPT = `You are an expert Korean resume (자기소개서 - Jigisogeseo) converter.

Convert the following English resume into a proper Korean Jigisogeseo format.

IMPORTANT RULES:
- Jigisogeseo is a Korean resume/cover letter format
- Include: personal info, education, experience, skills, self-introduction
- Use formal Korean business language
- Include these sections:
  1. 이름 (Name)
  2. 생년월일 (Date of Birth) - Korean format: 년도.월.일
  3. 주소 (Address)
  4. 연락처 (Contact)
  5. 학력 (Education)
  6. 경력 (Work Experience)
  7. 기술 (Skills)
  8. 자격증 (Certifications)
  9. 자기소개 (Self Introduction)

Format requirements:
- Formal Korean business format
- Use Korean age system (만 나이) where appropriate
- Professional and concise

Original resume:
{resumeText}

Output ONLY the converted Jigisogeseo in Korean text format. No JSON, no markdown.`

const RIREKISHO_TO_ENGLISH_PROMPT = `You are an expert at converting Japanese Rirekisho resumes to standard English ATS format.

Extract information from this Japanese Rirekisho and convert to a professional English resume.

Original Rirekisho:
{resumeText}

Convert to English ATS resume with:
- Standard Western name format
- Education in reverse chronological order
- Work experience with clear bullet points
- Quantified achievements
- ATS-optimized keywords
- Professional summary

Output ONLY the English resume text. No JSON, no markdown, no code fences.`

const JIGISOGESEO_TO_ENGLISH_PROMPT = `You are an expert at converting Korean Jigisogeseo resumes to standard English ATS format.

Extract information from this Korean Jigisogeseo and convert to a professional English resume.

Original Jigisogeseo:
{resumeText}

Convert to English ATS resume with:
- Standard Western name format
- Education in reverse chronological order
- Work experience with clear bullet points
- Quantified achievements
- ATS-optimized keywords
- Professional summary

Output ONLY the English resume text. No JSON, no markdown, no code fences.`

// GENERAL MODE
const GENERAL_ASSIST_PROMPT = `You are a career assistant for CraftlyCV. Give concise, structured answers.

Query: {query}

Context: {context}

Rules:
- Be practical, not motivational fluff
- Give step-by-step actions when requested
- Prefer high-income paths
- Bullet points
- No long essays
- No hallucination
- Always structured output`

// ─── Helper: Parse JSON from response ─────────────────────────────────────────

function parseJSONResponse(text: string): any {
  const cleaned = text.replace(/```json\n?|```\n?/g, '').trim()
  const match = cleaned.match(/\{[\s\S]*\}/) || cleaned.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Failed to parse AI response')
  return JSON.parse(match[0])
}

function parseJSONArray(text: string): any[] {
  const cleaned = text.replace(/```json\n?|```\n?/g, '').trim()
  const match = cleaned.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Failed to parse AI response')
  return JSON.parse(match[0])
}

// ─── Mode Handlers ─────────────────────────────────────────────────────────────

async function handleResume(request: AIRequest): Promise<AIResponse> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  // Sub-action detection
  const improvements = request.improvements
  const resumeText = request.resumeText || ''

  if (improvements && improvements.length > 0) {
    // Resume improvement
    const prompt = RESUME_IMPROVE_PROMPT
      .replace('{resumeText}', resumeText)
      .replace('{improvements}', improvements.map((imp, i) => `${i + 1}. ${imp}`).join('\n'))

    let raw = await generateWithTimeout(model, prompt)
    raw = raw.replace(/```[\s\S]*?```/g, '').trim()
    return { success: true, data: { improvedText: raw } }
  }

  if (request.jobDescription) {
    // Resume tailoring
    const prompt = RESUME_TAILOR_PROMPT
      .replace('{resumeText}', resumeText)
      .replace('{jobDescription}', request.jobDescription)

    let raw = await generateWithTimeout(model, prompt)
    raw = raw.replace(/```[\s\S]*?```/g, '').trim()

    const scoreMatch = raw.match(/MATCH_SCORE:\s*(\d+)/)
    const matchScore = scoreMatch ? parseInt(scoreMatch[1]) : 85
    const impSection = raw.match(/IMPROVEMENTS:\n([\s\S]+)$/)
    const improvementList = impSection
      ? impSection[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())
      : []
    const tailoredText = raw.replace(/MATCH_SCORE:[\s\S]*$/, '').trim()

    return {
      success: true,
      data: { tailoredText, matchScore, improvements: improvementList }
    }
  }

  // Resume analysis (ATS scoring)
  const prompt = RESUME_ANALYSIS_PROMPT.replace('{resumeText}', resumeText)
  let raw = await generateWithTimeout(model, prompt)
  raw = raw.replace(/```json|```/g, '').trim()

  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { success: false, error: 'Failed to parse AI response' }

  const parsed = JSON.parse(jsonMatch[0])
  return { success: true, data: parsed }
}

async function handleInterview(request: AIRequest): Promise<AIResponse> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })
  const action = request.interviewAction || 'start'
  const jobTitle = request.jobTitle || 'Software Engineer'

  // Generate interview questions (one-shot)
  if (action === 'start' && request.resumeText && request.jobTitle) {
    const prompt = INTERVIEW_QUESTIONS_GENERATE_PROMPT
      .replace('{resume}', (request.resumeText || '').substring(0, 2000))
      .replace('{jobTitle}', request.jobTitle)
      .replace('{jobDescription}', request.jobDescription || '')

    let raw = await generateWithTimeout(model, prompt)
    raw = raw.replace(/```json|```/g, '').trim()
    const parsed = parseJSONResponse(raw)
    return { success: true, data: { questions: parsed.questions || parsed } }
  }

  // Grade a single answer
  if (action === 'continue' && !request.conversationHistory) {
    const { question, answer } = request.context || {}
    if (!question || !answer) return { success: false, error: 'Missing question or answer' }

    const prompt = INTERVIEW_GRADE_PROMPT
      .replace('{jobTitle}', jobTitle)
      .replace('{question}', question)
      .replace('{answer}', answer)

    let raw = await generateWithTimeout(model, prompt)
    raw = raw.replace(/```json|```/g, '').trim()
    const parsed = parseJSONResponse(raw)
    return { success: true, data: parsed }
  }

  // Multi-turn interview continue
  if (action === 'continue' && request.conversationHistory) {
    const historyText = request.conversationHistory
      .map(m => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n')
    const latestAnswer = request.context?.answer || ''

    const prompt = INTERVIEW_CONTINUE_PROMPT
      .replace('{role}', jobTitle)
      .replace('{history}', historyText)
      .replace('{answer}', latestAnswer)

    let raw = await generateWithTimeout(model, prompt)
    const parsed = parseJSONResponse(raw)

    // Also get STAR feedback
    let starData = null
    try {
      const starRaw = await generateWithTimeout(model, INTERVIEW_STAR_PROMPT.replace('{answer}', latestAnswer))
      starData = parseJSONResponse(starRaw)
    } catch { /* optional */ }

    return { success: true, data: { ...parsed, starFeedback: starData } }
  }

  // Finish interview
  if (action === 'finish' && request.conversationHistory) {
    const historyText = request.conversationHistory
      .map(m => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n')
    const finalAnswer = request.context?.answer || ''

    const prompt = INTERVIEW_FINISH_PROMPT
      .replace('{role}', jobTitle)
      .replace('{history}', historyText)
      .replace('{answer}', finalAnswer)

    let raw = await generateWithTimeout(model, prompt)
    const parsed = parseJSONResponse(raw)

    // Generate overall report
    let reportData = null
    try {
      const reportRaw = await generateWithTimeout(model,
        INTERVIEW_REPORT_PROMPT
          .replace('{history}', historyText)
          .replace('{count}', String(request.context?.questionCount || 5))
      )
      reportData = parseJSONResponse(reportRaw)
    } catch { /* optional */ }

    return { success: true, data: { ...parsed, report: reportData } }
  }

  return { success: false, error: 'Invalid interview action' }
}

async function handleCareer(request: AIRequest): Promise<AIResponse> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  // Job suggestions from resume
  if (request.resumeText && !request.context?.detectedField) {
    const prompt = CAREER_JOBS_PROMPT.replace('{resume}', request.resumeText)
    let raw = await generateWithTimeout(model, prompt)
    raw = raw.replace(/```json|```/g, '').trim()
    const parsed = parseJSONResponse(raw)
    return { success: true, data: parsed }
  }

  // Career roadmap
  if (request.context?.targetGoal) {
    const prompt = CAREER_ROADMAP_PROMPT
      .replace('{detectedField}', request.context.detectedField || 'unknown')
      .replace('{targetGoal}', request.context.targetGoal)
      .replace('{score}', String(request.context.score || 50))

    let raw = await generateWithTimeout(model, prompt)
    raw = raw.replace(/```json|```/g, '').trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { success: false, error: 'Failed to parse roadmap' }
    return { success: true, data: JSON.parse(jsonMatch[0]) }
  }

  // LinkedIn optimization
  if (request.context?.linkedInProfile) {
    const prompt = LINKEDIN_OPTIMIZE_PROMPT.replace('{profileText}', request.context.linkedInProfile)
    let raw = await generateWithTimeout(model, prompt)
    raw = raw.replace(/```json|```/g, '').trim()
    const parsed = parseJSONResponse(raw)
    return { success: true, data: parsed }
  }

  return { success: false, error: 'Invalid career request' }
}

async function handleConvert(request: AIRequest): Promise<AIResponse> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })
  const source = request.sourceLanguage || 'en'
  const target = request.targetLanguage || 'en'
  const resumeText = request.resumeText || ''

  if (source === target) {
    return { success: true, data: { convertedResume: resumeText } }
  }

  let prompt = ''

  if (source === 'en' && target === 'ja') {
    prompt = ENGLISH_TO_RIREKISHO_PROMPT.replace('{resumeText}', resumeText)
  } else if (source === 'en' && target === 'ko') {
    prompt = ENGLISH_TO_JIGISOGESEO_PROMPT.replace('{resumeText}', resumeText)
  } else if (source === 'ja' && target === 'en') {
    prompt = RIREKISHO_TO_ENGLISH_PROMPT.replace('{resumeText}', resumeText)
  } else if (source === 'ko' && target === 'en') {
    prompt = JIGISOGESEO_TO_ENGLISH_PROMPT.replace('{resumeText}', resumeText)
  } else if (source === 'en') {
    prompt = `Convert this English resume to ${target} format. Keep all factual information accurate.

Original Resume:
${resumeText}

Output ONLY the converted resume. No JSON, no markdown.`
  } else if (target === 'en') {
    prompt = `Convert this resume to professional English ATS format. Extract all information and present it in a clear, structured format.

Original Resume:
${resumeText}

Output ONLY the English resume. No JSON, no markdown.`
  } else {
    // Bridge through English
    const bridgePrompt = `Convert this resume to English, preserving all factual information accurately.

Original:
${resumeText}

Output ONLY the English version.`
    const bridgeResult = await generateWithTimeout(model, bridgePrompt)
    const englishVersion = bridgeResult.replace(/```[\s\S]*?```/g, '').trim()

    prompt = `Convert this English resume to ${target} format. Adapt to cultural expectations.

English Resume:
${englishVersion}

Output ONLY the converted resume.`
  }

  let raw = await generateWithTimeout(model, prompt)
  raw = raw.replace(/```[\s\S]*?```/g, '').trim()
  return { success: true, data: { convertedResume: raw } }
}

async function handleGeneral(request: AIRequest): Promise<AIResponse> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const query = request.query || ''
  const context = JSON.stringify(request.context || {})

  const prompt = GENERAL_ASSIST_PROMPT
    .replace('{query}', query)
    .replace('{context}', context)

  let raw = await generateWithTimeout(model, prompt, 5000)
  raw = raw.replace(/```[\s\S]*?```/g, '').trim()
  return { success: true, data: { response: raw } }
}

// ─── Main Router ───────────────────────────────────────────────────────────────

export async function aiRouter(request: AIRequest): Promise<AIResponse> {
  try {
    if (!GEMINI_API_KEY) {
      return { success: false, error: 'GEMINI_API_KEY not configured' }
    }

    switch (request.mode) {
      case 'resume':
        return await handleResume(request)
      case 'interview':
        return await handleInterview(request)
      case 'career':
        return await handleCareer(request)
      case 'convert':
        return await handleConvert(request)
      case 'general':
        return await handleGeneral(request)
      default:
        return { success: false, error: `Unknown mode: ${request.mode}` }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI processing failed'
    }
  }
}

// ─── Specific action helpers (used by routes for scan costing) ─────────────────

export async function buildSummary(data: {
  name?: string
  workExp?: Array<{ role?: string; company?: string }>
  skills?: string[]
  education?: Array<{ institution?: string; degree?: string }>
}): Promise<string> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const prompt = BUILD_SUMMARY_PROMPT
    .replace('{name}', data.name || 'Not specified')
    .replace('{role}', data.workExp?.[0]?.role || 'Not specified')
    .replace('{companies}', data.workExp?.map((w: any) => w.company).join(', ') || 'Not specified')
    .replace('{skills}', data.skills?.join(', ') || 'Not specified')
    .replace('{education}', data.education?.[0]?.degree + ' from ' + data.education?.[0]?.institution || '')

  const result = await generateWithTimeout(model, prompt)
  return result.trim()
}

export async function buildBullets(company: string, role: string, bullets: string[]): Promise<string[]> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const prompt = BUILD_BULLETS_PROMPT
    .replace('{company}', company)
    .replace('{role}', role)
    .replace('{bullets}', bullets.map((b, i) => `${i + 1}. ${b || '(empty)'}`).join('\n'))

  let raw = await generateWithTimeout(model, prompt)
  raw = raw.replace(/```[\s\S]*?```/g, '').trim()
  const match = raw.match(/\[[\s\S]*\]/)
  return match ? JSON.parse(match[0]) : bullets
}

// ─── Health Check ────────────────────────────────────────────────────────────────

export function isAIConfigured(): boolean {
  try {
    getGenAI()
    return true
  } catch {
    return false
  }
}

export function getAIProvider(): string {
  if (ANTHROPIC_API_KEY) return 'anthropic'
  if (GEMINI_API_KEY) return 'gemini'
  return 'none'
}