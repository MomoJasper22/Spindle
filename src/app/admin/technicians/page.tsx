import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TechniciansPanel } from '@/features/admin/components/technicians-panel'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type {
  RepairDetailView,
  TechnicianProfileRow,
  UserWithRole,
} from '@/types/database'

export const metadata: Metadata = {
  title: 'Technician Roster',
}

async function AdminTechniciansContent() {
  await requireRole('admin')
  const supabase = await createClient()

  const [usersRes, techProfilesRes, repairsRes] = await Promise.all([
    supabase
      .from('users')
      .select('*, user_types(type_name, description)')
      .order('created_at', { ascending: false }),
    supabase.from('technician_profiles').select('*'),
    supabase
      .from('v_repair_details')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Technician Roster
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor field workload, TESDA credentials, specializations, and branch dispatch availability.
        </p>
      </div>

      <TechniciansPanel
        users={(usersRes.data ?? []) as UserWithRole[]}
        techProfiles={(techProfilesRes.data ?? []) as TechnicianProfileRow[]}
        repairs={(repairsRes.data ?? []) as RepairDetailView[]}
      />
    </div>
  )
}

export default function AdminTechniciansPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminTechniciansContent />
    </Suspense>
  )
}
