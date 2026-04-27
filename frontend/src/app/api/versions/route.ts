/**
 * POST /api/versions
 * Create a tailored version
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const zVersion = z.object({
  masterResumeId: z.string().uuid(),
  name: z.string().min(1).max(100),
  targetJobTitle: z.string().optional(),
  targetCompany: z.string().optional(),
  targetJobDescription: z.string().optional(),
  tailoredSummary: z.string().optional(),
  tailoredExperience: z.any().optional(),
  tailoredSkills: z.any().optional(),
  tailoredEducation: z.any().optional(),
  matchScore: z.number().min(0).max(100).optional(),
  atsRiskScore: z.number().min(0).max(100).optional(),
  missingKeywords: z.array(z.string()).optional(),
  matchedKeywords: z.array(z.string()).optional(),
  status: z.enum(['draft', 'ready', 'applied']).default('draft'),
  exportMode: z.enum(['ats_safe', 'creative_premium']).default('ats_safe'),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Login required' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = zVersion.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: parsed.error.errors[0]?.message ?? 'Invalid input',
      }, { status: 400 })
    }

    const data = parsed.data

    // Verify master resume belongs to user
    const { data: master, error: masterError } = await supabase
      .from('master_resumes')
      .select('id')
      .eq('id', data.masterResumeId)
      .eq('user_id', user.id)
      .single()

    if (masterError || !master) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Master resume not found' }, { status: 404 })
    }

    const { data: version, error: insertError } = await supabase
      .from('tailored_versions')
      .insert({
        user_id: user.id,
        master_resume_id: data.masterResumeId,
        name: data.name,
        target_job_title: data.targetJobTitle,
        target_company: data.targetCompany,
        target_job_description: data.targetJobDescription,
        tailored_summary: data.tailoredSummary,
        tailored_experience: data.tailoredExperience ?? [],
        tailored_skills: data.tailoredSkills ?? [],
        tailored_education: data.tailoredEducation ?? [],
        match_score: data.matchScore,
        ats_risk_score: data.atsRiskScore,
        missing_keywords: data.missingKeywords ?? [],
        matched_keywords: data.matchedKeywords ?? [],
        status: data.status,
        export_mode: data.exportMode,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[/api/versions]', insertError)
      return NextResponse.json({ error: 'DB_ERROR', message: 'Failed to create version' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: version.id,
        name: version.name,
        targetJobTitle: version.target_job_title,
        targetCompany: version.target_company,
        targetJobDescription: version.target_job_description,
        matchScore: version.match_score,
        atsRiskScore: version.ats_risk_score,
        status: version.status,
        createdAt: version.created_at,
      },
    })

  } catch (err) {
    console.error('[/api/versions]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Failed to create version' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Login required' }, { status: 401 })
    }

    const { data: versions, error } = await supabase
      .from('tailored_versions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'DB_ERROR', message: 'Failed to fetch versions' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: versions?.map((v: any) => ({
        id: v.id,
        name: v.name,
        masterResumeId: v.master_resume_id,
        targetJobTitle: v.target_job_title,
        targetCompany: v.target_company,
        targetJobDescription: v.target_job_description,
        matchScore: v.match_score,
        atsRiskScore: v.ats_risk_score,
        status: v.status,
        exportMode: v.export_mode,
        exportedCount: v.exported_count,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      })),
    })

  } catch (err) {
    console.error('[/api/versions GET]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch versions' }, { status: 500 })
  }
}

// ─── PUT ───────────────────────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Login required' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, tailoredSummary, tailoredExperience, tailoredSkills, tailoredEducation, matchScore, atsRiskScore, missingKeywords, matchedKeywords, status } = body

    if (!id) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Version ID required' }, { status: 400 })
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('tailored_versions')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Version not found' }, { status: 404 })
    }

    const updates: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (tailoredSummary !== undefined) updates.tailored_summary = tailoredSummary
    if (tailoredExperience !== undefined) updates.tailored_experience = tailoredExperience
    if (tailoredSkills !== undefined) updates.tailored_skills = tailoredSkills
    if (tailoredEducation !== undefined) updates.tailored_education = tailoredEducation
    if (matchScore !== undefined) updates.match_score = matchScore
    if (atsRiskScore !== undefined) updates.ats_risk_score = atsRiskScore
    if (missingKeywords !== undefined) updates.missing_keywords = missingKeywords
    if (matchedKeywords !== undefined) updates.matched_keywords = matchedKeywords
    if (status !== undefined) updates.status = status

    const { data: version, error } = await supabase
      .from('tailored_versions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[/api/versions PUT]', error)
      return NextResponse.json({ error: 'DB_ERROR', message: 'Failed to update version' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: version.id,
        name: version.name,
        matchScore: version.match_score,
        status: version.status,
        updatedAt: version.updated_at,
      },
    })

  } catch (err) {
    console.error('[/api/versions PUT]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Failed to update version' }, { status: 500 })
  }
}
