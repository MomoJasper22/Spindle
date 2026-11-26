import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { AdminAppointmentsPanel } from '@/features/admin/components/appointments-panel'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type { AppointmentDetailView, UserWithRole } from '@/types/database'

export const metadata: Metadata = {
  title: 'Dispatch Schedule',
}

async function AdminAppointmentsContent() {
  await requireRole('admin')
  const supabase = await createClient()

  const [appointmentsRes, usersRes] = await Promise.all([
    supabase
      .from('v_appointment_details')
      .select('*')
      .order('scheduled_date', { ascending: true }),
    supabase
      .from('users')
      .select('*, user_types(type_name, description)')
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Dispatch &amp; Appointments
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign technicians to service slots, adjust schedules, and confirm field visits.
        </p>
      </div>

      <AdminAppointmentsPanel
        appointments={(appointmentsRes.data ?? []) as AppointmentDetailView[]}
        users={(usersRes.data ?? []) as UserWithRole[]}
      />
    </div>
  )
}

export default function AdminAppointmentsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminAppointmentsContent />
    </Suspense>
  )
}
