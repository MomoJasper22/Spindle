import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import {
  getCustomerAppliances,
  getCustomerAppointments,
  getCustomerRepairs,
} from '@/lib/data/portal-data'
import { formatAddress } from '@/lib/formatters'
import { RepairsPanel } from '@/features/customer/components/repairs-panel'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'

export const metadata: Metadata = {
  title: 'My Bookings',
}

async function CustomerBookingsContent({
  searchParams,
}: {
  searchParams: Promise<{ book?: string; appliance?: string }>
}) {
  const [profile, params] = await Promise.all([requireRole('customer'), searchParams])

  const [appliances, repairs, appointments] = await Promise.all([
    getCustomerAppliances(profile.user_id),
    getCustomerRepairs(profile.user_id),
    getCustomerAppointments(profile.user_id),
  ])

  const defaultServiceAddress = formatAddress({
    street: profile.address_street,
    barangay: profile.address_barangay,
    city: profile.address_city,
    province: profile.address_province,
    zip: profile.address_zip_code,
  })

  return (
    <RepairsPanel
      appliances={appliances}
      repairs={repairs}
      appointments={appointments}
      defaultServiceAddress={defaultServiceAddress}
      defaultOpen={params.book === '1'}
      defaultApplianceId={params.appliance}
    />
  )
}

export default function CustomerBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string; appliance?: string }>
}) {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <CustomerBookingsContent searchParams={searchParams} />
    </Suspense>
  )
}
