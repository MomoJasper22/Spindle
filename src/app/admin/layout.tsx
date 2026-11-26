import { Suspense } from 'react'
import { requireRole } from '@/lib/auth/session'
import { formatFullName } from '@/lib/formatters'
import { PortalShell, type PortalNavItem } from '@/components/shared/portal-shell'
import { PageSkeleton } from '@/components/shared/page-skeleton'

const ADMIN_NAV: PortalNavItem[] = [
  { label: 'Operations Dashboard', href: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Profile & Security', href: '/admin/profile', icon: 'profile' },
]

async function AdminLayoutGuard({ children }: { children: React.ReactNode }) {
  const profile = await requireRole('admin')

  return (
    <PortalShell
      role="admin"
      userName={formatFullName(profile)}
      userEmail={profile.email}
      branchLocation={profile.branch_location}
      navItems={ADMIN_NAV}
    >
      {children}
    </PortalShell>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminLayoutGuard>{children}</AdminLayoutGuard>
    </Suspense>
  )
}
