'use client'

import Link from 'next/link'
import { FileText, ArrowLeft, RefreshCw, Shield, Clock, CheckCircle, Mail, ChevronRight, AlertTriangle } from 'lucide-react'

export default function RefundPage() {
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
            <RefreshCw className="h-4 w-4" />
            Hassle-Free Refunds
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
            Refund Policy
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Last updated: April 20, 2026
          </p>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Clock, title: '7-Day Window', desc: 'Full refund within 7 days of purchase', color: 'blue' },
            { icon: Shield, title: 'No Questions Asked', desc: 'We refund without lengthy processes', color: 'emerald' },
            { icon: RefreshCw, title: 'Fast Process', desc: 'Refund initiated within 48 hours', color: 'purple' },
          ].map((card, i) => (
            <div key={i} className="rounded-xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <card.icon className={`h-6 w-6 text-${card.color}-600 mb-3`} />
              <p className="font-bold text-slate-900 dark:text-white mb-1">{card.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {[
            {
              title: '1. Our Refund Promise',
              content: `We believe in customer satisfaction. If you're not happy with CraftlyCV within 7 days of your purchase, we'll refund you in full — no questions asked.

We want you to feel confident trying CraftlyCV. If our AI resume analysis, interview preparation, or career tools don't meet your expectations, simply reach out and we'll process your refund promptly.`,
              highlight: true
            },
            {
              title: '2. Eligibility for Refund',
              content: `You may request a refund if:

• You purchased a paid Plan within the last 7 days
• You have not exceeded 10 AI feature uses (scans) on the refunded Plan
• You have not downloaded excessive amounts of content
• The refund request is made via email to support@craftlycv.in

Refunds are evaluated case-by-case for:
• Purchases made more than 7 days ago
• Lifetime plan refunds (prorated based on usage)
• Enterprise plan refunds (subject to contract terms)`,
              highlight: false
            },
            {
              title: '3. How to Request a Refund',
              content: `To request a refund:

Step 1: Email support@craftlycv.in with subject line "Refund Request"

Step 2: Include in your email:
• The email address associated with your account
• The Plan you purchased
• Date of purchase
• Reason for refund (optional — but appreciated)

Step 3: We'll confirm receipt within 12 hours and process your refund within 48 hours

Step 4: Refund will be credited to your original payment method within 5-10 business days (Razorpay) or 3-5 business days (Stripe)`,
              highlight: false
            },
            {
              title: '4. Refund Timeline',
              content: `Once approved, refunds are processed as follows:

• Razorpay (India): 5-10 business days to reflect in your account
• Stripe (Global): 3-5 business days
• UPI payments: 1-3 business days
• Bank transfers: 5-7 business days

If you haven't received your refund after the stated timeline, please contact us with your payment details.`,
              highlight: false
            },
            {
              title: '5. Partial Refunds',
              content: `We offer partial refunds in certain cases:

Lifetime Plan (Prorated):
If you purchased a Lifetime plan and request a refund:
• Within 30 days: 75% refund
• Within 60 days: 50% refund
• Within 90 days: 25% refund
• After 90 days: Case-by-case

Unused Scans:
If you have unused scans when requesting a standard refund, we may deduct the value of used scans from your refund amount.`,
              highlight: false
            },
            {
              title: '6. Non-Refundable Items',
              content: `The following are non-refundable:

• Scans already consumed (based on fair usage)
• Purchase made more than 7 days ago (unless Lifetime plan or special circumstances)
• Account terminated for violation of Terms of Service
• Payment processing fees (Razorpay/Stripe charges)
• Customized services that have been delivered and accepted

If you have questions about whether your purchase qualifies for a refund, contact us before purchasing.`,
              highlight: false
            },
            {
              title: '7. Cancellation vs. Refund',
              content: `Important distinction:

CANCELLATION = Stop future billing
• For monthly/yearly plans, cancel to stop future payments
• Cancellation takes effect at the end of your current billing period
• You retain access until the end of your paid period

REFUND = Get money back
• A refund returns money to your original payment method
• Refunds are for purchases you're unsatisfied with
• You can cancel AND request a refund within the 7-day window`,
              highlight: false
            },
            {
              title: '8. Dispute Resolution',
              content: `If you believe a refund was processed incorrectly or if you have a dispute:

Step 1: Contact us at support@craftlycv.in with details

Step 2: We'll investigate and respond within 48 hours

Step 3: If unresolved, you may escalate to:
• Consumer court of appropriate jurisdiction
• Online dispute resolution platforms

We aim to resolve all disputes amicably. Our support team is committed to ensuring fair outcomes for all customers.`,
              highlight: false
            },
            {
              title: '9. Contact Us',
              content: `For refund requests or questions about this policy:

Email: support@craftlycv.in
Subject Line: "Refund Request" or "Refund Question"

We respond to all inquiries within 24-48 hours.

For faster service, include:
• Email address on your CraftlyCV account
• Plan purchased
• Date of purchase
• Payment confirmation (if available)`,
              highlight: false
            },
          ].map((section, i) => (
            <div key={i} className={`rounded-xl p-6 ${section.highlight ? 'bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'}`}>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{section.title}</h2>
              <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-xl p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
          <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-blue-100 mb-4 text-sm">Our support team is here to help you.</p>
          <a href="mailto:support@craftlycv.in" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors">
            <Mail className="h-4 w-4" />
            Contact Support
          </a>
        </div>

        {/* Footer nav */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms & Conditions</Link>
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Home</Link>
        </div>
      </main>
    </div>
  )
}
