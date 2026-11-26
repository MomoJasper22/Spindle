'use client'

import * as React from 'react'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  CalendarClock,
  CreditCard,
  Loader2,
  MapPin,
  Plus,
  Search,
  UserCheck,
  Wrench,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { FormBanner } from '@/components/shared/form-banner'
import { StatusBadge } from '@/components/shared/status-badge'
import { REPAIR_PRIORITIES, REPAIR_STATUSES, SERVICE_TYPES, TIME_SLOTS } from '@/lib/constants'
import {
  formatManilaDate,
  formatPHP,
  getManilaTodayISO,
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

const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  pending: 'Requested',
  assigned: 'Technician Assigned',
  in_progress: 'In Progress',
  awaiting_payment: 'Ready for Payment',
  completed: 'Done',
  cancelled: 'Cancelled',
}

const CUSTOMER_PRIORITY_LABELS: Record<string, string> = {
  low: 'Flexible — anytime this week',
  normal: 'Standard — normal scheduling',
  high: 'Soon — within 1 to 2 days',
  urgent: 'Urgent — as soon as possible',
}

interface RepairsPanelProps {
  appliances: CustomerApplianceRow[]
  repairs: RepairDetailView[]
  appointments: AppointmentDetailView[]
  defaultServiceAddress: string
  defaultOpen?: boolean
  defaultApplianceId?: string
}

