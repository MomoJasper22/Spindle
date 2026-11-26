import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PaymentsPanel } from '@/features/customer/components/payments-panel'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type { PaymentDetailView, RepairDetailView } from '@/types/database'

export const metadata: Metadata = {
  title: 'My Payments',
}

async function CustomerPaymentsContent({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>
}) {
  const [profile, params] = await Promise.all([requireRole('customer'), searchParams])
  const supabase = await createClient()

  const [repairsRes, paymentsRes] = await Promise.all([
    supabase
      .from('v_repair_details')
      .select('*')
      .eq('customer_id', profile.user_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('v_payment_details')
      .select('*')
      .eq('customer_id', profile.user_id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <PaymentsPanel
      repairs={(repairsRes.data ?? []) as RepairDetailView[]}
      payments={(paymentsRes.data ?? []) as PaymentDetailView[]}
      defaultTicketId={params.ticket}
    />
  )
}

export default function CustomerPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CustomerPaymentsContent searchParams={searchParams} />
    </Suspense>
  )
}
