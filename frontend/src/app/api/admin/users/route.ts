import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// SECURE: Server-side session + role verification
export async function GET(request: NextRequest) {
  try {
    // ─── Authenticate the Admin (server-side session check) ─────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ─── Verify Admin Role ───────────────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 })
    }

    // ─── Fetch All Users (admin only) ──────────────────────────────────────────
    const supabaseAdmin = await createClient()
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, plan, scans, created_at, updated_at, role, email')
      .order('created_at', { ascending: false })

    if (error) throw error

    // ─── Get Auth Users for Emails ─────────────────────────────────────────────
    const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers()
    const emailMap: Record<string, string> = {}
    authUsers.forEach(u => { if (u.email) emailMap[u.id] = u.email })

    const users = (profiles || []).map(p => ({
      ...p,
      email: emailMap[p.id] || undefined,
    }))

    // ─── Stats ──────────────────────────────────────────────────────────────────
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: scansToday } = await supabaseAdmin
      .from('scan_logs')
      .select('scans_used')
      .gte('created_at', today.toISOString())

    const totalScansToday = (scansToday || []).reduce((sum, s) => sum + (s.scans_used || 0), 0)

    const { data: payments } = await supabaseAdmin
      .from('payment_transactions')
      .select('amount')

    const totalRevenue = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0)

    // ─── Recent Admin Audit Logs ─────────────────────────────────────────────────
    const { data: auditLogs } = await supabaseAdmin
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      users,
      stats: {
        totalUsers: users.length,
        totalScansToday,
        totalRevenue,
      },
      recentAuditLogs: auditLogs || [],
    })

  } catch (error) {
    console.error('Admin users fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
