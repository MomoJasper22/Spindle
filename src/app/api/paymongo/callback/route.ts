import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserProfile } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { finalizePayMongoCheckoutSession } from '@/lib/paymongo-checkout'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')
  const profile = await getCurrentUserProfile()

  if (!profile || (profile.role !== 'customer' && profile.role !== 'technician')) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (!sessionId) {
    const missingTarget =
      profile.role === 'technician'
        ? '/technician/jobs?payment_error=missing_session'
        : '/customer/bookings?payment_error=missing_session'
    return NextResponse.redirect(new URL(missingTarget, request.url))
  }

  try {
    if (profile.role === 'technician') {
      const admin = createAdminClient()
      const { data: sessionRow } = await admin
        .from('payment_checkout_sessions')
        .select('ticket_id, session_kind')
        .eq('session_id', sessionId)
        .maybeSingle()

      if (!sessionRow?.ticket_id || sessionRow.session_kind !== 'ticket_balance') {
        return NextResponse.redirect(
          new URL('/technician/jobs?payment_error=invalid_session', request.url)
        )
      }

      const { data: repairRow } = await admin
        .from('repair')
        .select('ticket_id, technician_id')
        .eq('ticket_id', sessionRow.ticket_id)
        .maybeSingle()

      if (!repairRow || repairRow.technician_id !== profile.user_id) {
        return NextResponse.redirect(
          new URL('/technician/jobs?payment_error=unauthorized', request.url)
        )
      }

      const result = await finalizePayMongoCheckoutSession({ sessionId })
      const target = new URL('/technician/jobs', request.url)
      target.searchParams.set('ticket', sessionRow.ticket_id)
      if (result.finalized) {
        target.searchParams.set('payment_success', '1')
      } else {
        target.searchParams.set('payment_pending', '1')
      }
      return NextResponse.redirect(target)
    }

    const result = await finalizePayMongoCheckoutSession({
      sessionId,
      expectedCustomerId: profile.user_id,
    })

    if (result.finalized) {
      if (result.kind === 'booking_deposit') {
        const target = new URL('/customer/bookings', request.url)
        target.searchParams.set('payment_success', 'booking')
        if (result.ticketId) target.searchParams.set('ticket', result.ticketId)
        return NextResponse.redirect(target)
      }

      const target = new URL('/customer/payments', request.url)
      target.searchParams.set('payment_success', 'balance')
      if (result.ticketId) target.searchParams.set('ticket', result.ticketId)
      return NextResponse.redirect(target)
    }

    const fallbackPath =
      result.kind === 'ticket_balance' ? '/customer/payments' : '/customer/bookings'
    const fallbackUrl = new URL(fallbackPath, request.url)
    fallbackUrl.searchParams.set('payment_pending', '1')
    return NextResponse.redirect(fallbackUrl)
  } catch {
    const errUrl = new URL(
      profile.role === 'technician' ? '/technician/jobs' : '/customer/bookings',
      request.url
    )
    errUrl.searchParams.set('payment_error', 'verification_failed')
    return NextResponse.redirect(errUrl)
  }
}
