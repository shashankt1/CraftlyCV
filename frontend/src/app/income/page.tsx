'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, ArrowLeft, DollarSign, ExternalLink, CheckCircle, Clock, TrendingUp, Zap, Star, ChevronRight, Play, Users, Mic, Briefcase, Code, PenTool, GraduationCap, Globe, Loader2, Search } from 'lucide-react'

// ── Income Paths ────────────────────────────────────────────────────────────────
const INCOME_PATHS = [
  {
    id: 'freelance',
    icon: '💻',
    title: 'Freelance Tech',
    subtitle: 'Upwork · Fiverr · Toptal',
    color: '#60a5fa',
    bgColor: '#1e40af',
    minInvestment: '₹0',
    timeToFirstMoney: '3-7 days',
    monthlyPotential: '₹5K - 2L+',
    difficulty: 'Medium',
    description: 'Offer your tech skills as freelance services. High demand for web development, data analysis, AI/ML, mobile apps, and more.',
    steps: [
      'Identify your marketable skill (React, Python, data analysis, etc.)',
      'Create a strong profile on Upwork/Fiverr with your CraftlyCV resume',
      'Bid on 10-20 relevant projects in your first week',
      'Deliver quality work and build 5-star reviews',
      'Scale by raising rates and getting repeat clients',
    ],
    skills: ['Web Dev', 'Python', 'Data Analysis', 'Mobile Apps', 'AI/ML'],
    platforms: ['Upwork', 'Fiverr', 'Toptal', 'Freelancer', 'LinkedIn'],
    cta: 'Start Freelancing',
  },
  {
    id: 'youtube',
    icon: '🎥',
    title: 'YouTube Automation',
    subtitle: 'Faceless Channel · AI Tools',
    color: '#f87171',
    bgColor: '#b91c1c',
    minInvestment: '₹500/mo',
    timeToFirstMoney: '30-60 days',
    monthlyPotential: '₹10K - 5L+',
    difficulty: 'Medium',
    description: 'Build a faceless YouTube channel using AI tools for content creation. Cash cow once you hit 1000 subscribers and qualify for monetization.',
    steps: [
      'Pick a niche (tech reviews, AI tools, personal finance, etc.)',
      'Use AI tools (ChatGPT, ElevenLabs, Canva) to create content',
      'Set up a faceless channel (no face, voiceover only)',
      'Upload consistently for 30-60 days',
      'Apply for YouTube Partner Program at 1000 subscribers',
    ],
    skills: ['Content Creation', 'Basic Video Editing', 'AI Tools', 'Niche Research'],
    platforms: ['YouTube', 'TikTok', 'Instagram Reels', 'Medium'],
    cta: 'Start YouTube Channel',
  },
  {
    id: 'ai-training',
    icon: '🤖',
    title: 'AI Data Training',
    subtitle: 'Outlier · Scale AI · Remotasks',
    color: '#34d399',
    bgColor: '#065f46',
    minInvestment: '₹0',
    timeToFirstMoney: '1-3 days',
    monthlyPotential: '₹10K - 45K',
    difficulty: 'Easy',
    description: 'Train AI models by labeling data, evaluating responses, and testing AI systems. No special skills needed — just attention to detail and good English.',
    steps: [
      'Sign up on Outlier.ai or Scale AI (links below)',
      'Complete initial assessments and skill tests',
      'Start taking tasks in your area of expertise',
      'Work consistently to build up your task queue',
      'Withdraw earnings weekly via PayPal or bank',
    ],
    skills: ['English Reading/Writing', 'Attention to Detail', 'Basic Tech Skills'],
    platforms: ['Outlier.ai', 'Scale AI', 'Remotasks', 'Amazon MTurk'],
    cta: 'Join AI Training',
  },
  {
    id: 'tutoring',
    icon: '📚',
    title: 'Online Tutoring',
    subtitle: 'Preply · Wyzant · Vedantu',
    color: '#a78bfa',
    bgColor: '#5b21b6',
    minInvestment: '₹0',
    timeToFirstMoney: '1-7 days',
    monthlyPotential: '₹5K - 80K',
    difficulty: 'Easy',
    description: 'Teach students worldwide on subjects you know well. High demand for Math, Science, English, Coding, and test prep (GRE, GMAT, SAT).',
    steps: [
      'Identify subjects you can teach confidently',
      'Create profiles on multiple tutoring platforms',
      'Offer your first few sessions at competitive rates to build reviews',
      'Gradually increase rates as you get 5-star ratings',
      'Diversify to test prep and corporate training',
    ],
    skills: ['Subject Expertise', 'Communication', 'Patience', 'English'],
    platforms: ['Preply', 'Wyzant', 'Vedantu', 'UrbanPro', 'Chegg'],
    cta: 'Start Tutoring',
  },
  {
    id: 'affiliate',
    icon: '🔗',
    title: 'Affiliate Marketing',
    subtitle: 'Amazon Associates · Udemy · Glassdoor',
    color: '#fb923c',
    bgColor: '#7c2d12',
    minInvestment: '₹0',
    timeToFirstMoney: '7-30 days',
    monthlyPotential: '₹2K - 1L+',
    difficulty: 'Easy',
    description: 'Earn commissions by promoting products you use and love. Share your CraftlyCV success story and earn from course sales, software tools, and book recommendations.',
    steps: [
      'Sign up for Amazon Associates or relevant affiliate programs',
      'Create content around tools you actually use (like CraftlyCV!)',
      'Share on LinkedIn, Twitter, and relevant communities',
      'Add affiliate links to your blog posts or social profiles',
      'Scale by building a niche website or newsletter',
    ],
    skills: ['Content Writing', 'Social Media', 'Basic SEO', 'Networking'],
    platforms: ['Amazon Associates', 'Udemy Affiliates', 'ClickBank', 'ShareASale'],
    cta: 'Start Affiliate Marketing',
  },
  {
    id: 'saas',
    icon: '🚀',
    title: 'Micro SaaS',
    subtitle: 'Build · Launch · Scale',
    color: '#fbbf24',
    bgColor: '#78350f',
    minInvestment: '₹2K/mo',
    timeToFirstMoney: '60-180 days',
    monthlyPotential: '₹10K - 10L+',
    difficulty: 'Hard',
    description: 'Build and launch small SaaS tools that solve specific problems. The indie hacker path to significant recurring income.',
    steps: [
      'Identify a specific problem you can solve with a simple tool',
      'Use no-code (Bubble, Webflow) or simple code to build MVP',
      'Launch on Product Hunt and indie hacker communities',
      'Iterate based on user feedback',
      'Scale with paid acquisition once you have product-market fit',
    ],
    skills: ['Basic Coding', 'Product Thinking', 'Marketing', 'User Research'],
    platforms: ['Product Hunt', 'Indie Hackers', 'Twitter/X', 'Reddit'],
    cta: 'Start Building',
  },
]

