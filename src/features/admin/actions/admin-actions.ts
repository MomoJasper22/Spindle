'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  hasAdminPermission,
  isFullAdmin,
  requireAdminFeature,
  requireRole,
} from '@/lib/auth/session'
import {
  USER_TYPE_IDS,
  getDefaultApplianceIcon,
  type AdminFeatureKey,
  type RegistrationStatus,
} from '@/lib/constants'
import { normalizePHPhone } from '@/lib/formatters'
import {
  adminApplianceSchema,
  adminAssignTechSchema,
  adminCreateRepairSchema,
  adminCreateUserSchema,
  adminProfileSchema,
  adminRecordPaymentSchema,
  adminTechProfileSchema,
  adminUpdateAppointmentSchema,
  adminUpdateRepairSchema,
  adminUpdateUserSchema,
  type AdminApplianceInput,
  type AdminAssignTechInput,
  type AdminCreateRepairInput,
  type AdminCreateUserInput,
  type AdminProfileInput,
  type AdminRecordPaymentInput,
  type AdminTechProfileInput,
  type AdminUpdateAppointmentInput,
  type AdminUpdateRepairInput,
  type AdminUpdateUserInput,
} from '../schemas/admin-schemas'

export type AdminActionResult =
  | { success: true; message: string }
  | { success: false; error: string }

function revalidateAdminPaths() {
  updateTag('user-profile')
  updateTag('admin-users')
  updateTag('admin-tech-profiles')
  updateTag('admin-repairs')
  updateTag('admin-appointments')
  updateTag('admin-payments')
  updateTag('admin-appliances')
  updateTag('admin-status-logs')
  updateTag('admin-activity')
  updateTag('technician-repairs')
  updateTag('technician-appointments')
  updateTag('technician-payments')
  updateTag('technician-activity')
  updateTag('customer-appliances')
  updateTag('customer-repairs')
  updateTag('customer-appointments')
  updateTag('customer-payments')
  updateTag('customer-activity')
  revalidatePath('/admin', 'layout')
  revalidatePath('/technician', 'layout')
  revalidatePath('/customer', 'layout')
}

function validateAdminPermissionsInput(
  actingAdmin: { role: 'customer' | 'technician' | 'admin'; admin_permissions: AdminFeatureKey[] | null },
  targetRole: string,
  requestedPermissions: AdminFeatureKey[] | null | undefined
): { ok: true; value: AdminFeatureKey[] | null } | { ok: false; error: string } {
  if (targetRole !== 'admin') {
    return { ok: true, value: null }
  }

  if (requestedPermissions === null || requestedPermissions === undefined) {
    if (!isFullAdmin(actingAdmin)) {
      return {
        ok: false,
        error: 'Only full-access administrators can grant unrestricted admin access.',
      }
    }
    return { ok: true, value: null }
  }

  if (requestedPermissions.length === 0) {
    return {
      ok: false,
      error: 'Select at least one admin feature when assigning limited admin access.',
    }
  }

  const deduped = Array.from(new Set(requestedPermissions))
  if (!isFullAdmin(actingAdmin)) {
    const disallowed = deduped.filter((perm) => !hasAdminPermission(actingAdmin, perm))
    if (disallowed.length > 0) {
      return {
        ok: false,
        error: 'You cannot grant admin features that your own account does not have access to.',
      }
    }
  }

  return { ok: true, value: deduped }
}

