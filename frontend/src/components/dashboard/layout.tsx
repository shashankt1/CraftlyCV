'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText, Target, Sparkles, MessageSquare, Zap, LogOut, CreditCard,
  Share2, Clock, Sun, Moon, Shield, Briefcase, Mic, Linkedin,
  LayoutDashboard, Menu, X, ChevronLeft, ChevronRight, TrendingUp,
  Settings, HelpCircle, ExternalLink
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAppStore } from '@/lib/store'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Logo } from '@/components/shared/Logo'

interface DashboardLayoutProps {
  children: React.ReactNode
  profile: {
    id: string
    username: string
    scans: number
    plan: 'free' | 'pro' | 'enterprise'
    email: string
  }
  onSignOut: () => void
  isAdmin?: boolean
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analyze', label: 'ATS Analyzer', icon: Target, pro: false },
  { href: '/tailor', label: 'Tailor to Job', icon: Sparkles, pro: true },
  { href: '/interview', label: 'Interview Prep', icon: MessageSquare, pro: true },
  { href: '/linkedin', label: 'LinkedIn', icon: Linkedin, pro: false },
  { href: '/career', label: 'Career', icon: Briefcase, pro: false },
  { href: '/mock-interview', label: 'Mock Interview', icon: Mic, pro: true },
  { href: '/income', label: 'Income Paths', icon: TrendingUp, pro: false },
]

export function DashboardLayout({ children, profile, onSignOut, isAdmin }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { gigs, sidebarOpen, toggleSidebar } = useAppStore()

  const plan = profile.plan === 'pro' || profile.plan === 'enterprise'

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex">
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r transition-all duration-300',
          'fixed left-0 top-0 h-full z-40',
          collapsed ? 'w-20' : 'w-72'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center h-16 border-b px-4', collapsed ? 'justify-center' : 'justify-between')}>
          <Logo href="/dashboard" size="sm" text={true} />
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="hidden lg:block">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const locked = item.pro && !plan
            const active = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={locked ? '#' : item.href}
                onClick={(e) => locked && e.preventDefault()}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all',
                  active ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800',
                  locked && 'opacity-50 cursor-not-allowed',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
                {!collapsed && locked && <Badge className="ml-auto text-xs bg-purple-600">Pro</Badge>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t space-y-2">
          {!collapsed && (
            <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Scans Remaining</span>
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">{profile.scans}</div>
              <Progress value={(profile.scans / 50) * 100} className="mt-2 h-1.5" />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn('flex-1 justify-start', collapsed && 'justify-center px-2')}>
                  <Avatar className="h-8 w-8"><AvatarFallback>{profile.email?.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                  {!collapsed && <span className="ml-2 text-sm truncate">{profile.username}</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profile.email}</p>
                    <Badge variant="secondary" className="text-xs w-fit">{profile.plan}</Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/pricing"><CreditCard className="mr-2 h-4 w-4" />Buy Scans</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
                <DropdownMenuItem><HelpCircle className="mr-2 h-4 w-4" />Help</DropdownMenuItem>
                {isAdmin && (<><DropdownMenuSeparator /><DropdownMenuItem asChild><Link href="/admin" className="text-purple-600"><Shield className="mr-2 h-4 w-4" />Admin</Link></DropdownMenuItem></>)}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut} className="text-red-600"><LogOut className="mr-2 h-4 w-4" />Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <aside className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-slate-900 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">CraftlyCV</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></Button>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const locked = item.pro && !plan
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={locked ? '#' : item.href}
                    onClick={(e) => { if (locked) e.preventDefault(); else setMobileOpen(false) }}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all',
                      active ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800',
                      locked && 'opacity-50'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                    {locked && <Badge className="ml-auto text-xs bg-purple-600">Pro</Badge>}
                  </Link>
                )
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className={cn('flex-1 flex flex-col min-h-screen transition-all duration-300', collapsed ? 'lg:ml-20' : 'lg:ml-72')}>
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-white dark:bg-slate-900 border-b">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></Button>
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold">CraftlyCV</span>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-blue-50 dark:bg-blue-950 px-3 py-1.5 rounded-full">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">{profile.scans}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-8">
          {children}
        </div>

        {/* Income Radar Footer */}
        {gigs.length > 0 && <IncomeRadar gigs={gigs} />}
      </main>
    </div>
  )
}

// Income Radar Ticker Component
function IncomeRadar({ gigs }: { gigs: Array<{ id: string; title: string; platform: string; rate: string; url: string }> }) {
  const duplicatedGigs = [...gigs, ...gigs, ...gigs, ...gigs] // Duplicate for seamless loop

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900 to-slate-800 border-t border-slate-700 z-30">
      <div className="flex items-center">
        <div className="flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Live Gigs</span>
        </div>
        <div className="overflow-hidden flex-1 py-3">
          <div className="animate-ticker-scroll flex space-x-8 whitespace-nowrap">
            {duplicatedGigs.map((gig, i) => (
              <a
                key={`${gig.id}-${i}`}
                href={gig.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors group"
              >
                <span className="text-xs px-2 py-0.5 rounded bg-green-600/20 text-green-400 font-medium">{gig.platform}</span>
                <span className="text-sm">{gig.title}</span>
                <span className="text-sm font-bold text-green-400">{gig.rate}</span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout