'use client'

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Lock, LogOut, Pencil, Save, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormBanner } from '@/components/shared/form-banner'
import { PhilippineAddressFields } from '@/components/shared/ph-address-fields'
import { ProfilePhotoField } from '@/components/shared/profile-photo-field'
import { signOutAction } from '@/features/auth/actions/auth-actions'
import { ChangePasswordCard } from '@/features/auth/components/change-password-card'
import type { AuthenticatedUserProfile } from '@/lib/auth/session'
import { ADMIN_FEATURES, SERVICE_BRANCHES } from '@/lib/constants'
import { formatAddress, formatFullName, formatPHPhone } from '@/lib/formatters'
import { updateAdminProfileAction } from '../actions/admin-actions'
import { adminProfileSchema, type AdminProfileInput } from '../schemas/admin-schemas'

interface AdminProfileFormsProps {
  profile: AuthenticatedUserProfile
  canEditProfileDetails: boolean
}

export function AdminProfileForms({ profile, canEditProfileDetails }: AdminProfileFormsProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const savedValues = React.useMemo<AdminProfileInput>(
    () => ({
      first_name: profile.first_name,
      middle_name: profile.middle_name ?? '',
      last_name: profile.last_name,
      phone: profile.phone ?? '',
      branch_location:
        (profile.branch_location as AdminProfileInput['branch_location']) ?? SERVICE_BRANCHES[0],
      address_street: profile.address_street ?? '',
      address_barangay: profile.address_barangay ?? '',
      address_city: profile.address_city ?? '',
      address_province: profile.address_province ?? 'Metro Manila',
      address_zip_code: profile.address_zip_code ?? '',
    }),
    [profile]
  )

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminProfileInput>({
    resolver: zodResolver(adminProfileSchema),
    mode: 'onBlur',
    defaultValues: savedValues,
  })

  React.useEffect(() => {
    if (!isEditing) {
      reset(savedValues)
    }
  }, [isEditing, reset, savedValues])

  function onSubmit(values: AdminProfileInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await updateAdminProfileAction(values)
      if (result.success) {
        setIsEditing(false)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Administrator Profile &amp; Managed Branch</span>
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default" className="font-mono">
                {profile.user_type_id}
              </Badge>
              {profile.branch_location && (
                <Badge variant="secondary">{profile.branch_location}</Badge>
              )}
            </div>
          </div>
          <CardDescription>
            {canEditProfileDetails
              ? 'Manage your operations contact profile, primary Philippine branch hub, and office address.'
              : 'Your administrator account has limited access. You can update your profile photo and password, while profile and branch details are managed by a full administrator.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfilePhotoField
            currentAvatarUrl={profile.avatar_url}
            currentAvatarPosition={profile.avatar_position}
            fullName={formatFullName(profile)}
          />

          {feedback && <FormBanner type={feedback.type} message={feedback.message} />}

          {!canEditProfileDetails || !isEditing ? (
            <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
              {!canEditProfileDetails && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <h3 className="font-heading text-sm font-semibold text-foreground">
                      Administrator Profile &amp; Managed Branch
                    </h3>
                  </div>
                  <Badge variant="slate">Read-only (Limited Admin)</Badge>
                </div>
              )}

              <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Full Name</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{formatFullName(profile)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Email</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{profile.email}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Phone (+63)</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{formatPHPhone(profile.phone)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Primary Managed Branch</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {profile.branch_location || 'Unassigned'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground">Office Address</dt>
                  <dd className="mt-0.5 text-foreground">
                    {formatAddress({
                      street: profile.address_street,
                      barangay: profile.address_barangay,
                      city: profile.address_city,
                      province: profile.address_province,
                      zip: profile.address_zip_code,
                    })}
                  </dd>
                </div>
              </dl>

              {!canEditProfileDetails ? (
                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-medium text-muted-foreground">Permitted Admin Features</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile.admin_permissions ?? []).map((key) => {
                      const feature = ADMIN_FEATURES.find((f) => f.key === key)
                      return (
                        <Badge key={key} variant="outline">
                          {feature?.label ?? key}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="border-t border-border pt-3">
                  <Button
                    type="button"
                    onClick={() => {
                      reset(savedValues)
                      setFeedback(null)
                      setIsEditing(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    <span>Edit Profile</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="adm-p-first">First name</Label>
                  <Input id="adm-p-first" {...register('first_name')} />
                  {errors.first_name && (
                    <p role="alert" className="text-xs text-destructive">
                      {errors.first_name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adm-p-middle">Middle name</Label>
                  <Input id="adm-p-middle" {...register('middle_name')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adm-p-last">Last name</Label>
                  <Input id="adm-p-last" {...register('last_name')} />
                  {errors.last_name && (
                    <p role="alert" className="text-xs text-destructive">
                      {errors.last_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="adm-p-email">Email</Label>
                  <Input id="adm-p-email" value={profile.email} readOnly className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adm-p-phone">Phone (+63)</Label>
                  <Input id="adm-p-phone" type="tel" {...register('phone')} />
                  {errors.phone && (
                    <p role="alert" className="text-xs text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adm-p-branch">Primary Managed Branch</Label>
                  <Controller
                    name="branch_location"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="adm-p-branch">
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
                register={register}
                errors={errors}
                idPrefix="adm-p"
                streetLabel="Office Street Address"
              />

              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>Save Changes</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    reset(savedValues)
                    setFeedback(null)
                    setIsEditing(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <ChangePasswordCard />

        <div className="flex items-center justify-between rounded-lg border border-border/80 bg-card/70 px-4 py-3">
          <span className="text-xs text-muted-foreground">
            End your elevated administrator session cleanly.
          </span>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Log Out</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
