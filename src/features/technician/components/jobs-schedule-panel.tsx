'use client'

import * as React from 'react'
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  Play,
  Search,
  Wrench,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { FormBanner } from '@/components/shared/form-banner'
import { ScrollableList } from '@/components/shared/scrollable-list'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatManilaDate, formatPHPhone, formatPHP, getManilaTodayISO, humanizeLabel } from '@/lib/formatters'
import { getTicketPaymentSummary } from '@/lib/payments'
import { cn } from '@/lib/utils'
import { startTechnicianJobAction } from '../actions/technician-actions'
import type { TechnicianJobItem } from '../lib/job-schedule'

export type JobScheduleScope = 'today' | 'upcoming' | 'completed' | 'all'

interface JobsSchedulePanelProps {
  jobs: TechnicianJobItem[]
  initialScope?: JobScheduleScope
  onSelectJob: (job: TechnicianJobItem) => void
}

type StageFilter = 'all' | 'scheduled' | 'in_progress' | 'awaiting_payment' | 'completed'

function getRelativeDayTag(scheduledDate: string, todayISO: string, isActive: boolean) {
  if (scheduledDate === todayISO) {
    return { label: 'Today', className: 'bg-primary-tint text-primary border-teal-200' }
  }
  if (isActive && scheduledDate < todayISO) {
    return { label: 'Overdue', className: 'bg-rose-50 text-rose-700 border-rose-200' }
  }
  return null
}

function getActionLabel(status: TechnicianJobItem['repair']['status'], isSettled: boolean): string {
  if (status === 'in_progress') return 'Update / Bill'
  if (status === 'awaiting_payment') return isSettled ? 'Complete' : 'Collect'
  if (status === 'completed' || status === 'cancelled') return 'View'
  return 'Details'
}

