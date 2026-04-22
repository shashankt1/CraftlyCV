'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  FileText, Zap, Target, Sparkles, MessageSquare, ArrowRight,
  CheckCircle, TrendingUp, Award, Menu, X,
  Briefcase, XCircle, Star, Clock, Mic, DollarSign, Search,
  Users, Loader2, Upload, ChevronRight, Play, ExternalLink
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────
function useInView(ref: React.RefObject<Element>) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } }, { threshold: 0.2 })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return inView
}

function Counter({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref as React.RefObject<Element>)
  useEffect(() => {
    if (!inView) return
    let cur = 0
    const step = to / 60
    const iv = setInterval(() => {
      cur = Math.min(cur + step, to)
      setVal(Math.floor(cur))
      if (cur >= to) clearInterval(iv)
    }, 24)
    return () => clearInterval(iv)
  }, [inView, to])
  return <div ref={ref}>{prefix}{val.toLocaleString()}{suffix}</div>
}

// ── Career Story Animation ────────────────────────────────────────────────────
const STORY_FRAMES = [
  { icon: '🎓', label: 'Fresher', sub: '200+ applications sent', color: '#60a5fa', status: 'struggle' },
  { icon: '📄', label: 'ATS Score: 34', sub: 'Filtered before human eyes', color: '#f87171', status: 'fail' },
  { icon: '😔', label: '0 callbacks', sub: 'Something is clearly wrong', color: '#f87171', status: 'fail' },
  { icon: '🔍', label: 'Found CraftlyCV', sub: 'Analyzed resume in 30 sec', color: '#fb923c', status: 'turning' },
  { icon: '⚡', label: 'Score jumped to 87', sub: 'Applied all AI suggestions', color: '#34d399', status: 'win' },
  { icon: '📞', label: '6 interview calls', sub: 'In the first two weeks', color: '#34d399', status: 'win' },
  { icon: '🏆', label: 'Got the job!', sub: '₹18L offer at a startup', color: '#fbbf24', status: 'win' },
]

