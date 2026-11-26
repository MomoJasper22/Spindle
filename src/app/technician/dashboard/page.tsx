import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TechnicianWorkspace } from '@/features/technician/components/technician-workspace'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type {
  ActivityLogRow,
  AppointmentDetailView,
  PaymentDetailView,
  RepairDetailView,
} from '@/types/database'

export const metadata: Metadata = {
  title: 'Technician Dashboard',
}

async function TechnicianDashboardContent() {
  const profile = await requireRole('technician')
  const supabase = await createClient()

  const [repairsRes, appointmentsRes, paymentsRes, logsRes] = await Promise.all([
    supabase
      .from('v_repair_details')
      .select('*')
      .eq('technician_id', profile.user_id)
      .order('scheduled_date', { ascending: true }),
    supabase
      .from('v_appointment_details')
      .select('*')
      .eq('technician_id', profile.user_id)
      .order('scheduled_date', { ascending: true }),
    supabase
      .from('v_payment_details')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15),
  ])

  return (
    <TechnicianWorkspace
      techFirstName={profile.first_name}
      availabilityStatus={profile.technician_profile?.availability_status ?? 'available'}
      repairs={(repairsRes.data ?? []) as RepairDetailView[]}
      appointments={(appointmentsRes.data ?? []) as AppointmentDetailView[]}
      payments={(paymentsRes.data ?? []) as PaymentDetailView[]}
      activityLogs={(logsRes.data ?? []) as ActivityLogRow[]}
    />
  )
}

export default function TechnicianDashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TechnicianDashboardContent />
    </Suspense>
  )
}
