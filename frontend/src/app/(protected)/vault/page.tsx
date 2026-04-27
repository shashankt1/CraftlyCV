'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  FileText, Plus, Trash2, Edit3, Check, X, ChevronDown, ChevronUp,
  Loader2, Sparkles, Copy, ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'

const NICHE_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'nursing', label: 'Nursing' },
  { value: 'skilled_trades', label: 'Skilled Trades' },
  { value: 'creative_tech', label: 'Creative Tech' },
]

interface Experience {
  id?: string
  company: string
  title: string
  startDate: string
  endDate: string
  current: boolean
  bullets: string[]
}

interface MasterResume {
  id: string
  fullName: string
  email: string
  phone: string
  location: string
  professionalSummary: string
  experience: Experience[]
  skills: string[]
  certifications: string[]
  primaryNiche: string
  isPrimary: boolean
}

export default function VaultPage() {
  const router = useRouter()
  const supabase = createClient()
  const [master, setMaster] = useState<MasterResume | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedExp, setExpandedExp] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', location: '',
    professionalSummary: '', primaryNiche: 'general',
  })
  const [experience, setExperience] = useState<Experience[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [certifications, setCertifications] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [certInput, setCertInput] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data } = await supabase
        .from('master_resumes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single()

      if (data) {
        setMaster(data)
        setForm({
          fullName: data.full_name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          location: data.location ?? '',
          professionalSummary: data.professional_summary ?? '',
          primaryNiche: data.primary_niche ?? 'general',
        })
        setExperience(data.experience ?? [])
        setSkills(data.skills ?? [])
        setCertifications(data.certifications ?? [])
      }
      setLoading(false)
    }
    load()
  }, [router, supabase])

  const handleSave = async () => {
    setSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        ...form,
        experience,
        skills,
        certifications,
        isPrimary: true,
      }

      let res: Response
      if (master?.id) {
        payload.id = master.id
        res = await fetch('/api/master-resume', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        res = await fetch('/api/master-resume', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }

      const json = await res.json()
      if (!json.success) { toast.error(json.message); return }

      setMaster(json.data)
      toast.success('Resume saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const addExperience = () => {
    setExperience(prev => [...prev, { company: '', title: '', startDate: '', endDate: '', current: false, bullets: [''] }])
  }

  const updateExperience = (i: number, field: keyof Experience, value: any) => {
    setExperience(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e))
  }

  const removeExperience = (i: number) => {
    setExperience(prev => prev.filter((_, idx) => idx !== i))
  }

  const addBullet = (i: number) => {
    setExperience(prev => prev.map((e, idx) => idx === i ? { ...e, bullets: [...e.bullets, ''] } : e))
  }

  const updateBullet = (expIdx: number, bulletIdx: number, value: string) => {
    setExperience(prev => prev.map((e, i) => i === expIdx ? { ...e, bullets: e.bullets.map((b, j) => j === bulletIdx ? value : b) } : e))
  }

  const addSkill = () => {
    if (!skillInput.trim()) return
    setSkills(prev => [...prev, skillInput.trim()])
    setSkillInput('')
  }

  const removeSkill = (i: number) => setSkills(prev => prev.filter((_, idx) => idx !== i))
  const addCert = () => {
    if (!certInput.trim()) return
    setCertifications(prev => [...prev, certInput.trim()])
    setCertInput('')
  }
  const removeCert = (i: number) => setCertifications(prev => prev.filter((_, idx) => idx !== i))

  if (loading) {
    return <div className="space-y-4 max-w-3xl"><Skeleton className="h-96" /></div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Master Resume</h1>
          <p className="text-sm text-muted-foreground">Your career foundation — tailor from here</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Resume'}
        </Button>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Personal Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Full Name</label>
              <Input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="John Doe" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Phone</label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 555 000 0000" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Location</label>
              <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="San Francisco, CA" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Professional Niche</label>
              <Select value={form.primaryNiche} onValueChange={v => setForm(p => ({ ...p, primaryNiche: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NICHE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Professional Summary</label>
              <Textarea value={form.professionalSummary} onChange={e => setForm(p => ({ ...p, professionalSummary: e.target.value }))} rows={4} placeholder="Brief summary of your experience and expertise..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Experience</CardTitle>
            <Button size="sm" variant="outline" onClick={addExperience}>
              <Plus className="h-3 w-3 mr-1" />Add Job
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {experience.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No experience added yet.
            </p>
          )}
          {experience.map((exp, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Job {i + 1}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setExpandedExp(expandedExp === String(i) ? null : String(i))}>
                    {expandedExp === String(i) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="text-red-500" onClick={() => removeExperience(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Company</label>
                  <Input value={exp.company} onChange={e => updateExperience(i, 'company', e.target.value)} placeholder="Company name" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Title</label>
                  <Input value={exp.title} onChange={e => updateExperience(i, 'title', e.target.value)} placeholder="Job title" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                  <Input value={exp.startDate} onChange={e => updateExperience(i, 'startDate', e.target.value)} placeholder="Jan 2020" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">End Date</label>
                  <Input value={exp.endDate} onChange={e => updateExperience(i, 'endDate', e.target.value)} placeholder={exp.current ? 'Present' : 'Dec 2023'} disabled={exp.current} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={exp.current} onChange={e => updateExperience(i, 'current', e.target.checked)} className="rounded" />
                <span className="text-sm">Currently working here</span>
              </div>
              {expandedExp === String(i) && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Achievement Bullets</label>
                  {exp.bullets.map((bullet, j) => (
                    <div key={j} className="flex gap-2">
                      <Textarea value={bullet} onChange={e => updateBullet(i, j, e.target.value)} rows={2} placeholder="• Achieved X by doing Y..." className="text-sm min-h-[60px]" />
                      <Button size="icon" variant="ghost" onClick={() => setExperience(prev => prev.map((e, idx) => idx === i ? { ...e, bullets: e.bullets.filter((_, bj) => bj !== j) } : e))}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => addBullet(i)}>
                    <Plus className="h-3 w-3 mr-1" />Add Bullet
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder="Add a skill..." className="flex-1" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
            <Button onClick={addSkill} variant="outline"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1.5">
                {s}
                <button onClick={() => removeSkill(i)} className="hover:text-red-500 ml-1"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
          {skills.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No skills added</p>}
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Certifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={certInput} onChange={e => setCertInput(e.target.value)} placeholder="Add a certification..." className="flex-1" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCert())} />
            <Button onClick={addCert} variant="outline"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {certifications.map((c, i) => (
              <Badge key={i} variant="outline" className="gap-1 pr-1.5">
                {c}
                <button onClick={() => removeCert(i)} className="hover:text-red-500 ml-1"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
          {certifications.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No certifications added</p>}
        </CardContent>
      </Card>

      {/* CTA */}
      {master && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  )
}
