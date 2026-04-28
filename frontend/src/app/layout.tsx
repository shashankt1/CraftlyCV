import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/error-boundary'
import { PostHogProvider } from '@/components/providers/posthog-provider'
import { PostHogPageView } from '@/components/providers/posthog-pageview'
import { Suspense } from 'react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://craftlycv.in'),
  title: {
    default: 'CraftlyCV - Get Hired or Start Earning in 7 Days',
    template: '%s | CraftlyCV',
  },
  description: 'AI Resume Builder + Real Interview Practice + Jobs + Gigs. Everything you need to get a job or make money online — in one platform.',
  keywords: ['resume builder', 'ATS score', 'interview practice', 'job search', 'freelance', 'AI resume', 'career os', 'get hired'],
  authors: [{ name: 'CraftlyCV' }],
  creator: 'CraftlyCV',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://craftlycv.in',
    siteName: 'CraftlyCV',
    title: 'CraftlyCV - Get Hired or Start Earning in 7 Days',
    description: 'AI Resume Builder + Real Interview Practice + Jobs + Gigs. Everything you need to get a job or make money online.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'CraftlyCV - Career OS' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CraftlyCV - Get Hired or Start Earning in 7 Days',
    description: 'AI Resume Builder + Real Interview Practice + Jobs + Gigs.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <PostHogProvider>
          <ErrorBoundary>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
              <Suspense fallback={null}>
                <PostHogPageView />
              </Suspense>
              {children}
              <Toaster position="top-right" richColors />
            </ThemeProvider>
          </ErrorBoundary>
        </PostHogProvider>
      </body>
    </html>
  )
}
