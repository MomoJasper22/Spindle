'use client'

import * as React from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  Phone,
  Play,
  Save,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { FormBanner } from '@/components/shared/form-banner'
import { StatusBadge } from '@/components/shared/status-badge'
import { PAYMENT_METHODS, TIME_SLOTS } from '@/lib/constants'
import {
  formatAddress,
  formatManilaDate,
  formatPHPhone,
  formatPHP,
  getManilaTodayISO,
  humanizeLabel,
} from '@/lib/formatters'
import { cn } from '@/lib/utils'
import {
  recordOnsitePaymentAction,
  updateTechnicianAppointmentAction,
  updateTechnicianRepairAction,
} from '../actions/technician-actions'
import type { TechnicianJobItem } from '../lib/technician-jobs'
import {
  technicianAppointmentActionSchema,
  technicianPaymentSchema,
  technicianRepairUpdateSchema,
  type TechnicianAppointmentActionInput,
  type TechnicianPaymentInput,
  type TechnicianRepairUpdateInput,
} from '../schemas/technician-schemas'

interface JobWorkbenchDrawerProps {
  job: TechnicianJobItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TECH_WORKFLOW_STATUSES: ReadonlyArray<{
  value: TechnicianRepairUpdateInput['status']
  label: string
}> = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'awaiting_payment', label: 'Awaiting Pay' },
  { value: 'completed', label: 'Completed' },
]

function normalizeTechStatus(status: string): TechnicianRepairUpdateInput['status'] {
  if (
    status === 'assigned' ||
    status === 'in_progress' ||
    status === 'awaiting_payment' ||
    status === 'completed'
  ) {
    return status
  }
  return 'assigned'
}

function roundPhp(value: number): number {
  return Math.round(value * 100) / 100
}

