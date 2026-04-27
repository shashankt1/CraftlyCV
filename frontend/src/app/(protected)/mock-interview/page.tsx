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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Mic, Brain, Clock, ChevronRight, RotateCcw, Download,
  Star, ArrowRight, AlertCircle, Loader2, Volume2, VolumeX, Check
} from 'lucide-react'
import { toast } from 'sonner'

const NICHES = ['Software', 'Nursing', 'Cybersecurity', 'Trades', 'Fresher', 'Creative']
const INTERVIEW_TYPES = ['Behavioral', 'Technical', 'HR']

interface Question {
  text: string
  answer?: string
  scores?: {
    clarity: number
    relevance: number
    star_structure: number
    confidence_indicators: number
    feedback: string
    improved_version: string
  }
}

interface Session {
  id?: string
  role: string
  niche: string
  interview_type: string
  num_questions: number
  questions: Question[]
  overall_score?: number
}

function UpgradeGate({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <Card className="max-w-xl mx-auto bg-zinc-900/80 border-zinc-800">
      <CardContent className="p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto">
          <Brain className="h-7 w-7 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Pro Feature</h2>
          <p className="text-sm text-zinc-500 mt-1">Mock Interviews are available for Pro and Lifetime plan users.</p>
        </div>
        <Button onClick={onUpgrade} className="bg-indigo-600 hover:bg-indigo-700">
          <Star className="h-4 w-4 mr-2" />Upgrade to Pro
        </Button>
      </CardContent>
    </Card>
  )
}

