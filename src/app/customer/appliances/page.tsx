import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { getCustomerAppliances } from '@/lib/data/portal-data'
import { AppliancesPanel } from '@/features/customer/components/appliances-panel'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'

export const metadata: Metadata = {
  title: 'My Appliances',
}

async function CustomerAppliancesContent({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>
}) {
  const [profile, params] = await Promise.all([requireRole('customer'), searchParams])
  const appliances = await getCustomerAppliances(profile.user_id)

  return (
    <AppliancesPanel
      key={params.add === '1' ? 'add' : 'list'}
      appliances={appliances}
      openAddByDefault={params.add === '1'}
    />
  )
}

export default function CustomerAppliancesPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>
}) {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <CustomerAppliancesContent searchParams={searchParams} />
    </Suspense>
  )
}
