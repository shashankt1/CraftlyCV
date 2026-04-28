'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, Users, CreditCard, TrendingUp, Zap, Search, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const ZINC_BG = '#18181b'
const ZINC_TEXT = '#a1a1aa'
const ZINC_BORDER = '#27272a'

interface DashboardStats {
  mrr: number
  allTimeRevenue: number
  revenueChange: number
  userStats: {
    total: number
    newToday: number
    newThisWeek: number
    newThisMonth: number
    dau: number
    retention: number
  }
  scansStats: {
    today: number
    thisWeek: number
    topUsers: { userId: string; email: string; count: number }[]
    avgPerUser: number
  }
  funnelStats: {
    signups: number
    firstScan: number
    versionCreated: number
    checkoutStarted: number
    paymentCompleted: number
    dropOff1: number
    dropOff2: number
    dropOff3: number
    dropOff4: number
  }
  referralStats: {
    topReferrers: { referrerId: string; email: string; paidConversions: number; revenue: number }[]
    totalRevenue: number
    conversionRate: number
  }
  recentPayments: { id: string; date: string; email: string; plan: string; amount: number; status: string }[]
}

interface UserSearchResult {
  id: string
  email: string
  plan: string
  created_at: string
  scanCount: number
  versionCount: number
  lastActive: string
  paymentHistory: { date: string; amount: number; status: string }[]
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult | null>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        router.push('/dashboard')
        return
      }

      const response = await fetch('/api/analytics/dashboard')
      const data = await response.json()
      setStats(data)
      setLoading(false)
    }

    checkAdmin()
  }, [router, supabase])

  const searchUsers = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', `%${searchQuery}%`)

    if (profiles && profiles.length > 0) {
      const user = profiles[0]

      const { data: events } = await supabase
        .from('analytics_events')
        .select('event, created_at')
        .eq('user_id', user.id)

      const scanCount = events?.filter(e => e.event === 'scan_consumed').length ?? 0
      const versionCount = events?.filter(e => e.event === 'version_created').length ?? 0
      const lastActive = events?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at ?? null

      const { data: payments } = await supabase
        .from('payment_transactions')
        .select('amount, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setSearchResults({
        id: user.id,
        email: user.email ?? 'Unknown',
        plan: user.plan ?? 'free',
        created_at: user.created_at,
        scanCount,
        versionCount,
        lastActive,
        paymentHistory: payments?.map(p => ({
          date: p.created_at,
          amount: p.amount,
          status: p.status,
        })) ?? [],
      })
    } else {
      setSearchResults(null)
    }

    setSearching(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64 bg-zinc-900" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32 bg-zinc-900" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const funnelData = stats ? [
    { name: 'Signups', value: stats.funnelStats.signups, fill: '#3b82f6' },
    { name: 'First Scan', value: stats.funnelStats.firstScan, fill: '#22c55e' },
    { name: 'Version Created', value: stats.funnelStats.versionCreated, fill: '#a855f7' },
    { name: 'Checkout Started', value: stats.funnelStats.checkoutStarted, fill: '#f59e0b' },
    { name: 'Payment Completed', value: stats.funnelStats.paymentCompleted, fill: '#10b981' },
  ] : []

  const pieData = stats ? [
    { name: 'Pro', value: Math.round((stats.userStats.total * 0.1)), fill: '#3b82f6' },
    { name: 'Free', value: stats.userStats.total - Math.round((stats.userStats.total * 0.1)), fill: '#52525b' },
  ] : []

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            <h1 className="text-2xl font-bold text-zinc-100">Admin Dashboard</h1>
          </div>
          <Badge variant="outline" className="border-zinc-700 text-zinc-400">
            Live Analytics
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Monthly Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-100">
                ${stats?.mrr?.toLocaleString() ?? 0}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                MRR (Pro plans)
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500">
                  {stats?.revenueChange ?? 0}% vs last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">All-Time Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-100">
                ${stats?.allTimeRevenue?.toLocaleString() ?? 0}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Total completed payments
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Total Users</CardTitle>
              <Users className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-100">
                {stats?.userStats.total?.toLocaleString() ?? 0}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {stats?.userStats.newThisMonth ?? 0} new this month
              </p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-zinc-400">
                  {stats?.userStats.dau ?? 0} DAU
                </span>
                <span className="text-xs text-zinc-600">|</span>
                <span className="text-xs text-zinc-400">
                  {stats?.userStats.retention ?? 0}% retention
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Scans Today</CardTitle>
              <Zap className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-100">
                {stats?.scansStats.today ?? 0}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {stats?.scansStats.thisWeek ?? 0} this week
              </p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-zinc-400">
                  {stats?.scansStats.avgPerUser ?? 0} avg/user/week
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Conversion Funnel */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={funnelData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <XAxis type="number" stroke={ZINC_TEXT} />
                  <YAxis dataKey="name" type="category" stroke={ZINC_TEXT} />
                  <Tooltip
                    contentStyle={{ backgroundColor: ZINC_BG, borderColor: ZINC_BORDER }}
                    labelStyle={{ color: ZINC_TEXT }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Signups to First Scan</span>
                  <Badge variant="outline" className="border-red-900 text-red-500">
                    -{stats?.funnelStats.dropOff1 ?? 0}% drop
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">First Scan to Version</span>
                  <Badge variant="outline" className="border-red-900 text-red-500">
                    -{stats?.funnelStats.dropOff2 ?? 0}% drop
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Version to Checkout</span>
                  <Badge variant="outline" className="border-red-900 text-red-500">
                    -{stats?.funnelStats.dropOff3 ?? 0}% drop
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Checkout to Payment</span>
                  <Badge variant="outline" className="border-red-900 text-red-500">
                    -{stats?.funnelStats.dropOff4 ?? 0}% drop
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Distribution */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">User Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: ZINC_BG, borderColor: ZINC_BORDER }}
                    labelStyle={{ color: ZINC_TEXT }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-zinc-400">Pro (10%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-zinc-600" />
                  <span className="text-sm text-zinc-400">Free</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scans Usage */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Top Users by Scan Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-400">Rank</TableHead>
                  <TableHead className="text-zinc-400">Email</TableHead>
                  <TableHead className="text-zinc-400 text-right">Total Scans</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.scansStats.topUsers.map((user, i) => (
                  <TableRow key={user.userId} className="border-zinc-800">
                    <TableCell className="text-zinc-100">{i + 1}</TableCell>
                    <TableCell className="text-zinc-100">{user.email}</TableCell>
                    <TableCell className="text-zinc-100 text-right">{user.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Referral Tracking */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-zinc-800 rounded-lg">
                <div className="text-2xl font-bold text-zinc-100">
                  ${stats?.referralStats.totalRevenue?.toLocaleString() ?? 0}
                </div>
                <p className="text-xs text-zinc-500">Referral Revenue</p>
              </div>
              <div className="text-center p-4 bg-zinc-800 rounded-lg">
                <div className="text-2xl font-bold text-zinc-100">
                  {stats?.referralStats.topReferrers.reduce((sum, r) => sum + r.paidConversions, 0) ?? 0}
                </div>
                <p className="text-xs text-zinc-500">Paid Conversions</p>
              </div>
              <div className="text-center p-4 bg-zinc-800 rounded-lg">
                <div className="text-2xl font-bold text-zinc-100">
                  {stats?.referralStats.conversionRate ?? 0}%
                </div>
                <p className="text-xs text-zinc-500">Conversion Rate</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-400">Rank</TableHead>
                  <TableHead className="text-zinc-400">Email</TableHead>
                  <TableHead className="text-zinc-400 text-right">Conversions</TableHead>
                  <TableHead className="text-zinc-400 text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.referralStats.topReferrers.map((referrer, i) => (
                  <TableRow key={referrer.referrerId} className="border-zinc-800">
                    <TableCell className="text-zinc-100">{i + 1}</TableCell>
                    <TableCell className="text-zinc-100">{referrer.email}</TableCell>
                    <TableCell className="text-zinc-100 text-right">{referrer.paidConversions}</TableCell>
                    <TableCell className="text-zinc-100 text-right">${referrer.revenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-400">Date</TableHead>
                  <TableHead className="text-zinc-400">Email</TableHead>
                  <TableHead className="text-zinc-400">Plan</TableHead>
                  <TableHead className="text-zinc-400 text-right">Amount</TableHead>
                  <TableHead className="text-zinc-400 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recentPayments.map((payment) => (
                  <TableRow key={payment.id} className="border-zinc-800">
                    <TableCell className="text-zinc-100">
                      {new Date(payment.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-zinc-100">{payment.email}</TableCell>
                    <TableCell className="text-zinc-100">{payment.plan}</TableCell>
                    <TableCell className="text-zinc-100 text-right">${payment.amount}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        className={cn(
                          payment.status === 'completed' && 'bg-green-900 text-green-400 border-green-800',
                          payment.status === 'pending' && 'bg-amber-900 text-amber-400 border-amber-800',
                          payment.status === 'failed' && 'bg-red-900 text-red-400 border-red-800'
                        )}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* User Search */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">User Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                  className="pl-10 bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                />
              </div>
              <Button onClick={searchUsers} disabled={searching} className="bg-blue-600 hover:bg-blue-700">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>

            {searchResults && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 bg-zinc-950 rounded-lg">
                    <p className="text-xs text-zinc-500">Plan</p>
                    <p className="text-lg font-semibold text-zinc-100 capitalize">{searchResults.plan}</p>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-lg">
                    <p className="text-xs text-zinc-500">Total Scans</p>
                    <p className="text-lg font-semibold text-zinc-100">{searchResults.scanCount}</p>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-lg">
                    <p className="text-xs text-zinc-500">Versions</p>
                    <p className="text-lg font-semibold text-zinc-100">{searchResults.versionCount}</p>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-lg">
                    <p className="text-xs text-zinc-500">Last Active</p>
                    <p className="text-lg font-semibold text-zinc-100">
                      {searchResults.lastActive
                        ? new Date(searchResults.lastActive).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-lg">
                    <p className="text-xs text-zinc-500">Joined</p>
                    <p className="text-lg font-semibold text-zinc-100">
                      {new Date(searchResults.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {searchResults.paymentHistory.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-400 mb-2">Payment History</h4>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-800">
                          <TableHead className="text-zinc-400">Date</TableHead>
                          <TableHead className="text-zinc-400 text-right">Amount</TableHead>
                          <TableHead className="text-zinc-400 text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.paymentHistory.map((payment, i) => (
                          <TableRow key={i} className="border-zinc-800">
                            <TableCell className="text-zinc-100">
                              {new Date(payment.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-zinc-100 text-right">${payment.amount}</TableCell>
                            <TableCell className="text-right">
                              <Badge
                                className={cn(
                                  payment.status === 'completed' && 'bg-green-900 text-green-400 border-green-800',
                                  payment.status === 'pending' && 'bg-amber-900 text-amber-400 border-amber-800'
                                )}
                              >
                                {payment.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
