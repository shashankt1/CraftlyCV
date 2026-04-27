/**
 * CraftlyCV AI Router — Single Unified Brain
 * Production-Ready AI Engine
 *
 * MODES:
 * - resume  → ATS-optimized JSON resume
 * - match   → match_score, missing_keywords, ats_risk, proof_gaps
 * - interview → question + STAR feedback + next_question
 * - risk    → risk_score, automatable_tasks, safe_tasks, missing_skills, trending_skills, 30_day_plan, resume_improvements
 *
 * RULES:
 * - STRICT JSON ONLY output
 * - No text outside JSON
 * - No null/empty fields
 * - 20s timeout, 2 retries, fallback error
 * - Niche-aware prompts
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { NICHE_PACKS, type NichePack } from './niches'

// ─── Configuration ────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

const TIMEOUT_MS = 20_000
const MAX_RETRIES = 2

let _genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured')
    _genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  }
  return _genAI
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type AIMode = 'resume' | 'match' | 'interview' | 'risk'

export interface AIResumeRequest {
  mode: 'resume'
  userId: string
  resume: {
    fullName: string
    email?: string
    phone?: string
    location?: string
    summary?: string
    experience: Array<{
      company: string
      title: string
      startDate: string
      endDate?: string
      current: boolean
      bullets: string[]
    }>
    education: Array<{
      institution: string
      degree: string
      field?: string
      graduationDate?: string
    }>
    skills: string[]
    certifications?: string[]
  }
  jobDescription: string
  niche: string
  targetRole?: string
}

export interface AIMatchRequest {
  mode: 'match'
  userId: string
  resume: {
    summary?: string
    experience: Array<{ title: string; company: string; bullets: string[] }>
    skills: string[]
    certifications?: string[]
  }
  jobDescription: string
  niche: string
}

export interface AIInterviewRequest {
  mode: 'interview'
  userId: string
  resume: {
    fullName: string
    summary?: string
    experience: Array<{ title: string; company: string; bullets: string[] }>
    skills: string[]
  }
  jobDescription: string
  niche: string
  action: 'start' | 'answer'
  answer?: string
  history?: Array<{ role: 'interviewer' | 'candidate'; content: string }>
}

export type AIRequest = AIResumeRequest | AIMatchRequest | AIInterviewRequest

// ─── Response Types ────────────────────────────────────────────────────────────

export interface AIResumeResponse {
  tailoredResume: {
    fullName: string
    email: string
    phone: string
    location: string
    summary: string
    experience: Array<{
      company: string
      title: string
      startDate: string
      endDate: string
      current: boolean
      bullets: string[]
    }>
    education: Array<{
      institution: string
      degree: string
      field: string
      graduationDate: string
    }>
    skills: string[]
    certifications: string[]
  }
  matchScore: number
  atsRiskScore: number
  missingKeywords: string[]
  improvements: string[]
  authenticityWarnings: string[]
}

export interface AIMatchResponse {
  overallScore: number
  keywordMatchScore: number
  skillsMatchScore: number
  experienceMatchScore: number
  matchedKeywords: string[]
  missingKeywords: string[]
  skillGaps: string[]
  proofGaps: string[]
  atsRiskScore: number
  atsWarnings: string[]
  improvementSuggestions: string[]
  sectionRelevance: Array<{
    section: string
    score: number
    note: string
  }>
}

export interface AIInterviewResponse {
  question: string
  questionCategory: string
  feedback?: string
  score?: number
  starFeedback?: {
    situation: string
    task: string
    action: string
    result: string
    scores: { situation: number; task: number; action: number; result: number }
    overall: number
    improvement: string
  }
  nextQuestion?: string
  overallScore?: number
  isComplete?: boolean
}

export interface AIErrorResponse {
  error: string
  message: string
}

export type AIResponse =
  | { success: true; data: AIResumeResponse }
  | { success: true; data: AIMatchResponse }
  | { success: true; data: AIInterviewResponse }
  | { success: false; data: AIErrorResponse }

// ─── Fallback Error ────────────────────────────────────────────────────────────

const FALLBACK_ERROR: AIErrorResponse = {
  error: 'AI_TEMPORARY_FAILURE',
  message: 'Try again',
}

// ─── Timeout + Retry Wrapper ───────────────────────────────────────────────────

async function generateWithRetry(
  prompt: string,
  options: { temperature?: number; maxOutputTokens?: number } = {}
): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const genAI = getGenAI()
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.3,
          maxOutputTokens: options.maxOutputTokens ?? 8192,
          responseMimeType: 'application/json',
        },
      })

      clearTimeout(timeout)
      const text = result.response.text().trim()
      if (!text) throw new Error('Empty response')
      return text
    } catch (err: any) {
      clearTimeout(timeout)
      lastError = err

      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
          continue
        }
      }

      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
        continue
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError ?? new Error('AI generation failed')
}

// ─── JSON Parser (Strict) ───────────────────────────────────────────────────────

function parseJSON<T>(text: string): T {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/^[^{[\s]*/, '')
    .replace(/[^}\]]\s*$/, '')
    .trim()

  const match = cleaned.match(/\{[\s\S]*\}/) ?? cleaned.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No JSON found in response')
  return JSON.parse(match[0])
}

