import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { AdminRepairsPanel } from '@/features/admin/components/repairs-panel'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type {
  CustomerApplianceRow,
  RepairDetailView,
  UserWithRole,
} from '@/types/database'

export const metadata: Metadata = {
  title: 'Repair Tickets',
}

async function AdminRepairsContent() {
  await requireRole('admin')
  const supabase = await createClient()

  const [repairsRes, usersRes, appliancesRes] = await Promise.all([
    supabase
      .from('v_repair_details')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('*, user_types(type_name, description)')
      .order('created_at', { ascending: false }),
    supabase
      .from('customer_appliances')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Repair Tickets
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create walk-in tickets, assign technicians, update costs, and track repair progress.
        </p>
      </div>

      <AdminRepairsPanel
        repairs={(repairsRes.data ?? []) as RepairDetailView[]}
        users={(usersRes.data ?? []) as UserWithRole[]}
        appliances={(appliancesRes.data ?? []) as CustomerApplianceRow[]}
      />
    </div>
  )
}

export default function AdminRepairsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminRepairsContent />
    </Suspense>
  )
}
