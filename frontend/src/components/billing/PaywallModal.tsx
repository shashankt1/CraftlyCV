'use client'

import { Zap, Star, CreditCard, Shield } from 'lucide-react'
import Link from 'next/link'
import { PLANS } from '@/lib/plans'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface PaywallModalProps {
  open: boolean
  onClose: () => void
  featureName: string
}

export function PaywallModal({ open, onClose, featureName }: PaywallModalProps) {
  const starterPlan = PLANS.find(p => p.id === 'starter')
  const proPlan = PLANS.find(p => p.id === 'pro')
  const lifetimePlan = PLANS.find(p => p.id === 'lifetime')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            Unlock {featureName}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Get access to {featureName} with a paid plan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Feature CTAs */}
          <div className="space-y-3">
            <Link href="/billing" onClick={onClose}>
              <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700">
                <Zap className="w-4 h-4 mr-2 text-amber-500" />
                Get Starter Pack — ₹199
              </Button>
            </Link>

            <Link href="/billing" onClick={onClose}>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
                <Star className="w-4 h-4 mr-2" />
                Go Pro — ₹499/month
              </Button>
            </Link>
          </div>

          {/* Lifetime option */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-950 px-2 text-zinc-500">or</span>
            </div>
          </div>

          <Link href="/billing" onClick={onClose}>
            <Button
              variant="outline"
              className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <Crown className="w-4 h-4 mr-2 text-amber-400" />
              {lifetimePlan?.priceLabel} — forever
            </Button>
          </Link>

          {/* Payment methods */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-zinc-500">
              <CreditCard className="w-3.5 h-3.5" />
              <span className="text-xs">Cards</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-500">
              <span className="text-xs">UPI</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-500">
              <span className="text-xs">Netbanking</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-500">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-xs">Secure</span>
            </div>
          </div>
        </div>

        <DialogFooter className="text-xs text-zinc-500 text-center sm:justify-center">
          All payments are processed securely via Razorpay
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper component for inline upgrade buttons
interface UpgradeButtonProps {
  planId: 'starter' | 'pro' | 'lifetime'
  children: React.ReactNode
  className?: string
}

export function UpgradeButton({ planId, children, className }: UpgradeButtonProps) {
  return (
    <Link href={`/billing?upgrade=${planId}`} className={className}>
      <Button variant="default" size="sm" className="bg-indigo-600 hover:bg-indigo-500">
        {children}
      </Button>
    </Link>
  )
}
