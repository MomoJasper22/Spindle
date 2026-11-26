import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireAdminFeature } from '@/lib/auth/session'
import {
  getAdminActivityLogs,
  getAdminAppliances,
  getAdminPayments,
  getAdminRepairs,
  getAdminTechProfiles,
  getAdminUsers,
} from '@/lib/data/portal-data'
import { ExecutiveSummaryPanel } from '@/features/admin/components/executive-summary-panel'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'

export const metadata: Metadata = {
  title: 'Admin Overview',
}

async function AdminDashboardContent() {
  const profile = await requireAdminFeature('dashboard')

  const [users, techProfiles, appliances, repairs, payments, activityLogs] = await Promise.all([
    getAdminUsers(),
    getAdminTechProfiles(),
    getAdminAppliances(),
    getAdminRepairs(),
    getAdminPayments(),
    getAdminActivityLogs(20),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Operations Overview, {profile.first_name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revenue, active dispatch volume, pending verifications, and recent audit activity.
        </p>
      </div>

      <ExecutiveSummaryPanel
        users={users}
        techProfiles={techProfiles}
        appliances={appliances}
        repairs={repairs}
        payments={payments}
        activityLogs={activityLogs}
      />
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  )
}
