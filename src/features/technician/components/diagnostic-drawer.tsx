'use client'

import * as React from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  Lock,
  MapPin,
  Phone,
  Play,
  Receipt,
  RefreshCw,
  Save,
  ShieldCheck,
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
  createTechnicianPayMongoCheckoutAction,
  recordOnsitePaymentAction,
  updateTechnicianAppointmentAction,
  updateTechnicianRepairAction,
  verifyTechnicianPayMongoCheckoutAction,
} from '../actions/technician-actions'
import type { TechnicianJobItem } from '../lib/technician-jobs'
import {
  technicianAppointmentActionSchema,
  technicianPayMongoCheckoutSchema,
  technicianPaymentSchema,
  technicianRepairUpdateSchema,
  type TechnicianAppointmentActionInput,
  type TechnicianPayMongoCheckoutInput,
  type TechnicianPaymentInput,
  type TechnicianRepairUpdateInput,
} from '../schemas/technician-schemas'

export type WorkbenchSectionTab = 'work' | 'billing' | 'collect'

interface JobWorkbenchDrawerProps {
  job: TechnicianJobItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSection?: WorkbenchSectionTab
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

export function JobWorkbenchDrawer({
  job,
  open,
  onOpenChange,
  initialSection = 'work',
}: JobWorkbenchDrawerProps) {
  const [tabOverride, setTabOverride] = React.useState<{
    key: string
    tab: WorkbenchSectionTab
  } | null>(null)
  const [feedback, setFeedback] = React.useState<{
    ticketId: string
    type: 'error' | 'success'
    message: string
  } | null>(null)
  const [rescheduleTicketId, setRescheduleTicketId] = React.useState<string | null>(null)
  const [activeCheckout, setActiveCheckout] = React.useState<{
    ticketId: string
    checkoutUrl: string
    sessionId: string
    amountPhp: number
  } | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const ticket = job?.ticket ?? null
  const appointment = job?.appointment ?? null
  const payments = job?.payments ?? []
  const todayISO = getManilaTodayISO()
  const rescheduleOpen = Boolean(ticket && rescheduleTicketId === ticket.ticket_id)
  const tabKey = `${ticket?.ticket_id ?? ''}:${initialSection}`
  const activeTab = tabOverride?.key === tabKey ? tabOverride.tab : initialSection
  const setActiveTab = React.useCallback(
    (tab: WorkbenchSectionTab) => setTabOverride({ key: tabKey, tab }),
    [tabKey]
  )

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

  const paymongoForm = useForm<TechnicianPayMongoCheckoutInput>({
    resolver: zodResolver(technicianPayMongoCheckoutSchema),
    mode: 'onBlur',
    defaultValues: {
      ticket_id: ticket?.ticket_id ?? '',
      amount_php: job?.paymentSummary.hasFinalBill ? job.paymentSummary.payableRemaining : 0,
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

    paymongoForm.reset({
      ticket_id: ticket.ticket_id,
      amount_php: nextBalance,
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
  }, [job, ticket, appointment, open, repairForm, paymentForm, paymongoForm, rescheduleForm])

  React.useEffect(() => {
    if (selectedMethod === 'Cash') {
      paymentForm.setValue('reference_no', '', { shouldValidate: false })
      paymentForm.clearErrors('reference_no')
    }
  }, [selectedMethod, paymentForm])

  function submitRepairUpdate(
    values: TechnicianRepairUpdateInput,
    options?: { nextTab?: WorkbenchSectionTab }
  ) {
    setFeedback(null)
    startTransition(async () => {
      const result = await updateTechnicianRepairAction(values)
      if (result.success) {
        setFeedback({ ticketId: values.ticket_id, type: 'success', message: result.message })
        if (options?.nextTab) {
          setActiveTab(options.nextTab)
        }
      } else {
        setFeedback({ ticketId: values.ticket_id, type: 'error', message: result.error })
      }
    })
  }

  function handleQuickStage(
    nextStatus: TechnicianRepairUpdateInput['status'],
    nextTab?: WorkbenchSectionTab
  ) {
    if (!ticket) return
    repairForm.setValue('status', nextStatus, { shouldDirty: true })
    repairForm.handleSubmit((values) => {
      submitRepairUpdate({ ...values, status: nextStatus }, { nextTab })
    })()
  }

  function handleSaveFinalBill(values: TechnicianRepairUpdateInput) {
    if (values.final_cost_php === null || values.final_cost_php <= 0) {
      repairForm.setError('final_cost_php', {
        type: 'manual',
        message: 'Enter a final service price greater than PHP 0.00.',
      })
      return
    }
    const nextStatus =
      values.status === 'assigned' || values.status === 'in_progress'
        ? 'awaiting_payment'
        : values.status
    submitRepairUpdate({ ...values, status: nextStatus })
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
      setFeedback(
        result.success
          ? { ticketId: ticket.ticket_id, type: 'success', message: result.message }
          : { ticketId: ticket.ticket_id, type: 'error', message: result.error }
      )
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

  function onPayMongoSubmit(values: TechnicianPayMongoCheckoutInput) {
    if (!ticket || !job) return
    if (roundPhp(values.amount_php) > job.paymentSummary.payableRemaining) {
      paymongoForm.setError('amount_php', {
        type: 'manual',
        message: `Amount cannot exceed the remaining balance of ${formatPHP(job.paymentSummary.payableRemaining)}.`,
      })
      return
    }
    setFeedback(null)
    startTransition(async () => {
      const result = await createTechnicianPayMongoCheckoutAction(values)
      if (result.success && result.data) {
        setActiveCheckout({
          ticketId: ticket.ticket_id,
          checkoutUrl: result.data.checkoutUrl,
          sessionId: result.data.sessionId,
          amountPhp: result.data.amountPhp,
        })
        setFeedback({
          ticketId: ticket.ticket_id,
          type: 'success',
          message: 'PayMongo checkout link ready. Open checkout for customer payment, then verify.',
        })
      } else if (!result.success) {
        setFeedback({ ticketId: ticket.ticket_id, type: 'error', message: result.error })
      }
    })
  }

  function handleVerifyPayMongo() {
    if (!ticket) return
    setFeedback(null)
    startTransition(async () => {
      const result = await verifyTechnicianPayMongoCheckoutAction(ticket.ticket_id)
      if (result.success) {
        setActiveCheckout(null)
        setFeedback({ ticketId: ticket.ticket_id, type: 'success', message: result.message })
      } else {
        setFeedback({ ticketId: ticket.ticket_id, type: 'error', message: result.error })
      }
    })
  }

  function onFieldPaymentSubmit(values: TechnicianPaymentInput) {
    if (!ticket || !job) return
    if (roundPhp(values.amount_php) > job.paymentSummary.payableRemaining) {
      paymentForm.setError('amount_php', {
        type: 'manual',
        message: `Amount cannot exceed the remaining balance of ${formatPHP(job.paymentSummary.payableRemaining)}.`,
      })
      return
    }
    setFeedback(null)
    startTransition(async () => {
      const result = await recordOnsitePaymentAction({
        ...values,
        installment_no: null,
        reference_no: values.payment_method === 'Cash' ? '' : values.reference_no,
      })

      if (result.success) {
        setActiveCheckout(null)
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
      setTabOverride(null)
    }
    onOpenChange(nextOpen)
  }

  if (!job || !ticket) return null

  const visibleFeedback = feedback && feedback.ticketId === ticket.ticket_id ? feedback : null
  const visibleCheckout =
    activeCheckout && activeCheckout.ticketId === ticket.ticket_id ? activeCheckout : null

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
  const { paymentSummary } = job
  const isAppointmentActive =
    Boolean(appointment) && !['completed', 'cancelled'].includes(appointment?.appointment_status ?? '')
  const canConfirmSlot =
    isAppointmentActive &&
    ['requested', 'rescheduled'].includes(appointment?.appointment_status ?? '')

  const drawerTabs: ReadonlyArray<{
    key: WorkbenchSectionTab
    label: string
    badge?: string
  }> = [
    { key: 'work', label: 'Work & Visit' },
    {
      key: 'billing',
      label: 'Billing',
      badge: paymentSummary.hasFinalBill ? formatPHP(paymentSummary.targetTotal) : 'Unbilled',
    },
    {
      key: 'collect',
      label: 'Collect Payment',
      badge: paymentSummary.canCollectBalance
        ? formatPHP(paymentSummary.payableRemaining)
        : paymentSummary.isSettled
          ? 'Paid'
          : undefined,
    },
  ]

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[min(38rem,96dvw)] space-y-5">
        {/* Persistent High-Signal Header */}
        <SheetHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 pr-6">
            <span className="font-mono text-xs font-semibold text-primary">{ticket.ticket_id}</span>
            <StatusBadge status={ticket.status} />
            {(ticket.priority === 'high' || ticket.priority === 'urgent') && (
              <StatusBadge status={ticket.priority} showIcon={false} />
            )}
          </div>
          <SheetTitle className="text-xl">
            {ticket.customer_first_name} {ticket.customer_last_name}
          </SheetTitle>
          <SheetDescription className="text-foreground font-medium">
            {ticket.appliance_brand} {ticket.appliance_category} &middot;{' '}
            {humanizeLabel(ticket.service_type)}
          </SheetDescription>

          <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-muted-foreground">
                Model {ticket.appliance_model_number} &middot; SN {ticket.appliance_serial_number}
              </span>
              {ticket.customer_phone && (
                <a
                  href={`tel:${ticket.customer_phone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 font-semibold text-primary hover:bg-primary-tint/50"
                >
                  <Phone className="h-3 w-3" aria-hidden="true" />
                  <span>Call {formattedPhone}</span>
                </a>
              )}
            </div>

            <p className="flex items-start gap-1.5 text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span>{customerAddress}</span>
            </p>

            {appointment && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-border pt-2">
                <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                  <CalendarClock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <span>
                    {formatManilaDate(appointment.scheduled_date)} &middot; {appointment.time_slot}
                  </span>
                </span>
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={appointment.appointment_status} />
                  {canConfirmSlot && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={handleConfirmAppointment}
                      className="h-7 px-2.5 text-xs"
                    >
                      Confirm Slot
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Separated Section Tabs */}
        <div
          role="tablist"
          aria-label="Job sections"
          className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted/60 p-1"
        >
          {drawerTabs.map((tab) => {
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg px-2 py-2 text-xs font-semibold transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'text-muted-foreground hover:bg-card hover:text-foreground'
                )}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={cn(
                      'mt-0.5 text-[10px] font-medium tabular-nums',
                      active ? 'text-white/85' : 'text-muted-foreground'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {visibleFeedback && <FormBanner type={visibleFeedback.type} message={visibleFeedback.message} />}

        {/* TAB 1: WORK & VISIT */}
        {activeTab === 'work' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-3.5 space-y-1.5 text-xs">
              <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                Customer Concern
              </p>
              <p className="text-sm text-foreground leading-relaxed">{ticket.issue_description}</p>
              {appointment?.remarks && (
                <p className="pt-1 text-muted-foreground">
                  <span className="font-semibold">Arrival Note: </span>
                  {appointment.remarks}
                </p>
              )}
            </div>

            {/* Single Contextual Next-Step Action */}
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
                <span>Start Repair Work</span>
              </Button>
            )}

            {ticket.status === 'in_progress' && (
              <Button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (!paymentSummary.hasFinalBill) {
                    setActiveTab('billing')
                    return
                  }
                  handleQuickStage('awaiting_payment', 'billing')
                }}
                className="w-full"
              >
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                <span>Finish Work &amp; Proceed to Billing</span>
              </Button>
            )}

            <form
              onSubmit={repairForm.handleSubmit((values) => submitRepairUpdate(values))}
              className="space-y-3 rounded-xl border border-border bg-card p-4"
              noValidate
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Wrench className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Diagnostics &amp; Stage</span>
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

              <div className="space-y-1.5">
                <Label htmlFor="wb-stage">Repair Stage</Label>
                <Select
                  value={watchedStatus}
                  onValueChange={(val) =>
                    repairForm.setValue('status', val as TechnicianRepairUpdateInput['status'], {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger id="wb-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TECH_WORKFLOW_STATUSES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" variant="outline" disabled={isPending} className="w-full">
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                <span>Save Work Update</span>
              </Button>
            </form>

            {appointment && isAppointmentActive && (
              <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Need to change the visit date or 2-hour slot?
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setRescheduleTicketId((prev) =>
                        prev === ticket.ticket_id ? null : ticket.ticket_id
                      )
                    }
                  >
                    {rescheduleOpen ? 'Close' : 'Reschedule'}
                  </Button>
                </div>

                {rescheduleOpen && (
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
                        <Label htmlFor="wb-resched-slot">Time Slot</Label>
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
                        {isPending && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        )}
                        <span>Save Window</span>
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BILLING (Strictly Service Price, Totals & History) */}
        {activeTab === 'billing' && (
          <div className="space-y-4">
            <form
              onSubmit={repairForm.handleSubmit(handleSaveFinalBill)}
              className="rounded-xl border border-border bg-card p-4 space-y-4"
              noValidate
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Receipt className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>Service Bill</span>
                </div>
                {ticket.estimated_cost_php > 0 && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                    Starting Est. {formatPHP(ticket.estimated_cost_php)}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wb-final-cost">Final Agreed Price (PHP)</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="wb-final-cost"
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={ticket.status === 'completed' || ticket.status === 'cancelled'}
                    placeholder="Enter agreed final bill after checkup"
                    {...repairForm.register('final_cost_php', {
                      setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                    })}
                  />
                  {ticket.status !== 'completed' && ticket.status !== 'cancelled' && (
                    <Button type="submit" disabled={isPending} className="shrink-0">
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Save className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span>Save Final Bill</span>
                    </Button>
                  )}
                </div>
                {repairForm.formState.errors.final_cost_php && (
                  <p role="alert" className="text-xs text-destructive">
                    {repairForm.formState.errors.final_cost_php.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 border-t border-dashed border-border pt-3 text-sm tabular-nums">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Final agreed price</span>
                  <span className="font-semibold text-foreground">
                    {paymentSummary.hasFinalBill ? formatPHP(paymentSummary.targetTotal) : 'Not set yet'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Verified paid</span>
                  <span className="font-semibold text-emerald-700">
                    {formatPHP(paymentSummary.verifiedPaid)}
                  </span>
                </div>
                {paymentSummary.pendingPaid > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pending admin verification</span>
                    <span className="font-medium text-amber-700">
                      {formatPHP(paymentSummary.pendingPaid)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="font-semibold text-foreground">Remaining balance</span>
                  <span className="font-heading text-lg font-bold text-foreground">
                    {paymentSummary.hasFinalBill ? formatPHP(paymentSummary.payableRemaining) : '—'}
                  </span>
                </div>
              </div>

              {paymentSummary.canCollectBalance && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setActiveTab('collect')}
                  className="w-full"
                >
                  <span>Proceed to Collect {formatPHP(paymentSummary.payableRemaining)}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </form>

            {/* Ticket Payment History */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payments Recorded ({payments.length})
              </p>
              {payments.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No payments submitted for this ticket yet.
                </p>
              ) : (
                <ul className="divide-y divide-dashed divide-border">
                  {payments.map((pay) => (
                    <li
                      key={pay.payment_id}
                      className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0 text-xs"
                    >
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
              )}
            </div>
          </div>
        )}

        {/* TAB 3: COLLECT PAYMENT (Separated PayMongo Gateway vs Field Cash) */}
        {activeTab === 'collect' && (
          <div className="space-y-4">
            {ticket.status === 'cancelled' ? (
              <div className="rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
                This ticket was cancelled. Payments cannot be collected.
              </div>
            ) : paymentSummary.isSettled || ticket.status === 'completed' ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Paid in full</p>
                  <p className="mt-0.5 text-xs text-emerald-800">
                    Verified payments already settle {formatPHP(paymentSummary.targetTotal)}. Duplicate collection is disabled.
                  </p>
                </div>
              </div>
            ) : paymentSummary.isCoveredByPending ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Balance already covered by pending payment</p>
                  <p className="mt-0.5 text-xs text-amber-800">
                    Recorded payments ({formatPHP(paymentSummary.verifiedPaid + paymentSummary.pendingPaid)}) already cover the full bill and are awaiting admin verification.
                  </p>
                </div>
              </div>
            ) : !paymentSummary.hasFinalBill ? (
              <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">Set final bill before collecting</p>
                <p className="text-xs text-muted-foreground">
                  Enter and save the Final Agreed Price in Billing first so the exact unpaid balance is locked against over-collection.
                </p>
                <Button type="button" size="sm" onClick={() => setActiveTab('billing')}>
                  <span>Go to Billing</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-primary-tint/50 px-4 py-3 text-sm">
                  <span className="font-semibold text-foreground">Remaining Balance Due</span>
                  <span className="font-heading text-lg font-bold tabular-nums text-primary">
                    {formatPHP(paymentSummary.payableRemaining)}
                  </span>
                </div>

                {/* Channel A: PayMongo Gateway (Digital Payments) */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />
                      <span>Online Payment via PayMongo</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Customer pays via GCash, Maya, QR Ph, or Card and is verified automatically.
                    </p>
                  </div>

                  {visibleCheckout ? (
                    <div className="space-y-3 rounded-xl border border-teal-200 bg-primary-tint/35 p-3.5">
                      <p className="text-xs font-semibold text-foreground">
                        Checkout ready for {formatPHP(visibleCheckout.amountPhp)} ({visibleCheckout.sessionId})
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button asChild className="flex-1">
                          <a href={visibleCheckout.checkoutUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            <span>Open PayMongo Checkout</span>
                          </a>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isPending}
                          onClick={handleVerifyPayMongo}
                          className="flex-1"
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                          )}
                          <span>Verify PayMongo Payment</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={paymongoForm.handleSubmit(onPayMongoSubmit)} className="space-y-3" noValidate>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="pm-amount">PayMongo Amount (PHP)</Label>
                          <button
                            type="button"
                            onClick={() =>
                              paymongoForm.setValue('amount_php', paymentSummary.payableRemaining, {
                                shouldValidate: true,
                              })
                            }
                            className="text-[11px] font-semibold text-primary hover:underline"
                          >
                            Full {formatPHP(paymentSummary.payableRemaining)}
                          </button>
                        </div>
                        <Input
                          id="pm-amount"
                          type="number"
                          step="0.01"
                          min="1"
                          max={paymentSummary.payableRemaining}
                          {...paymongoForm.register('amount_php', { valueAsNumber: true })}
                        />
                        {paymongoForm.formState.errors.amount_php && (
                          <p role="alert" className="text-xs text-destructive">
                            {paymongoForm.formState.errors.amount_php.message}
                          </p>
                        )}
                      </div>

                      <Button type="submit" disabled={isPending} className="w-full">
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                        <span>Pay via PayMongo</span>
                      </Button>
                    </form>
                  )}
                </div>

                {/* Channel B: Field Cash / Manual Collection */}
                <form
                  onSubmit={paymentForm.handleSubmit(onFieldPaymentSubmit)}
                  className="rounded-xl border border-border bg-card p-4 space-y-3"
                  noValidate
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">Field Cash / Offline Collection</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Use for Cash received on-site or manual transfers outside PayMongo (queued for admin verification).
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="wb-pay-method">Method</Label>
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
                        <Label htmlFor="wb-pay-amount">Amount (PHP)</Label>
                        <button
                          type="button"
                          onClick={() =>
                            paymentForm.setValue('amount_php', paymentSummary.payableRemaining, {
                              shouldValidate: true,
                            })
                          }
                          className="text-[11px] font-semibold text-primary hover:underline"
                        >
                          Full {formatPHP(paymentSummary.payableRemaining)}
                        </button>
                      </div>
                      <Input
                        id="wb-pay-amount"
                        type="number"
                        step="0.01"
                        min="1"
                        max={paymentSummary.payableRemaining}
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
                        placeholder="Receipt or transfer reference #"
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
                    <span>Record Field Collection</span>
                  </Button>
                </form>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export { JobWorkbenchDrawer as DiagnosticDrawer }
