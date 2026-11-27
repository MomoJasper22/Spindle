'use client'

import * as React from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CalendarClock,
  Check,
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
  formatManilaDate,
  formatPHPhone,
  formatPHP,
  getManilaTodayISO,
  humanizeLabel,
} from '@/lib/formatters'
import { getTicketPaymentSummary } from '@/lib/payments'
import { cn } from '@/lib/utils'
import {
  recordOnsitePaymentAction,
  startTechnicianJobAction,
  updateTechnicianAppointmentAction,
  updateTechnicianRepairAction,
} from '../actions/technician-actions'
import { getTechnicianStageIndex, type TechnicianJobItem } from '../lib/job-schedule'
import {
  technicianAppointmentActionSchema,
  technicianPaymentSchema,
  technicianRepairUpdateSchema,
  type TechnicianAppointmentActionInput,
  type TechnicianPaymentInput,
  type TechnicianRepairUpdateInput,
} from '../schemas/technician-schemas'

interface DiagnosticDrawerProps {
  job: TechnicianJobItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const JOB_STEPS = [
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'awaiting_payment', label: 'Payment' },
  { key: 'completed', label: 'Done' },
] as const

const STAGE_OPTIONS = [
  { value: 'assigned', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'awaiting_payment', label: 'Awaiting Payment' },
  { value: 'completed', label: 'Completed' },
] as const

