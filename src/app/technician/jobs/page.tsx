import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { getTechnicianAppointments, getTechnicianRepairs } from '@/lib/data/portal-data'
import { TechnicianJobsView } from '@/features/technician/components/technician-jobs-view'
import type { JobScheduleScope } from '@/features/technician/components/jobs-schedule-panel'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'

export const metadata: Metadata = {
  title: 'Jobs & Schedule',
}

function parseScope(raw?: string): JobScheduleScope {
  if (raw === 'today' || raw === 'upcoming' || raw === 'completed' || raw === 'all') {
    return raw
  }
  return 'upcoming'
}

async function TechnicianJobsContent({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; ticket?: string }>
}) {
  const [profile, params] = await Promise.all([requireRole('technician'), searchParams])
  const [repairs, appointments] = await Promise.all([
    getTechnicianRepairs(profile.user_id),
    getTechnicianAppointments(profile.user_id),
  ])

  const initialScope = parseScope(params.scope)

  return (
    <TechnicianJobsView
      key={`${initialScope}:${params.ticket ?? ''}`}
      repairs={repairs}
      appointments={appointments}
      initialScope={initialScope}
      initialTicketId={params.ticket ?? null}
    />
  )
}

export default function TechnicianJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; ticket?: string }>
}) {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <TechnicianJobsContent searchParams={searchParams} />
    </Suspense>
  )
}
