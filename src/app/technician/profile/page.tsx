import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { TechnicianProfileForms } from '@/features/technician/components/technician-profile-forms'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Technician Profile & Settings',
}

async function TechnicianProfileContent() {
  const profile = await requireRole('technician')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Technician Profile &amp; Credentials
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your profile photo, display nickname, and password. Field credentials and specializations are managed by Admin.
          </p>
        </div>
        <Badge variant="secondary" className="font-mono">
          {profile.user_id} &middot; Technician
        </Badge>
      </div>

      <TechnicianProfileForms profile={profile} techProfile={profile.technician_profile} />
    </div>
  )
}

export default function TechnicianProfilePage() {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <TechnicianProfileContent />
    </Suspense>
  )
}
