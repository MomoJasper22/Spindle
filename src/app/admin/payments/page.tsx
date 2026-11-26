import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { AdminPaymentsPanel } from '@/features/admin/components/payments-panel'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type { PaymentDetailView, RepairDetailView } from '@/types/database'

export const metadata: Metadata = {
  title: 'Payment Ledger',
}

async function AdminPaymentsContent() {
  await requireRole('admin')
  const supabase = await createClient()

  const [paymentsRes, repairsRes] = await Promise.all([
    supabase
      .from('v_payment_details')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('v_repair_details')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Payment Ledger
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify digital transfers and field collections or record walk-in payments.
        </p>
      </div>

      <AdminPaymentsPanel
        payments={(paymentsRes.data ?? []) as PaymentDetailView[]}
        repairs={(repairsRes.data ?? []) as RepairDetailView[]}
      />
    </div>
  )
}

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminPaymentsContent />
    </Suspense>
  )
}