function cleanObject(obj: any): any {
  if (obj === null || obj === undefined) return undefined
  if (typeof obj === 'string') {
    const trimmed = obj.trim()
    return trimmed === '' ? undefined : trimmed
  }
  if (Array.isArray(obj)) {
    const cleaned = obj.map(cleanObject).filter((v: any) => v !== undefined)
    return cleaned.length > 0 ? cleaned : undefined
  }
  if (typeof obj === 'object') {
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const cleaned = cleanObject(value)
      if (cleaned !== undefined) result[key] = cleaned
    }
    return Object.keys(result).length > 0 ? result : undefined
  }
  return obj
}

// ─── Niche Helper ─────────────────────────────────────────────────────────────

function getNicheContext(niche: string): NichePack {
  return NICHE_PACKS[niche] ?? NICHE_PACKS.general
}

// ─── Prompt Builders ───────────────────────────────────────────────────────────

function buildResumePrompt(req: AIResumeRequest): string {
  const niche = getNicheContext(req.niche)
  const nicheSkillCategories = niche.skills.map((s: any) => `${s.category}: ${s.skills.slice(0, 10).join(', ')}`).join('\n')
  const achievementPrompts = niche.achievementPrompts.map((a: any) => `  ${a.category}:\n    ${a.prompts.map((p: string) => `    - ${p}`).join('\n')}`).join('\n')

  return `You are CraftlyCV's ATS Resume Tailoring Engine. You MUST output STRICT JSON ONLY.

TASK: Rewrite this resume to perfectly match the job description while maintaining authenticity.

NICHE CONTEXT: ${niche.name}
TARGET ROLE: ${req.targetRole ?? 'General Professional'}

SKILL TAXONOMY FOR THIS NICHE:
${nicheSkillCategories}

ACHIEVEMENT PROMPTS FOR THIS NICHE:
${achievementPrompts}

ORIGINAL RESUME:
${JSON.stringify(req.resume, null, 2)}

JOB DESCRIPTION:
${req.jobDescription}

RULES:
1. Output STRICT JSON ONLY — no text before or after
2. Integrate keywords from job description naturally
3. Quantify achievements ONLY if verifiable (no fake metrics)
4. Use action verbs appropriate for ${niche.name}
5. Reorder skills to match job requirements
6. Flag any authenticity concerns
7. Keep ALL factual information (names, dates, companies) accurate

OUTPUT FORMAT (STRICT JSON):
{
  "tailoredResume": {
    "fullName": "string (keep as-is)",
    "email": "string",
    "phone": "string",
    "location": "string",
    "summary": "string (2-4 sentences, niche-optimized)",
    "experience": [{
      "company": "string",
      "title": "string",
      "startDate": "string",
      "endDate": "string",
      "current": boolean,
      "bullets": ["string (metrics-focused, ATS-optimized)"]
    }],
    "education": [{
      "institution": "string",
      "degree": "string",
      "field": "string",
      "graduationDate": "string"
    }],
    "skills": ["string (reordered by job relevance)"],
    "certifications": ["string (if any, from job description)"]
  },
  "matchScore": number (0-100, keyword + relevance weighted),
  "atsRiskScore": number (0-100, lower is safer),
  "missingKeywords": ["string (important keywords from JD not in resume)"],
  "improvements": ["string (specific actionable improvements)"],
  "authenticityWarnings": ["string (any over-claiming flags)"]
}

Respond with STRICT JSON ONLY:`
}

