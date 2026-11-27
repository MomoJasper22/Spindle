'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { getManilaTodayISO } from '@/lib/formatters'
import { getTicketPaymentSummary } from '@/lib/payments'
import type { RepairDetailView } from '@/types/database'
import {
  technicianAppointmentActionSchema,
  technicianAvailabilitySchema,
  technicianNicknameSchema,
  technicianPaymentSchema,
  technicianRepairUpdateSchema,
  type TechnicianAppointmentActionInput,
  type TechnicianAvailabilityInput,
  type TechnicianNicknameInput,
  type TechnicianPaymentInput,
  type TechnicianRepairUpdateInput,
} from '../schemas/technician-schemas'

export type TechActionResult =
  | { success: true; message: string }
  | { success: false; error: string }

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
  const { data: existingRepair, error: fetchError } = await supabase
    .from('v_repair_details')
    .select('ticket_id, status, completed_at, verified_paid_php')
    .eq('ticket_id', parsed.data.ticket_id)
    .eq('technician_id', profile.user_id)
    .maybeSingle()

  if (fetchError || !existingRepair) {
    return { success: false, error: 'Assigned repair ticket not found.' }
  }

  if (existingRepair.status === 'cancelled') {
    return { success: false, error: 'Cancelled tickets cannot be updated.' }
  }

  const verifiedPaidPhp = Number(existingRepair.verified_paid_php ?? 0)
  const finalCostPhp = parsed.data.final_cost_php
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

  const { error } = await supabase
    .from('repair')
    .update({
      status: resolvedStatus,
      diagnostic_notes: parsed.data.diagnostic_notes || null,
      estimated_cost_php: parsed.data.estimated_cost_php,
      final_cost_php: finalCostPhp,
      completed_at: completedAt,
    })
    .eq('ticket_id', parsed.data.ticket_id)
    .eq('technician_id', profile.user_id)

  if (error) {
    return { success: false, error: error.message }
  }

  // Keep linked visit appointment synchronized with repair progression
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
      ? `Final cost is already covered by verified payments — ticket ${parsed.data.ticket_id} marked Completed!`
      : `Ticket ${parsed.data.ticket_id} updated successfully.`,
  }
}

export async function startTechnicianJobAction(ticketId: string): Promise<TechActionResult> {
  const profile = await requireRole('technician')
  const cleanId = ticketId.trim()
  if (!cleanId) {
    return { success: false, error: 'Missing ticket ID.' }
  }

  const supabase = await createClient()
  const { data: repair, error: fetchError } = await supabase
    .from('repair')
    .select('ticket_id, status')
    .eq('ticket_id', cleanId)
    .eq('technician_id', profile.user_id)
    .maybeSingle()

  if (fetchError || !repair) {
    return { success: false, error: 'Assigned repair ticket not found.' }
  }

  if (['completed', 'cancelled'].includes(repair.status)) {
    return { success: false, error: 'Completed or cancelled jobs cannot be restarted.' }
  }

  if (repair.status === 'in_progress') {
    return { success: true, message: `Job ${cleanId} is already in progress.` }
  }

  const { error } = await supabase
    .from('repair')
    .update({ status: 'in_progress' })
    .eq('ticket_id', cleanId)
    .eq('technician_id', profile.user_id)

  if (error) {
    return { success: false, error: error.message }
  }

  await supabase
    .from('appointments')
    .update({ appointment_status: 'confirmed' })
    .eq('ticket_id', cleanId)
    .eq('technician_id', profile.user_id)
    .in('appointment_status', ['requested', 'rescheduled'])

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'repair',
    entity_id: cleanId,
    action: 'repair_started_by_tech',
    description: `Technician ${profile.first_name} ${profile.last_name} started work on ${cleanId}.`,
  })

  revalidateTechPortals()
  return {
    success: true,
    message: `Job ${cleanId} started and visit slot confirmed.`,
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
  const { data: repairRow } = await supabase
    .from('v_repair_details')
    .select('*')
    .eq('ticket_id', parsed.data.ticket_id)
    .eq('technician_id', profile.user_id)
    .maybeSingle()

  if (repairRow) {
    const summary = getTicketPaymentSummary(repairRow as RepairDetailView)
    if (!summary.canRecordFieldPayment) {
      return {
        success: false,
        error: 'This ticket is already covered by verified or pending payments.',
      }
    }
    if (summary.hasFinalBill && parsed.data.amount_php > summary.payableRemaining) {
      return {
        success: false,
        error: `Amount exceeds the remaining unpaid balance of PHP ${summary.payableRemaining.toFixed(2)}.`,
      }
    }
  }

  const { error } = await supabase.rpc('rpc_record_and_verify_payment', {
    p_ticket_id: parsed.data.ticket_id,
    p_payment_id: null,
    p_payment_method: parsed.data.payment_method,
    p_amount_php: parsed.data.amount_php,
    p_installment_no: parsed.data.installment_no,
    p_reference_no: parsed.data.reference_no || null,
    p_remarks: parsed.data.remarks || `Collected on-site by ${profile.first_name} ${profile.last_name}`,
    p_verify_immediately: false,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateTechPortals()
  return {
    success: true,
    message: 'On-site payment recorded and queued for admin verification.',
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

  const { data: repair } = await supabase
    .from('repair')
    .select('status')
    .eq('ticket_id', apt.ticket_id)
    .eq('technician_id', profile.user_id)
    .maybeSingle()

  if (repair && ['completed', 'cancelled'].includes(repair.status)) {
    return { success: false, error: 'Visits for completed or cancelled jobs cannot be rescheduled.' }
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
  } else if (parsed.data.appointment_status === 'confirmed' && repair?.status === 'pending') {
    await supabase
      .from('repair')
      .update({ status: 'assigned' })
      .eq('ticket_id', apt.ticket_id)
      .eq('technician_id', profile.user_id)
  }

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'appointment',
    entity_id: apt.appointment_id,
    action: `appointment_${parsed.data.appointment_status}`,
    description: `Technician updated visit ${apt.appointment_id} (${apt.ticket_id}) to ${parsed.data.appointment_status} (${parsed.data.scheduled_date} · ${parsed.data.time_slot}).`,
  })

  revalidateTechPortals()
  return {
    success: true,
    message:
      parsed.data.appointment_status === 'confirmed'
        ? `Visit slot for ${apt.ticket_id} confirmed.`
        : `Visit for ${apt.ticket_id} rescheduled to ${parsed.data.scheduled_date} (${parsed.data.time_slot}).`,
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
    message: `Status updated to ${nextStatus.replace('_', ' ')}.`,
  }
}
