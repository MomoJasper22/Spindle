import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { CustomerProfileForms } from '@/features/customer/components/customer-profile-forms'
import { PageSkeleton } from '@/components/shared/page-skeleton'

export const metadata: Metadata = {
  title: 'Profile & Settings',
}

async function CustomerProfileContent() {
  const profile = await requireRole('customer')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Your Profile &amp; Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your photo, phone number, home address, or password anytime.
        </p>
      </div>

      <CustomerProfileForms profile={profile} />
    </div>
  )
}

export default function CustomerProfilePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CustomerProfileContent />
    </Suspense>
  )
}
