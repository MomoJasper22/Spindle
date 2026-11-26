import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TechnicianJobsView } from '@/features/technician/components/technician-jobs-view'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type { RepairDetailView } from '@/types/database'

export const metadata: Metadata = {
  title: 'Assigned Jobs',
}

async function TechnicianJobsContent() {
  const profile = await requireRole('technician')
  const supabase = await createClient()

  const { data } = await supabase
    .from('v_repair_details')
    .select('*')
    .eq('technician_id', profile.user_id)
    .order('scheduled_date', { ascending: true })

  return <TechnicianJobsView repairs={(data ?? []) as RepairDetailView[]} />
}

export default function TechnicianJobsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TechnicianJobsContent />
    </Suspense>
  )
}
