'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus, Sparkles, Copy, Trash2, ArrowRight, Filter, Loader2, Target, ChevronLeft
} from 'lucide-react'
import { toast } from 'sonner'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
  { value: 'applied', label: 'Applied' },
]

function VersionCard({ version, onDuplicate, onDelete }: {
  version: any; onDuplicate: (v: any) => void; onDelete: (id: string) => void
}) {
  const scoreColor = version.ats_score >= 80 ? 'text-green-400' : version.ats_score >= 60 ? 'text-yellow-400' : 'text-red-400'
  const statusVariant = version.status === 'applied' ? 'default' : version.status === 'ready' ? 'default' : 'secondary'

  return (
    <Card className="hover:bg-white/5 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-sm font-bold text-white truncate">{version.version_name || 'Untitled'}</h3>
              <Badge variant={statusVariant as 'default' | 'secondary'} className="text-xs capitalize shrink-0">
                {version.status}
              </Badge>
            </div>
            {version.tailored_for_company && (
              <p className="text-xs text-white/40 mb-1">{version.tailored_for_company}{version.tailored_for_role ? ` · ${version.tailored_for_role}` : ''}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              {version.ats_score ? (
                <span className={`text-sm font-bold ${scoreColor}`}>{version.ats_score}/100 ATS</span>
              ) : (
                <span className="text-xs text-white/30 italic">Not analyzed yet</span>
              )}
              <span className="text-xs text-white/30">
                {new Date(version.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/versions/${version.id}`}><ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => onDuplicate(version)} title="Duplicate">
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon-sm" variant="ghost" className="text-red-400/70 hover:text-red-400" onClick={() => onDelete(version.id)} title="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function VersionsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ versionName: '', targetCompany: '', targetRole: '', jobDescription: '' })

  useEffect(() => {
    const { data: { user } } = supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    loadVersions()
  }, [])

  async function loadVersions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setVersions(data || [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.versionName.trim()) { toast.error('Version name required'); return }
    if (!form.jobDescription.trim() || form.jobDescription.length < 50) { toast.error('Job description must be 50+ characters'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionName: form.versionName, targetCompany: form.targetCompany, targetRole: form.targetRole, jobDescription: form.jobDescription }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      setVersions(prev => [json.data, ...prev])
      setShowCreate(false)
      setForm({ versionName: '', targetCompany: '', targetRole: '', jobDescription: '' })
      toast.success('Version created!')
      router.push(`/versions/${json.data.id}`)
    } catch { toast.error('Failed to create version') }
    finally { setCreating(false) }
  }

  async function handleDuplicate(version: any) {
    const res = await fetch('/api/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        versionName: `${version.version_name || 'Version'} (copy)`,
        targetCompany: version.tailored_for_company,
        targetRole: version.tailored_for_role,
        jobDescription: version.job_description,
      }),
    })
    const json = await res.json()
    if (res.ok) { setVersions(prev => [json.data, ...prev]); toast.success('Duplicated') }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/versions/${id}`, { method: 'DELETE' })
    if (res.ok) { setVersions(prev => prev.filter(v => v.id !== id)); toast.success('Deleted') }
  }

  const filtered = versions.filter(v => statusFilter === 'all' || v.status === statusFilter)
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'score') return (b.ats_score || 0) - (a.ats_score || 0)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Resume Versions</h1>
          <p className="text-white/40 text-sm mt-0.5">{versions.length} version{versions.length !== 1 ? 's' : ''} total</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1.5" />New Version</Button>
      </div>

      {/* Filters */}
      {versions.length > 0 && (
        <div className="flex gap-3 items-center">
          <Filter className="h-4 w-4 text-white/30" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Newest first</SelectItem>
              <SelectItem value="score">Highest score</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Empty state */}
      {versions.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Target className="h-12 w-12 text-white/10 mb-4" />
            <h3 className="text-lg font-semibold text-white/60 mb-2">No versions yet</h3>
            <p className="text-sm text-white/30 mb-6 max-w-sm">Create your first tailored resume version by providing a job description.</p>
            <Button onClick={() => setShowCreate(true)}><Sparkles className="h-4 w-4 mr-2" />Create First Version</Button>
          </CardContent>
        </Card>
      )}

      {/* Grid */}
      {sorted.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(v => <VersionCard key={v.id} version={v} onDuplicate={handleDuplicate} onDelete={handleDelete} />)}
        </div>
      )}

      {/* Create modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>New Version</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Version name *</label>
              <Input value={form.versionName} onChange={e => setForm(p => ({ ...p, versionName: e.target.value }))} placeholder="e.g., TCS — Senior Developer" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Company (optional)</label>
                <Input value={form.targetCompany} onChange={e => setForm(p => ({ ...p, targetCompany: e.target.value }))} placeholder="TCS / Google" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Role (optional)</label>
                <Input value={form.targetRole} onChange={e => setForm(p => ({ ...p, targetRole: e.target.value }))} placeholder="Software Engineer" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Job description * (50+ chars)</label>
              <Textarea value={form.jobDescription} onChange={e => setForm(p => ({ ...p, jobDescription: e.target.value }))} rows={7} placeholder="Paste the full job description for ATS analysis..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : <><Sparkles className="h-4 w-4 mr-2" />Create & Tailor</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
