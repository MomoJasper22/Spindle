'use client'

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, LogOut, Save, User } from 'lucide-react'
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
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { FormBanner } from '@/components/shared/form-banner'
import { ProfilePhotoField } from '@/components/shared/profile-photo-field'
import { signOutAction } from '@/features/auth/actions/auth-actions'
import { ChangePasswordCard } from '@/features/auth/components/change-password-card'
import { PH_PROVINCES, SERVICE_BRANCHES } from '@/lib/constants'
import { formatFullName } from '@/lib/formatters'
import type { UserRow } from '@/types/database'
import {
  deactivateCustomerAccountAction,
  updateCustomerProfileAction,
} from '../actions/customer-actions'
import { customerProfileSchema, type CustomerProfileInput } from '../schemas/customer-schemas'

interface CustomerProfileFormsProps {
  profile: UserRow
}

export function CustomerProfileForms({ profile }: CustomerProfileFormsProps) {
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerProfileInput>({
    resolver: zodResolver(customerProfileSchema),
    mode: 'onBlur',
    defaultValues: {
      first_name: profile.first_name,
      middle_name: profile.middle_name ?? '',
      last_name: profile.last_name,
      phone: profile.phone ?? '',
      branch_location:
        (profile.branch_location as CustomerProfileInput['branch_location']) ?? SERVICE_BRANCHES[0],
      address_street: profile.address_street ?? '',
      address_barangay: profile.address_barangay ?? '',
      address_city: profile.address_city ?? '',
      address_province: profile.address_province ?? 'Metro Manila',
      address_zip_code: profile.address_zip_code ?? '',
    },
  })

  function onSubmit(values: CustomerProfileInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await updateCustomerProfileAction(values)
      if (result.success) {
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function handleDeactivate() {
    startTransition(async () => {
      const result = await deactivateCustomerAccountAction()
      if (result && !result.success) {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Personal Information &amp; Service Address</span>
          </CardTitle>
          <CardDescription>
            Keep your photo, Philippine contact number, preferred branch, and service address accurate for home visits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfilePhotoField
            currentAvatarUrl={profile.avatar_url}
            fullName={formatFullName(profile)}
          />

          {feedback && <FormBanner type={feedback.type} message={feedback.message} />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="cust-first">First name</Label>
                <Input id="cust-first" {...register('first_name')} />
                {errors.first_name && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-middle">Middle name</Label>
                <Input id="cust-middle" {...register('middle_name')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-last">Last name</Label>
                <Input id="cust-last" {...register('last_name')} />
                {errors.last_name && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="cust-email">Email address</Label>
                <Input id="cust-email" value={profile.email} readOnly className="bg-muted" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-phone">Phone (+63)</Label>
                <Input id="cust-phone" type="tel" {...register('phone')} />
                {errors.phone && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-branch">Preferred Branch</Label>
                <Controller
                  name="branch_location"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="cust-branch">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_BRANCHES.map((branch) => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust-street">Street / Unit / Building / Subdivision</Label>
              <Input id="cust-street" {...register('address_street')} />
              {errors.address_street && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.address_street.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="cust-barangay">Barangay</Label>
                <Input id="cust-barangay" {...register('address_barangay')} />
                {errors.address_barangay && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.address_barangay.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-city">City / Municipality</Label>
                <Input id="cust-city" {...register('address_city')} />
                {errors.address_city && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.address_city.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-province">Province</Label>
                <Input id="cust-province" list="cust-provinces" {...register('address_province')} />
                <datalist id="cust-provinces">
                  {PH_PROVINCES.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
                {errors.address_province && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.address_province.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-zip">4-Digit ZIP</Label>
                <Input id="cust-zip" maxLength={4} {...register('address_zip_code')} />
                {errors.address_zip_code && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.address_zip_code.message}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              <span>Save Profile Changes</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Subtle Security & Session Controls */}
      <div className="space-y-3">
        <ChangePasswordCard />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-card/70 px-4 py-3">
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Sign Out</span>
            </Button>
          </form>

          <ConfirmationDialog
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:bg-rose-50 hover:text-rose-700"
              >
                Deactivate account
              </Button>
            }
            title="Deactivate your Spindle account?"
            description="You will be signed out immediately and blocked from signing back in until an administrator restores your account."
            confirmLabel="Yes, Deactivate Account"
            isPending={isPending}
            onConfirm={handleDeactivate}
          />
        </div>
      </div>
    </div>
  )
}
