'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/session'
import { USER_TYPE_IDS, type AppointmentStatus, type RegistrationStatus, type TimeSlot } from '@/lib/constants'
import { normalizePHPhone } from '@/lib/formatters'
import {
  adminApplianceSchema,
  adminAssignTechSchema,
  adminCreateRepairSchema,
  adminCreateUserSchema,
  adminProfileSchema,
  adminRecordPaymentSchema,
  adminTechProfileSchema,
  adminUpdateRepairSchema,
  adminUpdateUserSchema,
  type AdminApplianceInput,
  type AdminAssignTechInput,
  type AdminCreateRepairInput,
  type AdminCreateUserInput,
  type AdminProfileInput,
  type AdminRecordPaymentInput,
  type AdminTechProfileInput,
  type AdminUpdateRepairInput,
  type AdminUpdateUserInput,
} from '../schemas/admin-schemas'

export type AdminActionResult =
  | { success: true; message: string }
  | { success: false; error: string }

function revalidateAdminPaths() {
  revalidatePath('/admin', 'layout')
  revalidatePath('/technician', 'layout')
  revalidatePath('/customer', 'layout')
}

export async function adminCreateUserAction(
  input: AdminCreateUserInput
): Promise<AdminActionResult> {
  const adminProfile = await requireRole('admin')
  const parsed = adminCreateUserSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid user details.' }
  }

  const admin = createAdminClient()
  const email = parsed.data.email.toLowerCase()

  const { data: existing } = await admin
    .from('users')
    .select('user_id')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'A user with this email already exists.' }
  }

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
    },
  })

  if (authErr || !authData.user) {
    return { success: false, error: authErr?.message ?? 'Failed to create auth account.' }
  }

  const { data: hashedPassword, error: hashErr } = await admin.rpc('hash_password_bcrypt', {
    raw_password: parsed.data.password,
  })

  if (hashErr || typeof hashedPassword !== 'string') {
    await admin.auth.admin.deleteUser(authData.user.id)
    return { success: false, error: 'Failed to hash account password.' }
  }

  const { data: insertedUser, error: insertErr } = await admin
    .from('users')
    .insert({
      auth_user_id: authData.user.id,
      first_name: parsed.data.first_name,
      middle_name: parsed.data.middle_name || null,
      last_name: parsed.data.last_name,
      email,
      password: hashedPassword,
      phone: normalizePHPhone(parsed.data.phone),
      user_type_id: USER_TYPE_IDS[parsed.data.role],
      branch_location: parsed.data.branch_location,
      address_street: parsed.data.address_street,
      address_barangay: parsed.data.address_barangay,
      address_city: parsed.data.address_city,
      address_province: parsed.data.address_province,
      address_zip_code: parsed.data.address_zip_code,
      is_onboarded: true,
      is_active: true,
    })
    .select('user_id')
    .single()

  if (insertErr || !insertedUser) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return { success: false, error: insertErr?.message ?? 'Failed to save user record.' }
  }

  if (parsed.data.role === 'technician') {
    await admin.from('technician_profiles').insert({
      technician_id: insertedUser.user_id,
      specializations: parsed.data.specializations ?? [],
      certification_no: parsed.data.certification_no || null,
      max_daily_jobs: parsed.data.max_daily_jobs ?? 4,
      availability_status: 'available',
    })
  }

  await admin.from('activity_logs').insert({
    actor_id: adminProfile.user_id,
    entity_type: 'user',
    entity_id: insertedUser.user_id,
    action: 'user_created_by_admin',
    description: `Admin created ${parsed.data.role} account for ${parsed.data.first_name} ${parsed.data.last_name} (${insertedUser.user_id}).`,
  })

  revalidateAdminPaths()
  return {
    success: true,
    message: `Created ${parsed.data.role} user ${insertedUser.user_id}.`,
  }
}

