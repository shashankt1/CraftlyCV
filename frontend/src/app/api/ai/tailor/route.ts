/**
 * POST /api/ai/tailor
 * Resume Tailoring — deducts 1 scan
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'
import { aiRouter } from '@/lib/ai-router'
import { z } from 'zod'
import { AIResumeRequest } from '@/lib/ai-router'

const zTailor = z.object({
  masterResumeId: z.string().uuid(),
  jobDescription: z.string().min(100),
  niche: z.enum(['general', 'cybersecurity', 'nursing', 'skilled_trades', 'creative_tech']),
  targetRole: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // ─── Auth ────────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Login required' }, { status: 401 })
    }

    // ─── Parse & Validate ────────────────────────────────────────────────────
    const body = await request.json()
    const parsed = zTailor.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: parsed.error.errors[0]?.message ?? 'Invalid input',
      }, { status: 400 })
    }

    const { masterResumeId, jobDescription, niche, targetRole } = parsed.data

    // ─── Rate Limit ──────────────────────────────────────────────────────────
    const rateLimit = await checkRateLimit(user.id, 'ai_tailor', 10, 60)
    if (!rateLimit?.success) {
      return rateLimitExceededResponse(rateLimit?.retryAfter ?? 60)
    }

    const admin = await createAdminClient()

    // ─── Atomic Scan Deduct ──────────────────────────────────────────────────
    const { data: deductResult, error: deductError } = await admin
      .rpc('deduct_scan', { p_user_id: user.id, p_amount: 1 })

    if (deductError) {
      return NextResponse.json({ error: 'DB_ERROR', message: 'Database error' }, { status: 500 })
    }

    const parsedResult = typeof deductResult === 'string' ? JSON.parse(deductResult) : deductResult
    if (!parsedResult?.success) {
      return NextResponse.json({
        error: parsedResult?.code ?? 'INSUFFICIENT_SCANS',
        message: parsedResult?.error ?? 'Not enough scans',
        currentScans: parsedResult?.current_scans ?? 0,
      }, { status: 402 })
    }

    // ─── Fetch Master Resume ──────────────────────────────────────────────────
    const { data: master, error: masterError } = await supabase
      .from('master_resumes')
      .select('*')
      .eq('id', masterResumeId)
      .eq('user_id', user.id)
      .single()

    if (masterError || !master) {
      // Refund scan
      await admin.rpc('add_scans', { p_user_id: user.id, p_amount: 1, p_action: 'refund' })
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Master resume not found' }, { status: 404 })
    }

    // ─── Call AI ─────────────────────────────────────────────────────────────
    const resume: AIResumeRequest['resume'] = {
      fullName: master.full_name ?? '',
      email: master.email ?? undefined,
      phone: master.phone ?? undefined,
      location: master.location ?? undefined,
      summary: master.professional_summary ?? undefined,
      experience: (master.experience ?? []).map((e: any) => ({
        company: e.company ?? '',
        title: e.title ?? '',
        startDate: e.startDate ?? e.start_date ?? '',
        endDate: e.endDate ?? e.end_date,
        current: e.current ?? false,
        bullets: e.bullets ?? [],
      })),
      education: (master.education ?? []).map((e: any) => ({
        institution: e.institution ?? '',
        degree: e.degree ?? '',
        field: e.field ?? undefined,
        graduationDate: e.graduationDate ?? e.graduation_date ?? undefined,
      })),
      skills: master.skills ?? [],
      certifications: master.certifications ?? undefined,
    }

    const aiReq: AIResumeRequest = {
      mode: 'resume',
      userId: user.id,
      resume,
      jobDescription,
      niche,
      targetRole,
    }

    const result = await aiRouter(aiReq)

    if (!result.success) {
      // Refund scan on AI failure
      await admin.rpc('add_scans', { p_user_id: user.id, p_amount: 1, p_action: 'ai_failure_refund' })
      return NextResponse.json({
        error: result.data.error ?? 'AI_ERROR',
        message: result.data.message ?? 'Tailoring failed',
      }, { status: 502 })
    }

    return NextResponse.json({ success: true, data: result.data })

  } catch (err) {
    console.error('[/api/ai/tailor]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Tailoring failed' }, { status: 500 })
  }
}
