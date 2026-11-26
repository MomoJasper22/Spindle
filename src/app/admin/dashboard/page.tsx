import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { AdminWorkspace } from '@/features/admin/components/admin-workspace'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type {
  ActivityLogRow,
  AppointmentDetailView,
  CustomerApplianceRow,
  PaymentDetailView,
  RepairDetailView,
  TechnicianProfileRow,
  UserWithRole,
} from '@/types/database'

export const metadata: Metadata = {
  title: 'Admin Operations Dashboard',
}

async function AdminDashboardContent() {
  const profile = await requireRole('admin')
  const supabase = await createClient()

  const [usersRes, techProfilesRes, appliancesRes, repairsRes, appointmentsRes, paymentsRes, logsRes] =
    await Promise.all([
      supabase
        .from('users')
        .select('*, user_types(type_name, description)')
        .order('created_at', { ascending: false }),
      supabase.from('technician_profiles').select('*'),
      supabase
        .from('customer_appliances')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('v_repair_details')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('v_appointment_details')
        .select('*')
        .order('scheduled_date', { ascending: true }),
      supabase
        .from('v_payment_details')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(25),
    ])

  return (
    <AdminWorkspace
      adminFirstName={profile.first_name}
      currentAdminId={profile.user_id}
      users={(usersRes.data ?? []) as UserWithRole[]}
      techProfiles={(techProfilesRes.data ?? []) as TechnicianProfileRow[]}
      appliances={(appliancesRes.data ?? []) as CustomerApplianceRow[]}
      repairs={(repairsRes.data ?? []) as RepairDetailView[]}
      appointments={(appointmentsRes.data ?? []) as AppointmentDetailView[]}
      payments={(paymentsRes.data ?? []) as PaymentDetailView[]}
      activityLogs={(logsRes.data ?? []) as ActivityLogRow[]}
    />
  )
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  )
}
