'use client'

import * as React from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, CreditCard, Loader2, Plus, Receipt } from 'lucide-react'
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
import { EmptyState } from '@/components/shared/empty-state'
import { FormBanner } from '@/components/shared/form-banner'
import { StatusBadge } from '@/components/shared/status-badge'
import { PAYMENT_METHODS } from '@/lib/constants'
import { formatManilaDate, formatPHP } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { PaymentDetailView, RepairDetailView } from '@/types/database'
import { submitCustomerPaymentAction } from '../actions/customer-actions'
import { customerPaymentSchema, type CustomerPaymentInput } from '../schemas/customer-schemas'

interface PaymentsPanelProps {
  repairs: RepairDetailView[]
  payments: PaymentDetailView[]
  defaultTicketId?: string
}

export function PaymentsPanel({ repairs, payments, defaultTicketId }: PaymentsPanelProps) {
  const payableTickets = repairs.filter((r) => r.status !== 'cancelled')
  const preselected = defaultTicketId
    ? payableTickets.find((t) => t.ticket_id === defaultTicketId)
    : undefined

  const initialAmount = preselected
    ? Math.max(
        0,
        Number(preselected.final_cost_php ?? preselected.estimated_cost_php ?? 0) -
          Number(preselected.verified_paid_php ?? 0)
      )
    : 0

  const [dialogOpen, setDialogOpen] = React.useState(Boolean(preselected && preselected.status !== 'completed'))
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CustomerPaymentInput>({
    resolver: zodResolver(customerPaymentSchema),
    mode: 'onBlur',
    defaultValues: {
      ticket_id: preselected?.ticket_id ?? payableTickets[0]?.ticket_id ?? '',
      payment_method: 'GCash',
      amount_php: initialAmount,
      installment_no: null,
      reference_no: '',
      remarks: '',
    },
  })

  const selectedMethod = useWatch({ control, name: 'payment_method' })

  function openPaymentDialog(ticket?: RepairDetailView) {
    const target = ticket ?? payableTickets.find((t) => t.status !== 'completed') ?? payableTickets[0]
    const costTarget = target?.final_cost_php ?? target?.estimated_cost_php ?? 0
    const remaining = Math.max(0, Number(costTarget) - Number(target?.verified_paid_php ?? 0))

    reset({
      ticket_id: target?.ticket_id ?? '',
      payment_method: 'GCash',
      amount_php: remaining > 0 ? remaining : 0,
      installment_no: null,
      reference_no: '',
      remarks: '',
    })
    setFeedback(null)
    setDialogOpen(true)
  }

  function onSubmit(values: CustomerPaymentInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await submitCustomerPaymentAction(values)
      if (result.success) {
        setDialogOpen(false)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Payments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Check what is due and send payments via GCash, Maya, QR Ph, or bank transfer.
          </p>
        </div>

        <Button
          onClick={() => openPaymentDialog()}
          disabled={payableTickets.length === 0}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Make a Payment</span>
        </Button>
      </div>

      {feedback && !dialogOpen && <FormBanner type={feedback.type} message={feedback.message} />}

      {/* Bills Summary */}
      <section aria-labelledby="bills-heading" className="space-y-3">
        <h2 id="bills-heading" className="font-heading text-lg font-bold text-foreground">
          Service Bills
        </h2>

        {payableTickets.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No bills right now"
            description="When you book a home visit, your price estimate and remaining balance will show up here."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {payableTickets.map((ticket) => {
              const targetTotal = Number(ticket.final_cost_php ?? ticket.estimated_cost_php ?? 0)
              const paid = Number(ticket.verified_paid_php ?? 0)
              const balance = Math.max(0, targetTotal - paid)

              return (
                <Card key={ticket.ticket_id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">
                          {ticket.appliance_brand} {ticket.appliance_category}
                        </CardTitle>
                        <CardDescription>
                          Model {ticket.appliance_model_number} &middot; {formatManilaDate(ticket.scheduled_date)}
                        </CardDescription>
                      </div>
                      <StatusBadge status={ticket.status} audience="customer" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-3 gap-2 rounded-lg border border-dashed border-border bg-muted/50 p-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {ticket.final_cost_php !== null ? 'Final bill' : 'Estimate'}
                        </p>
                        <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                          {targetTotal > 0 ? formatPHP(targetTotal) : 'Pending'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Paid</p>
                        <p className="mt-0.5 font-semibold tabular-nums text-emerald-700">
                          {formatPHP(paid)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                          {formatPHP(balance)}
                        </p>
                      </div>
                    </div>

                    {ticket.pending_paid_php > 0 && (
                      <p className="text-xs font-medium text-amber-800">
                        +{formatPHP(ticket.pending_paid_php)} is currently being checked by our team.
                      </p>
                    )}

                    {ticket.status !== 'completed' && (
                      <Button
                        type="button"
                        variant={ticket.status === 'awaiting_payment' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={() => openPaymentDialog(ticket)}
                      >
                        <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{balance > 0 ? `Pay ${formatPHP(balance)}` : 'Send Payment'}</span>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Payment History Cards */}
      <section aria-labelledby="history-heading" className="space-y-3">
        <h2 id="history-heading" className="font-heading text-lg font-bold text-foreground">
          Past Payments
        </h2>

        {payments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payments sent yet"
            description="Your confirmed receipts and sent payments will appear here."
          />
        ) : (
          <div className="divide-y divide-dashed divide-border rounded-xl border border-border bg-card">
            {payments.map((pay) => {
              const isExpanded = expandedId === pay.payment_id
              return (
                <div key={pay.payment_id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-lg font-bold tabular-nums text-foreground">
                          {formatPHP(pay.amount_php)}
                        </span>
                        <StatusBadge status={pay.payment_status} audience="customer" />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {pay.appliance_brand} {pay.appliance_category} &middot; {pay.payment_method} &middot;{' '}
                        {formatManilaDate(pay.payment_date)}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedId(isExpanded ? null : pay.payment_id)}
                      className="text-xs text-muted-foreground"
                    >
                      <span>{isExpanded ? 'Hide receipt details' : 'Receipt details'}</span>
                      <ChevronDown
                        className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')}
                        aria-hidden="true"
                      />
                    </Button>
                  </div>

                  {isExpanded && (
                    <dl className="mt-3 grid gap-2 rounded-lg bg-muted/60 p-3 text-xs sm:grid-cols-3">
                      <div>
                        <dt className="text-muted-foreground">Reference number</dt>
                        <dd className="mt-0.5 font-mono font-medium text-foreground">
                          {pay.reference_no || 'Cash payment'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Receipt number</dt>
                        <dd className="mt-0.5 font-mono font-medium text-foreground">{pay.payment_id}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Note</dt>
                        <dd className="mt-0.5 text-foreground">
                          {pay.remarks || (pay.installment_no ? `Part payment #${pay.installment_no}` : 'None')}
                        </dd>
                      </div>
                    </dl>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Submit Payment Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send a Payment</DialogTitle>
            <DialogDescription>
              Share your payment details below. Our team checks it quickly and marks your visit paid.
            </DialogDescription>
          </DialogHeader>

          {feedback && dialogOpen && <FormBanner type={feedback.type} message={feedback.message} />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="pay-ticket">Which booking are you paying for?</Label>
              <Controller
                name="ticket_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(nextTicketId) => {
                      field.onChange(nextTicketId)
                      const target = payableTickets.find((t) => t.ticket_id === nextTicketId)
                      if (target) {
                        const targetCost = target.final_cost_php ?? target.estimated_cost_php ?? 0
                        const balance = Math.max(0, Number(targetCost) - Number(target.verified_paid_php ?? 0))
                        setValue('amount_php', balance, { shouldValidate: true })
                      }
                    }}
                  >
                    <SelectTrigger id="pay-ticket">
                      <SelectValue placeholder="Choose a booking" />
                    </SelectTrigger>
                    <SelectContent>
                      {payableTickets.map((t) => (
                        <SelectItem key={t.ticket_id} value={t.ticket_id}>
                          {t.appliance_brand} {t.appliance_category} ({formatManilaDate(t.scheduled_date)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.ticket_id && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {errors.ticket_id.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pay-method">Payment method</Label>
                <Controller
                  name="payment_method"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="pay-method">
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
                <Label htmlFor="pay-amount">Amount (PHP)</Label>
                <Input
                  id="pay-amount"
                  type="number"
                  step="0.01"
                  min="1"
                  aria-invalid={Boolean(errors.amount_php)}
                  {...register('amount_php', { valueAsNumber: true })}
                />
                {errors.amount_php && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {errors.amount_php.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pay-reference">
                  Confirmation / Reference No.{' '}
                  {selectedMethod !== 'Cash' && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="pay-reference"
                  placeholder="GCash / Maya / Bank ref #"
                  aria-invalid={Boolean(errors.reference_no)}
                  {...register('reference_no')}
                />
                {errors.reference_no && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {errors.reference_no.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay-installment">Part payment no. (optional)</Label>
                <Input
                  id="pay-installment"
                  type="number"
                  min="1"
                  placeholder="e.g. 1"
                  {...register('installment_no', {
                    setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                  })}
                />
                {errors.installment_no && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {errors.installment_no.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-remarks">Note (optional)</Label>
              <Input
                id="pay-remarks"
                placeholder="e.g. Downpayment or full payment"
                {...register('remarks')}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>Send Payment</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
