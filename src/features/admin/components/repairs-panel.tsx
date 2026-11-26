'use client'

import * as React from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Pencil, Plus, Search, Wrench, XCircle } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { FormBanner } from '@/components/shared/form-banner'
import { StatusBadge } from '@/components/shared/status-badge'
import {
  REPAIR_PRIORITIES,
  REPAIR_STATUSES,
  SERVICE_BRANCHES,
  SERVICE_TYPES,
  TIME_SLOTS,
} from '@/lib/constants'
import {
  formatAddress,
  formatFullName,
  formatManilaDate,
  formatPHP,
  getManilaTodayISO,
  humanizeLabel,
} from '@/lib/formatters'
import type { CustomerApplianceRow, RepairDetailView, UserWithRole } from '@/types/database'
import { adminCreateRepairAction, adminUpdateRepairAction } from '../actions/admin-actions'
import {
  adminCreateRepairSchema,
  adminUpdateRepairSchema,
  type AdminCreateRepairInput,
  type AdminUpdateRepairInput,
} from '../schemas/admin-schemas'

interface AdminRepairsPanelProps {
  repairs: RepairDetailView[]
  users: UserWithRole[]
  appliances: CustomerApplianceRow[]
}

export function AdminRepairsPanel({ repairs, users, appliances }: AdminRepairsPanelProps) {
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [branchFilter, setBranchFilter] = React.useState('all')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<RepairDetailView | null>(null)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const customers = users.filter((u) => u.user_type_id === 'UTP-CUST' && u.is_active)
  const todayISO = getManilaTodayISO()

  const createForm = useForm<AdminCreateRepairInput>({
    resolver: zodResolver(adminCreateRepairSchema),
    mode: 'onBlur',
    defaultValues: {
      customer_id: customers[0]?.user_id ?? '',
      appliance_id: '',
      service_type: 'repair',
      priority: 'normal',
      issue_description: '',
      scheduled_date: todayISO,
      time_slot: TIME_SLOTS[0],
      service_address: '',
      remarks: '',
    },
  })

  const editForm = useForm<AdminUpdateRepairInput>({
    resolver: zodResolver(adminUpdateRepairSchema),
    mode: 'onBlur',
    defaultValues: {
      ticket_id: '',
      status: 'pending',
      priority: 'normal',
      diagnostic_notes: '',
      estimated_cost_php: 0,
      final_cost_php: null,
    },
  })

  const selectedCustomerId = useWatch({ control: createForm.control, name: 'customer_id' })
  const customerAppliances = appliances.filter(
    (a) => a.customer_id === selectedCustomerId && a.registration_status !== 'cancelled'
  )

  function openCreate() {
    const firstCustomer = customers[0]
    const firstApp = appliances.find(
      (a) => a.customer_id === firstCustomer?.user_id && a.registration_status !== 'cancelled'
    )
    const addr = firstCustomer
      ? formatAddress({
          street: firstCustomer.address_street,
          barangay: firstCustomer.address_barangay,
          city: firstCustomer.address_city,
          province: firstCustomer.address_province,
          zip: firstCustomer.address_zip_code,
        })
      : ''
    createForm.reset({
      customer_id: firstCustomer?.user_id ?? '',
      appliance_id: firstApp?.appliance_id ?? '',
      service_type: 'repair',
      priority: 'normal',
      issue_description: '',
      scheduled_date: todayISO,
      time_slot: TIME_SLOTS[0],
      service_address: addr === '—' ? '' : addr,
      remarks: '',
    })
    setFeedback(null)
    setCreateOpen(true)
  }

  function handleCustomerChange(customerId: string) {
    createForm.setValue('customer_id', customerId)
    const cust = customers.find((c) => c.user_id === customerId)
    const custApp = appliances.find(
      (a) => a.customer_id === customerId && a.registration_status !== 'cancelled'
    )
    createForm.setValue('appliance_id', custApp?.appliance_id ?? '')
    if (cust) {
      const addr = formatAddress({
        street: cust.address_street,
        barangay: cust.address_barangay,
        city: cust.address_city,
        province: cust.address_province,
        zip: cust.address_zip_code,
      })
      createForm.setValue('service_address', addr === '—' ? '' : addr)
    }
  }

  function openEdit(ticket: RepairDetailView) {
    setEditing(ticket)
    editForm.reset({
      ticket_id: ticket.ticket_id,
      status: ticket.status,
      priority: ticket.priority,
      diagnostic_notes: ticket.diagnostic_notes ?? '',
      estimated_cost_php: Number(ticket.estimated_cost_php ?? 0),
      final_cost_php: ticket.final_cost_php !== null ? Number(ticket.final_cost_php) : null,
    })
    setFeedback(null)
  }

  function onCreateSubmit(values: AdminCreateRepairInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await adminCreateRepairAction(values)
      if (result.success) {
        setCreateOpen(false)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function onEditSubmit(values: AdminUpdateRepairInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await adminUpdateRepairAction(values)
      if (result.success) {
        setEditing(null)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function handleCancelTicket(ticket: RepairDetailView) {
    setFeedback(null)
    startTransition(async () => {
      const result = await adminUpdateRepairAction({
        ticket_id: ticket.ticket_id,
        status: 'cancelled',
        priority: ticket.priority,
        diagnostic_notes: ticket.diagnostic_notes ?? '',
        estimated_cost_php: Number(ticket.estimated_cost_php ?? 0),
        final_cost_php: ticket.final_cost_php !== null ? Number(ticket.final_cost_php) : null,
      })
      if (result.success) {
        setFeedback({ type: 'success', message: `Cancelled ticket ${ticket.ticket_id}.` })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  const filtered = repairs.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (branchFilter !== 'all' && r.customer_branch !== branchFilter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      r.ticket_id.toLowerCase().includes(q) ||
      `${r.customer_first_name} ${r.customer_last_name}`.toLowerCase().includes(q) ||
      `${r.technician_first_name ?? ''} ${r.technician_last_name ?? ''}`.toLowerCase().includes(q) ||
      r.appliance_brand.toLowerCase().includes(q) ||
      r.appliance_serial_number.toLowerCase().includes(q)
    )
  })

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Repair Transactions Oversight</CardTitle>
          <CardDescription>
            Master multi-table view of customer repairs, assigned technicians, appliances, and PHP billing.
          </CardDescription>
        </div>
        <Button onClick={openCreate} disabled={customers.length === 0}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Create Walk-In Ticket</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedback && !createOpen && !editing && (
          <FormBanner type={feedback.type} message={feedback.message} />
        )}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticket ID, customer, technician, serial..."
              aria-label="Search repair transactions"
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter by status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {REPAIR_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {humanizeLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-full sm:w-64" aria-label="Filter by branch">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {SERVICE_BRANCHES.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {repairs.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No repair transactions yet"
            description="Create a walk-in ticket or wait for customer service requests to populate the operations ledger."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching repair tickets"
            description="No tickets match your current filters."
          />
        ) : (
          <Table regionLabel="Master repair transactions">
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Customer &amp; Branch</TableHead>
                <TableHead>Appliance</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Status &amp; Priority</TableHead>
                <TableHead>Cost &amp; Paid</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.ticket_id}>
                  <TableCell>
                    <p className="font-mono text-xs font-semibold text-primary">{t.ticket_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatManilaDate(t.scheduled_date)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-foreground">
                      {t.customer_first_name} {t.customer_last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{t.customer_branch || '—'}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {t.appliance_brand} {t.appliance_model_number}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {t.appliance_serial_number}
                    </p>
                  </TableCell>
                  <TableCell>
                    {t.technician_first_name ? (
                      <span className="font-medium">
                        {t.technician_first_name} {t.technician_last_name}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-700 font-medium">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={t.status} />
                      <StatusBadge status={t.priority} showIcon={false} />
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums text-xs">
                    <p>Est: {formatPHP(t.estimated_cost_php)}</p>
                    <p className="font-semibold">
                      Final: {t.final_cost_php !== null ? formatPHP(t.final_cost_php) : '—'}
                    </p>
                    <p className="text-emerald-700">Paid: {formatPHP(t.verified_paid_php)}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(t)}
                        aria-label={`Edit ${t.ticket_id}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      {t.status !== 'cancelled' && t.status !== 'completed' && (
                        <ConfirmationDialog
                          trigger={
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              aria-label={`Cancel ${t.ticket_id}`}
                            >
                              <XCircle className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                            </Button>
                          }
                          title={`Cancel repair ticket ${t.ticket_id}?`}
                          description="Marks this repair ticket and its active appointments as cancelled."
                          confirmLabel="Cancel Ticket"
                          isPending={isPending}
                          onConfirm={() => handleCancelTicket(t)}
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

      {/* Create Walk-In Ticket Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Walk-In / Phone-In Repair Ticket</DialogTitle>
            <DialogDescription>
              Books a repair ticket and initial appointment atomically on behalf of a customer.
            </DialogDescription>
          </DialogHeader>

          {feedback && createOpen && <FormBanner type={feedback.type} message={feedback.message} />}

          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="adm-r-cust">Customer</Label>
                <Controller
                  name="customer_id"
                  control={createForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={handleCustomerChange}>
                      <SelectTrigger id="adm-r-cust">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.user_id} value={c.user_id}>
                            {formatFullName(c)} ({c.user_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adm-r-app">Customer Appliance</Label>
                <Controller
                  name="appliance_id"
                  control={createForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="adm-r-app">
                        <SelectValue placeholder="Select appliance" />
                      </SelectTrigger>
                      <SelectContent>
                        {customerAppliances.map((a) => (
                          <SelectItem key={a.appliance_id} value={a.appliance_id}>
                            {a.brand} {a.model_number} ({a.serial_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {createForm.formState.errors.appliance_id && (
                  <p role="alert" className="text-xs text-destructive">
                    {createForm.formState.errors.appliance_id.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="adm-r-type">Service Type</Label>
                <Controller
                  name="service_type"
                  control={createForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="adm-r-type">
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
                <Label htmlFor="adm-r-prio">Priority</Label>
                <Controller
                  name="priority"
                  control={createForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="adm-r-prio">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REPAIR_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {humanizeLabel(p)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="adm-r-date">Scheduled Date</Label>
                <Input
                  id="adm-r-date"
                  type="date"
                  min={todayISO}
                  {...createForm.register('scheduled_date')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adm-r-slot">Time Slot</Label>
                <Controller
                  name="time_slot"
                  control={createForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="adm-r-slot">
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
              <Label htmlFor="adm-r-issue">Issue Description</Label>
              <Textarea id="adm-r-issue" {...createForm.register('issue_description')} />
              {createForm.formState.errors.issue_description && (
                <p role="alert" className="text-xs text-destructive">
                  {createForm.formState.errors.issue_description.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adm-r-addr">Service Address</Label>
              <Textarea id="adm-r-addr" rows={2} {...createForm.register('service_address')} />
              {createForm.formState.errors.service_address && (
                <p role="alert" className="text-xs text-destructive">
                  {createForm.formState.errors.service_address.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>Create Ticket</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Repair Ticket Modal */}
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Repair Ticket ({editing?.ticket_id})</DialogTitle>
            <DialogDescription>
              Adjust ticket status, priority, diagnostic notes, and PHP cost estimates.
            </DialogDescription>
          </DialogHeader>

          {feedback && editing && <FormBanner type={feedback.type} message={feedback.message} />}

          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="adm-er-status">Status</Label>
                <Controller
                  name="status"
                  control={editForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="adm-er-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REPAIR_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {humanizeLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-er-prio">Priority</Label>
                <Controller
                  name="priority"
                  control={editForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="adm-er-prio">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REPAIR_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {humanizeLabel(p)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="adm-er-est">Estimated Cost (PHP)</Label>
                <Input
                  id="adm-er-est"
                  type="number"
                  step="0.01"
                  min="0"
                  {...editForm.register('estimated_cost_php', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-er-final">Final Cost (PHP)</Label>
                <Input
                  id="adm-er-final"
                  type="number"
                  step="0.01"
                  min="0"
                  {...editForm.register('final_cost_php', {
                    setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                  })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adm-er-notes">Diagnostic Notes</Label>
              <Textarea id="adm-er-notes" rows={3} {...editForm.register('diagnostic_notes')} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>Save Changes</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