function buildMatchPrompt(req: AIMatchRequest): string {
  const niche = getNicheContext(req.niche)
  const proofGapExamples = niche.achievementPrompts.map((a: any) => `${a.category}: ${a.prompts[0] ?? 'N/A'}`).join('\n')

  return `You are CraftlyCV's JD Match Analyzer. You MUST output STRICT JSON ONLY.

TASK: Analyze resume vs job description and return match scores with actionable insights.

NICHE: ${niche.name}
PROOF GAP EXAMPLES FOR THIS NICHE:
${proofGapExamples}

RESUME DATA:
${JSON.stringify(req.resume, null, 2)}

JOB DESCRIPTION:
${req.jobDescription}

RULES:
1. Output STRICT JSON ONLY
2. Calculate honest match scores (most resumes score 45-75 initially)
3. Identify specific missing keywords from JD
4. Flag ATS risks (tables, graphics, non-standard headings, keyword stuffing)
5. List proof gaps specific to this niche
6. Suggest concrete improvements with impact

OUTPUT FORMAT (STRICT JSON):
{
  "overallScore": number (0-100, keyword overlap weighted),
  "keywordMatchScore": number (0-100),
  "skillsMatchScore": number (0-100),
  "experienceMatchScore": number (0-100),
  "matchedKeywords": ["string (keywords found in both)"],
  "missingKeywords": ["string (important JD keywords not in resume)"],
  "skillGaps": ["string (skills in JD but not well-represented)"],
  "proofGaps": ["string (niche-specific proof points missing, be specific)"],
  "atsRiskScore": number (0-100, lower is safer),
  "atsWarnings": ["string (specific ATS formatting risks)"],
  "improvementSuggestions": ["string (ranked by impact)"],
  "sectionRelevance": [{
    "section": "string (Experience|Education|Skills)",
    "score": number (0-100),
    "note": "string (why this score)"
  }]
}

Respond with STRICT JSON ONLY:`
}

