import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { formatAddress } from '@/lib/formatters'
import { CustomerWorkspace } from '@/features/customer/components/customer-workspace'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type {
  ActivityLogRow,
  AppointmentDetailView,
  CustomerApplianceRow,
  PaymentDetailView,
  RepairDetailView,
} from '@/types/database'

export const metadata: Metadata = {
  title: 'Customer Home',
}

async function CustomerHomeContent() {
  const profile = await requireRole('customer')
  const supabase = await createClient()

  const [appliancesRes, repairsRes, appointmentsRes, paymentsRes, logsRes] = await Promise.all([
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
    supabase
      .from('v_payment_details')
      .select('*')
      .eq('customer_id', profile.user_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(12),
  ])

  const defaultServiceAddress = formatAddress({
    street: profile.address_street,
    barangay: profile.address_barangay,
    city: profile.address_city,
    province: profile.address_province,
    zip: profile.address_zip_code,
  })

  return (
    <CustomerWorkspace
      customerFirstName={profile.first_name}
      defaultServiceAddress={defaultServiceAddress === '—' ? '' : defaultServiceAddress}
      appliances={(appliancesRes.data ?? []) as CustomerApplianceRow[]}
      repairs={(repairsRes.data ?? []) as RepairDetailView[]}
      appointments={(appointmentsRes.data ?? []) as AppointmentDetailView[]}
      payments={(paymentsRes.data ?? []) as PaymentDetailView[]}
      activityLogs={(logsRes.data ?? []) as ActivityLogRow[]}
    />
  )
}

export default function CustomerHomePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CustomerHomeContent />
    </Suspense>
  )
}
