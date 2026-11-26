'use client'

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, CreditCard, Download, Loader2, Plus, Search, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { FormBanner } from '@/components/shared/form-banner'
import { StatusBadge } from '@/components/shared/status-badge'
import { PAYMENT_METHODS, PAYMENT_STATUSES } from '@/lib/constants'
import { formatManilaDate, formatPHP, humanizeLabel } from '@/lib/formatters'
import type { PaymentDetailView, RepairDetailView } from '@/types/database'
import {
  adminCancelPaymentAction,
  adminRecordPaymentAction,
  adminVerifyPaymentAction,
} from '../actions/admin-actions'
import { adminRecordPaymentSchema, type AdminRecordPaymentInput } from '../schemas/admin-schemas'

interface AdminPaymentsPanelProps {
  payments: PaymentDetailView[]
  repairs: RepairDetailView[]
}

export function AdminPaymentsPanel({ payments, repairs }: AdminPaymentsPanelProps) {
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [recordOpen, setRecordOpen] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const activeTickets = repairs.filter((r) => r.status !== 'cancelled')

  const form = useForm<AdminRecordPaymentInput>({
    resolver: zodResolver(adminRecordPaymentSchema),
    mode: 'onBlur',
    defaultValues: {
      ticket_id: activeTickets[0]?.ticket_id ?? '',
      payment_method: 'GCash',
      amount_php: 0,
      installment_no: null,
      reference_no: '',
      remarks: '',
      verify_immediately: true,
    },
  })

  function openRecordModal() {
    const t = activeTickets[0]
    const targetCost = t?.final_cost_php ?? t?.estimated_cost_php ?? 0
    const balance = Math.max(0, Number(targetCost) - Number(t?.verified_paid_php ?? 0))
    form.reset({
      ticket_id: t?.ticket_id ?? '',
      payment_method: 'GCash',
      amount_php: balance,
      installment_no: null,
      reference_no: '',
      remarks: '',
      verify_immediately: true,
    })
    setFeedback(null)
    setRecordOpen(true)
  }

  function onRecordSubmit(values: AdminRecordPaymentInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await adminRecordPaymentAction(values)
      if (result.success) {
        setRecordOpen(false)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function handleVerify(pay: PaymentDetailView) {
    setFeedback(null)
    startTransition(async () => {
      const result = await adminVerifyPaymentAction(pay.ticket_id, pay.payment_id)
      if (result.success) {
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function handleCancel(paymentId: string) {
    setFeedback(null)
    startTransition(async () => {
      const result = await adminCancelPaymentAction(paymentId)
      if (result.success) {
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  const filtered = payments.filter((p) => {
    if (statusFilter !== 'all' && p.payment_status !== statusFilter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      p.payment_id.toLowerCase().includes(q) ||
      p.ticket_id.toLowerCase().includes(q) ||
      (p.reference_no ?? '').toLowerCase().includes(q) ||
      `${p.customer_first_name} ${p.customer_last_name}`.toLowerCase().includes(q)
    )
  })

  function handleExportCsv() {
    const header = [
      'Payment ID',
      'Ticket ID',
      'Customer',
      'Method',
      'Amount PHP',
      'Reference No',
      'Payment Date',
      'Status',
    ]
    const rows = filtered.map((p) => [
      p.payment_id,
      p.ticket_id,
      `${p.customer_first_name} ${p.customer_last_name}`,
      p.payment_method,
      String(p.amount_php),
      p.reference_no ?? '',
      p.payment_date,
      p.payment_status,
    ])
    const csv = [header, ...rows]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `spindle-payments-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Payments &amp; Verification Ledger</CardTitle>
          <CardDescription>
            Verify GCash, Maya, QR Ph, bank transfer, and cash collections. Full settlement automatically completes repair tickets.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Export CSV</span>
          </Button>
          <Button onClick={openRecordModal} disabled={activeTickets.length === 0}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Record Payment</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedback && !recordOpen && <FormBanner type={feedback.type} message={feedback.message} />}

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
              placeholder="Search payment ID, ticket, ref #, customer..."
              aria-label="Search payment ledger"
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Filter by payment status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {PAYMENT_STATUSES.map((st) => (
                <SelectItem key={st} value={st}>
                  {humanizeLabel(st)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {payments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payment transactions yet"
            description="Customer payments and field technician collections will populate this verification ledger."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching payments"
            description="No entries match your search or status filter."
          />
        ) : (
          <Table regionLabel="Master PHP payment ledger">
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>Ticket &amp; Customer</TableHead>
                <TableHead>Method &amp; Ref No.</TableHead>
                <TableHead>Amount (PHP)</TableHead>
                <TableHead>Collected By / Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((pay) => (
                <TableRow key={pay.payment_id}>
                  <TableCell className="font-mono text-xs font-semibold text-primary">
                    {pay.payment_id}
                  </TableCell>
                  <TableCell>
                    <p className="font-mono text-xs font-semibold">{pay.ticket_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {pay.customer_first_name} {pay.customer_last_name}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{pay.payment_method}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {pay.reference_no || 'No ref'}
                      {pay.installment_no ? ` · Inst #${pay.installment_no}` : ''}
                    </p>
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">
                    {formatPHP(pay.amount_php)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <p>
                      {pay.received_by_first_name
                        ? `${pay.received_by_first_name} ${pay.received_by_last_name}`
                        : 'Customer Portal'}
                    </p>
                    <p>{formatManilaDate(pay.payment_date)}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={pay.payment_status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {pay.payment_status === 'pending_verification' && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={isPending}
                          onClick={() => handleVerify(pay)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Verify</span>
                        </Button>
                      )}
                      {pay.payment_status !== 'cancelled' && (
                        <ConfirmationDialog
                          trigger={
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              aria-label={`Cancel payment ${pay.payment_id}`}
                            >
                              <XCircle className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                            </Button>
                          }
                          title={`Cancel payment entry ${pay.payment_id}?`}
                          description="Marks this payment entry as cancelled and excludes it from verified PHP totals."
                          confirmLabel="Cancel Payment"
                          isPending={isPending}
                          onConfirm={() => handleCancel(pay.payment_id)}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment Entry</DialogTitle>
            <DialogDescription>
              Log a walk-in or digital payment via the atomic ledger RPC.
            </DialogDescription>
          </DialogHeader>

          {feedback && recordOpen && <FormBanner type={feedback.type} message={feedback.message} />}

          <form onSubmit={form.handleSubmit(onRecordSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="adm-pay-ticket">Repair Ticket</Label>
              <Controller
                name="ticket_id"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="adm-pay-ticket">
                      <SelectValue placeholder="Select repair ticket" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTickets.map((t) => (
                        <SelectItem key={t.ticket_id} value={t.ticket_id}>
                          {t.ticket_id} — {t.customer_first_name} {t.customer_last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="adm-pay-method">Payment Method</Label>
                <Controller
                  name="payment_method"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="adm-pay-method">
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
                <Label htmlFor="adm-pay-amount">Amount (PHP)</Label>
                <Input
                  id="adm-pay-amount"
                  type="number"
                  step="0.01"
                  min="1"
                  {...form.register('amount_php', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="adm-pay-ref">Reference No.</Label>
                <Input id="adm-pay-ref" {...form.register('reference_no')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-pay-inst">Installment No.</Label>
                <Input
                  id="adm-pay-inst"
                  type="number"
                  min="1"
                  {...form.register('installment_no', {
                    setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                  })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adm-pay-rem">Remarks</Label>
              <Input id="adm-pay-rem" {...form.register('remarks')} />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Controller
                name="verify_immediately"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                )}
              />
              <span>Verify immediately and settle ticket balance if paid in full</span>
            </label>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRecordOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>Save Payment</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
