'use client'

import Link from 'next/link'
import { FileText, ArrowLeft, Shield, Lock, Eye, Zap, ChevronRight } from 'lucide-react'

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Shield className="h-4 w-4" />
            Legal Agreement
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
            Terms & Conditions
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Last updated: April 20, 2026
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {[
            {
              title: '1. Acceptance of Terms',
              content: `By accessing and using CraftlyCV ("the Platform", "we", "us", or "our"), you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree to these Terms, please do not use the Platform.

These Terms constitute a legally binding agreement between you and CraftlyCV regarding your use of the Platform and its services.`
            },
            {
              title: '2. Description of Service',
              content: `CraftlyCV provides an AI-powered career platform including but not limited to:
• AI Resume Analyzer with ATS scoring
• AI-powered Resume Builder and tailoring
• Mock Interview Simulator
• Job search and career guidance
• Income and freelance guidance (collectively, "Services")

We reserve the right to modify, suspend, or discontinue any part of the Services at any time.`
            },
            {
              title: '3. User Accounts',
              content: `To access certain features, you must create an account. You agree to:
• Provide accurate, current, and complete information
• Maintain and promptly update your information
• Keep your password secure and confidential
• Notify us immediately of any unauthorized access
• Accept responsibility for all activities under your account

We reserve the right to suspend or terminate accounts that violate these Terms.`
            },
            {
              title: '4. Subscription & Payments',
              content: `Some Services require paid subscriptions ("Plans"). By subscribing to a Plan:
• You agree to pay all fees associated with your chosen Plan
• Plans are billed in advance on a monthly or annual basis
• Lifetime plans are billed as a one-time payment
• All payments are processed through Razorpay (India) or Stripe (Global)
• We do not store your payment card details

Pricing is subject to change with 30 days notice for ongoing subscriptions.`
            },
            {
              title: '5. Scans and Credits',
              content: `CraftlyCV uses a "scans" system where certain AI features consume scan credits:
• Free accounts receive 10 scans on signup
• Different features consume different amounts of scans
• Unused scans do not roll over to subsequent months
• Scans are tied to your account and are non-transferable

We reserve the right to modify scan costs and allocation at any time.`
            },
            {
              title: '6. Refund Policy',
              content: `We offer a 7-day refund guarantee for paid Plans:
• If you're not satisfied with CraftlyCV within 7 days of purchase, contact us for a full refund
• Refund requests after 7 days are evaluated on a case-by-case basis
• Lifetime plan refunds are prorated based on usage
• To request a refund: email support@craftlycv.in

See our full Refund Policy for details.`
            },
            {
              title: '7. User Content',
              content: `You retain ownership of all content you submit to the Platform ("User Content"):
• You grant us a limited license to process your content for Services
• We do not use your resume content to train AI models
• You represent that you have the right to submit all User Content
• We are not responsible for User Content provided by third parties

You agree not to submit content that:
• Violates any law or regulation
• Infringes on intellectual property rights
• Contains malicious code or viruses
• Is offensive, defamatory, or discriminatory`
            },
            {
              title: '8. Intellectual Property',
              content: `The Platform and its original content, features, and functionality are owned by CraftlyCV and are protected by international copyright, trademark, and other intellectual property laws.

You may not:
• Copy, modify, or distribute our content without permission
• Use our trademarks without written consent
• Reverse engineer or decompile the Platform
• Remove any copyright or proprietary notices`
            },
            {
              title: '9. AI-Generated Content',
              content: `Content generated by our AI Services ("AI Content"):
• AI Content is generated based on your input and may not be accurate
• You are responsible for reviewing and verifying AI-generated content
• AI Content should not be used as the sole basis for any decision
• We do not guarantee the accuracy, completeness, or reliability of AI Content

We recommend human review before using AI-generated resumes or interview advice in high-stakes situations.`
            },
            {
              title: '10. Limitation of Liability',
              content: `To the maximum extent permitted by law:

CRAFTLYCV SHALL NOT BE LIABLE FOR:
• Any indirect, incidental, special, consequential, or punitive damages
• Loss of profits, revenue, data, or business opportunities
• Damages arising from your use of or inability to use the Services
• Actions taken based on AI-generated content or advice

Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.`
            },
            {
              title: '11. Disclaimer of Warranties',
              content: `THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.

WE DISCLAIM ALL WARRANTIES INCLUDING BUT NOT LIMITED TO:
• Merchantability, fitness for a particular purpose
• Non-infringement
• Accuracy, reliability, or availability
• That the Services will meet your requirements
• That errors or defects will be corrected`

},
            {
              title: '12. Indemnification',
              content: `You agree to indemnify, defend, and hold harmless CraftlyCV, its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including legal fees) arising from:
• Your use of the Services
• Your violation of these Terms
• Your violation of any third-party rights
• Any fraudulent or unlawful activity under your account`
            },
            {
              title: '13. Privacy',
              content: `Your privacy is important to us. Please review our Privacy Policy, which explains how we collect, use, and protect your personal information.

By using CraftlyCV, you consent to our data practices as described in the Privacy Policy.

Key points:
• We do not sell your personal data
• Your resume content is processed only for AI analysis
• You can request deletion of your data at any time
• We use industry-standard security measures`
            },
            {
              title: '14. Termination',
              content: `We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including:
• Breach of these Terms
• Fraudulent or illegal activity
• Failure to pay fees
• Extended period of inactivity

Upon termination:
• Your right to use the Services ceases immediately
• We may retain certain data as required by law
• These Terms remain in effect for any provisions that should survive termination`
            },
            {
              title: '15. Governing Law',
              content: `These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles.

Any disputes arising from these Terms or your use of CraftlyCV shall be subject to the exclusive jurisdiction of the courts in [Your Jurisdiction].

If you have any questions about these Terms, please contact us at support@craftlycv.in.`
            },
            {
              title: '16. Changes to Terms',
              content: `We reserve the right to modify these Terms at any time:
• Material changes will be communicated via email or Platform notification
• Changes will be effective 30 days after notification
• Your continued use of the Services after changes constitutes acceptance
• If you do not agree to changes, you may terminate your account

We encourage you to review these Terms periodically.`
            },
            {
              title: '17. Contact Information',
              content: `For questions about these Terms & Conditions, please contact us:

Email: support@craftlycv.in
Website: https://craftlycv.in

We will respond to your inquiry within 24-48 hours.`
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

        {/* Footer nav */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/refund" className="hover:text-slate-900 dark:hover:text-white transition-colors">Refund Policy</Link>
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Home</Link>
        </div>
      </main>
    </div>
  )
}
