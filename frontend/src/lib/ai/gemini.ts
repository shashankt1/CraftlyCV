// CraftlyCV AI Service
// Google Gemini + Anthropic integration for Resume, Interview, and Income features

import { GoogleGenerativeAI } from '@google/generative-ai'

// Lazy initialization
let genAIInstance: GoogleGenerativeAI | null = null

// Environment variables (must be set in .env)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'

function getGenAI(): GoogleGenerativeAI {
  if (!genAIInstance) {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured. Please add it to your environment variables.')
    }
    genAIInstance = new GoogleGenerativeAI(GEMINI_API_KEY)
  }
  return genAIInstance
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ATSAnalysisResult {
  score: number
  detectedField: string
  experienceYears: number
  strengthStatement: string
  realWorldContext: string
  summary: string
  projectedScore: number
  scorePercentile: number
  keywordMatches: string[]
  missingKeywords: string[]
  strengths: string[]
  improvements: string[]
  opportunities: Array<{
    icon: string
    title: string
    whatsHappening: string
    theFix: string
    impact: number
    proOnly: boolean
  }>
}

export interface InterviewQuestion {
  question: string
  category: 'technical' | 'behavioral' | 'situational' | 'experience'
  difficulty: 'easy' | 'medium' | 'hard'
  idealAnswer: string
}

export interface TailoredResume {
  tailoredResume: string
  docxBase64: string
  pdfHtmlBase64: string
  matchScore: number
  improvements: string[]
}

export interface IncomePath {
  type: string
  title: string
  subtitle: string
  steps: string[]
  timeline: string
  potential: string
  platforms: string[]
  skills: string[]
}

// ─── System Prompts ───────────────────────────────────────────────────────────

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
      "theFix": "specific fix",
      "impact": [10-15],
      "proOnly": false
    }
  ]
}`

const INTERVIEW_QUESTIONS_PROMPT = `Based on this resume for a {jobTitle} position, generate {count} interview questions.

Resume:
{resumeText}

Generate questions covering:
- Technical skills mentioned
- Behavioral scenarios (STAR method)
- Situational challenges
- Experience verification

Respond in JSON format with a "questions" array:
{
  "questions": [
    {
      "question": "the interview question",
      "category": "technical|behavioral|situational|experience",
      "difficulty": "easy|medium|hard",
      "idealAnswer": "brief ideal response (2-3 sentences)"
    }
  ]
}`

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

const INTERVIEW_FEEDBACK_PROMPT = `You are interviewing for a {jobTitle} role.

Conversation so far:
{history}

Latest answer: "{answer}"

Tasks:
1. Give brief feedback on their answer (2 sentences)
2. Score their answer out of 10
3. Ask the next interview question (deeper or new dimension)

CRITICAL:
- If answer is vague, call it out directly
- Push for specifics and numbers
- Be challenging but fair

Respond ONLY with valid JSON:
{
  "feedback": "[1-2 sentence feedback]",
  "score": [integer 1-10],
  "nextQuestion": "[next interview question]"
}`

const STAR_FEEDBACK_PROMPT = `Analyze this interview answer using the STAR method:

Answer: "{answer}"

