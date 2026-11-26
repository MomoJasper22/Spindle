'use client'

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Laptop, Loader2, Pencil, Plus, Search, Trash2, XCircle } from 'lucide-react'
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
import { APPLIANCE_BRAND_SUGGESTIONS, APPLIANCE_CATEGORIES } from '@/lib/constants'
import { formatManilaDate } from '@/lib/formatters'
import type { CustomerApplianceRow } from '@/types/database'
import {
  createApplianceAction,
  deleteOrCancelApplianceAction,
  updateApplianceAction,
} from '../actions/customer-actions'
import { applianceSchema, type ApplianceInput } from '../schemas/customer-schemas'

interface AppliancesPanelProps {
  appliances: CustomerApplianceRow[]
}

export function AppliancesPanel({ appliances }: AppliancesPanelProps) {
  const [search, setSearch] = React.useState('')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingAppliance, setEditingAppliance] = React.useState<CustomerApplianceRow | null>(null)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplianceInput>({
    resolver: zodResolver(applianceSchema),
    mode: 'onBlur',
    defaultValues: {
      brand: '',
      category: APPLIANCE_CATEGORIES[0],
      model_number: '',
      serial_number: '',
      purchase_date: '',
      notes: '',
    },
  })

  function openCreateDialog() {
    setEditingAppliance(null)
    reset({
      brand: '',
      category: APPLIANCE_CATEGORIES[0],
      model_number: '',
      serial_number: '',
      purchase_date: '',
      notes: '',
    })
    setFeedback(null)
    setDialogOpen(true)
  }

  function openEditDialog(item: CustomerApplianceRow) {
    setEditingAppliance(item)
    reset({
      brand: item.brand,
      category: item.category as ApplianceInput['category'],
      model_number: item.model_number,
      serial_number: item.serial_number,
      purchase_date: item.purchase_date ?? '',
      notes: item.notes ?? '',
    })
    setFeedback(null)
    setDialogOpen(true)
  }

  function onSubmit(values: ApplianceInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = editingAppliance
        ? await updateApplianceAction(editingAppliance.appliance_id, values)
        : await createApplianceAction(values)

      if (result.success) {
        setDialogOpen(false)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function handleRemove(applianceId: string, mode: 'cancel' | 'delete') {
    setFeedback(null)
    startTransition(async () => {
      const result = await deleteOrCancelApplianceAction(applianceId, mode)
      if (result.success) {
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  const filtered = appliances.filter((a) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      a.appliance_id.toLowerCase().includes(q) ||
      a.brand.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.model_number.toLowerCase().includes(q) ||
      a.serial_number.toLowerCase().includes(q)
    )
  })

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>My Registered Appliances</CardTitle>
          <CardDescription>
            Register home or commercial appliances before scheduling diagnostic or repair visits.
          </CardDescription>
        </div>
        <Button onClick={openCreateDialog} className="shrink-0">
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Register Appliance</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedback && !dialogOpen && (
          <FormBanner type={feedback.type} message={feedback.message} />
        )}

        <div className="relative max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brand, category, model, or serial..."
            aria-label="Search registered appliances"
            className="pl-9"
          />
        </div>

        {appliances.length === 0 ? (
          <EmptyState
            icon={Laptop}
            title="No appliances registered yet"
            description="Add your aircon, refrigerator, washing machine, or kitchen appliance to start booking repairs."
            action={
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Register First Appliance</span>
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching appliances"
            description="No appliances matched your search query. Try another brand, model, or serial number."
          />
        ) : (
          <Table regionLabel="Registered customer appliances">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Appliance</TableHead>
                <TableHead>Model &amp; Serial</TableHead>
                <TableHead>Purchased</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.appliance_id}>
                  <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                    {item.appliance_id}
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-foreground">{item.brand}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{item.model_number}</p>
                    <p className="font-mono text-xs text-muted-foreground">{item.serial_number}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {item.purchase_date ? formatManilaDate(item.purchase_date) : '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.registration_status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                        aria-label={`Edit ${item.brand} ${item.model_number}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="sr-only sm:not-sr-only">Edit</span>
                      </Button>

                      {item.registration_status !== 'cancelled' && (
                        <ConfirmationDialog
                          trigger={
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              aria-label={`Cancel registration for ${item.appliance_id}`}
                            >
                              <XCircle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                            </Button>
                          }
                          title="Cancel appliance registration?"
                          description={`Mark ${item.brand} ${item.model_number} (${item.serial_number}) as cancelled? New repairs cannot be booked for cancelled units.`}
                          confirmLabel="Cancel Registration"
                          isPending={isPending}
                          onConfirm={() => handleRemove(item.appliance_id, 'cancel')}
                        />
                      )}

                      <ConfirmationDialog
                        trigger={
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={`Delete ${item.appliance_id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                          </Button>
                        }
                        title="Delete appliance registration?"
                        description={`Permanently delete ${item.brand} ${item.model_number}? This only succeeds if no repair tickets are linked to this unit.`}
                        confirmLabel="Delete Unit"
                        isPending={isPending}
                        onConfirm={() => handleRemove(item.appliance_id, 'delete')}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAppliance ? 'Update Appliance Details' : 'Register New Appliance'}
            </DialogTitle>
            <DialogDescription>
              Provide your appliance model and serial details for fast technician diagnostics.
            </DialogDescription>
          </DialogHeader>

          {feedback && dialogOpen && <FormBanner type={feedback.type} message={feedback.message} />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="app-brand">
                  Brand <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="app-brand"
                  list="ph-appliance-brands"
                  placeholder="e.g. Carrier, LG, Panasonic"
                  aria-invalid={Boolean(errors.brand)}
                  {...register('brand')}
                />
                <datalist id="ph-appliance-brands">
                  {APPLIANCE_BRAND_SUGGESTIONS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
                {errors.brand && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {errors.brand.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="app-category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="app-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {APPLIANCE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {errors.category.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="app-model">
                  Model number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="app-model"
                  placeholder="e.g. FP-53KCV010"
                  aria-invalid={Boolean(errors.model_number)}
                  {...register('model_number')}
                />
                {errors.model_number && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {errors.model_number.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="app-serial">
                  Serial number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="app-serial"
                  placeholder="e.g. SN-PH-904128"
                  aria-invalid={Boolean(errors.serial_number)}
                  {...register('serial_number')}
                />
                {errors.serial_number && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {errors.serial_number.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="app-purchase-date">Purchase date (optional)</Label>
              <Input id="app-purchase-date" type="date" {...register('purchase_date')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="app-notes">Location / unit notes (optional)</Label>
              <Textarea
                id="app-notes"
                placeholder="e.g. Installed in 2nd floor master bedroom, 1.5HP inverter"
                {...register('notes')}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>{editingAppliance ? 'Save Changes' : 'Register Appliance'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
