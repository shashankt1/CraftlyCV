'use client'

import Link from 'next/link'
import { FileText, Shield, Lock, Eye, Trash2, Mail, ChevronRight } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white">CraftlyCV</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            Back to Home
          </Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Shield className="h-4 w-4" />
            Trust-First Privacy
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Privacy Policy</h1>
          <p className="text-slate-600 dark:text-slate-400">Last updated: April 20, 2026</p>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Information We Collect</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">We collect account information, resume content you upload, and usage data. Payment information is handled by Razorpay/Stripe.</p>
          </div>
          <div className="rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. How We Use Your Data</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Your data is used for AI resume analysis, interview prep, and payment processing. We never sell your data to advertisers.</p>
          </div>
          <div className="rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Data Sharing</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">We share data only with Google Gemini AI for processing, and Razorpay/Stripe for payments. We never sell or rent personal data.</p>
          </div>
          <div className="rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Your Rights</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">You can access, export, delete, or correct your data anytime. Email support@craftlycv.in</p>
          </div>
        </div>
        <div className="mt-10 rounded-xl p-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">Questions?</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">support@craftlycv.in</p>
        </div>
      </main>
    </div>
  )
}
