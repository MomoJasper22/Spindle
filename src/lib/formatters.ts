const phpFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const manilaDateFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const manilaDateTimeFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

export function formatPHP(amount: number | string | null | undefined): string {
  const numeric = typeof amount === 'string' ? Number(amount) : (amount ?? 0)
  if (Number.isNaN(numeric)) {
    return phpFormatter.format(0)
  }
  return phpFormatter.format(numeric)
}

export function formatManilaDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return manilaDateFormatter.format(date)
}

export function formatManilaDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return manilaDateTimeFormatter.format(date)
}

export function getManilaTodayISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

const PH_PHONE_REGEX = /^(?:\+63\s?9\d{2}[\s-]?\d{3}[\s-]?\d{4}|09\d{2}[\s-]?\d{3}[\s-]?\d{4}|\+63\s?2[\s-]?\d{4}[\s-]?\d{4})$/

export function validatePHPhone(phone: string): boolean {
  return PH_PHONE_REGEX.test(phone.trim())
}

export function normalizePHPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('639') && digits.length === 12) {
    return `+63 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 12)}`
  }
  if (digits.startsWith('09') && digits.length === 11) {
    return `+63 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`
  }
  if (digits.startsWith('632') && digits.length === 11) {
    return `+63 2 ${digits.slice(3, 7)} ${digits.slice(7, 11)}`
  }
  return phone.trim()
}

export function formatPHPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  return normalizePHPhone(phone)
}

export function formatAddress(parts: {
  street?: string | null
  barangay?: string | null
  city?: string | null
  province?: string | null
  zip?: string | null
}): string {
  const segments = [
    parts.street,
    parts.barangay,
    parts.city,
    parts.province,
    parts.zip,
  ]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s))
  return segments.length > 0 ? segments.join(', ') : '—'
}

export function formatFullName(parts: {
  first_name?: string | null
  middle_name?: string | null
  last_name?: string | null
}): string {
  return [parts.first_name, parts.middle_name, parts.last_name]
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p))
    .join(' ') || '—'
}

export function humanizeLabel(value: string | null | undefined): string {
  if (!value) return '—'
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
