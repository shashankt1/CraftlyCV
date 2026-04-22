'use client'

import Link from 'next/link'
import { FileText, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060c1a] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#060c1a]" />
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.09]"
          style={{ background: 'radial-gradient(circle, #1E6FD9 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #FF6B35 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 text-center px-4">
        {/* 404 Text with 3D effect */}
        <div className="mb-8">
          <h1
            className="text-[150px] md:text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent select-none leading-none"
            style={{
              textShadow: '0 0 80px rgba(59, 130, 246, 0.3)',
              transform: 'perspective(500px) rotateX(10deg)',
            }}
          >
            404
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full mx-auto -mt-8" />
        </div>

        {/* Content */}
        <div className="max-w-md mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 px-4 py-2 rounded-full">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Page not found</span>
          </div>

          <h2 className="text-3xl font-bold text-white">
            This page seems to have moved on
          </h2>

          <p className="text-white/50 text-lg leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Let&apos;s get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-blue-500/20">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-medium px-6 py-3 rounded-xl transition-all"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Floating decoration */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-blue-500/5 blur-3xl animate-float" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-orange-500/5 blur-3xl animate-float" />
      </div>
    </div>
  )
}
