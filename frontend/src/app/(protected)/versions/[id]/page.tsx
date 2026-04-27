'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  ArrowLeft, Sparkles, Copy, Download, FileText, Check, RefreshCw,
  ChevronDown, ChevronUp, Clock, Loader2, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { VersionDiff } from '@/components/versions/version-diff'
import { ExportCenter } from '@/components/export/export-center'
import { HealthScoreGauge } from '@/components/ui/health-score-gauge'

const STATUS_OPTS = ['draft', 'ready', 'applied'] as const

function SectionAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-white/5 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/3">
        <span className="text-sm font-bold text-white/60 uppercase tracking-widest">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

export default function VersionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [version, setVersion] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [reanalyzing, setReanalyzing] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [compareVersionId, setCompareVersionId] = useState<string>('')
  const [allVersions, setAllVersions] = useState<any[]>([])
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    if (!params.id) return
    load()
  }, [params.id])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    const [versionRes, allVersionsRes] = await Promise.all([
      fetch(`/api/versions/${params.id}`).then(r => r.json()),
      fetch('/api/versions').then(r => r.json()),
    ])
    if (versionRes.success) {
      setVersion(versionRes.data)
      setHistory(versionRes.data.history || [])
    }
    if (allVersionsRes.success) {
      setAllVersions(allVersionsRes.data.filter((v: any) => v.id !== params.id))
    }
    setLoading(false)
  }

  async function handleStatusChange(newStatus: string) {
    setStatusSaving(true)
    const res = await fetch(`/api/versions/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const json = await res.json()
    if (res.ok) { setVersion((v: any) => ({ ...v, status: newStatus })); toast.success(`Status → ${newStatus}`) }
    else { toast.error(json.error) }
    setStatusSaving(false)
  }

  async function handleDuplicate() {
    const res = await fetch('/api/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionName: `${version?.version_name || 'Version'} (copy)`, jobDescription: version?.job_description }),
    })
    const json = await res.json()
    if (res.ok) { toast.success('Duplicated'); router.push(`/versions/${json.data.id}`) }
  }

  async function handleReanalyze() {
    setReanalyzing(true)
    try {
      const formData = new FormData()
      formData.append('resumeText', JSON.stringify(version?.master_resumes?.content || {}))
      if (version?.job_description) formData.append('jobDesc', version.job_description)
      const res = await fetch('/api/analyze', { method: 'POST', body: formData })
      const json = await res.json()
      if (res.ok && json.data) {
        await fetch(`/api/versions/${params.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ats_score: json.data.ats_score }),
        })
        setVersion((v: any) => ({ ...v, ats_score: json.data.ats_score }))
        toast.success(`Re-analysis complete: ${json.data.ats_score}/100`)
      } else { toast.error(json.message || 'Analysis failed') }
    } catch { toast.error('Analysis failed') }
    finally { setReanalyzing(false) }
  }

  async function handleVersionNameEdit(name: string) {
    const res = await fetch(`/api/versions/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version_name: name }),
    })
    if (res.ok) setVersion((v: any) => ({ ...v, version_name: name }))
  }

  if (loading) return <div className="max-w-4xl space-y-4"><Skeleton className="h-[500px]" /></div>
  if (!version) return <div className="text-center py-20 text-white/40">Version not found</div>

  const tailored = version.tailored_content || {}
  const scoreColor = version.ats_score >= 80 ? 'text-green-400' : version.ats_score >= 60 ? 'text-yellow-400' : 'text-red-400'
  const scoreBg = version.ats_score >= 80 ? 'bg-green-500/10 border-green-500/20' : version.ats_score >= 60 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/versions')}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-xl font-bold text-white">{version.version_name || 'Untitled Version'}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {version.tailored_for_company && (
                <span className="text-sm text-white/40">{version.tailored_for_company}{version.tailored_for_role ? ` · ${version.tailored_for_role}` : ''}</span>
              )}
              <span className="text-xs text-white/20">{new Date(version.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {version.ats_score ? (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${scoreBg}`}>
              <span className={`text-lg font-black ${scoreColor}`}>{version.ats_score}</span>
              <span className="text-xs text-white/40">ATS</span>
            </div>
          ) : null}
          <Select value={version.status} onValueChange={handleStatusChange} disabled={statusSaving}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS_OPTS.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReanalyze} disabled={reanalyzing}>
          {reanalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Re-analyze
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDuplicate}><Copy className="h-3.5 w-3.5" />Duplicate</Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowDiff(true)}><FileText className="h-3.5 w-3.5" />Compare</Button>
        <Button size="sm" className="gap-1.5" onClick={() => setShowExport(true)}><Download className="h-3.5 w-3.5" />Export</Button>
      </div>

      {/* Resume preview */}
      <Card className="overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto scrollbar-premium">
          {/* Score hero */}
          {version.ats_score && (
            <div className="flex items-center gap-6 p-6 border-b border-white/5 bg-white/[0.02]">
              <HealthScoreGauge score={version.ats_score} size="md" />
              <div>
                <p className="text-xs text-white/30 uppercase tracking-widest mb-1">ATS Score</p>
                <p className={`text-3xl font-black ${scoreColor}`}>{version.ats_score}/100</p>
                <p className="text-xs text-white/30 mt-1">Based on keyword match, formatting, and readability</p>
              </div>
            </div>
          )}

          {/* Sections */}
          {tailored.tailored_summary && (
            <SectionAccordion title="Summary">
              <p className="text-sm text-white/70 leading-relaxed">{tailored.tailored_summary}</p>
            </SectionAccordion>
          )}

          {tailored.tailored_experience?.length > 0 && (
            <SectionAccordion title="Experience">
              <div className="space-y-5">
                {tailored.tailored_experience.map((exp: any, i: number) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">{exp.role}</p>
                        <p className="text-xs text-white/40">{exp.company}</p>
                      </div>
                    </div>
                    <ul className="space-y-1.5">
                      {(exp.bullets || []).map((b: string, j: number) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-white/50">
                          <span className="text-green-400 flex-shrink-0 mt-0.5">→</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </SectionAccordion>
          )}

          {tailored.tailored_skills?.length > 0 && (
            <SectionAccordion title="Skills">
              <div className="flex flex-wrap gap-2">
                {tailored.tailored_skills.map((s: string, i: number) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-xs text-blue-300 font-medium">{s}</span>
                ))}
              </div>
            </SectionAccordion>
          )}

          {tailored.added_keywords?.length > 0 && (
            <SectionAccordion title="Added Keywords">
              <div className="flex flex-wrap gap-2">
                {tailored.added_keywords.map((kw: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/15">
                    <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-xs text-green-300 font-bold shrink-0">+{kw.keyword}</span>
                    <span className="text-xs text-white/40">{kw.reason}</span>
                  </div>
                ))}
              </div>
            </SectionAccordion>
          )}

          {tailored.suggested_improvements?.length > 0 && (
            <SectionAccordion title="Suggested Improvements">
              <div className="space-y-3">
                {tailored.suggested_improvements.map((imp: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-white/3 border border-white/8 space-y-1.5">
                    <p className="text-xs text-white/30 line-through">{imp.original}</p>
                    <p className="text-sm text-green-400 font-medium">{imp.improved}</p>
                    <p className="text-xs text-white/40 italic">{imp.why}</p>
                  </div>
                ))}
              </div>
            </SectionAccordion>
          )}
        </div>
      </Card>

      {/* Version history */}
      {history.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Version History ({history.length} snapshots)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((h: any, i: number) => (
                <div key={h.id} className="flex items-center gap-3 text-sm text-white/40 p-2 rounded-lg bg-white/[0.02]">
                  <span className="text-xs font-mono text-white/20">#{i + 1}</span>
                  <span>{new Date(h.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compare modal */}
      <Dialog open={showDiff} onOpenChange={setShowDiff}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Compare Versions</DialogTitle></DialogHeader>
          <Select value={compareVersionId} onValueChange={setCompareVersionId}>
            <SelectTrigger><SelectValue placeholder="Select version to compare..." /></SelectTrigger>
            <SelectContent>
              {allVersions.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.version_name}</SelectItem>)}
            </SelectContent>
          </Select>
          {compareVersionId && (
            <div className="mt-4">
              <VersionDiff versionA={version} versionB={allVersions.find((v: any) => v.id === compareVersionId)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiff(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export modal */}
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Export Resume</DialogTitle></DialogHeader>
          <ExportCenter versionId={version.id} versionName={version.version_name} onClose={() => setShowExport(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
