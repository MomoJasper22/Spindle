'use client'

import * as React from 'react'
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  Pencil,
  UserCheck,
  Wrench,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollableList } from '@/components/shared/scrollable-list'
import { StatusBadge } from '@/components/shared/status-badge'
import { UserAvatar } from '@/components/shared/user-avatar'
import { getTechAvailabilityLabel, type TechAvailabilityStatus } from '@/lib/constants'
import {
  formatFullName,
  formatManilaDate,
  formatManilaDateTime,
  formatPHPhone,
  formatPHP,
  getManilaTodayISO,
} from '@/lib/formatters'
import type {
  AppointmentDetailView,
  PaymentDetailView,
  RepairDetailView,
  TechnicianProfileRow,
  TechnicianStatusLogRow,
  UserWithRole,
} from '@/types/database'

interface TechnicianProductivitySheetProps {
  technician: UserWithRole | null
  techProfile: TechnicianProfileRow | null
  repairs: RepairDetailView[]
  appointments: AppointmentDetailView[]
  payments: PaymentDetailView[]
  statusLogs: TechnicianStatusLogRow[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditCredentials: (tech: UserWithRole) => void
  onDispatchTicket: (techId: string) => void
  canDispatch: boolean
}

function formatDurationMs(ms: number): string {
  if (ms <= 0 || !Number.isFinite(ms)) return '0m'
  const totalMinutes = Math.floor(ms / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const mins = totalMinutes % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export function TechnicianProductivitySheet({
  technician,
  techProfile,
  repairs,
  appointments,
  payments,
  statusLogs,
  open,
  onOpenChange,
  onEditCredentials,
  onDispatchTicket,
  canDispatch,
}: TechnicianProductivitySheetProps) {
  const [nowMs] = React.useState(() => Date.now())

  if (!technician) return null

  const todayISO = getManilaTodayISO()
  const monthPrefix = todayISO.slice(0, 7)

  const techRepairs = repairs.filter((r) => r.technician_id === technician.user_id)
  const techTicketIds = new Set(techRepairs.map((r) => r.ticket_id))
  const techAppointments = appointments.filter((a) => a.technician_id === technician.user_id)
  const techPayments = payments.filter(
    (p) =>
      p.payment_status !== 'cancelled' &&
      (p.received_by === technician.user_id || techTicketIds.has(p.ticket_id))
  )

  const nonCancelledRepairs = techRepairs.filter((r) => r.status !== 'cancelled')
  const activeRepairs = nonCancelledRepairs.filter((r) => r.status !== 'completed')
  const completedRepairs = nonCancelledRepairs.filter((r) => r.status === 'completed')
  const completedThisMonth = completedRepairs.filter(
    (r) => r.completed_at?.startsWith(monthPrefix) || r.updated_at.startsWith(monthPrefix)
  )

  const completionRate =
    nonCancelledRepairs.length > 0
      ? Math.round((completedRepairs.length / nonCancelledRepairs.length) * 100)
      : 0

  const turnaroundDurations = completedRepairs
    .map((r) => {
      const start = new Date(r.created_at).getTime()
      const end = new Date(r.completed_at ?? r.updated_at).getTime()
      return end > start ? end - start : 0
    })
    .filter((ms) => ms > 0)

  const avgTurnaroundMs =
    turnaroundDurations.length > 0
      ? turnaroundDurations.reduce((a, b) => a + b, 0) / turnaroundDurations.length
      : 0

  const todaysVisits = techAppointments.filter(
    (a) => a.scheduled_date === todayISO && a.appointment_status !== 'cancelled'
  )
  const completedVisits = techAppointments.filter((a) => a.appointment_status === 'completed')
  const rescheduledVisits = techAppointments.filter((a) => a.appointment_status === 'rescheduled')

  const verifiedCollectedPhp = techPayments
    .filter((p) => p.payment_status === 'verified')
    .reduce((sum, p) => sum + Number(p.amount_php), 0)

  const pendingCollectedPhp = techPayments
    .filter((p) => p.payment_status === 'pending_verification')
    .reduce((sum, p) => sum + Number(p.amount_php), 0)

  const techLogs = statusLogs
    .filter((l) => l.technician_id === technician.user_id)
    .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())

  // Compute time spent in each availability status over recorded status logs (last 30 days)
  const windowStartMs = nowMs - 30 * 24 * 60 * 60 * 1000
  const ascLogs = [...techLogs].sort(
    (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
  )
  const durationsByStatus: Record<TechAvailabilityStatus, number> = {
    available: 0,
    busy: 0,
    lunch: 0,
    off_duty: 0,
  }

  for (let i = 0; i < ascLogs.length; i += 1) {
    const entry = ascLogs[i]
    const nextEntry = ascLogs[i + 1]
    const start = Math.max(new Date(entry.changed_at).getTime(), windowStartMs)
    const end = nextEntry ? new Date(nextEntry.changed_at).getTime() : nowMs
    if (end > start) {
      durationsByStatus[entry.new_status] += end - start
    }
  }

  const currentStatus = techProfile?.availability_status ?? 'available'
  const latestLogTime = techLogs[0]?.changed_at ?? techProfile?.updated_at ?? technician.created_at
  const currentStatusDurationMs = Math.max(0, nowMs - new Date(latestLogTime).getTime())
  const totalLoggedMs =
    durationsByStatus.available +
    durationsByStatus.busy +
    durationsByStatus.lunch +
    durationsByStatus.off_duty

  const fullName = formatFullName(technician)
  const maxDaily = techProfile?.max_daily_jobs ?? 4
  const proposedSpecs = techProfile?.proposed_specializations ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(40rem,96dvw)] space-y-5">
        <SheetHeader>
          <div className="flex items-start gap-3.5 pr-4">
            <UserAvatar
              avatarUrl={technician.avatar_url}
              avatarPosition={technician.avatar_position}
              name={fullName}
              size="lg"
            />
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-primary">
                  {technician.user_id}
                </span>
                <StatusBadge status={currentStatus} />
                {!technician.is_active && <StatusBadge status="inactive" showIcon={false} />}
              </div>
              <SheetTitle className="truncate">
                {fullName}
                {technician.nickname && (
                  <span className="ml-2 text-sm font-medium text-muted-foreground">
                    ({technician.nickname})
                  </span>
                )}
              </SheetTitle>
              <SheetDescription>
                {technician.branch_location || 'Unassigned Branch'} &middot;{' '}
                {formatPHPhone(technician.phone)} &middot; Cert:{' '}
                <span className="font-mono">{techProfile?.certification_no || 'None'}</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              onEditCredentials(technician)
            }}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Assign Specializations &amp; Capacity</span>
          </Button>
          {canDispatch && technician.is_active && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                onDispatchTicket(technician.user_id)
              }}
            >
              <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Dispatch Ticket</span>
            </Button>
          )}
        </div>

        {/* Productivity KPI Grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Jobs Completed</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            </div>
            <p className="font-heading text-2xl font-bold tabular-nums text-foreground">
              {completedRepairs.length}
              <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                ({completedThisMonth.length} this month)
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {completionRate}% completion across {nonCancelledRepairs.length} assigned tickets
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Daily Load</span>
              <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <p className="font-heading text-2xl font-bold tabular-nums text-foreground">
              {todaysVisits.length} / {maxDaily}
              <span className="ml-1.5 text-xs font-medium text-muted-foreground">today</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {activeRepairs.length} active in queue &middot; {completedVisits.length} visits done ({rescheduledVisits.length} rescheduled)
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Avg. Turnaround</span>
              <Clock className="h-4 w-4 text-sky-600" aria-hidden="true" />
            </div>
            <p className="font-heading text-2xl font-bold tabular-nums text-foreground">
              {turnaroundDurations.length > 0 ? formatDurationMs(avgTurnaroundMs) : '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              Active status now: {getTechAvailabilityLabel(currentStatus)} ({formatDurationMs(currentStatusDurationMs)})
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Collections Handled</span>
              <CreditCard className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            </div>
            <p className="font-heading text-2xl font-bold tabular-nums text-foreground">
              {formatPHP(verifiedCollectedPhp)}
            </p>
            <p className="text-xs text-muted-foreground">
              Pending verification: {formatPHP(pendingCollectedPhp)}
            </p>
          </div>
        </div>

        {/* Availability Time Breakdown */}
        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
              <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Availability &amp; Time Tracker (Last 30 Days)</span>
            </h3>
            <span className="text-[11px] text-muted-foreground">
              {techLogs.length} status switch{techLogs.length === 1 ? '' : 'es'}
            </span>
          </div>

          {totalLoggedMs > 0 ? (
            <>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-emerald-500"
                  style={{ width: `${(durationsByStatus.available / totalLoggedMs) * 100}%` }}
                  title={`Available: ${formatDurationMs(durationsByStatus.available)}`}
                />
                <div
                  className="bg-amber-500"
                  style={{ width: `${(durationsByStatus.busy / totalLoggedMs) * 100}%` }}
                  title={`Busy: ${formatDurationMs(durationsByStatus.busy)}`}
                />
                <div
                  className="bg-sky-500"
                  style={{ width: `${(durationsByStatus.lunch / totalLoggedMs) * 100}%` }}
                  title={`Break: ${formatDurationMs(durationsByStatus.lunch)}`}
                />
                <div
                  className="bg-slate-400"
                  style={{ width: `${(durationsByStatus.off_duty / totalLoggedMs) * 100}%` }}
                  title={`Off Duty: ${formatDurationMs(durationsByStatus.off_duty)}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-card px-2.5 py-2">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Available
                  </span>
                  <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                    {formatDurationMs(durationsByStatus.available)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card px-2.5 py-2">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Busy
                  </span>
                  <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                    {formatDurationMs(durationsByStatus.busy)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card px-2.5 py-2">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    Break
                  </span>
                  <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                    {formatDurationMs(durationsByStatus.lunch)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card px-2.5 py-2">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    Off Duty
                  </span>
                  <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                    {formatDurationMs(durationsByStatus.off_duty)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              No availability transitions recorded yet. Status changes from the Technician Overview dropdown will be tracked here automatically.
            </p>
          )}

          {techLogs.length > 0 && (
            <ScrollableList
              regionLabel="Availability status switches"
              maxHeightClassName="max-h-56"
              className="pr-1"
            >
              <ul className="divide-y divide-dashed divide-border pt-1 text-xs">
                {techLogs.map((log) => (
                  <li key={log.log_id} className="flex items-center justify-between gap-2 py-2">
                    <span className="font-medium text-foreground">
                      {log.previous_status ? `${getTechAvailabilityLabel(log.previous_status)} → ` : ''}
                      {getTechAvailabilityLabel(log.new_status)}
                    </span>
                    <time dateTime={log.changed_at} className="text-muted-foreground tabular-nums">
                      {formatManilaDateTime(log.changed_at)}
                    </time>
                  </li>
                ))}
              </ul>
            </ScrollableList>
          )}
        </div>

        {/* Specializations & Proposed Review */}
        <div className="space-y-2.5">
          <h3 className="flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
            <Wrench className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Specializations</span>
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {techProfile && techProfile.specializations.length > 0 ? (
              techProfile.specializations.map((spec) => (
                <Badge key={spec} variant="outline">
                  {spec}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No specializations assigned yet.</span>
            )}
          </div>
          {proposedSpecs.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-amber-ink">
                Proposed by Technician (Pending Admin Review)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {proposedSpecs.map((spec) => (
                  <Badge key={spec} variant="amber">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Recent Assigned Tickets */}
        <div className="space-y-2.5">
          <h3 className="font-heading text-sm font-semibold text-foreground">
            Recent Assigned Tickets
          </h3>
          {techRepairs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No repair tickets assigned yet.</p>
          ) : (
            <ScrollableList
              regionLabel="Assigned repair tickets"
              maxHeightClassName="max-h-56"
              className="border border-border bg-card"
            >
              <ul className="divide-y divide-border px-3.5">
                {techRepairs.map((ticket) => (
                  <li key={ticket.ticket_id} className="flex items-center justify-between gap-2 py-2.5 text-xs">
                    <div className="min-w-0">
                      <p className="font-mono font-semibold text-primary">{ticket.ticket_id}</p>
                      <p className="truncate text-foreground">
                        {ticket.customer_first_name} {ticket.customer_last_name} &middot;{' '}
                        {ticket.appliance_brand} {ticket.appliance_category}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={ticket.status} />
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {formatManilaDate(ticket.scheduled_date)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollableList>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
