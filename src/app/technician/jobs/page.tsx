import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import {
  getTechnicianAppointments,
  getTechnicianPayments,
  getTechnicianRepairs,
} from '@/lib/data/portal-data'
import {
  TechnicianJobsView,
  type JobsTabKey,
} from '@/features/technician/components/technician-jobs-view'
import { TechnicianJobsFallback } from '@/features/technician/components/technician-cached-fallbacks'

export const metadata: Metadata = {
  title: 'My Jobs',
}

const VALID_TABS: ReadonlySet<JobsTabKey> = new Set([
  'active',
  'today',
  'needs_payment',
  'completed',
  'collections',
])

function resolveTab(raw?: string): JobsTabKey {
  if (raw && VALID_TABS.has(raw as JobsTabKey)) {
    return raw as JobsTabKey
  }
  return 'active'
}

async function TechnicianJobsContent({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string
    ticket?: string
    payment_success?: string
    payment_cancelled?: string
    payment_pending?: string
    payment_error?: string
  }>
}) {
  const [profile, params] = await Promise.all([requireRole('technician'), searchParams])

  const [repairs, appointments, payments] = await Promise.all([
    getTechnicianRepairs(profile.user_id),
    getTechnicianAppointments(profile.user_id),
    getTechnicianPayments(profile.user_id),
  ])

  const initialTab = resolveTab(params.tab)
  const initialNotice =
    params.payment_success === '1'
      ? {
          type: 'success' as const,
          message: `PayMongo payment verified${params.ticket ? ` for ticket ${params.ticket}` : ''}.`,
        }
      : params.payment_cancelled === '1'
        ? {
            type: 'error' as const,
            message: 'PayMongo checkout was cancelled. No charge was applied.',
          }
        : params.payment_pending === '1'
          ? {
              type: 'error' as const,
              message: 'PayMongo has not confirmed this payment yet. Verify status inside the job drawer.',
            }
          : params.payment_error
            ? {
                type: 'error' as const,
                message: 'Could not verify PayMongo payment callback. Please verify inside the job drawer.',
              }
            : null

  const initialDrawerSection =
    params.payment_success || params.payment_cancelled || params.payment_pending
      ? 'collect'
      : 'work'

  return (
    <TechnicianJobsView
      key={`${initialTab}:${params.ticket ?? ''}:${params.payment_success ?? ''}:${params.payment_cancelled ?? ''}`}
      techId={profile.user_id}
      availabilityStatus={profile.technician_profile?.availability_status ?? 'available'}
      repairs={repairs}
      appointments={appointments}
      payments={payments}
      initialTab={initialTab}
      initialTicketId={params.ticket ?? null}
      initialDrawerSection={initialDrawerSection}
      initialNotice={initialNotice}
    />
  )
}

export default function TechnicianJobsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string
    ticket?: string
    payment_success?: string
    payment_cancelled?: string
    payment_pending?: string
    payment_error?: string
  }>
}) {
  return (
    <Suspense fallback={<TechnicianJobsFallback />}>
      <TechnicianJobsContent searchParams={searchParams} />
    </Suspense>
  )
}