export async function adminUpdateUserAction(
  input: AdminUpdateUserInput
): Promise<AdminActionResult> {
  const adminProfile = await requireRole('admin')
  const parsed = adminUpdateUserSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid user fields.' }
  }

  if (parsed.data.user_id === adminProfile.user_id && !parsed.data.is_active) {
    return { success: false, error: 'You cannot deactivate your own active administrator session.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('users')
    .update({
      first_name: parsed.data.first_name,
      middle_name: parsed.data.middle_name || null,
      last_name: parsed.data.last_name,
      user_type_id: USER_TYPE_IDS[parsed.data.role],
      phone: normalizePHPhone(parsed.data.phone),
      branch_location: parsed.data.branch_location,
      address_street: parsed.data.address_street,
      address_barangay: parsed.data.address_barangay,
      address_city: parsed.data.address_city,
      address_province: parsed.data.address_province,
      address_zip_code: parsed.data.address_zip_code,
      is_active: parsed.data.is_active,
    })
    .eq('user_id', parsed.data.user_id)

  if (error) {
    return { success: false, error: error.message }
  }

  if (parsed.data.role === 'technician') {
    await supabase.from('technician_profiles').upsert(
      {
        technician_id: parsed.data.user_id,
      },
      { onConflict: 'technician_id', ignoreDuplicates: true }
    )
  }

  await supabase.from('activity_logs').insert({
    actor_id: adminProfile.user_id,
    entity_type: 'user',
    entity_id: parsed.data.user_id,
    action: 'user_updated_by_admin',
    description: `Admin updated account ${parsed.data.user_id} (role: ${parsed.data.role}, active: ${parsed.data.is_active}).`,
  })

  revalidateAdminPaths()
  return { success: true, message: `Updated user ${parsed.data.user_id}.` }
}

export async function adminToggleUserActiveAction(
  userId: string,
  nextActive: boolean
): Promise<AdminActionResult> {
  const adminProfile = await requireRole('admin')
  if (userId === adminProfile.user_id && !nextActive) {
    return { success: false, error: 'Cannot deactivate your own administrator account.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('users')
    .update({ is_active: nextActive })
    .eq('user_id', userId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_logs').insert({
    actor_id: adminProfile.user_id,
    entity_type: 'user',
    entity_id: userId,
    action: nextActive ? 'user_activated' : 'user_deactivated',
    description: `Admin ${nextActive ? 'activated' : 'deactivated'} user ${userId}.`,
  })

  revalidateAdminPaths()
  return {
    success: true,
    message: `User ${userId} ${nextActive ? 'activated' : 'deactivated'}.`,
  }
}

export async function adminDeleteUserAction(userId: string): Promise<AdminActionResult> {
  const adminProfile = await requireRole('admin')
  if (userId === adminProfile.user_id) {
    return { success: false, error: 'You cannot delete your own active account.' }
  }

  const admin = createAdminClient()
  const { data: target } = await admin
    .from('users')
    .select('auth_user_id, first_name, last_name')
    .eq('user_id', userId)
    .single()

  if (!target) return { success: false, error: 'User not found.' }

  const { error: deleteErr } = await admin.from('users').delete().eq('user_id', userId)
  if (deleteErr) {
    return {
      success: false,
      error:
        'Cannot hard-delete a user with existing appliance, repair, or payment history. Deactivate the account instead.',
    }
  }

  if (target.auth_user_id) {
    await admin.auth.admin.deleteUser(target.auth_user_id)
  }

  await admin.from('activity_logs').insert({
    actor_id: adminProfile.user_id,
    entity_type: 'user',
    entity_id: userId,
    action: 'user_deleted',
    description: `Admin deleted user ${target.first_name} ${target.last_name} (${userId}).`,
  })

  revalidateAdminPaths()
  return { success: true, message: `User ${userId} removed.` }
}

export async function adminUpdateTechProfileAction(
  input: AdminTechProfileInput
): Promise<AdminActionResult> {
  const adminProfile = await requireRole('admin')
  const parsed = adminTechProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid technician fields.' }
  }

  const supabase = await createClient()
  const { error: userErr } = await supabase
    .from('users')
    .update({ branch_location: parsed.data.branch_location })
    .eq('user_id', parsed.data.technician_id)

  if (userErr) return { success: false, error: userErr.message }

  const { error: tpErr } = await supabase.from('technician_profiles').upsert(
    {
      technician_id: parsed.data.technician_id,
      specializations: parsed.data.specializations,
      certification_no: parsed.data.certification_no,
      availability_status: parsed.data.availability_status,
      max_daily_jobs: parsed.data.max_daily_jobs,
    },
    { onConflict: 'technician_id' }
  )

  if (tpErr) return { success: false, error: tpErr.message }

  await supabase.from('activity_logs').insert({
    actor_id: adminProfile.user_id,
    entity_type: 'technician',
    entity_id: parsed.data.technician_id,
    action: 'technician_updated_by_admin',
    description: `Admin updated technician ${parsed.data.technician_id} (${parsed.data.branch_location}, ${parsed.data.availability_status}).`,
  })

  revalidateAdminPaths()
  return { success: true, message: 'Technician profile updated.' }
}

export async function adminAssignTechnicianAction(
  input: AdminAssignTechInput
): Promise<AdminActionResult> {
  await requireRole('admin')
  const parsed = adminAssignTechSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid assignment fields.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('rpc_assign_technician_and_confirm_slot', {
    p_ticket_id: parsed.data.ticket_id,
    p_technician_id: parsed.data.technician_id,
    p_scheduled_date: parsed.data.scheduled_date,
    p_time_slot: parsed.data.time_slot,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidateAdminPaths()
  return {
    success: true,
    message: `Assigned technician ${parsed.data.technician_id} to ${parsed.data.ticket_id} with slot lock verified.`,
  }
}

export async function adminUpsertApplianceAction(
  input: AdminApplianceInput,
  applianceId?: string
): Promise<AdminActionResult> {
  const adminProfile = await requireRole('admin')
  const parsed = adminApplianceSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid appliance fields.' }
  }

  const supabase = await createClient()
  if (applianceId) {
    const { error } = await supabase
      .from('customer_appliances')
      .update({
        customer_id: parsed.data.customer_id,
        brand: parsed.data.brand,
        category: parsed.data.category,
        model_number: parsed.data.model_number,
        serial_number: parsed.data.serial_number.toUpperCase(),
        purchase_date: parsed.data.purchase_date || null,
        registration_status: parsed.data.registration_status,
        notes: parsed.data.notes || null,
      })
      .eq('appliance_id', applianceId)

    if (error) return { success: false, error: error.message }

    await supabase.from('activity_logs').insert({
      actor_id: adminProfile.user_id,
      entity_type: 'appliance',
      entity_id: applianceId,
      action: 'appliance_updated_by_admin',
      description: `Admin updated appliance ${applianceId} (${parsed.data.registration_status}).`,
    })

    revalidateAdminPaths()
    return { success: true, message: `Appliance ${applianceId} updated.` }
  }

  const { data: created, error } = await supabase
    .from('customer_appliances')
    .insert({
      customer_id: parsed.data.customer_id,
      brand: parsed.data.brand,
      category: parsed.data.category,
      model_number: parsed.data.model_number,
      serial_number: parsed.data.serial_number.toUpperCase(),
      purchase_date: parsed.data.purchase_date || null,
      registration_status: parsed.data.registration_status,
      notes: parsed.data.notes || null,
    })
    .select('appliance_id')
    .single()

  if (error || !created) {
    return { success: false, error: error?.message ?? 'Failed to register appliance.' }
  }

  await supabase.from('activity_logs').insert({
    actor_id: adminProfile.user_id,
    entity_type: 'appliance',
    entity_id: created.appliance_id,
    action: 'appliance_created_by_admin',
    description: `Admin registered appliance ${created.appliance_id} for customer ${parsed.data.customer_id}.`,
  })

  revalidateAdminPaths()
  return { success: true, message: `Registered appliance ${created.appliance_id}.` }
}

export async function adminSetApplianceStatusAction(
  applianceId: string,
  status: RegistrationStatus
): Promise<AdminActionResult> {
  const adminProfile = await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase
    .from('customer_appliances')
    .update({ registration_status: status })
    .eq('appliance_id', applianceId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_logs').insert({
    actor_id: adminProfile.user_id,
    entity_type: 'appliance',
    entity_id: applianceId,
    action: `appliance_${status}`,
    description: `Admin marked appliance registration ${applianceId} as ${status.replace('_', ' ')}.`,
  })

  revalidateAdminPaths()
  return { success: true, message: `Appliance ${applianceId} marked ${status.replace('_', ' ')}.` }
}

export async function adminDeleteApplianceAction(applianceId: string): Promise<AdminActionResult> {
  const adminProfile = await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase
    .from('customer_appliances')
    .delete()
    .eq('appliance_id', applianceId)

  if (error) {
    return {
      success: false,
      error: 'Cannot delete appliance with existing repair tickets. Cancel the registration instead.',
    }
  }

  await supabase.from('activity_logs').insert({
    actor_id: adminProfile.user_id,
    entity_type: 'appliance',
    entity_id: applianceId,
    action: 'appliance_deleted_by_admin',
    description: `Admin deleted appliance ${applianceId}.`,
  })

  revalidateAdminPaths()
  return { success: true, message: `Appliance ${applianceId} deleted.` }
}

export async function adminCreateRepairAction(
  input: AdminCreateRepairInput
): Promise<AdminActionResult> {
  await requireRole('admin')
  const parsed = adminCreateRepairSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid repair ticket fields.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('rpc_create_repair_with_appointment', {
    p_customer_id: parsed.data.customer_id,
    p_appliance_id: parsed.data.appliance_id,
    p_service_type: parsed.data.service_type,
    p_priority: parsed.data.priority,
    p_issue_description: parsed.data.issue_description,
    p_scheduled_date: parsed.data.scheduled_date,
    p_time_slot: parsed.data.time_slot,
    p_service_address: parsed.data.service_address,
    p_remarks: parsed.data.remarks || 'Walk-in / phone-in ticket logged by Admin',
  })

  if (error) return { success: false, error: error.message }

  const row = Array.isArray(data) ? data[0] : data
  revalidateAdminPaths()
  return {
    success: true,
    message: `Created walk-in ticket ${row?.ticket_id ?? ''} and appointment ${row?.appointment_id ?? ''}.`,
  }
}

export async function adminUpdateRepairAction(
  input: AdminUpdateRepairInput
): Promise<AdminActionResult> {
  const adminProfile = await requireRole('admin')
  const parsed = adminUpdateRepairSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid repair update.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('repair')
    .update({
      status: parsed.data.status,
      priority: parsed.data.priority,
      diagnostic_notes: parsed.data.diagnostic_notes || null,
      estimated_cost_php: parsed.data.estimated_cost_php,
      final_cost_php: parsed.data.final_cost_php,
      ...(parsed.data.status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
    })
    .eq('ticket_id', parsed.data.ticket_id)

  if (error) return { success: false, error: error.message }

  if (parsed.data.status === 'cancelled') {
    await supabase
      .from('appointments')
      .update({ appointment_status: 'cancelled' })
      .eq('ticket_id', parsed.data.ticket_id)
  } else if (parsed.data.status === 'completed') {
    await supabase
      .from('appointments')
      .update({ appointment_status: 'completed' })
      .eq('ticket_id', parsed.data.ticket_id)
      .in('appointment_status', ['requested', 'confirmed', 'rescheduled'])
  }

  await supabase.from('activity_logs').insert({
    actor_id: adminProfile.user_id,
    entity_type: 'repair',
    entity_id: parsed.data.ticket_id,
    action: 'repair_updated_by_admin',
    description: `Admin updated repair ${parsed.data.ticket_id} (status: ${parsed.data.status}, priority: ${parsed.data.priority}).`,
  })

  revalidateAdminPaths()
  return { success: true, message: `Updated repair ticket ${parsed.data.ticket_id}.` }
}

export async function adminUpdateAppointmentAction(input: {
  appointment_id: string
  appointment_status: AppointmentStatus
  scheduled_date: string
  time_slot: TimeSlot
  remarks?: string
}): Promise<AdminActionResult> {
  const adminProfile = await requireRole('admin')
  const supabase = await createClient()

  const { data: apt, error: fetchErr } = await supabase
    .from('appointments')
    .select('appointment_id, ticket_id')
    .eq('appointment_id', input.appointment_id)
    .single()

  if (fetchErr || !apt) return { success: false, error: 'Appointment not found.' }

  const { error } = await supabase
    .from('appointments')
    .update({
      appointment_status: input.appointment_status,
      scheduled_date: input.scheduled_date,
      time_slot: input.time_slot,
      remarks: input.remarks || null,
    })
    .eq('appointment_id', input.appointment_id)

  if (error) return { success: false, error: error.message }

  await supabase
    .from('repair')
    .update({ scheduled_date: input.scheduled_date })
    .eq('ticket_id', apt.ticket_id)

  await supabase.from('activity_logs').insert({
    actor_id: adminProfile.user_id,
    entity_type: 'appointment',
    entity_id: input.appointment_id,
    action: `appointment_${input.appointment_status}_by_admin`,
    description: `Admin updated appointment ${input.appointment_id} to ${input.appointment_status} (${input.scheduled_date} · ${input.time_slot}).`,
  })

  revalidateAdminPaths()
  return { success: true, message: `Appointment ${input.appointment_id} updated.` }
}

export async function adminVerifyPaymentAction(
  ticketId: string,
  paymentId: string,
  remarks?: string
): Promise<AdminActionResult> {
  await requireRole('admin')
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('rpc_record_and_verify_payment', {
    p_ticket_id: ticketId,
    p_payment_id: paymentId,
    p_payment_method: null,
    p_amount_php: null,
    p_installment_no: null,
    p_reference_no: null,
    p_remarks: remarks || null,
    p_verify_immediately: true,
  })

  if (error) return { success: false, error: error.message }

  const row = Array.isArray(data) ? data[0] : data
  revalidateAdminPaths()
  return {
    success: true,
    message:
      row?.repair_status === 'completed'
        ? `Payment ${paymentId} verified and ticket ${ticketId} marked Completed!`
        : `Payment ${paymentId} verified.`,
  }
}

export async function adminRecordPaymentAction(
  input: AdminRecordPaymentInput
): Promise<AdminActionResult> {
  await requireRole('admin')
  const parsed = adminRecordPaymentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid payment data.' }
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
    p_verify_immediately: parsed.data.verify_immediately,
  })

  if (error) return { success: false, error: error.message }

  revalidateAdminPaths()
  return { success: true, message: `Recorded payment for ${parsed.data.ticket_id}.` }
}

export async function adminCancelPaymentAction(
  paymentId: string,
  remarks?: string
): Promise<AdminActionResult> {
  const adminProfile = await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase
    .from('payments')
    .update({
      payment_status: 'cancelled',
      remarks: remarks || 'Cancelled by administrator',
    })
    .eq('payment_id', paymentId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_logs').insert({
    actor_id: adminProfile.user_id,
    entity_type: 'payment',
    entity_id: paymentId,
    action: 'payment_cancelled',
    description: `Admin cancelled payment ${paymentId}.`,
  })

  revalidateAdminPaths()
  return { success: true, message: `Payment ${paymentId} cancelled.` }
}

export async function updateAdminProfileAction(
  input: AdminProfileInput
): Promise<AdminActionResult> {
  const profile = await requireRole('admin')
  const parsed = adminProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid profile data.' }
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

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'user',
    entity_id: profile.user_id,
    action: 'admin_profile_updated',
    description: `Administrator updated profile and primary managed branch (${parsed.data.branch_location}).`,
  })

  revalidateAdminPaths()
  return { success: true, message: 'Administrator profile saved.' }
}
