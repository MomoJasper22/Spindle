'use client'

import * as React from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreditCard, Loader2, MapPin, Phone, Save, Wrench } from 'lucide-react'
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
import { PAYMENT_METHODS } from '@/lib/constants'
import { formatAddress, formatPHPhone, formatPHP, humanizeLabel } from '@/lib/formatters'
import type { RepairDetailView } from '@/types/database'
import {
  recordOnsitePaymentAction,
  updateTechnicianRepairAction,
} from '../actions/technician-actions'
import {
  technicianPaymentSchema,
  technicianRepairUpdateSchema,
  type TechnicianPaymentInput,
  type TechnicianRepairUpdateInput,
} from '../schemas/technician-schemas'

interface DiagnosticDrawerProps {
  ticket: RepairDetailView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TECH_ALLOWED_STATUSES = [
  'confirmed',
  'assigned',
  'in_progress',
  'awaiting_payment',
  'completed',
] as const

export function DiagnosticDrawer({ ticket, open, onOpenChange }: DiagnosticDrawerProps) {
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const safeStatus =
    ticket && TECH_ALLOWED_STATUSES.includes(ticket.status as (typeof TECH_ALLOWED_STATUSES)[number])
      ? (ticket.status as TechnicianRepairUpdateInput['status'])
      : 'assigned'

  const repairForm = useForm<TechnicianRepairUpdateInput>({
    resolver: zodResolver(technicianRepairUpdateSchema),
    mode: 'onBlur',
    defaultValues: {
      ticket_id: ticket?.ticket_id ?? '',
      status: safeStatus,
      diagnostic_notes: ticket?.diagnostic_notes ?? '',
      estimated_cost_php: Number(ticket?.estimated_cost_php ?? 0),
      final_cost_php:
        ticket?.final_cost_php !== null && ticket?.final_cost_php !== undefined
          ? Number(ticket.final_cost_php)
          : null,
    },
  })

  const targetCost = ticket?.final_cost_php ?? ticket?.estimated_cost_php ?? 0
  const initialBalance = Math.max(0, Number(targetCost) - Number(ticket?.verified_paid_php ?? 0))

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

  const selectedMethod = useWatch({ control: paymentForm.control, name: 'payment_method' })

  function onRepairSubmit(values: TechnicianRepairUpdateInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await updateTechnicianRepairAction(values)
      if (result.success) {
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function onPaymentSubmit(values: TechnicianPaymentInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await recordOnsitePaymentAction(values)
      if (result.success) {
        setFeedback({ type: 'success', message: result.message })
        paymentForm.setValue('reference_no', '')
        paymentForm.setValue('remarks', '')
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  if (!ticket) return null

  const customerAddress = formatAddress({
    street: ticket.customer_address_street,
    barangay: ticket.customer_address_barangay,
    city: ticket.customer_address_city,
    province: ticket.customer_address_province,
    zip: ticket.customer_address_zip_code,
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(36rem,96dvw)] space-y-5">
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-primary">{ticket.ticket_id}</span>
            <StatusBadge status={ticket.status} />
            <StatusBadge status={ticket.priority} showIcon={false} />
          </div>
          <SheetTitle>
            {ticket.appliance_brand} {ticket.appliance_category}
          </SheetTitle>
          <SheetDescription>
            Model {ticket.appliance_model_number} &middot; Serial{' '}
            <span className="font-mono">{ticket.appliance_serial_number}</span>
          </SheetDescription>
        </SheetHeader>

        {feedback && <FormBanner type={feedback.type} message={feedback.message} />}

        {/* Customer & Issue Context */}
        <div className="rounded-lg border border-border bg-slate-50 p-4 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-foreground">
              {ticket.customer_first_name} {ticket.customer_last_name}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {formatPHPhone(ticket.customer_phone)}
            </span>
          </div>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{customerAddress}</span>
          </p>
          <p className="pt-1 text-xs text-foreground">
            <span className="font-semibold">Reported Issue ({humanizeLabel(ticket.service_type)}):</span>{' '}
            {ticket.issue_description}
          </p>
          <div className="flex flex-wrap gap-4 pt-1 text-xs text-muted-foreground tabular-nums">
            <span>Verified Paid: <strong className="text-emerald-700">{formatPHP(ticket.verified_paid_php)}</strong></span>
            <span>Pending Verification: <strong className="text-amber-700">{formatPHP(ticket.pending_paid_php)}</strong></span>
          </div>
        </div>

        {/* Diagnostic & Cost Update Form */}
        <form onSubmit={repairForm.handleSubmit(onRepairSubmit)} className="space-y-4" noValidate>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Wrench className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Diagnostics &amp; Stage Progression</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="diag-status">Repair Status</Label>
            <Controller
              name="status"
              control={repairForm.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="diag-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TECH_ALLOWED_STATUSES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {humanizeLabel(st)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="diag-notes">Diagnostic &amp; Repair Notes</Label>
            <Textarea
              id="diag-notes"
              rows={3}
              placeholder="Document fault findings, capacitor/compressor checks, cleaning performed..."
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
                {...repairForm.register('estimated_cost_php', { valueAsNumber: true })}
              />
              {repairForm.formState.errors.estimated_cost_php && (
                <p role="alert" className="text-xs text-destructive">
                  {repairForm.formState.errors.estimated_cost_php.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="diag-final-cost">Final Cost (PHP)</Label>
              <Input
                id="diag-final-cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="Set once diagnosed"
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

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            <span>Save Diagnostics &amp; Status</span>
          </Button>
        </form>

        <Separator />

        {/* On-Site Payment Recording */}
        <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4" noValidate>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CreditCard className="h-4 w-4 text-secondary" aria-hidden="true" />
            <span>Record On-Site Field Payment</span>
          </div>

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
                placeholder="Receipt or digital ref #"
                {...paymentForm.register('reference_no')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tech-pay-inst">Installment No. (optional)</Label>
              <Input
                id="tech-pay-inst"
                type="number"
                min="1"
                {...paymentForm.register('installment_no', {
                  setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tech-pay-remarks">Collection remarks</Label>
            <Input
              id="tech-pay-remarks"
              placeholder="Collected on-site from customer"
              {...paymentForm.register('remarks')}
            />
          </div>

          <Button type="submit" variant="secondary" disabled={isPending} className="w-full">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <span>Record Field Payment</span>
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
