import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireAdminFeature } from '@/lib/auth/session'
import { getAdminAppliances, getAdminUsers } from '@/lib/data/portal-data'
import { AdminAppliancesPanel } from '@/features/admin/components/appliances-panel'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'

export const metadata: Metadata = {
  title: 'Appliances Registry',
}

async function AdminAppliancesContent() {
  await requireAdminFeature('appliances')

  const [appliances, users] = await Promise.all([
    getAdminAppliances(),
    getAdminUsers(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Appliances Registry
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify customer-registered units, review serial numbers, and manage unit records.
        </p>
      </div>

      <AdminAppliancesPanel appliances={appliances} users={users} />
    </div>
  )
}

export default function AdminAppliancesPage() {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <AdminAppliancesContent />
    </Suspense>
  )
}
