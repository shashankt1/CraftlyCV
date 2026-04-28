'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  FileText, LayoutDashboard, Target, Sparkles, FileOutput,
  CreditCard, Settings, Menu, X, ChevronLeft,
  LogOut, Plus, Shield, BarChart3, ChevronRight, MoreHorizontal,
  Briefcase, Mic, Linkedin, Compass, Gift, Zap, Crown,
  TrendingUp, Users, Hexagon
} from 'lucide-react'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Logo } from '@/components/shared/Logo'
import { toast } from 'sonner'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analyze', label: 'ATS Analyzer', icon: Target },
  { href: '/vault', label: 'Resume Vault', icon: FileText },
  { href: '/tailor', label: 'Tailoring Engine', icon: Sparkles },
  { href: '/versions', label: 'Versions', icon: Hexagon },
  { href: '/export', label: 'Export Center', icon: FileOutput },
  { href: '/jobs', label: 'Job Tracker', icon: Briefcase },
  { href: '/mock-interview', label: 'Mock Interview', icon: Mic },
  { href: '/linkedin', label: 'LinkedIn Optimizer', icon: Linkedin },
  { href: '/career', label: 'Career Paths', icon: Compass },
  { href: '/referrals', label: 'Referrals', icon: Gift },
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const BOTTOM_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analyze', label: 'Analyze', icon: Target },
  { href: '/tailor', label: 'Tailor', icon: Sparkles },
  { href: '/versions', label: 'Versions', icon: Hexagon },
  { href: '#more', label: 'More', icon: MoreHorizontal },
]

interface Profile {
  id: string
  email?: string
  scans: number
  plan: string
  username?: string
  first_name?: string
  role?: string
}

