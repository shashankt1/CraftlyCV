'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Lock, Eye, Trash2, Check } from 'lucide-react'
import Link from 'next/link'

const trustStatements = [
  {
    icon: Shield,
    title: 'Your data is never sold',
    description:
      'Your resume and career data is never sold or shared with recruiters or third parties.',
  },
  {
    icon: Eye,
    title: 'AI transparency',
    description:
      'All AI-generated content is clearly labeled. Always review before submitting to employers.',
  },
  {
    icon: Trash2,
    title: 'Full deletion rights',
    description:
      'You can permanently delete all your data at any time — no questions asked.',
  },
  {
    icon: Lock,
    title: 'Minimal data collection',
    description:
      'We store only what\'s needed to run your account. Nothing more.',
  },
]

const dataRights = [
  {
    title: 'Right to Access',
    description: 'Request a full export of your data',
  },
  {
    title: 'Right to Correction',
    description: 'Update your profile and resume at any time',
  },
  {
    title: 'Right to Deletion',
    description: 'Permanently delete your account and all data',
  },
  {
    title: 'Right to Portability',
    description: 'Download your data in standard JSON format',
  },
]

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Privacy Center</h1>
        <p className="text-muted-foreground">
          Your privacy, your control. Learn how we protect and handle your data.
        </p>
      </div>

      {/* Trust Statements */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Our Commitments to You</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {trustStatements.map((item, index) => (
            <Card key={index} className="bg-zinc-950 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-zinc-900">
                    <item.icon className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-100 mb-1">{item.title}</h3>
                    <p className="text-sm text-zinc-400">{item.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Your Data Rights */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Your Data Rights</h2>
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {dataRights.map((right, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-zinc-100">{right.title}</h3>
                    <p className="text-sm text-zinc-400">{right.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Security */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Security</h2>
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="pt-6">
            <p className="text-zinc-300 mb-4">
              We take security seriously. All your data is encrypted in transit and at rest using
              industry-standard encryption. We never share your data with third parties, and our
              systems are regularly audited for security compliance.
            </p>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                AES-256 encryption at rest
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                TLS 1.3 for all data transfers
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Regular security audits
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                No third-party data sharing
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Cookies */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Cookies</h2>
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">What We Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-zinc-100">Authentication</h3>
              <p className="text-sm text-zinc-400">
                Essential cookies that keep you logged in and secure your session.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-zinc-100">Analytics</h3>
              <p className="text-sm text-zinc-400">
                Anonymous usage data to help us improve CraftlyCV. You can opt out in settings.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-zinc-100">Preferences</h3>
              <p className="text-sm text-zinc-400">
                Cookies that remember your settings like language and theme preferences.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Contact CTA */}
      <Card className="bg-blue-950/30 border-blue-900/50">
        <CardContent className="pt-6 text-center">
          <p className="text-zinc-300 mb-2">Questions? We&apos;re here to help.</p>
          <Link
            href="mailto:support@craftlycv.in"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Contact our support team
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
