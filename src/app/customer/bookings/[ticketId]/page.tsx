import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { getCustomerBookingDetail } from '@/lib/data/portal-data'
import { BookingDetailView } from '@/features/customer/components/booking-detail-view'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'

export const metadata: Metadata = {
  title: 'Booking Details',
}

async function BookingDetailContent({
  params,
}: {
  params: Promise<{ ticketId: string }>
}) {
  const [profile, { ticketId }] = await Promise.all([requireRole('customer'), params])
  const { repair, appointment, payments } = await getCustomerBookingDetail(profile.user_id, ticketId)

  if (!repair) {
    notFound()
  }

  return <BookingDetailView repair={repair} appointment={appointment} payments={payments} />
}

export default function CustomerBookingDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>
}) {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <BookingDetailContent params={params} />
    </Suspense>
  )
}
