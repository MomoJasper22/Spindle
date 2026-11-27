'use client'

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Laptop, Loader2, Pencil, Plus, Search, ShieldCheck, Trash2, XCircle } from 'lucide-react'
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
import { ApplianceIcon, ApplianceTypePicker } from '@/components/shared/appliance-icons'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { FormBanner } from '@/components/shared/form-banner'
import { ScrollableList } from '@/components/shared/scrollable-list'
import { StatusBadge } from '@/components/shared/status-badge'
import {
  APPLIANCE_BRAND_SUGGESTIONS,
  REGISTRATION_STATUSES,
  getDefaultApplianceIcon,
} from '@/lib/constants'
import { formatFullName, formatManilaDate, humanizeLabel } from '@/lib/formatters'
import type { CustomerApplianceRow, UserWithRole } from '@/types/database'
import {
  adminDeleteApplianceAction,
  adminSetApplianceStatusAction,
  adminUpsertApplianceAction,
} from '../actions/admin-actions'
import { adminApplianceSchema, type AdminApplianceInput } from '../schemas/admin-schemas'

interface AppliancesPanelProps {
  appliances: CustomerApplianceRow[]
  users: UserWithRole[]
}

export function AdminAppliancesPanel({ appliances, users }: AppliancesPanelProps) {
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<CustomerApplianceRow | null>(null)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const customers = users.filter((u) => u.user_type_id === 'UTP-CUST')
  const userById = new Map(users.map((u) => [u.user_id, u]))

  const form = useForm<AdminApplianceInput>({
    resolver: zodResolver(adminApplianceSchema),
    mode: 'onBlur',
    defaultValues: {
      customer_id: customers[0]?.user_id ?? '',
      brand: '',
      category: '' as AdminApplianceInput['category'],
      model_number: '',
      serial_number: '',
      purchase_date: '',
      registration_status: 'verified',
      notes: '',
    },
  })

  function openCreate() {
    setEditing(null)
    form.reset({
      customer_id: customers[0]?.user_id ?? '',
      brand: '',
      category: '' as AdminApplianceInput['category'],
      model_number: '',
      serial_number: '',
      purchase_date: '',
      registration_status: 'verified',
      notes: '',
    })
    setFeedback(null)
    setDialogOpen(true)
  }

  function openEdit(item: CustomerApplianceRow) {
    setEditing(item)
    form.reset({
      customer_id: item.customer_id,
      brand: item.brand,
      category: item.category as AdminApplianceInput['category'],
      model_number: item.model_number,
      serial_number: item.serial_number,
      purchase_date: item.purchase_date ?? '',
      registration_status: item.registration_status,
      notes: item.notes ?? '',
    })
    setFeedback(null)
    setDialogOpen(true)
  }

  function onSubmit(values: AdminApplianceInput) {
    setFeedback(null)
    const payload: AdminApplianceInput = {
      ...values,
      icon: getDefaultApplianceIcon(values.category),
    }
    startTransition(async () => {
      const result = await adminUpsertApplianceAction(payload, editing?.appliance_id)
      if (result.success) {
        setDialogOpen(false)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function handleStatusChange(applianceId: string, status: 'verified' | 'cancelled') {
    setFeedback(null)
    startTransition(async () => {
      const result = await adminSetApplianceStatusAction(applianceId, status)
      if (result.success) {
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function handleDelete(applianceId: string) {
    setFeedback(null)
    startTransition(async () => {
      const result = await adminDeleteApplianceAction(applianceId)
      if (result.success) {
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  const filtered = appliances.filter((a) => {
    if (statusFilter !== 'all' && a.registration_status !== statusFilter) return false
    const owner = userById.get(a.customer_id)
    const ownerName = owner ? formatFullName(owner).toLowerCase() : ''
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      a.appliance_id.toLowerCase().includes(q) ||
      a.brand.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.model_number.toLowerCase().includes(q) ||
      a.serial_number.toLowerCase().includes(q) ||
      ownerName.includes(q)
    )
  })

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Appliance Registrations &amp; Master Data</CardTitle>
          <CardDescription>
            Inspect customer appliance registrations across branches, verify serial numbers, or update master records.
          </CardDescription>
        </div>
        <Button onClick={openCreate} disabled={customers.length === 0}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add Appliance Record</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedback && !dialogOpen && <FormBanner type={feedback.type} message={feedback.message} />}

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
              placeholder="Search serial, model, brand, customer..."
              aria-label="Search appliances"
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Filter registration status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {REGISTRATION_STATUSES.map((st) => (
                <SelectItem key={st} value={st}>
                  {humanizeLabel(st)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {appliances.length === 0 ? (
          <EmptyState
            icon={Laptop}
            title="No appliance registrations yet"
            description="Appliances registered by customers or logged by administrators will appear here."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching appliances"
            description="Try a different serial number, brand, or status filter."
          />
        ) : (
          <>
            <ScrollableList regionLabel="Master appliance registrations list" className="md:hidden p-0.5 pr-1">
              <div className="space-y-3">
                {filtered.map((item) => {
                const owner = userById.get(item.customer_id)
                return (
                  <div key={item.appliance_id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-primary-tint/35 p-1">
                          <ApplianceIcon icon={item.icon} category={item.category} className="h-7 w-7" />
                        </div>
                        <div>
                          <span className="font-mono text-xs font-semibold text-primary">
                            {item.appliance_id}
                          </span>
                          <p className="mt-0.5 font-semibold text-foreground">
                            {item.brand} &middot; {item.model_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.category} &middot; SN {item.serial_number}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={item.registration_status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Owner: <span className="font-medium text-foreground">{owner ? formatFullName(owner) : item.customer_id}</span>
                      {owner?.branch_location ? ` · ${owner.branch_location}` : ''}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
                      {item.registration_status !== 'verified' && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleStatusChange(item.appliance_id, 'verified')}
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                          <span>Verify</span>
                        </Button>
                      )}
                      <Button type="button" size="sm" variant="outline" onClick={() => openEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Edit</span>
                      </Button>
                      <ConfirmationDialog
                        trigger={
                          <Button type="button" size="sm" variant="ghost" aria-label={`Delete ${item.appliance_id}`}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                          </Button>
                        }
                        title={`Delete appliance ${item.appliance_id}?`}
                        description="Permanent deletion succeeds only when no repair tickets reference this appliance."
                        confirmLabel="Delete Record"
                        isPending={isPending}
                        onConfirm={() => handleDelete(item.appliance_id)}
                      />
                    </div>
                  </div>
                )
                })}
              </div>
            </ScrollableList>

            <div className="hidden md:block">
              <Table regionLabel="Master appliance registrations">
                <TableHeader>
                  <TableRow>
                    <TableHead>Appliance ID</TableHead>
                    <TableHead>Owner &amp; Branch</TableHead>
                    <TableHead>Unit Details</TableHead>
                    <TableHead>Serial &amp; Purchase</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => {
                    const owner = userById.get(item.customer_id)
                    return (
                      <TableRow key={item.appliance_id}>
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {item.appliance_id}
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-foreground">
                            {owner ? formatFullName(owner) : item.customer_id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {owner?.branch_location || '—'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-primary-tint/35 p-1">
                              <ApplianceIcon icon={item.icon} category={item.category} className="h-7 w-7" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {item.brand} &middot; {item.model_number}
                              </p>
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-mono text-xs">{item.serial_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.purchase_date ? formatManilaDate(item.purchase_date) : 'No purchase date'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={item.registration_status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            {item.registration_status !== 'verified' && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => handleStatusChange(item.appliance_id, 'verified')}
                              >
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                                <span>Verify</span>
                              </Button>
                            )}
                            {item.registration_status !== 'cancelled' && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={isPending}
                                onClick={() => handleStatusChange(item.appliance_id, 'cancelled')}
                                aria-label={`Cancel ${item.appliance_id}`}
                              >
                                <XCircle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => openEdit(item)}
                              aria-label={`Edit ${item.appliance_id}`}
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                            <ConfirmationDialog
                              trigger={
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  aria-label={`Delete ${item.appliance_id}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                                </Button>
                              }
                              title={`Delete appliance ${item.appliance_id}?`}
                              description="Permanent deletion succeeds only when no repair tickets reference this appliance."
                              confirmLabel="Delete Record"
                              isPending={isPending}
                              onConfirm={() => handleDelete(item.appliance_id)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit Appliance (${editing.appliance_id})` : 'Add Master Appliance Record'}
            </DialogTitle>
            <DialogDescription>
              Manage customer appliance registration records and serial verification.
            </DialogDescription>
          </DialogHeader>

          {feedback && dialogOpen && <FormBanner type={feedback.type} message={feedback.message} />}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="adm-app-cust">Customer</Label>
              <Controller
                name="customer_id"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="adm-app-cust">
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
              <Label htmlFor="adm-app-brand">Brand</Label>
              <Input id="adm-app-brand" list="adm-brands" {...form.register('brand')} />
              <datalist id="adm-brands">
                {APPLIANCE_BRAND_SUGGESTIONS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              {form.formState.errors.brand && (
                <p role="alert" className="text-xs text-destructive">
                  {form.formState.errors.brand.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adm-app-cat" className="block">
                Appliance Type
              </Label>
              <Controller
                name="category"
                control={form.control}
                render={({ field }) => (
                  <ApplianceTypePicker
                    id="adm-app-cat"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Pick Appliances"
                    ariaInvalid={Boolean(form.formState.errors.category)}
                  />
                )}
              />
              {form.formState.errors.category && (
                <p role="alert" className="text-xs text-destructive">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="adm-app-model">Model Number</Label>
                <Input id="adm-app-model" {...form.register('model_number')} />
                {form.formState.errors.model_number && (
                  <p role="alert" className="text-xs text-destructive">
                    {form.formState.errors.model_number.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-app-serial">Serial Number</Label>
                <Input id="adm-app-serial" {...form.register('serial_number')} />
                {form.formState.errors.serial_number && (
                  <p role="alert" className="text-xs text-destructive">
                    {form.formState.errors.serial_number.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="adm-app-date">Purchase Date</Label>
                <Input id="adm-app-date" type="date" {...form.register('purchase_date')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-app-status">Registration Status</Label>
                <Controller
                  name="registration_status"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="adm-app-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REGISTRATION_STATUSES.map((st) => (
                          <SelectItem key={st} value={st}>
                            {humanizeLabel(st)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adm-app-notes">Notes</Label>
              <Textarea id="adm-app-notes" {...form.register('notes')} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>{editing ? 'Update Appliance' : 'Save Appliance'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
