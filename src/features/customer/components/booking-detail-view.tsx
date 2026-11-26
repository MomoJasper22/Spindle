'use client'

import * as React from 'react'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  CalendarCheck,
  Check,
  CreditCard,
  Loader2,
  MapPin,
  Phone,
  Receipt,
  UserCheck,
  Wrench,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { FormBanner } from '@/components/shared/form-banner'
import { StatusBadge } from '@/components/shared/status-badge'
import { SERVICE_TYPES, TIME_SLOTS } from '@/lib/constants'
import {
  formatManilaDate,
  formatPHPhone,
  formatPHP,
  getManilaTodayISO,
} from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type {
  AppointmentDetailView,
  PaymentDetailView,
  RepairDetailView,
} from '@/types/database'
import {
  cancelRepairTicketAction,
  rescheduleAppointmentAction,
} from '../actions/customer-actions'
import {
  rescheduleAppointmentSchema,
  type RescheduleAppointmentInput,
} from '../schemas/customer-schemas'

const PASSBOOK_STEPS = [
  { key: 'pending', label: 'Visit Requested', detail: 'We received your request.' },
  { key: 'assigned', label: 'Technician Assigned', detail: 'Your specialist is booked.' },
  { key: 'in_progress', label: 'Repair Underway', detail: 'Checking and fixing your unit.' },
  { key: 'completed', label: 'All Done', detail: 'Work finished and settled.' },
] as const

function getStepIndex(status: RepairDetailView['status']) {
  if (status === 'pending') return 0
  if (status === 'assigned') return 1
  if (status === 'in_progress' || status === 'awaiting_payment') return 2
  if (status === 'completed') return 3
  return -1
}

interface BookingDetailViewProps {
  repair: RepairDetailView
  appointment: AppointmentDetailView | null
  payments: PaymentDetailView[]
}