export async function adminCreateUserAction(
  input: AdminCreateUserInput
): Promise<AdminActionResult> {
  const adminProfile = await requireAdminFeature('users')
  const parsed = adminCreateUserSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid user details.' }
  }

  const permCheck = validateAdminPermissionsInput(
    adminProfile,
    parsed.data.role,
    parsed.data.admin_permissions
  )
  if (!permCheck.ok) {
    return { success: false, error: permCheck.error }
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

  // Newly created technicians complete onboarding (credentials, nickname, profile photo) on first login.
  const initialOnboarded = parsed.data.role !== 'technician'

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
      admin_permissions: permCheck.value,
      address_street: parsed.data.address_street,
      address_barangay: parsed.data.address_barangay,
      address_city: parsed.data.address_city,
      address_province: parsed.data.address_province,
      address_zip_code: parsed.data.address_zip_code,
      is_onboarded: initialOnboarded,
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
  const adminProfile = await requireAdminFeature('users')
  const parsed = adminUpdateUserSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid user fields.' }
  }

  const isSelf = parsed.data.user_id === adminProfile.user_id

  if (isSelf && !parsed.data.is_active) {
    return { success: false, error: 'You cannot deactivate your own active administrator session.' }
  }

  if (isSelf && parsed.data.role !== 'admin') {
    return { success: false, error: 'You cannot change your own administrator role.' }
  }

  const permCheck = isSelf
    ? { ok: true as const, value: adminProfile.admin_permissions }
    : validateAdminPermissionsInput(
        adminProfile,
        parsed.data.role,
        parsed.data.admin_permissions
      )

  if (!permCheck.ok) {
    return { success: false, error: permCheck.error }
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
      admin_permissions: permCheck.value,
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
  if (
    !hasAdminPermission(adminProfile, 'users') &&
    !hasAdminPermission(adminProfile, 'technicians')
  ) {
    return { success: false, error: 'You do not have permission to change account activation.' }
  }

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
  const adminProfile = await requireAdminFeature('users')
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
  const adminProfile = await requireAdminFeature('technicians')
  const parsed = adminTechProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid technician fields.' }
  }

  const supabase = await createClient()

  const { data: existingTp } = await supabase
    .from('technician_profiles')
    .select('availability_status')
    .eq('technician_id', parsed.data.technician_id)
    .maybeSingle()

  const { error: userErr } = await supabase
    .from('users')
    .update({ branch_location: parsed.data.branch_location })
    .eq('user_id', parsed.data.technician_id)

  if (userErr) return { success: false, error: userErr.message }

  const { error: tpErr } = await supabase.from('technician_profiles').upsert(
    {
      technician_id: parsed.data.technician_id,
      specializations: parsed.data.specializations,
      proposed_specializations: [],
      certification_no: parsed.data.certification_no,
      availability_status: parsed.data.availability_status,
      max_daily_jobs: parsed.data.max_daily_jobs,
    },
    { onConflict: 'technician_id' }
  )

  if (tpErr) return { success: false, error: tpErr.message }

  if (existingTp?.availability_status !== parsed.data.availability_status) {
    await supabase.from('technician_status_logs').insert({
      technician_id: parsed.data.technician_id,
      previous_status: existingTp?.availability_status ?? null,
      new_status: parsed.data.availability_status,
      changed_by: adminProfile.user_id,
    })
  }

  await supabase.from('activity_logs').insert({
    actor_id: adminProfile.user_id,
    entity_type: 'technician',
    entity_id: parsed.data.technician_id,
    action: 'technician_updated_by_admin',
    description: `Admin updated technician ${parsed.data.technician_id} (${parsed.data.branch_location}, ${parsed.data.availability_status}, max ${parsed.data.max_daily_jobs}/day).`,
  })

  revalidateAdminPaths()
  return { success: true, message: 'Technician profile updated.' }
}

