'use client'

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarClock, CheckCircle2, Loader2, MapPin } from 'lucide-react'
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
import { EmptyState } from '@/components/shared/empty-state'
import { FormBanner } from '@/components/shared/form-banner'
import { ScrollableList } from '@/components/shared/scrollable-list'
import { StatusBadge } from '@/components/shared/status-badge'
import { TIME_SLOTS } from '@/lib/constants'
import { formatManilaDate, formatPHPhone, getManilaTodayISO } from '@/lib/formatters'
import type { AppointmentDetailView } from '@/types/database'
import { updateTechnicianAppointmentAction } from '../actions/technician-actions'
import {
  technicianAppointmentActionSchema,
  type TechnicianAppointmentActionInput,
} from '../schemas/technician-schemas'

interface SchedulePanelProps {
  appointments: AppointmentDetailView[]
}

export function SchedulePanel({ appointments }: SchedulePanelProps) {
  const [scope, setScope] = React.useState<'today' | 'upcoming' | 'all'>('upcoming')
  const [rescheduleTarget, setRescheduleTarget] = React.useState<AppointmentDetailView | null>(null)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const todayISO = getManilaTodayISO()

  const form = useForm<TechnicianAppointmentActionInput>({
    resolver: zodResolver(technicianAppointmentActionSchema),
    mode: 'onBlur',
    defaultValues: {
      appointment_id: '',
      appointment_status: 'rescheduled',
      scheduled_date: todayISO,
      time_slot: TIME_SLOTS[0],
      remarks: '',
    },
  })

  function handleQuickStatus(
    apt: AppointmentDetailView,
    nextStatus: 'confirmed' | 'completed'
  ) {
    setFeedback(null)
    startTransition(async () => {
      const result = await updateTechnicianAppointmentAction({
        appointment_id: apt.appointment_id,
        appointment_status: nextStatus,
        scheduled_date: apt.scheduled_date,
        time_slot: apt.time_slot,
        remarks: apt.remarks ?? '',
      })
      if (result.success) {
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function openReschedule(apt: AppointmentDetailView) {
    setRescheduleTarget(apt)
    form.reset({
      appointment_id: apt.appointment_id,
      appointment_status: 'rescheduled',
      scheduled_date: apt.scheduled_date,
      time_slot: apt.time_slot,
      remarks: apt.remarks ?? '',
    })
    setFeedback(null)
  }

  function onRescheduleSubmit(values: TechnicianAppointmentActionInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await updateTechnicianAppointmentAction({
        ...values,
        appointment_status: 'rescheduled',
      })
      if (result.success) {
        setRescheduleTarget(null)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  const filtered = appointments.filter((apt) => {
    if (scope === 'today') return apt.scheduled_date === todayISO
    if (scope === 'upcoming') {
      return apt.scheduled_date >= todayISO && !['completed', 'cancelled'].includes(apt.appointment_status)
    }
    return true
  })

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Field Schedule &amp; Appointments Agenda</CardTitle>
          <CardDescription>
            Confirm assigned customer windows, propose reschedules, or close completed site visits.
          </CardDescription>
        </div>

        <div className="inline-flex rounded-lg border border-border bg-muted p-1 self-start">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'all', label: 'All History' },
            ] as const
          ).map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={scope === item.id ? 'default' : 'ghost'}
              onClick={() => setScope(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedback && !rescheduleTarget && (
          <FormBanner type={feedback.type} message={feedback.message} />
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No appointments in this window"
            description="Switch between Today, Upcoming, or All History to inspect your dispatched visits."
          />
        ) : (
          <>
            <ScrollableList regionLabel="Technician appointment schedule list" className="md:hidden p-0.5 pr-1">
              <div className="space-y-3">
                {filtered.map((apt) => {
                const isFinal = ['completed', 'cancelled'].includes(apt.appointment_status)
                return (
                  <div
                    key={apt.appointment_id}
                    className="rounded-xl border border-border bg-card p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          {formatManilaDate(apt.scheduled_date)}
                        </p>
                        <p className="text-xs font-medium text-primary">{apt.time_slot}</p>
                      </div>
                      <StatusBadge status={apt.appointment_status} />
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-foreground">
                        {apt.customer_first_name} {apt.customer_last_name}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {apt.ticket_id} &middot; {apt.appliance_brand} {apt.appliance_model_number}
                      </p>
                      <p className="flex items-start gap-1 text-xs text-muted-foreground">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{apt.service_address}</span>
                      </p>
                    </div>
                    {!isFinal && (
                      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                        {apt.appointment_status === 'requested' && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => handleQuickStatus(apt, 'confirmed')}
                          >
                            Confirm
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => openReschedule(apt)}
                        >
                          Reschedule
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={isPending}
                          onClick={() => handleQuickStatus(apt, 'completed')}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Complete</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )
                })}
              </div>
            </ScrollableList>

            <div className="hidden md:block">
              <Table regionLabel="Technician appointment schedule">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date &amp; Slot (PHT)</TableHead>
                    <TableHead>Ticket &amp; Unit</TableHead>
                    <TableHead>Customer &amp; Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((apt) => {
                    const isFinal = ['completed', 'cancelled'].includes(apt.appointment_status)
                    return (
                      <TableRow key={apt.appointment_id}>
                        <TableCell className="whitespace-nowrap">
                          <p className="font-semibold text-foreground">
                            {formatManilaDate(apt.scheduled_date)}
                          </p>
                          <p className="text-xs text-primary font-medium">{apt.time_slot}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-mono text-xs font-semibold">{apt.ticket_id}</p>
                          <p className="text-xs text-muted-foreground">
                            {apt.appliance_brand} {apt.appliance_model_number}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="font-medium text-foreground">
                            {apt.customer_first_name} {apt.customer_last_name} &middot;{' '}
                            <span className="text-xs text-muted-foreground">
                              {formatPHPhone(apt.customer_phone)}
                            </span>
                          </p>
                          <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
                            <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                            <span className="line-clamp-2">{apt.service_address}</span>
                          </p>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={apt.appointment_status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {!isFinal && (
                            <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                              {apt.appointment_status === 'requested' && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={isPending}
                                  onClick={() => handleQuickStatus(apt, 'confirmed')}
                                >
                                  Confirm
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => openReschedule(apt)}
                              >
                                Reschedule
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={isPending}
                                onClick={() => handleQuickStatus(apt, 'completed')}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Complete</span>
                              </Button>
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
        open={Boolean(rescheduleTarget)}
        onOpenChange={(open) => {
          if (!open) setRescheduleTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Propose Appointment Reschedule</DialogTitle>
            <DialogDescription>
              Adjust date or time slot for {rescheduleTarget?.ticket_id}.
            </DialogDescription>
          </DialogHeader>

          {feedback && rescheduleTarget && (
            <FormBanner type={feedback.type} message={feedback.message} />
          )}

          <form onSubmit={form.handleSubmit(onRescheduleSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="tech-resched-date">New Date</Label>
              <Input
                id="tech-resched-date"
                type="date"
                min={todayISO}
                {...form.register('scheduled_date')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tech-resched-slot">Time Slot (PHT)</Label>
              <Controller
                name="time_slot"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="tech-resched-slot">
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
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tech-resched-remarks">Reschedule Reason / Notes</Label>
              <Input
                id="tech-resched-remarks"
                placeholder="e.g. Customer requested afternoon window"
                {...form.register('remarks')}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRescheduleTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>Save Schedule</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
