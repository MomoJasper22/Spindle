'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowRight, CalendarClock, Loader2, MapPin, Phone, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/shared/empty-state'
import { FormBanner } from '@/components/shared/form-banner'
import { ScrollableList } from '@/components/shared/scrollable-list'
import { StatusBadge } from '@/components/shared/status-badge'
import { ActivityFeed } from '@/features/customer/components/activity-feed'
import { TECH_AVAILABILITY_STATUSES, type TechAvailabilityStatus } from '@/lib/constants'
import { formatManilaDate, formatPHPhone, formatPHP, getManilaTodayISO, humanizeLabel } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type {
  ActivityLogRow,
  AppointmentDetailView,
  RepairDetailView,
} from '@/types/database'
import { updateTechnicianAvailabilityAction } from '../actions/technician-actions'
import { buildTechnicianJobItems } from '../lib/job-schedule'
import { TechnicianKpiCards } from './technician-kpi-cards'

const DiagnosticDrawer = dynamic(
  () => import('./diagnostic-drawer').then((m) => m.DiagnosticDrawer),
  { ssr: false }
)

interface TechnicianOverviewViewProps {
  techDisplayName: string
  availabilityStatus: TechAvailabilityStatus
  repairs: RepairDetailView[]
  appointments: AppointmentDetailView[]
  activityLogs: ActivityLogRow[]
}

const STATUS_DOT_CLASSES: Record<TechAvailabilityStatus, string> = {
  available: 'bg-emerald-500',
  busy: 'bg-amber-500',
  lunch: 'bg-sky-500',
  off_duty: 'bg-slate-400',
}

export function TechnicianOverviewView({
  techDisplayName,
  availabilityStatus,
  repairs,
  appointments,
  activityLogs,
}: TechnicianOverviewViewProps) {
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null)
  const [optimisticStatus, setOptimisticStatus] = React.useOptimistic(availabilityStatus)
  const [statusFeedback, setStatusFeedback] = React.useState<string | null>(null)
  const [isUpdatingStatus, startStatusTransition] = React.useTransition()

  const jobs = React.useMemo(
    () => buildTechnicianJobItems(repairs, appointments),
    [repairs, appointments]
  )
  const selectedJob = jobs.find((j) => j.ticketId === selectedTicketId) ?? null

  function handleAvailabilityChange(nextValue: string) {
    const next = nextValue as TechAvailabilityStatus
    setStatusFeedback(null)
    startStatusTransition(async () => {
      setOptimisticStatus(next)
      const result = await updateTechnicianAvailabilityAction({ availability_status: next })
      if (!result.success) {
        setStatusFeedback(result.error)
      }
    })
  }

  const todayISO = getManilaTodayISO()
  const currentMonthPrefix = todayISO.slice(0, 7)

  const todaysJobs = jobs.filter(
    (j) => j.scheduledDate === todayISO && !j.isCancelled
  )

  const activeJobs = jobs.filter((j) => j.isActive)

  const completedThisMonth = repairs.filter(
    (r) =>
      r.status === 'completed' &&
      (r.completed_at?.startsWith(currentMonthPrefix) || r.updated_at.startsWith(currentMonthPrefix))
  ).length

  const pendingCollectionsPhp = activeJobs.reduce((sum, j) => {
    const target = Number(j.repair.final_cost_php ?? j.repair.estimated_cost_php ?? 0)
    const paid = Number(j.repair.verified_paid_php ?? 0)
    return sum + Math.max(0, target - paid)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Field Overview, {techDisplayName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Today&apos;s dispatched visits, active jobs, and recent field logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <label
            htmlFor="tech-overview-availability"
            className="text-xs font-semibold text-muted-foreground whitespace-nowrap"
          >
            Availability:
          </label>
          <Select
            value={optimisticStatus}
            onValueChange={handleAvailabilityChange}
            disabled={isUpdatingStatus}
          >
            <SelectTrigger
              id="tech-overview-availability"
              aria-label="Availability status"
              className="w-[170px] bg-card"
            >
              <div className="flex items-center gap-2 min-w-0">
                {isUpdatingStatus && (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" aria-hidden="true" />
                )}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {TECH_AVAILABILITY_STATUSES.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn('h-2 w-2 rounded-full', STATUS_DOT_CLASSES[opt])}
                    />
                    <span>{humanizeLabel(opt)}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {statusFeedback && <FormBanner type="error" message={statusFeedback} />}

      <TechnicianKpiCards
        todaysAppointments={todaysJobs.length}
        assignedActiveJobs={activeJobs.length}
        completedThisMonth={completedThisMonth}
        pendingCollectionsPhp={pendingCollectionsPhp}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Visits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Today&apos;s Visits</span>
              </CardTitle>
              <CardDescription>Tap any scheduled visit to start or manage</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/technician/jobs?scope=today">
                <span>Jobs &amp; Schedule</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {todaysJobs.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="No visits scheduled for today"
                description="Check Active & Upcoming in Jobs & Schedule for your next assigned visits."
              />
            ) : (
              <ScrollableList
                regionLabel="Today's visits list"
                maxHeightClassName="max-h-80"
                className="p-0.5 pr-1"
              >
                <div className="space-y-3">
                  {todaysJobs.map((job) => (
                    <button
                      key={job.ticketId}
                      type="button"
                      onClick={() => setSelectedTicketId(job.ticketId)}
                      className="w-full rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-primary">
                          {job.timeSlot ?? 'Slot pending'}
                        </span>
                        <StatusBadge status={job.repair.status} />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {job.repair.customer_first_name} {job.repair.customer_last_name} &middot;{' '}
                        <span className="font-mono text-xs text-muted-foreground">{job.ticketId}</span>
                      </p>
                      <p className="flex items-start gap-1 text-xs text-muted-foreground">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="line-clamp-1">{job.serviceAddress}</span>
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollableList>
            )}
          </CardContent>
        </Card>

        {/* Active Repair Queue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wrench className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Active Job Queue</span>
              </CardTitle>
              <CardDescription>Tap any job to update diagnostics or collect payment</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/technician/jobs">
                <span>All Jobs</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activeJobs.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="No active jobs assigned"
                description="New repair tickets assigned to you will appear here automatically."
              />
            ) : (
              <ScrollableList
                regionLabel="Active repair queue"
                maxHeightClassName="max-h-80"
                className="p-0.5 pr-1"
              >
                <div className="space-y-3">
                  {activeJobs.map((job) => {
                    const ticket = job.repair
                    return (
                      <button
                        key={job.ticketId}
                        type="button"
                        onClick={() => setSelectedTicketId(job.ticketId)}
                        className="w-full rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {job.ticketId}
                          </span>
                          <StatusBadge status={ticket.status} />
                        </div>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {ticket.customer_first_name} {ticket.customer_last_name} &mdash;{' '}
                          {ticket.appliance_brand} {ticket.appliance_model_number}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" aria-hidden="true" />
                            {formatPHPhone(ticket.customer_phone)}
                          </span>
                          <span className="font-medium tabular-nums text-foreground">
                            {formatManilaDate(job.scheduledDate)}
                            {job.timeSlot ? ` · ${job.timeSlot}` : ''} &middot;{' '}
                            {formatPHP(ticket.final_cost_php ?? ticket.estimated_cost_php)}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </ScrollableList>
            )}
          </CardContent>
        </Card>
      </div>

      <ActivityFeed
        logs={activityLogs.slice(0, 8)}
        audience="staff"
        title="Recent Field Activity"
        description="Ticket updates, appointment status changes, and on-site collection logs."
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