export async function adminAssignTechnicianAction(
  input: AdminAssignTechInput
): Promise<AdminActionResult> {
  const profile = await requireRole('admin')
  if (
    !hasAdminPermission(profile, 'technicians') &&
    !hasAdminPermission(profile, 'appointments')
  ) {
    return { success: false, error: 'You do not have permission to assign technicians.' }
  }

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
  const adminProfile = await requireAdminFeature('appliances')
  const parsed = adminApplianceSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid appliance fields.' }
  }

  const supabase = await createClient()
  const basePayload = {
    customer_id: parsed.data.customer_id,
    brand: parsed.data.brand,
    category: parsed.data.category,
    model_number: parsed.data.model_number,
    serial_number: parsed.data.serial_number.toUpperCase(),
    purchase_date: parsed.data.purchase_date || null,
    registration_status: parsed.data.registration_status,
    notes: parsed.data.notes || null,
  }
  const resolvedIcon = parsed.data.icon ?? getDefaultApplianceIcon(parsed.data.category)

  if (applianceId) {
    let { error } = await supabase
      .from('customer_appliances')
      .update({ ...basePayload, icon: resolvedIcon })
      .eq('appliance_id', applianceId)

    if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes("'icon'"))) {
      ;({ error } = await supabase
        .from('customer_appliances')
        .update(basePayload)
        .eq('appliance_id', applianceId))
    }

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'An appliance with this serial number already exists.' }
      }
      return { success: false, error: error.message }
    }

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

  let { data: created, error } = await supabase
    .from('customer_appliances')
    .insert({ ...basePayload, icon: resolvedIcon })
    .select('appliance_id')
    .single()

  if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes("'icon'"))) {
    ;({ data: created, error } = await supabase
      .from('customer_appliances')
      .insert(basePayload)
      .select('appliance_id')
      .single())
  }

  if (error || !created) {
    if (error?.code === '23505') {
      return { success: false, error: 'An appliance with this serial number already exists.' }
    }
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
  const adminProfile = await requireAdminFeature('appliances')
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
  const adminProfile = await requireAdminFeature('appliances')
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
  await requireAdminFeature('repairs')
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
  const adminProfile = await requireAdminFeature('repairs')
  const parsed = adminUpdateRepairSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid repair update.' }
  }

  const supabase = await createClient()
  const { data: existingRepair } = await supabase
    .from('v_repair_details')
    .select('completed_at, verified_paid_php')
    .eq('ticket_id', parsed.data.ticket_id)
    .maybeSingle()

  const verifiedPaidPhp = Number(existingRepair?.verified_paid_php ?? 0)
  const finalCostPhp = parsed.data.final_cost_php
  const autoCompletedFromDeposit =
    parsed.data.status === 'awaiting_payment' &&
    finalCostPhp !== null &&
    finalCostPhp > 0 &&
    verifiedPaidPhp >= finalCostPhp

  const resolvedStatus = autoCompletedFromDeposit ? 'completed' : parsed.data.status

  const { error } = await supabase
    .from('repair')
    .update({
      status: resolvedStatus,
      priority: parsed.data.priority,
      diagnostic_notes: parsed.data.diagnostic_notes || null,
      estimated_cost_php: parsed.data.estimated_cost_php,
      final_cost_php: finalCostPhp,
      completed_at:
        resolvedStatus === 'completed'
          ? (existingRepair?.completed_at ?? new Date().toISOString())
          : null,
    })
    .eq('ticket_id', parsed.data.ticket_id)

  if (error) return { success: false, error: error.message }

  if (resolvedStatus === 'cancelled') {
    await supabase
      .from('appointments')
      .update({ appointment_status: 'cancelled' })
      .eq('ticket_id', parsed.data.ticket_id)
  } else if (resolvedStatus === 'completed') {
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
    description: `Admin updated repair ${parsed.data.ticket_id} (status: ${resolvedStatus}, priority: ${parsed.data.priority}).`,
  })

  revalidateAdminPaths()
  return {
    success: true,
    message: autoCompletedFromDeposit
      ? `Final cost is already settled by verified payments — ticket ${parsed.data.ticket_id} marked Completed!`
      : `Updated repair ticket ${parsed.data.ticket_id}.`,
  }
}