export function JobWorkbenchDrawer({ job, open, onOpenChange }: JobWorkbenchDrawerProps) {
  const [feedback, setFeedback] = React.useState<{
    ticketId: string
    type: 'error' | 'success'
    message: string
  } | null>(null)
  const [rescheduleTicketId, setRescheduleTicketId] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const ticket = job?.ticket ?? null
  const appointment = job?.appointment ?? null
  const payments = job?.payments ?? []
  const rescheduleOpen = Boolean(ticket && rescheduleTicketId === ticket.ticket_id)
  const todayISO = getManilaTodayISO()

  const repairForm = useForm<TechnicianRepairUpdateInput>({
    resolver: zodResolver(technicianRepairUpdateSchema),
    mode: 'onBlur',
    defaultValues: {
      ticket_id: ticket?.ticket_id ?? '',
      status: ticket ? normalizeTechStatus(ticket.status) : 'assigned',
      diagnostic_notes: ticket?.diagnostic_notes ?? '',
      final_cost_php:
        ticket?.final_cost_php !== null && ticket?.final_cost_php !== undefined
          ? Number(ticket.final_cost_php)
          : null,
    },
  })

  const paymentForm = useForm<TechnicianPaymentInput>({
    resolver: zodResolver(technicianPaymentSchema),
    mode: 'onBlur',
    defaultValues: {
      ticket_id: ticket?.ticket_id ?? '',
      payment_method: 'Cash',
      amount_php: job?.paymentSummary.hasFinalBill ? job.paymentSummary.payableRemaining : 0,
      installment_no: null,
      reference_no: '',
      remarks: '',
    },
  })

  const rescheduleForm = useForm<TechnicianAppointmentActionInput>({
    resolver: zodResolver(technicianAppointmentActionSchema),
    mode: 'onBlur',
    defaultValues: {
      appointment_id: appointment?.appointment_id ?? '',
      appointment_status: 'rescheduled',
      scheduled_date: appointment?.scheduled_date ?? todayISO,
      time_slot: appointment?.time_slot ?? TIME_SLOTS[0],
      remarks: appointment?.remarks ?? '',
    },
  })

  const selectedMethod = useWatch({ control: paymentForm.control, name: 'payment_method' })
  const watchedFinalCost = useWatch({ control: repairForm.control, name: 'final_cost_php' })
  const watchedStatus = useWatch({ control: repairForm.control, name: 'status' })

  React.useEffect(() => {
    if (!job || !ticket) return
    const nextBalance = job.paymentSummary.hasFinalBill ? job.paymentSummary.payableRemaining : 0

    repairForm.reset({
      ticket_id: ticket.ticket_id,
      status: normalizeTechStatus(ticket.status),
      diagnostic_notes: ticket.diagnostic_notes ?? '',
      final_cost_php:
        ticket.final_cost_php !== null && ticket.final_cost_php !== undefined
          ? Number(ticket.final_cost_php)
          : null,
    })

    paymentForm.reset({
      ticket_id: ticket.ticket_id,
      payment_method: 'Cash',
      amount_php: nextBalance,
      installment_no: null,
      reference_no: '',
      remarks: '',
    })

    if (appointment) {
      rescheduleForm.reset({
        appointment_id: appointment.appointment_id,
        appointment_status: 'rescheduled',
        scheduled_date: appointment.scheduled_date,
        time_slot: appointment.time_slot,
        remarks: appointment.remarks ?? '',
      })
    }
  }, [job, ticket, appointment, open, repairForm, paymentForm, rescheduleForm])

  React.useEffect(() => {
    if (selectedMethod === 'Cash') {
      paymentForm.setValue('reference_no', '', { shouldValidate: false })
      paymentForm.clearErrors('reference_no')
    }
  }, [selectedMethod, paymentForm])

  function submitRepairUpdate(values: TechnicianRepairUpdateInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await updateTechnicianRepairAction(values)
      if (result.success) {
        setFeedback({ ticketId: values.ticket_id, type: 'success', message: result.message })
      } else {
        setFeedback({ ticketId: values.ticket_id, type: 'error', message: result.error })
      }
    })
  }

  function handleQuickStage(nextStatus: TechnicianRepairUpdateInput['status']) {
    if (!ticket) return
    repairForm.setValue('status', nextStatus, { shouldDirty: true })
    repairForm.handleSubmit((values) => {
      submitRepairUpdate({ ...values, status: nextStatus })
    })()
  }

  function handleConfirmAppointment() {
    if (!appointment || !ticket) return
    setFeedback(null)
    startTransition(async () => {
      const result = await updateTechnicianAppointmentAction({
        appointment_id: appointment.appointment_id,
        appointment_status: 'confirmed',
        scheduled_date: appointment.scheduled_date,
        time_slot: appointment.time_slot,
        remarks: appointment.remarks ?? '',
      })
      if (result.success) {
        setFeedback({ ticketId: ticket.ticket_id, type: 'success', message: result.message })
      } else {
        setFeedback({ ticketId: ticket.ticket_id, type: 'error', message: result.error })
      }
    })
  }

  function onRescheduleSubmit(values: TechnicianAppointmentActionInput) {
    if (!ticket) return
    setFeedback(null)
    startTransition(async () => {
      const result = await updateTechnicianAppointmentAction({
        ...values,
        appointment_status: 'rescheduled',
      })
      if (result.success) {
        setRescheduleTicketId(null)
        setFeedback({ ticketId: ticket.ticket_id, type: 'success', message: result.message })
      } else {
        setFeedback({ ticketId: ticket.ticket_id, type: 'error', message: result.error })
      }
    })
  }

  function onPaymentSubmit(values: TechnicianPaymentInput) {
    if (!ticket) return
    setFeedback(null)
    startTransition(async () => {
      // Save unsaved diagnostic/final-price changes first so balance checks match the technician's input
      if (repairForm.formState.isDirty) {
        const repairValid = await repairForm.trigger()
        if (!repairValid) {
          setFeedback({
            ticketId: ticket.ticket_id,
            type: 'error',
            message: 'Fix the diagnostic or final price fields above before recording payment.',
          })
          return
        }
        const repairValues = repairForm.getValues()
        const repairSaveResult = await updateTechnicianRepairAction(repairValues)
        if (!repairSaveResult.success) {
          setFeedback({
            ticketId: ticket.ticket_id,
            type: 'error',
            message: repairSaveResult.error,
          })
          return
        }
      }

      const result = await recordOnsitePaymentAction({
        ...values,
        installment_no: null,
        reference_no: values.payment_method === 'Cash' ? '' : values.reference_no,
      })

      if (result.success) {
        setFeedback({ ticketId: ticket.ticket_id, type: 'success', message: result.message })
        paymentForm.setValue('reference_no', '')
        paymentForm.setValue('remarks', '')
      } else {
        setFeedback({ ticketId: ticket.ticket_id, type: 'error', message: result.error })
      }
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setFeedback(null)
      setRescheduleTicketId(null)
    }
    onOpenChange(nextOpen)
  }

  if (!job || !ticket) return null

  const visibleFeedback = feedback && feedback.ticketId === ticket.ticket_id ? feedback : null
  const customerAddress =
    appointment?.service_address ||
    formatAddress({
      street: ticket.customer_address_street,
      barangay: ticket.customer_address_barangay,
      city: ticket.customer_address_city,
      province: ticket.customer_address_province,
      zip: ticket.customer_address_zip_code,
    })

  const formattedPhone = formatPHPhone(ticket.customer_phone)
  const verifiedPaid = job.paymentSummary.verifiedPaid
  const pendingPaid = job.paymentSummary.pendingPaid
  const effectiveFinalCost =
    typeof watchedFinalCost === 'number' && !Number.isNaN(watchedFinalCost)
      ? watchedFinalCost
      : ticket.final_cost_php !== null
        ? Number(ticket.final_cost_php)
        : null
  const liveBalance =
    effectiveFinalCost !== null
      ? roundPhp(Math.max(0, effectiveFinalCost - verifiedPaid - pendingPaid))
      : null

  const isAppointmentActive =
    Boolean(appointment) && !['completed', 'cancelled'].includes(appointment?.appointment_status ?? '')
  const canConfirmSlot =
    isAppointmentActive &&
    ['requested', 'rescheduled'].includes(appointment?.appointment_status ?? '')

  const canRecordPaymentWithDraft =
    ticket.status !== 'cancelled' &&
    ticket.status !== 'completed' &&
    (liveBalance !== null ? liveBalance > 0 : job.paymentSummary.canRecordFieldPayment)

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[min(36rem,96dvw)] space-y-5">
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-primary">{ticket.ticket_id}</span>
            <StatusBadge status={ticket.status} />
            {(ticket.priority === 'high' || ticket.priority === 'urgent') && (
              <StatusBadge status={ticket.priority} showIcon={false} />
            )}
          </div>
          <SheetTitle>
            {ticket.appliance_brand} {ticket.appliance_category}
          </SheetTitle>
          <SheetDescription>
            {humanizeLabel(ticket.service_type)} &middot; Model {ticket.appliance_model_number} &middot;{' '}
            <span className="font-mono">{ticket.appliance_serial_number}</span>
          </SheetDescription>
        </SheetHeader>

        {visibleFeedback && <FormBanner type={visibleFeedback.type} message={visibleFeedback.message} />}

        {/* Customer & Issue Context */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2.5 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-foreground">
              {ticket.customer_first_name} {ticket.customer_last_name}
            </span>
            {ticket.customer_phone && (
              <a
                href={`tel:${ticket.customer_phone.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary-tint/50"
              >
                <Phone className="h-3 w-3" aria-hidden="true" />
                <span>{formattedPhone}</span>
              </a>
            )}
          </div>

          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span>{customerAddress}</span>
          </p>

          <p className="border-t border-dashed border-border pt-2 text-xs text-foreground leading-relaxed">
            <span className="font-semibold text-muted-foreground">Issue: </span>
            {ticket.issue_description}
          </p>

          {appointment?.remarks && (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Gate / Arrival Note: </span>
              {appointment.remarks}
            </p>
          )}
        </div>

        {/* Visit Schedule & Inline Reschedule */}
        {appointment && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {formatManilaDate(appointment.scheduled_date)} &middot; {appointment.time_slot}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Home visit window</p>
                </div>
              </div>
              <StatusBadge status={appointment.appointment_status} />
            </div>

            {isAppointmentActive && (
              <div className="flex flex-wrap gap-2">
                {canConfirmSlot && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={handleConfirmAppointment}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Confirm Slot</span>
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() =>
                    setRescheduleTicketId((prev) =>
                      prev === ticket.ticket_id ? null : ticket.ticket_id
                    )
                  }
                >
                  <span>{rescheduleOpen ? 'Close Reschedule' : 'Reschedule Visit'}</span>
                </Button>
              </div>
            )}

            {rescheduleOpen && isAppointmentActive && (
              <form
                onSubmit={rescheduleForm.handleSubmit(onRescheduleSubmit)}
                className="space-y-3 border-t border-border pt-3"
                noValidate
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="wb-resched-date">New Date</Label>
                    <Input
                      id="wb-resched-date"
                      type="date"
                      min={todayISO}
                      {...rescheduleForm.register('scheduled_date')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="wb-resched-slot">Time Window</Label>
                    <Controller
                      name="time_slot"
                      control={rescheduleForm.control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="wb-resched-slot">
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
                <div className="space-y-1">
                  <Label htmlFor="wb-resched-remarks">Reason / Note</Label>
                  <Input
                    id="wb-resched-remarks"
                    placeholder="e.g. Customer requested afternoon slot"
                    {...rescheduleForm.register('remarks')}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setRescheduleTicketId(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isPending}>
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                    <span>Save New Window</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Work Progress & Diagnostics */}
        <form onSubmit={repairForm.handleSubmit(submitRepairUpdate)} className="space-y-4" noValidate>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Wrench className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Work &amp; Diagnostics</span>
            </div>

            {ticket.estimated_cost_php > 0 && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                Est. {formatPHP(ticket.estimated_cost_php)}
              </span>
            )}
          </div>

          {/* One-Tap Contextual Progression */}
          {(ticket.status === 'confirmed' || ticket.status === 'assigned') && (
            <Button
              type="button"
              disabled={isPending}
              onClick={() => handleQuickStage('in_progress')}
              className="w-full"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4" aria-hidden="true" />
              )}
              <span>Start Job Now</span>
            </Button>
          )}

          {ticket.status === 'in_progress' && (
            <Button
              type="button"
              disabled={isPending}
              onClick={() => handleQuickStage('awaiting_payment')}
              className="w-full"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
              <span>Finish Repair &amp; Set Final Bill</span>
            </Button>
          )}

          {ticket.status === 'awaiting_payment' && job.paymentSummary.isSettled && (
            <Button
              type="button"
              disabled={isPending}
              onClick={() => handleQuickStage('completed')}
              className="w-full"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
              <span>Mark Completed</span>
            </Button>
          )}

          <div className="space-y-1.5">
            <Label>Stage</Label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {TECH_WORKFLOW_STATUSES.map((opt) => {
                const active = watchedStatus === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => repairForm.setValue('status', opt.value, { shouldDirty: true })}
                    className={cn(
                      'rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wb-final-cost">Final Price (PHP)</Label>
            <Input
              id="wb-final-cost"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter final agreed price after checkup"
              {...repairForm.register('final_cost_php', {
                setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
              })}
            />
            {repairForm.formState.errors.final_cost_php && (
              <p role="alert" className="text-xs text-destructive">
                {repairForm.formState.errors.final_cost_php.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wb-diag-notes">Diagnostic &amp; Repair Notes</Label>
            <Textarea
              id="wb-diag-notes"
              rows={3}
              placeholder="Fault found, parts checked or replaced, work completed..."
              {...repairForm.register('diagnostic_notes')}
            />
          </div>

          <Button type="submit" variant="outline" disabled={isPending} className="w-full">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            <span>Save Notes &amp; Price</span>
          </Button>
        </form>

        <Separator />

        {/* Billing Summary, Payment History & Field Collection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Billing &amp; Field Collection</span>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/20 p-3 text-center text-xs tabular-nums">
            <div>
              <p className="text-muted-foreground">Final Price</p>
              <p className="mt-0.5 font-semibold text-foreground">
                {effectiveFinalCost !== null ? formatPHP(effectiveFinalCost) : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Paid</p>
              <p className="mt-0.5 font-semibold text-emerald-700">
                {formatPHP(verifiedPaid)}
              </p>
              {pendingPaid > 0 && (
                <p className="text-[10px] text-amber-700">+{formatPHP(pendingPaid)} pending</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Balance Due</p>
              <p className="mt-0.5 font-semibold text-foreground">
                {liveBalance !== null ? formatPHP(liveBalance) : '—'}
              </p>
            </div>
          </div>

          {payments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Payment History</p>
              <ul className="divide-y divide-dashed divide-border rounded-xl border border-border bg-card px-3">
                {payments.map((pay) => (
                  <li key={pay.payment_id} className="flex items-center justify-between gap-2 py-2.5 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold tabular-nums text-foreground">
                        {formatPHP(pay.amount_php)} &middot; {pay.payment_method}
                      </p>
                      <p className="text-muted-foreground truncate">
                        {formatManilaDate(pay.payment_date)}
                        {pay.reference_no ? ` · ${pay.reference_no}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={pay.payment_status} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!canRecordPaymentWithDraft ? (
            <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              {job.paymentSummary.isSettled || ticket.status === 'completed'
                ? 'This ticket is settled in full. No further collection is needed.'
                : job.paymentSummary.isCoveredByPending || liveBalance === 0
                  ? 'Recorded payments already cover this bill and are awaiting admin verification.'
                  : 'Payments cannot be recorded on cancelled tickets.'}
            </p>
          ) : (
            <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-3" noValidate>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="wb-pay-method">Payment Method</Label>
                  <Controller
                    name="payment_method"
                    control={paymentForm.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="wb-pay-method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="wb-pay-amount">Amount Collected (PHP)</Label>
                    {liveBalance !== null && liveBalance > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          paymentForm.setValue('amount_php', liveBalance, { shouldValidate: true })
                        }
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Fill {formatPHP(liveBalance)}
                      </button>
                    )}
                  </div>
                  <Input
                    id="wb-pay-amount"
                    type="number"
                    step="0.01"
                    min="1"
                    {...paymentForm.register('amount_php', { valueAsNumber: true })}
                  />
                  {paymentForm.formState.errors.amount_php && (
                    <p role="alert" className="text-xs text-destructive">
                      {paymentForm.formState.errors.amount_php.message}
                    </p>
                  )}
                </div>
              </div>

              {selectedMethod !== 'Cash' && (
                <div className="space-y-1.5">
                  <Label htmlFor="wb-pay-ref">
                    Reference No. <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="wb-pay-ref"
                    placeholder="GCash / Maya / QR Ph / Bank reference #"
                    {...paymentForm.register('reference_no')}
                  />
                  {paymentForm.formState.errors.reference_no && (
                    <p role="alert" className="text-xs text-destructive">
                      {paymentForm.formState.errors.reference_no.message}
                    </p>
                  )}
                </div>
              )}

              <Button type="submit" variant="secondary" disabled={isPending} className="w-full">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>Record On-Site Payment</span>
              </Button>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { JobWorkbenchDrawer as DiagnosticDrawer }
