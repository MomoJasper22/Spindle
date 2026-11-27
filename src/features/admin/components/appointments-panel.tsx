'use client'

import * as React from 'react'
import { CalendarClock, CheckCircle2, Loader2, Search, UserCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { FormBanner } from '@/components/shared/form-banner'
import { ScrollableList } from '@/components/shared/scrollable-list'
import { StatusBadge } from '@/components/shared/status-badge'
import { APPOINTMENT_STATUSES, TIME_SLOTS, type AppointmentStatus, type TimeSlot } from '@/lib/constants'
import { formatFullName, formatManilaDate, humanizeLabel } from '@/lib/formatters'
import type { AppointmentDetailView, UserWithRole } from '@/types/database'
import {
  adminAssignTechnicianAction,
  adminUpdateAppointmentAction,
} from '../actions/admin-actions'

interface AdminAppointmentsPanelProps {
  appointments: AppointmentDetailView[]
  users: UserWithRole[]
}

export function AdminAppointmentsPanel({
  appointments,
  users,
}: AdminAppointmentsPanelProps) {
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [dispatchTarget, setDispatchTarget] = React.useState<AppointmentDetailView | null>(null)
  const [selectedTechId, setSelectedTechId] = React.useState('')
  const [selectedDate, setSelectedDate] = React.useState('')
  const [selectedSlot, setSelectedSlot] = React.useState<TimeSlot>(TIME_SLOTS[0])
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const activeTechs = users.filter((u) => u.user_type_id === 'UTP-TECH' && u.is_active)

  function openDispatch(apt: AppointmentDetailView) {
    setDispatchTarget(apt)
    setSelectedTechId(apt.technician_id ?? activeTechs[0]?.user_id ?? '')
    setSelectedDate(apt.scheduled_date)
    setSelectedSlot(apt.time_slot)
    setFeedback(null)
  }

  function handleDispatchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dispatchTarget || !selectedTechId) return
    setFeedback(null)
    startTransition(async () => {
      const result = await adminAssignTechnicianAction({
        ticket_id: dispatchTarget.ticket_id,
        technician_id: selectedTechId,
        scheduled_date: selectedDate,
        time_slot: selectedSlot,
      })
      if (result.success) {
        setDispatchTarget(null)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function handleStatusUpdate(apt: AppointmentDetailView, status: AppointmentStatus) {
    setFeedback(null)
    startTransition(async () => {
      const result = await adminUpdateAppointmentAction({
        appointment_id: apt.appointment_id,
        appointment_status: status,
        scheduled_date: apt.scheduled_date,
        time_slot: apt.time_slot,
        remarks: apt.remarks ?? undefined,
      })
      if (result.success) {
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  const filtered = appointments.filter((a) => {
    if (statusFilter !== 'all' && a.appointment_status !== statusFilter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      a.appointment_id.toLowerCase().includes(q) ||
      a.ticket_id.toLowerCase().includes(q) ||
      `${a.customer_first_name} ${a.customer_last_name}`.toLowerCase().includes(q) ||
      `${a.technician_first_name ?? ''} ${a.technician_last_name ?? ''}`.toLowerCase().includes(q) ||
      a.service_address.toLowerCase().includes(q)
    )
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Master Appointments &amp; Dispatch Board</CardTitle>
        <CardDescription>
          Coordinate regional time slots, confirm bookings, and lock technician dispatches without double-booking.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedback && !dispatchTarget && (
          <FormBanner type={feedback.type} message={feedback.message} />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search appointment, ticket, customer, address..."
              aria-label="Search appointments"
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter by appointment status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {APPOINTMENT_STATUSES.map((st) => (
                <SelectItem key={st} value={st}>
                  {humanizeLabel(st)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {appointments.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No scheduled appointments"
            description="Customer and walk-in repair bookings automatically generate appointment slots here."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching appointments"
            description="No appointments matched your search or status filter."
          />
        ) : (
          <>
            <ScrollableList regionLabel="Master dispatch schedule list" className="md:hidden p-0.5 pr-1">
              <div className="space-y-3">
                {filtered.map((apt) => {
                const isFinal = ['completed', 'cancelled'].includes(apt.appointment_status)
                return (
                  <div key={apt.appointment_id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-semibold text-primary">
                          {apt.appointment_id} &middot; {apt.ticket_id}
                        </span>
                        <p className="mt-0.5 font-semibold text-foreground">
                          {formatManilaDate(apt.scheduled_date)} &middot; {apt.time_slot}
                        </p>
                      </div>
                      <StatusBadge status={apt.appointment_status} />
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="text-sm font-medium text-foreground">
                        {apt.customer_first_name} {apt.customer_last_name}
                      </p>
                      <p className="line-clamp-2">{apt.service_address}</p>
                      <p>
                        Tech:{' '}
                        {apt.technician_first_name
                          ? `${apt.technician_first_name} ${apt.technician_last_name}`
                          : 'Unassigned'}
                      </p>
                    </div>
                    {!isFinal && (
                      <div className="flex flex-wrap gap-1.5 border-t border-border pt-2.5">
                        {apt.appointment_status === 'requested' && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => handleStatusUpdate(apt, 'confirmed')}
                          >
                            Confirm
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={activeTechs.length === 0}
                          onClick={() => openDispatch(apt)}
                        >
                          <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Assign / Move</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={isPending}
                          onClick={() => handleStatusUpdate(apt, 'completed')}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
                })}
              </div>
            </ScrollableList>

            <div className="hidden md:block">
              <Table regionLabel="Master dispatch schedule">
                <TableHeader>
                  <TableRow>
                    <TableHead>Appointment / Ticket</TableHead>
                    <TableHead>Date &amp; Slot (PHT)</TableHead>
                    <TableHead>Customer &amp; Address</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((apt) => {
                    const isFinal = ['completed', 'cancelled'].includes(apt.appointment_status)
                    return (
                      <TableRow key={apt.appointment_id}>
                        <TableCell>
                          <p className="font-mono text-xs font-semibold text-primary">
                            {apt.appointment_id}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">{apt.ticket_id}</p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <p className="font-medium">{formatManilaDate(apt.scheduled_date)}</p>
                          <p className="text-xs text-primary">{apt.time_slot}</p>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="font-semibold">
                            {apt.customer_first_name} {apt.customer_last_name}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {apt.service_address}
                          </p>
                        </TableCell>
                        <TableCell>
                          {apt.technician_first_name ? (
                            <span className="font-medium">
                              {apt.technician_first_name} {apt.technician_last_name}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-amber-700">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={apt.appointment_status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {!isFinal && (
                            <div className="inline-flex flex-wrap items-center justify-end gap-1">
                              {apt.appointment_status === 'requested' && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={isPending}
                                  onClick={() => handleStatusUpdate(apt, 'confirmed')}
                                >
                                  Confirm
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={activeTechs.length === 0}
                                onClick={() => openDispatch(apt)}
                              >
                                <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Assign / Move</span>
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={isPending}
                                onClick={() => handleStatusUpdate(apt, 'completed')}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </Button>
                              <ConfirmationDialog
                                trigger={
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    aria-label={`Cancel ${apt.appointment_id}`}
                                  >
                                    <XCircle className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                                  </Button>
                                }
                                title={`Cancel appointment ${apt.appointment_id}?`}
                                description="Cancels this scheduled field visit slot."
                                confirmLabel="Cancel Slot"
                                isPending={isPending}
                                onConfirm={() => handleStatusUpdate(apt, 'cancelled')}
                              />
                            </div>
                          )}
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

      <Dialog
        open={Boolean(dispatchTarget)}
        onOpenChange={(open) => {
          if (!open) setDispatchTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispatch &amp; Reschedule ({dispatchTarget?.ticket_id})</DialogTitle>
            <DialogDescription>
              Assigns a technician and locks the chosen PHT time slot atomically.
            </DialogDescription>
          </DialogHeader>

          {feedback && dispatchTarget && (
            <FormBanner type={feedback.type} message={feedback.message} />
          )}

          <form onSubmit={handleDispatchSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="disp-tech">Technician</Label>
              <Select value={selectedTechId} onValueChange={setSelectedTechId}>
                <SelectTrigger id="disp-tech">
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  {activeTechs.map((t) => (
                    <SelectItem key={t.user_id} value={t.user_id}>
                      {formatFullName(t)} ({t.branch_location || 'Unassigned'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="disp-date">Scheduled Date</Label>
                <Input
                  id="disp-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="disp-slot">Time Slot (PHT)</Label>
                <Select
                  value={selectedSlot}
                  onValueChange={(v) => setSelectedSlot(v as TimeSlot)}
                >
                  <SelectTrigger id="disp-slot">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDispatchTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>Lock Slot &amp; Dispatch</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
