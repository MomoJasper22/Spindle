import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { ExecutiveSummaryPanel } from '@/features/admin/components/executive-summary-panel'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type {
  ActivityLogRow,
  CustomerApplianceRow,
  PaymentDetailView,
  RepairDetailView,
  TechnicianProfileRow,
  UserWithRole,
} from '@/types/database'

export const metadata: Metadata = {
  title: 'Admin Overview',
}

async function AdminDashboardContent() {
  const profile = await requireRole('admin')
  const supabase = await createClient()

  const [usersRes, techProfilesRes, appliancesRes, repairsRes, paymentsRes, logsRes] =
    await Promise.all([
      supabase
        .from('users')
        .select('*, user_types(type_name, description)')
        .order('created_at', { ascending: false }),
      supabase.from('technician_profiles').select('*'),
      supabase
        .from('customer_appliances')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('v_repair_details')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('v_payment_details')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
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
        users={(usersRes.data ?? []) as UserWithRole[]}
        techProfiles={(techProfilesRes.data ?? []) as TechnicianProfileRow[]}
        appliances={(appliancesRes.data ?? []) as CustomerApplianceRow[]}
        repairs={(repairsRes.data ?? []) as RepairDetailView[]}
        payments={(paymentsRes.data ?? []) as PaymentDetailView[]}
        activityLogs={(logsRes.data ?? []) as ActivityLogRow[]}
      />
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  )
}
