'use client'

import * as React from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, LogOut, Save, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  APPLIANCE_CATEGORIES,
  PH_PROVINCES,
  SERVICE_BRANCHES,
  TECH_AVAILABILITY_STATUSES,
} from '@/lib/constants'
import { humanizeLabel } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { TechnicianProfileRow, UserRow } from '@/types/database'
import { updateTechnicianProfileAction } from '../actions/technician-actions'
import {
  technicianProfileSchema,
  type TechnicianProfileInput,
} from '../schemas/technician-schemas'

interface TechnicianProfileFormsProps {
  profile: UserRow
  techProfile: TechnicianProfileRow | null
}

export function TechnicianProfileForms({ profile, techProfile }: TechnicianProfileFormsProps) {
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TechnicianProfileInput>({
    resolver: zodResolver(technicianProfileSchema),
    mode: 'onBlur',
    defaultValues: {
      first_name: profile.first_name,
      middle_name: profile.middle_name ?? '',
      last_name: profile.last_name,
      phone: profile.phone ?? '',
      branch_location:
        (profile.branch_location as TechnicianProfileInput['branch_location']) ??
        SERVICE_BRANCHES[0],
      address_street: profile.address_street ?? '',
      address_barangay: profile.address_barangay ?? '',
      address_city: profile.address_city ?? '',
      address_province: profile.address_province ?? 'Metro Manila',
      address_zip_code: profile.address_zip_code ?? '',
      specializations: techProfile?.specializations ?? [],
      certification_no: techProfile?.certification_no ?? '',
      max_daily_jobs: techProfile?.max_daily_jobs ?? 4,
      availability_status: techProfile?.availability_status ?? 'available',
    },
  })

  const selectedSpecs = useWatch({ control, name: 'specializations' }) ?? []

  function toggleSpec(cat: string, checked: boolean) {
    const next = checked
      ? [...selectedSpecs, cat]
      : selectedSpecs.filter((item) => item !== cat)
    setValue('specializations', next, { shouldValidate: true })
  }

  function onSubmit(values: TechnicianProfileInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await updateTechnicianProfileAction(values)
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
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Technician Identity &amp; Field Credentials</span>
          </CardTitle>
          <CardDescription>
            Update your contact details, branch assignment, TESDA certification, daily job limit, and availability.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feedback && <FormBanner type={feedback.type} message={feedback.message} className="mb-5" />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="tech-first">First name</Label>
                <Input id="tech-first" {...register('first_name')} />
                {errors.first_name && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tech-middle">Middle name</Label>
                <Input id="tech-middle" {...register('middle_name')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tech-last">Last name</Label>
                <Input id="tech-last" {...register('last_name')} />
                {errors.last_name && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="tech-email">Email</Label>
                <Input id="tech-email" value={profile.email} readOnly className="bg-muted" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tech-phone">Phone (+63)</Label>
                <Input id="tech-phone" type="tel" {...register('phone')} />
                {errors.phone && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tech-branch">Assigned Branch</Label>
                <Controller
                  name="branch_location"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="tech-branch">
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
              <Label htmlFor="tech-street">Philippine Base Street Address</Label>
              <Input id="tech-street" {...register('address_street')} />
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="tech-barangay">Barangay</Label>
                <Input id="tech-barangay" {...register('address_barangay')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tech-city">City / Municipality</Label>
                <Input id="tech-city" {...register('address_city')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tech-province">Province</Label>
                <Input id="tech-province" list="tech-provinces" {...register('address_province')} />
                <datalist id="tech-provinces">
                  {PH_PROVINCES.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tech-zip">4-Digit ZIP</Label>
                <Input id="tech-zip" maxLength={4} {...register('address_zip_code')} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 border-t border-border pt-5">
              <div className="space-y-1.5">
                <Label htmlFor="tech-cert">TESDA / Certification No.</Label>
                <Input id="tech-cert" {...register('certification_no')} />
                {errors.certification_no && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.certification_no.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tech-capacity">Max Daily Jobs (1–15)</Label>
                <Input
                  id="tech-capacity"
                  type="number"
                  min={1}
                  max={15}
                  {...register('max_daily_jobs', { valueAsNumber: true })}
                />
                {errors.max_daily_jobs && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.max_daily_jobs.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tech-availability">Availability Status</Label>
                <Controller
                  name="availability_status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="tech-availability">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TECH_AVAILABILITY_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {humanizeLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Appliance Specializations</Label>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {APPLIANCE_CATEGORIES.map((cat) => {
                  const checked = selectedSpecs.includes(cat)
                  const id = `tech-spec-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
                  return (
                    <label
                      key={cat}
                      htmlFor={id}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer transition-colors',
                        checked
                          ? 'border-primary bg-primary-tint/70 text-foreground'
                          : 'border-border bg-card hover:bg-muted/50'
                      )}
                    >
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={(v) => toggleSpec(cat, v === true)}
                      />
                      <span>{cat}</span>
                    </label>
                  )
                })}
              </div>
              {errors.specializations && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.specializations.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              <span>Save Technician Profile</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      <ChangePasswordCard />

      <Card>
        <CardHeader>
          <CardTitle>Session Controls</CardTitle>
          <CardDescription>End your current authenticated field session safely.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Sign Out of Spindle</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
