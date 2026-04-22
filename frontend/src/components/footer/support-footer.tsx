'use client'

import { Mail, Clock, Shield, MessageCircle, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface SupportFooterProps {
  email?: string
  responseTime?: string
  className?: string
}

export function SupportFooter({
  email = 'shashankt16@gmail.com',
  responseTime = '24 hours',
  className
}: SupportFooterProps) {
  return (
    <div className={cn('w-full bg-slate-900/50 backdrop-blur border-t border-slate-800', className)}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Trust Statement */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-white">Privacy & Security</h3>
            </div>
            <p className="text-sm text-slate-400">
              Your data is encrypted and never shared with third parties. We comply with GDPR and CCPA regulations.
            </p>
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <Clock className="h-4 w-4" />
              <span>Data retained for 90 days after account deletion</span>
            </div>
          </div>

          {/* Direct Contact */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-white">Contact Founder</h3>
            </div>
            <p className="text-sm text-slate-400">
              Questions about your data? Reach out directly — we respond within {responseTime}.
            </p>
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors group"
            >
              <span className="font-medium">{email}</span>
              <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

          {/* Help Resources */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-white">Help & Support</h3>
            </div>
            <div className="space-y-2 text-sm">
              <a href="#" className="block text-slate-400 hover:text-white transition-colors">📖 Documentation</a>
              <a href="#" className="block text-slate-400 hover:text-white transition-colors">💬 Live Chat (Pro)</a>
              <a href="#" className="block text-slate-400 hover:text-white transition-colors">📹 Video Tutorials</a>
              <a href="#" className="block text-slate-400 hover:text-white transition-colors">❓ FAQ</a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-slate-500 text-sm">CraftlyCV © 2026</span>
            <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">v1.0.0</Badge>
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupportFooter