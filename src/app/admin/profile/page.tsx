import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { AdminProfileForms } from '@/features/admin/components/admin-profile-forms'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Admin Profile & Security',
}

async function AdminProfileContent() {
  const profile = await requireRole('admin')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Administrator Profile &amp; Security
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your managed Philippine service branch, contact details, and administrative credentials.
          </p>
        </div>
        <Badge variant="default" className="font-mono">
          {profile.user_id} &middot; Admin
        </Badge>
      </div>

      <AdminProfileForms profile={profile} />
    </div>
  )
}

export default function AdminProfilePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminProfileContent />
    </Suspense>
  )
}