export function BookingDetailView({
  repair,
  appointment,
  payments,
}: BookingDetailViewProps) {
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const todayISO = getManilaTodayISO()
  const activeStepIndex = getStepIndex(repair.status)
  const serviceLabel =
    SERVICE_TYPES.find((s) => s.value === repair.service_type)?.label ?? 'Appliance Service'

  const targetTotal = Number(repair.final_cost_php ?? repair.estimated_cost_php ?? 0)
  const paidTotal = Number(repair.verified_paid_php ?? 0)
  const balance = Math.max(0, targetTotal - paidTotal)

  const canModify = ['pending', 'assigned'].includes(repair.status)
  const canReschedule =
    Boolean(appointment) &&
    !['completed', 'cancelled'].includes(repair.status) &&
    appointment?.appointment_status !== 'completed' &&
    appointment?.appointment_status !== 'cancelled'

  const rescheduleForm = useForm<RescheduleAppointmentInput>({
    resolver: zodResolver(rescheduleAppointmentSchema),
    mode: 'onBlur',
    defaultValues: {
      appointment_id: appointment?.appointment_id ?? '',
      scheduled_date: appointment?.scheduled_date ?? repair.scheduled_date,
      time_slot: appointment?.time_slot ?? TIME_SLOTS[0],
      remarks: appointment?.remarks ?? '',
    },
  })

  function onRescheduleSubmit(values: RescheduleAppointmentInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await rescheduleAppointmentAction(values)
      if (result.success) {
        setRescheduleOpen(false)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function handleCancelVisit() {
    setFeedback(null)
    startTransition(async () => {
      const result = await cancelRepairTicketAction(repair.ticket_id)
      if (result.success) {
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href="/customer/bookings">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to My Bookings</span>
          </Link>
        </Button>

        <StatusBadge status={repair.status} audience="customer" />
      </div>

      {feedback && !rescheduleOpen && (
        <FormBanner type={feedback.type} message={feedback.message} />
      )}

      {/* Passbook Header & 4-Step Tracker */}
      <div className="overflow-hidden rounded-2xl border-2 border-[#141B29] bg-card shadow-[0_14px_30px_-12px_rgba(20,27,41,0.16),0_4px_10px_rgba(20,27,41,0.05)]">
        <div className="bg-[#141B29] px-5 py-4 text-[#F8F7F4]">
          <p className="text-xs font-medium text-[#CBD5E1]">{serviceLabel}</p>
          <h1 className="mt-1 font-heading text-2xl font-bold">
            {repair.appliance_brand} {repair.appliance_category}
          </h1>
          <p className="mt-0.5 text-xs text-[#94A3B8]">
            Model {repair.appliance_model_number} &middot; Ref {repair.ticket_id}
          </p>
        </div>

        <div className="p-5">
          {repair.status === 'cancelled' ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              This home visit was cancelled. You can book a new visit anytime from your bookings page.
            </div>
          ) : (
            <ol className="grid gap-4 sm:grid-cols-4">
              {PASSBOOK_STEPS.map((step, index) => {
                const isDone = index < activeStepIndex || repair.status === 'completed'
                const isCurrent = index === activeStepIndex && repair.status !== 'completed'
                return (
                  <li key={step.key} className="flex items-start gap-3 sm:block">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                          isDone && 'border-primary bg-primary text-primary-foreground',
                          isCurrent && 'border-[#D97706] bg-amber-50 text-[#B45309]',
                          !isDone && !isCurrent && 'border-border bg-muted text-muted-foreground'
                        )}
                      >
                        {isDone ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
                      </span>
                    </div>
                    <div className="sm:mt-2">
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          isDone || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.detail}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Visit Schedule &amp; Technician</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Visit date &amp; window</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {formatManilaDate(appointment?.scheduled_date ?? repair.scheduled_date)}
                  </p>
                  {appointment?.time_slot && (
                    <p className="text-muted-foreground">{appointment.time_slot}</p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Assigned technician</p>
                  {repair.technician_first_name ? (
                    <div className="mt-1 space-y-0.5">
                      <p className="flex items-center gap-1.5 font-semibold text-foreground">
                        <UserCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                        <span>
                          {repair.technician_first_name} {repair.technician_last_name}
                        </span>
                      </p>
                      {repair.technician_phone && (
                        <p className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{formatPHPhone(repair.technician_phone)}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-muted-foreground">
                      We are matching your visit with a technician near your area.
                    </p>
                  )}
                </div>
              </div>

              {appointment?.service_address && (
                <div className="border-t border-dashed border-border pt-4">
                  <p className="text-xs text-muted-foreground">Home address</p>
                  <p className="mt-1 flex items-start gap-2 text-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{appointment.service_address}</span>
                  </p>
                </div>
              )}

              {appointment?.remarks && (
                <div>
                  <p className="text-xs text-muted-foreground">Gate &amp; arrival notes</p>
                  <p className="mt-1 text-foreground">{appointment.remarks}</p>
                </div>
              )}

              {(canReschedule || canModify) && (
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  {canReschedule && appointment && (
                    <Button type="button" variant="outline" onClick={() => setRescheduleOpen(true)}>
                      Move Date or Time
                    </Button>
                  )}
                  {canModify && (
                    <ConfirmationDialog
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                        >
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          <span>Cancel Visit</span>
                        </Button>
                      }
                      title="Cancel this home visit?"
                      description="Your scheduled visit will be cancelled immediately. You can book again anytime."
                      confirmLabel="Yes, Cancel Visit"
                      isPending={isPending}
                      onConfirm={handleCancelVisit}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wrench className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>What Needs Attention</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">What you told us</p>
                <p className="mt-1 leading-relaxed text-foreground">{repair.issue_description}</p>
              </div>

              {repair.diagnostic_notes && (
                <div className="rounded-lg border border-border bg-muted/60 p-4">
                  <p className="text-xs font-semibold text-foreground">What our technician found</p>
                  <p className="mt-1 leading-relaxed text-muted-foreground">
                    {repair.diagnostic_notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Cost & Payments Passbook */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Cost Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-dashed border-border pb-2.5">
                <span className="text-muted-foreground">Starting estimate</span>
                <span className="font-medium tabular-nums">
                  {repair.estimated_cost_php > 0 ? formatPHP(repair.estimated_cost_php) : 'After checkup'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-dashed border-border pb-2.5">
                <span className="text-muted-foreground">Final agreed price</span>
                <span className="font-semibold tabular-nums">
                  {repair.final_cost_php !== null ? formatPHP(repair.final_cost_php) : 'Pending checkup'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-dashed border-border pb-2.5">
                <span className="text-muted-foreground">Confirmed paid</span>
                <span className="font-semibold tabular-nums text-emerald-700">
                  {formatPHP(paidTotal)}
                </span>
              </div>

              {repair.pending_paid_php > 0 && (
                <div className="flex items-center justify-between border-b border-dashed border-border pb-2.5">
                  <span className="text-muted-foreground">Waiting for confirmation</span>
                  <span className="font-medium tabular-nums text-amber-700">
                    {formatPHP(repair.pending_paid_php)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="font-semibold text-foreground">Remaining balance</span>
                <span className="font-heading text-lg font-bold tabular-nums text-foreground">
                  {formatPHP(balance)}
                </span>
              </div>

              {repair.status !== 'completed' && repair.status !== 'cancelled' && (
                <Button asChild className="mt-2 w-full">
                  <Link href={`/customer/payments?ticket=${repair.ticket_id}`}>
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                    <span>Make a Payment</span>
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payments for This Visit</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No payments submitted for this visit yet.
                </p>
              ) : (
                <div className="divide-y divide-dashed divide-border">
                  {payments.map((pay) => (
                    <div key={pay.payment_id} className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                          {formatPHP(pay.amount_php)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pay.payment_method} &middot; {formatManilaDate(pay.payment_date)}
                        </p>
                      </div>
                      <StatusBadge status={pay.payment_status} audience="customer" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reschedule Modal */}
      {appointment && (
        <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Move Your Visit Time</DialogTitle>
              <DialogDescription>
                Choose a new date and time window for your {repair.appliance_brand} {repair.appliance_category}.
              </DialogDescription>
            </DialogHeader>

            {feedback && rescheduleOpen && (
              <FormBanner type={feedback.type} message={feedback.message} />
            )}

            <form
              onSubmit={rescheduleForm.handleSubmit(onRescheduleSubmit)}
              className="space-y-4"
              noValidate
            >
              <div className="space-y-1.5">
                <Label htmlFor="detail-resched-date">New date</Label>
                <Input
                  id="detail-resched-date"
                  type="date"
                  min={todayISO}
                  {...rescheduleForm.register('scheduled_date')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-resched-slot">New time window</Label>
                <Controller
                  name="time_slot"
                  control={rescheduleForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="detail-resched-slot">
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
                <Label htmlFor="detail-resched-remarks">Arrival note (optional)</Label>
                <Input
                  id="detail-resched-remarks"
                  placeholder="Any helpful note for our technician"
                  {...rescheduleForm.register('remarks')}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRescheduleOpen(false)}>
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
      )}
    </div>
  )
}
