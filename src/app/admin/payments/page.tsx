import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireAdminFeature } from '@/lib/auth/session'
import { getAdminPayments, getAdminRepairs } from '@/lib/data/portal-data'
import { AdminPaymentsPanel } from '@/features/admin/components/payments-panel'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'

export const metadata: Metadata = {
  title: 'Payment Ledger',
}

async function AdminPaymentsContent() {
  await requireAdminFeature('payments')

  const [payments, repairs] = await Promise.all([
    getAdminPayments(),
    getAdminRepairs(),
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

      <AdminPaymentsPanel payments={payments} repairs={repairs} />
    </div>
  )
}

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <AdminPaymentsContent />
    </Suspense>
  )
}
