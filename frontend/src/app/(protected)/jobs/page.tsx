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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  DragDropProvider, Draggable, Droppable
} from '@/components/ui/drag-drop-wrapper'
import {
  Plus, Briefcase, MapPin, DollarSign, Link2, Calendar,
  ExternalLink, Clock, Loader2, X, Filter, Download, ChevronRight,
  GripVertical
} from 'lucide-react'
import { toast } from 'sonner'

const COLUMNS = [
  { id: 'wishlist', label: 'Wishlist', color: 'text-zinc-400', bgColor: 'bg-zinc-800/50' },
  { id: 'applied', label: 'Applied', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20' },
  { id: 'interview', label: 'Interview Scheduled', color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  { id: 'offer', label: 'Offer Received', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
  { id: 'rejected', label: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/20' },
  { id: 'withdrawn', label: 'Withdrawn', color: 'text-zinc-500', bgColor: 'bg-zinc-800/30' },
]

const STATUS_OPTIONS = ['all', 'wishlist', 'applied', 'interview', 'offer', 'rejected', 'withdrawn']

interface JobApp {
  id: string
  company: string
  role: string
  status: string
  applied_date?: string
  resume_version_id?: string
  resume_version_name?: string
  salary?: string
  job_url?: string
  notes?: string
  interview_date?: string
  created_at: string
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function getFaviconUrl(company: string) {
  const domain = company.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') + '.com'
  return `https://logo.clearbit.com/${domain}`
}

function getInterviewCountdown(dateStr?: string) {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  if (days < 0) return null
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

function JobCard({ job, onClick, index }: { job: JobApp; onClick: () => void; index: number }) {
  const countdown = getInterviewCountdown(job.interview_date)

  return (
    <Draggable draggableId={job.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`p-3 rounded-lg bg-zinc-800/70 border border-zinc-700/50 hover:border-zinc-600 cursor-pointer transition-all group ${snapshot.isDragging ? 'ring-2 ring-indigo-500' : ''}`}
        >
          <div className="flex items-start gap-2">
            <GripVertical className="h-4 w-4 text-zinc-600 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-zinc-100 truncate">{job.company}</p>
                {job.resume_version_name && (
                  <Badge className="text-[10px] bg-indigo-500/20 text-indigo-400 border-indigo-500/30 shrink-0">
                    {job.resume_version_name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 truncate">{job.role}</p>
              <div className="flex items-center gap-3 mt-2">
                {job.applied_date && (
                  <span className="text-[11px] text-zinc-600">{formatDate(job.applied_date)}</span>
                )}
                {countdown && (
                  <span className="text-[11px] text-amber-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {countdown}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}

export default function JobsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [jobs, setJobs] = useState<JobApp[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobApp | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [saving, setSaving] = useState(false)
  const [versions, setVersions] = useState<any[]>([])

  const [form, setForm] = useState({
    company: '', role: '', status: 'wishlist', applied_date: '', resume_version_id: '',
    salary: '', job_url: '', notes: '', interview_date: '',
  })

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      loadJobs()
      loadVersions()
    }
    checkAuth()
  }, [])

  async function loadJobs() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setJobs(data || [])
    setLoading(false)
  }

  async function loadVersions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('resume_versions').select('id, version_name').eq('user_id', user.id)
    setVersions(data || [])
  }

  async function handleAddJob() {
    if (!form.company.trim()) { toast.error('Company is required'); return }
    if (!form.role.trim()) { toast.error('Role is required'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: job, error } = await supabase
        .from('job_applications')
        .insert({ ...form, user_id: user!.id, applied_date: form.applied_date || null, interview_date: form.interview_date || null })
        .select()
        .single()
      if (error) throw error
      setJobs(prev => [job, ...prev])
      setShowAddModal(false)
      setForm({ company: '', role: '', status: 'wishlist', applied_date: '', resume_version_id: '', salary: '', job_url: '', notes: '', interview_date: '' })
      toast.success('Application added')
    } catch { toast.error('Failed to add') }
    finally { setSaving(false) }
  }

  async function handleUpdateJob(id: string, updates: Partial<JobApp>) {
    const { error } = await supabase.from('job_applications').update(updates).eq('id', id)
    if (error) { toast.error('Update failed'); return }
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j))
    if (selectedJob?.id === id) setSelectedJob(prev => prev ? { ...prev, ...updates } : null)
    toast.success('Updated')
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('job_applications').delete().eq('id', id)
    if (error) { toast.error('Delete failed'); return }
    setJobs(prev => prev.filter(j => j.id !== id))
    setShowDetail(false)
    setSelectedJob(null)
    toast.success('Deleted')
  }

  async function handleDragEnd(result: any) {
    const { draggableId, destination } = result
    if (!destination) return
    const newStatus = destination.droppableId
    await handleUpdateJob(draggableId, { status: newStatus })
  }

  const stats = {
    total: jobs.length,
    active: jobs.filter(j => ['applied', 'interview', 'wishlist'].includes(j.status)).length,
    responseRate: jobs.length > 0 ? Math.round((jobs.filter(j => ['interview', 'offer'].includes(j.status)).length / jobs.length) * 100) : 0,
    offers: jobs.filter(j => j.status === 'offer').length,
  }

  const filteredJobs = statusFilter === 'all' ? jobs : jobs.filter(j => j.status === statusFilter)
  const jobsByColumn = COLUMNS.reduce((acc, col) => {
    acc[col.id] = filteredJobs.filter(j => j.status === col.id)
    return acc
  }, {} as Record<string, JobApp[]>)

  const exportCSV = () => {
    const headers = ['Company', 'Role', 'Status', 'Applied Date', 'Salary', 'Notes']
    const rows = filteredJobs.map(j => [j.company, j.role, j.status, j.applied_date || '', j.salary || '', j.notes || ''])
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'job-applications.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto space-y-4"><Skeleton className="h-96 w-full rounded-xl" /></div>
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Job Tracker</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{stats.total} total applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="border-zinc-700 text-zinc-400">
            <Download className="h-4 w-4 mr-2" />Export CSV
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-1.5" />Add Application
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
          <p className="text-xl font-bold text-zinc-100">{stats.total}</p>
          <p className="text-xs text-zinc-500">Total Applied</p>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
          <p className="text-xl font-bold text-zinc-100">{stats.active}</p>
          <p className="text-xs text-zinc-500">Active</p>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
          <p className="text-xl font-bold text-zinc-100">{stats.responseRate}%</p>
          <p className="text-xs text-zinc-500">Response Rate</p>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
          <p className="text-xl font-bold text-emerald-400">{stats.offers}</p>
          <p className="text-xs text-zinc-500">Offers</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-zinc-500" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All statuses' : COLUMNS.find(c => c.id === s)?.label || s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <DragDropProvider onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNS.map(col => (
            <div key={col.id} className="shrink-0 w-72">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('text-xs font-semibold uppercase tracking-wider', col.color)}>{col.label}</span>
                <Badge className="bg-zinc-800 text-zinc-400 text-xs">{jobsByColumn[col.id]?.length || 0}</Badge>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'min-h-[200px] rounded-lg border transition-colors p-2 space-y-2',
                    col.bgColor, col.id === 'applied' ? 'border-blue-500/20' : 'border-zinc-800',
                    snapshot.isDraggingOver ? 'bg-zinc-700/30' : ''
                  )}>
                  {jobsByColumn[col.id]?.map((job, idx) => (
                    <JobCard key={job.id} job={job} onClick={() => { setSelectedJob(job); setShowDetail(true) }} index={idx} />
                  ))}
                </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropProvider>

      {/* Add Application Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Application</DialogTitle>
            <DialogDescription>Track a new job application</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Company *</label>
                <Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Google" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Role *</label>
                <Input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} placeholder="Software Engineer" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Applied Date</label>
                <Input type="date" value={form.applied_date} onChange={e => setForm(p => ({ ...p, applied_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Salary (optional)</label>
                <Input value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} placeholder="$120,000" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Interview Date</label>
                <Input type="datetime-local" value={form.interview_date} onChange={e => setForm(p => ({ ...p, interview_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Job URL</label>
              <Input value={form.job_url} onChange={e => setForm(p => ({ ...p, job_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Linked Version</label>
              <Select value={form.resume_version_id} onValueChange={v => setForm(p => ({ ...p, resume_version_id: v }))}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {versions.map(v => <SelectItem key={v.id} value={v.id}>{v.version_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes</label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddJob} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              {saving ? 'Saving...' : 'Add Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Detail Slide-in Panel */}
      {showDetail && selectedJob && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowDetail(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full overflow-y-auto animate-in slide-in-from-right duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800 p-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-zinc-100">{selectedJob.company}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowDetail(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-400">{selectedJob.role}</span>
                <Badge className={cn(
                  'capitalize text-xs',
                  COLUMNS.find(c => c.id === selectedJob.status)?.color || 'text-zinc-400'
                )}>
                  {selectedJob.status}
                </Badge>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Applied Date', value: selectedJob.applied_date ? new Date(selectedJob.applied_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                  { label: 'Salary', value: selectedJob.salary || '—' },
                  { label: 'Job URL', value: selectedJob.job_url, isLink: true },
                  { label: 'Interview', value: selectedJob.interview_date ? new Date(selectedJob.interview_date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—' },
                ].map(({ label, value, isLink }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="text-xs text-zinc-500 w-24 shrink-0">{label}</span>
                    {isLink && value ? (
                      <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                        {value} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-300">{value}</span>
                    )}
                  </div>
                ))}
              </div>

              {selectedJob.notes && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1.5">Notes</p>
                  <p className="text-sm text-zinc-300">{selectedJob.notes}</p>
                </div>
              )}

              <div className="border-t border-zinc-800 pt-4 space-y-2">
                <p className="text-xs text-zinc-500 mb-2">Change Status</p>
                <div className="flex flex-wrap gap-2">
                  {COLUMNS.map(col => (
                    <button
                      key={col.id}
                      onClick={() => { handleUpdateJob(selectedJob.id, { status: col.id }); setSelectedJob(prev => prev ? { ...prev, status: col.id } : prev) }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        selectedJob.status === col.id
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                      )}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4 flex justify-between">
                <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedJob.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />Delete
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Trash2({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
}