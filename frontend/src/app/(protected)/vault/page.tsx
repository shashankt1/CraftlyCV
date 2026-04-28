'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  FileText, Plus, Trash2, Check, X, ChevronDown, ChevronUp,
  Loader2, Sparkles, ArrowRight, Lightbulb, GripVertical
} from 'lucide-react'
import { toast } from 'sonner'
import { HealthScoreGauge } from '@/components/ui/health-score-gauge'

/* ── Content shape ── */
interface MasterContent {
  full_name?: string; email?: string; phone?: string; location?: string
  professional_summary?: string; primary_niche?: string
  experience?: Experience[]
  education?: Education[]
  projects?: Project[]
  certifications?: Certification[]
  skills?: SkillsGroups
  achievements?: Achievement[]
  languages?: Language[]
  niche_tags?: string[]
}
interface Experience { id: string; company: string; title: string; start_date: string; end_date: string; is_current: boolean; bullets: Bullet[]; niche_tags?: string[] }
interface Bullet { id: string; text: string }
interface Education { id: string; institution: string; degree: string; field: string; year: string; grade: string }
interface Project { id: string; name: string; description: string; tech_stack: string[]; url: string; impact: string }
interface Certification { id: string; name: string; issuer: string; date: string; credential_id: string; url: string }
interface SkillsGroups { technical: string[]; tools: string[]; platforms: string[]; soft_skills: string[] }
interface Achievement { id: string; title: string; description: string; date: string }
interface Language { id: string; name: string; proficiency: string }

const NICHE_OPTIONS = [
  { value: 'software', label: 'Software / Tech' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'nursing', label: 'Nursing / Healthcare' },
  { value: 'trades', label: 'Skilled Trades' },
  { value: 'fresher', label: 'Fresher / Entry-level' },
  { value: 'creative', label: 'Creative / Design' },
]
const NICHE_SUGGESTIONS: Record<string, string[]> = {
  software: ['GitHub link + README', 'Quantified project metrics', 'Cloud platform (AWS/GCP/Azure)', 'CI/CD experience', 'Open source contributions'],
  cybersecurity: ['CompTIA Security+', 'SIEM tool exposure', 'Pen testing projects', 'CVE disclosures', 'Security blog writing'],
  nursing: ['EMR system experience', 'BLS/ACLS certification', 'Patient load metrics', 'Specialty unit experience', 'Clinical rotation log'],
  trades: ['Certification numbers', 'Tool inventory', 'Safety training records', 'Apprenticeship hours', 'Blueprint reading'],
  fresher: ['GitHub portfolio', 'Online certifications', 'Academic project details', 'Internship log', 'Volunteer work'],
  creative: ['Behance/Dribbble link', 'Design system experience', 'Accessibility knowledge', 'UX case study links', 'Tool proficiency (Figma etc)'],
}

function uuid() { return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10) }

function SectionCard({ title, children, onAdd, emptyText }: { title: string; children: React.ReactNode; onAdd?: () => void; emptyText?: string }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/3 transition-colors">
        <span className="text-sm font-bold text-white/70 uppercase tracking-widest">{title}</span>
        <div className="flex items-center gap-2">
          {onAdd && <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); onAdd() }}><Plus className="h-4 w-4" /></Button>}
          {open ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
        </div>
      </button>
      {open && <div className="px-5 pb-5">{children || <p className="text-sm text-white/25 py-4 text-center">{emptyText || 'No items yet'}</p>}</div>}
    </div>
  )
}

