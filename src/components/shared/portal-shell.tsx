'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarClock,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Home,
  LayoutDashboard,
  MapPin,
  Menu,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react'
import { SpindleLogo } from '@/components/shared/spindle-logo'
import { UserAvatar } from '@/components/shared/user-avatar'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { AvatarPosition } from '@/lib/avatar'
import { cn } from '@/lib/utils'
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
  mobileLabel?: string
  href: string
  icon: NavIconKey
}

interface PortalShellProps {
  role: UserRole
  roleBadgeLabel?: string
  userName: string
  userEmail: string
  avatarUrl?: string | null
  avatarPosition?: AvatarPosition | null
  branchLocation?: string | null
  profileHref: string
  navItems: PortalNavItem[]
  children: React.ReactNode
}

const ROLE_LABELS: Partial<Record<UserRole, string>> = {
  technician: 'Field Technician',
  admin: 'Operations Admin',
}

export function PortalShell({
  role,
  roleBadgeLabel,
  userName,
  userEmail,
  avatarUrl,
  avatarPosition,
  branchLocation,
  profileHref,
  navItems,
  children,
}: PortalShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const roleLabel = roleBadgeLabel ?? ROLE_LABELS[role]

  function isLinkActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const profileActive = isLinkActive(profileHref)
  const mobileBarItems = navItems.slice(0, 4)
  const hasOverflowNav = navItems.length > 4
  const mobileColCount = mobileBarItems.length + (hasOverflowNav ? 1 : 0)
  const mobileGridClass =
    mobileColCount <= 1
      ? 'grid-cols-1'
      : mobileColCount === 2
        ? 'grid-cols-2'
        : mobileColCount === 3
          ? 'grid-cols-3'
          : mobileColCount === 5
            ? 'grid-cols-5'
            : 'grid-cols-4'

  function renderNavLinks(onNavigate?: () => void) {
    return (
      <nav aria-label={`${role} navigation`} className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = NAV_ICONS[item.icon]
          const active = isLinkActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
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

  function renderUserFooter(onNavigate?: () => void) {
    return (
      <div className="border-t border-slate-800 p-3">
        <Link
          href={profileHref}
          onClick={onNavigate}
          aria-current={profileActive ? 'page' : undefined}
          aria-label="Open your profile and settings"
          className={cn(
            'group flex items-center gap-3 rounded-xl p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400',
            profileActive
              ? 'bg-slate-800 ring-1 ring-teal-500/50'
              : 'hover:bg-slate-800/90'
          )}
        >
          <UserAvatar
            avatarUrl={avatarUrl}
            avatarPosition={avatarPosition}
            name={userName}
            size="md"
            variant="dark"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{userName}</p>
            <p className="truncate text-xs text-slate-400">{userEmail}</p>
            {branchLocation && (
              <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-teal-300">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{branchLocation}</span>
              </p>
            )}
          </div>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-white"
            aria-hidden="true"
          />
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-background">
      {/* Desktop Sidebar (Deep Ink-Navy #141B29) */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:sticky lg:top-0 lg:h-dvh bg-sidebar text-sidebar-foreground border-r border-slate-800">
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
          <Link href={navItems[0]?.href ?? '/'} aria-label="Spindle workspace home">
            <SpindleLogo variant="light" showTagline />
          </Link>
        </div>
        {roleLabel && (
          <div className="px-4 pt-4">
            <span className="inline-flex items-center rounded-md bg-slate-800/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-teal-300">
              {roleLabel}
            </span>
          </div>
        )}
        {renderNavLinks()}
        {renderUserFooter()}
      </aside>

      {/* Mobile & Tablet Compact Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-xs lg:hidden">
        <div className="flex items-center gap-2.5">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open navigation menu" className="h-9 w-9">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-sidebar text-sidebar-foreground border-slate-800 p-0 flex flex-col">
              <SheetHeader className="px-5 py-5 border-b border-slate-800">
                <SheetTitle className="text-left">
                  <SpindleLogo variant="light" showTagline />
                </SheetTitle>
                <SheetDescription
                  className={cn(
                    !roleLabel
                      ? 'sr-only'
                      : 'text-left text-xs text-teal-300 font-semibold uppercase tracking-wider pt-1'
                  )}
                >
                  {roleLabel ?? 'Account navigation'}
                </SheetDescription>
              </SheetHeader>
              {renderNavLinks(() => setMobileOpen(false))}
              {renderUserFooter(() => setMobileOpen(false))}
            </SheetContent>
          </Sheet>
          <Link href={navItems[0]?.href ?? '/'}>
            <SpindleLogo variant="dark" size="sm" />
          </Link>
        </div>

        <Link
          href={profileHref}
          aria-label="Open your profile and settings"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 text-xs font-semibold text-foreground hover:bg-muted"
        >
          <UserAvatar
            avatarUrl={avatarUrl}
            avatarPosition={avatarPosition}
            name={userName}
            size="sm"
          />
          <span className="hidden sm:inline max-w-[140px] truncate">{userName}</span>
          {roleLabel && (
            <span className="rounded-full bg-primary-tint px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
              {role}
            </span>
          )}
        </Link>
      </header>

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="flex-1 min-w-0">
        <div className="mx-auto max-w-7xl px-4 pt-5 pb-24 sm:px-6 sm:pt-7 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>

      {/* Dedicated Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile quick navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md pb-safe lg:hidden"
      >
        <div className={cn('grid', mobileGridClass)}>
          {mobileBarItems.map((item) => {
            const Icon = NAV_ICONS[item.icon]
            const active = isLinkActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-[54px] flex-col items-center justify-center gap-1 px-1 py-1.5 text-[11px] font-semibold transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
                  />
                )}
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.mobileLabel ?? item.label}</span>
              </Link>
            )
          })}

          {hasOverflowNav && (
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex min-h-[54px] flex-col items-center justify-center gap-1 px-1 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>More</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  )
}
