import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import { v4 as uuidv4 } from 'uuid'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'
import { translateToEnglish, translateATSResult, type LanguageCode } from '@/lib/translation'

interface ATSAnalysisResult {
  ats_score: number
  keyword_score: number
  formatting_score: number
  readability_score: number
  verdict: string
  missing_keywords: string[]
  matched_keywords: string[]
  hard_issues: Array<{ issue: string; impact: string; fix: string }>
  bullet_rewrites: Array<{ original: string; problem: string; rewrite: string }>
  section_scores: {
    summary: number
    skills: number
    experience: number
    education: number
    projects: number
  }
  formatting_risks: string[]
  achievement_gaps: string[]
  top_3_improvements: string[]
  estimated_pass_rate: string
  recruiter_first_impression: string
  share_id: string
  [key: string]: any
}

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  if (file.name.endsWith('.pdf')) {
    const data = await pdf(buffer)
    return data.text
  } else if (file.name.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }
  throw new Error('Unsupported file type')
}

async function analyzeWithClaude(resumeText: string, jobDesc: string, niche: string, shareId: string): Promise<ATSAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const systemPrompt = `You are a Senior HR Director with 15+ years of experience at Fortune 500 companies. You have reviewed over 50,000 resumes and reject 8 out of 10. You do not sugarcoat. You do not encourage. You score based on hard evidence only.

═══════════════════════════════════════════════════════════════
SCORING RULES — READ CAREFULLY BEFORE SCORING
═══════════════════════════════════════════════════════════════

OVERALL SCORE (0–100):
- 90–100: Exceptional. Ready to send. Rare.
- 75–89: Good but needs work. Some gaps.
- 60–74: Average. Will pass some ATS filters.
- 40–59: Weak. Will fail most ATS filters.
- 0–39: Poor. Do not send this resume anywhere.

HARD DEDUCTIONS (apply strictly, no exceptions):
- Every bullet point without a number/metric: -3 points each
- Generic summary opener ("detail-oriented", "passionate", "hardworking", "results-driven"): -5 points
- Skills mentioned in summary but missing from Skills section: -4 points per skill
- Employment gap > 6 months with no explanation: -8 points
- No GitHub/LinkedIn OR listed as plain text not full URL: -3 points
- Job title inconsistency across sections: -4 points
- Missing any of these sections (Summary, Skills, Experience, Education): -10 points each
- Buzzwords with zero proof ("scalable", "robust", "seamless" with no metrics): -2 points each

SUB-SCORES (each out of 100):
- keyword_score: Match % between resume keywords and job description. Partial = 50%.
- formatting_score: Penalize tables, columns, graphics, headers/footers, text boxes, missing contact info.
- readability_score: Passive voice, jargon without explanation, walls of text, bullets over 2 lines.

═══════════════════════════════════════════════════════════════
TONE — NON-NEGOTIABLE
═══════════════════════════════════════════════════════════════

Speak as a Senior HR Director mildly irritated by the lack of numbers.
WRONG: "Great resume! Just a few small tweaks needed."
RIGHT: "7 of 9 bullets contain zero metrics. In a stack of 200 resumes, this gets skipped in under 10 seconds."

═══════════════════════════════════════════════════════════════
REWRITE CAPABILITY
═══════════════════════════════════════════════════════════════

For every weak bullet, provide:
ORIGINAL: [exact text from resume]
PROBLEM: [one sentence, specific]
REWRITE: [your improved version with placeholder metrics like [X%] or [N units] if real numbers unknown]

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT — RETURN ONLY VALID JSON, NO MARKDOWN, NO PREAMBLE
═══════════════════════════════════════════════════════════════

{
  "ats_score": <integer 0-100>,
  "keyword_score": <integer 0-100>,
  "formatting_score": <integer 0-100>,
  "readability_score": <integer 0-100>,
  "verdict": "<2-3 sentences. Clinical. Direct. State the biggest problem first.>",
  "missing_keywords": ["<keyword>", ...],
  "matched_keywords": ["<keyword>", ...],
  "hard_issues": [
    {
      "issue": "<specific problem>",
      "impact": "<what this costs the candidate>",
      "fix": "<exact action to take>"
    }
  ],
  "bullet_rewrites": [
    {
      "original": "<exact bullet from resume>",
      "problem": "<one sentence>",
      "rewrite": "<improved version>"
    }
  ],
  "section_scores": {
    "summary": <0-100>,
    "skills": <0-100>,
    "experience": <0-100>,
    "education": <0-100>,
    "projects": <0-100>
  },
  "formatting_risks": ["<specific formatting issue>", ...],
  "achievement_gaps": ["<missing proof point>", ...],
  "top_3_improvements": [
    "<most impactful change, specific and actionable>",
    "<second most impactful>",
    "<third most impactful>"
  ],
  "estimated_pass_rate": "<percentage chance this resume passes ATS filter for a mid-level role>",
  "recruiter_first_impression": "<what a recruiter thinks in the first 6 seconds>"
}

Analyze the resume and return ONLY the JSON object above.`

  const userPrompt = jobDesc
    ? `Resume:\n${resumeText}\n\nJob Description:\n${jobDesc}\n\nNiche: ${niche.replace(/_/g, ' ')}`
    : `Resume:\n${resumeText}\n\n(No job description provided — score based on general ATS best practices.)`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) throw new Error(`Claude API error: ${response.status}`)
  const data = await response.json()
  const raw = data.content?.[0]?.text || '{}'
  // Strip markdown fences Claude sometimes wraps around JSON despite instructions
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  try { return JSON.parse(cleaned) }
  catch { throw new Error(`Claude returned invalid JSON: ${raw.slice(0, 200)}`) }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const rateLimit = await checkRateLimit(user.id, 'analyze', 10, 60)
    if (!rateLimit?.success) return rateLimitExceededResponse(rateLimit?.retryAfter ?? 60)

    const formData = await request.formData()
    const resumeFile = formData.get('resume') as File | null
    const resumeText = formData.get('resumeText') as string | null
    const jobDesc = formData.get('jobDesc') as string | null
    const niche = formData.get('niche') as string || 'general'

    if (!resumeFile && !resumeText) return NextResponse.json({ error: 'Resume required' }, { status: 400 })

    // ── LAYER 1: Capture original text ──────────────────────────────────────
    const originalText = resumeFile ? await extractText(resumeFile) : resumeText!

    // ── LAYER 2: Fetch user language preferences & normalize to English ──────
    const { data: profile } = await supabase
      .from('profiles')
      .select('input_language, output_language')
      .eq('id', user.id)
      .single()

    const inputLang: LanguageCode = profile?.input_language || 'en'
    const outputLang: LanguageCode = profile?.output_language || 'en'

    const normalizedText = inputLang !== 'en'
      ? await translateToEnglish(originalText, inputLang)
      : originalText

    const shareId = uuidv4()

    // ── LAYER 3: All AI analysis runs in English ─────────────────────────────
    const result = await analyzeWithClaude(normalizedText, jobDesc || '', niche, shareId)
    result.share_id = shareId

    // ── LAYER 5: Translate output back to user's output_language ───────────
    const translatedResult = outputLang !== 'en'
      ? await translateATSResult(result, outputLang)
      : result

    // ── Persist: store both original (user's language) and normalized (English) ─
    const admin = await createAdminClient()
    await admin.from('resume_analyses').insert({
      user_id: user.id,
      share_id: shareId,
      resume_text: originalText.slice(0, 10000),
      normalized_text: normalizedText !== originalText ? normalizedText.slice(0, 10000) : null,
      result: result, // always stored in English
      input_language: inputLang,
      output_language: outputLang,
    })

    return NextResponse.json({ success: true, data: translatedResult })
  } catch (err) {
    console.error('[/api/analyze]', err)
    return NextResponse.json({ error: 'ANALYSIS_FAILED', message: String(err) }, { status: 500 })
  }
}