function EditableField({ value, onSave, placeholder, multiline, className }: {
  value: string; onSave: (v: string) => void; placeholder?: string; multiline?: boolean; className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  useEffect(() => { setDraft(value) }, [value])

  const save = useCallback(async () => {
    if (draft === value) { setEditing(false); return }
    setSaving(true)
    await onSave(draft)
    setSaving(false)
    setEditing(false)
  }, [draft, value, onSave])

  if (!editing) {
    return (
      <div onClick={() => setEditing(true)} className={`cursor-pointer px-3 py-2 rounded-lg border border-transparent hover:border-white/10 transition-all ${!value ? 'text-white/30' : 'text-white/80'} ${className}`}>
        {value || placeholder}
      </div>
    )
  }
  return multiline
    ? <Textarea value={draft} onChange={e => setDraft(e.target.value)} rows={3} className="text-sm" autoFocus onBlur={save} />
    : <Input value={draft} onChange={e => setDraft(e.target.value)} className="text-sm" autoFocus onBlur={save} onKeyDown={e => e.key === 'Enter' && save()} />
}

/* ── Completeness sidebar widget ── */
function CompletenessWidget({ score, niche }: { score: number; niche: string }) {
  const suggestions = NICHE_SUGGESTIONS[niche] || []
  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-3"><CardTitle className="text-sm">Vault Completeness</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center"><HealthScoreGauge score={score} size="sm" /></div>
        <Progress value={score} className="h-1.5" />
        <p className="text-xs text-center text-white/30">{score}% complete</p>
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Niche suggestions</p>
            <ul className="space-y-1.5">
              {suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-white/40">
                  <Lightbulb className="h-3 w-3 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function VaultPage() {
  const router = useRouter()
  const supabase = createClient()
  const [masterId, setMasterId] = useState<string | null>(null)
  const [content, setContent] = useState<MasterContent>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    setUserId(user.id)
    const { data } = await supabase.from('master_resumes').select('*').eq('user_id', user.id).single()
    if (data) {
      setMasterId(data.id)
      setContent(data.content || {})
    }
    setLoading(false)
  }, [router, supabase])

  useEffect(() => { load() }, [load])

  const autoSave = useCallback(async (updatedContent: MasterContent) => {
    setSaving(true)
    const filled = Object.values(updatedContent).filter(v => {
      if (!v) return false
      if (Array.isArray(v)) return v.length > 0
      if (typeof v === 'object') return Object.keys(v).length > 0
      return String(v).trim().length > 0
    }).length
    const completeness_score = Math.round((filled / 8) * 100)

    if (masterId) {
      const { error } = await supabase.from('master_resumes').update({
        content: updatedContent,
        completeness_score,
        updated_at: new Date().toISOString(),
      }).eq('id', masterId)
      if (error) toast.error('Auto-save failed')
    } else {
      const { data, error } = await supabase.from('master_resumes').insert({
        user_id: userId,
        content: updatedContent,
        completeness_score,
      }).select().single()
      if (error) toast.error('Auto-save failed')
      else setMasterId(data.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [masterId, supabase, userId])

  const update = <K extends keyof MasterContent>(key: K, value: MasterContent[K]) => {
    const next = { ...content, [key]: value }
    setContent(next)
    autoSave(next)
  }

  /* Experience helpers */
  const addExp = () => update('experience', [...(content.experience || []), { id: uuid(), company: '', title: '', start_date: '', end_date: '', is_current: false, bullets: [], niche_tags: [] }])
  const rmExp = (i: number) => update('experience', content.experience?.filter((_, idx) => idx !== i) || [])
  const updExp = (i: number, field: string, value: unknown) => update('experience', content.experience?.map((e, idx) => idx === i ? { ...e, [field]: value } : e) || [])
  const addBullet = (expIdx: number) => updExp(expIdx, 'bullets', [...(content.experience?.[expIdx]?.bullets || []), { id: uuid(), text: '' }])
  const updBullet = (expIdx: number, bIdx: number, text: string) => updExp(expIdx, 'bullets', content.experience?.[expIdx]?.bullets?.map((b, i) => i === bIdx ? { ...b, text } : b) || [])
  const rmBullet = (expIdx: number, bIdx: number) => updExp(expIdx, 'bullets', content.experience?.[expIdx]?.bullets?.filter((_, i) => i !== bIdx) || [])

  /* Education helpers */
  const addEdu = () => update('education', [...(content.education || []), { id: uuid(), institution: '', degree: '', field: '', year: '', grade: '' }])
  const rmEdu = (i: number) => update('education', content.education?.filter((_, idx) => idx !== i) || [])
  const updEdu = (i: number, field: string, value: string) => update('education', content.education?.map((e, idx) => idx === i ? { ...e, [field]: value } : e) || [])

  /* Project helpers */
  const addProj = () => update('projects', [...(content.projects || []), { id: uuid(), name: '', description: '', tech_stack: [], url: '', impact: '' }])
  const rmProj = (i: number) => update('projects', content.projects?.filter((_, idx) => idx !== i) || [])
  const updProj = (i: number, field: string, value: unknown) => update('projects', content.projects?.map((p, idx) => idx === i ? { ...p, [field]: value } : p) || [])

  /* Certification helpers */
  const addCert = () => update('certifications', [...(content.certifications || []), { id: uuid(), name: '', issuer: '', date: '', credential_id: '', url: '' }])
  const rmCert = (i: number) => update('certifications', content.certifications?.filter((_, idx) => idx !== i) || [])
  const updCert = (i: number, field: string, value: string) => update('certifications', content.certifications?.map((c, idx) => idx === i ? { ...c, [field]: value } : c) || [])

  /* Skills helpers */
  const addSkillToGroup = (group: keyof SkillsGroups, val: string) => {
    const groups = content.skills || { technical: [], tools: [], platforms: [], soft_skills: [] }
    update('skills', { ...groups, [group]: [...(groups[group] || []), val] })
  }
  const rmSkillFromGroup = (group: keyof SkillsGroups, i: number) => {
    const groups = content.skills || { technical: [], tools: [], platforms: [], soft_skills: [] }
    update('skills', { ...groups, [group]: groups[group]?.filter((_: unknown, idx: number) => idx !== i) || [] })
  }

  if (loading) return <div className="space-y-4 max-w-4xl"><Skeleton className="h-[600px]" /></div>

  const completeness_score = 0 // placeholder — real calculation happens in API
  const primary_niche = content.primary_niche || 'software'

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Master Resume Vault</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {saving ? 'Saving...' : saved ? <span className="text-green-400 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Saved</span> : 'Auto-saves on every change'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/tailor')}>New Tailor <ArrowRight className="h-4 w-4 ml-1" /></Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── MAIN EDITOR ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Personal info */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-xs font-medium text-white/40">Full Name</label><EditableField value={content.full_name || ''} onSave={v => update('full_name', v)} placeholder="Your full name" /></div>
                <div className="space-y-1"><label className="text-xs font-medium text-white/40">Email</label><EditableField value={content.email || ''} onSave={v => update('email', v)} placeholder="email@example.com" /></div>
                <div className="space-y-1"><label className="text-xs font-medium text-white/40">Phone</label><EditableField value={content.phone || ''} onSave={v => update('phone', v)} placeholder="+91 XXXXX XXXXX" /></div>
                <div className="space-y-1"><label className="text-xs font-medium text-white/40">Location</label><EditableField value={content.location || ''} onSave={v => update('location', v)} placeholder="City, State" /></div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/40">Primary Niche</label>
                <Select value={content.primary_niche || 'software'} onValueChange={v => update('primary_niche', v)}>
                  <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>{NICHE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/40">Professional Summary</label>
                <EditableField value={content.professional_summary || ''} onSave={v => update('professional_summary', v)} placeholder="Brief summary of your experience and expertise..." multiline />
              </div>
            </CardContent>
          </Card>

          {/* Experience */}
          <SectionCard title="Work Experience" onAdd={addExp} emptyText="Add your work experience. CraftlyCV will tailor it for every job you apply to.">
            {content.experience?.map((exp, i) => (
              <div key={exp.id} className="mb-5 p-4 rounded-xl bg-white/3 border border-white/8 space-y-3 last:mb-0">
                <div className="flex items-center justify-between">
                  <GripVertical className="h-4 w-4 text-white/20 cursor-grab" />
                  <Button size="icon" variant="ghost" className="text-red-400" onClick={() => rmExp(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  <div className="space-y-1"><label className="text-xs font-medium text-white/30">Company</label><EditableField value={exp.company} onSave={v => updExp(i, 'company', v)} placeholder="Company name" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium text-white/30">Title</label><EditableField value={exp.title} onSave={v => updExp(i, 'title', v)} placeholder="Software Engineer" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium text-white/30">Start Date</label><EditableField value={exp.start_date} onSave={v => updExp(i, 'start_date', v)} placeholder="Jan 2022" /></div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/30">End Date</label>
                    <div className="flex items-center gap-2">
                      <EditableField value={exp.end_date} onSave={v => updExp(i, 'end_date', v)} placeholder={exp.is_current ? 'Present' : 'Dec 2024'} />
                      <label className="flex items-center gap-1 text-xs text-white/30 whitespace-nowrap"><input type="checkbox" checked={exp.is_current} onChange={e => updExp(i, 'is_current', e.target.checked)} className="rounded" />Current</label>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-white/30">Achievement Bullets</label>
                    <Button size="sm" variant="ghost" onClick={() => addBullet(i)}><Plus className="h-3 w-3 mr-1" />Add</Button>
                  </div>
                  <div className="space-y-2">
                    {exp.bullets.map((b, j) => (
                      <div key={b.id} className="flex gap-2 items-start">
                        <span className="text-white/20 mt-2">•</span>
                        <EditableField value={b.text} onSave={v => updBullet(i, j, v)} placeholder="• Achieved X by doing Y (include metrics)" multiline />
                        <Button size="icon" variant="ghost" className="text-white/30 mt-1" onClick={() => rmBullet(i, j)}><X className="h-3 w-3" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </SectionCard>

          {/* Education */}
          <SectionCard title="Education" onAdd={addEdu} emptyText="Add your educational background.">
            {content.education?.map((edu, i) => (
              <div key={edu.id} className="mb-4 flex gap-3 items-start">
                <div className="flex-1 grid sm:grid-cols-2 gap-2">
                  <div className="space-y-1"><label className="text-xs font-medium text-white/30">Institution</label><EditableField value={edu.institution} onSave={v => updEdu(i, 'institution', v)} placeholder="NIT / IIT / University" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium text-white/30">Degree</label><EditableField value={edu.degree} onSave={v => updEdu(i, 'degree', v)} placeholder="B.Tech / MBA / BSc" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium text-white/30">Field of Study</label><EditableField value={edu.field} onSave={v => updEdu(i, 'field', v)} placeholder="Computer Science" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium text-white/30">Year / Grade</label><EditableField value={edu.year || edu.grade} onSave={v => updEdu(i, 'year', v)} placeholder="2024 / 8.5 CGPA" /></div>
                </div>
                <Button size="icon" variant="ghost" className="text-red-400 mt-6" onClick={() => rmEdu(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
          </SectionCard>

          {/* Projects */}
          <SectionCard title="Projects" onAdd={addProj} emptyText="Add personal or academic projects with measurable impact.">
            {content.projects?.map((p, i) => (
              <div key={p.id} className="mb-4 p-4 rounded-xl bg-white/3 border border-white/8 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1"><label className="text-xs font-medium text-white/30">Project Name</label><EditableField value={p.name} onSave={v => updProj(i, 'name', v)} placeholder="Project name" /></div>
                  <Button size="icon" variant="ghost" className="text-red-400" onClick={() => rmProj(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="space-y-1"><label className="text-xs font-medium text-white/30">Description</label><EditableField value={p.description} onSave={v => updProj(i, 'description', v)} placeholder="What does this project do?" multiline /></div>
                <div className="space-y-1"><label className="text-xs font-medium text-white/30">Tech Stack (comma-separated)</label><EditableField value={(p.tech_stack || []).join(', ')} onSave={v => updProj(i, 'tech_stack', v.split(',').map(s => s.trim()).filter(Boolean))} placeholder="React, Node.js, PostgreSQL" /></div>
                <div className="space-y-1"><label className="text-xs font-medium text-white/30">Impact Statement</label><EditableField value={p.impact} onSave={v => updProj(i, 'impact', v)} placeholder="Used by X users / improved performance by Y%" multiline /></div>
              </div>
            ))}
          </SectionCard>

          {/* Certifications */}
          <SectionCard title="Certifications" onAdd={addCert} emptyText="Add professional certifications and credentials.">
            {content.certifications?.map((cert, i) => (
              <div key={cert.id} className="mb-3 flex gap-3 items-start">
                <div className="flex-1 grid sm:grid-cols-2 gap-2">
                  <div className="space-y-1"><label className="text-xs font-medium text-white/30">Certification</label><EditableField value={cert.name} onSave={v => updCert(i, 'name', v)} placeholder="AWS Solutions Architect" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium text-white/30">Issuer</label><EditableField value={cert.issuer} onSave={v => updCert(i, 'issuer', v)} placeholder="Amazon / Coursera / Google" /></div>
                  <div className="space-y-1"><label className="text-xs font-medium text-white/30">Date / Credential ID</label><EditableField value={cert.date || cert.credential_id} onSave={v => updCert(i, 'date', v)} placeholder="Dec 2024 / ABC123XYZ" /></div>
                </div>
                <Button size="icon" variant="ghost" className="text-red-400 mt-4" onClick={() => rmCert(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
          </SectionCard>

          {/* Skills */}
          <SectionCard title="Skills">
            {(['technical', 'tools', 'platforms', 'soft_skills'] as (keyof SkillsGroups)[]).map(group => (
              <div key={group} className="mb-4">
                <label className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2 block capitalize">{group.replace('_', ' ')}</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(content.skills?.[group] || []).map((s, j) => (
                    <Badge key={j} variant="secondary" className="gap-1 pr-1.5">
                      {s}<button onClick={() => rmSkillFromGroup(group, j)} className="hover:text-red-400 ml-1"><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
                <SkillAdder onAdd={v => addSkillToGroup(group, v)} placeholder={`Add ${group.replace('_', ' ')}...`} />
              </div>
            ))}
          </SectionCard>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="space-y-4">
          <CompletenessWidget score={completeness_score} niche={primary_niche} />
          <Button className="w-full gap-2" onClick={() => router.push('/tailor')}>
            <Sparkles className="h-4 w-4" /> Tailor for a Job
          </Button>
        </div>
      </div>
    </div>
  )
}

/* Small skill adder helper */
function SkillAdder({ onAdd, placeholder }: { onAdd: (v: string) => void; placeholder: string }) {
  const [val, setVal] = useState('')
  return (
    <div className="flex gap-2">
      <Input value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} className="text-sm" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (val.trim()) { onAdd(val.trim()); setVal('') } } }} />
      {val.trim() && <Button size="sm" variant="outline" onClick={() => { onAdd(val.trim()); setVal('') }}><Plus className="h-3 w-3" /></Button>}
    </div>
  )
}
