import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import {
  getCustomerAppliances,
  getCustomerAppointments,
  getCustomerRepairs,
} from '@/lib/data/portal-data'
import { formatAddress } from '@/lib/formatters'
import { RepairsPanel } from '@/features/customer/components/repairs-panel'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'

export const metadata: Metadata = {
  title: 'My Bookings',
}

async function CustomerBookingsContent({
  searchParams,
}: {
  searchParams: Promise<{
    book?: string
    appliance?: string
    payment_success?: string
    payment_cancelled?: string
    payment_pending?: string
    payment_error?: string
    ticket?: string
  }>
}) {
  const [profile, params] = await Promise.all([requireRole('customer'), searchParams])

  const [appliances, repairs, appointments] = await Promise.all([
    getCustomerAppliances(profile.user_id),
    getCustomerRepairs(profile.user_id),
    getCustomerAppointments(profile.user_id),
  ])

  const defaultServiceAddress = formatAddress({
    street: profile.address_street,
    barangay: profile.address_barangay,
    city: profile.address_city,
    province: profile.address_province,
    zip: profile.address_zip_code,
  })

  const initialNotice =
    params.payment_success === 'booking'
      ? {
          type: 'success' as const,
          message: `Payment confirmed! Your home visit booking${params.ticket ? ` (${params.ticket})` : ''} has been placed.`,
        }
      : params.payment_cancelled === '1'
        ? {
            type: 'error' as const,
            message: 'Payment was cancelled, so no home visit booking was placed.',
          }
        : params.payment_pending === '1'
          ? {
              type: 'error' as const,
              message: 'Your payment is still pending confirmation. Your booking will be placed once payment completes.',
            }
          : params.payment_error
            ? {
                type: 'error' as const,
                message: 'We could not verify your PayMongo payment yet. Please check your payments or try again.',
              }
            : null

  return (
    <RepairsPanel
      key={`${params.book ?? ''}:${params.appliance ?? ''}:${params.payment_success ?? ''}:${params.payment_cancelled ?? ''}`}
      appliances={appliances}
      repairs={repairs}
      appointments={appointments}
      defaultServiceAddress={defaultServiceAddress}
      defaultOpen={params.book === '1'}
      defaultApplianceId={params.appliance}
      initialNotice={initialNotice}
    />
  )
}

export default function CustomerBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    book?: string
    appliance?: string
    payment_success?: string
    payment_cancelled?: string
    payment_pending?: string
    payment_error?: string
    ticket?: string
  }>
}) {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <CustomerBookingsContent searchParams={searchParams} />
    </Suspense>
  )
}
