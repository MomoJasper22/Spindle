import { Suspense } from 'react'
import { requireRole } from '@/lib/auth/session'
import { formatFullName } from '@/lib/formatters'
import { CustomerShell } from '@/components/shared/customer-shell'
import { PageSkeleton } from '@/components/shared/page-skeleton'

async function CustomerLayoutGuard({ children }: { children: React.ReactNode }) {
  const profile = await requireRole('customer')

  return (
    <CustomerShell
      firstName={profile.first_name}
      userName={formatFullName(profile)}
      avatarUrl={profile.avatar_url}
      avatarPosition={profile.avatar_position}
    >
      {children}
    </CustomerShell>
  )
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CustomerLayoutGuard>{children}</CustomerLayoutGuard>
    </Suspense>
  )
}
