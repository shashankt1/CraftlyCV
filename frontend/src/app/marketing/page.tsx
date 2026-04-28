'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Check, FileText, Zap, Shield, TrendingUp, Database, ChevronDown, BarChart3, Target, Search, Mic, FileOutput, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

/* ═══════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS — Editorial, restrained, premium
   "Quiet confidence" — restrained palette, editorial structure, no gimmicks
══════════════════════════════════════════════════════════════════════════════ */

const COLORS = {
  ink: '#0F1117',          // Deep charcoal — primary bg
  surface: '#161A22',      // Card bg
  surfaceRaised: '#1C2028', // Elevated surface
  border: '#2A2F3A',       // Subtle dividers
  borderLight: '#353B4A',  // Light borders
  textPrimary: '#F1F3F5',  // Near-white primary text
  textSecondary: '#9CA3AF', // Muted text
  textMuted: '#6B7280',    // Subtle text
  accent: '#3D5A80',        // Muted navy — restrained, not loud
  accentLight: '#4A6FA5',  // Accent hover
  accentMuted: '#2C4270',  // Dark accent bg
  success: '#4ADE80',      // Soft green
  warning: '#F59E0B',     // Amber
  error: '#F87171',        // Soft red
  cream: '#FAF9F7',        // Light mode bg
  warmBlack: '#1C1917',   // Light text
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATION — Subtle, controlled, premium
══════════════════════════════════════════════════════════════════════════════ */
function useScrollReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  useEffect(() => { /* framer handles this */ }, [inView])
  return { ref }
}

function Reveal({ delay = 0, children, className = '', stagger = false }: {
  delay?: number; children: React.ReactNode; className?: string; stagger?: boolean
}) {
  const { ref } = useScrollReveal(delay)
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* Stagger container */
function StaggerGroup({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } }
      }}
    >
      {children}
    </motion.div>
  )
}

function StaggerItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
    >
      {children}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   NAVIGATION BAR — Clean, minimal, authoritative
