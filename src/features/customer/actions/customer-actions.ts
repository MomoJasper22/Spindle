'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { normalizePHPhone } from '@/lib/formatters'
import {
  applianceSchema,
  customerPaymentSchema,
  customerProfileSchema,
  repairBookingSchema,
  rescheduleAppointmentSchema,
  type ApplianceInput,
  type CustomerPaymentInput,
  type CustomerProfileInput,
  type RepairBookingInput,
  type RescheduleAppointmentInput,
} from '../schemas/customer-schemas'

export type ActionResult<T = void> =
  | { success: true; message: string; data?: T }
  | { success: false; error: string }

function revalidateCustomerPortal() {
  updateTag('user-profile')
  updateTag('customer-appliances')
  updateTag('customer-repairs')
  updateTag('customer-appointments')
  updateTag('customer-payments')
  updateTag('customer-activity')
  updateTag('admin-appliances')
  updateTag('admin-repairs')
  updateTag('admin-appointments')
  updateTag('admin-payments')
  updateTag('admin-activity')
  revalidatePath('/customer', 'layout')
}

export async function createApplianceAction(input: ApplianceInput): Promise<ActionResult> {
  const profile = await requireRole('customer')
  const parsed = applianceSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Please check the appliance details.' }
  }

  const supabase = await createClient()
  const { data: inserted, error } = await supabase
    .from('customer_appliances')
    .insert({
      customer_id: profile.user_id,
      brand: parsed.data.brand,
      category: parsed.data.category,
      model_number: parsed.data.model_number,
      serial_number: parsed.data.serial_number.toUpperCase(),
      purchase_date: parsed.data.purchase_date || null,
      notes: parsed.data.notes || null,
      registration_status: 'pending_verification',
    })
    .select('appliance_id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return {
        success: false,
        error: 'An appliance with this serial number is already saved on your account.',
      }
    }
    return { success: false, error: error.message }
  }

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'appliance',
    entity_id: inserted.appliance_id,
    action: 'appliance_registered',
    description: `Added ${parsed.data.brand} ${parsed.data.category} (${parsed.data.model_number}).`,
  })

  revalidateCustomerPortal()
  return { success: true, message: 'Appliance saved to your account.' }
}

export async function updateApplianceAction(
  applianceId: string,
  input: ApplianceInput
): Promise<ActionResult> {
  const profile = await requireRole('customer')
  const parsed = applianceSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Please check the appliance details.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('customer_appliances')
    .update({
      brand: parsed.data.brand,
      category: parsed.data.category,
      model_number: parsed.data.model_number,
      serial_number: parsed.data.serial_number.toUpperCase(),
      purchase_date: parsed.data.purchase_date || null,
      notes: parsed.data.notes || null,
    })
    .eq('appliance_id', applianceId)
    .eq('customer_id', profile.user_id)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'That serial number is already used on another saved appliance.' }
    }
    return { success: false, error: error.message }
  }

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'appliance',
    entity_id: applianceId,
    action: 'appliance_updated',
    description: `Updated ${parsed.data.brand} ${parsed.data.model_number}.`,
  })

  revalidateCustomerPortal()
  return { success: true, message: 'Appliance details updated.' }
}

export async function deleteOrCancelApplianceAction(
  applianceId: string,
  mode: 'cancel' | 'delete'
): Promise<ActionResult> {
  const profile = await requireRole('customer')
  const supabase = await createClient()

  const { count: linkedRepairs } = await supabase
    .from('repair')
    .select('ticket_id', { count: 'exact', head: true })
    .eq('appliance_id', applianceId)

  if (mode === 'delete') {
    if ((linkedRepairs ?? 0) > 0) {
      return {
        success: false,
        error: 'This appliance has past visits so it cannot be deleted. You can mark it as removed instead.',
      }
    }

    const { error } = await supabase
      .from('customer_appliances')
      .delete()
      .eq('appliance_id', applianceId)
      .eq('customer_id', profile.user_id)

    if (error) {
      return { success: false, error: error.message }
    }

    await supabase.from('activity_logs').insert({
      actor_id: profile.user_id,
      entity_type: 'appliance',
      entity_id: applianceId,
      action: 'appliance_deleted',
      description: `Removed a saved appliance.`,
    })

    revalidateCustomerPortal()
    return { success: true, message: 'Appliance removed.' }
  }

  const { error } = await supabase
    .from('customer_appliances')
    .update({ registration_status: 'cancelled' })
    .eq('appliance_id', applianceId)
    .eq('customer_id', profile.user_id)

  if (error) {
    return { success: false, error: error.message }
  }

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'appliance',
    entity_id: applianceId,
    action: 'appliance_cancelled',
    description: `Marked an appliance as inactive.`,
  })

  revalidateCustomerPortal()
  return { success: true, message: 'Appliance marked as inactive.' }
}

