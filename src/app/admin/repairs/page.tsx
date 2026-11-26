import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireAdminFeature } from '@/lib/auth/session'
import { getAdminAppliances, getAdminRepairs, getAdminUsers } from '@/lib/data/portal-data'
import { AdminRepairsPanel } from '@/features/admin/components/repairs-panel'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'

export const metadata: Metadata = {
  title: 'Repair Tickets',
}

async function AdminRepairsContent() {
  await requireAdminFeature('repairs')

  const [repairs, users, appliances] = await Promise.all([
    getAdminRepairs(),
    getAdminUsers(),
    getAdminAppliances(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Repair Tickets
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create walk-in tickets, assign technicians, update costs, and track repair progress.
        </p>
      </div>

      <AdminRepairsPanel repairs={repairs} users={users} appliances={appliances} />
    </div>
  )
}

export default function AdminRepairsPage() {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <AdminRepairsContent />
    </Suspense>
  )
}
