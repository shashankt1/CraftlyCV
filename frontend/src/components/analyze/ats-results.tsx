'use client'

import { useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Shield, AlertTriangle, Check, ChevronDown, Download, Linkedin, Twitter, MessageCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { HealthScoreGauge } from '@/components/ui/health-score-gauge'

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

function SectionAccordion({ sections }: { sections: ATSResult['section_feedback'] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="rounded-xl border border-white/8 bg-white/3 overflow-hidden">
      {sections.map((s, i) => (
        <div key={s.section} className="border-b border-white/5 last:border-0">
          <button onClick={() => setOpen(open === i ? null : i)} className="w-full px-5 py-4 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-white">{s.section}</span>
              <span className="text-xs font-bold text-white/40">{s.score}/100</span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={s.score} className="w-20 h-1.5" />
              <ChevronDown className={`h-4 w-4 text-white/30 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </div>
          </button>
          {open === i && (
            <div className="px-5 pb-4 space-y-3">
              <p className="text-sm text-white/50">{s.feedback}</p>
              {s.suggestions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">Suggestions</p>
                  <ul className="space-y-1.5">
                    {s.suggestions.map((sug, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-white/60">
                        <Check className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function KeywordChip({ keyword, matched }: { keyword: string; matched: boolean }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${matched
      ? 'bg-green-500/10 border-green-500/25 text-green-400'
      : 'bg-red-500/10 border-red-500/25 text-red-400'
      }`}>
      {matched ? '✓' : '✗'} {keyword}
    </span>
  )
}

function SubScoreBar({ label, score, delay = 0 }: { label: string; score: number; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-white/60">{label}</span>
        <span className={`font-bold ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
          initial={{ width: 0 }}
          animate={{ width: inView ? `${score}%` : 0 }}
          transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  )
}

interface ATSScoreGaugeProps {
  score: number
}

function ATSScoreGauge({ score }: ATSScoreGaugeProps) {
  const [displayed, setDisplayed] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const duration = 1500
    const frame = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * score))
      if (progress < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [score])

  return (
    <div className="relative flex items-center justify-center">
      <HealthScoreGauge score={displayed} size="lg" />
    </div>
  )
}

export function ATSResults({ result, shareId }: { result: ATSResult; shareId: string }) {
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/score/${shareId}` : ''
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I got an ATS score of ${result.ats_score}/100 on CraftlyCV — find out yours!`)}&url=${encodeURIComponent(shareUrl)}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check your ATS score for free: ${shareUrl}`)}`

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* ── SCORE HERO ── */}
      <div className="text-center py-8">
        <ATSScoreGauge score={result.ats_score} />
        <p className="mt-4 text-white/40 text-sm max-w-md mx-auto">{result.overall_summary}</p>
      </div>

      {/* ── SUB-SCORES ── */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white/3 border border-white/8">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Keyword Match</p>
          <SubScoreBar label="" score={result.keyword_score} delay={0} />
        </div>
        <div className="p-5 rounded-2xl bg-white/3 border border-white/8">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Formatting</p>
          <SubScoreBar label="" score={result.formatting_score} delay={0.1} />
        </div>
        <div className="p-5 rounded-2xl bg-white/3 border border-white/8">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Readability</p>
          <SubScoreBar label="" score={result.readability_score} delay={0.2} />
        </div>
      </div>

      {/* ── KEYWORDS ── */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <p className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Missing Keywords
          </p>
          <div className="flex flex-wrap gap-2">
            {result.missing_keywords.map(kw => <KeywordChip key={kw} keyword={kw} matched={false} />)}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
            <Check className="h-4 w-4" /> Matched Keywords
          </p>
          <div className="flex flex-wrap gap-2">
            {result.matched_keywords.map(kw => <KeywordChip key={kw} keyword={kw} matched />)}
          </div>
        </div>
      </div>

      {/* ── TOP 3 IMPROVEMENTS ── */}
      <div className="p-6 rounded-2xl bg-blue-600/10 border border-blue-500/25">
        <p className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-4">Top 3 Improvements</p>
        <ul className="space-y-3">
          {result.top_3_improvements.map((imp, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-white/80">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">{i + 1}</span>
              <span>{imp}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── SECTION ACCORDION ── */}
      {result.section_feedback.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-white/50 mb-3">Section Breakdown</p>
          <SectionAccordion sections={result.section_feedback} />
        </div>
      )}

      {/* ── FORMATTING RISKS ── */}
      {result.formatting_risks.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Formatting Risks
          </p>
          <ul className="space-y-2">
            {result.formatting_risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-white/50">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── PROOF GAPS ── */}
      {result.proof_gaps.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-white/50 mb-3">Achievement Gaps</p>
          <ul className="space-y-2">
            {result.proof_gaps.map((gap, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-white/40">
                <Shield className="h-3.5 w-3.5 text-white/30 flex-shrink-0 mt-0.5" />
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── SHARE ── */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(`/api/score-card/${shareId}`, '_blank')}>
          <Download className="h-4 w-4" /> Download Score Card
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(linkedInUrl, '_blank')}>
          <Linkedin className="h-4 w-4" /> LinkedIn
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(twitterUrl, '_blank')}>
          <Twitter className="h-4 w-4" /> Share on X
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(whatsappUrl, '_blank')}>
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </Button>
      </div>
    </div>
  )
}
