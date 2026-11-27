import { NextRequest, NextResponse } from 'next/server'
import { verifyPayMongoWebhookSignature } from '@/lib/paymongo'
import { finalizePayMongoCheckoutSession } from '@/lib/paymongo-checkout'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signatureHeader = request.headers.get('paymongo-signature')

  if (process.env.PAYMONGO_WEBHOOK_SECRET) {
    const valid = verifyPayMongoWebhookSignature(rawBody, signatureHeader)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 })
    }
  }

  let eventType = ''
  let paymongoCheckoutId: string | null = null
  let sessionId: string | null = null

  try {
    const payload = JSON.parse(rawBody) as {
      data?: {
        attributes?: {
          type?: string
          data?: {
            id?: string
            attributes?: {
              metadata?: Record<string, string>
            }
          }
        }
      }
    }

    eventType = payload?.data?.attributes?.type ?? ''
    const checkoutObj = payload?.data?.attributes?.data
    paymongoCheckoutId = checkoutObj?.id ?? null
    sessionId = checkoutObj?.attributes?.metadata?.spindle_session_id ?? null
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 })
  }

  if (eventType === 'checkout_session.payment.paid' && (sessionId || paymongoCheckoutId)) {
    try {
      await finalizePayMongoCheckoutSession({
        sessionId,
        paymongoCheckoutId,
      })
    } catch {
      return NextResponse.json({ received: true, finalized: false }, { status: 200 })
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
