'use client'

import * as React from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Pencil, Plus, Power, Search, ShieldCheck, Trash2, Users } from 'lucide-react'
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
import { PhilippineAddressFields } from '@/components/shared/ph-address-fields'
import { StatusBadge } from '@/components/shared/status-badge'
import { UserAvatar } from '@/components/shared/user-avatar'
import {
  ADMIN_FEATURES,
  ADMIN_FEATURE_KEYS,
  APPLIANCE_CATEGORIES,
  SERVICE_BRANCHES,
  type AdminFeatureKey,
  type UserRole,
} from '@/lib/constants'
import { formatFullName, formatPHPhone } from '@/lib/formatters'
import { cn } from '@/lib/utils'
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
  currentAdminPermissions: AdminFeatureKey[] | null
}

function getAdminScopeBadge(user: UserWithRole) {
  const role = user.user_types?.type_name
  if (role !== 'admin') return null
  if (!user.admin_permissions || user.admin_permissions.length === 0) {
    return (
      <Badge variant="emerald" className="text-[10px]">
        Full Access
      </Badge>
    )
  }
  return (
    <Badge variant="amber" className="text-[10px]">
      Limited ({user.admin_permissions.length}/{ADMIN_FEATURE_KEYS.length})
    </Badge>
  )
}

export function UsersPanel({
  users,
  currentAdminId,
  currentAdminPermissions,
}: UsersPanelProps) {
  const [search, setSearch] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState<string>('all')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<UserWithRole | null>(null)
  const [createAccessMode, setCreateAccessMode] = React.useState<'full' | 'limited'>('full')
  const [editAccessMode, setEditAccessMode] = React.useState<'full' | 'limited'>('full')
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const isActingFullAdmin = currentAdminPermissions === null
  const grantableFeatures = isActingFullAdmin
    ? ADMIN_FEATURES
    : ADMIN_FEATURES.filter((f) => currentAdminPermissions.includes(f.key))

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
      specializations: [],
      certification_no: '',
      max_daily_jobs: 4,
      admin_permissions: null,
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
      admin_permissions: null,
    },
  })

  const createRole = useWatch({ control: createForm.control, name: 'role' })
  const createSpecs = useWatch({ control: createForm.control, name: 'specializations' }) ?? []
  const createPerms = useWatch({ control: createForm.control, name: 'admin_permissions' }) ?? []

  const editRole = useWatch({ control: editForm.control, name: 'role' })
  const editPerms = useWatch({ control: editForm.control, name: 'admin_permissions' }) ?? []

  function openCreate() {
    const initialMode = isActingFullAdmin ? 'full' : 'limited'
    setCreateAccessMode(initialMode)
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
      specializations: [],
      certification_no: '',
      max_daily_jobs: 4,
      admin_permissions: initialMode === 'full' ? null : grantableFeatures.slice(0, 1).map((f) => f.key),
    })
    setFeedback(null)
    setCreateOpen(true)
  }

  function openEdit(user: UserWithRole) {
    const role = user.user_types?.type_name ?? 'customer'
    const isLimited = role === 'admin' && Array.isArray(user.admin_permissions)
    setEditAccessMode(isLimited ? 'limited' : 'full')
    setEditingUser(user)
    editForm.reset({
      user_id: user.user_id,
      first_name: user.first_name,
      middle_name: user.middle_name ?? '',
      last_name: user.last_name,
      role,
      phone: user.phone ?? '',
      branch_location: (user.branch_location as AdminUpdateUserInput['branch_location']) ?? SERVICE_BRANCHES[0],
      address_street: user.address_street ?? '',
      address_barangay: user.address_barangay ?? '',
      address_city: user.address_city ?? '',
      address_province: user.address_province ?? '',
      address_zip_code: user.address_zip_code ?? '',
      is_active: user.is_active,
      admin_permissions: isLimited ? user.admin_permissions : null,
    })
    setFeedback(null)
  }

  function onCreateSubmit(values: AdminCreateUserInput) {
    setFeedback(null)
    const payload: AdminCreateUserInput = {
      ...values,
      admin_permissions:
        values.role === 'admin'
          ? createAccessMode === 'full'
            ? null
            : values.admin_permissions ?? []
          : null,
    }
    if (payload.role === 'admin' && createAccessMode === 'limited' && (!payload.admin_permissions || payload.admin_permissions.length === 0)) {
      setFeedback({ type: 'error', message: 'Select at least one admin feature for a limited admin.' })
      return
    }
    startTransition(async () => {
      const result = await adminCreateUserAction(payload)
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
    const isSelf = editingUser?.user_id === currentAdminId
    const payload: AdminUpdateUserInput = {
      ...values,
      admin_permissions:
        values.role === 'admin'
          ? isSelf
            ? editingUser?.admin_permissions ?? null
            : editAccessMode === 'full'
              ? null
              : values.admin_permissions ?? []
          : null,
    }
    if (
      !isSelf &&
      payload.role === 'admin' &&
      editAccessMode === 'limited' &&
      (!payload.admin_permissions || payload.admin_permissions.length === 0)
    ) {
      setFeedback({ type: 'error', message: 'Select at least one admin feature for a limited admin.' })
      return
    }
    startTransition(async () => {
      const result = await adminUpdateUserAction(payload)
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
      (u.nickname ?? '').toLowerCase().includes(q) ||
      (u.branch_location ?? '').toLowerCase().includes(q)
    )
  })

  function renderPermissionSelector(params: {
    mode: 'full' | 'limited'
    onModeChange: (next: 'full' | 'limited') => void
    selected: AdminFeatureKey[]
    onToggle: (key: AdminFeatureKey, checked: boolean) => void
    idPrefix: string
    disabled?: boolean
  }) {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            <Label className="text-sm font-semibold">Admin Feature Access</Label>
          </div>

          <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
            {isActingFullAdmin && (
              <button
                type="button"
                disabled={params.disabled}
                onClick={() => params.onModeChange('full')}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                  params.mode === 'full'
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Full Access
              </button>
            )}
            <button
              type="button"
              disabled={params.disabled}
              onClick={() => params.onModeChange('limited')}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                params.mode === 'limited'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Limited Access
            </button>
          </div>
        </div>

        {params.disabled ? (
          <p className="text-xs text-muted-foreground">
            You cannot change your own role or administrator permissions.
          </p>
        ) : params.mode === 'full' ? (
          <p className="text-xs text-muted-foreground">
            This administrator can access all operations modules, user controls, and profile settings.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Choose the specific admin features this account is allowed to access. Limited admins can only update their profile photo and password.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {grantableFeatures.map((feature) => {
                const checked = params.selected.includes(feature.key)
                const id = `${params.idPrefix}-${feature.key}`
                return (
                  <label
                    key={feature.key}
                    htmlFor={id}
                    className={cn(
                      'flex items-start gap-2.5 rounded-lg border px-3 py-2 text-xs cursor-pointer transition-colors',
                      checked
                        ? 'border-primary bg-primary-tint/70 text-foreground'
                        : 'border-border bg-card hover:bg-muted/50'
                    )}
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(v) => params.onToggle(feature.key, v === true)}
                    />
                    <span className="space-y-0.5">
                      <span className="block font-semibold text-foreground">{feature.label}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {feature.description}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>User Management &amp; RBAC Accounts</CardTitle>
          <CardDescription>
            Create customer or internal staff accounts, manage roles, and configure scoped admin permissions.
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
          <>
            <div className="space-y-3 md:hidden">
              {filtered.map((user) => {
                const role = user.user_types?.type_name ?? 'customer'
                const isSelf = user.user_id === currentAdminId
                const displayName = formatFullName(user)
                return (
                  <div key={user.user_id} className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar
                          avatarUrl={user.avatar_url}
                          avatarPosition={user.avatar_position}
                          name={displayName}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex rounded-md bg-muted px-2 py-0.5 font-semibold uppercase text-foreground">
                        {role}
                      </span>
                      {getAdminScopeBadge(user)}
                      {user.nickname && (
                        <Badge variant="outline" className="text-[10px]">
                          aka {user.nickname}
                        </Badge>
                      )}
                      <span>{user.branch_location || 'Unassigned'}</span>
                      <span>{formatPHPhone(user.phone)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 border-t border-border pt-2.5">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(user)}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Edit</span>
                      </Button>
                      {!isSelf && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleToggleActive(user.user_id, !user.is_active)}
                        >
                          <Power
                            className={`h-3.5 w-3.5 ${user.is_active ? 'text-amber-600' : 'text-emerald-600'}`}
                            aria-hidden="true"
                          />
                          <span>{user.is_active ? 'Deactivate' : 'Activate'}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="hidden md:block">
              <Table regionLabel="System users directory">
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Role &amp; Access</TableHead>
                    <TableHead>Branch &amp; Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => {
                    const role = user.user_types?.type_name ?? 'customer'
                    const isSelf = user.user_id === currentAdminId
                    const displayName = formatFullName(user)
                    return (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              avatarUrl={user.avatar_url}
                              avatarPosition={user.avatar_position}
                              name={displayName}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">
                                {displayName}
                                {user.nickname && (
                                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                    ({user.nickname})
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {user.user_id}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex rounded-md bg-muted px-2.5 py-0.5 text-xs font-semibold uppercase text-foreground">
                              {role}
                            </span>
                            {getAdminScopeBadge(user)}
                          </div>
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
            </div>
          </>
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

            <PhilippineAddressFields
              register={createForm.register}
              errors={createForm.formState.errors}
              idPrefix="adm-c"
              streetLabel="Street / Unit / Building"
              zipLabel="4-Digit ZIP"
            />

            {createRole === 'technician' && (
              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3.5">
                <p className="text-xs text-muted-foreground">
                  New technicians will complete onboarding on first sign-in (Credentials, Nickname, Profile Photo). Assign their capacity &amp; specializations below:
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="adm-c-cert">TESDA Cert No. (optional)</Label>
                    <Input
                      id="adm-c-cert"
                      placeholder="TESDA-RAC-NCII-..."
                      {...createForm.register('certification_no')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="adm-c-cap">Max Daily Jobs (1–15)</Label>
                    <Input
                      id="adm-c-cap"
                      type="number"
                      min={1}
                      max={15}
                      {...createForm.register('max_daily_jobs', { valueAsNumber: true })}
                    />
                    {createForm.formState.errors.max_daily_jobs && (
                      <p role="alert" className="text-xs text-destructive">
                        {createForm.formState.errors.max_daily_jobs.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Assigned Appliance Specializations</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {APPLIANCE_CATEGORIES.map((cat) => {
                      const checked = createSpecs.includes(cat)
                      const id = `adm-c-spec-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
                      return (
                        <label
                          key={cat}
                          htmlFor={id}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium cursor-pointer',
                            checked ? 'border-primary bg-primary-tint/70' : 'border-border bg-card'
                          )}
                        >
                          <Checkbox
                            id={id}
                            checked={checked}
                            onCheckedChange={(v) => {
                              const next = v === true
                                ? [...createSpecs, cat]
                                : createSpecs.filter((s) => s !== cat)
                              createForm.setValue('specializations', next)
                            }}
                          />
                          <span>{cat}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {createRole === 'admin' &&
              renderPermissionSelector({
                mode: createAccessMode,
                onModeChange: (next) => {
                  setCreateAccessMode(next)
                  if (next === 'full') {
                    createForm.setValue('admin_permissions', null)
                  } else if (!createPerms.length) {
                    createForm.setValue(
                      'admin_permissions',
                      grantableFeatures.slice(0, 1).map((f) => f.key)
                    )
                  }
                },
                selected: createPerms,
                onToggle: (key, checked) => {
                  const next = checked
                    ? [...createPerms, key]
                    : createPerms.filter((k) => k !== key)
                  createForm.setValue('admin_permissions', next)
                },
                idPrefix: 'adm-c-perm',
              })}

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
              Update user contact information, branch assignment, role, or admin feature access.
            </DialogDescription>
          </DialogHeader>

          {feedback && editingUser && <FormBanner type={feedback.type} message={feedback.message} />}

          {editingUser?.user_id === currentAdminId && !isActingFullAdmin && (
            <FormBanner
              type="error"
              message="Limited administrators cannot edit their own profile details here. Use Profile & Security to update your photo or password."
            />
          )}

          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="adm-e-first">First name</Label>
                <Input id="adm-e-first" {...editForm.register('first_name')} />
                {editForm.formState.errors.first_name && (
                  <p role="alert" className="text-xs text-destructive">
                    {editForm.formState.errors.first_name.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-e-middle">Middle name</Label>
                <Input id="adm-e-middle" {...editForm.register('middle_name')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-e-last">Last name</Label>
                <Input id="adm-e-last" {...editForm.register('last_name')} />
                {editForm.formState.errors.last_name && (
                  <p role="alert" className="text-xs text-destructive">
                    {editForm.formState.errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="adm-e-role">Role</Label>
                <Controller
                  name="role"
                  control={editForm.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={editingUser?.user_id === currentAdminId}
                    >
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
                {editForm.formState.errors.phone && (
                  <p role="alert" className="text-xs text-destructive">
                    {editForm.formState.errors.phone.message}
                  </p>
                )}
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

            <PhilippineAddressFields
              register={editForm.register}
              errors={editForm.formState.errors}
              idPrefix="adm-e"
              streetLabel="Street Address"
              zipLabel="ZIP"
            />

            {editRole === 'admin' &&
              renderPermissionSelector({
                mode: editAccessMode,
                onModeChange: (next) => {
                  setEditAccessMode(next)
                  if (next === 'full') {
                    editForm.setValue('admin_permissions', null)
                  } else if (!editPerms.length) {
                    editForm.setValue(
                      'admin_permissions',
                      grantableFeatures.slice(0, 1).map((f) => f.key)
                    )
                  }
                },
                selected: editPerms,
                onToggle: (key, checked) => {
                  const next = checked
                    ? [...editPerms, key]
                    : editPerms.filter((k) => k !== key)
                  editForm.setValue('admin_permissions', next)
                },
                idPrefix: 'adm-e-perm',
                disabled: editingUser?.user_id === currentAdminId,
              })}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || (editingUser?.user_id === currentAdminId && !isActingFullAdmin)}
              >
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