export function RepairsPanel({
  appliances,
  repairs,
  appointments,
  defaultServiceAddress,
  defaultOpen = false,
  defaultApplianceId,
}: RepairsPanelProps) {
  const activeAppliances = appliances.filter((a) => a.registration_status !== 'cancelled')
  const todayISO = getManilaTodayISO()

  const resolvedDefaultApplianceId =
    (defaultApplianceId && activeAppliances.some((a) => a.appliance_id === defaultApplianceId)
      ? defaultApplianceId
      : activeAppliances[0]?.appliance_id) ?? ''

  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [bookDialogOpen, setBookDialogOpen] = React.useState(
    Boolean(defaultOpen && activeAppliances.length > 0)
  )
  const [rescheduleTarget, setRescheduleTarget] = React.useState<AppointmentDetailView | null>(null)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const bookForm = useForm<RepairBookingInput>({
    resolver: zodResolver(repairBookingSchema),
    mode: 'onBlur',
    defaultValues: {
      appliance_id: resolvedDefaultApplianceId,
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
      appliance_id: resolvedDefaultApplianceId,
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
      r.appliance_brand.toLowerCase().includes(q) ||
      r.appliance_category.toLowerCase().includes(q) ||
      r.appliance_model_number.toLowerCase().includes(q) ||
      r.issue_description.toLowerCase().includes(q) ||
      `${r.technician_first_name ?? ''} ${r.technician_last_name ?? ''}`.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Bookings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Book a home visit, check repair progress, or adjust your schedule.
          </p>
        </div>

        {activeAppliances.length > 0 ? (
          <Button onClick={openBookDialog} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Book a Home Visit</span>
          </Button>
        ) : (
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/customer/appliances?add=1">
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Add an Appliance First</span>
            </Link>
          </Button>
        )}
      </div>

      {feedback && !bookDialogOpen && !rescheduleTarget && (
        <FormBanner type={feedback.type} message={feedback.message} />
      )}

      {repairs.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search appliance, problem, or technician..."
              aria-label="Search bookings"
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Filter bookings by status">
              <SelectValue placeholder="All bookings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings</SelectItem>
              {REPAIR_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {CUSTOMER_STATUS_LABELS[status] ?? status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {activeAppliances.length === 0 && repairs.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Add an appliance to book a visit"
          description="Save your aircon, fridge, or washer first so we know what unit to bring tools for."
          action={
            <Button asChild>
              <Link href="/customer/appliances?add=1">
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Add Your First Appliance</span>
              </Link>
            </Button>
          }
        />
      ) : filteredRepairs.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No bookings match your search"
          description={
            repairs.length === 0
              ? 'Book your first repair, cleaning, or checkup visit whenever you are ready.'
              : 'Try clearing your search or switching the status filter.'
          }
          action={
            repairs.length === 0 && activeAppliances.length > 0 ? (
              <Button onClick={openBookDialog}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Book a Home Visit</span>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredRepairs.map((repair) => {
            const apt = appointmentByTicket.get(repair.ticket_id)
            const totalAmount = Number(repair.final_cost_php ?? repair.estimated_cost_php ?? 0)
            const remaining = Math.max(0, totalAmount - Number(repair.verified_paid_php ?? 0))
            const canModify = ['pending', 'assigned'].includes(repair.status)
            const canReschedule =
              apt && !['completed', 'cancelled'].includes(repair.status) && !['completed', 'cancelled'].includes(apt.appointment_status)
            const serviceLabel =
              SERVICE_TYPES.find((st) => st.value === repair.service_type)?.label ?? 'Appliance Service'

            return (
              <div
                key={repair.ticket_id}
                className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-[#C8C0B0]"
              >
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{serviceLabel}</p>
                      <h2 className="mt-0.5 font-heading text-lg font-bold text-foreground">
                        {repair.appliance_brand} {repair.appliance_category}
                      </h2>
                    </div>
                    <StatusBadge status={repair.status} audience="customer" />
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {repair.issue_description}
                  </p>

                  <div className="mt-4 space-y-2 border-t border-dashed border-border pt-3 text-sm">
                    <div className="flex items-center gap-2 text-foreground">
                      <CalendarClock className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="font-medium">
                        {formatManilaDate(apt?.scheduled_date ?? repair.scheduled_date)}
                      </span>
                      {apt?.time_slot && (
                        <span className="text-muted-foreground">&middot; {apt.time_slot}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UserCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>
                        {repair.technician_first_name
                          ? `Technician: ${repair.technician_first_name} ${repair.technician_last_name}`
                          : 'Matching you with a nearby technician'}
                      </span>
                    </div>

                    {apt?.service_address && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <span className="line-clamp-1">{apt.service_address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                  <div className="text-sm">
                    <span className="text-xs text-muted-foreground">
                      {repair.final_cost_php !== null ? 'Final price' : 'Starting estimate'}
                    </span>
                    <p className="font-heading text-base font-bold tabular-nums text-foreground">
                      {totalAmount > 0 ? formatPHP(totalAmount) : 'Pending checkup'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {repair.status === 'awaiting_payment' && remaining > 0 && (
                      <Button asChild size="sm">
                        <Link href={`/customer/payments?ticket=${repair.ticket_id}`}>
                          <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Pay {formatPHP(remaining)}</span>
                        </Link>
                      </Button>
                    )}

                    {canReschedule && apt && (
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                          >
                            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Cancel</span>
                          </Button>
                        }
                        title="Cancel this booking?"
                        description={`This will cancel your scheduled visit for the ${repair.appliance_brand} ${repair.appliance_category}.`}
                        confirmLabel="Yes, Cancel Visit"
                        isPending={isPending}
                        onConfirm={() => handleCancelTicket(repair.ticket_id)}
                      />
                    )}

                    <Button asChild variant="outline" size="sm">
                      <Link href={`/customer/bookings/${repair.ticket_id}`}>
                        <span>Details</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Book Home Visit Modal */}
      <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Schedule a Home Visit</DialogTitle>
            <DialogDescription>
              Pick your appliance, describe what is happening, and choose a date and time that works for you.
            </DialogDescription>
          </DialogHeader>

          {feedback && bookDialogOpen && <FormBanner type={feedback.type} message={feedback.message} />}

          <form onSubmit={bookForm.handleSubmit(onBookSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="book-appliance">
                Which appliance needs help? <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="appliance_id"
                control={bookForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="book-appliance">
                      <SelectValue placeholder="Choose your appliance" />
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
                  What do you need? <span className="text-destructive">*</span>
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
                  How soon do you need us? <span className="text-destructive">*</span>
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
                            {CUSTOMER_PRIORITY_LABELS[p] ?? p}
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
                  Preferred time window <span className="text-destructive">*</span>
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
                What seems to be the problem? <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="book-issue"
                placeholder="For example: not cooling, making a loud sound, water leaking..."
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
                Home service address <span className="text-destructive">*</span>
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
              <Label htmlFor="book-remarks">Gate note or landmark (optional)</Label>
              <Input
                id="book-remarks"
                placeholder="e.g. Beside the blue gate, inform guard at entrance"
                {...bookForm.register('remarks')}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBookDialogOpen(false)}>
                Close
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>Confirm Home Visit</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reschedule Visit Modal */}
      <Dialog
        open={Boolean(rescheduleTarget)}
        onOpenChange={(open) => {
          if (!open) setRescheduleTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Your Visit Time</DialogTitle>
            <DialogDescription>
              Pick a new date and time window that fits your schedule.
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
              <Label htmlFor="resched-date">New date</Label>
              <Input
                id="resched-date"
                type="date"
                min={todayISO}
                {...rescheduleForm.register('scheduled_date')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resched-slot">New time window</Label>
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
              <Label htmlFor="resched-remarks">Arrival or gate note (optional)</Label>
              <Input
                id="resched-remarks"
                placeholder="Any helpful note for our technician"
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
    </div>
  )
}
