'use client'

import * as React from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormBanner } from '@/components/shared/form-banner'
import { signUpAction } from '@/features/auth/actions/auth-actions'
import { signupSchema, type SignupInput } from '@/features/auth/schemas/auth-schemas'

export function SignupForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
    defaultValues: {
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  })

  function onSubmit(values: SignupInput) {
    setServerError(null)
    startTransition(async () => {
      const result = await signUpAction(values)
      if (result && !result.success) {
        setServerError(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Create your Spindle account
        </h2>
        <p className="text-sm text-muted-foreground">
          Register your appliances and book certified repair technicians across the Philippines.
        </p>
      </div>

      <FormBanner type="error" message={serverError} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="signup-first-name">
              First name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="signup-first-name"
              autoComplete="given-name"
              placeholder="Juan"
              aria-invalid={Boolean(errors.first_name)}
              aria-describedby={errors.first_name ? 'signup-first-name-error' : undefined}
              {...register('first_name')}
            />
            {errors.first_name && (
              <p id="signup-first-name-error" role="alert" className="text-xs font-medium text-destructive">
                {errors.first_name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="signup-last-name">
              Last name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="signup-last-name"
              autoComplete="family-name"
              placeholder="Dela Cruz"
              aria-invalid={Boolean(errors.last_name)}
              aria-describedby={errors.last_name ? 'signup-last-name-error' : undefined}
              {...register('last_name')}
            />
            {errors.last_name && (
              <p id="signup-last-name-error" role="alert" className="text-xs font-medium text-destructive">
                {errors.last_name.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-middle-name">Middle name (optional)</Label>
          <Input
            id="signup-middle-name"
            autoComplete="additional-name"
            placeholder="Santos"
            aria-invalid={Boolean(errors.middle_name)}
            {...register('middle_name')}
          />
          {errors.middle_name && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {errors.middle_name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-email">
            Email address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="juan.delacruz@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'signup-email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="signup-email-error" role="alert" className="text-xs font-medium text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-password">
            Password <span className="text-destructive">*</span>
          </Label>
          <p id="signup-password-hint" className="text-xs text-muted-foreground">
            At least 8 characters with at least one letter and one number.
          </p>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a strong password"
              className="pr-11"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password
                  ? 'signup-password-hint signup-password-error'
                  : 'signup-password-hint'
              }
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="signup-password-error" role="alert" className="text-xs font-medium text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-confirm-password">
            Confirm password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="signup-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              className="pr-11"
              aria-invalid={Boolean(errors.confirm_password)}
              aria-describedby={errors.confirm_password ? 'signup-confirm-error' : undefined}
              {...register('confirm_password')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.confirm_password && (
            <p id="signup-confirm-error" role="alert" className="text-xs font-medium text-destructive">
              {errors.confirm_password.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              <span>Create Account</span>
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