export async function adminUpdateAppointmentAction(
  input: AdminUpdateAppointmentInput
): Promise<AdminActionResult> {
  const adminProfile = await requireAdminFeature('appointments')
  const parsed = adminUpdateAppointmentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid appointment update.' }
  }

  const supabase = await createClient()

  const { data: apt, error: fetchErr } = await supabase
    .from('appointments')
    .select('appointment_id, ticket_id, technician_id, scheduled_date, time_slot')
    .eq('appointment_id', parsed.data.appointment_id)
    .single()

  if (fetchErr || !apt) return { success: false, error: 'Appointment not found.' }

  if (
    apt.technician_id &&
    !['cancelled', 'completed'].includes(parsed.data.appointment_status) &&
    (apt.scheduled_date !== parsed.data.scheduled_date || apt.time_slot !== parsed.data.time_slot)
  ) {
    const { count: conflictCount } = await supabase
      .from('appointments')
      .select('appointment_id', { count: 'exact', head: true })
      .eq('technician_id', apt.technician_id)
      .eq('scheduled_date', parsed.data.scheduled_date)
      .eq('time_slot', parsed.data.time_slot)
      .not('appointment_status', 'in', '(cancelled,completed)')
      .neq('appointment_id', apt.appointment_id)

    if ((conflictCount ?? 0) > 0) {
      return {
        success: false,
        error: 'Double-booking conflict: assigned technician already has another appointment in that time slot.',
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
    .eq('appointment_id', parsed.data.appointment_id)

  if (error) return { success: false, error: error.message }

  await supabase
    .from('repair')
    .update({ scheduled_date: parsed.data.scheduled_date })
    .eq('ticket_id', apt.ticket_id)

  await supabase.from('activity_logs').insert({
    actor_id: adminProfile.user_id,
    entity_type: 'appointment',
    entity_id: parsed.data.appointment_id,
    action: `appointment_${parsed.data.appointment_status}_by_admin`,
    description: `Admin updated appointment ${parsed.data.appointment_id} to ${parsed.data.appointment_status} (${parsed.data.scheduled_date} · ${parsed.data.time_slot}).`,
  })

  revalidateAdminPaths()
  return { success: true, message: `Appointment ${parsed.data.appointment_id} updated.` }
}

export async function adminVerifyPaymentAction(
  ticketId: string,
  paymentId: string,
  remarks?: string
): Promise<AdminActionResult> {
  await requireAdminFeature('payments')
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
  await requireAdminFeature('payments')
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
  const adminProfile = await requireAdminFeature('payments')
  const supabase = await createClient()

  const { data: existingPayment } = await supabase
    .from('payments')
    .select('payment_id, ticket_id, payment_status')
    .eq('payment_id', paymentId)
    .maybeSingle()

  if (!existingPayment) {
    return { success: false, error: `Payment ${paymentId} not found.` }
  }

  if (existingPayment.payment_status === 'cancelled') {
    return { success: false, error: `Payment ${paymentId} is already cancelled.` }
  }

  const { error } = await supabase
    .from('payments')
    .update({
      payment_status: 'cancelled',
      remarks: remarks || 'Cancelled by administrator',
    })
    .eq('payment_id', paymentId)
    .neq('payment_status', 'cancelled')

  if (error) return { success: false, error: error.message }

  // If a verified payment was cancelled on a completed ticket, reopen it to awaiting_payment if balance is no longer settled
  if (existingPayment.payment_status === 'verified') {
    const { data: repairView } = await supabase
      .from('v_repair_details')
      .select('status, final_cost_php, verified_paid_php')
      .eq('ticket_id', existingPayment.ticket_id)
      .maybeSingle()

    if (
      repairView &&
      repairView.status === 'completed' &&
      repairView.final_cost_php !== null &&
      Number(repairView.final_cost_php) > 0 &&
      Number(repairView.verified_paid_php ?? 0) < Number(repairView.final_cost_php)
    ) {
      await supabase
        .from('repair')
        .update({ status: 'awaiting_payment', completed_at: null })
        .eq('ticket_id', existingPayment.ticket_id)
    }
  }

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

  if (!isFullAdmin(profile)) {
    return {
      success: false,
      error: 'Limited administrators can only update their profile photo and password.',
    }
  }

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
