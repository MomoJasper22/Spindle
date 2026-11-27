'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { FormBanner } from '@/components/shared/form-banner'
import type { TechAvailabilityStatus } from '@/lib/constants'
import type {
  AppointmentDetailView,
  PaymentDetailView,
  RepairDetailView,
} from '@/types/database'
import { buildTechnicianJobItems } from '../lib/technician-jobs'
import { PipelinePanel, type JobsTabKey } from './pipeline-panel'
export type { JobsTabKey }
import { TechnicianAvailabilityControl } from './technician-availability-control'

const JobWorkbenchDrawer = dynamic(
  () => import('./diagnostic-drawer').then((m) => m.JobWorkbenchDrawer),
  { ssr: false }
)

interface TechnicianJobsViewProps {
  availabilityStatus: TechAvailabilityStatus
  repairs: RepairDetailView[]
  appointments: AppointmentDetailView[]
  payments: PaymentDetailView[]
  initialTab?: JobsTabKey
}

export function TechnicianJobsView({
  availabilityStatus,
  repairs,
  appointments,
  payments,
  initialTab = 'active',
}: TechnicianJobsViewProps) {
  const [activeTab, setActiveTab] = React.useState<JobsTabKey>(initialTab)
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null)
  const [statusError, setStatusError] = React.useState<string | null>(null)

  const jobs = React.useMemo(
    () => buildTechnicianJobItems(repairs, appointments, payments),
    [repairs, appointments, payments]
  )

  const selectedJob = jobs.find((j) => j.ticket.ticket_id === selectedTicketId) ?? null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Jobs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage visit schedules, repair diagnostics, final pricing, and on-site collections in one place.
          </p>
        </div>

        <TechnicianAvailabilityControl
          availabilityStatus={availabilityStatus}
          onError={setStatusError}
        />
      </div>

      {statusError && <FormBanner type="error" message={statusError} />}

      <PipelinePanel
        jobs={jobs}
        payments={payments}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSelectJob={(job) => setSelectedTicketId(job.ticket.ticket_id)}
        onSelectTicketId={(ticketId) => setSelectedTicketId(ticketId)}
      />

      <JobWorkbenchDrawer
        job={selectedJob}
        open={Boolean(selectedJob)}
        onOpenChange={(open) => {
          if (!open) setSelectedTicketId(null)
        }}
      />
    </div>
  )
}
