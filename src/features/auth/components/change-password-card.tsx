'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormBanner } from '@/components/shared/form-banner'
import { changePasswordAction } from '@/features/auth/actions/password-actions'
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from '@/features/auth/schemas/auth-schemas'
import { cn } from '@/lib/utils'

export function ChangePasswordCard() {
  const [expanded, setExpanded] = React.useState(false)
  const [showCurrent, setShowCurrent] = React.useState(false)
  const [showNew, setShowNew] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_new_password: '',
    },
  })

  function onSubmit(values: ChangePasswordInput) {
    setFeedback(null)
    startTransition(async () => {
      const result = await changePasswordAction(values)
      if (result.success) {
        setFeedback({ type: 'success', message: result.message })
        reset()
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  return (
    <div className="rounded-lg border border-border/80 bg-card/70 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-sm">
          <KeyRound className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="font-medium text-foreground">Password &amp; Security</p>
            <p className="text-xs text-muted-foreground">
              Update your account sign-in password when needed.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={expanded}
          onClick={() => {
            setExpanded((prev) => !prev)
            setFeedback(null)
          }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <span>{expanded ? 'Hide' : 'Change password'}</span>
          <ChevronDown
            className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')}
            aria-hidden="true"
          />
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-border pt-4">
          {feedback && <FormBanner type={feedback.type} message={feedback.message} className="mb-4" />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrent ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="pr-11"
                  aria-invalid={Boolean(errors.current_password)}
                  {...register('current_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((p) => !p)}
                  aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:bg-muted"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.current_password && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {errors.current_password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="pr-11"
                  aria-invalid={Boolean(errors.new_password)}
                  {...register('new_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((p) => !p)}
                  aria-label={showNew ? 'Hide new password' : 'Show new password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:bg-muted"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.new_password && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {errors.new_password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-new-password">Confirm new password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirm_new_password)}
                {...register('confirm_new_password')}
              />
              {errors.confirm_new_password && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {errors.confirm_new_password.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                <span>Update Password</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setExpanded(false)
                  reset()
                  setFeedback(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
