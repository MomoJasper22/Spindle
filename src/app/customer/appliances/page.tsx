import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { AppliancesPanel } from '@/features/customer/components/appliances-panel'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type { CustomerApplianceRow } from '@/types/database'

export const metadata: Metadata = {
  title: 'My Appliances',
}

async function CustomerAppliancesContent({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>
}) {
  const [profile, params] = await Promise.all([requireRole('customer'), searchParams])
  const supabase = await createClient()

  const { data } = await supabase
    .from('customer_appliances')
    .select('*')
    .eq('customer_id', profile.user_id)
    .order('created_at', { ascending: false })

  return (
    <AppliancesPanel
      appliances={(data ?? []) as CustomerApplianceRow[]}
      openAddByDefault={params.add === '1'}
    />
  )
}

export default function CustomerAppliancesPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CustomerAppliancesContent searchParams={searchParams} />
    </Suspense>
  )
}
