import 'server-only'
import { revalidatePath, updateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { retrievePayMongoCheckoutSession } from '@/lib/paymongo'

export type CheckoutSessionKind = 'booking_deposit' | 'ticket_balance'

export interface CheckoutSessionRecord {
  session_id: string
  session_kind: CheckoutSessionKind
  customer_id: string
  ticket_id: string | null
  amount_php: number
  paymongo_checkout_id: string
  paymongo_payment_id: string | null
  checkout_url: string
  status: 'awaiting_payment' | 'completed' | 'cancelled' | 'expired'
}

export type FinalizePayMongoOutcome =
  | {
      finalized: true
      alreadyFinalized: boolean
      kind: CheckoutSessionKind
      ticketId: string
      paymentId: string | null
      amountPhp: number
    }
  | {
      finalized: false
      kind: CheckoutSessionKind | null
      reason: string
    }

export function revalidatePaymentPortalTags() {
  updateTag('customer-appliances')
  updateTag('customer-repairs')
  updateTag('customer-appointments')
  updateTag('customer-payments')
  updateTag('customer-activity')
  updateTag('technician-repairs')
  updateTag('technician-appointments')
  updateTag('technician-payments')
  updateTag('technician-activity')
  updateTag('admin-repairs')
  updateTag('admin-appointments')
  updateTag('admin-payments')
  updateTag('admin-activity')
  revalidatePath('/customer', 'layout')
  revalidatePath('/technician', 'layout')
  revalidatePath('/admin', 'layout')
}

export async function finalizePayMongoCheckoutSession(options: {
  sessionId?: string | null
  paymongoCheckoutId?: string | null
  expectedCustomerId?: string | null
}): Promise<FinalizePayMongoOutcome> {
  const admin = createAdminClient()

  let query = admin
    .from('payment_checkout_sessions')
    .select(
      'session_id, session_kind, customer_id, ticket_id, amount_php, paymongo_checkout_id, paymongo_payment_id, checkout_url, status'
    )

  if (options.sessionId) {
    query = query.eq('session_id', options.sessionId)
  } else if (options.paymongoCheckoutId) {
    query = query.eq('paymongo_checkout_id', options.paymongoCheckoutId)
  } else {
    return { finalized: false, kind: null, reason: 'Missing PayMongo checkout identifier.' }
  }

  const { data: sessionRow, error: fetchError } = await query.maybeSingle()
  if (fetchError || !sessionRow) {
    return { finalized: false, kind: null, reason: 'Payment session not found.' }
  }

  const session = sessionRow as CheckoutSessionRecord

  if (options.expectedCustomerId && session.customer_id !== options.expectedCustomerId) {
    return { finalized: false, kind: session.session_kind, reason: 'Unauthorized payment session.' }
  }

  if (session.status === 'completed' && session.ticket_id) {
    return {
      finalized: true,
      alreadyFinalized: true,
      kind: session.session_kind,
      ticketId: session.ticket_id,
      paymentId: session.paymongo_payment_id,
      amountPhp: Number(session.amount_php),
    }
  }

  const pmSession = await retrievePayMongoCheckoutSession(session.paymongo_checkout_id)
  const isPaid =
    Boolean(pmSession.paidPayment) || pmSession.paymentIntentStatus === 'succeeded'

  if (!isPaid) {
    return {
      finalized: false,
      kind: session.session_kind,
      reason: 'PayMongo has not confirmed this payment yet.',
    }
  }

  const paymongoPaymentId = pmSession.paidPayment?.id || pmSession.id
  const paymentMethod = pmSession.paidPayment?.paymentMethod ?? 'Credit / Debit Card'
  const paidAmountPhp = pmSession.paidPayment?.amountPhp ?? Number(session.amount_php)

  if (session.session_kind === 'booking_deposit') {
    const { data, error } = await admin.rpc('rpc_finalize_paid_booking_checkout', {
      p_session_id: session.session_id,
      p_paymongo_payment_id: paymongoPaymentId,
      p_payment_method: paymentMethod,
    })

    if (error) {
      return { finalized: false, kind: session.session_kind, reason: error.message }
    }

    const row = Array.isArray(data) ? data[0] : data
    revalidatePaymentPortalTags()
    return {
      finalized: true,
      alreadyFinalized: Boolean(row?.already_finalized),
      kind: 'booking_deposit',
      ticketId: String(row?.ticket_id ?? ''),
      paymentId: row?.payment_id ? String(row.payment_id) : null,
      amountPhp: paidAmountPhp,
    }
  }

  const { data, error } = await admin.rpc('rpc_finalize_ticket_payment_checkout', {
    p_session_id: session.session_id,
    p_paymongo_payment_id: paymongoPaymentId,
    p_payment_method: paymentMethod,
    p_paid_amount_php: paidAmountPhp,
  })

  if (error) {
    return { finalized: false, kind: session.session_kind, reason: error.message }
  }

  const row = Array.isArray(data) ? data[0] : data
  revalidatePaymentPortalTags()
  return {
    finalized: true,
    alreadyFinalized: Boolean(row?.already_finalized),
    kind: 'ticket_balance',
    ticketId: String(row?.ticket_id ?? session.ticket_id ?? ''),
    paymentId: row?.payment_id ? String(row.payment_id) : null,
    amountPhp: paidAmountPhp,
  }
}
