'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Sparkles, Plus, Trash2, Copy, ExternalLink, Loader2,
  ArrowRight, Target, AlertTriangle, CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const NICHE_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'nursing', label: 'Nursing' },
  { value: 'skilled_trades', label: 'Skilled Trades' },
  { value: 'creative_tech', label: 'Creative Tech' },
]

interface Version {
  id: string; name: string; match_score: number; ats_risk_score: number
  status: string; export_mode: string; exported_count: number
  target_job_title?: string; target_company?: string
  target_job_description?: string; created_at: string; updated_at: string
}

export default function VersionsPage() {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [masterId, setMasterId] = useState('')
  const [profile, setProfile] = useState<any>(null)

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [targetJob, setTargetJob] = useState('')
  const [targetCompany, setTargetCompany] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [niche, setNiche] = useState('general')
  const [creating, setCreating] = useState(false)

  // Tailor modal
  const [showTailor, setShowTailor] = useState(false)
  const [tailoringVersion, setTailoringVersion] = useState<Version | null>(null)
  const [tailoring, setTailoring] = useState(false)
  const [tailorResult, setTailorResult] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const [{ data: prof }, { data: vers }, { data: resumes }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('tailored_versions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('master_resumes').select('id').eq('user_id', user.id).eq('is_primary', true).single(),
      ])

      setProfile(prof)
      setVersions(vers ?? [])
      if (resumes) setMasterId(resumes.id)
      setLoading(false)

      // Pre-fill from analyze page
      const preJd = searchParams.get('jd')
      const preNiche = searchParams.get('niche')
      if (preJd) { setJobDesc(preJd); setShowCreate(true) }
      if (preNiche) setNiche(preNiche)
    }
    load()
  }, [router, supabase, searchParams])

  const handleCreate = async () => {
    if (!masterId) { toast.error('Create a master resume first'); router.push('/vault'); return }
    if (!createName.trim()) { toast.error('Enter a name for this version'); return }
    if (!jobDesc.trim() || jobDesc.length < 100) { toast.error('Job description must be 100+ characters'); return }

    setCreating(true)
    try {
      // Save version
      const res = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterResumeId: masterId,
          name: createName,
          targetJobTitle: targetJob,
          targetCompany: targetCompany,
          targetJobDescription: jobDesc,
          status: 'draft',
        }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.message); return }

      setShowCreate(false)
      toast.success('Version created')
      // Redirect to tailor
      setTailoringVersion({ ...json.data, target_job_description: jobDesc })
      setShowTailor(true)
    } catch {
      toast.error('Failed to create version')
    } finally {
      setCreating(false)
    }
  }

  const handleTailor = async () => {
    if (!tailoringVersion?.id) return
    setTailoring(true)
    setTailorResult(null)

    try {
      const res = await fetch('/api/ai/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterResumeId: masterId,
          jobDescription: tailoringVersion.target_job_description || jobDesc,
          niche: tailoringVersion.name.includes('Cybersec') ? 'cybersecurity'
              : tailoringVersion.name.includes('Nurs') ? 'nursing'
              : tailoringVersion.name.includes('Trade') ? 'skilled_trades'
              : 'general',
        }),
      })

      const json = await res.json()
      if (!json.success) {
        toast.error(json.message || json.error)
        if (json.currentScans !== undefined) {
          toast.error(`Only ${json.currentScans} scans remaining`)
        }
        return
      }

      setTailorResult(json.data)

      // Save the tailoring result back to the version
      await fetch('/api/versions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tailoringVersion.id,
          tailoredSummary: json.data.tailoredResume?.summary,
          tailoredExperience: json.data.tailoredResume?.experience,
          tailoredSkills: json.data.tailoredResume?.skills,
          tailoredEducation: json.data.tailoredResume?.education,
          matchScore: json.data.matchScore,
          atsRiskScore: json.data.atsRiskScore,
          missingKeywords: json.data.missingKeywords,
          status: 'ready',
        }),
      })

      toast.success('Resume tailored successfully!')
    } catch {
      toast.error('Tailoring failed')
    } finally {
      setTailoring(false)
    }
  }

  const handleDuplicate = async (v: Version) => {
    const res = await fetch('/api/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        masterResumeId: masterId,
        name: `${v.name} (copy)`,
        targetJobTitle: v.target_job_title,
        targetCompany: v.target_company,
        targetJobDescription: v.target_job_description,
        status: 'draft',
      }),
    })
    const json = await res.json()
    if (json.success) {
      toast.success('Version duplicated')
      setVersions(prev => [json.data, ...prev])
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('tailored_versions').delete().eq('id', id)
    if (!error) {
      setVersions(prev => prev.filter(v => v.id !== id))
      toast.success('Version deleted')
    }
  }

  const handleExport = (v: Version) => {
    window.open(`/export?id=${v.id}`, '_blank')
  }

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-96" /></div>
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tailored Versions</h1>
          <p className="text-sm text-muted-foreground">{versions.length} version{versions.length !== 1 ? 's' : ''} created</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" />New Version
        </Button>
      </div>

      {/* Empty State */}
      {versions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tailored versions yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Create your first job-specific resume by providing a job description.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />Create First Version
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Versions List */}
      {versions.length > 0 && (
        <div className="grid gap-4">
          {versions.map(v => (
            <Card key={v.id} className="hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{v.name}</h3>
                      <Badge variant={v.status === 'applied' ? 'default' : 'secondary'} className="text-xs capitalize">
                        {v.status}
                      </Badge>
                    </div>
                    {v.target_job_title && (
                      <p className="text-sm text-muted-foreground">{v.target_job_title}</p>
                    )}
                    {v.target_company && (
                      <p className="text-xs text-muted-foreground">{v.target_company}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`text-sm font-medium ${v.match_score >= 70 ? 'text-green-600' : v.match_score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {v.match_score ?? '—'}% match
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(v.created_at).toLocaleDateString()}
                      </span>
                      {v.exported_count > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Exported {v.exported_count}x
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" onClick={() => { setTailoringVersion(v); setShowTailor(true) }}>
                      Tailor
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleExport(v)}>
                      Export
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDuplicate(v)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(v.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Version Name *</label>
              <Input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="e.g., Acme Corp - Senior Engineer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Target Job Title</label>
                <Input value={targetJob} onChange={e => setTargetJob(e.target.value)} placeholder="Senior Engineer" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Target Company</label>
                <Input value={targetCompany} onChange={e => setTargetCompany(e.target.value)} placeholder="Acme Corp" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Niche</label>
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NICHE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Job Description * (100+ chars)</label>
              <Textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={8} placeholder="Paste the full job description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {creating ? 'Creating...' : 'Create & Tailor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tailor Modal */}
      <Dialog open={showTailor} onOpenChange={setShowTailor}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {tailoringVersion?.name || 'Tailor Resume'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {tailorResult ? (
              <div className="space-y-4">
                {/* Score */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                    <div className="text-3xl font-bold text-green-600">{tailorResult.matchScore}%</div>
                    <div className="text-sm text-green-700 dark:text-green-300">Match Score</div>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                    <div className="text-3xl font-bold text-blue-600">{tailorResult.atsRiskScore}/100</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">ATS Risk</div>
                  </div>
                </div>

                {/* Summary */}
                {tailorResult.tailoredResume?.summary && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Generated Summary</h4>
                    <p className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">{tailorResult.tailoredResume.summary}</p>
                  </div>
                )}

                {/* Warnings */}
                {tailorResult.authenticityWarnings?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-amber-600">Review Before Export</h4>
                    <ul className="space-y-1">
                      {tailorResult.authenticityWarnings.map((w: string, i: number) => (
                        <li key={i} className="text-sm text-amber-600">⚠ {w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Keywords */}
                {tailorResult.missingKeywords?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Still Missing</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {tailorResult.missingKeywords.map((kw: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowTailor(false)}>Close</Button>
                  <Button asChild>
                    <Link href={`/export?version=${tailoringVersion?.id}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />Export Resume
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  This will use 1 scan to generate a tailored resume for this job description.
                </p>
                {tailoringVersion?.target_job_description && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-muted-foreground max-h-32 overflow-y-auto">
                    {tailoringVersion.target_job_description.slice(0, 500)}...
                  </div>
                )}
              </>
            )}
          </div>
          {!tailorResult && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTailor(false)}>Cancel</Button>
              <Button onClick={handleTailor} disabled={tailoring}>
                {tailoring ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Tailoring...</> : <><Sparkles className="h-4 w-4 mr-2" />Tailor Resume (1 scan)</>}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