Provide STAR breakdown and score:
{
  "situation": "[context]",
  "task": "[their responsibility]",
  "action": "[specific actions]",
  "result": "[quantifiable outcome]",
  "overallStarScore": [0-100],
  "improvement": "[one specific improvement]"
}`

// ─── API Functions ────────────────────────────────────────────────────────────

export async function analyzeResumeATS(resumeText: string): Promise<ATSAnalysisResult> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const prompt = `${RESUME_ANALYSIS_PROMPT}\n\nResume:\n${resumeText}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Strip markdown code fences
    const clean = text.replace(/```json\n?|```\n?/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      score: parsed.score || 50,
      detectedField: parsed.detectedField || 'General',
      experienceYears: parsed.experienceYears || 0,
      strengthStatement: parsed.strengthStatement || '',
      realWorldContext: parsed.realWorldContext || '',
      summary: parsed.summary || '',
      projectedScore: parsed.projectedScore || parsed.score + 20,
      scorePercentile: parsed.scorePercentile || 50,
      keywordMatches: parsed.keywordMatches || [],
      missingKeywords: parsed.missingKeywords || [],
      strengths: parsed.strengths || [],
      improvements: parsed.improvements || [],
      opportunities: parsed.opportunities || [],
    }
  } catch (error) {
    throw new Error(`Resume analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function generateInterviewQuestions(
  resumeText: string,
  jobTitle: string = 'Software Engineer',
  count: number = 10
): Promise<{ questions: InterviewQuestion[] }> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const prompt = INTERVIEW_QUESTIONS_PROMPT
    .replace('{resumeText}', resumeText)
    .replace('{jobTitle}', jobTitle)
    .replace('{count}', String(count))

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const clean = text.replace(/```json\n?|```\n?/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)

    if (!jsonMatch) throw new Error('Failed to parse AI response')

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    throw new Error(`Interview questions generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function tailorResumeToJob(
  resumeText: string,
  jobDescription: string
): Promise<TailoredResume> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const prompt = RESUME_TAILOR_PROMPT
    .replace('{resumeText}', resumeText)
    .replace('{jobDescription}', jobDescription)

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text().replace(/```[\s\S]*?```/g, '').trim()

    // Parse score and improvements
    const scoreMatch = raw.match(/MATCH_SCORE:\s*(\d+)/)
    const matchScore = scoreMatch ? parseInt(scoreMatch[1]) : 85

    const impSection = raw.match(/IMPROVEMENTS:\n([\s\S]+)$/)
    const improvements = impSection
      ? impSection[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())
      : []

    const tailoredText = raw.replace(/MATCH_SCORE:[\s\S]*$/, '').trim()

    return {
      tailoredResume: tailoredText,
      docxBase64: '', // Will be generated by API route
      pdfHtmlBase64: '', // Will be generated by API route
      matchScore,
      improvements,
    }
  } catch (error) {
    throw new Error(`Resume tailoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getInterviewFeedback(
  answer: string,
  history: Array<{ role: string; content: string }>,
  jobTitle: string
): Promise<{
  feedback: string
  score: number
  nextQuestion: string
  starFeedback?: {
    situation: string
    task: string
    action: string
    result: string
    overallStarScore: number
    improvement: string
  }
}> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const historyText = history.map(m =>
    `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`
  ).join('\n')

  const prompt = INTERVIEW_FEEDBACK_PROMPT
    .replace('{jobTitle}', jobTitle)
    .replace('{history}', historyText)
    .replace('{answer}', answer)

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const clean = text.replace(/```json\n?|```\n?/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)

    if (!jsonMatch) throw new Error('Failed to parse AI response')

    const parsed = JSON.parse(jsonMatch[0])

    // Also get STAR feedback
    let starFeedback = undefined
    try {
      const starResult = await model.generateContent(STAR_FEEDBACK_PROMPT.replace('{answer}', answer))
      const starText = starResult.response.text()
      const starClean = starText.replace(/```json\n?|```\n?/g, '').trim()
      const starMatch = starClean.match(/\{[\s\S]*\}/)
      if (starMatch) {
        starFeedback = JSON.parse(starMatch[0])
      }
    } catch {
      // STAR feedback is optional
    }

    return {
      feedback: parsed.feedback || '',
      score: parsed.score || 5,
      nextQuestion: parsed.nextQuestion || '',
      starFeedback,
    }
  } catch (error) {
    throw new Error(`Interview feedback failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function generateCareerRoadmap(
  currentRole: string,
  targetRole: string,
  skills: string[],
  timelineMonths: number = 6
): Promise<{
  roadmap: Array<{ month: number; focus: string; skills: string[]; actions: string[]; milestone: string }>
  resources: Array<{ type: string; name: string; url: string; cost: string }>
}> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const prompt = `Create a career roadmap from ${currentRole} to ${targetRole}.

Skills: ${skills.join(', ')}
Timeline: ${timelineMonths} months

Respond ONLY with valid JSON:
{
  "roadmap": [
    {
      "month": 1,
      "focus": "focus area",
      "skills": ["skill1", "skill2"],
      "actions": ["action1", "action2"],
      "milestone": "what they achieve"
    }
  ],
  "resources": [
    {
      "type": "course|book|project|community",
      "name": "resource name",
      "url": "url or 'search for...'",
      "cost": "free|paid"
    }
  ]
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const clean = text.replace(/```json\n?|```\n?/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)

    if (!jsonMatch) throw new Error('Failed to parse AI response')

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    throw new Error(`Roadmap generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function optimizeLinkedIn(
  headline: string,
  about: string,
  experience: string,
  skills: string[]
): Promise<{
  headline: string
  about: string
  suggestions: string[]
}> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const prompt = `Optimize this LinkedIn profile:

Current headline: ${headline}
Current About: ${about}
Experience: ${experience}
Skills: ${skills.join(', ')}

Respond ONLY with valid JSON:
{
  "headline": "[optimized headline with keywords]",
  "about": "[improved About section]",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const clean = text.replace(/```json\n?|```\n?/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)

    if (!jsonMatch) throw new Error('Failed to parse AI response')

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    throw new Error(`LinkedIn optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function improveBullets(
  role: string,
  company: string,
  bullets: string[]
): Promise<string[]> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const prompt = `Rewrite these job bullets to be ATS-optimized and impact-focused:

Role: ${role}
Company: ${company}

Current bullets:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Rules:
- Start with strong action verbs (Built, Led, Increased, Reduced, Designed, Deployed, Scaled)
- Add realistic metrics (% improved, $ saved, team size, time reduced)
- Keep under 20 words per bullet
- ATS-friendly keywords

Respond ONLY with JSON array of strings:
["improved bullet 1", "improved bullet 2", ...]`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const clean = text.replace(/```json\n?|```\n?/g, '').trim()
    const match = clean.match(/\[[\s\S]*\]/)

    if (!match) throw new Error('Failed to parse AI response')

    return JSON.parse(match[0])
  } catch (error) {
    throw new Error(`Bullet improvement failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getIncomePaths(
  skills: string[],
  experienceYears: number,
  timePerWeek: number,
  country: string = 'india'
): Promise<{
  primaryPath: IncomePath
  alternativePaths: IncomePath[]
}> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const prompt = `Recommend income paths for someone with:
Skills: ${skills.join(', ')}
Experience: ${experienceYears} years
Time available: ${timePerWeek} hours/week
Country: ${country}

Focus on REAL, VERIFIABLE opportunities. Prioritize by speed to first income.

Respond ONLY with valid JSON:
{
  "primaryPath": {
    "type": "freelance|job|gig|content|saas",
    "title": "Specific role/platform",
    "subtitle": "platform1 · platform2",
    "steps": ["step 1", "step 2", "step 3"],
    "timeline": "X days to first income",
    "potential": "conservative to optimistic range",
    "platforms": ["platform1", "platform2"],
    "skills": ["required skill", "nice to have"]
  },
  "alternativePaths": [
    {
      "type": "...",
      "title": "...",
      "subtitle": "...",
      "steps": [...],
      "timeline": "...",
      "potential": "...",
      "platforms": [...],
      "skills": [...]
    }
  ]
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const clean = text.replace(/```json\n?|```\n?/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)

    if (!jsonMatch) throw new Error('Failed to parse AI response')

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    throw new Error(`Income paths generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// ─── Health Check ──────────────────────────────────────────────────────────────

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

// ─── Timeout Wrapper for AI Calls ─────────────────────────────────────────────

export async function generateWithTimeout(
  model: any,
  prompt: string,
  timeoutMs: number = 8000
): Promise<any> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }], signal: controller.signal })
    return result
  } finally {
    clearTimeout(timeout)
  }
}
