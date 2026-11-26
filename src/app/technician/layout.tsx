import { Suspense } from 'react'
import { requireRole } from '@/lib/auth/session'
import { formatFullName } from '@/lib/formatters'
import { PortalShell, type PortalNavItem } from '@/components/shared/portal-shell'
import { PageSkeleton } from '@/components/shared/page-skeleton'

const TECHNICIAN_NAV: PortalNavItem[] = [
  { label: 'Technician Dashboard', href: '/technician/dashboard', icon: 'dashboard' },
  { label: 'Profile & Credentials', href: '/technician/profile', icon: 'profile' },
]

async function TechnicianLayoutGuard({ children }: { children: React.ReactNode }) {
  const profile = await requireRole('technician')

  return (
    <PortalShell
      role="technician"
      userName={formatFullName(profile)}
      userEmail={profile.email}
      branchLocation={profile.branch_location}
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
