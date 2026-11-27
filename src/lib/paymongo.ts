import 'server-only'
import crypto from 'node:crypto'
import type { PaymentMethod } from '@/lib/constants'

const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1'
const DEFAULT_PAYMENT_METHOD_TYPES = ['gcash', 'paymaya', 'qrph', 'card'] as const

export interface PayMongoPaidPayment {
  id: string
  amountPhp: number
  paymentMethod: PaymentMethod
  paidAt: string | null
  sourceType: string
}

export interface PayMongoCheckoutSessionResult {
  id: string
  checkoutUrl: string
  status: string
  referenceNumber: string | null
  paymentIntentStatus: string | null
  paidPayment: PayMongoPaidPayment | null
  metadata: Record<string, string>
}

interface PayMongoErrorPayload {
  errors?: Array<{
    code?: string
    detail?: string
    source?: { pointer?: string; attribute?: string }
  }>
}

function getAuthHeader(): string {
  const secretKey = process.env.PAYMONGO_SECRET_KEY
  if (!secretKey) {
    throw new Error('Missing PAYMONGO_SECRET_KEY environment variable.')
  }
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`
}

export function mapPayMongoSourceToSpindleMethod(sourceType?: string | null): PaymentMethod {
  switch ((sourceType ?? '').toLowerCase()) {
    case 'gcash':
      return 'GCash'
    case 'paymaya':
    case 'maya':
      return 'Maya'
    case 'qrph':
      return 'QR Ph'
    case 'dob':
    case 'dob_ubp':
    case 'brankas':
      return 'Bank Transfer (BPI / BDO / UnionBank)'
    case 'card':
    default:
      return 'Credit / Debit Card'
  }
}

function parseCheckoutSessionPayload(raw: unknown): PayMongoCheckoutSessionResult {
  const data = (raw as { data?: Record<string, unknown> })?.data
  if (!data || typeof data.id !== 'string') {
    throw new Error('Unexpected response from PayMongo checkout session API.')
  }

  const attributes = (data.attributes ?? {}) as Record<string, unknown>
  const payments = Array.isArray(attributes.payments)
    ? (attributes.payments as Array<Record<string, unknown>>)
    : []

  let paidPayment: PayMongoPaidPayment | null = null
  for (const entry of payments) {
    const pAttr = (entry.attributes ?? {}) as Record<string, unknown>
    const status = String(pAttr.status ?? '').toLowerCase()
    if (status === 'paid') {
      const source = (pAttr.source ?? {}) as Record<string, unknown>
      const sourceType = String(source.type ?? 'card')
      const amountCentavos = Number(pAttr.amount ?? 0)
      paidPayment = {
        id: String(entry.id ?? ''),
        amountPhp: Math.round(amountCentavos) / 100,
        paymentMethod: mapPayMongoSourceToSpindleMethod(sourceType),
        paidAt: typeof pAttr.paid_at === 'number'
          ? new Date(pAttr.paid_at * 1000).toISOString()
          : null,
        sourceType,
      }
      break
    }
  }

  const paymentIntent = (attributes.payment_intent ?? null) as Record<string, unknown> | null
  const piAttrs = (paymentIntent?.attributes ?? null) as Record<string, unknown> | null
  const metadataRaw = (attributes.metadata ?? {}) as Record<string, unknown>
  const metadata: Record<string, string> = {}
  for (const [k, v] of Object.entries(metadataRaw)) {
    if (v !== null && v !== undefined) {
      metadata[k] = String(v)
    }
  }

  return {
    id: data.id,
    checkoutUrl: String(attributes.checkout_url ?? ''),
    status: String(attributes.status ?? 'active'),
    referenceNumber:
      typeof attributes.reference_number === 'string' ? attributes.reference_number : null,
    paymentIntentStatus: piAttrs ? String(piAttrs.status ?? '') : null,
    paidPayment,
    metadata,
  }
}

export interface CreateCheckoutSessionInput {
  amountPhp: number
  lineItemName: string
  description: string
  referenceNumber: string
  successUrl: string
  cancelUrl: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  metadata?: Record<string, string>
}

async function postCheckoutSession(
  body: Record<string, unknown>,
  authHeader: string
): Promise<Response> {
  return fetch(`${PAYMONGO_API_BASE}/checkout_sessions`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({ data: { attributes: body } }),
    cache: 'no-store',
  })
}

export async function createPayMongoCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<PayMongoCheckoutSessionResult> {
  const authHeader = getAuthHeader()
  const amountCentavos = Math.round(input.amountPhp * 100)
  if (!Number.isFinite(amountCentavos) || amountCentavos < 100) {
    throw new Error('Minimum online payment amount is PHP 1.00.')
  }

  const billing: Record<string, string> = {}
  if (input.customerName?.trim()) billing.name = input.customerName.trim()
  if (input.customerEmail?.trim()) billing.email = input.customerEmail.trim()
  if (input.customerPhone?.trim()) billing.phone = input.customerPhone.trim()

  const baseAttributes: Record<string, unknown> = {
    line_items: [
      {
        currency: 'PHP',
        amount: amountCentavos,
        name: input.lineItemName,
        quantity: 1,
        description: input.description,
      },
    ],
    payment_method_types: [...DEFAULT_PAYMENT_METHOD_TYPES],
    description: input.description,
    reference_number: input.referenceNumber,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    send_email_receipt: true,
    show_description: true,
    show_line_items: true,
    ...(Object.keys(billing).length > 0 ? { billing } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
  }

  let response = await postCheckoutSession(baseAttributes, authHeader)

  // If a merchant account hasn't enabled a specific channel (e.g. qrph or paymaya),
  // retry with universally enabled channels (gcash + card), then card-only if needed.
  if (!response.ok && response.status === 400) {
    const errText = await response.text()
    const lowerErr = errText.toLowerCase()
    if (lowerErr.includes('payment_method_types') || lowerErr.includes('not allowed')) {
      response = await postCheckoutSession(
        { ...baseAttributes, payment_method_types: ['gcash', 'card'] },
        authHeader
      )
      if (!response.ok && response.status === 400) {
        response = await postCheckoutSession(
          { ...baseAttributes, payment_method_types: ['card'] },
          authHeader
        )
      }
    } else {
      let detail = 'Unable to create PayMongo checkout session.'
      try {
        const parsed = JSON.parse(errText) as PayMongoErrorPayload
        detail = parsed.errors?.[0]?.detail ?? detail
      } catch {
        // ignore JSON parse failure
      }
      throw new Error(detail)
    }
  }

  if (!response.ok) {
    const errPayload = (await response.json().catch(() => null)) as PayMongoErrorPayload | null
    const detail = errPayload?.errors?.[0]?.detail ?? `PayMongo error (${response.status}).`
    throw new Error(detail)
  }

  const json = await response.json()
  return parseCheckoutSessionPayload(json)
}

export async function retrievePayMongoCheckoutSession(
  checkoutSessionId: string
): Promise<PayMongoCheckoutSessionResult> {
  const authHeader = getAuthHeader()
  const response = await fetch(
    `${PAYMONGO_API_BASE}/checkout_sessions/${encodeURIComponent(checkoutSessionId)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: authHeader,
      },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const errPayload = (await response.json().catch(() => null)) as PayMongoErrorPayload | null
    const detail = errPayload?.errors?.[0]?.detail ?? `Unable to verify PayMongo session (${response.status}).`
    throw new Error(detail)
  }

  const json = await response.json()
  return parseCheckoutSessionPayload(json)
}

export function verifyPayMongoWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET
  if (!webhookSecret || !signatureHeader) {
    return false
  }

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((segment) => {
      const idx = segment.indexOf('=')
      if (idx === -1) return [segment.trim(), '']
      return [segment.slice(0, idx).trim(), segment.slice(idx + 1).trim()]
    })
  )

  const timestamp = parts.t
  const expectedSig = parts.te || parts.li
  if (!timestamp || !expectedSig) {
    return false
  }

  const computed = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  const a = Buffer.from(computed, 'utf8')
  const b = Buffer.from(expectedSig, 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
