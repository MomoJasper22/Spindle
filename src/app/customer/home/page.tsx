import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { CustomerHomeView } from '@/features/customer/components/customer-home-view'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type {
  ActivityLogRow,
  AppointmentDetailView,
  CustomerApplianceRow,
  PaymentDetailView,
  RepairDetailView,
} from '@/types/database'

export const metadata: Metadata = {
  title: 'Home',
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
      .limit(5),
  ])

  return (
    <CustomerHomeView
      firstName={profile.first_name}
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
