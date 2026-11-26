'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { normalizePHPhone } from '@/lib/formatters'
import {
  technicianAppointmentActionSchema,
  technicianPaymentSchema,
  technicianProfileSchema,
  technicianRepairUpdateSchema,
  type TechnicianAppointmentActionInput,
  type TechnicianPaymentInput,
  type TechnicianProfileInput,
  type TechnicianRepairUpdateInput,
} from '../schemas/technician-schemas'

export type TechActionResult =
  | { success: true; message: string }
  | { success: false; error: string }

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
  const completedAt = parsed.data.status === 'completed' ? new Date().toISOString() : null

  const { error } = await supabase
    .from('repair')
    .update({
      status: parsed.data.status,
      diagnostic_notes: parsed.data.diagnostic_notes || null,
      estimated_cost_php: parsed.data.estimated_cost_php,
      final_cost_php: parsed.data.final_cost_php,
      ...(completedAt ? { completed_at: completedAt } : {}),
    })
    .eq('ticket_id', parsed.data.ticket_id)
    .eq('technician_id', profile.user_id)

  if (error) {
    return { success: false, error: error.message }
  }

  if (parsed.data.status === 'completed') {
    await supabase
      .from('appointments')
      .update({ appointment_status: 'completed' })
      .eq('ticket_id', parsed.data.ticket_id)
      .eq('technician_id', profile.user_id)
      .in('appointment_status', ['requested', 'confirmed', 'rescheduled'])
  }

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'repair',
    entity_id: parsed.data.ticket_id,
    action: 'repair_updated_by_tech',
    description: `Technician ${profile.first_name} ${profile.last_name} updated ${parsed.data.ticket_id} to ${parsed.data.status.replace('_', ' ')}.`,
  })

  revalidatePath('/technician/dashboard')
  return {
    success: true,
    message: `Ticket ${parsed.data.ticket_id} updated successfully.`,
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

  revalidatePath('/technician/dashboard')
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
    .select('appointment_id, ticket_id')
    .eq('appointment_id', parsed.data.appointment_id)
    .eq('technician_id', profile.user_id)
    .single()

  if (fetchError || !apt) {
    return { success: false, error: 'Assigned appointment not found.' }
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
  }

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'appointment',
    entity_id: apt.appointment_id,
    action: `appointment_${parsed.data.appointment_status}`,
    description: `Technician updated appointment ${apt.appointment_id} to ${parsed.data.appointment_status} (${parsed.data.scheduled_date} · ${parsed.data.time_slot}).`,
  })

  revalidatePath('/technician/dashboard')
  return {
    success: true,
    message: `Appointment ${apt.appointment_id} marked ${parsed.data.appointment_status}.`,
  }
}

export async function updateTechnicianProfileAction(
  input: TechnicianProfileInput
): Promise<TechActionResult> {
  const profile = await requireRole('technician')
  const parsed = technicianProfileSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid technician profile fields.',
    }
  }

  const supabase = await createClient()

  const { error: userError } = await supabase
    .from('users')
    .update({
      first_name: parsed.data.first_name,
      middle_name: parsed.data.middle_name || null,
      last_name: parsed.data.last_name,
      phone: normalizePHPhone(parsed.data.phone),
      branch_location: parsed.data.branch_location,
      address_street: parsed.data.address_street,
      address_barangay: parsed.data.address_barangay,
      address_city: parsed.data.address_city,
      address_province: parsed.data.address_province,
      address_zip_code: parsed.data.address_zip_code,
    })
    .eq('user_id', profile.user_id)

  if (userError) {
    return { success: false, error: userError.message }
  }

  const { error: techError } = await supabase
    .from('technician_profiles')
    .upsert(
      {
        technician_id: profile.user_id,
        specializations: parsed.data.specializations,
        certification_no: parsed.data.certification_no,
        max_daily_jobs: parsed.data.max_daily_jobs,
        availability_status: parsed.data.availability_status,
      },
      { onConflict: 'technician_id' }
    )

  if (techError) {
    return { success: false, error: techError.message }
  }

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'technician',
    entity_id: profile.user_id,
    action: 'technician_profile_updated',
    description: `Technician updated credentials & availability (${parsed.data.availability_status}).`,
  })

  revalidatePath('/technician/profile')
  revalidatePath('/technician/dashboard')
  return { success: true, message: 'Technician profile and field credentials saved.' }
}
