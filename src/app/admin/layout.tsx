import { Suspense } from 'react'
import { requireRole } from '@/lib/auth/session'
import { formatFullName } from '@/lib/formatters'
import { PortalShell, type PortalNavItem } from '@/components/shared/portal-shell'
import { PageSkeleton } from '@/components/shared/page-skeleton'

const ADMIN_NAV: PortalNavItem[] = [
  { label: 'Executive Summary', mobileLabel: 'Summary', href: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Repair Tickets', mobileLabel: 'Repairs', href: '/admin/repairs', icon: 'wrench' },
  { label: 'Dispatch Board', mobileLabel: 'Dispatch', href: '/admin/appointments', icon: 'calendar' },
  { label: 'Payments Ledger', mobileLabel: 'Payments', href: '/admin/payments', icon: 'payments' },
  { label: 'Technicians', href: '/admin/technicians', icon: 'userCog' },
  { label: 'Appliances', href: '/admin/appliances', icon: 'appliances' },
  { label: 'Users & Roles', href: '/admin/users', icon: 'users' },
]

async function AdminLayoutGuard({ children }: { children: React.ReactNode }) {
  const profile = await requireRole('admin')

  return (
    <PortalShell
      role="admin"
      userName={formatFullName(profile)}
      userEmail={profile.email}
      avatarUrl={profile.avatar_url}
      avatarPosition={profile.avatar_position}
      branchLocation={profile.branch_location}
      profileHref="/admin/profile"
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
