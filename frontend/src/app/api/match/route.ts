/**
 * POST /api/match/save
 * Save a match report
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const zMatchReport = z.object({
  masterResumeId: z.string().uuid().optional(),
  tailoredVersionId: z.string().uuid().optional(),
  overallScore: z.number().min(0).max(100),
  keywordMatchScore: z.number().min(0).max(100).optional(),
  skillsMatchScore: z.number().min(0).max(100).optional(),
  experienceMatchScore: z.number().min(0).max(100).optional(),
  matchedKeywords: z.array(z.string()).optional(),
  missingKeywords: z.array(z.string()).optional(),
  skillGaps: z.array(z.string()).optional(),
  proofGaps: z.array(z.string()).optional(),
  atsRiskScore: z.number().min(0).max(100).optional(),
  atsWarnings: z.array(z.string()).optional(),
  improvementSuggestions: z.array(z.string()).optional(),
  sectionRelevance: z.array(z.object({
    section: z.string(),
    score: z.number(),
    note: z.string(),
  })).optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  jobDescription: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Login required' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = zMatchReport.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: parsed.error.errors[0]?.message ?? 'Invalid input',
      }, { status: 400 })
    }

    const data = parsed.data

    const { data: report, error } = await supabase
      .from('match_reports')
      .insert({
        user_id: user.id,
        master_resume_id: data.masterResumeId,
        tailored_version_id: data.tailoredVersionId,
        overall_match_score: data.overallScore,
        keyword_match_score: data.keywordMatchScore,
        skills_match_score: data.skillsMatchScore,
        experience_match_score: data.experienceMatchScore,
        matched_keywords: data.matchedKeywords ?? [],
        missing_keywords: data.missingKeywords ?? [],
        skill_gaps: data.skillGaps ?? [],
        proof_gaps: data.proofGaps ?? [],
        ats_risk_score: data.atsRiskScore,
        ats_warnings: data.atsWarnings ?? [],
        improvement_suggestions: data.improvementSuggestions ?? [],
        section_relevance: data.sectionRelevance ?? [],
        job_title: data.jobTitle,
        company_name: data.companyName,
        job_description: data.jobDescription,
      })
      .select()
      .single()

    if (error) {
      console.error('[/api/match]', error)
      return NextResponse.json({ error: 'DB_ERROR', message: 'Failed to save report' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: report.id,
        overallScore: report.overall_match_score,
        analyzedAt: report.analyzed_at,
      },
    })

  } catch (err) {
    console.error('[/api/match]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Failed to save report' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Login required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') ?? '10')

    const { data: reports, error } = await supabase
      .from('match_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('analyzed_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: 'DB_ERROR', message: 'Failed to fetch reports' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: reports?.map((r: any) => ({
        id: r.id,
        masterResumeId: r.master_resume_id,
        tailoredVersionId: r.tailored_version_id,
        overallScore: r.overall_match_score,
        keywordMatchScore: r.keyword_match_score,
        skillsMatchScore: r.skills_match_score,
        experienceMatchScore: r.experience_match_score,
        matchedKeywords: r.matched_keywords ?? [],
        missingKeywords: r.missing_keywords ?? [],
        atsRiskScore: r.ats_risk_score,
        jobTitle: r.job_title,
        companyName: r.company_name,
        analyzedAt: r.analyzed_at,
      })),
    })

  } catch (err) {
    console.error('[/api/match GET]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch reports' }, { status: 500 })
  }
}
