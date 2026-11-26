import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { getTechnicianRepairs } from '@/lib/data/portal-data'
import { TechnicianJobsView } from '@/features/technician/components/technician-jobs-view'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'

export const metadata: Metadata = {
  title: 'Assigned Jobs',
}

async function TechnicianJobsContent() {
  const profile = await requireRole('technician')
  const repairs = await getTechnicianRepairs(profile.user_id)

  return <TechnicianJobsView repairs={repairs} />
}

export default function TechnicianJobsPage() {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <TechnicianJobsContent />
    </Suspense>
  )
}