function CareerStoryAnimation() {
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing) return
    const iv = setInterval(() => {
      setFrame(f => {
        if (f >= STORY_FRAMES.length - 1) { setPlaying(false); return f }
        return f + 1
      })
    }, 1800)
    return () => clearInterval(iv)
  }, [playing])

  const restart = () => { setFrame(0); setPlaying(true) }
  const current = STORY_FRAMES[frame]

  return (
    <div className="relative w-full max-w-sm mx-auto select-none">
      <div className="rounded-3xl p-8 text-center relative overflow-hidden transition-all duration-700"
        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${current.color}30`, backdropFilter: 'blur(20px)' }}>
        <div className="absolute inset-0 opacity-10 transition-all duration-700"
          style={{ background: `radial-gradient(circle at 50% 50%, ${current.color}, transparent 70%)` }} />
        <div className="relative z-10">
          <div className="text-6xl mb-4 transition-all duration-500" style={{ filter: `drop-shadow(0 0 20px ${current.color}60)` }}>
            {current.icon}
          </div>
          <p className="text-2xl font-black text-white mb-2 transition-all">{current.label}</p>
          <p className="text-sm font-medium" style={{ color: `${current.color}cc` }}>{current.sub}</p>
          <div className="flex justify-center gap-2 mt-6">
            {STORY_FRAMES.map((f, i) => (
              <button key={i} onClick={() => { setFrame(i); setPlaying(false) }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === frame ? '20px' : '8px', height: '8px',
                  background: i <= frame ? current.color : 'rgba(255,255,255,0.15)'
                }} />
            ))}
          </div>
          {!playing && frame === STORY_FRAMES.length - 1 && (
            <button onClick={restart}
              className="mt-5 text-xs font-semibold px-4 py-2 rounded-full transition-all hover:scale-105"
              style={{ background: `${current.color}20`, color: current.color, border: `1px solid ${current.color}40` }}>
              ↺ Watch again
            </button>
          )}
        </div>
      </div>
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 space-y-2">
        {['struggle', 'fail', 'fail', 'turning', 'win', 'win', 'win'].slice(0, frame + 1).map((s, i) => (
          <div key={i} className="w-2 h-2 rounded-full transition-all"
            style={{ background: s === 'win' ? '#34d399' : s === 'turning' ? '#fb923c' : '#f87171' }} />
        ))}
      </div>
    </div>
  )
}

// ── Live Activity Ticker ──────────────────────────────────────────────────────
const ACTIVITIES = [
  'Rahul from Bangalore scored 91 on ATS ⚡',
  'Priya landed a job at Flipkart 🎉',
  'Arjun improved his score from 52 → 84 📈',
  'Sneha got 4 interview calls this week 📞',
  'Vikram tailored his resume in 30 seconds ⚡',
  'Anjali switched to Data Science role 🚀',
  'Rohan from Delhi got into Amazon 🏆',
  'Meera earned ₹15K on Upwork this month 💰',
]

function LiveTicker() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const iv = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setIdx(i => (i + 1) % ACTIVITIES.length); setVisible(true) }, 400)
    }, 3000)
    return () => clearInterval(iv)
  }, [])
  return (
    <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 rounded-full">
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
      <p className="text-sm text-emerald-300 font-medium transition-all duration-400"
        style={{ opacity: visible ? 1 : 0 }}>
        {ACTIVITIES[idx]}
      </p>
    </div>
  )
}

// ── Score Preview Card ─────────────────────────────────────────────────────────
function ScorePreviewCard() {
  const [score] = useState(58)
  const [shown, setShown] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref as React.RefObject<Element>)

  useEffect(() => {
    if (!inView) return
    let c = 0
    const iv = setInterval(() => {
      c = Math.min(c + 1, score)
      setShown(c)
      if (c >= score) clearInterval(iv)
    }, 28)
    return () => clearInterval(iv)
  }, [inView])

  const radius = 54, circ = 2 * Math.PI * radius
  const dash = (shown / 100) * circ

  return (
    <div ref={ref} className="rounded-2xl p-5 text-white w-72"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
      <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Live ATS Score Preview</p>
      <div className="flex items-center gap-5">
        <div className="relative w-28 h-28 shrink-0">
          <svg width="112" height="112" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="56" cy="56" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <circle cx="56" cy="56" r={radius} fill="none" stroke="#f87171" strokeWidth="10"
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.05s linear' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white">{shown}</span>
            <span className="text-[10px] text-red-400 font-bold">NEEDS FIX</span>
          </div>
        </div>
        <div className="space-y-2 flex-1 min-w-0">
          {['Missing keywords', 'No metrics', 'Weak bullets', 'Format issues'].map((issue, i) => (
            <div key={i} className="flex items-center gap-2">
              <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <span className="text-xs text-white/60 truncate">{issue}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-white/8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/40">After CraftlyCV fixes</span>
          <span className="text-sm font-black text-emerald-400">→ 84</span>
        </div>
        <div className="w-full bg-white/8 rounded-full h-2">
          <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-400" style={{ width: '84%' }} />
        </div>
      </div>
    </div>
  )
}

// ── Feature Tabs ──────────────────────────────────────────────────────────────
type Tab = 'resume' | 'interview' | 'jobs' | 'earn'

const TABS: { id: Tab; label: string; icon: any; color: string }[] = [
  { id: 'resume', label: 'Resume Builder', icon: FileText, color: '#60a5fa' },
  { id: 'interview', label: 'Interview Practice', icon: MessageSquare, color: '#34d399' },
  { id: 'jobs', label: 'Find Jobs', icon: Search, color: '#a78bfa' },
  { id: 'earn', label: 'Earn Online', icon: DollarSign, color: '#fbbf24' },
]

// ── Demo Resume Builder ────────────────────────────────────────────────────────
function DemoResumeBuilder() {
  const [email, setEmail] = useState('')
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)

  const handleUpload = () => {
    if (!email) return
    setUploading(true)
    setTimeout(() => { setUploading(false); setDone(true) }, 1500)
  }

  return (
    <div className="space-y-4">
      <p className="text-white/60 text-sm">Enter your email to get started free:</p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleUpload}
          disabled={!email || uploading}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 disabled:cursor-not-allowed"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <CheckCircle className="h-4 w-4" /> : <><Zap className="h-4 w-4" />Free Scan</>}
        </button>
      </div>
      {done && <p className="text-emerald-400 text-sm font-medium">✓ Check your email to access free scan!</p>}
      <div className="flex items-center gap-4 text-xs text-white/40 pt-2">
        <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-400" />10 free scans</span>
        <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-400" />No credit card</span>
        <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-400" />30 seconds</span>
      </div>
    </div>
  )
}

// ── Demo Interview ──────────────────────────────────────────────────────────────
function DemoInterview() {
  const [step, setStep] = useState(0)
  const messages = [
    { role: 'interviewer', text: "Tell me about a time you had to deal with a difficult coworker." },
    { role: 'candidate', text: "I usually try to avoid confrontation..." },
    { role: 'interviewer', text: "That's one approach. But using the STAR method — what was the Situation, Task, Action, Result?" },
  ]

  return (
    <div className="space-y-3">
      <div className="bg-white/5 rounded-xl p-4 space-y-3 max-h-48 overflow-y-auto">
        {messages.slice(0, step + 1).map((m, i) => (
          <div key={i} className={`flex ${m.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${m.role === 'interviewer' ? 'bg-white/10 text-white/80' : 'bg-blue-600 text-white'}`}>
              {m.role === 'interviewer' && (
                <div className="flex items-center gap-1.5 mb-1.5 text-white/40">
                  <MessageSquare className="h-3 w-3" /> AI Interviewer
                </div>
              )}
              {m.text}
            </div>
          </div>
        ))}
      </div>
      {step < messages.length - 1 && (
        <button onClick={() => setStep(s => s + 1)}
          className="w-full py-2.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-xl hover:bg-emerald-500/30 transition-all">
          Next →
        </button>
      )}
      {step === messages.length - 1 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
          <p className="text-green-400 text-xs font-bold mb-1">✓ Interview complete! Score: 72/100</p>
          <p className="text-white/50 text-xs">STAR feedback: Use specific metrics next time</p>
        </div>
      )}
    </div>
  )
}

// ── Demo Jobs ─────────────────────────────────────────────────────────────────
function DemoJobs() {
  const jobs = [
    { role: 'React Developer', company: 'Flipkart', location: 'Bangalore', salary: '₹18-25 LPA', tags: ['Remote', 'Urgent'] },
    { role: 'Data Analyst', company: 'Swiggy', location: 'Hyderabad', salary: '₹8-12 LPA', tags: ['On-site', 'Freshers'] },
    { role: 'Product Manager', company: 'CRED', location: 'Mumbai', salary: '₹25-35 LPA', tags: ['Hybrid'] },
  ]
  return (
    <div className="space-y-2">
      {jobs.map((j, i) => (
        <div key={i} className="flex items-center justify-between bg-white/5 border border-white/8 rounded-xl px-4 py-3 hover:bg-white/10 transition-all cursor-pointer">
          <div>
            <p className="text-white text-sm font-medium">{j.role}</p>
            <p className="text-white/50 text-xs">{j.company} · {j.location}</p>
          </div>
          <div className="text-right">
            <p className="text-emerald-400 text-xs font-bold">{j.salary}</p>
            <div className="flex gap-1 mt-1 justify-end">
              {j.tags.map((t, ti) => (
                <span key={ti} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50">{t}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
      <button className="w-full py-2.5 bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-medium rounded-xl hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2">
        View 500+ Jobs <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  )
}

// ── Demo Earn ─────────────────────────────────────────────────────────────────
function DemoEarn() {
  const paths = [
    { icon: '💻', title: 'Freelance on Upwork', sub: '₹5K-50K/month', time: 'Start in 3 days' },
    { icon: '🎥', title: 'YouTube Automation', sub: '₹10K-1L/month', time: 'Start in 7 days' },
    { icon: '🤖', title: 'AI Training (Outlier)', sub: '₹15K-40K/month', time: 'Start in 1 day' },
  ]
  return (
    <div className="space-y-2">
      {paths.map((p, i) => (
        <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-3 hover:bg-white/10 transition-all">
          <span className="text-2xl">{p.icon}</span>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">{p.title}</p>
            <p className="text-white/50 text-xs">{p.time}</p>
          </div>
          <div className="text-emerald-400 text-xs font-bold">{p.sub}</div>
        </div>
      ))}
      <button className="w-full py-2.5 bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-medium rounded-xl hover:bg-orange-500/30 transition-all flex items-center justify-center gap-2">
        See All Income Paths <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  )
}

// ── Background ────────────────────────────────────────────────────────────────
function PageBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#060c1a]" />
      <div className="absolute -top-60 -left-60 w-[800px] h-[800px] rounded-full opacity-[0.10]"
        style={{ background: 'radial-gradient(circle, #1E6FD9 0%, transparent 70%)' }} />
      <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.08]"
        style={{ background: 'radial-gradient(circle, #FF6B35 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('resume')

  return (
    <div className="min-h-screen relative text-white">
      <PageBg />
      <div className="relative z-10">

        {/* NAV */}
        <nav className="sticky top-0 z-50 border-b border-white/6 bg-[#060c1a]/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.svg" alt="CraftlyCV" width={36} height={36} className="rounded-xl" />
              <span className="text-xl font-black text-white">CraftlyCV</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link href="/build" className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">Resume Builder</Link>
              <Link href="/mock-interview" className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">Interview</Link>
              <Link href="/jobs" className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">Jobs</Link>
              <Link href="/income" className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">Earn Online</Link>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/auth" className="px-4 py-2 rounded-xl text-white/60 hover:text-white text-sm font-medium transition-all hidden sm:block">Sign In</Link>
              <Link href="/auth"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-105">
                Get Started Free →
              </Link>
            </div>
            <button className="md:hidden p-2 text-white/60 hover:text-white" onClick={() => setMenuOpen(v => !v)}>
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
          {menuOpen && (
            <div className="md:hidden border-t border-white/6 bg-[#060c1a]/95 px-4 py-4 space-y-2">
              {[['Resume Builder', '/build'], ['Interview', '/mock-interview'], ['Jobs', '/jobs'], ['Earn Online', '/income'], ['Sign In', '/auth']].map(([l, h]) => (
                <Link key={h} href={h} onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 text-sm font-medium">{l}</Link>
              ))}
              <Link href="/auth" onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold text-center">Get Started Free</Link>
            </div>
          )}
        </nav>

        {/* HERO */}
        <section className="pt-20 pb-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Left — Copy */}
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold mb-8">
                  <Zap className="h-4 w-4" /> Career Operating System — Not just a resume builder
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] mb-6">
                  Get hired or start
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400"> earning in</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300"> 7 days.</span>
                </h1>
                <p className="text-lg text-white/50 mb-8 leading-relaxed max-w-lg">
                  AI Resume Builder + Real Interview Practice + Jobs + Gigs. Everything you need to get a job OR make money online — in one platform.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link href="/auth"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-lg transition-all shadow-2xl shadow-blue-500/20 hover:scale-105">
                    <FileText className="h-5 w-5" /> Build My Resume — Free
                  </Link>
                  <Link href="/mock-interview"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/6 hover:bg-white/10 border border-white/10 text-white font-bold text-lg transition-all">
                    <Mic className="h-5 w-5" /> Practice Interview Now
                  </Link>
                </div>

                <p className="text-sm text-white/30 mb-6">✓ 10 free scans · No credit card · Results in 30 seconds</p>

                <LiveTicker />
              </div>

              {/* Right — Animation */}
              <div className="flex flex-col items-center gap-8">
                <CareerStoryAnimation />
                <ScorePreviewCard />
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="py-12 px-4 border-y border-white/6 bg-white/2">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { to: 50000, suffix: '+', label: 'Resumes Analyzed' },
              { to: 94, suffix: '%', label: 'Score Improvement' },
              { to: 2, suffix: '.5x', label: 'More Interviews' },
              { to: 30, suffix: ' sec', label: 'Analysis Time' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300 mb-1">
                  <Counter to={s.to} suffix={s.suffix} />
                </div>
                <div className="text-white/40 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PRODUCT TABS */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black mb-3">
                One platform.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">Four ways to win.</span>
              </h2>
              <p className="text-white/40 max-w-md mx-auto">From building your resume to landing interviews or earning online — we cover every path.</p>
            </div>

            {/* Tab buttons */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {TABS.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'text-white'
                        : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                    }`}
                    style={activeTab === tab.id ? { background: `${tab.color}20`, border: `1px solid ${tab.color}40` } : {}}
                  >
                    <Icon className="h-4 w-4" style={{ color: activeTab === tab.id ? tab.color : undefined }} />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              <div className="rounded-2xl p-6 border border-white/8 bg-white/3">
                <h3 className="text-xl font-bold text-white mb-4">
                  {activeTab === 'resume' && 'AI Resume Builder'}
                  {activeTab === 'interview' && 'AI Mock Interview'}
                  {activeTab === 'jobs' && 'Job Finder'}
                  {activeTab === 'earn' && 'Income Hub'}
                </h3>
                {activeTab === 'resume' && <DemoResumeBuilder />}
                {activeTab === 'interview' && <DemoInterview />}
                {activeTab === 'jobs' && <DemoJobs />}
                {activeTab === 'earn' && <DemoEarn />}
              </div>
              <div className="space-y-4">
                {activeTab === 'resume' && [
                  { icon: Target, title: 'ATS Score in 30 sec', desc: 'Upload your resume and get a detailed ATS score with specific fixes.' },
                  { icon: Sparkles, title: 'AI Tailor to Job', desc: 'Paste any job description and get your resume rewritten to match.' },
                  { icon: FileText, title: '20+ Templates', desc: 'Professional templates optimized for ATS and hiring managers.' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/6">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                      <f.icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{f.title}</p>
                      <p className="text-white/50 text-xs mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
                {activeTab === 'interview' && [
                  { icon: MessageSquare, title: 'Chat-style AI Interviewer', desc: 'Answer questions like you would in a real interview — by typing or voice.' },
                  { icon: Star, title: 'STAR Method Feedback', desc: 'After each answer, get structured feedback on your response.' },
                  { icon: TrendingUp, title: 'Confidence Score', desc: 'End-to-end scoring on clarity, relevance, and impact.' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/6">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <f.icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{f.title}</p>
                      <p className="text-white/50 text-xs mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
                {activeTab === 'jobs' && [
                  { icon: Search, title: 'Job Aggregation', desc: 'Find relevant jobs from multiple sources in one place.' },
                  { icon: Briefcase, title: 'Role Matching', desc: 'Get matched to roles based on your resume and skills.' },
                  { icon: Award, title: 'Direct Apply', desc: 'Apply directly with your CraftlyCV-optimized resume.' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/6">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                      <f.icon className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{f.title}</p>
                      <p className="text-white/50 text-xs mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
                {activeTab === 'earn' && [
                  { icon: DollarSign, title: 'Freelance Gigs', desc: 'Upwork, Fiverr, and more. Get matched to gigs you can start today.' },
                  { icon: Play, title: 'YouTube Automation', desc: 'Build a faceless YouTube channel with AI tools. Real income path.' },
                  { icon: Users, title: 'AI Training Platforms', desc: 'Earn ₹15-40K/month labeling AI data on Outlier, Scale AI, etc.' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/6">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                      <f.icon className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{f.title}</p>
                      <p className="text-white/50 text-xs mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-8">
              <Link href="/auth"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-all">
                <Zap className="h-4 w-4" /> Start Free — No Credit Card
              </Link>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24 px-4 border-y border-white/6 bg-white/2">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black mb-4">From upload to offer letter — or income</h2>
              <p className="text-white/40">Three steps. Real results. Multiple paths to win.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 relative">
              <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px bg-gradient-to-r from-blue-600/50 via-blue-400/50 to-blue-600/50" />
              {[
                { n: '01', icon: '📤', title: 'Upload your resume', desc: 'PDF or DOCX. Or build one from scratch using our AI builder — free.' },
                { n: '02', icon: '🤖', title: 'AI optimizes everything', desc: 'ATS score, keywords, interview questions, job matches, income paths.' },
                { n: '03', icon: '🎯', title: 'You take action', desc: 'Apply to jobs, practice interviews, or start earning online — your choice.' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-7 text-center relative"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-5xl mb-4">{s.icon}</div>
                  <p className="text-xs font-black text-blue-400 tracking-widest mb-2">{s.n}</p>
                  <p className="font-bold text-white text-lg mb-2">{s.title}</p>
                  <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-white/30 text-sm font-bold uppercase tracking-widest mb-10">What users are saying</p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: 'Arjun S.', role: 'Software Engineer', text: 'Went from 34 to 89 score in one afternoon. Got 3 interview calls the next week.', stars: 5 },
                { name: 'Priya M.', role: 'Data Analyst', text: 'The income hub showed me freelance options I never knew existed. Made ₹12K in my first month.', stars: 5 },
                { name: 'Rahul K.', role: 'MBA Graduate', text: 'The AI mock interview is intense. First session I scored 52. By the third, I hit 81.', stars: 5 },
              ].map((t, i) => (
                <div key={i} className="rounded-2xl p-6 border border-white/6 bg-white/3">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.stars }).map((_, j) => <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed mb-4">"{t.text}"</p>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/30 text-xs">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING PREVIEW */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-black mb-4">Start free. Upgrade when you're winning.</h2>
            <p className="text-white/40 mb-10 max-w-md mx-auto">
              10 free scans to start. No credit card. Upgrade to Pro when you land your first interview.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-left">
              {[
                { name: 'Free', price: '₹0', scans: '10 scans', features: ['ATS Analyzer', 'Basic Templates', 'Score Card'], cta: 'Get Started', highlight: false },
                { name: 'Pro', price: '₹149', period: '/mo', scans: '200 scans', features: ['Everything +', 'AI Mock Interview', 'All Templates', 'Priority Support'], cta: 'Start Pro', highlight: true },
                { name: 'Lifetime', price: '₹399', period: ' one-time', scans: 'All Pro forever', features: ['All Pro features', 'Never pay again', 'Founding badge'], cta: 'Claim Deal', highlight: false, badge: 'Best Value' },
              ].map((t, i) => (
                <div key={i} className={`rounded-2xl p-6 border ${t.highlight ? 'border-blue-500/40 bg-blue-600/10' : 'border-white/8 bg-white/3'}`}>
                  {t.badge && (
                    <div className="inline-flex items-center gap-1 text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full mb-3">{t.badge}</div>
                  )}
                  <p className="text-white/60 text-sm font-semibold mb-1">{t.name}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-black text-white">{t.price}</span>
                    {t.period && <span className="text-white/40 text-xs">{t.period}</span>}
                  </div>
                  <p className="text-blue-400 text-xs font-bold mb-4">{t.scans}</p>
                  <ul className="space-y-2 mb-5">
                    {t.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-white/65">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/pricing"
                    className={`block text-center py-2.5 rounded-xl font-bold text-xs transition-all ${
                      t.highlight
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-white/8 hover:bg-white/12 border border-white/10 text-white'
                    }`}>
                    {t.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-28 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-6xl mb-6">🚀</div>
            <h2 className="text-5xl font-black mb-5 leading-tight">
              Your next job offer<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">is one scan away.</span>
            </h2>
            <p className="text-white/40 text-lg mb-10 max-w-md mx-auto">
              Stop sending the same resume to 200 companies. Start winning.
            </p>
            <Link href="/auth"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black text-xl transition-all shadow-2xl shadow-blue-500/25 hover:scale-105">
              <Zap className="h-6 w-6" /> Build My Resume — Free
            </Link>
            <p className="text-white/25 text-sm mt-5">10 free scans · No credit card · 30 seconds</p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/6 py-12 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.svg" alt="CraftlyCV" width={36} height={36} className="rounded-xl" />
              <span className="text-xl font-black text-white">CraftlyCV</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/30">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/build" className="hover:text-white transition-colors">Resume Builder</Link>
              <Link href="/mock-interview" className="hover:text-white transition-colors">Interview</Link>
              <Link href="/income" className="hover:text-white transition-colors">Earn Online</Link>
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/refund" className="hover:text-white transition-colors">Refund</Link>
            </div>
            <p className="text-white/20 text-sm">© {new Date().getFullYear()} CraftlyCV · Built for job seekers worldwide</p>
          </div>
        </footer>

      </div>
    </div>
  )
}
