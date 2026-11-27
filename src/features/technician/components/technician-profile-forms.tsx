'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Loader2, LogOut, Pencil, Save, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormBanner } from '@/components/shared/form-banner'
import { ProfilePhotoField } from '@/components/shared/profile-photo-field'
import { signOutAction } from '@/features/auth/actions/auth-actions'
import { ChangePasswordCard } from '@/features/auth/components/change-password-card'
import type { AuthenticatedUserProfile } from '@/lib/auth/session'
import { formatAddress, formatFullName, formatPHPhone } from '@/lib/formatters'
import type { TechnicianProfileRow } from '@/types/database'
import { updateTechnicianNicknameAction } from '../actions/technician-actions'
import {
  technicianNicknameSchema,
  type TechnicianNicknameInput,
} from '../schemas/technician-schemas'

interface TechnicianProfileFormsProps {
  profile: AuthenticatedUserProfile
  techProfile: TechnicianProfileRow | null
}

export function TechnicianProfileForms({ profile, techProfile }: TechnicianProfileFormsProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const savedNickname = profile.nickname ?? ''

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TechnicianNicknameInput>({
    resolver: zodResolver(technicianNicknameSchema),
    mode: 'onBlur',
    defaultValues: {
      nickname: savedNickname,
    },
  })

  React.useEffect(() => {
    if (!isEditing) {
      reset({ nickname: savedNickname })
    }
  }, [isEditing, reset, savedNickname])

  function onSubmit(values: TechnicianNicknameInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await updateTechnicianNicknameAction(values)
      if (result.success) {
        setIsEditing(false)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  const assignedSpecializations = techProfile?.specializations ?? []
  const proposedSpecializations = techProfile?.proposed_specializations ?? []
  const fullAddress = formatAddress({
    street: profile.address_street,
    barangay: profile.address_barangay,
    city: profile.address_city,
    province: profile.address_province,
    zip: profile.address_zip_code,
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Technician Identity &amp; Field Credentials</span>
          </CardTitle>
          <CardDescription>
            Update your profile photo and nickname. Personal details, assigned branch, specializations, and daily job capacity are managed by your administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfilePhotoField
            currentAvatarUrl={profile.avatar_url}
            currentAvatarPosition={profile.avatar_position}
            fullName={formatFullName(profile)}
          />

          {feedback && <FormBanner type={feedback.type} message={feedback.message} />}

          {/* Display Nickname (Only freely editable profile detail) */}
          {!isEditing ? (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Display Nickname</p>
                <p className="font-heading text-base font-semibold text-foreground">
                  {profile.nickname || 'No nickname set'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Only your display nickname can be edited directly. Other field credentials are managed by your administrator.
                </p>
              </div>

              <Button
                type="button"
                className="w-full sm:w-auto shrink-0"
                onClick={() => {
                  reset({ nickname: savedNickname })
                  setFeedback(null)
                  setIsEditing(true)
                }}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                <span>Edit Profile</span>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-border bg-muted/30 p-4" noValidate>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="tech-nickname">Display Nickname</Label>
                  <p id="tech-nickname-hint" className="text-xs text-muted-foreground">
                    This is the only personal detail you can freely edit (e.g. Kuya Jun, Tech Rico).
                  </p>
                  <Input
                    id="tech-nickname"
                    placeholder="Enter a nickname or preferred name"
                    aria-describedby={
                      errors.nickname ? 'tech-nickname-hint tech-nickname-error' : 'tech-nickname-hint'
                    }
                    {...register('nickname')}
                  />
                  {errors.nickname && (
                    <p id="tech-nickname-error" role="alert" className="text-xs text-destructive">
                      {errors.nickname.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
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
                    className="w-full sm:w-auto"
                    onClick={() => {
                      reset({ nickname: savedNickname })
                      setFeedback(null)
                      setIsEditing(false)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Read-only Admin-Managed Details */}
          <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  Admin-Managed Personal &amp; Dispatch Details
                </h3>
              </div>
              <Badge variant="slate">Read-only</Badge>
            </div>

            <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Full Name</dt>
                <dd className="mt-0.5 font-semibold text-foreground">{formatFullName(profile)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Email Address</dt>
                <dd className="mt-0.5 font-medium text-foreground">{profile.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Phone (+63)</dt>
                <dd className="mt-0.5 font-medium text-foreground">{formatPHPhone(profile.phone)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Assigned Branch</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {profile.branch_location || 'Unassigned'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">TESDA / Certification No.</dt>
                <dd className="mt-0.5 font-mono text-xs font-semibold text-foreground">
                  {techProfile?.certification_no || 'Not on file'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Max Daily Jobs (1–15)</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
                  {techProfile?.max_daily_jobs ?? 4} jobs / day
                </dd>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-xs font-medium text-muted-foreground">Base Address</dt>
                <dd className="mt-0.5 text-foreground">{fullAddress}</dd>
              </div>
            </dl>

            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground">
                Assigned Appliance Specializations
              </p>
              {assignedSpecializations.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {assignedSpecializations.map((spec) => (
                    <Badge key={spec} variant="outline">
                      {spec}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Pending administrator assignment.
                </p>
              )}

              {proposedSpecializations.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-amber-ink">
                    Proposed Specializations (Awaiting Admin Review)
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {proposedSpecializations.map((spec) => (
                      <Badge key={spec} variant="amber">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <ChangePasswordCard />

        <div className="flex items-center justify-between rounded-lg border border-border/80 bg-card/70 px-4 py-3">
          <span className="text-xs text-muted-foreground">
            End your current field session safely.
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
