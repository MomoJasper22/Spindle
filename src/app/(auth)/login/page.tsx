import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LoginForm } from '@/features/auth/components/login-form'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Sign In',
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const initialError =
    params.error === 'account_inactive'
      ? 'This account has been deactivated. Contact an administrator to restore access.'
      : null

  return <LoginForm initialError={initialError} />
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      }
    >
      <LoginContent searchParams={searchParams} />
    </Suspense>
  )
}
