'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Compass, TrendingUp, GraduationCap, Briefcase, ArrowRight,
  Lock, Star, ChevronRight, Loader2, ExternalLink, DollarSign,
  BookOpen, Users, Code, Award, Zap
} from 'lucide-react'
import { toast } from 'sonner'

function UpgradeLock({ message }: { message: string }) {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
        <Lock className="h-5 w-5 text-zinc-600" />
      </div>
      <p className="text-sm text-zinc-500 max-w-xs">{message}</p>
      <Button onClick={() => router.push('/billing')} size="sm" className="mt-4 bg-indigo-600 hover:bg-indigo-700">
        <Star className="h-4 w-4 mr-2" />Upgrade to Pro
      </Button>
    </div>
  )
}

function AdjacentRoleCard({ role, match, skills, onTailor }: {
  role: string; match: number; skills: string[]; onTailor: () => void
}) {
  return (
    <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{role}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Adjacent role</p>
        </div>
        <Badge className={cn(
          'text-xs font-bold',
          match >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
          match >= 60 ? 'bg-amber-500/20 text-amber-400' :
          'bg-zinc-700 text-zinc-400'
        )}>
          {match}% match
        </Badge>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-700 mb-3">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${match}%` }} />
      </div>
      {skills.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1.5">Missing skills</p>
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 3).map(s => (
              <Badge key={s} className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                {s}
              </Badge>
            ))}
            {skills.length > 3 && (
              <Badge className="text-[10px] bg-zinc-700 text-zinc-500">+{skills.length - 3}</Badge>
            )}
          </div>
        </div>
      )}
      <Button size="sm" onClick={onTailor} className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs">
        Tailor Resume <ArrowRight className="h-3 w-3 ml-1.5" />
      </Button>
    </div>
  )
}

function SkillPathCard({ title, icon: Icon, description, platform, salary_impact, cost }: {
  title: string; icon: any; description: string; platform?: string; salary_impact?: string; cost?: string
}) {
  return (
    <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Icon className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          {platform && <p className="text-xs text-zinc-500">{platform}</p>}
        </div>
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed mb-3">{description}</p>
      {(salary_impact || cost) && (
        <div className="flex items-center gap-3">
          {salary_impact && <Badge className="text-xs bg-emerald-500/20 text-emerald-400">+{salary_impact}</Badge>}
          {cost && <Badge className="text-xs bg-zinc-700 text-zinc-400">{cost}</Badge>}
        </div>
      )}
    </div>
  )
}

function UpskillCard({ title, platform, salary_impact, cost, url }: {
  title: string; platform: string; salary_impact: string; cost: string; url?: string
}) {
  return (
    <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
        <Award className="h-5 w-5 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        <p className="text-xs text-zinc-500 mt-0.5">{platform}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge className="text-xs bg-emerald-500/20 text-emerald-400">{salary_impact}</Badge>
          <Badge className="text-xs bg-zinc-700 text-zinc-400">{cost}</Badge>
        </div>
      </div>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
          <ExternalLink className="h-4 w-4 text-zinc-500 hover:text-indigo-400" />
        </a>
      )}
    </div>
  )
}

export default function CareerPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [careerData, setCareerData] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setLoading(false)
    }
    init()
  }, [])

  const loadCareerData = useCallback(async () => {
    if (!profile) return
    setLoadingData(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get vault content and version skills
      const { data: vault } = await supabase.from('master_resumes').select('content').eq('user_id', user.id).single()
      const { data: versions } = await supabase.from('resume_versions').select('tailored_for_role').eq('user_id', user.id).limit(5)

      const res = await fetch('/api/career/paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          skills: vault?.content?.skills || [],
          target_role: versions?.[0]?.tailored_for_role || '',
          niche: profile.niche || 'Software',
          experience_level: 'mid',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setCareerData(json.data)
      setExpandedSection('adjacent')
    } catch (e: any) {
      toast.error(e.message || 'Failed to load career paths')
    } finally {
      setLoadingData(false)
    }
  }, [profile, supabase])

  const isPro = profile?.plan === 'pro' || profile?.plan === 'lifetime'

  if (loading) {
    return <div className="max-w-5xl mx-auto"><Skeleton className="h-96 w-full rounded-xl" /></div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-8">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-3">
          <Compass className="h-7 w-7 text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Career Pivot Hub</h1>
        <p className="text-zinc-500 mt-1">Career intelligence — alternative paths and bridge opportunities based on your actual skills.</p>
      </div>

      {/* Section 1: Adjacent Roles (Free) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-100">Adjacent Roles</h2>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Free</Badge>
          </div>
          {!careerData && (
            <Button size="sm" onClick={loadCareerData} disabled={loadingData} className="bg-indigo-600 hover:bg-indigo-700">
              {loadingData ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</> : <><Zap className="h-4 w-4 mr-2" />Find My Adjacent Roles</>}
            </Button>
          )}
        </div>

        {!careerData && !loadingData ? (
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                <TrendingUp className="h-5 w-5 text-zinc-600" />
              </div>
              <h3 className="text-sm font-medium text-zinc-400">Discover adjacent opportunities</h3>
              <p className="text-xs text-zinc-600 mt-1 max-w-sm">Based on your vault and target role, we'll find roles you're 70-90% qualified for.</p>
              <Button size="sm" onClick={loadCareerData} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                <Zap className="h-4 w-4 mr-2" />Analyze My Skills
              </Button>
            </CardContent>
          </Card>
        ) : loadingData ? (
          <div className="space-y-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(careerData?.adjacent_roles || []).map((r: any) => (
              <AdjacentRoleCard
                key={r.role}
                role={r.role}
                match={r.match_percentage}
                skills={r.skill_gaps || []}
                onTailor={() => router.push('/tailor')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Skill Monetization (Pro) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-100">Skill Monetization Paths</h2>
            {!isPro && <Lock className="h-4 w-4 text-zinc-600" />}
          </div>
        </div>
        {isPro && careerData?.skill_monetization ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {careerData.skill_monetization.map((item: any, i: number) => (
              <SkillPathCard key={i} {...item} />
            ))}
          </div>
        ) : !isPro && (
          <UpgradeLock message="Skill monetization paths are available for Pro and Lifetime users." />
        )}
      </div>

      {/* Section 3: Upskill Paths (Pro) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-100">Upskill Paths</h2>
            {!isPro && <Lock className="h-4 w-4 text-zinc-600" />}
          </div>
        </div>
        {isPro && careerData?.upskill_paths ? (
          <div className="space-y-2">
            {careerData.upskill_paths.map((item: any, i: number) => (
              <UpskillCard key={i} {...item} />
            ))}
          </div>
        ) : !isPro && (
          <UpgradeLock message="Upskill paths with salary impact rankings are available for Pro and Lifetime users." />
        )}
      </div>

      {/* Section 4: Bridge Opportunities (Pro) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-100">Bridge Opportunities</h2>
            {!isPro && <Lock className="h-4 w-4 text-zinc-600" />}
          </div>
        </div>
        {isPro && careerData?.bridge_opportunities ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {careerData.bridge_opportunities.map((item: any, i: number) => (
              <SkillPathCard key={i} {...item} />
            ))}
          </div>
        ) : !isPro && (
          <UpgradeLock message="Bridge opportunities with platform links are available for Pro and Lifetime users." />
        )}
      </div>
    </div>
  )
}