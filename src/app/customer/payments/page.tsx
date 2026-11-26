import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { getCustomerPayments, getCustomerRepairs } from '@/lib/data/portal-data'
import { PaymentsPanel } from '@/features/customer/components/payments-panel'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'

export const metadata: Metadata = {
  title: 'My Payments',
}

async function CustomerPaymentsContent({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>
}) {
  const [profile, params] = await Promise.all([requireRole('customer'), searchParams])

  const [repairs, payments] = await Promise.all([
    getCustomerRepairs(profile.user_id),
    getCustomerPayments(profile.user_id),
  ])

  return (
    <PaymentsPanel
      key={params.ticket ?? 'list'}
      repairs={repairs}
      payments={payments}
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
    <Suspense fallback={<PortalContentSkeleton />}>
      <CustomerPaymentsContent searchParams={searchParams} />
    </Suspense>
  )
}
