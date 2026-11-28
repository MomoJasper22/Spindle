'use client'

import * as React from 'react'
import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarCheck,
  CreditCard,
  Home,
  Laptop,
  User,
} from 'lucide-react'
import { SpindleLogo } from '@/components/shared/spindle-logo'
import { UserAvatar } from '@/components/shared/user-avatar'
import type { AvatarPosition } from '@/lib/avatar'
import { cn } from '@/lib/utils'

interface CustomerShellProps {
  firstName?: string
  userName: string
  avatarUrl?: string | null
  avatarPosition?: AvatarPosition | null
  children: React.ReactNode
}

const CUSTOMER_TABS = [
  { label: 'Home', mobileLabel: 'Home', href: '/customer/home', icon: Home },
  { label: 'My Appliances', mobileLabel: 'Appliances', href: '/customer/appliances', icon: Laptop },
  { label: 'Bookings', mobileLabel: 'Bookings', href: '/customer/bookings', icon: CalendarCheck },
  { label: 'Payments', mobileLabel: 'Payments', href: '/customer/payments', icon: CreditCard },
] as const

function NavLinkPendingDot() {
  const { pending } = useLinkStatus()
  if (!pending) return null
  return (
    <span
      aria-hidden="true"
      className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
    />
  )
}

export function CustomerShell({
  userName,
  avatarUrl,
  avatarPosition,
  children,
}: CustomerShellProps) {
  const pathname = usePathname()
  const [pendingHref, setPendingHref] = React.useState<string | null>(null)

  React.useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  function isActive(href: string) {
    if (pendingHref) {
      return pendingHref === href
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  function handleNavClick(href: string) {
    if (pathname !== href) {
      setPendingHref(href)
    }
  }

  const profileActive = isActive('/customer/profile')

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      {/* Desktop Top Navigation (No Sidebar) */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/customer/home"
            prefetch={true}
            onClick={() => handleNavClick('/customer/home')}
            aria-label="Spindle Home"
            className="shrink-0"
          >
            <SpindleLogo variant="dark" size="sm" />
          </Link>

          <nav aria-label="Customer navigation" className="hidden md:flex items-center gap-1">
            {CUSTOMER_TABS.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => handleNavClick(item.href)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors',
                    active
                      ? 'bg-primary-tint text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                  <NavLinkPendingDot />
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/customer/profile"
              prefetch={true}
              onClick={() => handleNavClick('/customer/profile')}
              aria-current={profileActive ? 'page' : undefined}
              aria-label="Open your profile and settings"
              className={cn(
                'inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 text-sm font-medium transition-colors',
                profileActive
                  ? 'border-primary bg-primary-tint text-primary'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              )}
            >
              <UserAvatar
                avatarUrl={avatarUrl}
                avatarPosition={avatarPosition}
                name={userName}
                size="sm"
              />
              <span className="hidden sm:inline max-w-[220px] truncate">{userName}</span>
              <NavLinkPendingDot />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="flex-1 min-w-0">
        <div className="mx-auto max-w-6xl px-4 pt-5 pb-24 sm:px-6 sm:pt-7 md:pb-12">
          {children}
        </div>
      </main>

      {/* Dedicated Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md pb-safe md:hidden"
      >
        <div className="grid grid-cols-5">
          {CUSTOMER_TABS.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => handleNavClick(item.href)}
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
                <span className="truncate">{item.mobileLabel}</span>
              </Link>
            )
          })}

          <Link
            href="/customer/profile"
            prefetch={true}
            onClick={() => handleNavClick('/customer/profile')}
            aria-current={profileActive ? 'page' : undefined}
            className={cn(
              'relative flex min-h-[54px] flex-col items-center justify-center gap-1 px-1 py-1.5 text-[11px] font-semibold transition-colors',
              profileActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {profileActive && (
              <span
                aria-hidden="true"
                className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
              />
            )}
            <User className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="truncate">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
