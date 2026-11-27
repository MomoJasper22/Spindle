'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  MapPin,
  Phone,
  Play,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { FormBanner } from '@/components/shared/form-banner'
import { ScrollableList } from '@/components/shared/scrollable-list'
import { StatusBadge } from '@/components/shared/status-badge'
import { ActivityFeed } from '@/features/customer/components/activity-feed'
import type { TechAvailabilityStatus } from '@/lib/constants'
import { formatManilaDate, formatPHPhone, formatPHP } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type {
  ActivityLogRow,
  AppointmentDetailView,
  PaymentDetailView,
  RepairDetailView,
} from '@/types/database'
import {
  updateTechnicianAppointmentAction,
  updateTechnicianRepairAction,
} from '../actions/technician-actions'
import { buildTechnicianJobItems, type TechnicianJobItem } from '../lib/technician-jobs'
import { TechnicianAvailabilityControl } from './technician-availability-control'
import { TechnicianKpiCards } from './technician-kpi-cards'

const JobWorkbenchDrawer = dynamic(
  () => import('./diagnostic-drawer').then((m) => m.JobWorkbenchDrawer),
  { ssr: false }
)

interface TechnicianOverviewViewProps {
  techDisplayName: string
  availabilityStatus: TechAvailabilityStatus
  repairs: RepairDetailView[]
  appointments: AppointmentDetailView[]
  payments: PaymentDetailView[]
  activityLogs: ActivityLogRow[]
}

