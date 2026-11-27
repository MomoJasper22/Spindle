import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { getTechnicianAppointments } from '@/lib/data/portal-data'
import { SchedulePanel } from '@/features/technician/components/schedule-panel'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'

export const metadata: Metadata = {
  title: 'Schedule & Agenda',
}

async function TechnicianScheduleContent() {
  const profile = await requireRole('technician')
  const appointments = await getTechnicianAppointments(profile.user_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Schedule &amp; Agenda
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm dispatched slots, reschedule home visits, or mark appointments completed.
        </p>
      </div>
      <SchedulePanel appointments={appointments} />
    </div>
  )
}

export default function TechnicianSchedulePage() {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <TechnicianScheduleContent />
    </Suspense>
  )
}
