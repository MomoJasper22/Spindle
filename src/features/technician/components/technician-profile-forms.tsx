'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Loader2, LogOut, Save, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const savedNickname = profile.nickname ?? ''

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<TechnicianNicknameInput>({
    resolver: zodResolver(technicianNicknameSchema),
    mode: 'onBlur',
    defaultValues: {
      nickname: savedNickname,
    },
  })

  React.useEffect(() => {
    reset({ nickname: savedNickname })
  }, [reset, savedNickname])

  function onSubmit(values: TechnicianNicknameInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await updateTechnicianNicknameAction(values)
      if (result.success) {
        reset({ nickname: values.nickname?.trim() ?? '' })
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
            <span>Profile &amp; Field Credentials</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfilePhotoField
            currentAvatarUrl={profile.avatar_url}
            currentAvatarPosition={profile.avatar_position}
            fullName={formatFullName(profile)}
          />

          {feedback && <FormBanner type={feedback.type} message={feedback.message} />}

          {/* Direct Inline Display Nickname */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-xl border border-border bg-muted/20 p-4"
            noValidate
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="tech-nickname">Display Nickname</Label>
                <Input
                  id="tech-nickname"
                  placeholder="e.g. Kuya Jun, Tech Rico"
                  aria-describedby={errors.nickname ? 'tech-nickname-error' : undefined}
                  {...register('nickname')}
                />
                {errors.nickname && (
                  <p id="tech-nickname-error" role="alert" className="text-xs text-destructive">
                    {errors.nickname.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isPending || !isDirty}
                className="w-full sm:w-auto shrink-0"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                <span>Save Nickname</span>
              </Button>
            </div>
          </form>

          {/* Compact Field Credentials Summary */}
          <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  Dispatch &amp; Trade Credentials
                </h3>
              </div>
              <Badge variant="slate">Admin-managed</Badge>
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
                <dt className="text-xs font-medium text-muted-foreground">Daily Job Limit</dt>
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
              <p className="text-xs font-medium text-muted-foreground">Specializations</p>
              {assignedSpecializations.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {assignedSpecializations.map((spec) => (
                    <Badge key={spec} variant="outline">
                      {spec}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Pending administrator assignment.</p>
              )}

              {proposedSpecializations.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-amber-ink">
                    Proposed (Awaiting Admin Review)
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

            <p className="text-xs text-muted-foreground">
              Need to change your branch, phone, address, or specializations? Contact your branch administrator.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <ChangePasswordCard />

        <div className="flex items-center justify-between rounded-lg border border-border/80 bg-card/70 px-4 py-3">
          <span className="text-xs text-muted-foreground">
            Signing out automatically marks your shift as Off Duty.
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
