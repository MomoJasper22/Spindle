import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserProfile } from '@/lib/auth/session'
import { finalizePayMongoCheckoutSession } from '@/lib/paymongo-checkout'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')
  const profile = await getCurrentUserProfile()

  if (!profile || profile.role !== 'customer') {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (!sessionId) {
    return NextResponse.redirect(new URL('/customer/bookings?payment_error=missing_session', request.url))
  }

  try {
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
    const errUrl = new URL('/customer/bookings', request.url)
    errUrl.searchParams.set('payment_error', 'verification_failed')
    return NextResponse.redirect(errUrl)
  }
}
