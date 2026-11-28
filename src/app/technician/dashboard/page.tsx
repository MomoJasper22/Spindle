import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import {
  getTechnicianActivityLogs,
  getTechnicianAppointments,
  getTechnicianPayments,
  getTechnicianRepairs,
} from '@/lib/data/portal-data'
import { TechnicianOverviewView } from '@/features/technician/components/technician-overview-view'
import { TechnicianDashboardFallback } from '@/features/technician/components/technician-cached-fallbacks'
import { formatTechnicianGreetingName } from '@/lib/formatters'

export const metadata: Metadata = {
  title: 'Technician Overview',
}

async function TechnicianDashboardContent() {
  const profile = await requireRole('technician')

  const [repairs, appointments, payments, activityLogs] = await Promise.all([
    getTechnicianRepairs(profile.user_id),
    getTechnicianAppointments(profile.user_id),
    getTechnicianPayments(profile.user_id),
    getTechnicianActivityLogs(8, profile.user_id),
  ])

  return (
    <TechnicianOverviewView
      techId={profile.user_id}
      techDisplayName={formatTechnicianGreetingName(profile)}
      availabilityStatus={profile.technician_profile?.availability_status ?? 'available'}
      repairs={repairs}
      appointments={appointments}
      payments={payments}
      activityLogs={activityLogs}
    />
  )
}

export default function TechnicianDashboardPage() {
  return (
    <Suspense fallback={<TechnicianDashboardFallback />}>
      <TechnicianDashboardContent />
    </Suspense>
  )
}