// ── Quick Start Guide ──────────────────────────────────────────────────────────
const QUICK_TIPS = [
  { icon: '🎯', tip: 'Start with ONE path. Don\'t try everything at once.' },
  { icon: '⏰', tip: 'Consistency beats intensity. 1 hour daily > 10 hours on Sunday.' },
  { icon: '📋', tip: 'Use your CraftlyCV resume as your freelance profile — it\'s already optimized.' },
  { icon: '💬', tip: 'Apply to 10 jobs/projects in your first week. Quality follows quantity.' },
  { icon: '🏆', tip: 'Get your first 3 clients at any rate. 5-star reviews > short-term gains.' },
  { icon: '📈', tip: 'Double down on what works. Kill what doesn\'t within 30 days.' },
]

// ── Page Background ────────────────────────────────────────────────────────────
function PageBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#060c1a]" />
      <div className="absolute -top-40 right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.08]"
        style={{ background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 70%)' }}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function IncomePage() {
  const [activePath, setActivePath] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')

  const filteredPaths = INCOME_PATHS.filter(path => {
    const matchesSearch = path.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      path.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDifficulty = difficultyFilter === 'all' || path.difficulty === difficultyFilter
    return matchesSearch && matchesDifficulty
  })

  return (
    <div className="min-h-screen relative text-white">
      <PageBg />
      <div className="relative z-10">

        {/* Nav */}
        <nav className="border-b border-white/6 bg-[#060c1a]/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black text-white">CraftlyCV</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="px-4 py-2 rounded-xl bg-white/8 border border-white/10 text-white/70 hover:text-white text-sm font-medium transition-all">Dashboard</Link>
              <Link href="/auth" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all">Get Started Free</Link>
            </div>
          </div>
        </nav>

        {/* Header */}
        <section className="pt-16 pb-8 px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <DollarSign className="h-4 w-4" />
            Income Hub — If interviews don't work, you still earn
          </div>
          <h1 className="text-5xl font-black mb-4">
            Make money online.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Right now.</span>
          </h1>
          <p className="text-white/40 text-lg max-w-lg mx-auto mb-8">
            Not just a job platform. If interviews don't convert, these income paths help you earn while you keep applying.
          </p>

          {/* Search & Filter */}
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search income paths..."
                className="w-full bg-white/10 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'Easy', 'Medium', 'Hard'].map(d => (
                <button
                  key={d}
                  onClick={() => setDifficultyFilter(d)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    difficultyFilter === d ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Income Paths Grid */}
        <section className="pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPaths.map(path => (
                <div
                  key={path.id}
                  className={`rounded-2xl p-6 border transition-all cursor-pointer ${
                    activePath === path.id ? 'border-white/20 bg-white/8' : 'border-white/8 bg-white/3 hover:bg-white/5 hover:border-white/12'
                  }`}
                  onClick={() => setActivePath(activePath === path.id ? null : path.id)}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-4xl">{path.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white">{path.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          path.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                          path.difficulty === 'Medium' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          {path.difficulty}
                        </span>
                      </div>
                      <p className="text-white/50 text-sm">{path.subtitle}</p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 rounded-lg bg-white/5">
                      <p className="text-white/50 text-[10px] mb-0.5">Start in</p>
                      <p className="text-white text-xs font-bold">{path.timeToFirstMoney}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white/5">
                      <p className="text-white/50 text-[10px] mb-0.5">Investment</p>
                      <p className="text-white text-xs font-bold">{path.minInvestment}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white/5">
                      <p className="text-white/50 text-[10px] mb-0.5">Monthly</p>
                      <p className="text-emerald-400 text-xs font-bold">{path.monthlyPotential}</p>
                    </div>
                  </div>

                  <p className="text-white/50 text-sm leading-relaxed mb-4">{path.description}</p>

                  {/* Expanded content */}
                  {activePath === path.id && (
                    <div className="space-y-4 pt-4 border-t border-white/8">
                      {/* Steps */}
                      <div>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">How to start</p>
                        <ol className="space-y-2">
                          {path.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="w-5 h-5 rounded-full bg-white/10 text-white/50 text-xs flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-white/70">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Skills */}
                      <div>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Useful skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {path.skills.map((skill, i) => (
                            <span key={i} className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">{skill}</span>
                          ))}
                        </div>
                      </div>

                      {/* Platforms */}
                      <div>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Platforms to use</p>
                        <div className="flex flex-wrap gap-1.5">
                          {path.platforms.map((platform, i) => (
                            <span key={i} className="text-xs px-2 py-1 rounded-full border border-white/10 text-white/60">{platform}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/8">
                    <span className="text-white/30 text-xs">Tap to {activePath === path.id ? 'collapse' : 'expand'}</span>
                    <Link
                      href="/auth"
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {path.cta} <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {filteredPaths.length === 0 && (
              <div className="text-center py-16">
                <p className="text-white/50 text-lg">No income paths match your filters.</p>
                <button onClick={() => { setSearchQuery(''); setDifficultyFilter('all') }} className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium">
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Quick Tips */}
        <section className="py-16 px-4 border-t border-white/6 bg-white/2">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black mb-3">Quick wisdom from earners</h2>
              <p className="text-white/40">Things I wish I knew when starting</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {QUICK_TIPS.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/6">
                  <span className="text-2xl">{tip.icon}</span>
                  <p className="text-white/70 text-sm leading-relaxed">{tip.tip}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black mb-3">Real people, real income</h2>
              <p className="text-white/40">These paths work — here's the proof</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: 'Karthik R.', path: 'AI Training on Outlier', result: '₹28K in first month', quote: 'I signed up on a Tuesday. By Friday I had my first ₹2K. Used evenings after my regular job.' },
                { name: 'Anita S.', path: 'Freelance Data Analysis', result: '₹65K/month now', quote: 'Left my 9-5 after 6 months of freelancing. CraftlyCV resume got me my first Upwork contract.' },
                { name: 'Prateek M.', path: 'YouTube Automation', result: '₹1.2L/month (6 months)', quote: 'Started with zero. Used AI tools for everything. Hit 1000 subs in 45 days.' },
              ].map((story, i) => (
                <div key={i} className="rounded-xl p-5 bg-white/3 border border-white/6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {story.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{story.name}</p>
                      <p className="text-emerald-400 text-xs font-bold">{story.result}</p>
                    </div>
                  </div>
                  <p className="text-white/50 text-xs mb-3">{story.path}</p>
                  <p className="text-white/70 text-sm leading-relaxed italic">"{story.quote}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-black mb-4">
              Don't wait for one path to work.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Open all of them.</span>
            </h2>
            <p className="text-white/40 mb-10 max-w-md mx-auto">
              Use your CraftlyCV resume to apply for jobs AND freelance gigs. Interview doesn't work out? You already have an income stream running.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-black text-lg transition-all shadow-2xl shadow-emerald-500/20 hover:scale-105">
                <DollarSign className="h-5 w-5" /> Start Building Income — Free
              </Link>
              <Link href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/8 border border-white/10 text-white font-bold text-lg transition-all hover:bg-white/12">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/6 py-8 px-4 text-center">
          <p className="text-white/20 text-sm">© {new Date().getFullYear()} CraftlyCV · Built for job seekers worldwide</p>
        </footer>
      </div>
    </div>
  )
}
