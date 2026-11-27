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
  searchParams: Promise<{
    ticket?: string
    payment_success?: string
    payment_cancelled?: string
    payment_pending?: string
  }>
}) {
  const [profile, params] = await Promise.all([requireRole('customer'), searchParams])

  const [repairs, payments] = await Promise.all([
    getCustomerRepairs(profile.user_id),
    getCustomerPayments(profile.user_id),
  ])

  const initialNotice =
    params.payment_success === 'balance'
      ? {
          type: 'success' as const,
          message: `PayMongo payment verified${params.ticket ? ` for booking ${params.ticket}` : ''}!`,
        }
      : params.payment_cancelled === '1'
        ? {
            type: 'error' as const,
            message: 'PayMongo payment was cancelled. No charge was applied.',
          }
        : params.payment_pending === '1'
          ? {
              type: 'error' as const,
              message: 'Your payment has not completed yet. Please check back or try again.',
            }
          : null

  return (
    <PaymentsPanel
      key={`${params.ticket ?? 'list'}:${params.payment_success ?? ''}:${params.payment_cancelled ?? ''}`}
      repairs={repairs}
      payments={payments}
      defaultTicketId={params.ticket}
      initialNotice={initialNotice}
    />
  )
}

export default function CustomerPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    ticket?: string
    payment_success?: string
    payment_cancelled?: string
    payment_pending?: string
  }>
}) {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <CustomerPaymentsContent searchParams={searchParams} />
    </Suspense>
  )
}
