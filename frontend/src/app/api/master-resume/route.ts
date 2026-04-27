/**
 * /api/master-resume — CRUD with Zod validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const zExp = z.object({
  id: z.string().optional(),
  company: z.string(),
  title: z.string(),
  startDate: z.string(),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  location: z.string().optional(),
  bullets: z.array(z.string()),
})

const zEdu = z.object({
  id: z.string().optional(),
  institution: z.string(),
  degree: z.string(),
  field: z.string().optional(),
  graduationDate: z.string().optional(),
})

const zResume = z.object({
  id: z.string().uuid().optional(),
  name: z.string().max(100).default('My Master Resume'),
  fullName: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  location: z.string().max(200).optional(),
  linkedinUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  professionalSummary: z.string().optional(),
  experience: z.array(zExp).default([]),
  education: z.array(zEdu).default([]),
  skills: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  projects: z.array(z.object({
    name: z.string(), description: z.string(), url: z.string().optional(),
  })).default([]),
  primaryNiche: z.enum(['general', 'cybersecurity', 'nursing', 'skilled_trades', 'creative_tech']).default('general'),
  isPrimary: z.boolean().default(false),
})

// ─── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Login required' }, { status: 401 })

    const admin = await createAdminClient()
    const { data, error } = await admin
      .from('master_resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'DB_ERROR', message: 'Failed to fetch' }, { status: 500 })

    return NextResponse.json({ success: true, data: data?.map(normalize) ?? [] })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch' }, { status: 500 })
  }
}

// ─── POST ──────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Login required' }, { status: 401 })

    const body = await request.json()
    const parsed = zResume.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: parsed.error.errors[0]?.message ?? 'Invalid input',
        details: parsed.error.errors,
      }, { status: 400 })
    }

    const d = parsed.data
    const admin = await createAdminClient()

    if (d.isPrimary) {
      await admin.from('master_resumes').update({ is_primary: false }).eq('user_id', user.id)
    }

    const { data: resume, error } = await admin
      .from('master_resumes')
      .insert({
        user_id: user.id, name: d.name, full_name: d.fullName, email: d.email, phone: d.phone,
        location: d.location, linkedin_url: d.linkedinUrl, github_url: d.githubUrl, website_url: d.websiteUrl,
        professional_summary: d.professionalSummary, experience: d.experience, education: d.education,
        skills: d.skills, certifications: d.certifications, projects: d.projects,
        primary_niche: d.primaryNiche, is_primary: d.isPrimary,
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      return NextResponse.json({ error: 'DB_ERROR', message: 'Failed to create' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: normalize(resume) }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Failed to create' }, { status: 500 })
  }
}

// ─── PUT ───────────────────────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Login required' }, { status: 401 })

    const body = await request.json()
    const parsed = zResume.extend({ id: z.string().uuid() }).safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({
        error: 'VALIDATION_ERROR',
        message: parsed.error.errors[0]?.message ?? 'Invalid input',
      }, { status: 400 })
    }

    const d = parsed.data
    const admin = await createAdminClient()

    const { data: existing } = await admin
      .from('master_resumes').select('id').eq('id', d.id).eq('user_id', user.id).single()

    if (!existing) return NextResponse.json({ error: 'NOT_FOUND', message: 'Not found' }, { status: 404 })

    if (d.isPrimary) {
      await admin.from('master_resumes').update({ is_primary: false }).eq('user_id', user.id)
    }

    const { data: resume, error } = await admin
      .from('master_resumes')
      .update({
        name: d.name, full_name: d.fullName, email: d.email, phone: d.phone,
        location: d.location, linkedin_url: d.linkedinUrl, github_url: d.githubUrl, website_url: d.websiteUrl,
        professional_summary: d.professionalSummary, experience: d.experience, education: d.education,
        skills: d.skills, certifications: d.certifications, projects: d.projects,
        primary_niche: d.primaryNiche, is_primary: d.isPrimary,
      })
      .eq('id', d.id)
      .select()
      .single()

    if (error) {
      console.error(error)
      return NextResponse.json({ error: 'DB_ERROR', message: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: normalize(resume) })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Failed to update' }, { status: 500 })
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Login required' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'BAD_REQUEST', message: 'id required' }, { status: 400 })

    const admin = await createAdminClient()
    const { error } = await admin.from('master_resumes').delete().eq('id', id).eq('user_id', user.id)

    if (error) return NextResponse.json({ error: 'DB_ERROR', message: 'Failed to delete' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Failed to delete' }, { status: 500 })
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
function normalize(r: any) {
  return {
    id: r.id, userId: r.user_id, name: r.name, isPrimary: r.is_primary,
    fullName: r.full_name, email: r.email, phone: r.phone, location: r.location,
    linkedinUrl: r.linkedin_url, githubUrl: r.github_url, websiteUrl: r.website_url,
    professionalSummary: r.professional_summary,
    experience: r.experience ?? [], education: r.education ?? [],
    skills: r.skills ?? [], certifications: r.certifications ?? [], projects: r.projects ?? [],
    primaryNiche: r.primary_niche, createdAt: r.created_at, updatedAt: r.updated_at,
  }
}