export function TechnicianOverviewView({
  techDisplayName,
  availabilityStatus,
  repairs,
  appointments,
  payments,
  activityLogs,
}: TechnicianOverviewViewProps) {
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [showActivity, setShowActivity] = React.useState(false)
  const [isActionPending, startActionTransition] = React.useTransition()

  const jobs = React.useMemo(
    () => buildTechnicianJobItems(repairs, appointments, payments),
    [repairs, appointments, payments]
  )

  const selectedJob = jobs.find((j) => j.ticket.ticket_id === selectedTicketId) ?? null
  const todaysJobs = jobs.filter((j) => j.isToday)
  const activeJobs = jobs.filter((j) => j.isActive)
  const otherActiveJobs = activeJobs.filter((j) => !j.isToday)
  const unconfirmedToday = todaysJobs.filter((j) => j.needsSlotConfirm).length

  const payableJobs = activeJobs.filter((j) => j.paymentSummary.payableRemaining > 0)
  const pendingCollectionsPhp = payableJobs.reduce(
    (sum, j) => sum + j.paymentSummary.payableRemaining,
    0
  )

  function handleQuickConfirm(e: React.MouseEvent, job: TechnicianJobItem) {
    e.stopPropagation()
    if (!job.appointment) return
    setFeedback(null)
    startActionTransition(async () => {
      const result = await updateTechnicianAppointmentAction({
        appointment_id: job.appointment!.appointment_id,
        appointment_status: 'confirmed',
        scheduled_date: job.appointment!.scheduled_date,
        time_slot: job.appointment!.time_slot,
        remarks: job.appointment!.remarks ?? '',
      })
      setFeedback(
        result.success
          ? { type: 'success', message: result.message }
          : { type: 'error', message: result.error }
      )
    })
  }

  function handleQuickStart(e: React.MouseEvent, job: TechnicianJobItem) {
    e.stopPropagation()
    setFeedback(null)
    startActionTransition(async () => {
      const result = await updateTechnicianRepairAction({
        ticket_id: job.ticket.ticket_id,
        status: 'in_progress',
        diagnostic_notes: job.ticket.diagnostic_notes ?? '',
        final_cost_php:
          job.ticket.final_cost_php !== null ? Number(job.ticket.final_cost_php) : null,
      })
      setFeedback(
        result.success
          ? { type: 'success', message: result.message }
          : { type: 'error', message: result.error }
      )
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Hi, {techDisplayName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your visits for today and open jobs needing attention.
          </p>
        </div>

        <TechnicianAvailabilityControl
          availabilityStatus={availabilityStatus}
          onError={(err) =>
            setFeedback(err ? { type: 'error', message: err } : null)
          }
        />
      </div>

      {feedback && <FormBanner type={feedback.type} message={feedback.message} />}

      <TechnicianKpiCards
        todaysVisits={todaysJobs.length}
        unconfirmedToday={unconfirmedToday}
        assignedActiveJobs={activeJobs.length}
        pendingCollectionsPhp={pendingCollectionsPhp}
        pendingCollectionCount={payableJobs.length}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Visits (Interactive, Unified with Job Workbench) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Today&apos;s Visits</span>
              </CardTitle>
              <CardDescription>Tap a visit to log diagnostics, pricing, or payment</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/technician/jobs?tab=today">
                <span>All Today</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {todaysJobs.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="No visits scheduled for today"
                description="Check My Jobs for upcoming visits or active tickets."
              />
            ) : (
              <ScrollableList
                regionLabel="Today's visits list"
                maxHeightClassName="max-h-96"
                className="p-0.5 pr-1"
              >
                <div className="space-y-3">
                  {todaysJobs.map((job) => {
                    const { ticket, appointment } = job
                    const address =
                      appointment?.service_address ||
                      [ticket.customer_address_barangay, ticket.customer_address_city]
                        .filter(Boolean)
                        .join(', ')
                    return (
                      <div
                        key={ticket.ticket_id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedTicketId(ticket.ticket_id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedTicketId(ticket.ticket_id)
                          }
                        }}
                        className="rounded-xl border border-border bg-card p-3.5 space-y-2.5 cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-primary">
                            {appointment?.time_slot ?? 'Scheduled today'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {job.needsSlotConfirm && appointment && (
                              <StatusBadge status={appointment.appointment_status} />
                            )}
                            <StatusBadge status={ticket.status} />
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {ticket.customer_first_name} {ticket.customer_last_name} &mdash;{' '}
                            {ticket.appliance_brand} {ticket.appliance_category}
                          </p>
                          <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span className="line-clamp-1">{address || 'Address on file'}</span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {ticket.customer_phone && (
                              <a
                                href={`tel:${ticket.customer_phone.replace(/\s+/g, '')}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                              >
                                <Phone className="h-3 w-3" aria-hidden="true" />
                                <span>{formatPHPhone(ticket.customer_phone)}</span>
                              </a>
                            )}
                            {job.paymentSummary.payableRemaining > 0 && (
                              <span className="font-semibold tabular-nums text-foreground">
                                Due {formatPHP(job.paymentSummary.payableRemaining)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {job.needsSlotConfirm && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isActionPending}
                                onClick={(e) => handleQuickConfirm(e, job)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Confirm</span>
                              </Button>
                            )}
                            {(ticket.status === 'confirmed' || ticket.status === 'assigned') && (
                              <Button
                                type="button"
                                size="sm"
                                disabled={isActionPending}
                                onClick={(e) => handleQuickStart(e, job)}
                              >
                                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Start</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollableList>
            )}
          </CardContent>
        </Card>

        {/* Other Active Jobs (Non-overlapping with Today's Visits) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wrench className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Other Active Jobs</span>
              </CardTitle>
              <CardDescription>Upcoming visits and open tickets outside today</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/technician/jobs">
                <span>All Jobs</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {otherActiveJobs.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title={todaysJobs.length > 0 ? 'No other open jobs' : 'No active jobs assigned'}
                description="Upcoming dispatches and open follow-ups will appear here automatically."
              />
            ) : (
              <ScrollableList
                regionLabel="Other active jobs"
                maxHeightClassName="max-h-96"
                className="p-0.5 pr-1"
              >
                <div className="space-y-3">
                  {otherActiveJobs.map((job) => {
                    const { ticket, appointment } = job
                    return (
                      <button
                        key={ticket.ticket_id}
                        type="button"
                        onClick={() => setSelectedTicketId(ticket.ticket_id)}
                        className="w-full rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {ticket.ticket_id}
                          </span>
                          <StatusBadge status={ticket.status} />
                        </div>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {ticket.customer_first_name} {ticket.customer_last_name} &mdash;{' '}
                          {ticket.appliance_brand} {ticket.appliance_model_number}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>
                            {formatManilaDate(job.visitDate)}
                            {appointment?.time_slot ? ` · ${appointment.time_slot}` : ''}
                          </span>
                          <span className="font-semibold tabular-nums text-foreground">
                            {job.paymentSummary.payableRemaining > 0
                              ? `Due ${formatPHP(job.paymentSummary.payableRemaining)}`
                              : formatPHP(ticket.final_cost_php ?? ticket.estimated_cost_php)}
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

      {/* Collapsible Recent Activity (tucked away by default to reduce visual noise) */}
      <div className="rounded-2xl border border-border bg-card">
        <button
          type="button"
          aria-expanded={showActivity}
          onClick={() => setShowActivity((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left text-sm font-semibold text-foreground hover:bg-muted/30 rounded-2xl"
        >
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Recent Field Activity</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
              {activityLogs.length}
            </span>
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              showActivity && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </button>

        {showActivity && (
          <div className="border-t border-border p-4">
            <ActivityFeed
              logs={activityLogs.slice(0, 8)}
              audience="staff"
              title="Field Logs"
              description="Recent ticket updates, schedule changes, and recorded collections."
            />
          </div>
        )}
      </div>

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
