import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { getTechnicianPayments } from '@/lib/data/portal-data'
import { CollectionsPanel } from '@/features/technician/components/collections-panel'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'

export const metadata: Metadata = {
  title: 'Field Collections',
}

async function TechnicianCollectionsContent() {
  await requireRole('technician')
  const payments = await getTechnicianPayments()

  return <CollectionsPanel payments={payments} />
}

export default function TechnicianCollectionsPage() {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <TechnicianCollectionsContent />
    </Suspense>
  )
}
