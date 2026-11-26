import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireAdminFeature } from '@/lib/auth/session'
import { getAdminAppointments, getAdminUsers } from '@/lib/data/portal-data'
import { AdminAppointmentsPanel } from '@/features/admin/components/appointments-panel'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'

export const metadata: Metadata = {
  title: 'Dispatch Schedule',
}

async function AdminAppointmentsContent() {
  await requireAdminFeature('appointments')

  const [appointments, users] = await Promise.all([
    getAdminAppointments(),
    getAdminUsers(),
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

      <AdminAppointmentsPanel appointments={appointments} users={users} />
    </div>
  )
}

export default function AdminAppointmentsPage() {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <AdminAppointmentsContent />
    </Suspense>
  )
}
