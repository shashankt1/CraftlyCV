'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, AlertCircle, ChevronRight, ChevronLeft, CheckCheck, X, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { SplitDiff } from '@/components/tailor/split-diff'

interface TailorResult {
  tailored_summary: string
  tailored_experience: Array<{ role: string; company: string; bullets: string[] }>
  tailored_skills: string[]
  added_keywords: Array<{ keyword: string; reason: string }>
  suggested_improvements: Array<{ original: string; improved: string; why: string }>
  ats_score_estimate: number
  version_name: string
  versionId: string
}

const STEPS = ['Source', 'Job Description', 'Details', 'Tailor']

const NICHE_OPTIONS = [
  { id: 'software', label: 'Software / Tech' },
  { id: 'nursing', label: 'Nursing / Healthcare' },
  { id: 'cybersecurity', label: 'Cybersecurity' },
  { id: 'trades', label: 'Skilled Trades' },
  { id: 'fresher', label: 'Fresher / Entry-level' },
  { id: 'creative', label: 'Creative / Design' },
]

function PaywallModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full space-y-4 text-center">
        <AlertCircle className="h-10 w-10 text-yellow-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Tailoring costs 2 scans</h2>
        <p className="text-white/50 text-sm">You need at least 2 scans to use the Resume Tailoring Engine. Upgrade to Pro for unlimited tailoring.</p>
        <Button className="w-full" onClick={() => window.location.href = '/billing'}>
          Upgrade to Pro — ₹499/month
        </Button>
        <Button variant="ghost" className="w-full text-white/40" onClick={() => window.location.href = '/pricing'}>
          View all plans
        </Button>
      </div>
    </div>
  )
}