export async function createRepairBookingAction(
  input: RepairBookingInput
): Promise<ActionResult<{ ticket_id: string; appointment_id: string }>> {
  const profile = await requireRole('customer')
  const parsed = repairBookingSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Please check your booking details.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('rpc_create_repair_with_appointment', {
    p_customer_id: profile.user_id,
    p_appliance_id: parsed.data.appliance_id,
    p_service_type: parsed.data.service_type,
    p_priority: parsed.data.priority,
    p_issue_description: parsed.data.issue_description,
    p_scheduled_date: parsed.data.scheduled_date,
    p_time_slot: parsed.data.time_slot,
    p_service_address: parsed.data.service_address,
    p_remarks: parsed.data.remarks || null,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  const row = Array.isArray(data) ? data[0] : data
  revalidateCustomerPortal()
  return {
    success: true,
    message: 'Your home visit has been booked! We will assign a technician shortly.',
    data: row,
  }
}

export async function rescheduleAppointmentAction(
  input: RescheduleAppointmentInput
): Promise<ActionResult> {
  const profile = await requireRole('customer')
  const parsed = rescheduleAppointmentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Please choose a valid date and window.' }
  }

  const supabase = await createClient()
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('appointment_id, ticket_id, appointment_status')
    .eq('appointment_id', parsed.data.appointment_id)
    .eq('customer_id', profile.user_id)
    .single()

  if (fetchError || !appointment) {
    return { success: false, error: 'We could not find that visit.' }
  }

  if (['completed', 'cancelled'].includes(appointment.appointment_status)) {
    return { success: false, error: 'Finished or cancelled visits cannot be moved.' }
  }

  const { error: updateAptError } = await supabase
    .from('appointments')
    .update({
      scheduled_date: parsed.data.scheduled_date,
      time_slot: parsed.data.time_slot,
      appointment_status: 'rescheduled',
      remarks: parsed.data.remarks || null,
    })
    .eq('appointment_id', appointment.appointment_id)
    .eq('customer_id', profile.user_id)

  if (updateAptError) {
    return { success: false, error: updateAptError.message }
  }

  await supabase
    .from('repair')
    .update({ scheduled_date: parsed.data.scheduled_date })
    .eq('ticket_id', appointment.ticket_id)
    .eq('customer_id', profile.user_id)

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'appointment',
    entity_id: appointment.appointment_id,
    action: 'appointment_rescheduled',
    description: `Moved home visit to ${parsed.data.scheduled_date} (${parsed.data.time_slot}).`,
  })

  revalidateCustomerPortal()
  return { success: true, message: 'Visit schedule updated.' }
}

export async function cancelRepairTicketAction(ticketId: string): Promise<ActionResult> {
  const profile = await requireRole('customer')
  const supabase = await createClient()

  const { data: repair, error: fetchError } = await supabase
    .from('repair')
    .select('ticket_id, status')
    .eq('ticket_id', ticketId)
    .eq('customer_id', profile.user_id)
    .single()

  if (fetchError || !repair) {
    return { success: false, error: 'Booking not found.' }
  }

  if (!['pending', 'confirmed'].includes(repair.status)) {
    return {
      success: false,
      error: 'A technician is already on this booking. Please contact support if you need to cancel.',
    }
  }

  const { error: repairErr } = await supabase
    .from('repair')
    .update({ status: 'cancelled' })
    .eq('ticket_id', ticketId)
    .eq('customer_id', profile.user_id)

  if (repairErr) {
    return { success: false, error: repairErr.message }
  }

  await supabase
    .from('appointments')
    .update({ appointment_status: 'cancelled' })
    .eq('ticket_id', ticketId)
    .eq('customer_id', profile.user_id)

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'repair',
    entity_id: ticketId,
    action: 'repair_cancelled',
    description: `Cancelled home visit booking.`,
  })

  revalidateCustomerPortal()
  return { success: true, message: 'Your booking has been cancelled.' }
}

export async function submitCustomerPaymentAction(
  input: CustomerPaymentInput
): Promise<ActionResult> {
  await requireRole('customer')
  const parsed = customerPaymentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Please check your payment details.' }
  }

  if (parsed.data.payment_method !== 'Cash' && !parsed.data.reference_no?.trim()) {
    return {
      success: false,
      error: 'Please enter the reference number for your digital or bank transfer.',
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
    p_remarks: parsed.data.remarks || null,
    p_verify_immediately: false,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateCustomerPortal()
  return {
    success: true,
    message: 'Payment details sent. We will confirm it shortly.',
  }
}

export async function updateCustomerProfileAction(
  input: CustomerProfileInput
): Promise<ActionResult> {
  const profile = await requireRole('customer')
  const parsed = customerProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Please check your profile details.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
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

  if (error) {
    return { success: false, error: error.message }
  }

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'user',
    entity_id: profile.user_id,
    action: 'profile_updated',
    description: `Updated contact details and home address.`,
  })

  revalidateCustomerPortal()
  return { success: true, message: 'Your profile details have been saved.' }
}

export async function deactivateCustomerAccountAction(): Promise<ActionResult> {
  const profile = await requireRole('customer')
  const supabase = await createClient()

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'user',
    entity_id: profile.user_id,
    action: 'account_deactivated',
    description: `${profile.first_name} ${profile.last_name} paused their account.`,
  })

  const { error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('user_id', profile.user_id)

  if (error) {
    return { success: false, error: error.message }
  }

  await supabase.auth.signOut()
  redirect('/login?error=account_inactive')
}
