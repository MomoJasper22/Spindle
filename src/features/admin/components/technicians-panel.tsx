'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BarChart3, Loader2, Pencil, Sparkles, UserCheck, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import { UserAvatar } from '@/components/shared/user-avatar'
import {
  APPLIANCE_CATEGORIES,
  SERVICE_BRANCHES,
  TECH_AVAILABILITY_STATUSES,
  TIME_SLOTS,
} from '@/lib/constants'
import { formatFullName, formatPHPhone, getManilaTodayISO, humanizeLabel } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type {
  AppointmentDetailView,
  PaymentDetailView,
  RepairDetailView,
  TechnicianProfileRow,
  TechnicianStatusLogRow,
  UserWithRole,
} from '@/types/database'
import {
  adminAssignTechnicianAction,
  adminToggleUserActiveAction,
  adminUpdateTechProfileAction,
} from '../actions/admin-actions'
import {
  adminAssignTechSchema,
  adminTechProfileSchema,
  type AdminAssignTechInput,
  type AdminTechProfileInput,
} from '../schemas/admin-schemas'

const TechnicianProductivitySheet = dynamic(
  () =>
    import('./technician-productivity-sheet').then(
      (m) => m.TechnicianProductivitySheet
    ),
  { ssr: false }
)

interface TechniciansPanelProps {
  users: UserWithRole[]
  techProfiles: TechnicianProfileRow[]
  repairs: RepairDetailView[]
  appointments: AppointmentDetailView[]
  payments: PaymentDetailView[]
  statusLogs: TechnicianStatusLogRow[]
}

