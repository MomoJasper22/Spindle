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
import { TechnicianAvailabilityControl } from './technician-availability-control'
import type { WorkbenchSectionTab } from './diagnostic-drawer'
import { seedTechnicianCache } from '../lib/technician-portal-cache'

export type { JobsTabKey }

const JobWorkbenchDrawer = dynamic(
  () => import('./diagnostic-drawer').then((m) => m.JobWorkbenchDrawer),
  { ssr: false }
)

interface TechnicianJobsViewProps {
  techId?: string
  availabilityStatus: TechAvailabilityStatus
  repairs: RepairDetailView[]
  appointments: AppointmentDetailView[]
  payments: PaymentDetailView[]
  initialTab?: JobsTabKey
  initialTicketId?: string | null
  initialDrawerSection?: WorkbenchSectionTab
  initialNotice?: { type: 'error' | 'success'; message: string } | null
}

export function TechnicianJobsView({
  techId,
  availabilityStatus,
  repairs,
  appointments,
  payments,
  initialTab = 'active',
  initialTicketId = null,
  initialDrawerSection = 'work',
  initialNotice = null,
}: TechnicianJobsViewProps) {
  React.useEffect(() => {
    if (techId) {
      seedTechnicianCache({
        techId,
        availabilityStatus,
        repairs,
        appointments,
        payments,
      })
    }
  }, [techId, availabilityStatus, repairs, appointments, payments])
  const [activeTab, setActiveTab] = React.useState<JobsTabKey>(initialTab)
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(initialTicketId)
  const [drawerSection, setDrawerSection] =
    React.useState<WorkbenchSectionTab>(initialDrawerSection)
  const [statusNotice, setStatusNotice] = React.useState<{
    type: 'error' | 'success'
    message: string
  } | null>(initialNotice)

  const jobs = React.useMemo(
    () => buildTechnicianJobItems(repairs, appointments, payments),
    [repairs, appointments, payments]
  )

  const selectedJob = jobs.find((j) => j.ticket.ticket_id === selectedTicketId) ?? null

  function openJob(ticketId: string, section: WorkbenchSectionTab = 'work') {
    setDrawerSection(section)
    setSelectedTicketId(ticketId)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Jobs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage visit schedules, diagnostics, final billing, and PayMongo or cash collections.
          </p>
        </div>

        <TechnicianAvailabilityControl
          availabilityStatus={availabilityStatus}
          onError={(err) => setStatusNotice(err ? { type: 'error', message: err } : null)}
        />
      </div>

      {statusNotice && <FormBanner type={statusNotice.type} message={statusNotice.message} />}

      <PipelinePanel
        jobs={jobs}
        payments={payments}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSelectJob={(job) => openJob(job.ticket.ticket_id, 'work')}
        onSelectTicketId={(ticketId) => openJob(ticketId, 'billing')}
      />

      <JobWorkbenchDrawer
        job={selectedJob}
        open={Boolean(selectedJob)}
        initialSection={drawerSection}
        onOpenChange={(open) => {
          if (!open) setSelectedTicketId(null)
        }}
      />
    </div>
  )
}