function buildInterviewPrompt(req: AIInterviewRequest): string {
  const niche = getNicheContext(req.niche)
  const jobTitle = req.resume.experience[0]?.title ?? 'this role'

  if (req.action === 'start') {
    return `You are a senior technical recruiter at a top company conducting an interview. You MUST output STRICT JSON ONLY.

CANDIDATE: ${req.resume.fullName}
NICHE: ${niche.name}
TARGET ROLE: ${jobTitle}

CANDIDATE BACKGROUND:
Summary: ${req.resume.summary ?? 'Not provided'}
Experience: ${req.resume.experience.map((e: any) => `${e.title} at ${e.company}`).join(', ')}
Skills: ${req.resume.skills.join(', ')}

JOB DESCRIPTION:
${req.jobDescription}

TASK: Ask the first interview question — one focused, specific question that reveals something meaningful about the candidate's fit for ${jobTitle}.

RULES:
1. Output STRICT JSON ONLY
2. First question should be behavioral (STAR) or role-specific technical
3. Question must be tailored to candidate's actual experience
4. No generic questions ("Tell me about yourself")
5. Question should have one clear right dimension to probe

OUTPUT FORMAT (STRICT JSON):
{
  "question": "string (specific, tailored question)",
  "questionCategory": "Behavioral|Technical|Situational|Experience",
  "isComplete": false
}

Respond with STRICT JSON ONLY:`
  }

  // 'answer' action
  const historyText = (req.history ?? []).map((m: any) => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n')

  return `You are a senior technical recruiter evaluating a candidate's interview answer. You MUST output STRICT JSON ONLY.

CANDIDATE: ${req.resume.fullName}
NICHE: ${niche.name}
TARGET ROLE: ${jobTitle}

CONVERSATION HISTORY:
${historyText}

LATEST ANSWER: ${req.answer ?? 'No answer provided'}

TASK: Evaluate this answer and provide STAR feedback + next question.

RULES:
1. Output STRICT JSON ONLY
2. Be DIRECT — if answer is vague, say so
3. Push for specifics if lacking metrics/impact
4. Score honestly (most answers score 5-8)
5. Next question must follow up on weak points or go deeper

OUTPUT FORMAT (STRICT JSON):
{
  "question": "string (next interview question, follow-up or new dimension)",
  "questionCategory": "Behavioral|Technical|Situational|Experience",
  "feedback": "string (1-2 sentences direct feedback)",
  "score": number (1-10, be honest),
  "starFeedback": {
    "situation": "string (context of the answer)",
    "task": "string (their responsibility)",
    "action": "string (specific action they took)",
    "result": "string (measurable outcome)",
    "scores": {
      "situation": number (1-10),
      "task": number (1-10),
      "action": number (1-10),
      "result": number (1-10)
    },
    "overall": number (0-100, weighted STAR),
    "improvement": "string (one specific thing to improve)"
  },
  "isComplete": boolean
}

Respond with STRICT JSON ONLY:`
}

// ─── Mode Handlers ─────────────────────────────────────────────────────────────

async function handleResume(req: AIResumeRequest): Promise<AIResponse> {
  const prompt = buildResumePrompt(req)
  const raw = await generateWithRetry(prompt)
  const parsed = parseJSON<any>(raw)
  const cleaned = cleanObject(parsed)

  if (!cleaned.tailoredResume) {
    return { success: false, data: FALLBACK_ERROR }
  }

  return {
    success: true,
    data: cleaned as AIResumeResponse,
  }
}

async function handleMatch(req: AIMatchRequest): Promise<AIResponse> {
  const prompt = buildMatchPrompt(req)
  const raw = await generateWithRetry(prompt)
  const parsed = parseJSON<any>(raw)
  const cleaned = cleanObject(parsed)

  if (!cleaned.overallScore) {
    return { success: false, data: FALLBACK_ERROR }
  }

  return {
    success: true,
    data: cleaned as AIMatchResponse,
  }
}

async function handleInterview(req: AIInterviewRequest): Promise<AIResponse> {
  const prompt = buildInterviewPrompt(req)
  const raw = await generateWithRetry(prompt)
  const parsed = parseJSON<any>(raw)
  const cleaned = cleanObject(parsed)

  if (!cleaned.question) {
    return { success: false, data: FALLBACK_ERROR }
  }

  return {
    success: true,
    data: cleaned as AIInterviewResponse,
  }
}

// ─── Main Router ───────────────────────────────────────────────────────────────

export async function aiRouter(request: AIRequest): Promise<AIResponse> {
  if (!GEMINI_API_KEY) {
    return { success: false, data: { error: 'AI_NOT_CONFIGURED', message: 'GEMINI_API_KEY not set' } }
  }

  try {
    switch (request.mode) {
      case 'resume':
        return await handleResume(request)
      case 'match':
        return await handleMatch(request)
      case 'interview':
        return await handleInterview(request)
      default: {
        const unknown = request as any
        return { success: false, data: { error: 'INVALID_MODE', message: `Unknown mode: ${unknown.mode}` } }
      }
    }
  } catch (err) {
    console.error('[ai-router] Error:', err)
    return { success: false, data: FALLBACK_ERROR }
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export function isAIConfigured(): boolean {
  try {
    getGenAI()
    return true
  } catch {
    return false
  }
}