export function JobsSchedulePanel({
  jobs,
  initialScope = 'upcoming',
  onSelectJob,
}: JobsSchedulePanelProps) {
  const [scope, setScope] = React.useState<JobScheduleScope>(initialScope)
  const [search, setSearch] = React.useState('')
  const [stageFilter, setStageFilter] = React.useState<StageFilter>('all')
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [startingTicketId, setStartingTicketId] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const todayISO = getManilaTodayISO()

  const counts = React.useMemo(() => {
    return {
      today: jobs.filter((j) => j.scheduledDate === todayISO && !j.isCancelled).length,
      upcoming: jobs.filter((j) => j.isActive).length,
      completed: jobs.filter((j) => j.isCompleted || j.isCancelled).length,
      all: jobs.length,
    }
  }, [jobs, todayISO])

  const scopedJobs = React.useMemo(() => {
    return jobs.filter((job) => {
      if (scope === 'today' && !(job.scheduledDate === todayISO && !job.isCancelled)) return false
      if (scope === 'upcoming' && !job.isActive) return false
      if (scope === 'completed' && !(job.isCompleted || job.isCancelled)) return false

      if (stageFilter !== 'all') {
        const s = job.repair.status
        if (stageFilter === 'scheduled' && !['pending', 'confirmed', 'assigned'].includes(s)) {
          return false
        }
        if (stageFilter === 'in_progress' && s !== 'in_progress') return false
        if (stageFilter === 'awaiting_payment' && s !== 'awaiting_payment') return false
        if (stageFilter === 'completed' && s !== 'completed') return false
      }

      const q = search.trim().toLowerCase()
      if (!q) return true
      return (
        job.ticketId.toLowerCase().includes(q) ||
        `${job.repair.customer_first_name} ${job.repair.customer_last_name}`.toLowerCase().includes(q) ||
        job.repair.appliance_brand.toLowerCase().includes(q) ||
        job.repair.appliance_category.toLowerCase().includes(q) ||
        job.repair.appliance_model_number.toLowerCase().includes(q) ||
        job.serviceAddress.toLowerCase().includes(q)
      )
    })
  }, [jobs, scope, todayISO, stageFilter, search])

  function handleQuickStart(job: TechnicianJobItem) {
    setFeedback(null)
    setStartingTicketId(job.ticketId)
    startTransition(async () => {
      const result = await startTechnicianJobAction(job.ticketId)
      setStartingTicketId(null)
      if (result.success) {
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  const tabs: Array<{ id: JobScheduleScope; label: string; count: number }> = [
    { id: 'today', label: 'Today', count: counts.today },
    { id: 'upcoming', label: 'Active & Upcoming', count: counts.upcoming },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'all', label: 'All Jobs', count: counts.all },
  ]

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Visit Agenda &amp; Job Queue</CardTitle>
            <CardDescription>
              Sorted chronologically by your PHT visit slots. Start a job in one click or tap any visit to log diagnostics, reschedule, or collect payment.
            </CardDescription>
          </div>
        </div>

        {/* Accessible Single-Row Scrollable Tablist */}
        <div
          role="tablist"
          aria-label="Job schedule filter"
          className="flex items-center gap-1 overflow-x-auto border-b border-border pb-px spindle-scroll"
        >
          {tabs.map((tab) => {
            const selected = scope === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setScope(tab.id)
                  if (tab.id === 'completed') setStageFilter('all')
                }}
                className={cn(
                  'relative flex flex-none items-center gap-2 px-3.5 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-t-lg',
                  selected
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
                    selected
                      ? 'bg-primary-tint text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.count}
                </span>
                {selected && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"
                  />
                )}
              </button>
            )
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedback && <FormBanner type={feedback.type} message={feedback.message} />}

        {jobs.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket, customer, appliance, address..."
                aria-label="Search assigned jobs and visits"
                className="pl-9"
              />
            </div>

            {scope !== 'completed' && (
              <Select
                value={stageFilter}
                onValueChange={(value) => setStageFilter(value as StageFilter)}
              >
                <SelectTrigger className="w-full sm:w-48" aria-label="Filter by stage">
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
                  {scope === 'all' && <SelectItem value="completed">Completed</SelectItem>}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {jobs.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No assigned jobs yet"
            description="When dispatch assigns a repair visit to you, it will appear here with its date, time window, and customer details."
          />
        ) : scopedJobs.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title={
              scope === 'today'
                ? 'No visits scheduled for today'
                : scope === 'upcoming'
                  ? 'No active or upcoming jobs'
                  : 'No matching jobs'
            }
            description={
              scope === 'today' && counts.upcoming > 0
                ? 'Switch to Active & Upcoming to inspect your next scheduled visits.'
                : 'Try switching schedule tabs or clearing your search and stage filter.'
            }
            action={
              scope === 'today' && counts.upcoming > 0 ? (
                <Button type="button" variant="outline" onClick={() => setScope('upcoming')}>
                  View Active &amp; Upcoming ({counts.upcoming})
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Mobile Stacked Cards */}
            <ScrollableList regionLabel="Technician jobs and schedule list" className="md:hidden p-0.5 pr-1">
              <div className="space-y-3">
                {scopedJobs.map((job) => {
                  const { repair } = job
                  const paymentSummary = getTicketPaymentSummary(repair)
                  const dayTag = getRelativeDayTag(job.scheduledDate, todayISO, job.isActive)
                  const canQuickStart = ['pending', 'confirmed', 'assigned'].includes(repair.status)
                  const isStartingThis = isPending && startingTicketId === job.ticketId

                  return (
                    <div
                      key={job.ticketId}
                      className="rounded-xl border border-border bg-card p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-semibold text-foreground">
                              {formatManilaDate(job.scheduledDate)}
                            </span>
                            {dayTag && (
                              <Badge variant="outline" className={dayTag.className}>
                                {dayTag.label}
                              </Badge>
                            )}
                          </div>
                          {job.timeSlot && (
                            <p className="text-xs font-semibold text-primary">{job.timeSlot} (PHT)</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge status={repair.status} />
                          {(repair.priority === 'high' || repair.priority === 'urgent') && (
                            <StatusBadge status={repair.priority} showIcon={false} />
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {job.ticketId}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            &middot; {humanizeLabel(repair.service_type)}
                          </span>
                          {job.needsVisitConfirmation && (
                            <Badge variant="sky">
                              {job.appointmentStatus === 'rescheduled'
                                ? 'Slot Rescheduled'
                                : 'Slot Unconfirmed'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {repair.customer_first_name} {repair.customer_last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {repair.appliance_brand} {repair.appliance_category} ({repair.appliance_model_number})
                        </p>
                        <p className="flex items-start gap-1 text-xs text-muted-foreground">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="line-clamp-2">{job.serviceAddress}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                        <div className="text-xs tabular-nums">
                          <span className="font-semibold text-foreground">
                            {formatPHP(paymentSummary.targetTotal)}
                          </span>
                          {paymentSummary.hasFinalBill && !paymentSummary.isSettled && (
                            <span className="ml-1.5 text-muted-foreground">
                              (Bal: {formatPHP(paymentSummary.payableRemaining)})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {canQuickStart && (
                            <Button
                              type="button"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleQuickStart(job)}
                            >
                              {isStartingThis ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                              ) : (
                                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
                              <span>Start Job</span>
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant={canQuickStart ? 'outline' : 'default'}
                            onClick={() => onSelectJob(job)}
                          >
                            <span>{getActionLabel(repair.status, paymentSummary.isSettled)}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollableList>

            {/* Desktop Semantic Data Table */}
            <div className="hidden md:block">
              <Table regionLabel="Technician jobs and schedule">
                <TableHeader>
                  <TableRow>
                    <TableHead>Visit Window (PHT)</TableHead>
                    <TableHead>Ticket &amp; Appliance</TableHead>
                    <TableHead>Customer &amp; Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Billing (PHP)</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedJobs.map((job) => {
                    const { repair } = job
                    const paymentSummary = getTicketPaymentSummary(repair)
                    const dayTag = getRelativeDayTag(job.scheduledDate, todayISO, job.isActive)
                    const canQuickStart = ['pending', 'confirmed', 'assigned'].includes(repair.status)
                    const isStartingThis = isPending && startingTicketId === job.ticketId

                    return (
                      <TableRow key={job.ticketId}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground">
                              {formatManilaDate(job.scheduledDate)}
                            </span>
                            {dayTag && (
                              <Badge variant="outline" className={dayTag.className}>
                                {dayTag.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs font-medium text-primary">
                            {job.timeSlot ?? 'Slot pending'}
                          </p>
                          {job.needsVisitConfirmation && (
                            <p className="mt-0.5 text-[11px] font-medium text-amber-700">
                              {job.appointmentStatus === 'rescheduled'
                                ? 'Rescheduled slot'
                                : 'Needs slot confirmation'}
                            </p>
                          )}
                        </TableCell>

                        <TableCell>
                          <p className="font-mono text-xs font-semibold text-primary">
                            {job.ticketId}
                          </p>
                          <p className="font-medium text-foreground">
                            {repair.appliance_brand} {repair.appliance_category}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {repair.appliance_model_number} &middot; {humanizeLabel(repair.service_type)}
                          </p>
                        </TableCell>

                        <TableCell className="max-w-xs">
                          <p className="font-semibold text-foreground">
                            {repair.customer_first_name} {repair.customer_last_name}
                          </p>
                          {repair.customer_phone && (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
                              <span>{formatPHPhone(repair.customer_phone)}</span>
                            </p>
                          )}
                          <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
                            <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                            <span className="line-clamp-2">{job.serviceAddress}</span>
                          </p>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <StatusBadge status={repair.status} />
                            {(repair.priority === 'high' || repair.priority === 'urgent') && (
                              <StatusBadge status={repair.priority} showIcon={false} />
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="tabular-nums text-xs whitespace-nowrap">
                          {repair.final_cost_php !== null ? (
                            <>
                              <p className="font-semibold text-foreground">
                                Final: {formatPHP(repair.final_cost_php)}
                              </p>
                              <p
                                className={
                                  paymentSummary.isSettled
                                    ? 'text-emerald-700 font-medium'
                                    : 'text-muted-foreground'
                                }
                              >
                                {paymentSummary.isSettled ? (
                                  <span className="inline-flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                                    Settled
                                  </span>
                                ) : (
                                  `Bal: ${formatPHP(paymentSummary.payableRemaining)}`
                                )}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-muted-foreground">
                                Est: {formatPHP(repair.estimated_cost_php)}
                              </p>
                              <p className="text-muted-foreground">Final: Pending</p>
                            </>
                          )}
                        </TableCell>

                        <TableCell className="text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {canQuickStart && (
                              <Button
                                type="button"
                                size="sm"
                                disabled={isPending}
                                onClick={() => handleQuickStart(job)}
                              >
                                {isStartingThis ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                ) : (
                                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                                )}
                                <span>Start Job</span>
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant={canQuickStart ? 'outline' : 'default'}
                              onClick={() => onSelectJob(job)}
                            >
                              {getActionLabel(repair.status, paymentSummary.isSettled)}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
