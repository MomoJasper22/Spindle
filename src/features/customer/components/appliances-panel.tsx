'use client'

import * as React from 'react'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarPlus, ChevronRight, Laptop, Loader2, Pencil, Plus, Search, Trash2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { FormBanner } from '@/components/shared/form-banner'
import { ScrollableList } from '@/components/shared/scrollable-list'
import { StatusBadge } from '@/components/shared/status-badge'
import { ApplianceIcon, ApplianceTypePicker } from '@/components/shared/appliance-icons'
import {
  APPLIANCE_BRAND_SUGGESTIONS,
  getDefaultApplianceIcon,
} from '@/lib/constants'
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
  openAddByDefault?: boolean
}

export function AppliancesPanel({ appliances, openAddByDefault = false }: AppliancesPanelProps) {
  const [search, setSearch] = React.useState('')
  const [dialogOpen, setDialogOpen] = React.useState(openAddByDefault)
  const [selectedAppliance, setSelectedAppliance] = React.useState<CustomerApplianceRow | null>(null)
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
      category: '' as ApplianceInput['category'],
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
      category: '' as ApplianceInput['category'],
      model_number: '',
      serial_number: '',
      purchase_date: '',
      notes: '',
    })
    setFeedback(null)
    setDialogOpen(true)
  }

  function openEditDialog(item: CustomerApplianceRow) {
    setSelectedAppliance(null)
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
    const payload: ApplianceInput = {
      ...values,
      icon: getDefaultApplianceIcon(values.category),
    }
    startTransition(async () => {
      const result = editingAppliance
        ? await updateApplianceAction(editingAppliance.appliance_id, payload)
        : await createApplianceAction(payload)

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
        setSelectedAppliance(null)
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
      a.brand.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.model_number.toLowerCase().includes(q) ||
      (a.notes ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Appliances
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Save the appliances in your home or shop so booking a visit takes one tap.
          </p>
        </div>

        <Button onClick={openCreateDialog} className="w-full sm:w-auto shrink-0">
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add Appliance</span>
        </Button>
      </div>

      {feedback && !dialogOpen && <FormBanner type={feedback.type} message={feedback.message} />}

      {appliances.length > 0 && (
        <div className="relative max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brand, type, or room..."
            aria-label="Search saved appliances"
            className="pl-9"
          />
        </div>
      )}

      {appliances.length === 0 ? (
        <EmptyState
          icon={Laptop}
          title="No appliances saved yet"
          description="Add your aircon, refrigerator, washing machine, or kitchen unit to start booking visits."
          action={
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Add First Appliance</span>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching appliances"
          description="Try searching another brand, appliance type, or model."
        />
      ) : (
        <ScrollableList regionLabel="My appliances list" className="p-0.5 pr-1.5">
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
            <Card
              key={item.appliance_id}
              className="transition-colors hover:border-primary/40"
            >
              <CardContent standalone className="flex h-full flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-primary-tint/35 p-1.5">
                        <ApplianceIcon
                          icon={item.icon}
                          category={item.category}
                          className="h-9 w-9"
                        />
                      </div>
                      <div>
                        <p className="font-heading text-base font-bold text-foreground">
                          {item.brand}
                        </p>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                      </div>
                    </div>
                    <StatusBadge status={item.registration_status} audience="customer" />
                  </div>

                  {item.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.notes}</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-dashed border-border pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedAppliance(item)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary"
                  >
                    <span>See details</span>
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>

                  {item.registration_status !== 'cancelled' && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/customer/bookings?book=1&appliance=${item.appliance_id}`}>
                        <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Book Visit</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        </ScrollableList>
      )}

      {/* Progressive-Disclosure Appliance Detail Sheet */}
      <Sheet
        open={Boolean(selectedAppliance)}
        onOpenChange={(open) => {
          if (!open) setSelectedAppliance(null)
        }}
      >
        <SheetContent side="right" className="w-[min(28rem,94dvw)]">
          {selectedAppliance && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedAppliance.registration_status} audience="customer" />
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-primary-tint/35 p-1.5">
                    <ApplianceIcon
                      icon={selectedAppliance.icon}
                      category={selectedAppliance.category}
                      className="h-9 w-9"
                    />
                  </div>
                  <SheetTitle>
                    {selectedAppliance.brand} {selectedAppliance.category}
                  </SheetTitle>
                </div>
                <SheetDescription>
                  Saved appliance details used when a technician visits your home.
                </SheetDescription>
              </SheetHeader>

              <dl className="divide-y divide-dashed divide-border rounded-xl border border-border bg-background/60 px-4 py-1 text-sm">
                <div className="flex justify-between gap-3 py-3">
                  <dt className="text-muted-foreground">Model Number</dt>
                  <dd className="font-semibold text-foreground text-right">
                    {selectedAppliance.model_number}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 py-3">
                  <dt className="text-muted-foreground">Serial Number</dt>
                  <dd className="font-mono text-xs font-semibold text-foreground text-right">
                    {selectedAppliance.serial_number}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 py-3">
                  <dt className="text-muted-foreground">Purchase Date</dt>
                  <dd className="font-medium text-foreground text-right">
                    {selectedAppliance.purchase_date
                      ? formatManilaDate(selectedAppliance.purchase_date)
                      : 'Not added'}
                  </dd>
                </div>
                <div className="py-3 space-y-1">
                  <dt className="text-muted-foreground">Location / Notes</dt>
                  <dd className="text-foreground">
                    {selectedAppliance.notes || 'No extra notes added.'}
                  </dd>
                </div>
              </dl>

              <SheetFooter className="flex-col gap-2 sm:flex-col">
                {selectedAppliance.registration_status !== 'cancelled' && (
                  <Button asChild className="w-full">
                    <Link href={`/customer/bookings?book=1&appliance=${selectedAppliance.appliance_id}`}>
                      <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                      <span>Book a Visit for This Unit</span>
                    </Link>
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openEditDialog(selectedAppliance)}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Edit Details</span>
                  </Button>

                  <ConfirmationDialog
                    trigger={
                      <Button type="button" variant="outline" className="text-destructive">
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Delete</span>
                      </Button>
                    }
                    title="Delete this appliance?"
                    description="You can delete an appliance if it has no past visits yet. Otherwise, mark it as inactive."
                    confirmLabel="Delete Appliance"
                    isPending={isPending}
                    onConfirm={() => handleRemove(selectedAppliance.appliance_id, 'delete')}
                  />
                </div>

                {selectedAppliance.registration_status !== 'cancelled' && (
                  <ConfirmationDialog
                    trigger={
                      <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground">
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Mark as Inactive Instead</span>
                      </Button>
                    }
                    title="Mark appliance as inactive?"
                    description="Inactive appliances stay in your history, and you won't book new visits for them."
                    confirmLabel="Mark Inactive"
                    isPending={isPending}
                    onConfirm={() => handleRemove(selectedAppliance.appliance_id, 'cancel')}
                  />
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add / Edit Appliance Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingAppliance ? 'Edit Appliance Details' : 'Add an Appliance'}
            </DialogTitle>
            <DialogDescription>
              Share the brand and model sticker details so your technician brings the right tools.
            </DialogDescription>
          </DialogHeader>

          {feedback && dialogOpen && <FormBanner type={feedback.type} message={feedback.message} />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

            <div className="space-y-2">
              <Label htmlFor="app-category" className="block">
                Appliance Type <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <ApplianceTypePicker
                    id="app-category"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Pick Appliances"
                    ariaInvalid={Boolean(errors.category)}
                  />
                )}
              />
              {errors.category && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="app-model">
                  Model number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="app-model"
                  placeholder="Found on the side sticker"
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
                  placeholder="Found on the barcode label"
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
              <Label htmlFor="app-purchase-date">When did you buy it? (optional)</Label>
              <Input id="app-purchase-date" type="date" {...register('purchase_date')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="app-notes">Where is it located? (optional)</Label>
              <Textarea
                id="app-notes"
                placeholder="e.g. 2nd floor master bedroom, 1.5HP unit"
                {...register('notes')}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>{editingAppliance ? 'Save Changes' : 'Save Appliance'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
