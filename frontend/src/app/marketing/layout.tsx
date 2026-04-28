import type { Metadata } from 'next'
import Link from 'next/link'
import { Github, Twitter } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

export const metadata: Metadata = {
  title: 'Free ATS Resume Checker | CraftlyCV — AI Job Application Engine',
  description: 'Check your resume\'s ATS score free. CraftlyCV diagnoses ATS rejection, tailors your resume for any job, and helps you get more interviews. Trusted by job seekers across India.',
  keywords: ['ATS score checker', 'free ATS scanner', 'resume analyzer', 'ATS resume checker', 'CraftlyCV'],
  authors: [{ name: 'CraftlyCV' }],
  icons: { icon: '/logo.jpeg' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://craftlycv.in',
    siteName: 'CraftlyCV',
    title: 'Free ATS Resume Checker | CraftlyCV',
    description: 'Check your resume\'s ATS score free. AI diagnoses ATS rejection, tailors your resume for any job, and helps you get more interviews.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'CraftlyCV - ATS Resume Checker' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free ATS Resume Checker | CraftlyCV',
    description: 'Check your resume\'s ATS score free. AI diagnoses ATS rejection, tailors your resume for any job.',
    images: ['/og-image.png'],
  },
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white antialiased">
      {/* ─── STICKY NAV ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Logo size="md" />

          {/* Center links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-white/60 hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</Link>
            <Link href="#faq" className="text-sm text-white/60 hover:text-white transition-colors">FAQ</Link>
          </div>

          {/* Right CTA */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/auth?redirect=/analyze"
              className="h-9 px-4 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center hover:bg-blue-500 transition-all hover:scale-105 hover:-translate-y-0.5 shadow-lg shadow-blue-600/25"
            >
              Get Free ATS Score
            </Link>
          </div>
        </nav>
      </header>

      {children}

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#06060c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1 space-y-3">
              <Logo size="sm" text={false} />
              <p className="text-sm text-white/40 max-w-xs">The AI job application engine. Stop getting rejected. Start getting interviews.</p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-sm text-white/50 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="text-sm text-white/50 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/auth" className="text-sm text-white/50 hover:text-white transition-colors">Free ATS Score</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-sm text-white/50 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-sm text-white/50 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/refund" className="text-sm text-white/50 hover:text-white transition-colors">Refund Policy</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-sm text-white/50 hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/blog" className="text-sm text-white/50 hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/30">© 2025 CraftlyCV. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="https://twitter.com" target="_blank" rel="noopener" className="text-white/30 hover:text-white transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener" className="text-white/30 hover:text-white transition-colors">
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'CraftlyCV',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description: 'AI-powered ATS resume checker and job application engine that helps job seekers get more interviews.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              description: 'Free ATS score checker',
            },
            url: 'https://craftlycv.in',
          }),
        }}
      />
    </div>
  )
}