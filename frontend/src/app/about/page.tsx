'use client'

import Link from 'next/link'
import { FileText, ArrowLeft, Users, Zap, Heart, Rocket, Target, TrendingUp, CheckCircle } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Nav */}
      <nav className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white">CraftlyCV</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-4">
            About CraftlyCV
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            We're building the Career Operating System that helps people get hired or start earning — faster.
          </p>
        </div>

        {/* Mission */}
        <div className="rounded-2xl p-8 bg-gradient-to-br from-blue-600 to-purple-600 text-white mb-10">
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-lg leading-relaxed text-blue-100 mb-4">
            Every year, millions of talented people get filtered out of jobs not because they lack skills — but because their resume doesn't speak the right language. We're here to fix that.
          </p>
          <p className="text-lg leading-relaxed text-blue-100">
            CraftlyCV is the platform that levels the playing field: AI-powered tools that help anyone build ATS-friendly resumes, practice real interviews, find jobs, and explore income paths — all in one place.
          </p>
        </div>

        {/* Story */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Our Story</h2>
          <div className="rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              CraftlyCV started with a simple frustration: we watched brilliant engineers, marketers, and professionals get rejected by ATS systems not because they weren't qualified — but because their resume scored 40% instead of 80%.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We built the tools we wished existed: an analyzer that tells you exactly why your resume is losing points, an AI that rewrites it to match job descriptions, and an interview simulator that prepares you for the real thing.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Today, CraftlyCV helps over 50,000 professionals improve their resumes, practice for interviews, and find their next opportunity.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { value: '50K+', label: 'Users Helped' },
            { value: '2.5M+', label: 'Resumes Analyzed' },
            { value: '94%', label: 'Score Improvement' },
            { value: '30 sec', label: 'Avg Analysis Time' },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <p className="text-3xl font-black text-blue-600 mb-1">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Values */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">What We Believe</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: Target,
                title: 'Outcome over Activity',
                desc: "We don't just give you a pretty resume. We help you get results — interviews, offers, income."
              },
              {
                icon: Zap,
                title: 'Speed Matters',
                desc: 'Your job search can\'t wait 6 months. We build tools that work fast so you can move fast.'
              },
              {
                icon: Users,
                title: 'Access for All',
                desc: 'The best tools shouldn\'t only be for people who can afford expensive consultants. We price for accessibility.'
              },
              {
                icon: Heart,
                title: 'Honest, Not Hype',
                desc: 'We won\'t tell you everything is perfect. If your resume needs work, we\'ll tell you exactly what to fix.'
              },
            ].map((value, i) => (
              <div key={i} className="rounded-xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <value.icon className="h-8 w-8 text-blue-600 mb-3" />
                <p className="font-bold text-slate-900 dark:text-white mb-1">{value.title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Built By</h2>
          <div className="rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              CraftlyCV is built by a small team of engineers, designers, and career coaches who understand the job market from both sides — we've hired, we've been hired, and we've built tools we wished existed.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We're based in India, serving users across South Asia, Southeast Asia, and beyond. Our users come from all backgrounds: fresh graduates, career switchers, seasoned professionals, freelancers, and entrepreneurs.
            </p>
          </div>
        </div>

        {/* Product */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">What We Build</h2>
          <div className="rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="space-y-4">
              {[
                {
                  icon: FileText,
                  title: 'AI Resume Builder',
                  desc: 'Build ATS-optimized resumes with AI assistance'
                },
                {
                  icon: Target,
                  title: 'ATS Analyzer',
                  desc: 'Get honest scores and specific improvement suggestions'
                },
                {
                  icon: Rocket,
                  title: 'Tailor to Job',
                  desc: 'Rewrite your resume to match any job description'
                },
                {
                  icon: MessageSquare,
                  title: 'Mock Interview',
                  desc: 'Practice with AI that asks real questions and gives real feedback'
                },
                {
                  icon: Search,
                  title: 'Job Finder',
                  desc: 'Find relevant jobs aggregated from multiple sources'
                },
                {
                  icon: DollarSign,
                  title: 'Income Hub',
                  desc: 'Explore freelance, gigs, and side income paths'
                },
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                    <feature.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{feature.title}</p>
                    <p className="text-sm text-slate-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-xl p-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-center">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Get in Touch</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Have questions, feedback, or partnership inquiries?
          </p>
          <a href="mailto:support@craftlycv.in" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
            support@craftlycv.in
          </a>
        </div>

        {/* Footer nav */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms</Link>
          <Link href="/refund" className="hover:text-slate-900 dark:hover:text-white transition-colors">Refund Policy</Link>
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Home</Link>
        </div>
      </main>
    </div>
  )
}