function QuestionCard({ question, index, total, onSubmit, isSubmitting, onVoiceToggle, voiceOn }: {
  question: string; index: number; total: number; onSubmit: (a: string) => void; isSubmitting: boolean; onVoiceToggle: () => void; voiceOn: boolean
}) {
  const [answer, setAnswer] = useState('')
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500">Question {index + 1} of {total}</span>
        <Progress value={((index + 1) / total) * 100} className="flex-1" />
      </div>

      {/* Question */}
      <div className="p-5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
        <p className="text-base font-medium text-zinc-100 leading-relaxed">{question}</p>
      </div>

      {/* Answer area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-300">Your Answer</label>
          <div className="flex items-center gap-2">
            <span className={cn('text-xs', wordCount >= 150 && wordCount <= 300 ? 'text-emerald-400' : 'text-zinc-500')}>
              {wordCount} words
            </span>
            <Button variant="ghost" size="icon" onClick={onVoiceToggle} className="h-8 w-8 text-zinc-400">
              {voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <Textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          rows={6}
          placeholder="Type your answer here... Good answers are 150-300 words."
          className="min-h-[160px] resize-none"
        />
        <p className="text-xs text-zinc-600 text-right">Aim for 150-300 words for best results</p>
      </div>

      <Button
        onClick={() => onSubmit(answer)}
        disabled={isSubmitting || answer.trim().length < 20}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
      >
        {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : <><Check className="h-4 w-4 mr-2" />Submit Answer</>}
      </Button>
    </div>
  )
}

function ScoreDisplay({ scores }: { scores: Question['scores'] }) {
  if (!scores) return null
  const total = Math.round((scores.clarity + scores.relevance + scores.star_structure + scores.confidence_indicators) / 4)

  return (
    <div className="space-y-4 p-5 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">Score breakdown</span>
        <Badge className={cn(
          'text-sm font-bold',
          total >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
          total >= 60 ? 'bg-amber-500/20 text-amber-400' :
          'bg-red-500/20 text-red-400'
        )}>
          {total}/100
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          { label: 'Clarity', value: scores.clarity },
          { label: 'Relevance', value: scores.relevance },
          { label: 'STAR Structure', value: scores.star_structure },
          { label: 'Confidence', value: scores.confidence_indicators },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/50">
            <span className="text-zinc-500 text-xs">{label}</span>
            <span className={cn(
              'text-sm font-bold',
              value >= 80 ? 'text-emerald-400' : value >= 60 ? 'text-amber-400' : 'text-red-400'
            )}>{value}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-xs text-zinc-500 mb-1">Feedback</p>
        <p className="text-sm text-zinc-300">{scores.feedback}</p>
      </div>
      <div>
        <p className="text-xs text-zinc-500 mb-1">Improved version</p>
        <p className="text-sm text-indigo-300 italic">{scores.improved_version}</p>
      </div>
    </div>
  )
}

export default function MockInterviewPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [setupDone, setSetupDone] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [voiceOn, setVoiceOn] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  const [setupForm, setSetupForm] = useState({
    role: '', niche: 'Software', interview_type: 'Behavioral', num_questions: '5', job_description: '',
  })

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

  const handleStartSession = async () => {
    if (!setupForm.role.trim()) { toast.error('Role title is required'); return }
    if (!isPro) return

    setIsGenerating(true)
    try {
      const res = await fetch('/api/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setSession(json.data)
      setSetupDone(true)
      toast.success('Session started!')
    } catch (e: any) {
      toast.error(e.message || 'Failed to start session')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmitAnswer = async (answer: string) => {
    if (!session) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/mock-interview/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: session.questions[currentIndex].text,
          answer,
          interview_type: session.interview_type,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      const updated = { ...session }
      updated.questions = [...session.questions]
      updated.questions[currentIndex] = {
        ...updated.questions[currentIndex],
        answer,
        scores: json.data,
      }
      setSession(updated)

      if (currentIndex < session.num_questions - 1) {
        setTimeout(() => setCurrentIndex(prev => prev + 1), 1500)
      } else {
        const allScores = updated.questions.filter(q => q.scores).map(q => {
          const s = q.scores!
          return (s.clarity + s.relevance + s.star_structure + s.confidence_indicators) / 4
        })
        const overall = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        updated.overall_score = overall

        // Save to database
        await supabase.from('interview_sessions').insert({
          user_id: profile.id,
          role: session.role,
          niche: session.niche,
          interview_type: session.interview_type,
          questions: updated.questions.map(q => q.text),
          answers: updated.questions.map(q => q.answer || ''),
          scores: updated.questions.map(q => q.scores || null),
          overall_score: overall,
        })

        setShowSummary(true)
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to score answer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownloadReport = () => {
    if (!session) return
    const content = [
      `CraftlyCV Mock Interview Report`,
      `Role: ${session.role}`,
      `Niche: ${session.niche}`,
      `Type: ${session.interview_type}`,
      `Overall Score: ${session.overall_score}/100`,
      '',
      ...session.questions.map((q, i) => [
        `--- Question ${i + 1} ---`,
        q.text,
        `Answer: ${q.answer || 'No answer'}`,
        q.scores ? `Score: ${Math.round((q.scores.clarity + q.scores.relevance + q.scores.star_structure + q.scores.confidence_indicators) / 4)}/100` : '',
        q.scores ? `Feedback: ${q.scores.feedback}` : '',
        q.scores ? `Improved: ${q.scores.improved_version}` : '',
        '',
      ].join('\n')),
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `interview-report-${Date.now()}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto"><Skeleton className="h-96 w-full rounded-xl" /></div>
  }

  if (!isPro) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-zinc-100">Mock Interview</h1>
          <p className="text-zinc-500 mt-1">Practice with AI-generated questions and get scored feedback.</p>
        </div>
        <UpgradeGate onUpgrade={() => router.push('/billing')} />
      </div>
    )
  }

  // Setup step
  if (!setupDone) {
    return (
      <div className="max-w-xl mx-auto py-8 space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-3">
            <Mic className="h-7 w-7 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Mock Interview</h1>
          <p className="text-zinc-500 mt-1">Practice makes perfect. Get AI-scored feedback on your answers.</p>
        </div>

        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Target Role *</label>
              <Input
                value={setupForm.role}
                onChange={e => setSetupForm(p => ({ ...p, role: e.target.value }))}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Niche</label>
                <Select value={setupForm.niche} onValueChange={v => setSetupForm(p => ({ ...p, niche: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NICHES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Interview Type</label>
                <Select value={setupForm.interview_type} onValueChange={v => setSetupForm(p => ({ ...p, interview_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Number of Questions</label>
              <Select value={setupForm.num_questions} onValueChange={v => setSetupForm(p => ({ ...p, num_questions: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Questions</SelectItem>
                  <SelectItem value="10">10 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Job Description (optional)</label>
              <Textarea
                value={setupForm.job_description}
                onChange={e => setSetupForm(p => ({ ...p, job_description: e.target.value }))}
                rows={4}
                placeholder="Paste the job description for role-specific questions..."
              />
            </div>
            <Button
              onClick={handleStartSession}
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating questions...</> : <><Brain className="h-4 w-4 mr-2" />Start Interview</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Summary
  if (showSummary && session) {
    const sorted = [...session.questions].sort((a, b) => {
      const scoreA = a.scores ? (a.scores.clarity + a.scores.relevance + a.scores.star_structure + a.scores.confidence_indicators) / 4 : 0
      const scoreB = b.scores ? (b.scores.clarity + b.scores.relevance + b.scores.star_structure + b.scores.confidence_indicators) / 4 : 0
      return scoreB - scoreA
    })
    const strongest = sorted[0]
    const weakest = sorted[sorted.length - 1]

    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-100">Session Complete</h2>
          <p className="text-zinc-500 mt-1">Here's how you did</p>
        </div>

        {/* Overall Score */}
        <div className="text-center p-8 rounded-xl bg-gradient-to-b from-indigo-500/10 to-transparent border border-indigo-500/20">
          <p className="text-5xl font-bold text-zinc-100">{session.overall_score}</p>
          <p className="text-sm text-zinc-500 mt-1">Overall Score</p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-emerald-400 font-medium mb-1">Strongest Answer</p>
              <p className="text-sm text-zinc-300 line-clamp-2">{strongest.text}</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-amber-400 font-medium mb-1">Needs Work</p>
              <p className="text-sm text-zinc-300 line-clamp-2">{weakest.text}</p>
            </CardContent>
          </Card>
        </div>

        {/* Full Review */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader><CardTitle className="text-base">Full Session Review</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {session.questions.map((q, i) => (
              <div key={i} className="space-y-3 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-zinc-600 shrink-0 mt-1">Q{i + 1}.</span>
                  <p className="text-sm text-zinc-200">{q.text}</p>
                </div>
                {q.answer && (
                  <div className="ml-4 border-l-2 border-zinc-700 pl-3">
                    <p className="text-xs text-zinc-500 mb-1">Your answer:</p>
                    <p className="text-sm text-zinc-400">{q.answer}</p>
                  </div>
                )}
                {q.scores && <ScoreDisplay scores={q.scores} />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setSetupDone(false); setShowSummary(false); setSession(null) }} className="flex-1 border-zinc-700">
            <RotateCcw className="h-4 w-4 mr-2" />Practice Again
          </Button>
          <Button onClick={handleDownloadReport} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
            <Download className="h-4 w-4 mr-2" />Download Report
          </Button>
        </div>
      </div>
    )
  }

  // Interview session
  if (session) {
    const current = session.questions[currentIndex]
    return (
      <div className="max-w-xl mx-auto py-8 space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-zinc-100">{session.role} Interview</h2>
          <p className="text-sm text-zinc-500">{session.niche} · {session.interview_type}</p>
        </div>
        <QuestionCard
          question={current.text}
          index={currentIndex}
          total={session.num_questions}
          onSubmit={handleSubmitAnswer}
          isSubmitting={isSubmitting}
          onVoiceToggle={() => setVoiceOn(!voiceOn)}
          voiceOn={voiceOn}
        />
        {current.scores && <ScoreDisplay scores={current.scores} />}
      </div>
    )
  }

  return null
}