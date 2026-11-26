import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TechnicianOverviewView } from '@/features/technician/components/technician-overview-view'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type {
  ActivityLogRow,
  AppointmentDetailView,
  RepairDetailView,
} from '@/types/database'

export const metadata: Metadata = {
  title: 'Technician Overview',
}

async function TechnicianDashboardContent() {
  const profile = await requireRole('technician')
  const supabase = await createClient()

  const [repairsRes, appointmentsRes, logsRes] = await Promise.all([
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
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return (
    <TechnicianOverviewView
      techFirstName={profile.first_name}
      availabilityStatus={profile.technician_profile?.availability_status ?? 'available'}
      repairs={(repairsRes.data ?? []) as RepairDetailView[]}
      appointments={(appointmentsRes.data ?? []) as AppointmentDetailView[]}
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