export function TechniciansPanel({
  users,
  techProfiles,
  repairs,
  appointments,
  payments,
  statusLogs,
}: TechniciansPanelProps) {
  const [selectedTechForTracker, setSelectedTechForTracker] = React.useState<UserWithRole | null>(
    null
  )
  const [editingTech, setEditingTech] = React.useState<{
    user: UserWithRole
    profile: TechnicianProfileRow | null
  } | null>(null)
  const [assignOpen, setAssignOpen] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const techUsers = users.filter((u) => u.user_type_id === 'UTP-TECH')
  const techProfileById = new Map(techProfiles.map((tp) => [tp.technician_id, tp]))
  const assignableRepairs = repairs.filter((r) => !['completed', 'cancelled'].includes(r.status))
  const todayISO = getManilaTodayISO()

  const editForm = useForm<AdminTechProfileInput>({
    resolver: zodResolver(adminTechProfileSchema),
    mode: 'onBlur',
    defaultValues: {
      technician_id: '',
      branch_location: SERVICE_BRANCHES[0],
      specializations: [],
      certification_no: '',
      availability_status: 'available',
      max_daily_jobs: 4,
    },
  })

  const assignForm = useForm<AdminAssignTechInput>({
    resolver: zodResolver(adminAssignTechSchema),
    mode: 'onBlur',
    defaultValues: {
      ticket_id: assignableRepairs[0]?.ticket_id ?? '',
      technician_id: techUsers.find((t) => t.is_active)?.user_id ?? '',
      scheduled_date: todayISO,
      time_slot: TIME_SLOTS[0],
    },
  })

  function openEditTech(user: UserWithRole) {
    const tp = techProfileById.get(user.user_id) ?? null
    setEditingTech({ user, profile: tp })
    editForm.reset({
      technician_id: user.user_id,
      branch_location: (user.branch_location as AdminTechProfileInput['branch_location']) ?? SERVICE_BRANCHES[0],
      specializations: tp?.specializations ?? [],
      certification_no: tp?.certification_no ?? '',
      availability_status: tp?.availability_status ?? 'available',
      max_daily_jobs: tp?.max_daily_jobs ?? 4,
    })
    setFeedback(null)
  }

  function openAssignModal(defaultTechId?: string) {
    const firstTicket = assignableRepairs[0]
    assignForm.reset({
      ticket_id: firstTicket?.ticket_id ?? '',
      technician_id: defaultTechId ?? techUsers.find((t) => t.is_active)?.user_id ?? '',
      scheduled_date: firstTicket?.scheduled_date ?? todayISO,
      time_slot: TIME_SLOTS[0],
    })
    setFeedback(null)
    setAssignOpen(true)
  }

  function onEditSubmit(values: AdminTechProfileInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await adminUpdateTechProfileAction(values)
      if (result.success) {
        setEditingTech(null)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function onAssignSubmit(values: AdminAssignTechInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await adminAssignTechnicianAction(values)
      if (result.success) {
        setAssignOpen(false)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function handleDeactivateTech(userId: string, nextActive: boolean) {
    setFeedback(null)
    startTransition(async () => {
      const result = await adminToggleUserActiveAction(userId, nextActive)
      if (result.success) {
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  const selectedSpecs = useWatch({ control: editForm.control, name: 'specializations' }) ?? []
  const proposedSpecsForEdit = editingTech?.profile?.proposed_specializations ?? []

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Technician Roster &amp; Dispatch Allocation</CardTitle>
          <CardDescription>
            Click any technician to open their productivity &amp; availability tracker, assign specializations and daily capacity (1–15), or dispatch tickets.
          </CardDescription>
        </div>
        <Button
          onClick={() => openAssignModal()}
          disabled={techUsers.length === 0 || assignableRepairs.length === 0}
        >
          <UserCheck className="h-4 w-4" aria-hidden="true" />
          <span>Assign Technician to Ticket</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedback && !editingTech && !assignOpen && (
          <FormBanner type={feedback.type} message={feedback.message} />
        )}

        {techUsers.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No technicians onboarded yet"
            description="Create a Technician user in the Users module to manage specializations and dispatch assignments."
          />
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {techUsers.map((tech) => {
                const tp = techProfileById.get(tech.user_id) ?? null
                const activeJobs = repairs.filter(
                  (r) =>
                    r.technician_id === tech.user_id &&
                    !['completed', 'cancelled'].includes(r.status)
                ).length
                const maxJobs = tp?.max_daily_jobs ?? 4
                const fullName = formatFullName(tech)
                const proposedCount = tp?.proposed_specializations?.length ?? 0

                return (
                  <div
                    key={tech.user_id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedTechForTracker(tech)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedTechForTracker(tech)
                      }
                    }}
                    className="rounded-xl border border-border bg-card p-4 space-y-3 cursor-pointer transition-colors hover:border-primary/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar
                          avatarUrl={tech.avatar_url}
                          avatarPosition={tech.avatar_position}
                          name={fullName}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{fullName}</p>
                          {tech.nickname && (
                            <p className="text-xs text-primary font-medium">aka {tech.nickname}</p>
                          )}
                          <p className="font-mono text-xs text-muted-foreground truncate">
                            {tech.branch_location || 'Unassigned'} &middot; {formatPHPhone(tech.phone)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={tp?.availability_status ?? 'available'} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        Load: <span className="font-semibold text-foreground">{activeJobs}</span> / {maxJobs} max daily
                      </span>
                      {proposedCount > 0 && (
                        <Badge variant="amber" className="text-[10px]">
                          {proposedCount} proposed
                        </Badge>
                      )}
                    </div>
                    <div
                      className="flex flex-wrap gap-1.5 border-t border-border pt-2.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTechForTracker(tech)}
                      >
                        <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Tracker</span>
                      </Button>
                      {tech.is_active && assignableRepairs.length > 0 && (
                        <Button type="button" size="sm" variant="outline" onClick={() => openAssignModal(tech.user_id)}>
                          Dispatch
                        </Button>
                      )}
                      <Button type="button" size="sm" variant="outline" onClick={() => openEditTech(tech)}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Edit</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="hidden md:block">
              <Table regionLabel="Technician roster and workload">
                <TableHeader>
                  <TableRow>
                    <TableHead>Technician</TableHead>
                    <TableHead>Branch &amp; Cert</TableHead>
                    <TableHead>Specializations</TableHead>
                    <TableHead>Active Load</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {techUsers.map((tech) => {
                    const tp = techProfileById.get(tech.user_id) ?? null
                    const activeJobs = repairs.filter(
                      (r) =>
                        r.technician_id === tech.user_id &&
                        !['completed', 'cancelled'].includes(r.status)
                    ).length
                    const maxJobs = tp?.max_daily_jobs ?? 4
                    const fullName = formatFullName(tech)
                    const proposedCount = tp?.proposed_specializations?.length ?? 0

                    return (
                      <TableRow
                        key={tech.user_id}
                        onClick={() => setSelectedTechForTracker(tech)}
                        className="cursor-pointer transition-colors hover:bg-muted/40"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              avatarUrl={tech.avatar_url}
                              avatarPosition={tech.avatar_position}
                              name={fullName}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">
                                {fullName}
                                {tech.nickname && (
                                  <span className="ml-1.5 text-xs font-medium text-primary">
                                    ({tech.nickname})
                                  </span>
                                )}
                              </p>
                              <p className="font-mono text-xs text-muted-foreground">
                                {tech.user_id} &middot; {formatPHPhone(tech.phone)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-medium">{tech.branch_location || 'Unassigned'}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {tp?.certification_no || 'No cert on file'}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {tp && tp.specializations.length > 0 ? (
                              tp.specializations.slice(0, 3).map((spec) => (
                                <Badge key={spec} variant="outline" className="text-[11px]">
                                  {spec}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">None assigned</span>
                            )}
                            {tp && tp.specializations.length > 3 && (
                              <Badge variant="slate" className="text-[11px]">
                                +{tp.specializations.length - 3}
                              </Badge>
                            )}
                            {proposedCount > 0 && (
                              <Badge variant="amber" className="text-[10px]">
                                {proposedCount} proposed
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          <span className="font-semibold text-foreground">{activeJobs}</span>
                          <span className="text-xs text-muted-foreground"> / {maxJobs} max daily</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <StatusBadge status={tp?.availability_status ?? 'available'} />
                            {!tech.is_active && <StatusBadge status="inactive" showIcon={false} />}
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedTechForTracker(tech)}
                              aria-label={`View productivity for ${tech.user_id}`}
                            >
                              <BarChart3 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                            </Button>
                            {tech.is_active && assignableRepairs.length > 0 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => openAssignModal(tech.user_id)}
                              >
                                Dispatch
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditTech(tech)}
                              aria-label={`Edit technician ${tech.user_id}`}
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                            <ConfirmationDialog
                              trigger={
                                <Button type="button" size="sm" variant="ghost">
                                  <span className="text-xs text-muted-foreground">
                                    {tech.is_active ? 'Deactivate' : 'Activate'}
                                  </span>
                                </Button>
                              }
                              title={`${tech.is_active ? 'Deactivate' : 'Activate'} technician ${formatFullName(tech)}?`}
                              description={
                                tech.is_active
                                  ? 'Deactivated technicians cannot sign in or receive new dispatch assignments.'
                                  : 'Restores field technician portal access.'
                              }
                              confirmLabel={tech.is_active ? 'Deactivate' : 'Activate'}
                              destructive={tech.is_active}
                              isPending={isPending}
                              onConfirm={() => handleDeactivateTech(tech.user_id, !tech.is_active)}
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

      {/* Productivity Tracker Sheet (shown only when a specific technician is clicked) */}
      <TechnicianProductivitySheet
        technician={selectedTechForTracker}
        techProfile={
          selectedTechForTracker ? techProfileById.get(selectedTechForTracker.user_id) ?? null : null
        }
        repairs={repairs}
        appointments={appointments}
        payments={payments}
        statusLogs={statusLogs}
        open={Boolean(selectedTechForTracker)}
        onOpenChange={(open) => {
          if (!open) setSelectedTechForTracker(null)
        }}
        onEditCredentials={(tech) => openEditTech(tech)}
        onDispatchTicket={(techId) => openAssignModal(techId)}
        canDispatch={assignableRepairs.length > 0}
      />

      {/* Edit Technician Credentials Modal */}
      <Dialog
        open={Boolean(editingTech)}
        onOpenChange={(open) => {
          if (!open) setEditingTech(null)
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Technician Credentials ({editingTech ? formatFullName(editingTech.user) : ''})
            </DialogTitle>
            <DialogDescription>
              Assign branch, appliance specializations, max daily jobs (1–15), TESDA credentials, and availability.
            </DialogDescription>
          </DialogHeader>

          {feedback && editingTech && <FormBanner type={feedback.type} message={feedback.message} />}

          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tp-branch">Branch Location</Label>
                <Controller
                  name="branch_location"
                  control={editForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="tp-branch">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_BRANCHES.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tp-avail">Availability Status</Label>
                <Controller
                  name="availability_status"
                  control={editForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="tp-avail">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TECH_AVAILABILITY_STATUSES.map((st) => (
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tp-cert">TESDA Certification No.</Label>
                <Input id="tp-cert" {...editForm.register('certification_no')} />
                {editForm.formState.errors.certification_no && (
                  <p role="alert" className="text-xs text-destructive">
                    {editForm.formState.errors.certification_no.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tp-cap">Max Daily Jobs (1–15)</Label>
                <Input
                  id="tp-cap"
                  type="number"
                  min={1}
                  max={15}
                  {...editForm.register('max_daily_jobs', { valueAsNumber: true })}
                />
              </div>
            </div>

            {proposedSpecsForEdit.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-amber-ink">
                    Proposed by Technician for Review:
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const merged = Array.from(
                        new Set([...selectedSpecs, ...proposedSpecsForEdit])
                      )
                      editForm.setValue('specializations', merged, { shouldValidate: true })
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-ink" aria-hidden="true" />
                    <span>Apply Proposed</span>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {proposedSpecsForEdit.map((spec) => (
                    <Badge key={spec} variant="amber" className="text-[11px]">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Assigned Appliance Specializations</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {APPLIANCE_CATEGORIES.map((cat) => {
                  const checked = selectedSpecs.includes(cat)
                  const id = `adm-spec-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
                  return (
                    <label
                      key={cat}
                      htmlFor={id}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium cursor-pointer',
                        checked ? 'border-primary bg-primary-tint/70' : 'border-border'
                      )}
                    >
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={(v) => {
                          const next = v === true
                            ? [...selectedSpecs, cat]
                            : selectedSpecs.filter((s) => s !== cat)
                          editForm.setValue('specializations', next, { shouldValidate: true })
                        }}
                      />
                      <span>{cat}</span>
                    </label>
                  )
                })}
              </div>
              {editForm.formState.errors.specializations && (
                <p role="alert" className="text-xs text-destructive">
                  {editForm.formState.errors.specializations.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingTech(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>Save Credentials</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Technician Modal (Row-Locked RPC) */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispatch &amp; Assign Technician</DialogTitle>
            <DialogDescription>
              Locks the repair ticket, technician profile, and daily slot to prevent double-booking or capacity overflow.
            </DialogDescription>
          </DialogHeader>

          {feedback && assignOpen && <FormBanner type={feedback.type} message={feedback.message} />}

          <form onSubmit={assignForm.handleSubmit(onAssignSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="assign-ticket">Repair Ticket</Label>
              <Controller
                name="ticket_id"
                control={assignForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="assign-ticket">
                      <SelectValue placeholder="Select repair ticket" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableRepairs.map((r) => (
                        <SelectItem key={r.ticket_id} value={r.ticket_id}>
                          {r.ticket_id} — {r.customer_first_name} {r.customer_last_name} ({r.appliance_brand})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assign-tech">Technician</Label>
              <Controller
                name="technician_id"
                control={assignForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="assign-tech">
                      <SelectValue placeholder="Select active technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {techUsers
                        .filter((t) => t.is_active)
                        .map((t) => (
                          <SelectItem key={t.user_id} value={t.user_id}>
                            {formatFullName(t)} ({t.branch_location || 'Unassigned'})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="assign-date">Scheduled Date</Label>
                <Input id="assign-date" type="date" {...assignForm.register('scheduled_date')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="assign-slot">Time Slot (PHT)</Label>
                <Controller
                  name="time_slot"
                  control={assignForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="assign-slot">
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>Confirm &amp; Lock Assignment</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
