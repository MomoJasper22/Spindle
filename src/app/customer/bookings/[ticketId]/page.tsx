import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { BookingDetailView } from '@/features/customer/components/booking-detail-view'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type {
  AppointmentDetailView,
  PaymentDetailView,
  RepairDetailView,
} from '@/types/database'

export const metadata: Metadata = {
  title: 'Booking Details',
}

async function BookingDetailContent({
  params,
}: {
  params: Promise<{ ticketId: string }>
}) {
  const [profile, { ticketId }] = await Promise.all([requireRole('customer'), params])
  const supabase = await createClient()

  const [repairRes, appointmentRes, paymentsRes] = await Promise.all([
    supabase
      .from('v_repair_details')
      .select('*')
      .eq('ticket_id', ticketId)
      .eq('customer_id', profile.user_id)
      .maybeSingle(),
    supabase
      .from('v_appointment_details')
      .select('*')
      .eq('ticket_id', ticketId)
      .eq('customer_id', profile.user_id)
      .order('scheduled_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('v_payment_details')
      .select('*')
      .eq('ticket_id', ticketId)
      .eq('customer_id', profile.user_id)
      .order('created_at', { ascending: false }),
  ])

  if (!repairRes.data) {
    notFound()
  }

  return (
    <BookingDetailView
      repair={repairRes.data as RepairDetailView}
      appointment={(appointmentRes.data as AppointmentDetailView | null) ?? null}
      payments={(paymentsRes.data ?? []) as PaymentDetailView[]}
    />
  )
}

export default function CustomerBookingDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BookingDetailContent params={params} />
    </Suspense>
  )
}
