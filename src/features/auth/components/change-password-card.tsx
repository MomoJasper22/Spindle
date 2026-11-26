'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormBanner } from '@/components/shared/form-banner'
import { changePasswordAction } from '@/features/auth/actions/password-actions'
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from '@/features/auth/schemas/auth-schemas'

export function ChangePasswordCard() {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>Security &amp; Password</span>
        </CardTitle>
        <CardDescription>
          Update your password. Both your authentication session and encrypted profile record stay synchronized.
        </CardDescription>
      </CardHeader>
      <CardContent>
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

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <span>Update Password</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
