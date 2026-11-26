import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import {
  getTechnicianActivityLogs,
  getTechnicianAppointments,
  getTechnicianRepairs,
} from '@/lib/data/portal-data'
import { TechnicianOverviewView } from '@/features/technician/components/technician-overview-view'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'
import { formatTechnicianGreetingName } from '@/lib/formatters'

export const metadata: Metadata = {
  title: 'Technician Overview',
}

async function TechnicianDashboardContent() {
  const profile = await requireRole('technician')

  const [repairs, appointments, activityLogs] = await Promise.all([
    getTechnicianRepairs(profile.user_id),
    getTechnicianAppointments(profile.user_id),
    getTechnicianActivityLogs(10),
  ])

  return (
    <TechnicianOverviewView
      techDisplayName={formatTechnicianGreetingName(profile)}
      availabilityStatus={profile.technician_profile?.availability_status ?? 'available'}
      repairs={repairs}
      appointments={appointments}
      activityLogs={activityLogs}
    />
  )
}

export default function TechnicianDashboardPage() {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <TechnicianDashboardContent />
    </Suspense>
  )
}
