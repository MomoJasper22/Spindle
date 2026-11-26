'use client'

import * as React from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, MapPin, Phone, Wrench } from 'lucide-react'
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
import { APPLIANCE_CATEGORIES, PH_PROVINCES, SERVICE_BRANCHES, type UserRole } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { completeOnboardingAction } from '../actions/onboarding-actions'
import { onboardingSchema, type OnboardingInput } from '../schemas/onboarding-schemas'

interface OnboardingFormProps {
  firstName: string
  role: UserRole
  initialValues?: Partial<OnboardingInput>
}

export function OnboardingForm({ firstName, role, initialValues }: OnboardingFormProps) {
  const isTechnician = role === 'technician'
  const totalSteps = isTechnician ? 3 : 2
  const [step, setStep] = React.useState(1)
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const {
    register,
    control,
    trigger,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onBlur',
    defaultValues: {
      phone: initialValues?.phone ?? '',
      branch_location: initialValues?.branch_location ?? SERVICE_BRANCHES[0],
      address_street: initialValues?.address_street ?? '',
      address_barangay: initialValues?.address_barangay ?? '',
      address_city: initialValues?.address_city ?? '',
      address_province: initialValues?.address_province ?? 'Metro Manila',
      address_zip_code: initialValues?.address_zip_code ?? '',
      specializations: initialValues?.specializations ?? [],
      certification_no: initialValues?.certification_no ?? '',
    },
  })

  const selectedSpecializations = useWatch({ control, name: 'specializations' }) ?? []

  async function handleNextStep() {
    setServerError(null)
    if (step === 1) {
      const valid = await trigger(['phone', 'branch_location'])
      if (valid) setStep(2)
      return
    }
    if (step === 2 && isTechnician) {
      const valid = await trigger([
        'address_street',
        'address_barangay',
        'address_city',
        'address_province',
        'address_zip_code',
      ])
      if (valid) setStep(3)
    }
  }

  function toggleSpecialization(category: string, checked: boolean) {
    const next = checked
      ? [...selectedSpecializations, category]
      : selectedSpecializations.filter((item) => item !== category)
    setValue('specializations', next, { shouldValidate: true })
  }

  function onSubmit(values: OnboardingInput) {
    setServerError(null)
    startTransition(async () => {
      const result = await completeOnboardingAction(values)
      if (result && !result.success) {
        setServerError(result.error)
      }
    })
  }

  const stepsMeta = [
    { id: 1, title: 'Contact & Branch', icon: Phone },
    { id: 2, title: 'Service Address', icon: MapPin },
    ...(isTechnician ? [{ id: 3, title: 'Field Credentials', icon: Wrench }] : []),
  ]

  return (
    <Card className="w-full max-w-2xl shadow-sm">
      <CardHeader className="border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-xl">Welcome to Spindle, {firstName}</CardTitle>
            <CardDescription className="mt-1">
              Complete your Philippine service profile to activate your workspace.
            </CardDescription>
          </div>
          <span className="rounded-full bg-primary-tint px-3 py-1 text-xs font-semibold text-primary">
            Step {step} of {totalSteps}
          </span>
        </div>

        {/* Step Indicator */}
        <ol className="mt-5 grid gap-2 sm:grid-cols-3" aria-label="Onboarding progress">
          {stepsMeta.map((item) => {
            const Icon = item.icon
            const isCurrent = step === item.id
            const isCompleted = step > item.id
            return (
              <li
                key={item.id}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                  isCurrent
                    ? 'border-primary bg-primary-tint text-primary'
                    : isCompleted
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-border bg-slate-50 text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span>{item.title}</span>
              </li>
            )
          })}
        </ol>
      </CardHeader>

      <CardContent className="pt-6">
        <FormBanner type="error" message={serverError} className="mb-5" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="onboard-phone">
                  Philippine mobile or landline <span className="text-destructive">*</span>
                </Label>
                <p id="onboard-phone-hint" className="text-xs text-muted-foreground">
                  Accepted format: +63 917 555 0192 or 0917 555 0192
                </p>
                <Input
                  id="onboard-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+63 917 555 0192"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={
                    errors.phone ? 'onboard-phone-hint onboard-phone-error' : 'onboard-phone-hint'
                  }
                  {...register('phone')}
                />
                {errors.phone && (
                  <p id="onboard-phone-error" role="alert" className="text-xs font-medium text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="onboard-branch">
                  Nearest Spindle service hub <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="branch_location"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="onboard-branch" aria-invalid={Boolean(errors.branch_location)}>
                        <SelectValue placeholder="Select service branch" />
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
                {errors.branch_location && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {errors.branch_location.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="onboard-street">
                  House / Unit No., Building, Street, Subdivision{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="onboard-street"
                  autoComplete="street-address"
                  placeholder="Unit 14B, Katipunan Ave., Loyola Heights"
                  aria-invalid={Boolean(errors.address_street)}
                  {...register('address_street')}
                />
                {errors.address_street && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {errors.address_street.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="onboard-barangay">
                    Barangay <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="onboard-barangay"
                    placeholder="Brgy. Loyola Heights"
                    aria-invalid={Boolean(errors.address_barangay)}
                    {...register('address_barangay')}
                  />
                  {errors.address_barangay && (
                    <p role="alert" className="text-xs font-medium text-destructive">
                      {errors.address_barangay.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="onboard-city">
                    City / Municipality <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="onboard-city"
                    autoComplete="address-level2"
                    placeholder="Quezon City"
                    aria-invalid={Boolean(errors.address_city)}
                    {...register('address_city')}
                  />
                  {errors.address_city && (
                    <p role="alert" className="text-xs font-medium text-destructive">
                      {errors.address_city.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="onboard-province">
                    Province / Region <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="onboard-province"
                    list="ph-provinces-list"
                    autoComplete="address-level1"
                    placeholder="Metro Manila"
                    aria-invalid={Boolean(errors.address_province)}
                    {...register('address_province')}
                  />
                  <datalist id="ph-provinces-list">
                    {PH_PROVINCES.map((prov) => (
                      <option key={prov} value={prov} />
                    ))}
                  </datalist>
                  {errors.address_province && (
                    <p role="alert" className="text-xs font-medium text-destructive">
                      {errors.address_province.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="onboard-zip">
                    4-Digit Postal / ZIP Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="onboard-zip"
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="postal-code"
                    placeholder="1108"
                    aria-invalid={Boolean(errors.address_zip_code)}
                    {...register('address_zip_code')}
                  />
                  {errors.address_zip_code && (
                    <p role="alert" className="text-xs font-medium text-destructive">
                      {errors.address_zip_code.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && isTechnician && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>
                  Appliance Specializations <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Select every appliance category you are certified to service in the field.
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2 pt-1">
                  {APPLIANCE_CATEGORIES.map((cat) => {
                    const checked = selectedSpecializations.includes(cat)
                    const checkboxId = `spec-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
                    return (
                      <label
                        key={cat}
                        htmlFor={checkboxId}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors',
                          checked
                            ? 'border-primary bg-primary-tint/70 text-foreground'
                            : 'border-border bg-card hover:bg-muted/50'
                        )}
                      >
                        <Checkbox
                          id={checkboxId}
                          checked={checked}
                          onCheckedChange={(val) => toggleSpecialization(cat, val === true)}
                        />
                        <span>{cat}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="onboard-cert">
                  TESDA / Technical Certification No. <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="onboard-cert"
                  placeholder="e.g. TESDA-RAC-NCII-2026-0842"
                  aria-invalid={Boolean(errors.certification_no)}
                  {...register('certification_no')}
                />
                {errors.certification_no && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {errors.certification_no.message}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={isPending}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Back</span>
              </Button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <Button type="button" onClick={handleNextStep}>
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Saving profile...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>Complete Setup</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
