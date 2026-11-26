'use client'

import * as React from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Pencil, Plus, Power, Search, Trash2, Users } from 'lucide-react'
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
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { FormBanner } from '@/components/shared/form-banner'
import { StatusBadge } from '@/components/shared/status-badge'
import { PH_PROVINCES, SERVICE_BRANCHES, type UserRole } from '@/lib/constants'
import { formatFullName, formatPHPhone } from '@/lib/formatters'
import type { UserWithRole } from '@/types/database'
import {
  adminCreateUserAction,
  adminDeleteUserAction,
  adminToggleUserActiveAction,
  adminUpdateUserAction,
} from '../actions/admin-actions'
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  type AdminCreateUserInput,
  type AdminUpdateUserInput,
} from '../schemas/admin-schemas'

interface UsersPanelProps {
  users: UserWithRole[]
  currentAdminId: string
}

export function UsersPanel({ users, currentAdminId }: UsersPanelProps) {
  const [search, setSearch] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState<string>('all')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<UserWithRole | null>(null)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const createForm = useForm<AdminCreateUserInput>({
    resolver: zodResolver(adminCreateUserSchema),
    mode: 'onBlur',
    defaultValues: {
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'technician',
      phone: '',
      branch_location: SERVICE_BRANCHES[0],
      address_street: '',
      address_barangay: '',
      address_city: '',
      address_province: 'Metro Manila',
      address_zip_code: '',
      certification_no: '',
      max_daily_jobs: 4,
    },
  })

  const editForm = useForm<AdminUpdateUserInput>({
    resolver: zodResolver(adminUpdateUserSchema),
    mode: 'onBlur',
    defaultValues: {
      user_id: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      role: 'customer',
      phone: '',
      branch_location: SERVICE_BRANCHES[0],
      address_street: '',
      address_barangay: '',
      address_city: '',
      address_province: 'Metro Manila',
      address_zip_code: '',
      is_active: true,
    },
  })

  const createRole = useWatch({ control: createForm.control, name: 'role' })

  function openCreate() {
    createForm.reset({
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'technician',
      phone: '',
      branch_location: SERVICE_BRANCHES[0],
      address_street: '',
      address_barangay: '',
      address_city: '',
      address_province: 'Metro Manila',
      address_zip_code: '',
      certification_no: '',
      max_daily_jobs: 4,
    })
    setFeedback(null)
    setCreateOpen(true)
  }

  function openEdit(user: UserWithRole) {
    const role = user.user_types?.type_name ?? 'customer'
    setEditingUser(user)
    editForm.reset({
      user_id: user.user_id,
      first_name: user.first_name,
      middle_name: user.middle_name ?? '',
      last_name: user.last_name,
      role,
      phone: user.phone ?? '+63 917 000 0000',
      branch_location: (user.branch_location as AdminUpdateUserInput['branch_location']) ?? SERVICE_BRANCHES[0],
      address_street: user.address_street ?? 'N/A',
      address_barangay: user.address_barangay ?? 'N/A',
      address_city: user.address_city ?? 'Quezon City',
      address_province: user.address_province ?? 'Metro Manila',
      address_zip_code: user.address_zip_code ?? '1100',
      is_active: user.is_active,
    })
    setFeedback(null)
  }

  function onCreateSubmit(values: AdminCreateUserInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await adminCreateUserAction(values)
      if (result.success) {
        setCreateOpen(false)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function onEditSubmit(values: AdminUpdateUserInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await adminUpdateUserAction(values)
      if (result.success) {
        setEditingUser(null)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function handleToggleActive(userId: string, nextActive: boolean) {
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

  function handleDeleteUser(userId: string) {
    setFeedback(null)
    startTransition(async () => {
      const result = await adminDeleteUserAction(userId)
      if (result.success) {
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  const filtered = users.filter((u) => {
    const role: UserRole = u.user_types?.type_name ?? 'customer'
    if (roleFilter !== 'all' && role !== roleFilter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      u.user_id.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      formatFullName(u).toLowerCase().includes(q) ||
      (u.branch_location ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>User Management &amp; RBAC Accounts</CardTitle>
          <CardDescription>
            Create customer or internal staff accounts, manage roles, and activate or deactivate access.
          </CardDescription>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add User Account</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedback && !createOpen && !editingUser && (
          <FormBanner type={feedback.type} message={feedback.message} />
        )}

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
              placeholder="Search user ID, name, email, branch..."
              aria-label="Search users"
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter by role">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="technician">Technician</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No user records found"
            description="Add staff or customer accounts to start managing workspace permissions."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching users"
            description="Adjust your search term or role filter."
          />
        ) : (
          <Table regionLabel="System users directory">
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Name &amp; Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branch &amp; Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => {
                const role = user.user_types?.type_name ?? 'customer'
                const isSelf = user.user_id === currentAdminId
                return (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {user.user_id}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-foreground">{formatFullName(user)}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold uppercase text-slate-700">
                        {role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-medium text-foreground">
                        {user.branch_location || 'Unassigned'}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatPHPhone(user.phone)}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(user)}
                          aria-label={`Edit ${user.user_id}`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        {!isSelf && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleToggleActive(user.user_id, !user.is_active)}
                            aria-label={user.is_active ? `Deactivate ${user.user_id}` : `Activate ${user.user_id}`}
                          >
                            <Power
                              className={`h-3.5 w-3.5 ${user.is_active ? 'text-amber-600' : 'text-emerald-600'}`}
                              aria-hidden="true"
                            />
                          </Button>
                        )}
                        {!isSelf && (
                          <ConfirmationDialog
                            trigger={
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                aria-label={`Delete ${user.user_id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                              </Button>
                            }
                            title={`Delete user ${user.user_id}?`}
                            description="Hard deletion only succeeds if the account has no linked appliances, repair tickets, or payments."
                            confirmLabel="Delete User"
                            isPending={isPending}
                            onConfirm={() => handleDeleteUser(user.user_id)}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create User Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New User Account</DialogTitle>
            <DialogDescription>
              Provision a Customer, Technician, or Administrator account with verified auth credentials.
            </DialogDescription>
          </DialogHeader>

          {feedback && createOpen && <FormBanner type={feedback.type} message={feedback.message} />}

          <form
            onSubmit={createForm.handleSubmit(onCreateSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="adm-c-first">First name</Label>
                <Input id="adm-c-first" {...createForm.register('first_name')} />
                {createForm.formState.errors.first_name && (
                  <p role="alert" className="text-xs text-destructive">
                    {createForm.formState.errors.first_name.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-c-middle">Middle name</Label>
                <Input id="adm-c-middle" {...createForm.register('middle_name')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-c-last">Last name</Label>
                <Input id="adm-c-last" {...createForm.register('last_name')} />
                {createForm.formState.errors.last_name && (
                  <p role="alert" className="text-xs text-destructive">
                    {createForm.formState.errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="adm-c-email">Email</Label>
                <Input id="adm-c-email" type="email" {...createForm.register('email')} />
                {createForm.formState.errors.email && (
                  <p role="alert" className="text-xs text-destructive">
                    {createForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-c-pass">Initial Password</Label>
                <Input id="adm-c-pass" type="password" {...createForm.register('password')} />
                {createForm.formState.errors.password && (
                  <p role="alert" className="text-xs text-destructive">
                    {createForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-c-role">Role</Label>
                <Controller
                  name="role"
                  control={createForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="adm-c-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer (UTP-CUST)</SelectItem>
                        <SelectItem value="technician">Technician (UTP-TECH)</SelectItem>
                        <SelectItem value="admin">Admin (UTP-ADMIN)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="adm-c-phone">Phone (+63)</Label>
                <Input
                  id="adm-c-phone"
                  placeholder="+63 917 555 0192"
                  {...createForm.register('phone')}
                />
                {createForm.formState.errors.phone && (
                  <p role="alert" className="text-xs text-destructive">
                    {createForm.formState.errors.phone.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-c-branch">Service Branch</Label>
                <Controller
                  name="branch_location"
                  control={createForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="adm-c-branch">
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adm-c-street">Street / Unit / Building</Label>
              <Input id="adm-c-street" {...createForm.register('address_street')} />
              {createForm.formState.errors.address_street && (
                <p role="alert" className="text-xs text-destructive">
                  {createForm.formState.errors.address_street.message}
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="adm-c-brgy">Barangay</Label>
                <Input id="adm-c-brgy" {...createForm.register('address_barangay')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-c-city">City</Label>
                <Input id="adm-c-city" {...createForm.register('address_city')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-c-prov">Province</Label>
                <Input
                  id="adm-c-prov"
                  list="adm-c-provinces"
                  {...createForm.register('address_province')}
                />
                <datalist id="adm-c-provinces">
                  {PH_PROVINCES.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-c-zip">4-Digit ZIP</Label>
                <Input id="adm-c-zip" maxLength={4} {...createForm.register('address_zip_code')} />
              </div>
            </div>

            {createRole === 'technician' && (
              <div className="grid gap-3 sm:grid-cols-2 rounded-lg border border-border bg-slate-50 p-3">
                <div className="space-y-1.5">
                  <Label htmlFor="adm-c-cert">TESDA Cert No. (optional)</Label>
                  <Input
                    id="adm-c-cert"
                    placeholder="TESDA-RAC-NCII-..."
                    {...createForm.register('certification_no')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adm-c-cap">Max Daily Jobs</Label>
                  <Input
                    id="adm-c-cap"
                    type="number"
                    min={1}
                    max={15}
                    {...createForm.register('max_daily_jobs', { valueAsNumber: true })}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>Create Account</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog
        open={Boolean(editingUser)}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null)
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit User ({editingUser?.user_id})</DialogTitle>
            <DialogDescription>
              Update user contact information, branch assignment, role, or account activation.
            </DialogDescription>
          </DialogHeader>

          {feedback && editingUser && <FormBanner type={feedback.type} message={feedback.message} />}

          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="adm-e-first">First name</Label>
                <Input id="adm-e-first" {...editForm.register('first_name')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-e-middle">Middle name</Label>
                <Input id="adm-e-middle" {...editForm.register('middle_name')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-e-last">Last name</Label>
                <Input id="adm-e-last" {...editForm.register('last_name')} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="adm-e-role">Role</Label>
                <Controller
                  name="role"
                  control={editForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="adm-e-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="technician">Technician</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adm-e-phone">Phone</Label>
                <Input id="adm-e-phone" {...editForm.register('phone')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adm-e-branch">Branch</Label>
                <Controller
                  name="branch_location"
                  control={editForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="adm-e-branch">
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adm-e-street">Street Address</Label>
              <Input id="adm-e-street" {...editForm.register('address_street')} />
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="adm-e-brgy">Barangay</Label>
                <Input id="adm-e-brgy" {...editForm.register('address_barangay')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-e-city">City</Label>
                <Input id="adm-e-city" {...editForm.register('address_city')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-e-prov">Province</Label>
                <Input id="adm-e-prov" {...editForm.register('address_province')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-e-zip">ZIP</Label>
                <Input id="adm-e-zip" maxLength={4} {...editForm.register('address_zip_code')} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>Save User</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
