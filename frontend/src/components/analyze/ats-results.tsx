'use client'

import { useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import {
  Shield, AlertTriangle, Check, ChevronDown, Download, Linkedin, Twitter,
  MessageCircle, FileText, Zap, Target, TrendingUp, AlertOctagon, X, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { HealthScoreGauge } from '@/components/ui/health-score-gauge'

interface HardIssue {
  issue: string
  impact: string
  fix: string
}

interface BulletRewrite {
  original: string
  problem: string
  rewrite: string
}

interface ATSResult {
  ats_score: number
  keyword_score: number
  formatting_score: number
  readability_score: number
  verdict: string
  missing_keywords: string[]
  matched_keywords: string[]
  hard_issues: HardIssue[]
  bullet_rewrites: BulletRewrite[]
  section_scores: {
    summary: number
    skills: number
    experience: number
    education: number
    projects: number
  }
  formatting_risks: string[]
  achievement_gaps: string[]
  top_3_improvements: string[]
  estimated_pass_rate: string
  recruiter_first_impression: string
  share_id: string
}

// ── Sub-components ──────────────────────────────────────────────────────────

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

function SectionScoreRow({ label, score, icon: Icon }: { label: string; score: number; icon: React.ElementType }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className={`h-4 w-4 ${score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'}`} />
        <span className="text-sm text-white/70">{label}</span>
      </div>
      <span className={`text-sm font-bold ${score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
        {score}/100
      </span>
    </div>
  )
}

function BulletRewriteCard({ item, index }: { item: BulletRewrite; index: number }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-xl border border-white/8 bg-white/3 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-black flex items-center justify-center">
            {index + 1}
          </span>
          <span className="text-sm text-white/60 line-clamp-1 font-mono">{item.original.slice(0, 60)}...</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-white/30 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-1">Problem</p>
            <p className="text-sm text-white/50">{item.problem}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-1">Rewrite</p>
            <p className="text-sm text-white/80 bg-green-500/10 rounded-lg px-3 py-2 font-mono border border-green-500/20">
              {item.rewrite}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function HardIssueCard({ item }: { item: HardIssue }) {
  return (
    <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
      <div className="flex items-start gap-3">
        <AlertOctagon className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">{item.issue}</p>
          <p className="text-xs text-red-300">Impact: {item.impact}</p>
          <p className="text-xs text-white/50">
            <span className="text-blue-300 font-semibold">Fix:</span> {item.fix}
          </p>
        </div>
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

// ── Main Component ───────────────────────────────────────────────────────────

export function ATSResults({ result, shareId }: { result: ATSResult; shareId: string }) {
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/score/${shareId}` : ''
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I got an ATS score of ${result.ats_score}/100 on CraftlyCV — find out yours!`)}&url=${encodeURIComponent(shareUrl)}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check your ATS score for free: ${shareUrl}`)}`

  const verdictBg = result.ats_score >= 75
    ? 'bg-green-500/10 border-green-500/25'
    : result.ats_score >= 50
      ? 'bg-yellow-500/10 border-yellow-500/25'
      : 'bg-red-500/10 border-red-500/25'

  const verdictText = result.ats_score >= 75
    ? 'text-green-300'
    : result.ats_score >= 50
      ? 'text-yellow-300'
      : 'text-red-300'

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* ── SCORE HERO ── */}
      <div className="text-center py-8">
        <ATSScoreGauge score={result.ats_score} />
        {/* Verdict */}
        <div className={`mt-4 p-4 rounded-xl border ${verdictBg}`}>
          <p className={`text-sm font-semibold ${verdictText}`}>{result.verdict}</p>
        </div>
        {/* Pass Rate + First Impression */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/8">
            <p className="text-xs text-white/30 uppercase tracking-widest">Estimated Pass Rate</p>
            <p className="text-lg font-bold text-white mt-1">{result.estimated_pass_rate}</p>
          </div>
          <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/8">
            <p className="text-xs text-white/30 uppercase tracking-widest">Recruiter First Impression</p>
            <p className="text-sm font-semibold text-white/70 mt-1 max-w-xs">{result.recruiter_first_impression}</p>
          </div>
        </div>
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

      {/* ── SECTION SCORES ── */}
      <div className="rounded-2xl bg-white/3 border border-white/8 p-5">
        <p className="text-xs text-white/30 uppercase tracking-widest mb-4">Section Scores</p>
        <div className="space-y-0">
          <SectionScoreRow label="Summary" score={result.section_scores?.summary ?? 0} icon={FileText} />
          <SectionScoreRow label="Skills" score={result.section_scores?.skills ?? 0} icon={Target} />
          <SectionScoreRow label="Experience" score={result.section_scores?.experience ?? 0} icon={TrendingUp} />
          <SectionScoreRow label="Education" score={result.section_scores?.education ?? 0} icon={Check} />
          <SectionScoreRow label="Projects" score={result.section_scores?.projects ?? 0} icon={Zap} />
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

      {/* ── HARD ISSUES ── */}
      {result.hard_issues && result.hard_issues.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <AlertOctagon className="h-4 w-4" /> Critical Issues — Fix These First
          </p>
          <div className="space-y-3">
            {result.hard_issues.map((item, i) => (
              <HardIssueCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}

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

      {/* ── BULLET REWRITES ── */}
      {result.bullet_rewrites && result.bullet_rewrites.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Bullet Point Rewrites
          </p>
          <div className="space-y-2">
            {result.bullet_rewrites.map((item, i) => (
              <BulletRewriteCard key={i} item={item} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── FORMATTING RISKS ── */}
      {result.formatting_risks && result.formatting_risks.length > 0 && (
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

      {/* ── ACHIEVEMENT GAPS ── */}
      {result.achievement_gaps && result.achievement_gaps.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" /> Achievement Gaps
          </p>
          <ul className="space-y-2">
            {result.achievement_gaps.map((gap, i) => (
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