import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireAdminFeature } from '@/lib/auth/session'
import {
  getAdminAppointments,
  getAdminPayments,
  getAdminRepairs,
  getAdminStatusLogs,
  getAdminTechProfiles,
  getAdminUsers,
} from '@/lib/data/portal-data'
import { TechniciansPanel } from '@/features/admin/components/technicians-panel'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'

export const metadata: Metadata = {
  title: 'Technician Roster',
}

async function AdminTechniciansContent() {
  await requireAdminFeature('technicians')

  const [users, techProfiles, repairs, appointments, payments, statusLogs] = await Promise.all([
    getAdminUsers(),
    getAdminTechProfiles(),
    getAdminRepairs(),
    getAdminAppointments(),
    getAdminPayments(),
    getAdminStatusLogs(500),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Technician Roster
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor field workload, click a technician to inspect productivity, and assign specializations or daily job limits.
        </p>
      </div>

      <TechniciansPanel
        users={users}
        techProfiles={techProfiles}
        repairs={repairs}
        appointments={appointments}
        payments={payments}
        statusLogs={statusLogs}
      />
    </div>
  )
}

export default function AdminTechniciansPage() {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <AdminTechniciansContent />
    </Suspense>
  )
}
