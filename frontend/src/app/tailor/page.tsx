'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sparkles, Target, AlertTriangle, CheckCircle, XCircle,
  ArrowRight, Download, Copy, Clock, TrendingUp,
  FileText, Plus, ChevronRight, Loader2, RefreshCw,
  Shield, Zap, Eye, Edit3
} from 'lucide-react'
import { toast } from 'sonner'
import { getNichePack, type NichePack } from '@/lib/niches'

interface MasterResume {
  id: string
  name: string
  full_name: string
  professional_summary: string
  experience: any[]
  skills: string[]
  certifications: any[]
  primary_niche: string
}

interface MatchResult {
  matchScore: number
  missingKeywords: string[]
  matchedKeywords: string[]
  atsWarnings: Array<{ type: string; message: string }>
  tailoredSummary: string
}

interface TailoredVersion {
  id: string
  name: string
  target_job_title: string
  target_company: string
  match_score: number
  created_at: string
}

export default function TailorPage() {
  const [user, setUser] = useState<any>(null)
  const [masterResume, setMasterResume] = useState<MasterResume | null>(null)
  const [versions, setVersions] = useState<TailoredVersion[]>([])
  const [jobDescription, setJobDescription] = useState('')
  const [targetTitle, setTargetTitle] = useState('')
  const [targetCompany, setTargetCompany] = useState('')
  const [niche, setNiche] = useState<string>('general')
  const [selectedNichePack, setSelectedNichePack] = useState<NichePack | null>(null)
  const [loading, setLoading] = useState(false)
  const [matching, setMatching] = useState(false)
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setSelectedNichePack(getNichePack(niche))
  }, [niche])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth?redirect=/tailor')
      return
    }
    setUser(user)

    // Load master resume
    const { data: resumes } = await supabase
      .from('master_resumes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single()

    if (resumes) {
      setMasterResume(resumes)
      if (resumes.primary_niche && resumes.primary_niche !== 'general') {
        setNiche(resumes.primary_niche)
      }
    }

    // Load tailored versions
    const { data: vers } = await supabase
      .from('tailored_versions')
      .select('id, name, target_job_title, target_company, match_score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (vers) setVersions(vers)
  }

  async function handleMatch() {
    if (!user || !masterResume) {
      toast.error('Please create a master resume first')
      return
    }

    if (jobDescription.trim().length < 50) {
      toast.error('Job description must be at least 50 characters')
      return
    }

    setMatching(true)
    setMatchResult(null)

    try {
      const res = await fetch('/api/ai/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterResumeId: masterResume.id,
          jobDescription: jobDescription,
          niche,
          targetRole: targetTitle,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || data.message || 'Failed to generate match')
        return
      }

      setMatchResult(data.data)
      toast.success('Match analysis complete!')

      // Refresh versions
      loadData()

    } catch (err) {
      console.error('Tailor error:', err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setMatching(false)
    }
  }

  function getScoreColor(score: number) {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  function getScoreLabel(score: number) {
    if (score >= 80) return 'Strong Match'
    if (score >= 60) return 'Good Match'
    if (score >= 40) return 'Moderate Match'
    return 'Low Match'
  }

  if (!masterResume) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-blue-400" />
          <h1 className="text-2xl font-bold mb-2">Create Your Master Resume First</h1>
          <p className="text-white/60 mb-6">
            Before tailoring, you need to build your master resume with all your experience.
          </p>
          <Link href="/build">
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Build Master Resume
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-blue-400" />
              Tailor to Job
            </h1>
            <p className="text-white/60 mt-1">Turn your master resume into job-specific versions</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-white/60 border-white/20">
              <Zap className="h-3 w-3 mr-1" />
              {masterResume.skills?.length || 0} Skills
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT: Input Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description Input */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  Target Job Description
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/80">Target Job Title</Label>
                    <Input
                      placeholder="e.g. SOC Analyst, Senior Nurse..."
                      value={targetTitle}
                      onChange={(e) => setTargetTitle(e.target.value)}
                      className="mt-1.5 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white/80">Target Company (Optional)</Label>
                    <Input
                      placeholder="e.g. Google, Mayo Clinic..."
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      className="mt-1.5 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white/80">Niche Template</Label>
                  <select
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="mt-1.5 w-full h-11 rounded-xl bg-white/5 border border-white/10 text-white px-4"
                  >
                    <option value="general">General Professional</option>
                    <option value="cybersecurity">Cybersecurity</option>
                    <option value="nursing">Nursing & Healthcare</option>
                    <option value="skilled_trades">Skilled Trades</option>
                    <option value="game_dev">Game Dev</option>
                    <option value="creative">Creative Tech</option>
                  </select>
                </div>

                <div>
                  <Label className="text-white/80 flex items-center justify-between">
                    Job Description
                    <span className="text-xs text-white/40">{jobDescription.length} chars</span>
                  </Label>
                  <Textarea
                    placeholder="Paste the full job description here. Include requirements, responsibilities, and keywords..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="mt-1.5 h-48 bg-white/5 border-white/10 text-white resize-none"
                  />
                </div>

                <Button
                  onClick={handleMatch}
                  disabled={matching || jobDescription.trim().length < 50}
                  className="w-full"
                  size="lg"
                >
                  {matching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing Match...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Match & Tailored Version
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Match Results */}
            {matchResult && (
              <Card className="p-6 border-blue-500/30 bg-blue-950/20">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                  Match Analysis Results
                </h2>

                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  {/* Match Score */}
                  <div className="text-center p-4 rounded-xl bg-white/5">
                    <div className={`text-5xl font-black ${getScoreColor(matchResult.matchScore)}`}>
                      {matchResult.matchScore}
                    </div>
                    <div className="text-sm text-white/60 mt-1">Match Score</div>
                    <Badge className={`mt-2 ${matchResult.matchScore >= 60 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {getScoreLabel(matchResult.matchScore)}
                    </Badge>
                  </div>

                  {/* Keyword Match */}
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium">Matched Keywords</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {matchResult.matchedKeywords.slice(0, 6).map((kw: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Missing Keywords */}
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-400" />
                      <span className="text-sm font-medium">Missing Keywords</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {matchResult.missingKeywords.slice(0, 6).map((kw: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs border-red-500/30 text-red-400">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ATS Warnings */}
                {matchResult.atsWarnings && matchResult.atsWarnings.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      ATS Warnings
                    </h3>
                    <div className="space-y-2">
                      {matchResult.atsWarnings.map((warning: { type: string; message: string }, i: number) => (
                        <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-yellow-200">{warning.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tailored Summary */}
                {matchResult.tailoredSummary && (
                  <div className="p-4 rounded-xl bg-white/5">
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Edit3 className="h-4 w-4 text-blue-400" />
                      Tailored Summary
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {matchResult.tailoredSummary}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export ATS-Safe
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export Premium
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* RIGHT: Versions List */}
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  Recent Versions
                </h2>
                <span className="text-xs text-white/40">{versions.length} total</span>
              </div>

              {versions.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-3 text-white/20" />
                  <p className="text-white/40 text-sm">No tailored versions yet</p>
                  <p className="text-white/30 text-xs mt-1">Paste a job description to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{version.name}</p>
                          <p className="text-xs text-white/40 mt-0.5">
                            {new Date(version.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`text-lg font-bold ${getScoreColor(version.match_score || 0)}`}>
                          {version.match_score || 0}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs border-white/10 text-white/60">
                          {version.target_job_title || 'General'}
                        </Badge>
                        <ChevronRight className="h-3 w-3 text-white/20 group-hover:text-white/40 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Niche Quick Reference */}
            {selectedNichePack && selectedNichePack.skills.length > 0 && (
              <Card className="p-4">
                <h2 className="font-bold mb-3 flex items-center gap-2">
                  {selectedNichePack.icon}
                  {selectedNichePack.name} Skills
                </h2>
                <div className="space-y-3">
                  {selectedNichePack.skills.slice(0, 3).map((category) => (
                    <div key={category.category}>
                      <p className="text-xs text-white/40 mb-1">{category.category}</p>
                      <div className="flex flex-wrap gap-1">
                        {category.skills.slice(0, 4).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs border-white/10 text-white/60">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
