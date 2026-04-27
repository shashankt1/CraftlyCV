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
  missing_keywords: string[]
  matched_keywords: string[]
  formatting_risks: string[]
  section_feedback: Array<{ section: string; score: number; feedback: string; suggestions: string[] }>
  proof_gaps: string[]
  overall_summary: string
  top_3_improvements: string[]
  share_id: string
}

const NicheKeywords: Record<string, string[]> = {
  software_engineer: ['TypeScript', 'CI/CD', 'system design', 'REST APIs', 'cloud platforms', 'Docker', 'Kubernetes'],
  data_scientist: ['Python', 'machine learning', 'TensorFlow', 'pandas', 'data visualization', 'SQL', 'statistical modeling'],
  product_manager: ['product strategy', 'roadmap', 'user research', 'OKRs', 'JIRA', 'Agile', 'stakeholder management'],
  cybersecurity_analyst: ['SIEM', 'penetration testing', 'SOC', 'incident response', 'CompTIA Security+', 'firewall', 'threat analysis'],
  nursing: ['patient care', 'EMR', 'BLS/ACLS', 'medication administration', 'care coordination', 'vital signs', 'clinical documentation'],
  devops_engineer: ['Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'AWS', 'Azure', 'monitoring', 'infrastructure as code'],
  'ui/ux_designer': ['Figma', 'user research', 'wireframing', 'prototyping', 'design systems', 'UX metrics', 'accessibility'],
  business_analyst: ['requirements gathering', 'SQL', 'data analysis', 'JIRA', 'process mapping', 'stakeholder management', 'Excel'],
  cloud_architect: ['AWS', 'Azure', 'GCP', 'Terraform', 'Kubernetes', 'microservices', 'security', 'cost optimization'],
  data_analyst: ['SQL', 'Excel', 'Tableau', 'Power BI', 'pandas', 'data cleaning', 'statistical analysis', 'Python'],
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
  const nicheKeywords = NicheKeywords[niche] || []
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const systemPrompt = `You are an ATS (Applicant Tracking System) expert specializing in analyzing resumes for${niche ? ` ${niche.replace(/_/g, ' ')}` : ' general'} roles.

Analyze the resume and return ONLY a valid JSON object with this exact shape — no markdown, no preamble, no commentary:
{
  "ats_score": number (0-100),
  "keyword_score": number (0-100),
  "formatting_score": number (0-100),
  "readability_score": number (0-100),
  "missing_keywords": string[] (ATS-critical keywords from the job description that are absent from the resume),
  "matched_keywords": string[] (keywords from the job description that ARE found in the resume),
  "formatting_risks": string[] (specific formatting issues that cause ATS failure),
  "section_feedback": [{ "section": string, "score": number, "feedback": string, "suggestions": string[] }],
  "proof_gaps": string[] (achievements lacking quantified metrics),
  "overall_summary": string (2-3 sentence assessment of ATS compatibility),
  "top_3_improvements": string[] (the 3 most impactful changes to raise the score),
  "share_id": string (use the provided share_id: "${shareId}")
}

IMPORTANT:
- Return ONLY the JSON object
- missing_keywords should prioritize niche-specific skills: ${nicheKeywords.join(', ') || 'tools and technologies relevant to the role'}
- ATS score: keyword matching (40%), formatting (30%), readability (20%), section completeness (10%)
- formatting_risks must be specific and actionable`

  const userPrompt = jobDesc
    ? `Resume:\n${resumeText}\n\nJob Description:\n${jobDesc}`
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
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) throw new Error(`Claude API error: ${response.status}`)
  const data = await response.json()
  const raw = data.content?.[0]?.text || '{}'
  try { return JSON.parse(raw.trim()) }
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
