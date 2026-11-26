'use client'

import * as React from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreditCard, Loader2, Plus, Receipt } from 'lucide-react'
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
import { StatusBadge } from '@/components/shared/status-badge'
import { PAYMENT_METHODS } from '@/lib/constants'
import { formatManilaDate, formatPHP } from '@/lib/formatters'
import type { PaymentDetailView, RepairDetailView } from '@/types/database'
import { submitCustomerPaymentAction } from '../actions/customer-actions'
import { customerPaymentSchema, type CustomerPaymentInput } from '../schemas/customer-schemas'

interface PaymentsPanelProps {
  repairs: RepairDetailView[]
  payments: PaymentDetailView[]
}

export function PaymentsPanel({ repairs, payments }: PaymentsPanelProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const payableTickets = repairs.filter((r) => r.status !== 'cancelled')

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerPaymentInput>({
    resolver: zodResolver(customerPaymentSchema),
    mode: 'onBlur',
    defaultValues: {
      ticket_id: payableTickets[0]?.ticket_id ?? '',
      payment_method: 'GCash',
      amount_php: 0,
      installment_no: null,
      reference_no: '',
      remarks: '',
    },
  })

  const selectedMethod = useWatch({ control, name: 'payment_method' })

  function openPaymentDialog(ticket?: RepairDetailView) {
    const target = ticket ?? payableTickets[0]
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
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Billing Breakdown by Ticket</CardTitle>
            <CardDescription>
              Review estimated vs. final repair charges and submit GCash, Maya, QR Ph, or bank transfers.
            </CardDescription>
          </div>
          <Button onClick={() => openPaymentDialog()} disabled={payableTickets.length === 0}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Submit Payment</span>
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {feedback && !dialogOpen && <FormBanner type={feedback.type} message={feedback.message} />}

          {payableTickets.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No active billing records"
              description="Once you book a repair, itemized PHP estimates and payment balances appear here."
            />
          ) : (
            <Table regionLabel="Repair billing breakdown">
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Appliance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Estimated</TableHead>
                  <TableHead>Final Cost</TableHead>
                  <TableHead>Verified Paid</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payableTickets.map((t) => {
                  const targetTotal = t.final_cost_php ?? t.estimated_cost_php ?? 0
                  const balance = Math.max(0, Number(targetTotal) - Number(t.verified_paid_php))
                  return (
                    <TableRow key={t.ticket_id}>
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {t.ticket_id}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{t.appliance_brand}</p>
                        <p className="text-xs text-muted-foreground">{t.appliance_model_number}</p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={t.status} />
                      </TableCell>
                      <TableCell className="tabular-nums">{formatPHP(t.estimated_cost_php)}</TableCell>
                      <TableCell className="font-semibold tabular-nums">
                        {t.final_cost_php !== null ? formatPHP(t.final_cost_php) : 'Pending'}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <span className="font-semibold text-emerald-700">
                          {formatPHP(t.verified_paid_php)}
                        </span>
                        {t.pending_paid_php > 0 && (
                          <p className="text-xs text-amber-700">
                            +{formatPHP(t.pending_paid_php)} pending
                          </p>
                        )}
                        {balance > 0 && t.final_cost_php !== null && (
                          <p className="text-xs text-muted-foreground">
                            Bal: {formatPHP(balance)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {t.status !== 'completed' && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openPaymentDialog(t)}
                          >
                            Pay
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            All cash and digital payments submitted for your service tickets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payment transactions yet"
              description="Submitted payments and verification statuses will appear here."
            />
          ) : (
            <Table regionLabel="Customer payment history">
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Method &amp; Reference</TableHead>
                  <TableHead>Amount (PHP)</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((pay) => (
                  <TableRow key={pay.payment_id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {pay.payment_id}
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-xs text-primary">{pay.ticket_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {pay.appliance_brand} {pay.appliance_model_number}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{pay.payment_method}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {pay.reference_no || 'No reference'}
                        {pay.installment_no ? ` · Inst #${pay.installment_no}` : ''}
                      </p>
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums">
                      {formatPHP(pay.amount_php)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatManilaDate(pay.payment_date)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={pay.payment_status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Payment</DialogTitle>
            <DialogDescription>
              Submit payment details for verification. Full settlement against the final cost automatically completes the repair ticket.
            </DialogDescription>
          </DialogHeader>

          {feedback && dialogOpen && <FormBanner type={feedback.type} message={feedback.message} />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="pay-ticket">Repair Ticket</Label>
              <Controller
                name="ticket_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="pay-ticket">
                      <SelectValue placeholder="Select repair ticket" />
                    </SelectTrigger>
                    <SelectContent>
                      {payableTickets.map((t) => (
                        <SelectItem key={t.ticket_id} value={t.ticket_id}>
                          {t.ticket_id} — {t.appliance_brand} {t.appliance_model_number}
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
                <Label htmlFor="pay-method">Payment Method</Label>
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
                  Reference No. {selectedMethod !== 'Cash' && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="pay-reference"
                  placeholder="GCash / Maya / Bank ref #"
                  {...register('reference_no')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay-installment">Installment No. (optional)</Label>
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
              <Label htmlFor="pay-remarks">Remarks (optional)</Label>
              <Input
                id="pay-remarks"
                placeholder="e.g. Downpayment or full settlement"
                {...register('remarks')}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>Submit Payment</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
