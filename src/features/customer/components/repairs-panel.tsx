'use client'

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarClock, Loader2, Plus, Search, Wrench, XCircle } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { FormBanner } from '@/components/shared/form-banner'
import { StatusBadge } from '@/components/shared/status-badge'
import { REPAIR_PRIORITIES, REPAIR_STATUSES, SERVICE_TYPES, TIME_SLOTS } from '@/lib/constants'
import {
  formatManilaDate,
  formatPHPhone,
  formatPHP,
  getManilaTodayISO,
  humanizeLabel,
} from '@/lib/formatters'
import type {
  AppointmentDetailView,
  CustomerApplianceRow,
  RepairDetailView,
} from '@/types/database'
import {
  cancelRepairTicketAction,
  createRepairBookingAction,
  rescheduleAppointmentAction,
} from '../actions/customer-actions'
import {
  repairBookingSchema,
  rescheduleAppointmentSchema,
  type RepairBookingInput,
  type RescheduleAppointmentInput,
} from '../schemas/customer-schemas'

interface RepairsPanelProps {
  appliances: CustomerApplianceRow[]
  repairs: RepairDetailView[]
  appointments: AppointmentDetailView[]
  defaultServiceAddress: string
  onGoToAppliances: () => void
}

export function RepairsPanel({
  appliances,
  repairs,
  appointments,
  defaultServiceAddress,
  onGoToAppliances,
}: RepairsPanelProps) {
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [bookDialogOpen, setBookDialogOpen] = React.useState(false)
  const [rescheduleTarget, setRescheduleTarget] = React.useState<AppointmentDetailView | null>(null)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const activeAppliances = appliances.filter((a) => a.registration_status !== 'cancelled')
  const todayISO = getManilaTodayISO()

  const bookForm = useForm<RepairBookingInput>({
    resolver: zodResolver(repairBookingSchema),
    mode: 'onBlur',
    defaultValues: {
      appliance_id: activeAppliances[0]?.appliance_id ?? '',
      service_type: 'repair',
      priority: 'normal',
      issue_description: '',
      scheduled_date: todayISO,
      time_slot: TIME_SLOTS[0],
      service_address: defaultServiceAddress,
      remarks: '',
    },
  })

  const rescheduleForm = useForm<RescheduleAppointmentInput>({
    resolver: zodResolver(rescheduleAppointmentSchema),
    mode: 'onBlur',
    defaultValues: {
      appointment_id: '',
      scheduled_date: todayISO,
      time_slot: TIME_SLOTS[0],
      remarks: '',
    },
  })

  function openBookDialog() {
    bookForm.reset({
      appliance_id: activeAppliances[0]?.appliance_id ?? '',
      service_type: 'repair',
      priority: 'normal',
      issue_description: '',
      scheduled_date: todayISO,
      time_slot: TIME_SLOTS[0],
      service_address: defaultServiceAddress,
      remarks: '',
    })
    setFeedback(null)
    setBookDialogOpen(true)
  }

  function openRescheduleDialog(apt: AppointmentDetailView) {
    setRescheduleTarget(apt)
    rescheduleForm.reset({
      appointment_id: apt.appointment_id,
      scheduled_date: apt.scheduled_date,
      time_slot: apt.time_slot,
      remarks: apt.remarks ?? '',
    })
    setFeedback(null)
  }

  function onBookSubmit(values: RepairBookingInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await createRepairBookingAction(values)
      if (result.success) {
        setBookDialogOpen(false)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function onRescheduleSubmit(values: RescheduleAppointmentInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await rescheduleAppointmentAction(values)
      if (result.success) {
        setRescheduleTarget(null)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function handleCancelTicket(ticketId: string) {
    setFeedback(null)
    startTransition(async () => {
      const result = await cancelRepairTicketAction(ticketId)
      if (result.success) {
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  const appointmentByTicket = new Map<string, AppointmentDetailView>()
  for (const apt of appointments) {
    if (!appointmentByTicket.has(apt.ticket_id)) {
      appointmentByTicket.set(apt.ticket_id, apt)
    }
  }

  const filteredRepairs = repairs.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      r.ticket_id.toLowerCase().includes(q) ||
      r.appliance_brand.toLowerCase().includes(q) ||
      r.appliance_model_number.toLowerCase().includes(q) ||
      r.issue_description.toLowerCase().includes(q) ||
      `${r.technician_first_name ?? ''} ${r.technician_last_name ?? ''}`.toLowerCase().includes(q)
    )
  })

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Repairs &amp; Service Appointments</CardTitle>
          <CardDescription>
            Schedule field service visits, track live ticket progress, and manage appointment slots.
          </CardDescription>
        </div>
        <Button onClick={openBookDialog} disabled={activeAppliances.length === 0}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Book Repair &amp; Slot</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedback && !bookDialogOpen && !rescheduleTarget && (
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
              placeholder="Search ticket ID, appliance, issue..."
              aria-label="Search repair tickets"
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Filter tickets by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {REPAIR_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {humanizeLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeAppliances.length === 0 && repairs.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Register an appliance first"
            description="Before booking a technician dispatch, register at least one appliance under My Appliances."
            action={
              <Button variant="outline" onClick={onGoToAppliances}>
                Go to My Appliances
              </Button>
            }
          />
        ) : repairs.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No repair requests yet"
            description="Schedule a diagnostic inspection, repair, or preventive maintenance visit around your preferred date and time slot."
            action={
              <Button onClick={openBookDialog}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Schedule First Service</span>
              </Button>
            }
          />
        ) : filteredRepairs.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching repair tickets"
            description="No tickets match your current search or status filter."
          />
        ) : (
          <Table regionLabel="Customer repair tickets and appointments">
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Appliance &amp; Issue</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Appointment Slot</TableHead>
                <TableHead>Status &amp; Priority</TableHead>
                <TableHead>Estimate / Final</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRepairs.map((ticket) => {
                const apt = appointmentByTicket.get(ticket.ticket_id)
                const canModify = ['pending', 'confirmed'].includes(ticket.status)
                const techName =
                  ticket.technician_first_name && ticket.technician_last_name
                    ? `${ticket.technician_first_name} ${ticket.technician_last_name}`
                    : null

                return (
                  <TableRow key={ticket.ticket_id}>
                    <TableCell className="align-top">
                      <p className="font-mono text-xs font-semibold text-primary">
                        {ticket.ticket_id}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {humanizeLabel(ticket.service_type)}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-xs align-top">
                      <p className="font-semibold text-foreground">
                        {ticket.appliance_brand} &middot; {ticket.appliance_model_number}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {ticket.issue_description}
                      </p>
                      {ticket.diagnostic_notes && (
                        <p className="mt-1 rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                          <span className="font-semibold">Tech notes:</span> {ticket.diagnostic_notes}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      {techName ? (
                        <div>
                          <p className="font-medium text-foreground">{techName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPHPhone(ticket.technician_phone)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Awaiting dispatch</span>
                      )}
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap">
                      <p className="text-sm font-medium">{formatManilaDate(ticket.scheduled_date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {apt ? apt.time_slot : 'Slot pending'}
                      </p>
                      {apt && (
                        <div className="mt-1">
                          <StatusBadge status={apt.appointment_status} showIcon={false} />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-col items-start gap-1.5">
                        <StatusBadge status={ticket.status} />
                        <StatusBadge status={ticket.priority} showIcon={false} />
                      </div>
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap tabular-nums">
                      <p className="text-xs text-muted-foreground">
                        Est: <span className="font-medium text-foreground">{formatPHP(ticket.estimated_cost_php)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Final:{' '}
                        <span className="font-semibold text-foreground">
                          {ticket.final_cost_php !== null ? formatPHP(ticket.final_cost_php) : 'Pending'}
                        </span>
                      </p>
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {apt && canModify && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openRescheduleDialog(apt)}
                          >
                            Reschedule
                          </Button>
                        )}
                        {canModify && (
                          <ConfirmationDialog
                            trigger={
                              <Button type="button" variant="ghost" size="sm">
                                <XCircle className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                                <span className="sr-only sm:not-sr-only">Cancel</span>
                              </Button>
                            }
                            title={`Cancel repair ticket ${ticket.ticket_id}?`}
                            description="This cancels both your repair request and its scheduled field appointment slot."
                            confirmLabel="Cancel Ticket"
                            isPending={isPending}
                            onConfirm={() => handleCancelTicket(ticket.ticket_id)}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Book Repair & Appointment Modal */}
      <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Book Repair &amp; Service Appointment</DialogTitle>
            <DialogDescription>
              Creates your repair ticket and reserves your preferred Philippine service window atomically.
            </DialogDescription>
          </DialogHeader>

          {feedback && bookDialogOpen && <FormBanner type={feedback.type} message={feedback.message} />}

          <form onSubmit={bookForm.handleSubmit(onBookSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="book-appliance">
                Appliance <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="appliance_id"
                control={bookForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="book-appliance">
                      <SelectValue placeholder="Choose a registered appliance" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeAppliances.map((app) => (
                        <SelectItem key={app.appliance_id} value={app.appliance_id}>
                          {app.brand} {app.category} ({app.model_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {bookForm.formState.errors.appliance_id && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {bookForm.formState.errors.appliance_id.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="book-service-type">
                  Service type <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="service_type"
                  control={bookForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="book-service-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_TYPES.map((st) => (
                          <SelectItem key={st.value} value={st.value}>
                            {st.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="book-priority">
                  Priority <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="priority"
                  control={bookForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="book-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REPAIR_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {humanizeLabel(p)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="book-date">
                  Preferred date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="book-date"
                  type="date"
                  min={todayISO}
                  aria-invalid={Boolean(bookForm.formState.errors.scheduled_date)}
                  {...bookForm.register('scheduled_date')}
                />
                {bookForm.formState.errors.scheduled_date && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {bookForm.formState.errors.scheduled_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="book-slot">
                  Time slot (PHT) <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="time_slot"
                  control={bookForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="book-slot">
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="book-issue">
                Issue description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="book-issue"
                placeholder="Describe symptoms, error codes, leaks, or unusual sounds..."
                aria-invalid={Boolean(bookForm.formState.errors.issue_description)}
                {...bookForm.register('issue_description')}
              />
              {bookForm.formState.errors.issue_description && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {bookForm.formState.errors.issue_description.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="book-address">
                Service address <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="book-address"
                rows={2}
                aria-invalid={Boolean(bookForm.formState.errors.service_address)}
                {...bookForm.register('service_address')}
              />
              {bookForm.formState.errors.service_address && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {bookForm.formState.errors.service_address.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="book-remarks">Access / gate instructions (optional)</Label>
              <Input
                id="book-remarks"
                placeholder="e.g. Gate pass required at subdivision guardhouse"
                {...bookForm.register('remarks')}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBookDialogOpen(false)}>
                Close
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>Submit Repair Request</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reschedule Appointment Modal */}
      <Dialog
        open={Boolean(rescheduleTarget)}
        onOpenChange={(open) => {
          if (!open) setRescheduleTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Update the preferred date and window for {rescheduleTarget?.ticket_id}.
            </DialogDescription>
          </DialogHeader>

          {feedback && rescheduleTarget && (
            <FormBanner type={feedback.type} message={feedback.message} />
          )}

          <form
            onSubmit={rescheduleForm.handleSubmit(onRescheduleSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="resched-date">New service date</Label>
              <Input
                id="resched-date"
                type="date"
                min={todayISO}
                {...rescheduleForm.register('scheduled_date')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resched-slot">New time slot (PHT)</Label>
              <Controller
                name="time_slot"
                control={rescheduleForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="resched-slot">
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
              <Label htmlFor="resched-remarks">Remarks (optional)</Label>
              <Input
                id="resched-remarks"
                placeholder="Reason or new access note"
                {...rescheduleForm.register('remarks')}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRescheduleTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>Save New Schedule</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
