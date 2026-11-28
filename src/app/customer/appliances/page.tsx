import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { getCustomerAppliances } from '@/lib/data/portal-data'
import { AppliancesPanel } from '@/features/customer/components/appliances-panel'
import { CustomerAppliancesFallback } from '@/features/customer/components/customer-cached-fallbacks'

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
      customerId={profile.user_id}
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
    <Suspense fallback={<CustomerAppliancesFallback />}>
      <CustomerAppliancesContent searchParams={searchParams} />
    </Suspense>
  )
}
