'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  Linkedin, Sparkles, Copy, Check, ChevronDown, ChevronUp,
  ArrowRight, AlertCircle, Loader2, Star, ExternalLink, Eye
} from 'lucide-react'
import { toast } from 'sonner'

const NICHES = ['Software', 'Nursing', 'Cybersecurity', 'Trades', 'Fresher', 'Creative']

interface OptimizationResult {
  optimized_headline: string
  headline_explanation: string
  optimized_summary: string
  summary_explanation: string
  skills_to_add: string[]
  skills_to_remove: string[]
  keyword_density_score: number
  recruiter_visibility_tips: string[]
  open_to_work_advice: string
  estimated_visibility_improvement: string
}

function UpgradeGate({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <Card className="max-w-xl mx-auto bg-zinc-900/80 border-zinc-800">
      <CardContent className="p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto">
          <Linkedin className="h-7 w-7 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Pro Feature</h2>
          <p className="text-sm text-zinc-500 mt-1">LinkedIn optimization is available for Pro and Lifetime plan users.</p>
        </div>
        <Button onClick={onUpgrade} className="bg-indigo-600 hover:bg-indigo-700">
          <Star className="h-4 w-4 mr-2" />Upgrade to Pro
        </Button>
      </CardContent>
    </Card>
  )
}

function BeforeAfter({ label, before, after, explanation, charCount }: {
  label: string; before: string; after: string; explanation: string; charCount: number
}) {
  const [copied, setCopied] = useState(false)
  const [explainOpen, setExplainOpen] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        <div className="flex items-center gap-2">
          {charCount !== undefined && (
            <Badge className={cn(
              'text-xs',
              charCount <= 220 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            )}>
              {charCount}/220
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={() => handleCopy(after)} className="text-indigo-400 hover:text-indigo-300">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
          <p className="text-[10px] text-red-400 font-medium mb-1.5 uppercase tracking-wider">Before</p>
          <p className="text-sm text-zinc-400 leading-relaxed">{before}</p>
        </div>
        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-[10px] text-emerald-400 font-medium mb-1.5 uppercase tracking-wider">After</p>
          <p className="text-sm text-zinc-200 leading-relaxed">{after}</p>
        </div>
      </div>

      <button onClick={() => setExplainOpen(!explainOpen)} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300">
        {explainOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Explain this change
      </button>
      {explainOpen && (
        <p className="text-xs text-zinc-500 bg-zinc-800/50 rounded-lg p-3">{explanation}</p>
      )}
    </div>
  )
}

export default function LinkedInPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    headline: '',
    about: '',
    skills: '',
    target_role: '',
    job_description: '',
  })
  const [optimizing, setOptimizing] = useState(false)
  const [result, setResult] = useState<OptimizationResult | null>(null)

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

  const isPro = profile?.plan === 'pro' || profile?.plan === 'lifetime'

  const handleOptimize = async () => {
    if (!form.headline.trim() && !form.about.trim()) {
      toast.error('Please provide at least a headline or About section')
      return
    }
    if (!isPro) return

    setOptimizing(true)
    try {
      const res = await fetch('/api/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setResult(json.data)
      toast.success('Optimization complete!')
    } catch (e: any) {
      toast.error(e.message || 'Failed to optimize')
    } finally {
      setOptimizing(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied!')
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto"><Skeleton className="h-96 w-full rounded-xl" /></div>
  }

  if (!isPro) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-zinc-100">LinkedIn Optimizer</h1>
          <p className="text-zinc-500 mt-1">AI-powered LinkedIn profile optimization to boost recruiter visibility.</p>
        </div>
        <UpgradeGate onUpgrade={() => router.push('/billing')} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-[#0A66C2]/20 flex items-center justify-center mx-auto mb-3">
          <Linkedin className="h-7 w-7 text-[#0A66C2]" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">LinkedIn Optimizer</h1>
        <p className="text-zinc-500 mt-1">Paste your current LinkedIn content and get AI-powered improvements.</p>
      </div>

      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardContent className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center justify-between">
              <span>Current Headline</span>
              <span className={cn('text-xs', (form.headline?.length || 0) > 220 ? 'text-red-400' : 'text-zinc-500')}>
                {form.headline?.length || 0}/220
              </span>
            </label>
            <Input
              value={form.headline}
              onChange={e => setForm(p => ({ ...p, headline: e.target.value.slice(0, 220) }))}
              placeholder="Software Engineer | React | Node.js | Building scalable web apps"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Current About/Summary</label>
            <Textarea
              value={form.about}
              onChange={e => setForm(p => ({ ...p, about: e.target.value }))}
              rows={6}
              placeholder="Write a brief summary of who you are, what you do, and what makes you unique..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Skills (comma-separated)</label>
            <Input
              value={form.skills}
              onChange={e => setForm(p => ({ ...p, skills: e.target.value }))}
              placeholder="React, TypeScript, Node.js, AWS, PostgreSQL"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Target Role</label>
              <Select value={form.target_role} onValueChange={v => setForm(p => ({ ...p, target_role: v }))}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  {NICHES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Job Description (optional — for targeted optimization)</label>
            <Textarea
              value={form.job_description}
              onChange={e => setForm(p => ({ ...p, job_description: e.target.value }))}
              rows={4}
              placeholder="Paste a job description you're targeting for highly specific keyword optimization..."
            />
          </div>

          <Button
            onClick={handleOptimize}
            disabled={optimizing || (!form.headline.trim() && !form.about.trim())}
            className="w-full bg-[#0A66C2] hover:bg-[#0856a3]"
          >
            {optimizing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Optimizing...</> : <><Sparkles className="h-4 w-4 mr-2" />Optimize My Profile</>}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-in fade-in-up duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">Optimization Results</h2>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              {result.estimated_visibility_improvement}
            </Badge>
          </div>

          {/* Headline */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardContent className="p-5">
              <BeforeAfter
                label="Headline"
                before={form.headline}
                after={result.optimized_headline}
                explanation={result.headline_explanation}
                charCount={result.optimized_headline.length}
              />
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardContent className="p-5">
              <BeforeAfter
                label="About/Summary"
                before={form.about}
                after={result.optimized_summary}
                explanation={result.summary_explanation}
                charCount={undefined}
              />
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardContent className="p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-zinc-300 mb-2">Skills to Add</p>
                <div className="flex flex-wrap gap-2">
                  {result.skills_to_add.map(s => (
                    <Badge key={s} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      + {s}
                    </Badge>
                  ))}
                </div>
              </div>
              {result.skills_to_remove.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-zinc-300 mb-2">Skills to Remove</p>
                  <div className="flex flex-wrap gap-2">
                    {result.skills_to_remove.map(s => (
                      <Badge key={s} className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                        - {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Keyword Score */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">Keyword Density Score</span>
                <Badge className={cn(
                  'text-sm font-bold',
                  result.keyword_density_score >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                  result.keyword_density_score >= 60 ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                )}>
                  {result.keyword_density_score}/100
                </Badge>
              </div>
              <div className="h-2 rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${result.keyword_density_score}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recruiter Tips */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardContent className="p-5 space-y-3">
              <p className="text-sm font-medium text-zinc-300">Recruiter Visibility Tips</p>
              <ul className="space-y-2">
                {result.recruiter_visibility_tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                    <ArrowRight className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Open to Work */}
          <Card className="bg-indigo-500/5 border-indigo-500/20">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-indigo-400" />
                <p className="text-sm font-medium text-indigo-300">Open to Work Strategy</p>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{result.open_to_work_advice}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}