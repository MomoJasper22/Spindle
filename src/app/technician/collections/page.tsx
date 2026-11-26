import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { CollectionsPanel } from '@/features/technician/components/collections-panel'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type { PaymentDetailView } from '@/types/database'

export const metadata: Metadata = {
  title: 'Field Collections',
}

async function TechnicianCollectionsContent() {
  await requireRole('technician')
  const supabase = await createClient()

  const { data } = await supabase
    .from('v_payment_details')
    .select('*')
    .order('created_at', { ascending: false })

  return <CollectionsPanel payments={(data ?? []) as PaymentDetailView[]} />
}

export default function TechnicianCollectionsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TechnicianCollectionsContent />
    </Suspense>
  )
}
