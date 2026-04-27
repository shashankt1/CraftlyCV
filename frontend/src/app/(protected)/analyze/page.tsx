'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, Loader2, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ATSResults } from '@/components/analyze/ats-results'

interface ATSResult {
  ats_score: number
  keyword_score: number
  formatting_score: number
  readability_score: number
  missing_keywords: string[]
  matched_keywords: string[]
  formatting_risks: string[]
  section_feedback: Array<{ section: string; score: number; feedback: string; suggestions: string[] }>
  proof_gaps: string[]
  overall_summary: string
  top_3_improvements: string[]
  share_id: string
}

function PaywallModal({ scans }: { scans: number }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-yellow-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">You're out of free scans</h2>
        <p className="text-white/50 text-sm">You've used all 3 of your free ATS scans. Upgrade to Pro for unlimited analysis.</p>
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

export default function AnalyzePage() {
  const router = useRouter()
  const [mode, setMode] = useState<'upload' | 'paste'>('paste')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ATSResult | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hiddenFileRef = useRef<HTMLInputElement>(null)

  const handleAnalyze = async () => {
    if (!resumeFile && !resumeText.trim()) {
      toast.error('Please upload a resume or paste resume text')
      return
    }

    setLoading(true)
    try {
      const deductRes = await fetch('/api/scans/deduct', { method: 'POST' })
      const deductJson = await deductRes.json()
      if (deductRes.status === 402) {
        setShowPaywall(true)
        setLoading(false)
        return
      }

      const formData = new FormData()
      if (mode === 'upload' && resumeFile) {
        formData.append('resume', resumeFile)
      } else {
        formData.append('resumeText', resumeText)
      }
      if (jobDesc.trim()) formData.append('jobDesc', jobDesc)

      const res = await fetch('/api/analyze', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.message || 'Analysis failed')
        return
      }

      setResult(json.data)
      sessionStorage.setItem('lastAnalysis', JSON.stringify(json.data))
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB')
      return
    }
    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      toast.error('Only PDF and DOCX files supported')
      return
    }
    setResumeFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileChange(file)
  }, [])

  if (result) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">ATS Analysis Results</h1>
            <p className="text-white/40 text-sm mt-1">Share ID: {result.share_id}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setResult(null)}>New Analysis</Button>
        </div>
        <ATSResults result={result} shareId={result.share_id} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">ATS Resume Analyzer</h1>
        <p className="text-white/40 text-sm">Upload your resume or paste the text — get your ATS score in seconds.</p>
      </div>

      {/* ── MODE TABS ── */}
      <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/8 w-fit">
        <button onClick={() => setMode('paste')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'paste' ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'}`}>
          Paste Text
        </button>
        <button onClick={() => setMode('upload')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'upload' ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'}`}>
          Upload PDF / DOCX
        </button>
      </div>

      {/* ── UPLOAD MODE ── */}
      {mode === 'upload' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => hiddenFileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragOver ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-white/20'}`}
        >
          <input ref={hiddenFileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f) }} />
          {resumeFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="h-6 w-6 text-blue-400" />
              <span className="text-white font-medium">{resumeFile.name}</span>
              <button onClick={e => { e.stopPropagation(); setResumeFile(null) }}><X className="h-4 w-4 text-white/40" /></button>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-white/30 mx-auto mb-3" />
              <p className="text-white/50 text-sm">Drag & drop or click to upload</p>
              <p className="text-white/20 text-xs mt-1">PDF or DOCX, max 5MB</p>
            </>
          )}
        </div>
      )}

      {/* ── PASTE MODE ── */}
      {mode === 'paste' && (
        <Textarea
          value={resumeText}
          onChange={e => setResumeText(e.target.value)}
          placeholder="Paste your resume text here..."
          className="min-h-64 text-white resize-none bg-white/[0.03] border-white/8 rounded-xl"
        />
      )}

      {/* ── JOB DESC (optional) ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/70">Job Description (optional)</span>
          <Badge variant="secondary" className="text-xs">enables keyword match</Badge>
        </div>
        <Textarea
          value={jobDesc}
          onChange={e => setJobDesc(e.target.value)}
          placeholder="Paste the job description to get keyword-matched feedback..."
          className="min-h-32 text-white resize-none bg-white/[0.03] border-white/8 rounded-xl"
        />
      </div>

      {/* ── ANALYZE BUTTON ── */}
      <Button onClick={handleAnalyze} disabled={loading || (!resumeFile && !resumeText.trim())} size="xl" className="w-full gap-2">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</> : 'Analyze My Resume'}
      </Button>

      {showPaywall && <PaywallModal scans={0} />}
    </div>
  )
}