// Paywall Modal Component
function PaywallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Out of Scans
          </DialogTitle>
          <DialogDescription>
            You've used all your scans. Upgrade to Pro for unlimited scans and access to all modules.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Crown className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium">Pro Plan</p>
              <p className="text-xs text-muted-foreground">Unlimited scans, all modules, no watermarks</p>
            </div>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Unlimited ATS analyses</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> AI resume tailoring</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Mock interviews</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> LinkedIn optimization</li>
          </ul>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Maybe Later</Button>
          <Button asChild><Link href="/billing">Upgrade Now</Link></Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Check({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// Scan Counter Chip in Header
function ScanCounterChip({ scans, onClick }: { scans: number; onClick?: () => void }) {
  const colorClass = scans === 0 ? 'bg-red-500/20 border-red-500/40' : scans <= 2 ? 'bg-amber-500/20 border-amber-500/40' : 'bg-indigo-500/20 border-indigo-500/40'
  const textClass = scans === 0 ? 'text-red-400' : scans <= 2 ? 'text-amber-400' : 'text-indigo-400'
  const pulseClass = scans === 0 ? 'animate-pulse' : ''

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all hover:opacity-80 min-h-[44px]',
        colorClass, pulseClass
      )}
    >
      <Zap className={cn('h-3.5 w-3.5', textClass)} />
      <span className={cn('text-sm font-bold', textClass)}>{scans}</span>
      <span className={cn('text-xs', textClass)}>scans left</span>
    </button>
  )
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  const pathname = usePathname()

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('sidebar-collapsed') === 'true'
    return false
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileDrawer, setMobileDrawer] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      let { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()

      // FALLBACK: If profile doesn't exist, try to create it
      if (!data) {
        console.warn('Profile missing, attempting fallback creation...')

        // Generate username from email
        const emailPrefix = user.email?.split('@')[0] || 'user'
        const baseUsername = emailPrefix.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'user'
        let username = baseUsername
        let counter = 0

        // Find available username
        while (counter <= 1000) {
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .maybeSingle()

          if (!existing) break
          counter++
          username = `${baseUsername}${counter}`
        }
        if (counter > 1000) username = `user_${user.id.slice(0, 8)}`

        // Generate referral code
        const referralCode = `REF_${user.id.slice(0, 8).toUpperCase()}`

        // Try to insert profile directly
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            username: username,
            scans: 3,
            plan: 'free',
            role: 'user',
            country: 'US',
            language: 'en',
            currency: 'USD',
            professional_track: 'general',
            experience_level: 'mid',
            onboarding_completed: false,
            onboarding_step: 0,
            referral_code: referralCode,
          })

        if (insertError) {
          // If insert failed (e.g., RLS blocking), redirect to onboarding
          // which has its own fallback logic
          console.error('Fallback profile creation failed:', insertError)
          router.push('/onboarding')
          return
        }

        // Re-fetch the newly created profile
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!newProfile) {
          router.push('/onboarding')
          return
        }

        data = newProfile
      }

      setProfile(data)
      if (data?.role === 'admin') setIsAdmin(true)
      setLoading(false)
    }
    init()
  }, [router, supabase])

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [collapsed])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const toggleCollapse = () => setCollapsed(prev => !prev)

  // Check scans before any scan-consuming action
  const checkScans = () => {
    if (profile && profile.scans <= 0) {
      setPaywallOpen(true)
      return false
    }
    return true
  }

  // Expose scan checker globally so other components can trigger paywall
  useEffect(() => {
    (window as any).__craftlyCheckScans = checkScans
    return () => { delete (window as any).__craftlyCheckScans }
  }, [profile])

  const isPro = profile?.plan === 'pro' || profile?.plan === 'lifetime'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col bg-zinc-900 border-r border-zinc-800 transition-all duration-200',
        'fixed left-0 top-0 h-full z-40',
        collapsed ? 'w-16' : 'w-60'
      )}>
        {/* Logo */}
        <div className="flex items-center h-16 border-b border-zinc-800 px-4 shrink-0">
          <Logo href="/dashboard" size="sm" />
        </div>

        {/* Scans badge */}
        {!collapsed && (
          <div className="mx-3 mt-4 mb-2 px-3 py-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-indigo-400">Scans</span>
              <Badge className={cn(
                'text-xs font-bold',
                profile.scans === 0 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                profile.scans <= 2 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
              )}>
                {profile.scans}
              </Badge>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <SidebarNavLink key={item.href} href={item.href} collapsed={collapsed} icon={item.icon}>
              {item.label}
            </SidebarNavLink>
          ))}
          {isAdmin && (
            <SidebarNavLink href="/admin" collapsed={collapsed} icon={Shield}>
              Admin
            </SidebarNavLink>
          )}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-zinc-800 shrink-0">
          {!collapsed ? (
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-zinc-200 truncate">{profile.username || profile.email?.split('@')[0]}</p>
              <p className="text-xs text-zinc-500 truncate mt-0.5">{profile.email}</p>
              <Badge className="mt-2 text-xs capitalize bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                {profile.plan?.replace('_', ' ')}
              </Badge>
            </div>
          ) : (
            <Avatar className="h-8 w-8 mx-auto">
              <AvatarFallback className="text-xs">{profile.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <aside className="absolute left-0 top-0 h-full w-72 bg-zinc-900 border-r border-zinc-800 p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <Logo href="/dashboard" size="sm" onClick={() => setMobileOpen(false)} />
            </div>
            <nav className="space-y-0.5">
              {NAV_ITEMS.map((item) => (
                <MobileNavLink key={item.href} href={item.href} icon={item.icon} onClick={() => setMobileOpen(false)}>
                  {item.label}
                </MobileNavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Mobile Bottom Nav Drawer */}
      {mobileDrawer && (
        <div className="fixed inset-0 bg-black/60 z-50 lg:hidden" onClick={() => setMobileDrawer(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 rounded-t-2xl p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-zinc-200">More</p>
              <Button variant="ghost" size="icon" onClick={() => setMobileDrawer(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {NAV_ITEMS.slice(6).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileDrawer(false)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors min-h-[72px] justify-center"
                >
                  <item.icon className="h-5 w-5 text-indigo-400" />
                  <span className="text-xs text-zinc-400 text-center">{item.label}</span>
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors min-h-[72px] justify-center"
              >
                <LogOut className="h-5 w-5 text-red-400" />
                <span className="text-xs text-red-400">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={cn('flex-1 flex flex-col min-h-screen transition-all duration-200', 'lg:ml-60', collapsed && 'lg:ml-16')}>
        {/* Topbar */}
        <header className="h-16 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden text-zinc-400" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <ScanCounterChip
              scans={profile.scans}
              onClick={() => profile.scans === 0 ? setPaywallOpen(true) : null}
            />

            <Button asChild size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Link href="/versions">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Version</span>
              </Link>
            </Button>

            <ThemeToggle className="text-zinc-400" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-indigo-500/20 text-indigo-400 text-sm">
                      {profile.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-medium text-zinc-100 truncate">{profile.username || profile.email?.split('@')[0]}</p>
                    <Badge className="w-fit text-xs capitalize bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                      {profile.plan?.replace('_', ' ')}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem asChild className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
                  <Link href="/billing">Billing</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800 safe-area-pb">
          <div className="flex items-center justify-around h-16">
            {BOTTOM_NAV.map((item) =>
              item.href === '#more' ? (
                <button
                  key="more"
                  onClick={() => setMobileDrawer(true)}
                  className="flex flex-col items-center gap-1 px-3 py-2 min-w-[60px] min-h-[44px] justify-center"
                >
                  <item.icon className="h-5 w-5 text-zinc-500" />
                  <span className="text-[10px] text-zinc-500">{item.label}</span>
                </button>
              ) : (
                <MobileBottomNavLink key={item.href} href={item.href} icon={item.icon}>
                  {item.label}
                </MobileBottomNavLink>
              )
            )}
          </div>
        </nav>
      </div>

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  )
}

function SidebarNavLink({ href, collapsed, icon: Icon, children }: { href: string; collapsed: boolean; icon: any; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href + '/'))

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px]',
        isActive
          ? 'bg-indigo-500/20 text-indigo-400 border-l-2 border-indigo-500 ml-[-2px]'
          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && <span>{children}</span>}
    </Link>
  )
}

function MobileNavLink({ href, icon: Icon, children, onClick }: { href: string; icon: any; children: React.ReactNode; onClick: () => void }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px]',
        isActive ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </Link>
  )
}

function MobileBottomNavLink({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href + '/'))

  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center gap-1 px-3 py-2 min-w-[60px] min-h-[44px] justify-center transition-colors',
        isActive ? 'text-indigo-400' : 'text-zinc-500'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px]">{children}</span>
    </Link>
  )
}