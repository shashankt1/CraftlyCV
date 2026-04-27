'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Target, AlertTriangle, Sparkles, ArrowRight, Plus,
  FileText, TrendingUp, CheckCircle2, XCircle, Loader2
} from 'lucide-react'

interface Version {
  id: string; name: string; match_score: number; ats_risk_score: number
  status: string; created_at: string; target_job_title?: string
}

interface MatchReport {
  id: string; overall_match_score: number; ats_risk_score: number
  missing_keywords: string[]; job_title?: string; analyzed_at: string
}

interface MasterResume {
  id: string; full_name?: string; experience: any[]; skills: string[]
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [versions, setVersions] = useState<Version[]>([])
  const [reports, setReports] = useState<MatchReport[]>([])
  const [master, setMaster] = useState<MasterResume | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ scans: number; plan: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const [{ data: prof }, { data: vers }, { data: reps }, { data: resumes }] = await Promise.all([
        supabase.from('profiles').select('scans, plan').eq('id', user.id).single(),
        supabase.from('tailored_versions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('match_reports').select('*').eq('user_id', user.id).order('analyzed_at', { ascending: false }).limit(3),
        supabase.from('master_resumes').select('*').eq('user_id', user.id).eq('is_primary', true).single(),
      ])

      setProfile(prof)
      setVersions(vers ?? [])
      setReports(reps ?? [])
      setMaster(resumes ?? null)
      setLoading(false)
    }
    load()
  }, [router, supabase])

  if (loading) {
    return <DashboardSkeleton />
  }

  const latestReport = reports[0]
  const hasVault = master && (master.experience?.length > 0 || master.skills?.length > 0)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your application command center</p>
        </div>
        <Button asChild><Link href="/versions"><Plus className="h-4 w-4 mr-1" />New Version</Link></Button>
      </div>

      {/* Vault CTA */}
      {!hasVault && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">Build your master resume to start tailoring.</span>
            <Button size="sm" variant="outline" asChild><Link href="/vault">Add Resume <ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          label="Match Score"
          value={latestReport?.overall_match_score ?? '—'}
          suffix="%"
          icon={<Target className="h-5 w-5" />}
          color={getScoreColor(latestReport?.overall_match_score)}
          sub={latestReport?.job_title ?? 'No analysis yet'}
          loading={loading}
        />
        <ScoreCard
          label="ATS Risk"
          value={latestReport?.ats_risk_score ?? '—'}
          suffix="/100"
          icon={<AlertTriangle className="h-5 w-5" />}
          color={getRiskColor(latestReport?.ats_risk_score)}
          sub="Lower is safer"
          invertColor
          loading={loading}
        />
        <ScoreCard
          label="Tailored"
          value={versions.length}
          suffix=""
          icon={<Sparkles className="h-5 w-5" />}
          color="blue"
          sub="versions created"
          loading={loading}
        />
        <ScoreCard
          label="Scans"
          value={profile?.scans ?? 0}
          suffix=""
          icon={<TrendingUp className="h-5 w-5" />}
          color="purple"
          sub={profile?.plan ?? 'free'}
          loading={loading}
        />
      </div>

      {/* Missing Keywords */}
      {latestReport?.missing_keywords?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4 text-amber-500" />
              Missing Keywords
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {latestReport.missing_keywords.slice(0, 10).map((kw: string, i: number) => (
                <Badge key={i} variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                  {kw}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Versions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent Versions</CardTitle>
          <Button size="sm" variant="ghost" asChild><Link href="/versions">View all <ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="No tailored versions yet"
              description="Create your first job-specific resume version."
              action={<Button size="sm" asChild><Link href="/analyze">Analyze a Job</Link></Button>}
            />
          ) : (
            <div className="space-y-3">
              {versions.map((v) => (
                <VersionRow key={v.id} version={v} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => router.push('/analyze')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900"><Target className="h-6 w-6 text-blue-600" /></div>
              <div>
                <h3 className="font-semibold">Analyze Job Description</h3>
                <p className="text-sm text-muted-foreground">Get match score, gaps & ATS risk</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-purple-300 transition-colors" onClick={() => router.push('/vault')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900"><FileText className="h-6 w-6 text-purple-600" /></div>
              <div>
                <h3 className="font-semibold">{hasVault ? 'Edit Master Resume' : 'Build Master Resume'}</h3>
                <p className="text-sm text-muted-foreground">{hasVault ? `${master.experience.length} jobs, ${master.skills.length} skills` : 'Start here'}</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ScoreCard({ label, value, suffix, icon, color, sub, invertColor, loading }: {
  label: string; value: string | number; suffix: string; icon: React.ReactNode
  color: string; sub: string; invertColor?: boolean; loading: boolean
}) {
  const colorMap: Record<string, string> = {
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900',
    red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900',
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
          <div className={colorMap[color] + ' p-1.5 rounded-md'}>{icon}</div>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-16 mb-1" />
        ) : (
          <div className="text-3xl font-bold">{value}{suffix}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  )
}

function VersionRow({ version }: { version: Version }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{version.name}</p>
        <p className="text-xs text-muted-foreground">{new Date(version.created_at).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={version.match_score >= 70 ? 'default' : 'secondary'} className="text-xs">
          {version.match_score ?? '—'}% match
        </Badge>
        <Badge variant={version.status === 'applied' ? 'outline' : 'secondary'} className="text-xs capitalize">
          {version.status}
        </Badge>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-muted-foreground mb-3">{icon}</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {action}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div><Skeleton className="h-8 w-48 mb-1" /><Skeleton className="h-4 w-32" /></div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
      <Skeleton className="h-48" />
      <Skeleton className="h-64" />
    </div>
  )
}

function getScoreColor(score?: number): string {
  if (!score) return 'blue'
  if (score >= 75) return 'green'
  if (score >= 55) return 'amber'
  return 'red'
}

function getRiskColor(score?: number): string {
  if (score === undefined) return 'blue'
  if (score <= 25) return 'green'
  if (score <= 50) return 'amber'
  return 'red'
}
