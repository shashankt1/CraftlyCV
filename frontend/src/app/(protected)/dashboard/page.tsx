'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Target, Sparkles, Hexagon, Briefcase, ArrowRight,
  TrendingUp, Zap, Crown, ChevronRight, FileText, X
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

interface Version {
  id: string
  version_name: string
  tailored_for_company?: string
  tailored_for_role?: string
  ats_score?: number
  status: string
  created_at: string
}

interface ScoreData {
  date: string
  score: number
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [versions, setVersions] = useState<Version[]>([])
  const [jobStats, setJobStats] = useState({ total: 0, active: 0, responseRate: 0, offers: 0 })
  const [scoreHistory, setScoreHistory] = useState<ScoreData[]>([])
  const [vaultCompleteness, setVaultCompleteness] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      loadData()
    }
    checkAuth()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, versionsRes, jobsRes, vaultRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('resume_versions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('job_applications').select('status').eq('user_id', user.id),
      supabase.from('master_resumes').select('content').eq('user_id', user.id).single(),
    ])

    if (profileRes.data) setProfile(profileRes.data)

    if (versionsRes.data) {
      setVersions(versionsRes.data)
      const analyzed = versionsRes.data.filter((v: Version) => v.ats_score != null)
      setScoreHistory(analyzed.map((v: Version) => ({
        date: new Date(v.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        score: v.ats_score!
      })))
    }

    if (jobsRes.data) {
      const jobs = jobsRes.data as any[]
      const total = jobs.length
      const active = jobs.filter(j => ['applied', 'interview', 'wishlist'].includes(j.status)).length
      const offers = jobs.filter(j => j.status === 'offer').length
      const responseRate = total > 0 ? Math.round(((jobs.filter(j => ['interview', 'offer'].includes(j.status)).length) / total) * 100) : 0
      setJobStats({ total, active, responseRate, offers })
    }

    if (vaultRes.data?.content) {
      const c = vaultRes.data.content
      const fields = ['contact', 'summary', 'experience', 'education', 'skills']
      const filled = fields.filter(f => c[f] && (Array.isArray(c[f]) ? c[f].length > 0 : c[f].trim())).length
      setVaultCompleteness(Math.round((filled / fields.length) * 100))
    } else {
      setVaultCompleteness(0)
    }

    setDismissed(localStorage.getItem('upgrade-dismissed') === 'true')
    setLoading(false)
  }

  const dismissBanner = () => {
    setDismissed(true)
    localStorage.setItem('upgrade-dismissed', 'true')
  }

  const isPro = profile?.plan === 'pro' || profile?.plan === 'lifetime'
  const firstName = profile?.first_name || profile?.email?.split('@')[0] || 'there'

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">{getGreeting()}, {firstName}.</h1>
              <p className="text-zinc-400 mt-1">
                You have <span className="text-indigo-400 font-bold">{profile?.scans ?? 0}</span> scans remaining.
              </p>
              {profile?.scans && profile.scans <= 3 && !isPro && (
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={(profile.scans / 10) * 100} className="h-1.5 w-48" />
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                    {profile.scans} scans left — upgrade for unlimited
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 capitalize px-3 py-1.5 text-sm">
                {profile?.plan?.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionCard href="/analyze" icon={Target} label="Analyze My Resume" description="ATS score + feedback" color="text-red-400 bg-red-500/10" />
        <QuickActionCard href="/tailor" icon={Sparkles} label="Tailor for a Job" description="AI resume tailoring" color="text-indigo-400 bg-indigo-500/10" />
        <QuickActionCard href="/versions" icon={Hexagon} label="View My Versions" description="All resume versions" color="text-emerald-400 bg-emerald-500/10" />
        <QuickActionCard href="/jobs" icon={Briefcase} label="Track Applications" description="Kanban job tracker" color="text-amber-400 bg-amber-500/10" />
      </div>

      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-zinc-100">Recent Versions</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-indigo-400 hover:text-indigo-300">
              <Link href="/versions">View all <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <EmptyState icon={Hexagon} title="No versions yet" description="Create your first tailored resume version." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {versions.slice(0, 3).map(v => (
                <Link key={v.id} href={`/versions/${v.id}`} className="block">
                  <div className="p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-100 truncate">{v.version_name || 'Untitled'}</p>
                        {v.tailored_for_company && <p className="text-xs text-zinc-500 mt-0.5">{v.tailored_for_company}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {v.ats_score && (
                          <Badge className={cn('text-xs font-bold', v.ats_score >= 80 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : v.ats_score >= 60 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30')}>
                            {v.ats_score}
                          </Badge>
                        )}
                        <Badge className="text-xs capitalize bg-zinc-700/50 text-zinc-400 border-zinc-600/50">{v.status}</Badge>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-zinc-100">Job Tracker</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-indigo-400 hover:text-indigo-300">
              <Link href="/jobs">View board <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {jobStats.total === 0 ? (
            <EmptyState icon={Briefcase} title="No applications yet" description="Start tracking your job applications." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatChip label="Applied" value={jobStats.total} icon={Briefcase} color="text-indigo-400" />
              <StatChip label="In Progress" value={jobStats.active} icon={TrendingUp} color="text-amber-400" />
              <StatChip label="Response Rate" value={`${jobStats.responseRate}%`} icon={TrendingUp} color="text-emerald-400" />
              <StatChip label="Offers" value={jobStats.offers} icon={Crown} color="text-emerald-400" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-zinc-100">ATS Score Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {scoreHistory.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No score history yet" description="Analyze your first resume to see your score trend." />
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreHistory}>
                  <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#f4f4f5' }} labelStyle={{ color: '#a1a1aa' }} />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="#3f3f46" strokeWidth="4" />
                <circle cx="24" cy="24" r="20" fill="none" stroke={vaultCompleteness < 60 ? '#f59e0b' : '#6366f1'} strokeWidth="4" strokeDasharray={`${(vaultCompleteness / 100) * 125.6} 125.6`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-zinc-100">{vaultCompleteness}%</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium text-zinc-100">Vault Completeness</h3>
              <p className="text-sm text-zinc-500 mt-1">
                {vaultCompleteness < 60 ? 'Complete your vault to unlock better tailoring results.' : 'Your vault is well filled. Keep it updated!'}
              </p>
              {vaultCompleteness < 60 && (
                <Button asChild size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700">
                  <Link href="/vault">Complete Your Vault</Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {!isPro && !dismissed && (
        <Card className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-indigo-500/30">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="shrink-0"><Zap className="h-6 w-6 text-indigo-400" /></div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-zinc-100">Upgrade to Pro</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  You have {profile?.scans ?? 0} scans left. Upgrade to Pro for unlimited scans, all modules, and no watermarks.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" asChild className="bg-indigo-600 hover:bg-indigo-700">
                  <Link href="/billing">See Plans</Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={dismissBanner} className="text-zinc-400 hover:text-zinc-200">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function QuickActionCard({ href, icon: Icon, label, description, color }: { href: string; icon: any; label: string; description: string; color: string }) {
  return (
    <Link href={href} className="block group">
      <Card className="bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all h-full">
        <CardContent className="p-5 flex flex-col gap-3">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color.split(' ')[1])}>
            <Icon className={cn('h-5 w-5', color.split(' ')[0])} />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100 group-hover:text-white">{label}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all self-start" />
        </CardContent>
      </Card>
    </Link>
  )
}

function StatChip({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
      <Icon className={cn('h-4 w-4 shrink-0', color)} />
      <div>
        <p className="text-lg font-bold text-zinc-100">{value}</p>
        <p className="text-xs text-zinc-500">{label}</p>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-zinc-600" />
      </div>
      <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
      <p className="text-xs text-zinc-600 mt-1 max-w-xs">{description}</p>
    </div>
  )
}