export default function TailorPage() {
  const [step, setStep] = useState(0)
  const [sourceMode, setSourceMode] = useState<'paste' | 'master'>('paste')
  const [resumeText, setResumeText] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [niche, setNiche] = useState('software')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TailorResult | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [autoSaveIndicator, setAutoSaveIndicator] = useState('')
  const [showPreviewBlurred, setShowPreviewBlurred] = useState(true)

  // Accept/reject state for improvements
  const [accepted, setAccepted] = useState<Record<string, boolean>>({})

  const canProceed = () => {
    if (step === 0) return resumeText.trim().length > 10
    if (step === 1) return jobDesc.trim().length > 20
    return true
  }

  const handleTailor = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDesc, company, role, niche }),
      })
      const json = await res.json()
      if (res.status === 402) { setShowPaywall(true); return }
      if (!res.ok) { toast.error(json.message || 'Tailoring failed'); return }
      setResult(json.data)
      setStep(4)
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptAll = () => {
    if (!result) return
    const all: Record<string, boolean> = {}
    result.suggested_improvements.forEach((imp, i) => {
      all[`imp_${i}`] = true
    })
    setAccepted(all)
  }

  const handleSaveVersion = async () => {
    if (!result || saved) return
    setSaving(true)
    try {
      const res = await fetch(`/api/versions/${result.versionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })
      if (res.ok) {
        setSaved(true)
        toast.success('Version saved!')
        window.location.href = `/versions`
      } else {
        toast.error('Failed to save version')
      }
    } catch {
      toast.error('Failed to save version')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Resume Tailoring Engine</h1>
        <p className="text-white/40 text-sm mt-1">AI-rewrite your resume for any job description.</p>
      </div>

      {/* ── STEP PROGRESS ── */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-black border-2 transition-all ${i < step ? 'bg-blue-600 border-blue-600 text-white' : i === step ? 'border-blue-500 text-blue-400' : 'border-white/20 text-white/30'}`}>
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-semibold ${i === step ? 'text-white' : 'text-white/30'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-blue-600' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      {/* ══ STEP 0: SOURCE ══ */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/8 w-fit">
            <button onClick={() => setSourceMode('paste')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${sourceMode === 'paste' ? 'bg-blue-600 text-white' : 'text-white/50'}`}>Paste Resume</button>
            <button onClick={() => setSourceMode('master')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${sourceMode === 'master' ? 'bg-blue-600 text-white' : 'text-white/50'}`}>Use Master Resume</button>
          </div>
          {sourceMode === 'paste' ? (
            <Textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              className="min-h-72 text-white resize-none bg-white/[0.03] border-white/8 rounded-xl"
            />
          ) : (
            <div className="p-8 rounded-2xl bg-white/3 border border-white/8 text-center text-white/40">
              <p className="text-sm">Master resume selector — connect your vault to use this option.</p>
              <Button variant="outline" className="mt-4" onClick={() => setSourceMode('paste')}>Use paste instead</Button>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setStep(1)} disabled={!canProceed()} className="gap-1.5">Next <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </motion.div>
      )}

      {/* ══ STEP 1: JOB DESC ══ */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div>
            <p className="text-sm font-medium text-white/70 mb-2">Paste the job description</p>
            <Textarea
              value={jobDesc}
              onChange={e => setJobDesc(e.target.value)}
              placeholder="Paste the full job description here..."
              className="min-h-72 text-white resize-none bg-white/[0.03] border-white/8 rounded-xl"
            />
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(0)} className="gap-1.5 text-white/50"><ChevronLeft className="h-4 w-4" /> Back</Button>
            <Button onClick={() => setStep(2)} disabled={!canProceed()} className="gap-1.5">Next <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </motion.div>
      )}

      {/* ══ STEP 2: DETAILS + NICHE ══ */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Company (optional)</label>
              <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. TCS, Google, Infosys" className="bg-white/[0.03] border-white/8" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Target Role (optional)</label>
              <Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Software Engineer" className="bg-white/[0.03] border-white/8" />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/70">Niche Pack</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {NICHE_OPTIONS.map(n => (
                <button
                  key={n.id}
                  onClick={() => setNiche(n.id)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${niche === n.id ? 'bg-blue-600/10 border-blue-500/40 text-blue-300' : 'bg-white/3 border-white/8 text-white/50 hover:text-white'}`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)} className="gap-1.5 text-white/50"><ChevronLeft className="h-4 w-4" /> Back</Button>
            <Button onClick={() => setStep(3)} className="gap-1.5">Next <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </motion.div>
      )}

      {/* ══ STEP 3: CONFIRM ══ */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="rounded-2xl bg-white/3 border border-white/8 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Ready to tailor</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-white/30 text-xs uppercase tracking-widest">Source</p>
                <p className="text-white/70 font-medium">{resumeText.slice(0, 50)}...</p>
              </div>
              <div className="space-y-1">
                <p className="text-white/30 text-xs uppercase tracking-widest">Target Role</p>
                <p className="text-white/70 font-medium">{role || 'Not specified'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-white/30 text-xs uppercase tracking-widest">Niche</p>
                <p className="text-white/70 font-medium">{NICHE_OPTIONS.find(n => n.id === niche)?.label}</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-300">Tailoring uses 2 scans. Free users: make sure you have enough scans.</p>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)} className="gap-1.5 text-white/50"><ChevronLeft className="h-4 w-4" /> Back</Button>
            <Button onClick={handleTailor} disabled={loading} className="gap-1.5">
              {loading ? <><span className="animate-spin">⏳</span> Tailoring...</> : <>Tailor My Resume (2 scans) <ChevronRight className="h-4 w-4" /></>}
            </Button>
          </div>
        </motion.div>
      )}

      {/* ══ STEP 4: RESULTS ══ */}
      {step === 4 && result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">{result.version_name}</h2>
              <Badge className="bg-green-500/10 border border-green-500/25 text-green-400 text-xs font-bold">
                ATS: {result.ats_score_estimate}%
              </Badge>
              {autoSaveIndicator && <span className="text-xs text-white/30 animate-pulse">{autoSaveIndicator}</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setStep(0)}>New Tailor</Button>
              <Button size="sm" className="gap-1.5" onClick={handleSaveVersion} disabled={saving || saved}>
                {saving ? 'Saving...' : saved ? <><Check className="h-4 w-4" /> Saved!</> : <><CheckCheck className="h-4 w-4" /> Save Version</>}
              </Button>
            </div>
          </div>

          {/* Split diff view */}
          <SplitDiff original={resumeText} tailored={result} />

          {/* Accept all */}
          {result.suggested_improvements.length > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/8">
              <p className="text-sm text-white/50">{result.suggested_improvements.length} suggested improvements</p>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleAcceptAll}>
                <CheckCheck className="h-4 w-4" /> Accept All
              </Button>
            </div>
          )}

          {/* Added keywords */}
          {result.added_keywords.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest">Added Keywords</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {result.added_keywords.map((kw, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/3 border border-white/8 flex gap-3">
                    <span className="px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/25 text-xs text-green-400 font-bold flex-shrink-0">{kw.keyword}</span>
                    <p className="text-xs text-white/50 leading-relaxed">{kw.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested improvements accordion */}
          {result.suggested_improvements.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest">Suggested Improvements</h3>
              {result.suggested_improvements.map((imp, i) => (
                <div key={i} className="rounded-xl border border-white/8 overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <button
                      onClick={() => setAccepted(prev => ({ ...prev, [`imp_${i}`]: !prev[`imp_${i}`] }))}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${accepted[`imp_${i}`] ? 'bg-green-600 border-green-600' : 'border-white/20'}`}
                    >
                      {accepted[`imp_${i}`] && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-white/30 line-through">{imp.original}</p>
                      {accepted[`imp_${i}`] && (
                        <p className="text-sm text-green-400 font-medium">{imp.improved}</p>
                      )}
                    </div>
                  </div>
                  {accepted[`imp_${i}`] && (
                    <div className="px-4 pb-4 pt-0">
                      <p className="text-xs text-white/40 italic ml-9">{imp.why}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {showPaywall && <PaywallModal />}
    </div>
  )
}
