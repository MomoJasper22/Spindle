import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { SchedulePanel } from '@/features/technician/components/schedule-panel'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type { AppointmentDetailView } from '@/types/database'

export const metadata: Metadata = {
  title: 'Schedule & Agenda',
}

async function TechnicianScheduleContent() {
  const profile = await requireRole('technician')
  const supabase = await createClient()

  const { data } = await supabase
    .from('v_appointment_details')
    .select('*')
    .eq('technician_id', profile.user_id)
    .order('scheduled_date', { ascending: true })

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
      <SchedulePanel appointments={(data ?? []) as AppointmentDetailView[]} />
    </div>
  )
}

export default function TechnicianSchedulePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TechnicianScheduleContent />
    </Suspense>
  )
}
