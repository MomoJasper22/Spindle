import { Suspense } from 'react'
import { hasAdminPermission, isFullAdmin, requireRole } from '@/lib/auth/session'
import type { AdminFeatureKey } from '@/lib/constants'
import { formatFullName } from '@/lib/formatters'
import { PortalShell, type PortalNavItem } from '@/components/shared/portal-shell'
import { PageSkeleton } from '@/components/shared/page-skeleton'

interface AdminNavItem extends PortalNavItem {
  feature: AdminFeatureKey
}

const ADMIN_NAV: AdminNavItem[] = [
  { feature: 'dashboard', label: 'Executive Summary', mobileLabel: 'Summary', href: '/admin/dashboard', icon: 'dashboard' },
  { feature: 'repairs', label: 'Repair Tickets', mobileLabel: 'Repairs', href: '/admin/repairs', icon: 'wrench' },
  { feature: 'appointments', label: 'Dispatch Board', mobileLabel: 'Dispatch', href: '/admin/appointments', icon: 'calendar' },
  { feature: 'payments', label: 'Payments Ledger', mobileLabel: 'Payments', href: '/admin/payments', icon: 'payments' },
  { feature: 'technicians', label: 'Technicians', href: '/admin/technicians', icon: 'userCog' },
  { feature: 'appliances', label: 'Appliances', href: '/admin/appliances', icon: 'appliances' },
  { feature: 'users', label: 'Users & Roles', href: '/admin/users', icon: 'users' },
]

async function AdminLayoutGuard({ children }: { children: React.ReactNode }) {
  const profile = await requireRole('admin')
  const permittedNav: PortalNavItem[] = ADMIN_NAV.filter((item) =>
    hasAdminPermission(profile, item.feature)
  ).map(({ feature: _ignored, ...rest }) => {
    void _ignored
    return rest
  })

  return (
    <PortalShell
      role="admin"
      roleBadgeLabel={isFullAdmin(profile) ? 'Operations Admin' : 'Scoped Admin'}
      userName={formatFullName(profile)}
      userEmail={profile.email}
      avatarUrl={profile.avatar_url}
      avatarPosition={profile.avatar_position}
      branchLocation={profile.branch_location}
      profileHref="/admin/profile"
      navItems={permittedNav}
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
