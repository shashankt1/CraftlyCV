import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { translateFromEnglish, translateToEnglish, type LanguageCode } from '@/lib/translation'

/**
 * Export pipeline — Layer 6 of the Language-Transparent ATS Optimization Engine
 *
 * resume_output_language values:
 *   'en'       → English PDF only
 *   'native'   → User's native language PDF only
 *   'both'     → Two PDFs: English + native language
 *
 * Body: { resumeVersionId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { resumeVersionId, outputLanguage } = await request.json()
    if (!resumeVersionId) return NextResponse.json({ error: 'Version ID required' }, { status: 400 })

    const admin = await createAdminClient()
    const { data: version } = await admin
      .from('resume_versions')
      .select('*, profiles!inner(input_language, resume_output_language)')
      .eq('id', resumeVersionId)
      .eq('user_id', user.id)
      .single()

    if (!version) return NextResponse.json({ error: 'Version not found' }, { status: 404 })

    const resumeOutputLang = (outputLanguage || version.resume_output_language || 'en') as string
    const userNativeLang = (version.input_language || 'en') as LanguageCode

    const tailored = version.tailored_content as any
    if (!tailored) return NextResponse.json({ error: 'No content to export' }, { status: 400 })

    interface PDFPayload {
      version_name: string
      summary: string
      experience: Array<{ role: string; company: string; bullets: string[] }>
      skills: string[]
      language: string
    }

    // ── Build base payload in English ───────────────────────────────────────────
    const enPayload: PDFPayload = {
      version_name: version.version_name || 'Tailored Resume',
      summary: tailored.tailored_summary || '',
      experience: (tailored.tailored_experience || []).map((e: any) => ({
        role: e.role || '',
        company: e.company || '',
        bullets: e.bullets || [],
      })),
      skills: tailored.tailored_skills || [],
      language: 'en',
    }

    const results: Record<string, PDFPayload> = { en: enPayload }

    // ── 'both' generates two PDFs, 'native' generates one in user's language ─
    if (resumeOutputLang === 'both' || resumeOutputLang === 'native') {
      // Layer 5: translate from English to user's native language
      results.native = {
        ...enPayload,
        language: userNativeLang,
        summary: await translateFromEnglish(enPayload.summary, userNativeLang, 'resume summary'),
        experience: await Promise.all(enPayload.experience.map(async (exp) => ({
          role: exp.role,
          company: exp.company,
          bullets: await Promise.all(exp.bullets.map((b: string) => translateFromEnglish(b, userNativeLang, 'resume bullet point'))),
        }))),
        skills: await Promise.all(enPayload.skills.map((s: string) => translateFromEnglish(s, userNativeLang, 'resume skill'))),
      }
    }

    // Return payload(s) for client-side PDF generation
    // (in a full implementation, server-side PDF generation via puppeteer would go here)
    return NextResponse.json({
      success: true,
      data: {
        payloads: results,
        export_language: resumeOutputLang,
        version_id: resumeVersionId,
        version_name: version.version_name,
      },
    })
  } catch (err) {
    console.error('[/api/export]', err)
    return NextResponse.json({ error: 'EXPORT_FAILED', message: String(err) }, { status: 500 })
  }
}
