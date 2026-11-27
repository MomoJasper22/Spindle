'use client'

import * as React from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, ChevronDown, Clock, CreditCard, Loader2, Receipt } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import { ScrollableList } from '@/components/shared/scrollable-list'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatManilaDate, formatPHP } from '@/lib/formatters'
import { getTicketPaymentSummary } from '@/lib/payments'
import { cn } from '@/lib/utils'
import type { PaymentDetailView, RepairDetailView } from '@/types/database'
import { createTicketPaymentCheckoutAction } from '../actions/customer-actions'
import { customerPaymentSchema, type CustomerPaymentInput } from '../schemas/customer-schemas'

interface PaymentsPanelProps {
  repairs: RepairDetailView[]
  payments: PaymentDetailView[]
  defaultTicketId?: string
  initialNotice?: { type: 'error' | 'success'; message: string } | null
}

export function PaymentsPanel({
  repairs,
  payments,
  defaultTicketId,
  initialNotice = null,
}: PaymentsPanelProps) {
  const billTickets = repairs.filter((r) => r.status !== 'cancelled')
  const payableTickets = billTickets.filter((r) => getTicketPaymentSummary(r).canAcceptOnlinePayment)

  const preselected = defaultTicketId
    ? payableTickets.find((t) => t.ticket_id === defaultTicketId)
    : undefined

  const initialPayable = preselected
    ? getTicketPaymentSummary(preselected).payableRemaining
    : payableTickets[0]
      ? getTicketPaymentSummary(payableTickets[0]).payableRemaining
      : 0

  const [dialogOpen, setDialogOpen] = React.useState(Boolean(preselected))
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    initialNotice
  )
  const [isRedirecting, setIsRedirecting] = React.useState(false)
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
      amount_php: initialPayable,
      remarks: '',
    },
  })

  const selectedTicketId = useWatch({ control, name: 'ticket_id' })
  const selectedTicket = payableTickets.find((t) => t.ticket_id === selectedTicketId) ?? payableTickets[0]
  const selectedMaxPayable = selectedTicket
    ? getTicketPaymentSummary(selectedTicket).payableRemaining
    : 0

  function openPaymentDialog(ticket?: RepairDetailView) {
    const target = ticket ?? payableTickets[0]
    if (!target) return
    const summary = getTicketPaymentSummary(target)
    if (!summary.canAcceptOnlinePayment) return

    reset({
      ticket_id: target.ticket_id,
      amount_php: summary.payableRemaining,
      remarks: '',
    })
    setFeedback(null)
    setDialogOpen(true)
  }

  function onSubmit(values: CustomerPaymentInput) {
    if (isRedirecting) return
    setFeedback(null)
    startTransition(async () => {
      const result = await createTicketPaymentCheckoutAction(values)
      if (result.success && result.data?.checkoutUrl) {
        setIsRedirecting(true)
        window.location.assign(result.data.checkoutUrl)
      } else if (!result.success) {
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
            Track your booking deposits, check remaining balances, and pay safely with PayMongo.
          </p>
        </div>

        <Button
          onClick={() => openPaymentDialog()}
          disabled={payableTickets.length === 0}
          className="w-full sm:w-auto"
        >
          <CreditCard className="h-4 w-4" aria-hidden="true" />
          <span>Pay Remaining Balance</span>
        </Button>
      </div>

      {feedback && !dialogOpen && <FormBanner type={feedback.type} message={feedback.message} />}

      {/* Bills Summary */}
      <section aria-labelledby="bills-heading" className="space-y-3">
        <h2 id="bills-heading" className="font-heading text-lg font-bold text-foreground">
          Service Bills
        </h2>

        {billTickets.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No bills right now"
            description="When you book a home visit, your booking payment and any remaining service balance will show up here."
          />
        ) : (
          <ScrollableList
            regionLabel="Service bills summary"
            maxHeightClassName="max-h-[min(55dvh,30rem)]"
            className="p-0.5 pr-1.5"
          >
            <div className="grid gap-4 md:grid-cols-2">
              {billTickets.map((ticket) => {
              const summary = getTicketPaymentSummary(ticket)

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
                          {summary.hasFinalBill ? 'Final bill' : 'Booking deposit'}
                        </p>
                        <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                          {summary.targetTotal > 0 ? formatPHP(summary.targetTotal) : 'Pending'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Paid</p>
                        <p className="mt-0.5 font-semibold tabular-nums text-emerald-700">
                          {formatPHP(summary.verifiedPaid)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                          {formatPHP(summary.payableRemaining)}
                        </p>
                      </div>
                    </div>

                    {summary.pendingPaid > 0 && (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-amber-800">
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          {formatPHP(summary.pendingPaid)} is currently being confirmed — no duplicate payment needed.
                        </span>
                      </p>
                    )}

                    {summary.canAcceptOnlinePayment ? (
                      <Button
                        type="button"
                        variant={ticket.status === 'awaiting_payment' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={() => openPaymentDialog(ticket)}
                      >
                        <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Pay {formatPHP(summary.payableRemaining)} with PayMongo</span>
                      </Button>
                    ) : summary.isSettled ? (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>Paid in full</span>
                      </div>
                    ) : summary.isCoveredByPending ? (
                      <Badge variant="amber">Payment confirmation in progress</Badge>
                    ) : !summary.hasFinalBill && summary.verifiedPaid > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Upfront booking fee paid. Final balance will be unlocked after your technician checks the appliance.
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              )
              })}
            </div>
          </ScrollableList>
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
            description="Your confirmed PayMongo and on-site receipts will appear here."
          />
        ) : (
          <ScrollableList
            regionLabel="Past payments ledger"
            maxHeightClassName="max-h-[min(55dvh,30rem)]"
            className="border border-border bg-card"
          >
            <div className="divide-y divide-dashed divide-border">
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
          </ScrollableList>
        )}
      </section>

      {/* PayMongo Balance Checkout Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Remaining Balance via PayMongo</DialogTitle>
            <DialogDescription>
              Pay securely using GCash, Maya, QR Ph, or debit/credit card. Verified automatically once complete.
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
                        const summary = getTicketPaymentSummary(target)
                        setValue('amount_php', summary.payableRemaining, { shouldValidate: true })
                      }
                    }}
                  >
                    <SelectTrigger id="pay-ticket">
                      <SelectValue placeholder="Choose a booking" />
                    </SelectTrigger>
                    <SelectContent>
                      {payableTickets.map((t) => {
                        const s = getTicketPaymentSummary(t)
                        return (
                          <SelectItem key={t.ticket_id} value={t.ticket_id}>
                            {t.appliance_brand} {t.appliance_category} ({formatPHP(s.payableRemaining)} due)
                          </SelectItem>
                        )
                      })}
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

            <input type="hidden" {...register('amount_php', { valueAsNumber: true })} />

            <div className="rounded-xl border border-teal-200 bg-primary-tint/50 p-3.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">Pay Remaining Balance in Full</span>
                <span className="font-heading text-base font-bold tabular-nums text-primary">
                  {formatPHP(selectedMaxPayable)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Remaining balances are settled in full via PayMongo (GCash, Maya, QR Ph, or Card).
              </p>
              {errors.amount_php && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
                  {errors.amount_php.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-remarks">Note (optional)</Label>
              <Input
                id="pay-remarks"
                placeholder="e.g. Final service balance"
                {...register('remarks')}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isPending || isRedirecting}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || isRedirecting || selectedMaxPayable <= 0}>
                {(isPending || isRedirecting) && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                <span>Pay with PayMongo</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
