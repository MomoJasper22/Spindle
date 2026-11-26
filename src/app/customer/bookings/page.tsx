import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { formatAddress } from '@/lib/formatters'
import { RepairsPanel } from '@/features/customer/components/repairs-panel'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type {
  AppointmentDetailView,
  CustomerApplianceRow,
  RepairDetailView,
} from '@/types/database'

export const metadata: Metadata = {
  title: 'My Bookings',
}

async function CustomerBookingsContent({
  searchParams,
}: {
  searchParams: Promise<{ book?: string; appliance?: string }>
}) {
  const [profile, params] = await Promise.all([requireRole('customer'), searchParams])
  const supabase = await createClient()

  const [appliancesRes, repairsRes, appointmentsRes] = await Promise.all([
    supabase
      .from('customer_appliances')
      .select('*')
      .eq('customer_id', profile.user_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('v_repair_details')
      .select('*')
      .eq('customer_id', profile.user_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('v_appointment_details')
      .select('*')
      .eq('customer_id', profile.user_id)
      .order('scheduled_date', { ascending: true }),
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
      appliances={(appliancesRes.data ?? []) as CustomerApplianceRow[]}
      repairs={(repairsRes.data ?? []) as RepairDetailView[]}
      appointments={(appointmentsRes.data ?? []) as AppointmentDetailView[]}
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
    <Suspense fallback={<PageSkeleton />}>
      <CustomerBookingsContent searchParams={searchParams} />
    </Suspense>
  )
}
