import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// SECURE: All admin updates go through the RPC which verifies admin role server-side
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { targetUserId, scanAdjustment, newPlan, newRole } = body

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 })
    }

    // ─── Authenticate the Admin (server-side session check) ─────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - no valid session' }, { status: 401 })
    }

    // ─── Use RPC for atomic admin action with audit logging ────────────────────
    const { data: result, error: rpcError } = await supabase.rpc('admin_update_user', {
      p_admin_id: user.id,
      p_target_user_id: targetUserId,
      p_scan_adjustment: scanAdjustment ?? null,
      p_new_plan: newPlan ?? null,
      p_new_role: newRole ?? null,
    })

    if (rpcError) {
      console.error('Admin update RPC error:', rpcError)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    const parsedResult = typeof result === 'string' ? JSON.parse(result) : result

    if (!parsedResult.success) {
      return NextResponse.json({ error: parsedResult.error || 'Update failed' }, { status: 403 })
    }

    return NextResponse.json({ success: true, message: 'User updated successfully' })

  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
