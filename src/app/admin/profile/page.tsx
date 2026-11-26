import { Suspense } from 'react'
import type { Metadata } from 'next'
import { isFullAdmin, requireRole } from '@/lib/auth/session'
import { AdminProfileForms } from '@/features/admin/components/admin-profile-forms'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Admin Profile & Security',
}

async function AdminProfileContent() {
  const profile = await requireRole('admin')
  const fullAdmin = isFullAdmin(profile)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Administrator Profile &amp; Security
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fullAdmin
              ? 'Configure your managed Philippine service branch, contact details, and administrative credentials.'
              : 'Update your profile photo and password. Profile details and branch assignment are managed by a full administrator.'}
          </p>
        </div>
        <Badge variant="default" className="font-mono">
          {profile.user_id} &middot; {fullAdmin ? 'Full Admin' : 'Limited Admin'}
        </Badge>
      </div>

      <AdminProfileForms profile={profile} canEditProfileDetails={fullAdmin} />
    </div>
  )
}

export default function AdminProfilePage() {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <AdminProfileContent />
    </Suspense>
  )
}