══════════════════════════════════════════════════════════════════════════════ */
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#0F1117]/90 backdrop-blur-xl border-b border-[#2A2F3A]' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#3D5A80] flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold text-[#F1F3F5] tracking-tight">CraftlyCV</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { label: 'Analyzer', href: '/#analyzer' },
            { label: 'Tailoring', href: '/#tailoring' },
            { label: 'Vault', href: '/#vault' },
            { label: 'Pricing', href: '/#pricing' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="px-4 py-2 text-sm text-[#9CA3AF] hover:text-[#F1F3F5] hover:bg-[#1C2028] rounded-lg transition-all duration-200">
              {item.label}
            </Link>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-2">
          <Link href="/auth" className="hidden sm:block text-sm text-[#9CA3AF] hover:text-[#F1F3F5] px-3 py-2 rounded-lg hover:bg-[#1C2028] transition-all">
            Sign in
          </Link>
          <Link href="/auth"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-[#3D5A80] hover:bg-[#4A6FA5] text-white transition-colors">
            Start free →
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ATS SCORE RING — Polished, premium, screenshot-worthy
══════════════════════════════════════════════════════════════════════════════ */
function ATSScoreRing({ score = 78, size = 140 }: { score?: number; size?: number }) {
  const radius = (size / 2) - 10
  const circumference = 2 * Math.PI * radius
  const scoreColor = score >= 80 ? COLORS.success : score >= 60 ? COLORS.warning : COLORS.error

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={COLORS.border} strokeWidth="8" />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (score / 100) * circumference}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-[#F1F3F5]">{score}</span>
        <span className="text-[10px] uppercase tracking-widest text-[#6B7280]">ATS Score</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   KEYWORD CHIP — Clean pass/fail indicator
══════════════════════════════════════════════════════════════════════════════ */
function KeywordChip({ word, pass }: { word: string; pass: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${
      pass
        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
        : 'bg-red-500/10 border-red-500/25 text-red-400'
    }`}>
      {pass ? <Check className="h-3 w-3" /> : <span className="text-[10px]">✕</span>}
      {word}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION LABEL — Small caps editorial label
══════════════════════════════════════════════════════════════════════════════ */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[11px] uppercase tracking-widest font-semibold text-[#3D5A80]">{children}</span>
      <div className="h-px bg-[#2A2F3A] flex-1 max-w-[40px]" />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STAT BLOCK — Minimal number with label
══════════════════════════════════════════════════════════════════════════════ */
function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-[#F1F3F5] mb-1">{value}</div>
      <div className="text-xs text-[#6B7280] uppercase tracking-wide">{label}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FEATURE LIST — Clean icon + text, no cards
══════════════════════════════════════════════════════════════════════════════ */
function FeatureListItem({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-[#2A2F3A] last:border-0">
      <div className="w-9 h-9 rounded-lg bg-[#1C2028] border border-[#2A2F3A] flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-[#9CA3AF]" />
      </div>
      <div>
        <p className="text-sm font-medium text-[#F1F3F5] mb-0.5">{title}</p>
        <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FAQ ACCORDION — Clean, minimal
══════════════════════════════════════════════════════════════════════════════ */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#2A2F3A]">
      <button onClick={() => setOpen(!open)} className="w-full py-5 flex items-center justify-between text-left">
        <span className="text-sm font-medium text-[#F1F3F5] pr-4">{q}</span>
        <ChevronDown className={`h-4 w-4 text-[#6B7280] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-5 text-sm text-[#9CA3AF] leading-relaxed">{a}</p>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PRODUCT CARD — Clean, minimal hover
══════════════════════════════════════════════════════════════════════════════ */
function ProductCard({ icon: Icon, label, title, desc }: { icon: any; label: string; title: string; desc: string }) {
  return (
    <div className="group p-6 rounded-xl bg-[#161A22] border border-[#2A2F3A] hover:border-[#3D5A80]/40 transition-all duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#1C2028] border border-[#2A2F3A] flex items-center justify-center">
          <Icon className="h-4 w-4 text-[#3D5A80]" />
        </div>
        <span className="text-[11px] uppercase tracking-widest text-[#6B7280]">{label}</span>
      </div>
      <h3 className="text-base font-semibold text-[#F1F3F5] mb-2">{title}</h3>
      <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PRICING CARD — Clean, no gradients, authority through restraint
══════════════════════════════════════════════════════════════════════════════ */
function PricingCard({ name, price, period, features, highlight, badge }: {
  name: string; price: string; period: string; features: string[]; highlight?: boolean; badge?: string
}) {
  return (
    <div className={`relative rounded-xl p-6 flex flex-col gap-5 ${
      highlight
        ? 'bg-[#161A22] border border-[#3D5A80]/50'
        : 'bg-[#161A22] border border-[#2A2F3A]'
    }`}>
      {badge && (
        <div className="absolute -top-3 left-6">
          <Badge className="bg-[#3D5A80] text-white text-[10px] px-2.5 py-0.5 rounded-full">{badge}</Badge>
        </div>
      )}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-[#6B7280] mb-2">{name}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-[#F1F3F5]">{price}</span>
          <span className="text-sm text-[#6B7280]">{period}</span>
        </div>
      </div>
      <ul className="space-y-2.5 flex-1">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-[#9CA3AF]">
            <Check className="h-4 w-4 text-[#4ADE80] flex-shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button
        variant={highlight ? 'default' : 'outline'}
        size="lg"
        className={`w-full ${highlight ? 'bg-[#3D5A80] hover:bg-[#4A6FA5] text-white' : 'border-[#2A2F3A] text-[#9CA3AF] hover:bg-[#1C2028]'}`}
      >
        {name === 'Free' ? 'Start free' : name === 'Pro' ? 'Get Pro' : 'Get Lifetime'}
      </Button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TESTIMONIAL — Text-first, no cards, editorial pull-quote style
══════════════════════════════════════════════════════════════════════════════ */
function TestimonialBlock({ quote, name, role, score }: { quote: string; name: string; role: string; score?: string }) {
  return (
    <div className="py-6 border-b border-[#2A2F3A] last:border-0">
      {score && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl font-bold text-[#3D5A80]">{score}</span>
          <span className="text-xs text-[#6B7280] uppercase tracking-widest">ATS score jump</span>
        </div>
      )}
      <blockquote className="text-base text-[#F1F3F5] leading-relaxed mb-3 italic">"{quote}"</blockquote>
      <div>
        <p className="text-sm font-medium text-[#9CA3AF]">{name}</p>
        <p className="text-xs text-[#6B7280]">{role}</p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ATS ANALYZER PREVIEW — The signature product surface
══════════════════════════════════════════════════════════════════════════════ */
function ATSAnalyzerPreview() {
  return (
    <div className="rounded-xl bg-[#161A22] border border-[#2A2F3A] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2A2F3A]">
        <div className="w-3 h-3 rounded-full bg-[#2A2F3A]" />
        <div className="w-3 h-3 rounded-full bg-[#2A2F3A]" />
        <div className="w-3 h-3 rounded-full bg-[#3D5A80]" />
        <span className="ml-3 text-xs text-[#6B7280] font-mono">craftlycv.in/analyze</span>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Top row */}
        <div className="flex items-start gap-6">
          <ATSScoreRing score={58} size={120} />
          <div className="flex-1 pt-2 space-y-4">
            {/* Scores */}
            <div className="space-y-3">
              {[
                { label: 'Keyword match', value: 58, pass: false },
                { label: 'Format compliance', value: 84, pass: true },
                { label: 'Bullet structure', value: 41, pass: false },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#6B7280]">{item.label}</span>
                    <span className={`font-medium ${item.pass ? 'text-emerald-400' : 'text-red-400'}`}>{item.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1C2028] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${item.pass ? 'bg-emerald-500' : 'bg-red-500/80'}`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Keyword sections */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#4ADE80] mb-2 flex items-center gap-1.5">
              <Check className="h-3 w-3" /> Matched keywords
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['Python', 'AWS', 'Docker'].map(kw => <KeywordChip key={kw} word={kw} pass />)}
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#F87171] mb-2 flex items-center gap-1.5">
              <span className="text-[10px]">✕</span> Missing keywords
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['Kubernetes', 'CI/CD', 'Terraform'].map(kw => <KeywordChip key={kw} word={kw} pass={false} />)}
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="pt-4 border-t border-[#2A2F3A]">
          <p className="text-xs text-[#6B7280] mb-2">CraftlyCV suggestion strength</p>
          <div className="flex gap-2">
            <span className="text-xs px-2 py-1 rounded bg-[#1C2028] text-[#9CA3AF] border border-[#2A2F3A]">Strong</span>
            <span className="text-xs px-2 py-1 rounded bg-[#1C2028] text-[#6B7280] border border-[#2A2F3A]">CI/CD pipelines</span>
            <span className="text-xs px-2 py-1 rounded bg-[#1C2028] text-[#6B7280] border border-[#2A2F3A]">K8s experience</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAILORED VERSION PREVIEW — Side-by-side comparison
══════════════════════════════════════════════════════════════════════════════ */
function TailoredVersionPreview() {
  return (
    <div className="rounded-xl bg-[#161A22] border border-[#2A2F3A] overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2A2F3A]">
        <div className="w-3 h-3 rounded-full bg-[#2A2F3A]" />
        <div className="w-3 h-3 rounded-full bg-[#2A2F3A]" />
        <div className="w-3 h-3 rounded-full bg-[#3D5A80]" />
        <span className="ml-3 text-xs text-[#6B7280] font-mono">craftlycv.in/tailor</span>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-[#F1F3F5]">Senior Backend Engineer — Stripe</p>
            <p className="text-xs text-[#6B7280]">Tailored version · v3 · 2 hours ago</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded bg-[#3D5A80]/20 border border-[#3D5A80]/40 text-[#4A6FA5]">ATS Safe</span>
            <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">87% match</span>
          </div>
        </div>

        {/* Score comparison */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Before', score: '52', color: COLORS.error },
            { label: 'Tailored', score: '87', color: COLORS.success },
            { label: 'Improvement', score: '+35', color: COLORS.accent },
          ].map((item, i) => (
            <div key={i} className="text-center p-3 rounded-lg bg-[#1C2028] border border-[#2A2F3A]">
              <p className="text-[10px] uppercase tracking-widest text-[#6B7280] mb-1">{item.label}</p>
              <p className="text-xl font-bold" style={{ color: item.color }}>{item.score}</p>
            </div>
          ))}
        </div>

        {/* Bullet comparison */}
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-[#6B7280]">Tailored bullet example</p>
          {[
            { label: 'Before', text: 'Worked on backend systems and APIs', color: COLORS.error },
            { label: 'After', text: 'Architected distributed payment APIs processing $2M+ daily across 12 microservices', color: COLORS.success },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-[10px] uppercase tracking-widest text-[#6B7280] w-12 mt-0.5 shrink-0">{item.label}</span>
              <p className={`text-sm ${i === 0 ? 'text-[#6B7280] line-through' : 'text-[#F1F3F5]'}`}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TRUST BAR — Minimal, text-only
══════════════════════════════════════════════════════════════════════════════ */
const TRUST_COMPANIES = ['TCS', 'Infosys', 'Wipro', 'Amazon', 'Google', 'Microsoft', 'Flipkart', 'Deloitte']

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN MARKETING PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function MarketingPage() {
  return (
    <main className="bg-[#0F1117] text-[#F1F3F5] min-h-screen">
      <Nav />

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 items-start">

            {/* Left — editorial copy, 7 cols */}
            <div className="lg:col-span-7 space-y-8">
              {/* Label */}
              <Reveal>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-px bg-[#3D5A80]" />
                  <span className="text-[11px] uppercase tracking-widest text-[#3D5A80] font-medium">
                    ATS Resume Optimization
                  </span>
                </div>
              </Reveal>

              {/* Headline — editorial, left-aligned */}
              <Reveal delay={0.05}>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#F1F3F5] leading-[1.0] tracking-tight">
                  Your resume is
                  <br />
                  <span className="text-[#3D5A80]">getting rejected</span>
                  <br />
                  before anyone reads it.
                </h1>
              </Reveal>

              {/* Subheadline — restrained */}
              <Reveal delay={0.1}>
                <p className="text-lg text-[#9CA3AF] leading-relaxed max-w-lg">
                  CraftlyCV diagnoses exactly why ATS systems reject your resume,
                  fixes the keyword gaps, and tailors every version for your target role.
                </p>
              </Reveal>

              {/* CTAs */}
              <Reveal delay={0.15}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/auth">
                    <Button size="lg" className="gap-2 bg-[#3D5A80] hover:bg-[#4A6FA5] text-white border-0">
                      Analyze my resume free <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/#how-it-works">
                    <Button variant="outline" size="lg" className="gap-2 border-[#2A2F3A] text-[#9CA3AF] hover:bg-[#1C2028] hover:text-[#F1F3F5]">
                      See how it works
                    </Button>
                  </Link>
                </div>
              </Reveal>

              {/* Proof points — minimal */}
              <Reveal delay={0.2}>
                <div className="flex items-center gap-6 pt-2">
                  {[
                    { value: '50,000+', label: 'resumes analyzed' },
                    { value: '94%', label: 'score improvement' },
                    { value: '30 sec', label: 'analysis time' },
                  ].map((stat, i) => (
                    <div key={i} className={i > 0 ? 'pl-6 border-l border-[#2A2F3A]' : ''}>
                      <div className="text-sm font-bold text-[#F1F3F5]">{stat.value}</div>
                      <div className="text-xs text-[#6B7280]">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Right — ATS analyzer preview, 5 cols */}
            <div className="lg:col-span-5">
              <Reveal delay={0.1}>
                <ATSAnalyzerPreview />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ────────────────────────────────────────────────────── */}
      <section className="py-10 border-y border-[#2A2F3A]">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-[11px] uppercase tracking-widest text-[#6B7280] mb-6">
            Used by job seekers applying to
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {TRUST_COMPANIES.map(c => (
              <span key={c} className="text-sm font-semibold text-[#6B7280]">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROBLEM ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16">
            {/* Left — 5 cols */}
            <div className="lg:col-span-5">
              <Reveal>
                <SectionLabel>Why resumes fail</SectionLabel>
                <h2 className="text-4xl font-bold text-[#F1F3F5] leading-tight mb-4">
                  ATS systems reject 98% of resumes before a human ever sees them.
                </h2>
                <p className="text-[#9CA3AF] leading-relaxed mb-6">
                  It's not about your experience. It's about whether your resume
                  communicates the right keywords, in the right format, for the right system.
                </p>
                <p className="text-[#6B7280] leading-relaxed">
                  Most job seekers don't know what ATS actually reads — they just know
                  they're not getting callbacks.
                </p>
              </Reveal>
            </div>

            {/* Right — 7 cols, stats */}
            <div className="lg:col-span-7 space-y-0">
              <Reveal>
                <div className="space-y-0 divide-y divide-[#2A2F3A]">
                  {[
                    { stat: '72%', title: 'Filtered before review', desc: 'ATS software rejects the majority of applications before a recruiter opens the file.' },
                    { stat: '< 6 sec', title: 'Average resume scan time', desc: 'Recruiters spend less than six seconds on the first pass. Your resume needs to communicate value instantly.' },
                    { stat: '3–5×', title: 'More applications with a tailored resume', desc: 'Jobs that expect specific keywords get 3 to 5 times more applications. ATS-optimized resumes get more interviews.' },
                  ].map((item, i) => (
                    <div key={i} className="py-6">
                      <div className="text-3xl font-bold text-[#F87171] mb-2">{item.stat}</div>
                      <h3 className="text-base font-semibold text-[#F1F3F5] mb-2">{item.title}</h3>
                      <p className="text-sm text-[#6B7280] leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ATS ANALYZER ──────────────────────────────────────────────────── */}
      <section id="analyzer" className="py-24 px-6 bg-[#0D0F14]">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7 space-y-6">
              <Reveal>
                <SectionLabel>ATS Analyzer</SectionLabel>
                <h2 className="text-4xl font-bold text-[#F1F3F5] leading-tight mb-4">
                  Know your exact ATS score before you apply.
                </h2>
                <p className="text-[#9CA3AF] leading-relaxed">
                  Upload your resume and get a precise ATS diagnosis — keyword match rate,
                  formatting compliance, bullet structure — in 30 seconds.
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <FeatureListItem
                  icon={Target}
                  title="Keyword gap analysis"
                  desc="Identifies exactly which keywords your target role expects that your resume is missing."
                />
                <FeatureListItem
                  icon={BarChart3}
                  title="Section-by-section scoring"
                  desc="Scores each section independently: summary, experience, skills, education, and formatting."
                />
                <FeatureListItem
                  icon={Search}
                  title="Missing keyword extraction"
                  desc="Pulls the exact keywords from any job description and tells you which ones to add."
                />
              </Reveal>
              <Reveal delay={0.15}>
                <Link href="/auth">
                  <Button size="lg" className="gap-2 bg-[#3D5A80] hover:bg-[#4A6FA5] text-white">
                    Analyze my resume <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </Reveal>
            </div>
            <div className="lg:col-span-5">
              <Reveal delay={0.1}>
                <ATSAnalyzerPreview />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TAILORING ──────────────────────────────────────────────────────── */}
      <section id="tailoring" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-5 order-2 lg:order-1">
              <Reveal delay={0.05}>
                <TailoredVersionPreview />
              </Reveal>
            </div>
            <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
              <Reveal>
                <SectionLabel>Resume Tailoring</SectionLabel>
                <h2 className="text-4xl font-bold text-[#F1F3F5] leading-tight mb-4">
                  Every job description gets its own tailored version.
                </h2>
                <p className="text-[#9CA3AF] leading-relaxed">
                  Paste any job description and our tailoring engine rewrites your resume
                  to match the exact keywords, seniority, and requirements — while keeping
                  your authentic voice.
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <div className="space-y-0">
                  {[
                    { icon: Settings2, title: 'Company-specific tailoring', desc: 'Match keywords from the exact job posting, not generic advice.' },
                    { icon: FileOutput, title: 'ATS-safe export', desc: 'Every tailored version exports in recruiter-friendly formats.' },
                    { icon: Mic, title: 'STAR bullet rewriter', desc: 'Converts generic bullets into achievement-led, metrics-driven statements.' },
                  ].map((item, i) => (
                    <FeatureListItem key={i} {...item} />
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MASTER VAULT ───────────────────────────────────────────────────── */}
      <section id="vault" className="py-24 px-6 bg-[#0D0F14]">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16">
            <div className="lg:col-span-6">
              <Reveal>
                <SectionLabel>Master Resume Vault</SectionLabel>
                <h2 className="text-4xl font-bold text-[#F1F3F5] leading-tight mb-4">
                  One master resume. Infinite tailored versions.
                </h2>
                <p className="text-[#9CA3AF] leading-relaxed mb-6">
                  Your Master Vault is a single, canonical source of truth. Update it once,
                  then generate job-specific tailored versions in seconds — without losing
                  the original.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Database, title: 'Version history', desc: 'Every version saved. Compare changes. Restore previous versions.' },
                    { icon: FileText, title: 'Multi-format export', desc: 'ATS PDF, Word doc, HTML. Each format optimized for its purpose.' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-lg bg-[#161A22] border border-[#2A2F3A]">
                      <item.icon className="h-5 w-5 text-[#3D5A80] mb-3" />
                      <p className="text-sm font-medium text-[#F1F3F5] mb-1">{item.title}</p>
                      <p className="text-xs text-[#6B7280]">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
            <div className="lg:col-span-6 flex items-center">
              <Reveal delay={0.1}>
                {/* Abstract vault visualization */}
                <div className="relative w-full h-64 rounded-xl bg-[#161A22] border border-[#2A2F3A] p-6 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#1C2028_0%,transparent_70%)]" />
                  <div className="relative z-10 space-y-3">
                    <p className="text-[10px] uppercase tracking-widest text-[#6B7280] mb-4">Version history</p>
                    {[
                      { name: 'Master Resume', version: 'v1.0', status: 'current', color: COLORS.accent },
                      { name: 'Stripe — Senior Backend', version: 'v0.8', status: 'tailored', color: COLORS.success },
                      { name: 'Google — L4 Engineer', version: 'v0.5', status: 'draft', color: COLORS.textMuted },
                      { name: 'Amazon — SDE II', version: 'v0.2', status: 'tailored', color: COLORS.success },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-[#2A2F3A] last:border-0">
                        <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        <div className="flex-1">
                          <p className="text-sm text-[#F1F3F5]">{item.name}</p>
                          <p className="text-xs text-[#6B7280]">{item.version}</p>
                        </div>
                        <span className="text-[10px] text-[#6B7280] capitalize">{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="max-w-xl mb-16">
              <SectionLabel>How it works</SectionLabel>
              <h2 className="text-4xl font-bold text-[#F1F3F5] leading-tight mb-4">
                Three steps from rejection to ready-to-apply.
              </h2>
              <p className="text-[#9CA3AF]">
                From upload to ATS-optimized export in under two minutes.
                No templates. No generic advice. Just your resume, optimized.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload or build',
                desc: 'Drop a PDF or DOCX — or build from scratch using our guided builder. Works with any format.',
              },
              {
                step: '02',
                title: 'Get your diagnosis',
                desc: 'Instant ATS score, keyword gap analysis, formatting issues, and specific improvement suggestions.',
              },
              {
                step: '03',
                title: 'Export and apply',
                desc: 'Download a recruiter-ready, ATS-optimized version tailored for your target role. Ready to submit.',
              },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 0.1}>
                <div className="relative">
                  <div className="text-[11px] uppercase tracking-widest text-[#3D5A80] font-semibold mb-4">{item.step}</div>
                  <h3 className="text-lg font-semibold text-[#F1F3F5] mb-3">{item.title}</h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{item.desc}</p>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 left-[calc(100%+2rem)] w-[calc(100%-4rem)] h-px bg-[#2A2F3A]" />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#0D0F14]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <SectionLabel>Results</SectionLabel>
            <h2 className="text-4xl font-bold text-[#F1F3F5] leading-tight mb-12">
              Real score improvements from real job seekers.
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-x-16 gap-y-0">
            {[
              { quote: 'I went from 34 to 89 ATS score in one afternoon. Three interviews the following week. The keyword analysis alone was worth it.', name: 'Priya S.', role: 'Software Engineer, Mumbai', score: '+55 pts' },
              { quote: 'Tailored my resume for a TCS role in 15 minutes. Got the interview call the next day. This is the tool Indian job seekers have been missing.', name: 'Rahul M.', role: 'Systems Engineer, Bangalore', score: '+47 pts' },
              { quote: 'I finally understood what ATS actually looks for. Changed my entire approach to job applications. Eight applications, four callbacks.', name: 'Sneha K.', role: 'Marketing Manager, Delhi', score: '+38 pts' },
              { quote: 'The STAR bullet rewriter is remarkable. My bullets went from generic responsibilities to specific achievements with real metrics.', name: 'Arjun V.', role: 'Backend Engineer, Hyderabad', score: '+41 pts' },
            ].map((item, i) => (
              <Reveal key={item.name} delay={i * 0.05}>
                <TestimonialBlock {...item} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRODUCT MODULES ──────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="mb-12">
              <SectionLabel>Platform</SectionLabel>
              <h2 className="text-4xl font-bold text-[#F1F3F5] leading-tight">
                Everything you need to run a smarter job search.
              </h2>
            </div>
          </Reveal>

          <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Target, label: 'Analyzer', title: 'ATS Score Checker', desc: 'Diagnose keyword gaps, formatting issues, and readability in 30 seconds.' },
              { icon: SparklesIcon, label: 'Tailoring', title: 'Resume Tailoring Engine', desc: 'AI-rewrite your resume for any job description in seconds.' },
              { icon: Database, label: 'Vault', title: 'Master Resume Vault', desc: 'One source of truth. Infinite tailored versions. Full version history.' },
              { icon: BriefcaseIcon, label: 'Tracker', title: 'Job Tracker', desc: 'Track every application. Measure response rates. Know what\'s working.' },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <ProductCard {...item} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ─── PRICING ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 bg-[#0D0F14]">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-12">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="text-4xl font-bold text-[#F1F3F5] leading-tight mb-4">
              Start free. Upgrade when it matters.
            </h2>
            <p className="text-[#9CA3AF]">
              3 free scans. No credit card. Upgrade when you're getting interviews.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl">
            <Reveal delay={0.05}>
              <PricingCard
                name="Free"
                price="₹0"
                period="forever"
                features={['3 free ATS scans', 'Keyword analysis', '1 tailored version export', 'PDF download']}
              />
            </Reveal>
            <Reveal delay={0.1}>
              <PricingCard
                name="Pro"
                price="₹499"
                period="/month"
                highlight
                badge="Most popular"
                features={['Unlimited scans', 'Unlimited tailoring', 'Full vault access', 'No watermark', 'All export formats', 'Priority support']}
              />
            </Reveal>
            <Reveal delay={0.15}>
              <PricingCard
                name="Lifetime"
                price="₹2999"
                period=" one-time"
                features={['Everything in Pro', 'Pay once, use forever', 'Founding member badge', 'Early access features']}
              />
            </Reveal>
          </div>

          <Reveal delay={0.2} className="mt-8 text-center">
            <p className="text-xs text-[#6B7280]">All prices in INR. 7-day refund guarantee. Cancel anytime.</p>
          </Reveal>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal className="mb-8">
            <SectionLabel>Questions</SectionLabel>
            <h2 className="text-3xl font-bold text-[#F1F3F5]">
              Frequently asked questions.
            </h2>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="rounded-xl bg-[#161A22] border border-[#2A2F3A] px-6">
              <FAQItem q="Is CraftlyCV really free?" a="Yes. You get 3 free ATS scans with no credit card. No commitment to start. Pro starts at ₹499/month if you want unlimited access." />
              <FAQItem q="How does ATS analysis work?" a="Our analyzer evaluates your resume against real ATS criteria: keyword density, formatting compliance, section structure, and readability scores. We train on both global ATS platforms (Workday, Greenhouse) and Indian ATS systems." />
              <FAQItem q="Does this work for Indian companies like TCS, Infosys, and Wipro?" a="Yes. We specifically train our ATS model on the platforms used by major Indian employers. The keyword expectations and formatting rules are calibrated for the Indian job market." />
              <FAQItem q="Is my resume data private?" a="Your resume is used only to generate your analysis. We do not share, sell, or use your resume data for any other purpose. You can delete your data at any time." />
              <FAQItem q="What\'s the difference between Free and Pro?" a="Free gives you 3 limited scans with PDF export. Pro gives you unlimited scans, unlimited tailored versions, full vault access, all export formats, and priority support." />
              <FAQItem q="Can freshers use this?" a="Absolutely. The ATS analyzer handles freshers well — it focuses on skills, education, and projects rather than just work experience. Many of our users are freshers who landed their first interview using CraftlyCV." />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 border-t border-[#2A2F3A]">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <SectionLabel>Get started</SectionLabel>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#F1F3F5] leading-tight mb-6">
              Your next interview starts with one upload.
            </h2>
            <p className="text-[#9CA3AF] text-lg mb-10 max-w-lg mx-auto">
              3 free scans. No credit card. Know your exact ATS score in 30 seconds.
            </p>
            <Link href="/auth">
              <Button size="xl" className="gap-2 px-8 bg-[#3D5A80] hover:bg-[#4A6FA5] text-white">
                Analyze my resume free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#2A2F3A] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#3D5A80] flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-[#9CA3AF]">CraftlyCV</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#6B7280]">
            <Link href="/pricing" className="hover:text-[#9CA3AF] transition-colors">Pricing</Link>
            <Link href="/privacy" className="hover:text-[#9CA3AF] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#9CA3AF] transition-colors">Terms</Link>
            <Link href="/about" className="hover:text-[#9CA3AF] transition-colors">About</Link>
          </div>
          <p className="text-xs text-[#6B7280]">© {new Date().getFullYear()} CraftlyCV</p>
        </div>
      </footer>
    </main>
  )
}

/* Inline sparkles icon to avoid import issues */
function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3v3M18.5 5.5l-1.5 1.5M21 12h-3M18.5 18.5l-1.5-1.5M12 18v3M5.5 18.5l1.5-1.5M3 12h3M5.5 5.5l1.5 1.5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  )
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}
