import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { AdminAppliancesPanel } from '@/features/admin/components/appliances-panel'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type { CustomerApplianceRow, UserWithRole } from '@/types/database'

export const metadata: Metadata = {
  title: 'Appliances Registry',
}

async function AdminAppliancesContent() {
  await requireRole('admin')
  const supabase = await createClient()

  const [appliancesRes, usersRes] = await Promise.all([
    supabase
      .from('customer_appliances')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('*, user_types(type_name, description)')
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Appliances Registry
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify customer-registered units, review serial numbers, and manage unit records.
        </p>
      </div>

      <AdminAppliancesPanel
        appliances={(appliancesRes.data ?? []) as CustomerApplianceRow[]}
        users={(usersRes.data ?? []) as UserWithRole[]}
      />
    </div>
  )
}

export default function AdminAppliancesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminAppliancesContent />
    </Suspense>
  )
}
