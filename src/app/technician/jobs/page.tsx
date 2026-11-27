import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import {
  getTechnicianAppointments,
  getTechnicianPayments,
  getTechnicianRepairs,
} from '@/lib/data/portal-data'
import {
  TechnicianJobsView,
  type JobsTabKey,
} from '@/features/technician/components/technician-jobs-view'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'

export const metadata: Metadata = {
  title: 'My Jobs',
}

const VALID_TABS: ReadonlySet<JobsTabKey> = new Set([
  'active',
  'today',
  'needs_payment',
  'completed',
  'collections',
])

function resolveTab(raw?: string): JobsTabKey {
  if (raw && VALID_TABS.has(raw as JobsTabKey)) {
    return raw as JobsTabKey
  }
  return 'active'
}

async function TechnicianJobsContent({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const [profile, params] = await Promise.all([requireRole('technician'), searchParams])

  const [repairs, appointments, payments] = await Promise.all([
    getTechnicianRepairs(profile.user_id),
    getTechnicianAppointments(profile.user_id),
    getTechnicianPayments(),
  ])

  const initialTab = resolveTab(params.tab)

  return (
    <TechnicianJobsView
      key={initialTab}
      availabilityStatus={profile.technician_profile?.availability_status ?? 'available'}
      repairs={repairs}
      appointments={appointments}
      payments={payments}
      initialTab={initialTab}
    />
  )
}

export default function TechnicianJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <TechnicianJobsContent searchParams={searchParams} />
    </Suspense>
  )
}
