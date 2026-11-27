import { Suspense } from 'react'
import { requireRole } from '@/lib/auth/session'
import { formatFullName } from '@/lib/formatters'
import { PortalShell, type PortalNavItem } from '@/components/shared/portal-shell'
import { PageSkeleton } from '@/components/shared/page-skeleton'

const TECHNICIAN_NAV: PortalNavItem[] = [
  { label: 'Overview', mobileLabel: 'Overview', href: '/technician/dashboard', icon: 'dashboard' },
  { label: 'Jobs & Schedule', mobileLabel: 'Jobs', href: '/technician/jobs', icon: 'wrench' },
  { label: 'Field Collections', mobileLabel: 'Payments', href: '/technician/collections', icon: 'payments' },
]

async function TechnicianLayoutGuard({ children }: { children: React.ReactNode }) {
  const profile = await requireRole('technician')

  return (
    <PortalShell
      role="technician"
      userName={formatFullName(profile)}
      userEmail={profile.email}
      avatarUrl={profile.avatar_url}
      avatarPosition={profile.avatar_position}
      branchLocation={profile.branch_location}
      profileHref="/technician/profile"
      navItems={TECHNICIAN_NAV}
    >
      {children}
    </PortalShell>
  )
}

export default function TechnicianLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TechnicianLayoutGuard>{children}</TechnicianLayoutGuard>
    </Suspense>
  )
}
