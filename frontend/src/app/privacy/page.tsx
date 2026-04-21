'use client'

import Link from 'next/link'
import { FileText, Shield, Lock, Eye, Trash2, Mail, ChevronRight, Globe } from 'lucide-react'

export default function PrivacyPage() {
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
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Shield className="h-4 w-4" />
            Trust-First Privacy
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Last updated: April 20, 2026. Your data is safe with us.
          </p>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Lock, title: 'Your data is encrypted', desc: 'SSL/TLS encryption for all data in transit' },
            { icon: Eye, title: 'We never sell data', desc: 'Zero advertising trackers or data selling' },
            { icon: Trash2, title: 'Delete anytime', desc: 'Remove all your data with one email' },
          ].map((card, i) => (
            <div key={i} className="rounded-xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <card.icon className="h-6 w-6 text-blue-600 mb-3" />
              <p className="font-bold text-slate-900 dark:text-white mb-1">{card.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {[
            {
              title: '1. What We Collect',
              content: `We collect only what's needed to provide you our service:

• Account information (email, name) - collected via Supabase Auth
• Resume content you upload - processed for AI analysis, stored securely
• Payment information - handled entirely by Razorpay/Stripe (we never see your card details)
• Usage data - scans used, features accessed (for service improvement)

We do NOT collect browsing history, location data, or any information unrelated to our service.`
            },
            {
              title: '2. How We Use Your Data',
              content: `Your data is used exclusively for:

• Providing AI-powered resume analysis and ATS scoring
• Generating personalized interview questions and feedback
• Processing payments securely via Razorpay/Stripe
• Improving our AI models (only on anonymized, aggregated data)

We never use your resume content for marketing, advertising, or sharing with third parties.`
            },
            {
              title: '3. Data Sharing Policy',
              content: `We share your data ONLY in these specific cases:

• Google Gemini AI - your resume text is processed by Google's AI for analysis (governed by Google's privacy policy)
• Razorpay/Stripe - payment processing (governed by their privacy policies)
• Supabase - database storage (governed by Supabase's privacy policy)

We DO NOT sell, rent, or share your personal data with any advertisers, data brokers, or third parties for marketing purposes.`
            },
            {
              title: '4. AI Data Processing',
              content: `When you use our AI features (resume analysis, interview prep):

• Your resume/answer text is sent to Google Gemini AI for processing
• The AI processes this data to generate insights, scores, and suggestions
• Your data is NOT stored by Google for training purposes (per Gemini's privacy commitments)
• We do not train our own AI models on your data

You own the output generated from your data.`
            },
            {
              title: '5. Payment Security',
              content: `All payments are processed by trusted providers:

• India: Razorpay (Razorpay's privacy policy applies)
• Global: Stripe (Stripe's privacy policy applies)

We never store your credit card, debit card, or banking details. Payment credentials are handled entirely by these PCI-DSS compliant providers.`
            },
            {
              title: '6. Cookies & Tracking',
              content: `We use minimal cookies:

• Authentication cookies: Required for keeping you logged in
• Preference cookies: Theme (light/dark mode) storage
• No advertising trackers: We don't use Google Analytics, Facebook Pixel, or any ad tracking

You can disable cookies in your browser settings, though some features may not work properly.`
            },
            {
              title: '7. Your Rights',
              content: `You have complete control over your data:

• ACCESS: View all data we store about you anytime
• EXPORT: Download all your resumes and data
• DELETE: Remove your account and all data permanently
• CORRECT: Update any inaccurate information

To exercise these rights, email us at support@craftlycv.in. We respond within 24 hours.`
            },
            {
              title: '8. Data Retention',
              content: `We keep your data only as long as needed:

• Active accounts: Data retained until you delete your account
• Deleted accounts: All data permanently removed within 30 days
• Payment records: Retained for 7 years per financial regulations

After account deletion, backup copies may persist for up to 30 days but are not accessible.`
            },
            {
              title: '9. Security Measures',
              content: `We take security seriously:

• HTTPS/SSL encryption on all pages
• Supabase PostgreSQL with Row Level Security (RLS) enabled
• No data stored in plain text
• Regular security audits
• Environment variables encrypted for API keys

No system is 100% hack-proof, but we follow industry best practices.`
            },
            {
              title: '10. Children's Privacy',
              content: `Our service is not intended for users under 18 years of age. We do not knowingly collect data from minors. If you believe a minor has created an account, contact us immediately at support@craftlycv.in for deletion.`
            },
            {
              title: '11. International Transfers',
              content: `If you're outside India:

• Your data may be processed on servers in multiple countries
• We comply with GDPR for EU users
• Data transfers are covered by standard contractual clauses

Your data stays yours. We just process it where our servers are located.`
            },
            {
              title: '12. Policy Changes',
              content: `We may update this policy periodically. Major changes will be:

• Emailed to all registered users 30 days before taking effect
• Posted prominently on our website
• Updated at the "Last updated" date at the top

Continued use after changes = acceptance of new policy.`
            },
          ].map((section, i) => (
            <div key={i} className="rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{section.title}</h2>
              <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-10 rounded-xl p-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Questions about privacy?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                We're transparent about how we handle your data. Reach out anytime.
              </p>
              <a href="mailto:support@craftlycv.in" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
                support@craftlycv.in <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer nav */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms & Conditions</Link>
          <Link href="/refund" className="hover:text-slate-900 dark:hover:text-white transition-colors">Refund Policy</Link>
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Home</Link>
        </div>
      </main>
    </div>
  )
}
