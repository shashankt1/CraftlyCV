/**
 * POST /api/ai/analyze
 * JD Match Analysis — free preview (no scan deduction)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'
import { aiRouter } from '@/lib/ai-router'
import { z } from 'zod'
import { AIMatchRequest } from '@/lib/ai-router'

const zAnalyze = z.object({
  masterResumeId: z.string().uuid().optional(),
  resumeData: z.object({
    summary: z.string().optional(),
    experience: z.array(z.object({
      title: z.string(),
      company: z.string(),
      bullets: z.array(z.string()),
    })).optional(),
    skills: z.array(z.string()),
    certifications: z.array(z.string()).optional(),
  }).optional(),
  jobDescription: z.string().min(100, 'Job description must be at least 100 characters'),
  niche: z.enum(['general', 'cybersecurity', 'nursing', 'skilled_trades', 'creative_tech']),
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
    const parsed = zAnalyze.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: parsed.error.errors[0]?.message ?? 'Invalid input',
        details: parsed.error.errors,
      }, { status: 400 })
    }

    const { masterResumeId, resumeData, jobDescription, niche } = parsed.data

    // ─── Rate Limit ──────────────────────────────────────────────────────────
    const rateLimit = await checkRateLimit(user.id, 'ai_analyze', 10, 60)
    if (!rateLimit?.success) {
      return rateLimitExceededResponse(rateLimit?.retryAfter ?? 60)
    }

    // ─── Get Resume Data ─────────────────────────────────────────────────────
    let resume = resumeData

    if (!resume && masterResumeId) {
      const { data: master, error } = await supabase
        .from('master_resumes')
        .select('professional_summary, experience, skills, certifications')
        .eq('id', masterResumeId)
        .eq('user_id', user.id)
        .single()

      if (error || !master) {
        return NextResponse.json({ error: 'NOT_FOUND', message: 'Master resume not found' }, { status: 404 })
      }

      resume = {
        summary: master.professional_summary ?? undefined,
        experience: (master.experience ?? []).map((e: any) => ({
          title: e.title ?? '',
          company: e.company ?? '',
          bullets: e.bullets ?? [],
        })),
        skills: master.skills ?? [],
        certifications: master.certifications ?? [],
      }
    }

    if (!resume) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Provide resumeData or masterResumeId' }, { status: 400 })
    }

    // ─── Call AI ─────────────────────────────────────────────────────────────
    const aiReq: AIMatchRequest = {
      mode: 'match',
      userId: user.id,
      resume: {
        summary: resume.summary,
        experience: resume.experience ?? [],
        skills: resume.skills ?? [],
        certifications: resume.certifications,
      },
      jobDescription,
      niche,
    }

    const result = await aiRouter(aiReq)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.data.error ?? 'AI_ERROR',
        message: result.data.message ?? 'Analysis failed. Please try again.',
      }, { status: 502 })
    }

    return NextResponse.json({ success: true, data: result.data })

  } catch (err) {
    console.error('[/api/ai/analyze]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Analysis failed' }, { status: 500 })
  }
}
