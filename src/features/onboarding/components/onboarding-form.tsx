'use client'

import * as React from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Wrench,
} from 'lucide-react'
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
import { PhilippineAddressFields } from '@/components/shared/ph-address-fields'
import { ProfilePhotoField } from '@/components/shared/profile-photo-field'
import { Badge } from '@/components/ui/badge'
import type { AvatarPosition } from '@/lib/avatar'
import { APPLIANCE_CATEGORIES, SERVICE_BRANCHES, type UserRole } from '@/lib/constants'
import { formatAddress, formatPHPhone } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { completeOnboardingAction } from '../actions/onboarding-actions'
import { getOnboardingSchema, type OnboardingInput } from '../schemas/onboarding-schemas'

interface OnboardingFormProps {
  firstName: string
  fullName: string
  role: UserRole
  avatarUrl?: string | null
  avatarPosition?: AvatarPosition | null
  assignedSpecializations?: string[]
  initialValues?: Partial<OnboardingInput>
}

export function OnboardingForm({
  firstName,
  fullName,
  role,
  avatarUrl,
  avatarPosition,
  assignedSpecializations = [],
  initialValues,
}: OnboardingFormProps) {
  const isTechnician = role === 'technician'
  const hasPrefilledAdminDetails =
    isTechnician &&
    Boolean(
      initialValues?.phone?.trim() &&
        initialValues?.branch_location &&
        initialValues?.address_street?.trim() &&
        initialValues?.address_barangay?.trim() &&
        initialValues?.address_city?.trim() &&
        initialValues?.address_province?.trim() &&
        initialValues?.address_zip_code?.trim()
    )

  const totalSteps = isTechnician ? (hasPrefilledAdminDetails ? 1 : 3) : 2
  const [step, setStep] = React.useState(1)
  const [showContactEditor, setShowContactEditor] = React.useState(false)
  const [showProposeSpecs, setShowProposeSpecs] = React.useState(
    assignedSpecializations.length === 0
  )
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
    resolver: zodResolver(getOnboardingSchema(role)),
    mode: 'onBlur',
    defaultValues: {
      phone: initialValues?.phone ?? '',
      branch_location: initialValues?.branch_location ?? SERVICE_BRANCHES[0],
      address_street: initialValues?.address_street ?? '',
      address_barangay: initialValues?.address_barangay ?? '',
      address_city: initialValues?.address_city ?? '',
      address_province: initialValues?.address_province ?? 'Metro Manila',
      address_zip_code: initialValues?.address_zip_code ?? '',
      nickname: initialValues?.nickname ?? '',
      proposed_specializations: initialValues?.proposed_specializations ?? [],
      certification_no: initialValues?.certification_no ?? '',
    },
  })

  const proposedSpecializations = useWatch({ control, name: 'proposed_specializations' }) ?? []
  const watchedPhone = useWatch({ control, name: 'phone' })
  const watchedBranch = useWatch({ control, name: 'branch_location' })
  const watchedStreet = useWatch({ control, name: 'address_street' })
  const watchedBarangay = useWatch({ control, name: 'address_barangay' })
  const watchedCity = useWatch({ control, name: 'address_city' })
  const watchedProvince = useWatch({ control, name: 'address_province' })
  const watchedZip = useWatch({ control, name: 'address_zip_code' })

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

  function toggleProposedSpecialization(category: string, checked: boolean) {
    const next = checked
      ? [...proposedSpecializations, category]
      : proposedSpecializations.filter((item) => item !== category)
    setValue('proposed_specializations', next, { shouldValidate: true })
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
    { id: 1, title: isTechnician ? 'Contact & Branch' : 'Phone & Area', icon: Phone },
    { id: 2, title: isTechnician ? 'Base Address' : 'Home Address', icon: MapPin },
    ...(isTechnician ? [{ id: 3, title: 'Credentials, Nickname & Photo', icon: Wrench }] : []),
  ]

  const hasContactOrAddressError = Boolean(
    errors.phone ||
      errors.branch_location ||
      errors.address_street ||
      errors.address_barangay ||
      errors.address_city ||
      errors.address_province ||
      errors.address_zip_code
  )

  const renderTechnicianCredentialsStep = () => (
    <div className="space-y-5">
      <ProfilePhotoField
        currentAvatarUrl={avatarUrl}
        currentAvatarPosition={avatarPosition}
        fullName={fullName}
        layout="compact"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="onboard-nickname">
            Display Nickname <span className="text-destructive">*</span>
          </Label>
          <Input
            id="onboard-nickname"
            placeholder="e.g. Kuya Jun, Tech Rico"
            aria-invalid={Boolean(errors.nickname)}
            {...register('nickname')}
          />
          <p className="text-xs text-muted-foreground">
            Shown on your overview and editable anytime.
          </p>
          {errors.nickname && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {errors.nickname.message}
            </p>
          )}
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

      {assignedSpecializations.length > 0 && (
        <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">Assigned Specializations</p>
            <button
              type="button"
              onClick={() => setShowProposeSpecs((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>{showProposeSpecs ? 'Hide additions' : 'Propose more'}</span>
              <ChevronDown
                className={cn('h-3.5 w-3.5 transition-transform', showProposeSpecs && 'rotate-180')}
                aria-hidden="true"
              />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {assignedSpecializations.map((spec) => (
              <Badge key={spec} variant="outline">
                {spec}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {showProposeSpecs && (
        <div className="space-y-2">
          <Label>Propose Appliance Specializations (optional)</Label>
          <p className="text-xs text-muted-foreground">
            Select categories for your branch administrator to approve.
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2 pt-1">
            {APPLIANCE_CATEGORIES.map((cat) => {
              const checked = proposedSpecializations.includes(cat)
              const checkboxId = `spec-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
              return (
                <label
                  key={cat}
                  htmlFor={checkboxId}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm cursor-pointer transition-colors',
                    checked
                      ? 'border-primary bg-primary-tint/70 text-foreground'
                      : 'border-border bg-card hover:bg-muted/50'
                  )}
                >
                  <Checkbox
                    id={checkboxId}
                    checked={checked}
                    onCheckedChange={(val) => toggleProposedSpecialization(cat, val === true)}
                  />
                  <span>{cat}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {hasPrefilledAdminDetails && (
        <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs space-y-0.5">
              <p className="font-semibold text-foreground">
                {watchedBranch} &middot; {formatPHPhone(watchedPhone)}
              </p>
              <p className="text-muted-foreground">
                {formatAddress({
                  street: watchedStreet,
                  barangay: watchedBarangay,
                  city: watchedCity,
                  province: watchedProvince,
                  zip: watchedZip,
                })}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowContactEditor((prev) => !prev)}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{showContactEditor ? 'Done' : 'Edit'}</span>
            </Button>
          </div>

          {(showContactEditor || hasContactOrAddressError) && (
            <div className="space-y-4 border-t border-border pt-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="onboard-phone">Mobile or landline number</Label>
                  <Input
                    id="onboard-phone"
                    type="tel"
                    autoComplete="tel"
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p role="alert" className="text-xs font-medium text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="onboard-branch">Service branch</Label>
                  <Controller
                    name="branch_location"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="onboard-branch">
                          <SelectValue placeholder="Choose your service area" />
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

              <PhilippineAddressFields
                register={register}
                errors={errors}
                idPrefix="onboard"
                streetLabel="House / Unit No., Street, Subdivision"
                streetPlaceholder="Unit 14B, Katipunan Ave., Loyola Heights"
                zipLabel="4-Digit Postal Code"
                requiredMark
              />
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-xl sm:text-2xl">Welcome to Spindle, {firstName}</CardTitle>
            <CardDescription className="mt-1">
              {hasPrefilledAdminDetails
                ? 'Set your display nickname, photo, and confirm your field credentials.'
                : isTechnician
                  ? 'Complete your contact details, address, and field credentials to get started.'
                  : 'Add your phone number and home address so our technicians know where to visit.'}
            </CardDescription>
          </div>
          {totalSteps > 1 && (
            <span className="rounded-full bg-primary-tint px-3 py-1 text-xs font-semibold text-primary">
              Step {step} of {totalSteps}
            </span>
          )}
        </div>

        {totalSteps > 1 && (
          <ol
            className={cn('mt-5 grid gap-2', isTechnician ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}
            aria-label="Setup progress"
          >
            {stepsMeta.map((item) => {
              const Icon = item.icon
              const isCurrent = step === item.id
              const isCompleted = step > item.id
              return (
                <li
                  key={item.id}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors',
                    isCurrent
                      ? 'border-primary bg-primary-tint text-primary'
                      : isCompleted
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-border bg-muted/40 text-muted-foreground'
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
        )}
      </CardHeader>

      <CardContent className="pt-6">
        <FormBanner type="error" message={serverError} className="mb-5" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {hasPrefilledAdminDetails ? (
            renderTechnicianCredentialsStep()
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="onboard-phone">
                      Mobile or landline number <span className="text-destructive">*</span>
                    </Label>
                    <p id="onboard-phone-hint" className="text-xs text-muted-foreground">
                      Example: 0917 555 0192 or +63 917 555 0192
                    </p>
                    <Input
                      id="onboard-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="0917 555 0192"
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
                      Nearest service area <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="branch_location"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="onboard-branch" aria-invalid={Boolean(errors.branch_location)}>
                            <SelectValue placeholder="Choose your service area" />
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
                  <PhilippineAddressFields
                    register={register}
                    errors={errors}
                    idPrefix="onboard"
                    streetLabel="House / Unit No., Street, Subdivision"
                    streetPlaceholder="Unit 14B, Katipunan Ave., Loyola Heights"
                    zipLabel="4-Digit Postal Code"
                    requiredMark
                  />
                </div>
              )}

              {step === 3 && isTechnician && renderTechnicianCredentialsStep()}
            </>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
            {totalSteps > 1 && step > 1 ? (
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

            {totalSteps > 1 && step < totalSteps ? (
              <Button type="button" onClick={handleNextStep}>
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>Finish Setup</span>
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