export function DiagnosticDrawer({ job, open, onOpenChange }: DiagnosticDrawerProps) {
  const [feedback, setFeedback] = React.useState<{
    ticketId: string
    type: 'error' | 'success'
    message: string
  } | null>(null)
  const [rescheduleTicketId, setRescheduleTicketId] = React.useState<string | null>(null)
  const [stageOverrideTicketId, setStageOverrideTicketId] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const ticket = job?.repair ?? null
  const appointment = job?.appointment ?? null
  const todayISO = getManilaTodayISO()
  const rescheduleExpanded = Boolean(ticket && rescheduleTicketId === ticket.ticket_id)
  const showStageOverride = Boolean(ticket && stageOverrideTicketId === ticket.ticket_id)

  const normalizedStage: TechnicianRepairUpdateInput['status'] =
    ticket?.status === 'in_progress' ||
      ticket?.status === 'awaiting_payment' ||
      ticket?.status === 'completed'
      ? ticket.status
      : 'assigned'

  const repairForm = useForm<TechnicianRepairUpdateInput>({
    resolver: zodResolver(technicianRepairUpdateSchema),
    mode: 'onBlur',
    defaultValues: {
      ticket_id: ticket?.ticket_id ?? '',
      status: normalizedStage,
      diagnostic_notes: ticket?.diagnostic_notes ?? '',
      estimated_cost_php: Number(ticket?.estimated_cost_php ?? 0),
      final_cost_php:
        ticket?.final_cost_php !== null && ticket?.final_cost_php !== undefined
          ? Number(ticket.final_cost_php)
          : null,
    },
  })

  const initialSummary = ticket ? getTicketPaymentSummary(ticket) : null
  const initialBalance = initialSummary?.payableRemaining ?? 0

  const paymentForm = useForm<TechnicianPaymentInput>({
    resolver: zodResolver(technicianPaymentSchema),
    mode: 'onBlur',
    defaultValues: {
      ticket_id: ticket?.ticket_id ?? '',
      payment_method: 'Cash',
      amount_php: initialBalance,
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
      scheduled_date: job?.scheduledDate ?? todayISO,
      time_slot: job?.timeSlot ?? TIME_SLOTS[0],
      remarks: job?.arrivalRemarks ?? '',
    },
  })

  const selectedMethod = useWatch({ control: paymentForm.control, name: 'payment_method' })
  const watchedFinalCost = useWatch({ control: repairForm.control, name: 'final_cost_php' })

  React.useEffect(() => {
    if (!job || !ticket) return

    const nextStage: TechnicianRepairUpdateInput['status'] =
      ticket.status === 'in_progress' ||
        ticket.status === 'awaiting_payment' ||
        ticket.status === 'completed'
        ? ticket.status
        : 'assigned'
    const nextSummary = getTicketPaymentSummary(ticket)
    const nextBalance = nextSummary.payableRemaining

    repairForm.reset({
      ticket_id: ticket.ticket_id,
      status: nextStage,
      diagnostic_notes: ticket.diagnostic_notes ?? '',
      estimated_cost_php: Number(ticket.estimated_cost_php ?? 0),
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

    rescheduleForm.reset({
      appointment_id: appointment?.appointment_id ?? '',
      appointment_status: 'rescheduled',
      scheduled_date: job.scheduledDate,
      time_slot: job.timeSlot ?? TIME_SLOTS[0],
      remarks: job.arrivalRemarks ?? '',
    })
  }, [
    open,
    ticket,
    appointment?.appointment_id,
    job,
    repairForm,
    paymentForm,
    rescheduleForm,
  ])

  function submitRepairWithStatus(nextStatus: TechnicianRepairUpdateInput['status']) {
    if (!ticket) return
    repairForm.setValue('status', nextStatus, { shouldValidate: true })
    void repairForm.handleSubmit((values) => {
      setFeedback(null)
      startTransition(async () => {
        const result = await updateTechnicianRepairAction({
          ...values,
          status: nextStatus,
        })
        if (result.success) {
          setStageOverrideTicketId(null)
          setFeedback({ ticketId: values.ticket_id, type: 'success', message: result.message })
        } else {
          setFeedback({ ticketId: values.ticket_id, type: 'error', message: result.error })
        }
      })
    })()
  }

  function onRepairSubmit(values: TechnicianRepairUpdateInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await updateTechnicianRepairAction(values)
      if (result.success) {
        setStageOverrideTicketId(null)
        setFeedback({ ticketId: values.ticket_id, type: 'success', message: result.message })
      } else {
        setFeedback({ ticketId: values.ticket_id, type: 'error', message: result.error })
      }
    })
  }

  function handleStartJob() {
    if (!ticket) return
    setFeedback(null)
    startTransition(async () => {
      const result = await startTechnicianJobAction(ticket.ticket_id)
      if (result.success) {
        setFeedback({ ticketId: ticket.ticket_id, type: 'success', message: result.message })
      } else {
        setFeedback({ ticketId: ticket.ticket_id, type: 'error', message: result.error })
      }
    })
  }

  function handleConfirmVisitSlot() {
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
    setFeedback(null)
    startTransition(async () => {
      const result = await recordOnsitePaymentAction(values)
      if (result.success) {
        setFeedback({ ticketId: values.ticket_id, type: 'success', message: result.message })
        paymentForm.setValue('reference_no', '')
        paymentForm.setValue('remarks', '')
      } else {
        setFeedback({ ticketId: values.ticket_id, type: 'error', message: result.error })
      }
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setFeedback(null)
      setRescheduleTicketId(null)
      setStageOverrideTicketId(null)
    }
    onOpenChange(nextOpen)
  }

  if (!job || !ticket) return null

  const paymentSummary = getTicketPaymentSummary(ticket)
  const visibleFeedback = feedback && feedback.ticketId === ticket.ticket_id ? feedback : null
  const activeStepIndex = getTechnicianStageIndex(ticket.status)
  const isScheduledStage = ['pending', 'confirmed', 'assigned'].includes(ticket.status)
  const isInProgressStage = ticket.status === 'in_progress'
  const isAwaitingPaymentStage = ticket.status === 'awaiting_payment'
  const isFinished = ticket.status === 'completed' || ticket.status === 'cancelled'

  const draftFinalCost =
    watchedFinalCost !== null && watchedFinalCost !== undefined && !Number.isNaN(watchedFinalCost)
      ? Number(watchedFinalCost)
      : null
  const willAutoCompleteOnBill =
    draftFinalCost !== null &&
    draftFinalCost > 0 &&
    paymentSummary.verifiedPaid >= draftFinalCost

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[min(38rem,96dvw)] space-y-5">
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

        {/* Visual Job Flow Strip */}
        {ticket.status !== 'cancelled' && (
          <ol
            aria-label="Job progress steps"
            className="grid grid-cols-4 gap-1.5 rounded-xl border border-border bg-muted/40 p-2.5"
          >
            {JOB_STEPS.map((step, index) => {
              const isDone = index < activeStepIndex || ticket.status === 'completed'
              const isCurrent = index === activeStepIndex && ticket.status !== 'completed'
              return (
                <li key={step.key} className="flex flex-col items-center text-center gap-1">
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold',
                      isDone && 'border-primary bg-primary text-primary-foreground',
                      isCurrent && 'border-[#D97706] bg-amber-50 text-[#B45309]',
                      !isDone && !isCurrent && 'border-border bg-card text-muted-foreground'
                    )}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-semibold leading-tight',
                      isDone || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                </li>
              )
            })}
          </ol>
        )}

        {/* Unified Visit Schedule & Customer Context */}
        <div className="rounded-xl border border-border bg-slate-50/90 p-4 space-y-3 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-0.5">
              <p className="font-semibold text-foreground">
                {ticket.customer_first_name} {ticket.customer_last_name}
              </p>
              {ticket.customer_phone && (
                <a
                  href={`tel:${ticket.customer_phone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{formatPHPhone(ticket.customer_phone)}</span>
                </a>
              )}
            </div>

            <div className="text-right">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <CalendarClock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>{formatManilaDate(job.scheduledDate)}</span>
              </p>
              {job.timeSlot && (
                <p className="text-xs font-medium text-primary">{job.timeSlot} (PHT)</p>
              )}
            </div>
          </div>

          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span>{job.serviceAddress}</span>
          </p>

          <p className="rounded-lg border border-border/80 bg-card px-3 py-2 text-xs text-foreground">
            <span className="font-semibold">Reported Issue:</span> {ticket.issue_description}
          </p>

          {job.arrivalRemarks && (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Arrival / Visit Note:</span>{' '}
              {job.arrivalRemarks}
            </p>
          )}

          {/* Inline Visit Actions (Confirm / Reschedule) */}
          {appointment && job.isActive && (
            <div className="space-y-3 border-t border-dashed border-border pt-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Visit slot:</span>
                  <StatusBadge status={appointment.appointment_status} />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {job.needsVisitConfirmation && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={handleConfirmVisitSlot}
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
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{rescheduleExpanded ? 'Hide Schedule' : 'Reschedule'}</span>
                  </Button>
                </div>
              </div>

              {rescheduleExpanded && (
                <form
                  onSubmit={rescheduleForm.handleSubmit(onRescheduleSubmit)}
                  className="space-y-3 rounded-lg border border-border bg-card p-3"
                  noValidate
                >
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="drawer-resched-date" className="text-xs">
                        New Date
                      </Label>
                      <Input
                        id="drawer-resched-date"
                        type="date"
                        min={todayISO}
                        {...rescheduleForm.register('scheduled_date')}
                      />
                      {rescheduleForm.formState.errors.scheduled_date && (
                        <p role="alert" className="text-xs text-destructive">
                          {rescheduleForm.formState.errors.scheduled_date.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="drawer-resched-slot" className="text-xs">
                        Time Slot (PHT)
                      </Label>
                      <Controller
                        name="time_slot"
                        control={rescheduleForm.control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="drawer-resched-slot">
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
                    <Label htmlFor="drawer-resched-remarks" className="text-xs">
                      Reason / Arrival Notes
                    </Label>
                    <Input
                      id="drawer-resched-remarks"
                      placeholder="e.g. Customer requested afternoon window"
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
                      <span>Save Schedule</span>
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* One-Click Primary Next Step */}
        {isScheduledStage && (
          <div className="flex flex-col gap-2.5 rounded-xl border border-teal-200 bg-primary-tint/50 p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">Ready to start this visit?</p>
              <p className="text-xs text-muted-foreground">
                Starting the job confirms your visit slot automatically and moves to repair mode.
              </p>
            </div>
            <Button
              type="button"
              disabled={isPending}
              onClick={handleStartJob}
              className="shrink-0"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4" aria-hidden="true" />
              )}
              <span>Start Job</span>
            </Button>
          </div>
        )}

        {/* Diagnostics, Pricing & Progress Form */}
        <form onSubmit={repairForm.handleSubmit(onRepairSubmit)} className="space-y-4" noValidate>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Wrench className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Diagnostics &amp; Final Bill</span>
            </div>
            {ticket.status !== 'cancelled' && (
              <button
                type="button"
                onClick={() =>
                  setStageOverrideTicketId((prev) =>
                    prev === ticket.ticket_id ? null : ticket.ticket_id
                  )
                }
                className="text-xs font-medium text-primary hover:underline"
              >
                {showStageOverride ? 'Hide stage selector' : 'Adjust stage'}
              </button>
            )}
          </div>

          {showStageOverride && (
            <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-3">
              <Label htmlFor="diag-status">Repair Stage</Label>
              <Controller
                name="status"
                control={repairForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="diag-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGE_OPTIONS.map((st) => (
                        <SelectItem key={st.value} value={st.value}>
                          {st.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="diag-notes">Diagnostic &amp; Repair Notes</Label>
            <Textarea
              id="diag-notes"
              rows={3}
              disabled={ticket.status === 'cancelled'}
              placeholder="Document fault findings, parts replaced, capacitor/compressor checks, cleaning performed..."
              {...repairForm.register('diagnostic_notes')}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="diag-est-cost">Estimated Cost (PHP)</Label>
              <Input
                id="diag-est-cost"
                type="number"
                step="0.01"
                min="0"
                disabled={ticket.status === 'cancelled'}
                {...repairForm.register('estimated_cost_php', { valueAsNumber: true })}
              />
              {repairForm.formState.errors.estimated_cost_php && (
                <p role="alert" className="text-xs text-destructive">
                  {repairForm.formState.errors.estimated_cost_php.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="diag-final-cost">Final Agreed Cost (PHP)</Label>
              <Input
                id="diag-final-cost"
                type="number"
                step="0.01"
                min="0"
                disabled={ticket.status === 'cancelled'}
                placeholder="Enter once work is scoped"
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
          </div>

          {ticket.status !== 'cancelled' && (
            <div className="flex flex-col gap-2 sm:flex-row">
              {showStageOverride ? (
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>Save Changes</span>
                </Button>
              ) : isInProgressStage ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => submitRepairWithStatus('in_progress')}
                    className="sm:flex-1"
                  >
                    <Save className="h-4 w-4" aria-hidden="true" />
                    <span>Save Progress</span>
                  </Button>
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={() => submitRepairWithStatus('awaiting_payment')}
                    className="sm:flex-1"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>
                      {willAutoCompleteOnBill ? 'Save & Complete Job' : 'Finish & Request Payment'}
                    </span>
                  </Button>
                </>
              ) : isAwaitingPaymentStage ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => submitRepairWithStatus('awaiting_payment')}
                    className="sm:flex-1"
                  >
                    <Save className="h-4 w-4" aria-hidden="true" />
                    <span>Save Bill / Notes</span>
                  </Button>
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={() => submitRepairWithStatus('completed')}
                    className="sm:flex-1"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>Mark Job Completed</span>
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => submitRepairWithStatus(normalizedStage)}
                  className="w-full"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>{isFinished ? 'Save Updated Notes' : 'Save Notes & Estimate'}</span>
                </Button>
              )}
            </div>
          )}
        </form>

        <Separator />

        {/* On-Site Payment Recording */}
        <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4" noValidate>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CreditCard className="h-4 w-4 text-secondary" aria-hidden="true" />
              <span>On-Site Payment</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground tabular-nums">
              <span>
                Paid: <strong className="text-emerald-700">{formatPHP(paymentSummary.verifiedPaid)}</strong>
              </span>
              {paymentSummary.pendingPaid > 0 && (
                <span>
                  Pending:{' '}
                  <strong className="text-amber-700">{formatPHP(paymentSummary.pendingPaid)}</strong>
                </span>
              )}
              {paymentSummary.hasFinalBill && (
                <span>
                  Balance:{' '}
                  <strong className="text-foreground">{formatPHP(paymentSummary.payableRemaining)}</strong>
                </span>
              )}
            </div>
          </div>

          {!paymentSummary.canRecordFieldPayment ? (
            <p className="rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
              {paymentSummary.isSettled || ticket.status === 'completed'
                ? 'This job is settled in full. No further field collection is needed.'
                : paymentSummary.isCoveredByPending
                  ? 'Recorded payment already covers the full final cost and is awaiting admin verification.'
                  : 'Payments cannot be recorded on cancelled tickets.'}
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="tech-pay-method">Method</Label>
                  <Controller
                    name="payment_method"
                    control={paymentForm.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="tech-pay-method">
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
                  <Label htmlFor="tech-pay-amount">Amount Collected (PHP)</Label>
                  <Input
                    id="tech-pay-amount"
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

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="tech-pay-ref">
                    Reference No. {selectedMethod !== 'Cash' && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="tech-pay-ref"
                    placeholder={selectedMethod === 'Cash' ? 'Optional receipt #' : 'GCash / Maya / QR ref #'}
                    {...paymentForm.register('reference_no')}
                  />
                  {paymentForm.formState.errors.reference_no && (
                    <p role="alert" className="text-xs text-destructive">
                      {paymentForm.formState.errors.reference_no.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tech-pay-remarks">Collection Note</Label>
                  <Input
                    id="tech-pay-remarks"
                    placeholder="Collected on-site from customer"
                    {...paymentForm.register('remarks')}
                  />
                </div>
              </div>

              <Button type="submit" variant="secondary" disabled={isPending} className="w-full">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>Record Field Payment</span>
              </Button>
            </>
          )}
        </form>
      </SheetContent>
    </Sheet>
  )
}
