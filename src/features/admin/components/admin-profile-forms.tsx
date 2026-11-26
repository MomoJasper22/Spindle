'use client'

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, LogOut, Save, ShieldCheck } from 'lucide-react'
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
import { signOutAction } from '@/features/auth/actions/auth-actions'
import { ChangePasswordCard } from '@/features/auth/components/change-password-card'
import { PH_PROVINCES, SERVICE_BRANCHES } from '@/lib/constants'
import type { UserRow } from '@/types/database'
import { updateAdminProfileAction } from '../actions/admin-actions'
import { adminProfileSchema, type AdminProfileInput } from '../schemas/admin-schemas'

interface AdminProfileFormsProps {
  profile: UserRow
}

export function AdminProfileForms({ profile }: AdminProfileFormsProps) {
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminProfileInput>({
    resolver: zodResolver(adminProfileSchema),
    mode: 'onBlur',
    defaultValues: {
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
    },
  })

  function onSubmit(values: AdminProfileInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await updateAdminProfileAction(values)
      if (result.success) {
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
            Manage your operations contact profile, primary Philippine branch hub, and office address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feedback && <FormBanner type={feedback.type} message={feedback.message} className="mb-5" />}

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

            <div className="space-y-1.5">
              <Label htmlFor="adm-p-street">Office Street Address</Label>
              <Input id="adm-p-street" {...register('address_street')} />
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="adm-p-brgy">Barangay</Label>
                <Input id="adm-p-brgy" {...register('address_barangay')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-p-city">City</Label>
                <Input id="adm-p-city" {...register('address_city')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-p-prov">Province</Label>
                <Input id="adm-p-prov" list="adm-p-provinces" {...register('address_province')} />
                <datalist id="adm-p-provinces">
                  {PH_PROVINCES.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-p-zip">4-Digit ZIP</Label>
                <Input id="adm-p-zip" maxLength={4} {...register('address_zip_code')} />
              </div>
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              <span>Save Administrator Profile</span>
            </Button>
          </form>
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
              <span>Sign Out</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
