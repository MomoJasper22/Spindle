import { Suspense } from 'react'
import { requireRole } from '@/lib/auth/session'
import { formatFullName } from '@/lib/formatters'
import { PortalShell, type PortalNavItem } from '@/components/shared/portal-shell'
import { PageSkeleton } from '@/components/shared/page-skeleton'

const CUSTOMER_NAV: PortalNavItem[] = [
  { label: 'Customer Home', href: '/customer/home', icon: 'home' },
  { label: 'Profile & Settings', href: '/customer/profile', icon: 'profile' },
]

async function CustomerLayoutGuard({ children }: { children: React.ReactNode }) {
  const profile = await requireRole('customer')

  return (
    <PortalShell
      role="customer"
      userName={formatFullName(profile)}
      userEmail={profile.email}
      branchLocation={profile.branch_location}
      navItems={CUSTOMER_NAV}
    >
      {children}
    </PortalShell>
  )
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CustomerLayoutGuard>{children}</CustomerLayoutGuard>
    </Suspense>
  )
}
