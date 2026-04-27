import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const adminClient = createAdminClient()

    // REVENUE STATS
    const { data: planData } = await adminClient
      .from('profiles')
      .select('plan')

    const proCount = planData?.filter(p => p.plan === 'pro').length ?? 0
    const mrr = proCount * 499

    const { data: paymentData } = await adminClient
      .from('payment_transactions')
      .select('amount, status, created_at')

    const allTimeRevenue = paymentData
      ?.filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0

    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear

    const thisMonthPayments = paymentData?.filter(p => {
      const d = new Date(p.created_at)
      return p.status === 'completed' && d.getMonth() === thisMonth && d.getFullYear() === thisYear
    }).reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0

    const lastMonthPayments = paymentData?.filter(p => {
      const d = new Date(p.created_at)
      return p.status === 'completed' && d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear
    }).reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0

    const revenueChange = lastMonthPayments > 0
      ? Math.round(((thisMonthPayments - lastMonthPayments) / lastMonthPayments) * 100)
      : 0

    // USER STATS
    const totalUsers = planData?.length ?? 0

    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const { data: allProfiles } = await adminClient
      .from('profiles')
      .select('created_at')

    const newToday = allProfiles?.filter(p => {
      const d = new Date(p.created_at)
      return d.toDateString() === today.toDateString()
    }).length ?? 0

    const newThisWeek = allProfiles?.filter(p => {
      const d = new Date(p.created_at)
      return d >= weekAgo
    }).length ?? 0

    const newThisMonth = allProfiles?.filter(p => {
      const d = new Date(p.created_at)
      return d >= monthAgo
    }).length ?? 0

    // DAU - users with any analytics event in last 24hrs
    const dayAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const { data: dauData } = await adminClient
      .from('analytics_events')
      .select('user_id, created_at')

    const dauUsers = new Set(dauData?.filter(e => new Date(e.created_at) >= dayAgo && e.user_id).map(e => e.user_id)).size

    // Retention: users active in last 7 days / total
    const activeLast7Days = new Set(dauData?.filter(e => new Date(e.created_at) >= weekAgo && e.user_id).map(e => e.user_id)).size
    const retention = totalUsers > 0 ? Math.round((activeLast7Days / totalUsers) * 100) : 0

    // SCANS STATS
    const { data: scanEvents } = await adminClient
      .from('analytics_events')
      .select('user_id, event, created_at')

    const scansToday = scanEvents?.filter(e => {
      return e.event === 'scan_consumed' && new Date(e.created_at) >= new Date(today.toDateString())
    }).length ?? 0

    const scansThisWeek = scanEvents?.filter(e => {
      return e.event === 'scan_consumed' && new Date(e.created_at) >= weekAgo
    }).length ?? 0

    // Top 10 users by scan usage
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, email')

    const scanCounts: Record<string, number> = {}
    scanEvents?.filter(e => e.event === 'scan_consumed').forEach(e => {
      if (e.user_id) {
        scanCounts[e.user_id] = (scanCounts[e.user_id] ?? 0) + 1
      }
    })

    const topScanUsers = Object.entries(scanCounts)
      .map(([userId, count]) => ({
        userId,
        email: profiles?.find(p => p.id === userId)?.email ?? 'Unknown',
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const avgScansPerUser = totalUsers > 0 ? Math.round(scansThisWeek / totalUsers) : 0

    // CONVERSION FUNNEL
    const signups = totalUsers

    const firstScanUsers = new Set(scanEvents?.filter(e => e.event === 'first_scan').map(e => e.user_id)).size
    const versionCreatedUsers = new Set(scanEvents?.filter(e => e.event === 'version_created').map(e => e.user_id)).size
    const checkoutStarted = scanEvents?.filter(e => e.event === 'checkout_started').length ?? 0
    const paymentCompleted = scanEvents?.filter(e => e.event === 'payment_completed').length ?? 0

    const funnelStats = {
      signups,
      firstScan: firstScanUsers,
      versionCreated: versionCreatedUsers,
      checkoutStarted,
      paymentCompleted,
      dropOff1: signups > 0 ? Math.round((1 - firstScanUsers / signups) * 100) : 0,
      dropOff2: firstScanUsers > 0 ? Math.round((1 - versionCreatedUsers / firstScanUsers) * 100) : 0,
      dropOff3: versionCreatedUsers > 0 ? Math.round((1 - checkoutStarted / versionCreatedUsers) * 100) : 0,
      dropOff4: checkoutStarted > 0 ? Math.round((1 - paymentCompleted / checkoutStarted) * 100) : 0,
    }

    // REFERRAL TRACKING
    const { data: referralData } = await adminClient
      .from('referrals')
      .select('referrer_id, status, created_at')

    const { data: referralPayments } = await adminClient
      .from('payment_transactions')
      .select('amount, status, user_id')

    const referralStats: Record<string, { count: number; revenue: number }> = {}
    referralData?.filter(r => r.status === 'completed').forEach(r => {
      if (r.referrer_id) {
        const payment = referralPayments?.find(p => p.user_id === r.referrer_id && p.status === 'completed')
        if (!referralStats[r.referrer_id]) {
          referralStats[r.referrer_id] = { count: 0, revenue: 0 }
        }
        referralStats[r.referrer_id].count++
        referralStats[r.referrer_id].revenue += payment?.amount ?? 0
      }
    })

    const topReferrers = Object.entries(referralStats)
      .map(([referrerId, data]) => ({
        referrerId,
        email: profiles?.find(p => p.id === referrerId)?.email ?? 'Unknown',
        paidConversions: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    const totalReferralRevenue = topReferrers.reduce((sum, r) => sum + r.revenue, 0)
    const referralConversionRate = signups > 0 ? Math.round((topReferrers.reduce((sum, r) => sum + r.count, 0) / signups) * 100) : 0

    // RECENT PAYMENTS
    const { data: recentPaymentsData } = await adminClient
      .from('payment_transactions')
      .select('*, profiles:user_id(email)')
      .order('created_at', { ascending: false })
      .limit(50)

    const recentPayments = recentPaymentsData?.map(p => ({
      id: p.id,
      date: p.created_at,
      email: (p.profiles as any)?.email ?? 'Unknown',
      plan: 'pro',
      amount: p.amount,
      status: p.status,
    })) ?? []

    return NextResponse.json({
      mrr,
      allTimeRevenue,
      revenueChange,
      thisMonthRevenue: thisMonthPayments,
      lastMonthRevenue: lastMonthPayments,
      userStats: {
        total: totalUsers,
        newToday,
        newThisWeek,
        newThisMonth,
        dau: dauUsers,
        retention,
      },
      scansStats: {
        today: scansToday,
        thisWeek: scansThisWeek,
        topUsers: topScanUsers,
        avgPerUser: avgScansPerUser,
      },
      funnelStats,
      referralStats: {
        topReferrers,
        totalRevenue: totalReferralRevenue,
        conversionRate: referralConversionRate,
      },
      recentPayments,
    })
  } catch (err) {
    console.error('Dashboard analytics error:', err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
