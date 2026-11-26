'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarClock,
  ClipboardList,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react'
import { SpindleLogo } from '@/components/shared/spindle-logo'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { signOutAction } from '@/features/auth/actions/auth-actions'
import type { UserRole } from '@/lib/constants'

export type NavIconKey =
  | 'home'
  | 'dashboard'
  | 'profile'
  | 'wrench'
  | 'users'
  | 'userCog'
  | 'appliances'
  | 'calendar'
  | 'payments'
  | 'shield'

const NAV_ICONS: Record<NavIconKey, React.ComponentType<{ className?: string }>> = {
  home: Home,
  dashboard: LayoutDashboard,
  profile: Settings,
  wrench: Wrench,
  users: Users,
  userCog: UserCog,
  appliances: ClipboardList,
  calendar: CalendarClock,
  payments: CreditCard,
  shield: ShieldCheck,
}

export interface PortalNavItem {
  label: string
  href: string
  icon: NavIconKey
}

interface PortalShellProps {
  role: UserRole
  userName: string
  userEmail: string
  branchLocation?: string | null
  navItems: PortalNavItem[]
  children: React.ReactNode
}

const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer Portal',
  technician: 'Field Technician',
  admin: 'Operations Admin',
}

export function PortalShell({
  role,
  userName,
  userEmail,
  branchLocation,
  navItems,
  children,
}: PortalShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  function isLinkActive(href: string) {
    const [basePath, hash] = href.split('#')
    if (hash) {
      return false
    }
    return pathname === basePath || pathname.startsWith(`${basePath}/`)
  }

  function renderNavLinks(onNavigate?: () => void) {
    return (
      <nav aria-label={`${ROLE_LABELS[role]} navigation`} className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = NAV_ICONS[item.icon]
          const active = isLinkActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    )
  }

  function renderUserFooter() {
    return (
      <div className="border-t border-slate-800 p-4 space-y-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{userName}</p>
          <p className="truncate text-xs text-slate-400">{userEmail}</p>
          {branchLocation && (
            <p className="mt-1.5 flex items-center gap-1.5 truncate text-[11px] text-teal-300">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{branchLocation}</span>
            </p>
          )}
        </div>
        <form action={signOutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 border border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Sign Out</span>
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-background">
      {/* Desktop Sidebar (Midnight Slate #0F172A) */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:sticky lg:top-0 lg:h-dvh bg-sidebar text-sidebar-foreground border-r border-slate-800">
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
          <Link href={navItems[0]?.href ?? '/'} aria-label="Spindle workspace home">
            <SpindleLogo variant="light" showTagline />
          </Link>
        </div>
        <div className="px-4 pt-4">
          <span className="inline-flex items-center rounded-md bg-slate-800/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-teal-300">
            {ROLE_LABELS[role]}
          </span>
        </div>
        {renderNavLinks()}
        {renderUserFooter()}
      </aside>

      {/* Mobile & Tablet Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open navigation menu">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-sidebar text-sidebar-foreground border-slate-800 p-0 flex flex-col">
              <SheetHeader className="px-5 py-5 border-b border-slate-800">
                <SheetTitle className="text-left">
                  <SpindleLogo variant="light" showTagline />
                </SheetTitle>
                <SheetDescription className="text-left text-xs text-teal-300 font-semibold uppercase tracking-wider pt-1">
                  {ROLE_LABELS[role]}
                </SheetDescription>
              </SheetHeader>
              {renderNavLinks(() => setMobileOpen(false))}
              {renderUserFooter()}
            </SheetContent>
          </Sheet>
          <SpindleLogo variant="dark" size="sm" />
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="hidden sm:inline-block truncate text-xs font-medium text-muted-foreground max-w-[160px]">
            {userName}
          </span>
          <span className="inline-flex items-center rounded-full bg-primary-tint px-2.5 py-0.5 text-xs font-semibold text-primary">
            {role.toUpperCase()}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="flex-1 min-w-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
