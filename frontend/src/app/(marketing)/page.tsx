'use client'

import { useEffect, useRef, useState, type FC, type HTMLAttributes } from 'react'
import Link from 'next/link'
import { motion, useInView, useAnimation } from 'framer-motion'
import { ArrowRight, Check, FileText, Zap, Shield, TrendingUp, Database, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATION UTILITIES
══════════════════════════════════════════════════════════════════════════════ */
function useScrollReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const controls = useAnimation()
  useEffect(() => {
    if (inView) controls.start('visible')
  }, [inView, controls])
  return { ref, variants: {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] } }
  }}
}

/* Stagger container + child items */
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
}
const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
}

function Reveal(props: { delay?: number; children?: React.ReactNode; className?: string }) {
  const { delay = 0, children, className } = props
  const { ref, variants } = useScrollReveal(delay)
  return <motion.div ref={ref} variants={variants} initial="hidden" animate="visible" className={className}>{children}</motion.div>
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ATS SCORE RING (animated CSS graphic)
══════════════════════════════════════════════════════════════════════════════ */
function ATSScoreRing({ score = 85 }: { score?: number }) {
  const circumference = 2 * Math.PI * 52
  const progress = (score / 100) * circumference
  return (
    <div className="relative flex items-center justify-center w-44 h-44">
      <svg width="176" height="176" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="88" cy="88" r="52" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-800" />
        <circle
          cx="88" cy="88" r="52" fill="none" stroke={score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444'}
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ filter: `drop-shadow(0 0 8px ${score >= 80 ? '#22c55e' : '#eab308'}60)`, transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-white">{score}</span>
        <span className="text-[10px] uppercase tracking-widest text-slate-400">ATS Score</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   HOW IT WORKS — numbered steps
══════════════════════════════════════════════════════════════════════════════ */
function StepCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <Reveal className="flex gap-5 group">
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-400 font-black text-lg group-hover:bg-blue-600/20 transition-colors">
        {num}
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
      </div>
    </Reveal>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FAQ ACCORDION ITEM
══════════════════════════════════════════════════════════════════════════════ */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/5">
      <button onClick={() => setOpen(!open)} className="w-full py-5 flex items-center justify-between text-left">
        <span className="text-sm font-medium text-white/80 pr-4">{q}</span>
        <ChevronDown className={`h-4 w-4 text-white/30 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-5 text-sm text-white/40 leading-relaxed">{a}</p>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PRICING CARD
══════════════════════════════════════════════════════════════════════════════ */
function PricingCard({ name, price, period, features, highlight, badge }: {
  name: string; price: string; period: string; features: string[]; highlight?: boolean; badge?: string
}) {
  return (
    <Reveal className={`relative rounded-2xl border p-6 flex flex-col gap-5 ${highlight ? 'bg-gradient-to-b from-blue-600/10 to-purple-600/10 border-blue-500/30 shadow-xl shadow-blue-600/10' : 'bg-white/3 border-white/8'}`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-600 text-white text-xs px-3 py-0.5 rounded-full">{badge}</Badge>
        </div>
      )}
      <div>
        <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-white">{price}</span>
          <span className="text-sm text-white/40">{period}</span>
        </div>
      </div>
      <ul className="space-y-2.5 flex-1">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-white/60">
            <Check className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button variant={highlight ? 'default' : 'outline'} className="w-full" size="lg">
        {name === 'Free' ? 'Start Free' : name === 'Pro' ? 'Get Pro' : 'Get Lifetime'}
      </Button>
    </Reveal>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TESTIMONIAL CARD
══════════════════════════════════════════════════════════════════════════════ */
function TestimonialCard({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <Reveal delay={0.1} className="p-6 rounded-2xl bg-white/3 border border-white/8 flex flex-col gap-4">
      <p className="text-sm text-white/60 leading-relaxed italic">"{quote}"</p>
      <div>
        <p className="text-sm font-semibold text-white">{name}</p>
        <p className="text-xs text-white/30">{role}</p>
      </div>
    </Reveal>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TRUST LOGO ROW (text-based)
══════════════════════════════════════════════════════════════════════════════ */
const TRUST_COMPANIES = ['Google', 'TCS', 'Amazon', 'Infosys', 'Wipro', 'Microsoft', 'Deloitte', '500+ companies']

/* ═══════════════════════════════════════════════════════════════════════════════
   PAIN POINT CARD
══════════════════════════════════════════════════════════════════════════════ */
function PainCard({ icon: Icon, title, stat, desc }: { icon: FC<HTMLAttributes<SVGElement>>; title: string; stat: string; desc: string }) {
  return (
    <Reveal className="p-6 rounded-2xl bg-white/3 border border-white/8 flex flex-col gap-4">
      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <Icon className="h-5 w-5 text-red-400" />
      </div>
      <div>
        <p className="text-2xl font-black text-red-400 mb-1">{stat}</p>
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>
      <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
    </Reveal>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FEATURE CARD
══════════════════════════════════════════════════════════════════════════════ */
function FeatureCard({ icon: Icon, title, desc }: { icon: FC<HTMLAttributes<SVGElement>>; title: string; desc: string }) {
  return (
    <Reveal className="p-6 rounded-2xl bg-white/3 border border-white/8 flex flex-col gap-4 hover:bg-white/5 hover:border-white/12 transition-all duration-300 group">
      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
        <Icon className="h-5 w-5 text-blue-400" />
      </div>
      <h3 className="text-base font-bold text-white">{title}</h3>
      <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
    </Reveal>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function MarketingPage() {
  return (
    <main className="pt-16">
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        {/* Subtle grid bg */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1a1a2e_0%,_transparent_70%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <Reveal>
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <Zap className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs font-semibold text-blue-300">Free ATS Score — No Credit Card</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-white">
                  Stop Getting Rejected.{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Fix Your Resume</span>{' '}
                  with AI.
                </h1>
                <p className="text-base sm:text-lg text-white/50 max-w-xl leading-relaxed">
                  CraftlyCV diagnoses ATS rejection, tailors your resume to any job, and gets you more interviews — free to start.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/auth">
                    <Button size="xl" className="gap-2 w-full sm:w-auto">
                      Analyze My Resume Free <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <a href="#how-it-works">
                    <Button variant="outline" size="xl" className="gap-2 w-full sm:w-auto">
                      See How It Works
                    </Button>
                  </a>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/30">
                  <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-blue-400" /> No credit card</span>
                  <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-blue-400" /> 3 free scans</span>
                </div>
              </div>
            </Reveal>

            {/* Right — ATS Score Ring */}
            <Reveal delay={0.15}>
              <div className="flex flex-col items-center gap-6">
                <ATSScoreRing score={85} />
                {/* Keyword badges */}
                <div className="flex flex-wrap justify-center gap-2">
                  {['Leadership', 'Python', 'AWS'].map(kw => (
                    <span key={kw} className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/25 text-xs font-semibold text-green-400">
                      ✓ {kw}
                    </span>
                  ))}
                  {['Docker', 'CI/CD'].map(kw => (
                    <span key={kw} className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-xs font-semibold text-red-400">
                      ✗ {kw}
                    </span>
                  ))}
                </div>
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-xs text-white/40">
                    <span>Keyword match</span><span className="text-green-400">78%</span>
                  </div>
                  <Progress value={78} className="h-1.5" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ────────────────────────────────────────────────────── */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-white/25 uppercase tracking-widest mb-6">
            Trusted by job seekers applying to
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {TRUST_COMPANIES.map(c => (
              <span key={c} className="text-sm font-semibold text-white/20">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROBLEM SECTION ───────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Why Your Resume Keeps Failing</h2>
            <p className="text-white/40 max-w-lg mx-auto">The job market has changed. Your approach hasn't.</p>
          </Reveal>
          <motion.div
            className="grid sm:grid-cols-3 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {[
              { icon: Shield, stat: '72%', title: 'Resumes rejected before human review', desc: 'ATS systems filter the majority of applications before a recruiter ever opens your resume.' },
              { icon: Zap, stat: 'Generic', title: 'AI advice that doesn\'t match your job', desc: 'Most AI tools give the same templated feedback to everyone, ignoring what the actual job posting needs.' },
              { icon: TrendingUp, stat: '50+', title: 'Hours spent rewriting per application', desc: 'Tailoring your resume for every role takes time most job seekers don\'t have.' },
            ].map(item => (
              <motion.div key={item.stat} variants={staggerItem}>
                <PainCard {...item} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── PRODUCT FEATURES ──────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Everything you need to get hired</h2>
            <p className="text-white/40 max-w-lg mx-auto">One platform. Every tool. Optimized for your target role.</p>
          </Reveal>
          <motion.div
            className="grid sm:grid-cols-2 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {[
              { icon: Shield, title: 'ATS Analyzer', desc: 'Diagnose why you\'re being filtered out, section by section. Get a detailed breakdown of keyword matches, formatting issues, and readability scores.' },
              { icon: Zap, title: 'Resume Tailoring Engine', desc: 'AI rewrites your resume for each specific job description. Match keywords, restructure bullet points, and optimize for your target role.' },
              { icon: Database, title: 'Master Resume Vault', desc: 'One canonical profile. Infinite tailored versions. Keep your master resume safe and generate optimized versions for every application.' },
              { icon: TrendingUp, title: 'Job Tracker', desc: 'Track every application. See your response rate. Identify which resume versions are working and improve your odds over time.' },
            ].map(item => (
              <motion.div key={item.title} variants={staggerItem}>
                <FeatureCard {...item} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── INTERACTIVE ATS DEMO ──────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">See what your ATS score looks like</h2>
              <p className="text-white/50 leading-relaxed mb-6">
                Upload your resume and get an instant ATS breakdown — no account needed. Find out exactly what keywords you're missing, where your formatting fails, and what score your resume would receive from a real ATS.
              </p>
              <Link href="/auth"><Button size="lg" className="gap-2">Analyze My Resume <ArrowRight className="h-4 w-4" /></Button></Link>
            </Reveal>
            <Reveal delay={0.1}>
              <Card className="p-8 bg-white/3 border-white/8">
                <div className="flex items-start gap-6">
                  <ATSScoreRing score={85} />
                  <div className="flex-1 space-y-4 pt-2">
                    {/* Keyword match */}
                    <div>
                      <div className="flex justify-between text-xs text-white/50 mb-1.5">
                        <span>Keyword match</span><span className="text-green-400">78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                    {/* Formatting */}
                    <div>
                      <div className="flex justify-between text-xs text-white/50 mb-1.5">
                        <span>Formatting</span><span className="text-green-400">92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    {/* Missing keywords */}
                    <div>
                      <p className="text-xs text-white/30 mb-2">Missing keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['Docker', 'CI/CD', 'Kubernetes'].map(kw => (
                          <span key={kw} className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400">{kw}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">How it works</h2>
            <p className="text-white/40 max-w-lg mx-auto">Three steps from rejection to interview. Takes under 2 minutes.</p>
          </Reveal>
          <div className="max-w-2xl mx-auto space-y-8">
            <StepCard num="1" title="Upload your resume" desc="Upload a PDF or paste your resume text. Works with any format — we'll parse it for you." />
            <StepCard num="2" title="Get your ATS diagnosis" desc="Instantly receive your ATS score, keyword match rate, missing keywords, and formatting risks — broken down section by section." />
            <StepCard num="3" title="Export a tailored version" desc="Download a job-ready resume optimized for your target role. ATS-aligned. Human-readable. Ready to submit." />
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF ─────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">What job seekers are saying</h2>
          </Reveal>
          <motion.div
            className="grid sm:grid-cols-3 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {[
              { quote: 'I went from 0 callbacks to 3 interviews in 2 weeks after fixing my ATS score. The keyword analysis alone was worth it.', name: 'Priya S.', role: 'Software Engineer' },
              { quote: 'Tailored my resume for a TCS role in 10 minutes. Got the interview the next day. This tool is a game changer for Indian job seekers.', name: 'Rahul M.', role: 'Fresher, NIT' },
              { quote: 'Finally understood what ATS actually cares about. Changed everything about how I approach job applications.', name: 'Sneha K.', role: 'Marketing Manager' },
            ].map(item => (
              <motion.div key={item.name} variants={staggerItem}>
                <TestimonialCard {...item} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── PRICING ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Simple, transparent pricing</h2>
            <p className="text-white/40">Start free. Upgrade when you're ready.</p>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <PricingCard
              name="Free"
              price="₹0"
              period="/ forever"
              features={['3 free ATS scans', 'Basic keyword analysis', '1 tailored version', 'Watermarked export']}
            />
            <PricingCard
              name="Pro"
              price="₹499"
              period="/month"
              highlight
              badge="Most popular"
              features={['Unlimited ATS scans', 'All modules unlocked', 'No watermark export', 'LinkedIn optimization', 'Mock interview access', 'Job tracker']}
            />
            <PricingCard
              name="Lifetime"
              price="₹2999"
              period=" one-time"
              features={['Everything in Pro', 'Forever — no subscription', '"Founding member" badge', 'Priority support', 'Early access to new features']}
            />
          </div>
          <Reveal className="mt-8 text-center">
            <p className="text-xs text-white/25">All prices in INR. 7-day refund guarantee. Cancel anytime.</p>
          </Reveal>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Frequently asked questions</h2>
          </Reveal>
          <div className="rounded-2xl bg-white/3 border border-white/8 px-6">
            <FAQItem q="Is CraftlyCV free to use?" a="Yes. You get 3 free ATS scans with no credit card required. No commitment needed to see your score." />
            <FAQItem q="How does ATS actually work?" a="ATS (Applicant Tracking System) software scans your resume for keywords, formatting, and structure before a human sees it. CraftlyCV diagnoses exactly how an ATS would score your resume and what to fix." />
            <FAQItem q="Does it work for Indian companies like TCS and Infosys?" a="Absolutely. We train our ATS model on both global ATS systems (Workday, Greenhouse) and Indian ATS platforms used by TCS, Infosys, Wipro, and other Indian companies." />
            <FAQItem q="Is my resume data private?" a="Your resume is only used to generate your analysis. We do not share, sell, or use your resume data for any other purpose. You can delete your data at any time." />
            <FAQItem q="What is the difference between Free and Pro?" a="Free gives you 3 limited scans with watermarked exports. Pro gives you unlimited scans, all modules (ATS Analyzer, Tailoring, Vault, Job Tracker), no watermark, and access to LinkedIn optimization and mock interviews." />
            <FAQItem q="Does it work for freshers with no experience?" a="Yes. Our ATS analyzer handles freshers well. It focuses on skills, education, projects, and keyword matching rather than just work experience. Many of our users are freshers who landed their first interview using CraftlyCV." />
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-b from-blue-600/10 to-purple-600/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Start with your free ATS score.</h2>
            <p className="text-base text-white/50 mb-8">Takes 60 seconds. No credit card. Get your personalized fix today.</p>
            <Link href="/auth">
              <Button size="xl" className="gap-2 px-8">
                Analyze My Resume Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
