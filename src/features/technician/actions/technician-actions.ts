'use server'

import crypto from 'node:crypto'
import { headers } from 'next/headers'
import { revalidatePath, updateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/session'
import { getTechAvailabilityLabel } from '@/lib/constants'
import { getManilaTodayISO } from '@/lib/formatters'
import { getTicketPaymentSummary } from '@/lib/payments'
import {
  createPayMongoCheckoutSession,
  retrievePayMongoCheckoutSession,
} from '@/lib/paymongo'
import { finalizePayMongoCheckoutSession } from '@/lib/paymongo-checkout'
import type { RepairDetailView } from '@/types/database'
import {
  technicianAppointmentActionSchema,
  technicianAvailabilitySchema,
  technicianNicknameSchema,
  technicianPayMongoCheckoutSchema,
  technicianPaymentSchema,
  technicianRepairUpdateSchema,
  type TechnicianAppointmentActionInput,
  type TechnicianAvailabilityInput,
  type TechnicianNicknameInput,
  type TechnicianPayMongoCheckoutInput,
  type TechnicianPaymentInput,
  type TechnicianRepairUpdateInput,
} from '../schemas/technician-schemas'

export type TechActionResult<T = void> =
  | { success: true; message: string; data?: T }
  | { success: false; error: string }

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

async function getRequestOrigin(): Promise<string> {
  const hdrs = await headers()
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host') ?? 'localhost:3000'
  const proto =
    hdrs.get('x-forwarded-proto') ??
    (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https')
  return `${proto}://${host}`
}

function generateCheckoutSessionId(): string {
  return `CHK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
}

function revalidateTechPortals(extraTags: string[] = []) {
  const tags = new Set([
    'technician-repairs',
    'technician-appointments',
    'technician-payments',
    'technician-activity',
    'admin-repairs',
    'admin-appointments',
    'admin-payments',
    'admin-activity',
    'customer-repairs',
    'customer-appointments',
    'customer-payments',
    'customer-activity',
    ...extraTags,
  ])
  for (const tag of tags) {
    updateTag(tag)
  }
  revalidatePath('/technician', 'layout')
  revalidatePath('/customer', 'layout')
  revalidatePath('/admin', 'layout')
}

async function syncPaidOpenCheckoutSessions(ticketId: string): Promise<{
  finalizedCount: number
  openSessions: Array<{
    session_id: string
    amount_php: number
    paymongo_checkout_id: string
    checkout_url: string
  }>
}> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('payment_checkout_sessions')
    .select('session_id, amount_php, paymongo_checkout_id, checkout_url')
    .eq('ticket_id', ticketId)
    .eq('session_kind', 'ticket_balance')
    .eq('status', 'awaiting_payment')
    .order('created_at', { ascending: false })

  let finalizedCount = 0
  const stillOpen: Array<{
    session_id: string
    amount_php: number
    paymongo_checkout_id: string
    checkout_url: string
  }> = []

  for (const row of data ?? []) {
    try {
      const pm = await retrievePayMongoCheckoutSession(row.paymongo_checkout_id)
      if (pm.paidPayment || pm.paymentIntentStatus === 'succeeded') {
        const res = await finalizePayMongoCheckoutSession({ sessionId: row.session_id })
        if (res.finalized) {
          finalizedCount += 1
        }
      } else if (pm.status === 'active') {
        stillOpen.push(row)
      } else {
        await admin
          .from('payment_checkout_sessions')
          .update({ status: 'expired' })
          .eq('session_id', row.session_id)
      }
    } catch {
      stillOpen.push(row)
    }
  }

  return { finalizedCount, openSessions: stillOpen }
}

export async function updateTechnicianRepairAction(
  input: TechnicianRepairUpdateInput
): Promise<TechActionResult> {
  const profile = await requireRole('technician')
  const parsed = technicianRepairUpdateSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid repair update details.',
    }
  }

  const supabase = await createClient()
  const { data: existingRepair } = await supabase
    .from('v_repair_details')
    .select('completed_at, estimated_cost_php, verified_paid_php, pending_paid_php')
    .eq('ticket_id', parsed.data.ticket_id)
    .eq('technician_id', profile.user_id)
    .maybeSingle()

  if (!existingRepair) {
    return { success: false, error: 'Assigned repair ticket not found.' }
  }

  const verifiedPaidPhp = roundCurrency(Number(existingRepair.verified_paid_php ?? 0))
  const pendingPaidPhp = roundCurrency(Number(existingRepair.pending_paid_php ?? 0))
  const totalRecordedPhp = roundCurrency(verifiedPaidPhp + pendingPaidPhp)
  const finalCostPhp = parsed.data.final_cost_php

  if (finalCostPhp !== null && finalCostPhp < totalRecordedPhp) {
    return {
      success: false,
      error: `Final price cannot be lower than already recorded payments (PHP ${totalRecordedPhp.toFixed(2)}).`,
    }
  }

  const autoCompletedFromDeposit =
    parsed.data.status === 'awaiting_payment' &&
    finalCostPhp !== null &&
    finalCostPhp > 0 &&
    verifiedPaidPhp >= finalCostPhp

  const resolvedStatus = autoCompletedFromDeposit ? 'completed' : parsed.data.status
  const completedAt =
    resolvedStatus === 'completed'
      ? (existingRepair.completed_at ?? new Date().toISOString())
      : null

  const preservedEstimatePhp =
    parsed.data.estimated_cost_php ?? Number(existingRepair.estimated_cost_php ?? 0)

  const { error } = await supabase
    .from('repair')
    .update({
      status: resolvedStatus,
      diagnostic_notes: parsed.data.diagnostic_notes || null,
      estimated_cost_php: preservedEstimatePhp,
      final_cost_php: finalCostPhp,
      completed_at: completedAt,
    })
    .eq('ticket_id', parsed.data.ticket_id)
    .eq('technician_id', profile.user_id)

  if (error) {
    return { success: false, error: error.message }
  }

  if (resolvedStatus === 'completed') {
    await supabase
      .from('appointments')
      .update({ appointment_status: 'completed' })
      .eq('ticket_id', parsed.data.ticket_id)
      .eq('technician_id', profile.user_id)
      .in('appointment_status', ['requested', 'confirmed', 'rescheduled'])
  } else if (resolvedStatus === 'in_progress' || resolvedStatus === 'awaiting_payment') {
    await supabase
      .from('appointments')
      .update({ appointment_status: 'confirmed' })
      .eq('ticket_id', parsed.data.ticket_id)
      .eq('technician_id', profile.user_id)
      .in('appointment_status', ['requested', 'rescheduled'])
  }

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'repair',
    entity_id: parsed.data.ticket_id,
    action: 'repair_updated_by_tech',
    description: `Technician ${profile.first_name} ${profile.last_name} updated ${parsed.data.ticket_id} to ${resolvedStatus.replace('_', ' ')}.`,
  })

  revalidateTechPortals()
  return {
    success: true,
    message: autoCompletedFromDeposit
      ? `Final price is already covered by verified payments — ticket ${parsed.data.ticket_id} marked Completed.`
      : `Ticket ${parsed.data.ticket_id} updated successfully.`,
  }
}

export async function recordOnsitePaymentAction(
  input: TechnicianPaymentInput
): Promise<TechActionResult> {
  const profile = await requireRole('technician')
  const parsed = technicianPaymentSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid payment details.',
    }
  }

  if (parsed.data.payment_method !== 'Cash' && !parsed.data.reference_no?.trim()) {
    return {
      success: false,
      error: 'Reference number is required for non-cash field payments.',
    }
  }

  const supabase = await createClient()
  const { data: initialRepair } = await supabase
    .from('v_repair_details')
    .select('ticket_id')
    .eq('ticket_id', parsed.data.ticket_id)
    .eq('technician_id', profile.user_id)
    .maybeSingle()

  if (!initialRepair) {
    return { success: false, error: 'Assigned repair ticket not found.' }
  }

  // Finalize any already-paid PayMongo checkout session before checking balance
  const { finalizedCount } = await syncPaidOpenCheckoutSessions(parsed.data.ticket_id)

  const { data: repairRow } = await supabase
    .from('v_repair_details')
    .select('*')
    .eq('ticket_id', parsed.data.ticket_id)
    .eq('technician_id', profile.user_id)
    .maybeSingle()

  if (!repairRow) {
    return { success: false, error: 'Assigned repair ticket not found.' }
  }

  const summary = getTicketPaymentSummary(repairRow as RepairDetailView)
  if (!summary.hasFinalBill) {
    return {
      success: false,
      error: 'Set the final service price in Billing before collecting payment.',
    }
  }

  if (!summary.canCollectBalance) {
    return {
      success: false,
      error: finalizedCount > 0
        ? 'An online PayMongo payment was just confirmed and settled this ticket.'
        : 'This ticket is already settled or covered by pending payments.',
    }
  }

  if (roundCurrency(parsed.data.amount_php) > summary.payableRemaining) {
    return {
      success: false,
      error: `Amount exceeds the remaining unpaid balance of PHP ${summary.payableRemaining.toFixed(2)}.`,
    }
  }

  const { error } = await supabase.rpc('rpc_record_and_verify_payment', {
    p_ticket_id: parsed.data.ticket_id,
    p_payment_id: null,
    p_payment_method: parsed.data.payment_method,
    p_amount_php: parsed.data.amount_php,
    p_installment_no: parsed.data.installment_no ?? null,
    p_reference_no: parsed.data.reference_no || null,
    p_remarks: parsed.data.remarks || `Collected on-site by ${profile.first_name} ${profile.last_name}`,
    p_verify_immediately: false,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Retire unpaid PayMongo checkout sessions once full remaining balance is collected on-site
  if (roundCurrency(parsed.data.amount_php) >= summary.payableRemaining) {
    const admin = createAdminClient()
    await admin
      .from('payment_checkout_sessions')
      .update({ status: 'cancelled' })
      .eq('ticket_id', parsed.data.ticket_id)
      .eq('session_kind', 'ticket_balance')
      .eq('status', 'awaiting_payment')
  }

  revalidateTechPortals()
  return {
    success: true,
    message: 'On-site payment recorded and queued for admin verification.',
  }
}

export async function createTechnicianPayMongoCheckoutAction(
  input: TechnicianPayMongoCheckoutInput
): Promise<TechActionResult<{ checkoutUrl: string; sessionId: string; amountPhp: number }>> {
  const profile = await requireRole('technician')
  const parsed = technicianPayMongoCheckoutSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid PayMongo checkout amount.',
    }
  }

  const supabase = await createClient()
  const { data: initialRepair } = await supabase
    .from('v_repair_details')
    .select('ticket_id')
    .eq('ticket_id', parsed.data.ticket_id)
    .eq('technician_id', profile.user_id)
    .maybeSingle()

  if (!initialRepair) {
    return { success: false, error: 'Assigned repair ticket not found.' }
  }

  const { finalizedCount, openSessions } = await syncPaidOpenCheckoutSessions(parsed.data.ticket_id)
  if (finalizedCount > 0) {
    revalidateTechPortals()
  }

  const { data: repairRow } = await supabase
    .from('v_repair_details')
    .select('*')
    .eq('ticket_id', parsed.data.ticket_id)
    .eq('technician_id', profile.user_id)
    .maybeSingle()

  if (!repairRow) {
    return { success: false, error: 'Assigned repair ticket not found.' }
  }

  const repair = repairRow as RepairDetailView
  const summary = getTicketPaymentSummary(repair)

  if (repair.status === 'cancelled' || repair.status === 'completed') {
    return { success: false, error: 'This ticket is already completed or cancelled.' }
  }

  if (!summary.hasFinalBill) {
    return {
      success: false,
      error: 'Set the final service price in Billing before creating a PayMongo checkout.',
    }
  }

  if (!summary.canCollectBalance) {
    return {
      success: false,
      error: finalizedCount > 0
        ? 'An existing PayMongo payment was confirmed and covers this balance!'
        : summary.isCoveredByPending
          ? 'Remaining balance is already covered by a payment awaiting verification.'
          : 'This ticket is already paid in full.',
    }
  }

  const amountPhp = roundCurrency(parsed.data.amount_php)
  if (amountPhp > summary.payableRemaining) {
    return {
      success: false,
      error: `Amount exceeds the remaining unpaid balance of PHP ${summary.payableRemaining.toFixed(2)}.`,
    }
  }

  const admin = createAdminClient()

  for (const open of openSessions) {
    if (Math.abs(Number(open.amount_php) - amountPhp) < 0.01 && open.checkout_url) {
      return {
        success: true,
        message: 'Resuming existing PayMongo checkout session.',
        data: {
          checkoutUrl: open.checkout_url,
          sessionId: open.session_id,
          amountPhp,
        },
      }
    }
    await admin
      .from('payment_checkout_sessions')
      .update({ status: 'cancelled' })
      .eq('session_id', open.session_id)
  }

  const sessionId = generateCheckoutSessionId()
  const origin = await getRequestOrigin()
  const successUrl = `${origin}/api/paymongo/callback?session_id=${encodeURIComponent(sessionId)}`
  const cancelUrl = `${origin}/technician/jobs?ticket=${encodeURIComponent(repair.ticket_id)}&payment_cancelled=1`

  try {
    const pmSession = await createPayMongoCheckoutSession({
      amountPhp,
      lineItemName: `${repair.appliance_brand} ${repair.appliance_category} (${repair.ticket_id})`,
      description: `On-site PayMongo balance payment for ${repair.ticket_id}`,
      referenceNumber: `${repair.ticket_id}-${sessionId}`,
      successUrl,
      cancelUrl,
      customerName: `${repair.customer_first_name} ${repair.customer_last_name}`.trim(),
      customerEmail: repair.customer_email,
      customerPhone: repair.customer_phone ?? undefined,
      metadata: {
        spindle_session_id: sessionId,
        spindle_kind: 'ticket_balance',
        ticket_id: repair.ticket_id,
        customer_id: repair.customer_id,
        initiated_by_tech_id: profile.user_id,
      },
    })

    const { error: insertErr } = await admin.from('payment_checkout_sessions').insert({
      session_id: sessionId,
      session_kind: 'ticket_balance',
      customer_id: repair.customer_id,
      ticket_id: repair.ticket_id,
      amount_php: amountPhp,
      remarks:
        parsed.data.remarks?.trim() ||
        `Field PayMongo payment initiated by ${profile.first_name} ${profile.last_name}`,
      paymongo_checkout_id: pmSession.id,
      checkout_url: pmSession.checkoutUrl,
      status: 'awaiting_payment',
    })

    if (insertErr) {
      return { success: false, error: insertErr.message }
    }

    return {
      success: true,
      message: 'PayMongo checkout session ready.',
      data: {
        checkoutUrl: pmSession.checkoutUrl,
        sessionId,
        amountPhp,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unable to start PayMongo checkout.',
    }
  }
}

export async function verifyTechnicianPayMongoCheckoutAction(
  ticketId: string
): Promise<TechActionResult> {
  const profile = await requireRole('technician')
  const supabase = await createClient()

  const { data: repair } = await supabase
    .from('v_repair_details')
    .select('ticket_id')
    .eq('ticket_id', ticketId)
    .eq('technician_id', profile.user_id)
    .maybeSingle()

  if (!repair) {
    return { success: false, error: 'Assigned repair ticket not found.' }
  }

  const { finalizedCount, openSessions } = await syncPaidOpenCheckoutSessions(ticketId)

  if (finalizedCount > 0) {
    revalidateTechPortals()
    return {
      success: true,
      message: 'PayMongo payment verified and applied to this ticket.',
    }
  }

  if (openSessions.length === 0) {
    return {
      success: false,
      error: 'No active PayMongo checkout session was found for this ticket.',
    }
  }

  return {
    success: false,
    error: 'PayMongo has not confirmed completion for this checkout yet. Ask the customer to finish payment and check again.',
  }
}

export async function updateTechnicianAppointmentAction(
  input: TechnicianAppointmentActionInput
): Promise<TechActionResult> {
  const profile = await requireRole('technician')
  const parsed = technicianAppointmentActionSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid appointment update.',
    }
  }

  const supabase = await createClient()
  const { data: apt, error: fetchError } = await supabase
    .from('appointments')
    .select('appointment_id, ticket_id, appointment_status, scheduled_date, time_slot')
    .eq('appointment_id', parsed.data.appointment_id)
    .eq('technician_id', profile.user_id)
    .single()

  if (fetchError || !apt) {
    return { success: false, error: 'Assigned appointment not found.' }
  }

  if (['completed', 'cancelled'].includes(apt.appointment_status)) {
    return { success: false, error: 'Completed or cancelled appointments cannot be modified.' }
  }

  if (parsed.data.appointment_status === 'rescheduled') {
    if (parsed.data.scheduled_date < getManilaTodayISO()) {
      return { success: false, error: 'Rescheduled date cannot be in the past.' }
    }

    const { count: conflictCount } = await supabase
      .from('appointments')
      .select('appointment_id', { count: 'exact', head: true })
      .eq('technician_id', profile.user_id)
      .eq('scheduled_date', parsed.data.scheduled_date)
      .eq('time_slot', parsed.data.time_slot)
      .not('appointment_status', 'in', '(cancelled,completed)')
      .neq('appointment_id', apt.appointment_id)

    if ((conflictCount ?? 0) > 0) {
      return {
        success: false,
        error: 'Double-booking conflict: you already have another appointment in that time slot.',
      }
    }
  }

  const { error } = await supabase
    .from('appointments')
    .update({
      appointment_status: parsed.data.appointment_status,
      scheduled_date: parsed.data.scheduled_date,
      time_slot: parsed.data.time_slot,
      remarks: parsed.data.remarks || null,
    })
    .eq('appointment_id', apt.appointment_id)
    .eq('technician_id', profile.user_id)

  if (error) {
    return { success: false, error: error.message }
  }

  if (parsed.data.appointment_status === 'rescheduled') {
    await supabase
      .from('repair')
      .update({ scheduled_date: parsed.data.scheduled_date })
      .eq('ticket_id', apt.ticket_id)
      .eq('technician_id', profile.user_id)
  } else if (parsed.data.appointment_status === 'completed') {
    const { data: repairRow } = await supabase
      .from('v_repair_details')
      .select('status, final_cost_php, verified_paid_php')
      .eq('ticket_id', apt.ticket_id)
      .eq('technician_id', profile.user_id)
      .maybeSingle()

    if (repairRow && ['confirmed', 'assigned', 'in_progress'].includes(repairRow.status)) {
      const finalCost = repairRow.final_cost_php !== null ? Number(repairRow.final_cost_php) : null
      const verifiedPaid = Number(repairRow.verified_paid_php ?? 0)
      if (finalCost !== null && finalCost > 0 && verifiedPaid >= finalCost) {
        await supabase
          .from('repair')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('ticket_id', apt.ticket_id)
          .eq('technician_id', profile.user_id)
      } else if (finalCost !== null && finalCost > 0) {
        await supabase
          .from('repair')
          .update({ status: 'awaiting_payment' })
          .eq('ticket_id', apt.ticket_id)
          .eq('technician_id', profile.user_id)
      } else if (repairRow.status !== 'in_progress') {
        await supabase
          .from('repair')
          .update({ status: 'in_progress' })
          .eq('ticket_id', apt.ticket_id)
          .eq('technician_id', profile.user_id)
      }
    }
  }

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'appointment',
    entity_id: apt.appointment_id,
    action: `appointment_${parsed.data.appointment_status}`,
    description: `Technician updated appointment ${apt.appointment_id} to ${parsed.data.appointment_status} (${parsed.data.scheduled_date} · ${parsed.data.time_slot}).`,
  })

  revalidateTechPortals()
  return {
    success: true,
    message: `Visit ${apt.appointment_id} marked ${parsed.data.appointment_status}.`,
  }
}

export async function updateTechnicianNicknameAction(
  input: TechnicianNicknameInput
): Promise<TechActionResult> {
  const profile = await requireRole('technician')
  const parsed = technicianNicknameSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid nickname.',
    }
  }

  const cleanNickname = parsed.data.nickname?.trim() || null
  const supabase = await createClient()

  const { error } = await supabase
    .from('users')
    .update({ nickname: cleanNickname })
    .eq('user_id', profile.user_id)

  if (error) {
    return { success: false, error: error.message }
  }

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'technician',
    entity_id: profile.user_id,
    action: 'technician_nickname_updated',
    description: cleanNickname
      ? `Technician set display nickname to "${cleanNickname}".`
      : 'Technician cleared their display nickname.',
  })

  revalidateTechPortals([
    'user-profile',
    'admin-users',
    'admin-tech-profiles',
    'admin-status-logs',
  ])
  return { success: true, message: 'Nickname saved.' }
}

export async function updateTechnicianAvailabilityAction(
  input: TechnicianAvailabilityInput
): Promise<TechActionResult> {
  const profile = await requireRole('technician')
  const parsed = technicianAvailabilitySchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid availability status.',
    }
  }

  const supabase = await createClient()
  const previousStatus = profile.technician_profile?.availability_status ?? null
  const nextStatus = parsed.data.availability_status

  const { error: techError } = await supabase
    .from('technician_profiles')
    .upsert(
      {
        technician_id: profile.user_id,
        availability_status: nextStatus,
      },
      { onConflict: 'technician_id' }
    )

  if (techError) {
    return { success: false, error: techError.message }
  }

  if (previousStatus !== nextStatus) {
    await supabase.from('technician_status_logs').insert({
      technician_id: profile.user_id,
      previous_status: previousStatus,
      new_status: nextStatus,
      changed_by: profile.user_id,
    })

    await supabase.from('activity_logs').insert({
      actor_id: profile.user_id,
      entity_type: 'technician',
      entity_id: profile.user_id,
      action: 'availability_changed',
      description: `Technician changed availability status from ${previousStatus ?? 'unset'} to ${nextStatus}.`,
    })
  }

  revalidateTechPortals([
    'user-profile',
    'admin-tech-profiles',
    'admin-status-logs',
  ])
  return {
    success: true,
    message: `Status updated to ${getTechAvailabilityLabel(nextStatus)}.`,
  }
}
