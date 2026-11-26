import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { CustomerProfileForms } from '@/features/customer/components/customer-profile-forms'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Customer Profile & Settings',
}

async function CustomerProfileContent() {
  const profile = await requireRole('customer')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Profile &amp; Account Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your contact details, default Philippine service address, and password.
          </p>
        </div>
        <Badge variant="default" className="font-mono">
          {profile.user_id} &middot; Customer
        </Badge>
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
