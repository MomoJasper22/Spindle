'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import type { AppointmentDetailView, RepairDetailView } from '@/types/database'
import { buildTechnicianJobItems } from '../lib/job-schedule'
import { JobsSchedulePanel, type JobScheduleScope } from './jobs-schedule-panel'

const DiagnosticDrawer = dynamic(
  () => import('./diagnostic-drawer').then((m) => m.DiagnosticDrawer),
  { ssr: false }
)

interface TechnicianJobsViewProps {
  repairs: RepairDetailView[]
  appointments: AppointmentDetailView[]
  initialScope?: JobScheduleScope
  initialTicketId?: string | null
}

export function TechnicianJobsView({
  repairs,
  appointments,
  initialScope = 'upcoming',
  initialTicketId = null,
}: TechnicianJobsViewProps) {
  const jobs = React.useMemo(
    () => buildTechnicianJobItems(repairs, appointments),
    [repairs, appointments]
  )

  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(() =>
    initialTicketId && jobs.some((j) => j.ticketId === initialTicketId) ? initialTicketId : null
  )

  const selectedJob = jobs.find((j) => j.ticketId === selectedTicketId) ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Jobs &amp; Schedule
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your scheduled visits and assigned repairs in one workspace — start jobs, adjust times, log diagnostics, and collect payments.
        </p>
      </div>

      <JobsSchedulePanel
        jobs={jobs}
        initialScope={initialScope}
        onSelectJob={(job) => setSelectedTicketId(job.ticketId)}
      />

      <DiagnosticDrawer
        job={selectedJob}
        open={Boolean(selectedJob)}
        onOpenChange={(open) => {
          if (!open) setSelectedTicketId(null)
        }}
      />
    </div>
  )
}
