import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'
import { v4 as uuidv4 } from 'uuid'
import { translateToEnglish, translateFromEnglish, translateObject, type LanguageCode } from '@/lib/translation'

interface TailorResult {
  tailored_summary: string
  tailored_experience: Array<{ role: string; company: string; bullets: string[] }>
  tailored_skills: string[]
  added_keywords: Array<{ keyword: string; reason: string }>
  suggested_improvements: Array<{ original: string; improved: string; why: string }>
  ats_score_estimate: number
  version_name: string
}

const NicheContext: Record<string, string> = {
  software: 'Focus on technical skills, programming languages, frameworks, cloud platforms, CI/CD, system design, and project delivery metrics.',
  nursing: 'Focus on clinical skills, patient care protocols, EMR/EHR systems, BLS/ACLS certifications, medication administration, and care coordination.',
  cybersecurity: 'Focus on SIEM, threat detection, penetration testing, SOC operations, incident response, compliance frameworks (HIPAA, SOC2), and security tools.',
  trades: 'Focus on technical certifications, tools proficiency, safety protocols, apprenticeship hours, and specific trade skills (electrical, plumbing, HVAC, welding).',
  fresher: 'Focus on education, projects, internships, skills, and any relevant coursework. Emphasize willingness to learn and adaptability.',
  creative: 'Focus on design portfolio, creative tools (Figma, Adobe CC), UX process, accessibility knowledge, and visual communication skills.',
}

async function tailorWithClaude(
  resumeText: string,
  jobDesc: string,
  company: string,
  role: string,
  niche: string
): Promise<TailorResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const nicheHint = NicheContext[niche] || ''
  const systemPrompt = `You are an expert resume writer and ATS optimization specialist.
Return ONLY a valid JSON object with this exact shape — no markdown, no preamble:
{
  "tailored_summary": string (2-3 sentence professional summary tailored to the role),
  "tailored_experience": [{ "role": string, "company": string, "bullets": string[] (3-5 ATS-optimized bullets per role) }],
  "tailored_skills": string[] (prioritized for ATS — most relevant first),
  "added_keywords": [{ "keyword": string, "reason": string }],
  "suggested_improvements": [{ "original": string, "improved": string, "why": string }],
  "ats_score_estimate": number (0-100, realistic estimate based on keyword matching),
  "version_name": string (e.g. "${company ? company + ' — ' : ''}${role || 'Tailored Version'}")
}
${nicheHint ? `Niche context: ${nicheHint}` : ''}
IMPORTANT: ATS bullets must use action verbs, quantify impact where possible, and include keywords from the job description.`

  const userPrompt = [
    `Source resume:\n${resumeText}`,
    `Job description:\n${jobDesc}`,
    company ? `Target company: ${company}` : '',
    role ? `Target role: ${role}` : '',
    niche ? `Niche pack: ${niche}` : '',
  ].filter(Boolean).join('\n\n')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) throw new Error(`Claude error: ${response.status}`)
  const data = await response.json()
  const raw = data.content?.[0]?.text || '{}'
  try { return JSON.parse(raw.trim()) }
  catch { throw new Error(`Invalid JSON from Claude: ${raw.slice(0, 200)}`) }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const rateLimit = await checkRateLimit(user.id, 'tailor', 10, 60)
    if (!rateLimit?.success) return rateLimitExceededResponse(rateLimit?.retryAfter ?? 60)

    const body = await request.json()
    const { resumeText, jobDesc, company, role, niche, masterResumeId } = body

    if (!resumeText?.trim()) return NextResponse.json({ error: 'Resume required' }, { status: 400 })
    if (!jobDesc?.trim()) return NextResponse.json({ error: 'Job description required' }, { status: 400 })

    // ── LAYER 2: Fetch language prefs and normalize input to English ─────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('scans, plan, input_language, output_language')
      .eq('id', user.id)
      .single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const inputLang: LanguageCode = profile.input_language || 'en'
    const outputLang: LanguageCode = profile.output_language || 'en'

    // Free user scan check
    if (profile.plan === 'free' && profile.scans < 2) {
      return NextResponse.json({ error: 'NO_SCANS', message: 'Not enough scans (requires 2)' }, { status: 402 })
    }

    // LAYER 2: Normalize — translate non-English resume to English
    const normalizedResume = inputLang !== 'en'
      ? await translateToEnglish(resumeText, inputLang)
      : resumeText

    // Normalize job description too (for accurate keyword matching)
    const normalizedJobDesc = inputLang !== 'en'
      ? await translateToEnglish(jobDesc, inputLang)
      : jobDesc

    // Deduct scans for free users
    if (profile.plan === 'free') {
      await supabase.from('profiles').update({ scans: profile.scans - 2 }).eq('id', user.id)
    }

    // ── LAYER 3: All tailoring runs in English ───────────────────────────────
    const result = await tailorWithClaude(normalizedResume, normalizedJobDesc, company || '', role || '', niche || 'software')

    // ── LAYER 5: Translate output back to user's output_language ─────────────
    const translatedResult = outputLang !== 'en'
      ? await translateObject(result, 'en', outputLang, 'tailored resume content') as TailorResult
      : result

    // ── Persist: store English content in DB, return translated to frontend ───
    const admin = await createAdminClient()
    const versionId = uuidv4()
    await admin.from('resume_versions').insert({
      id: versionId,
      user_id: user.id,
      master_resume_id: masterResumeId || null,
      version_name: result.version_name,
      tailored_for_role: role || null,
      tailored_for_company: company || null,
      job_description: normalizedJobDesc,
      tailored_content: result, // always stored in English
      status: 'draft',
      input_language: inputLang,
      output_language: outputLang,
    })

    return NextResponse.json({
      success: true,
      data: { ...translatedResult, versionId },
      scansRemaining: profile.plan === 'free' ? profile.scans - 2 : undefined,
    })
  } catch (err) {
    console.error('[/api/tailor]', err)
    return NextResponse.json({ error: 'TAILOR_FAILED', message: String(err) }, { status: 500 })
  }
}
