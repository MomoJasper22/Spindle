import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireAdminFeature } from '@/lib/auth/session'
import { getAdminAppliances, getAdminRepairs, getAdminUsers } from '@/lib/data/portal-data'
import { AdminRepairsPanel } from '@/features/admin/components/repairs-panel'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'
import { REPAIR_STATUSES } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Repair Tickets',
}

function resolveStatusFilter(status?: string): string {
  if (status && (REPAIR_STATUSES as readonly string[]).includes(status)) {
    return status
  }
  return 'all'
}

async function AdminRepairsContent({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const [, params] = await Promise.all([requireAdminFeature('repairs'), searchParams])

  const [repairs, users, appliances] = await Promise.all([
    getAdminRepairs(),
    getAdminUsers(),
    getAdminAppliances(),
  ])

  const initialStatusFilter = resolveStatusFilter(params.status)

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

      <AdminRepairsPanel
        key={initialStatusFilter}
        repairs={repairs}
        users={users}
        appliances={appliances}
        initialStatusFilter={initialStatusFilter}
      />
    </div>
  )
}

export default function AdminRepairsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <AdminRepairsContent searchParams={searchParams} />
    </Suspense>
  )
}
