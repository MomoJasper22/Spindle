'use server'

import crypto from 'node:crypto'
import { headers } from 'next/headers'
import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/session'
import { getManilaTodayISO, normalizePHPhone } from '@/lib/formatters'
import {
  getDefaultApplianceIcon,
  getServiceBookingFeePhp,
  getServiceFullPricePhp,
} from '@/lib/constants'
import { getTicketPaymentSummary } from '@/lib/payments'
import {
  createPayMongoCheckoutSession,
  retrievePayMongoCheckoutSession,
} from '@/lib/paymongo'
import { finalizePayMongoCheckoutSession } from '@/lib/paymongo-checkout'
import type { RepairDetailView } from '@/types/database'
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

export type ActionResult<T = void> =
  | { success: true; message: string; data?: T }
  | { success: false; error: string }

function revalidateCustomerApplianceTags(customerId: string) {
  updateTag(`customer-appliances:${customerId}`)
  updateTag(`customer-activity:${customerId}`)
  updateTag('admin-appliances')
  updateTag('admin-activity')
}

function revalidateCustomerBookingTags(customerId: string, technicianId?: string | null) {
  updateTag(`customer-repairs:${customerId}`)
  updateTag(`customer-appointments:${customerId}`)
  updateTag(`customer-activity:${customerId}`)
  if (technicianId) {
    updateTag(`technician-repairs:${technicianId}`)
    updateTag(`technician-appointments:${technicianId}`)
    updateTag(`technician-activity:${technicianId}`)
  }
  updateTag('admin-repairs')
  updateTag('admin-appointments')
  updateTag('admin-activity')
}

export async function createApplianceAction(input: ApplianceInput): Promise<ActionResult> {
  const profile = await requireRole('customer')
  const parsed = applianceSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Please check the appliance details.' }
  }

  const supabase = await createClient()
  const basePayload = {
    customer_id: profile.user_id,
    brand: parsed.data.brand,
    category: parsed.data.category,
    model_number: parsed.data.model_number,
    serial_number: parsed.data.serial_number.toUpperCase(),
    purchase_date: parsed.data.purchase_date || null,
    notes: parsed.data.notes || null,
    registration_status: 'pending_verification',
  }
  const resolvedIcon = parsed.data.icon ?? getDefaultApplianceIcon(parsed.data.category)

  let { data: inserted, error } = await supabase
    .from('customer_appliances')
    .insert({ ...basePayload, icon: resolvedIcon })
    .select('appliance_id')
    .single()

  // Graceful fallback if migration 006 (icon column) has not been applied yet
  if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes("'icon'"))) {
    ;({ data: inserted, error } = await supabase
      .from('customer_appliances')
      .insert(basePayload)
      .select('appliance_id')
      .single())
  }

  if (error || !inserted) {
    if (error?.code === '23505') {
      return {
        success: false,
        error: 'An appliance with this serial number is already saved on your account.',
      }
    }
    return { success: false, error: error?.message ?? 'Could not save appliance.' }
  }

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'appliance',
    entity_id: inserted.appliance_id,
    action: 'appliance_registered',
    description: `Added ${parsed.data.brand} ${parsed.data.category} (${parsed.data.model_number}).`,
  })

  revalidateCustomerApplianceTags(profile.user_id)
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
  const basePayload = {
    brand: parsed.data.brand,
    category: parsed.data.category,
    model_number: parsed.data.model_number,
    serial_number: parsed.data.serial_number.toUpperCase(),
    purchase_date: parsed.data.purchase_date || null,
    notes: parsed.data.notes || null,
  }
  const resolvedIcon = parsed.data.icon ?? getDefaultApplianceIcon(parsed.data.category)

  let { error } = await supabase
    .from('customer_appliances')
    .update({ ...basePayload, icon: resolvedIcon })
    .eq('appliance_id', applianceId)
    .eq('customer_id', profile.user_id)

  if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes("'icon'"))) {
    ;({ error } = await supabase
      .from('customer_appliances')
      .update(basePayload)
      .eq('appliance_id', applianceId)
      .eq('customer_id', profile.user_id))
  }

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

  revalidateCustomerApplianceTags(profile.user_id)
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

    revalidateCustomerApplianceTags(profile.user_id)
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

  revalidateCustomerApplianceTags(profile.user_id)
  return { success: true, message: 'Appliance marked as inactive.' }
}

export async function createBookingCheckoutAction(
  input: RepairBookingInput
): Promise<ActionResult<{ checkoutUrl: string; sessionId: string; amountPhp: number }>> {
  const profile = await requireRole('customer')
  const parsed = repairBookingSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Please check your booking details.' }
  }

  if (parsed.data.scheduled_date < getManilaTodayISO()) {
    return { success: false, error: 'Please choose today or an upcoming date for your visit.' }
  }

  const supabase = await createClient()
  const { data: appliance, error: appErr } = await supabase
    .from('customer_appliances')
    .select('appliance_id, brand, category, model_number, registration_status')
    .eq('appliance_id', parsed.data.appliance_id)
    .eq('customer_id', profile.user_id)
    .maybeSingle()

  if (appErr || !appliance) {
    return { success: false, error: 'Please select one of your saved appliances.' }
  }

  if (appliance.registration_status === 'cancelled') {
    return { success: false, error: 'Inactive appliances cannot be booked for a home visit.' }
  }

  const paymentMode = parsed.data.payment_mode
  const downPaymentPhp = getServiceBookingFeePhp(parsed.data.service_type)
  const fullPricePhp = getServiceFullPricePhp(parsed.data.service_type)
  const amountPhp = paymentMode === 'full_payment' ? fullPricePhp : downPaymentPhp
  const admin = createAdminClient()

  // Prevent accidental double checkout/payment for an identical pending booking request
  const { data: openSessions } = await admin
    .from('payment_checkout_sessions')
    .select('session_id, payment_mode, paymongo_checkout_id, checkout_url, created_at')
    .eq('customer_id', profile.user_id)
    .eq('session_kind', 'booking_deposit')
    .eq('status', 'awaiting_payment')
    .eq('appliance_id', parsed.data.appliance_id)
    .eq('service_type', parsed.data.service_type)
    .eq('scheduled_date', parsed.data.scheduled_date)
    .eq('time_slot', parsed.data.time_slot)
    .order('created_at', { ascending: false })

  for (const existingOpen of openSessions ?? []) {
    try {
      const existingPm = await retrievePayMongoCheckoutSession(existingOpen.paymongo_checkout_id)
      if (existingPm.paidPayment || existingPm.paymentIntentStatus === 'succeeded') {
        await finalizePayMongoCheckoutSession({
          sessionId: existingOpen.session_id,
          expectedCustomerId: profile.user_id,
        })
        return {
          success: false,
          error: 'Your payment for this home visit was already completed and your booking has been placed!',
        }
      }
      if (
        existingPm.status === 'active' &&
        existingOpen.payment_mode === paymentMode &&
        existingOpen.checkout_url
      ) {
        return {
          success: true,
          message: 'Resuming your open PayMongo checkout session.',
          data: {
            checkoutUrl: existingOpen.checkout_url,
            sessionId: existingOpen.session_id,
            amountPhp,
          },
        }
      }
      // Customer switched between Down Payment and Pay in Full: retire old unpaid checkout session
      await admin
        .from('payment_checkout_sessions')
        .update({ status: 'cancelled' })
        .eq('session_id', existingOpen.session_id)
    } catch {
      // If existing session is expired or unreadable, expire it and create a fresh one
      await admin
        .from('payment_checkout_sessions')
        .update({ status: 'expired' })
        .eq('session_id', existingOpen.session_id)
    }
  }

  const sessionId = generateCheckoutSessionId()
  const origin = await getRequestOrigin()
  const successUrl = `${origin}/api/paymongo/callback?session_id=${encodeURIComponent(sessionId)}`
  const cancelUrl = `${origin}/customer/bookings?payment_cancelled=1`

  const checkoutDescription =
    paymentMode === 'full_payment'
      ? `Full upfront service payment (${parsed.data.scheduled_date}, ${parsed.data.time_slot}).`
      : `Down payment (${parsed.data.scheduled_date}, ${parsed.data.time_slot}) — remaining balance due in full after repair.`

  try {
    const pmSession = await createPayMongoCheckoutSession({
      amountPhp,
      lineItemName: `Spindle Home Visit — ${appliance.brand} ${appliance.category}`,
      description: checkoutDescription,
      referenceNumber: sessionId,
      successUrl,
      cancelUrl,
      customerName: `${profile.first_name} ${profile.last_name}`.trim(),
      customerEmail: profile.email,
      customerPhone: profile.phone ?? undefined,
      metadata: {
        spindle_session_id: sessionId,
        spindle_kind: 'booking_deposit',
        payment_mode: paymentMode,
        customer_id: profile.user_id,
      },
    })

    const { error: insertErr } = await admin.from('payment_checkout_sessions').insert({
      session_id: sessionId,
      session_kind: 'booking_deposit',
      customer_id: profile.user_id,
      appliance_id: parsed.data.appliance_id,
      service_type: parsed.data.service_type,
      priority: 'normal',
      payment_mode: paymentMode,
      estimated_service_cost_php: fullPricePhp,
      issue_description: parsed.data.issue_description,
      scheduled_date: parsed.data.scheduled_date,
      time_slot: parsed.data.time_slot,
      service_address: parsed.data.service_address,
      remarks: parsed.data.remarks || null,
      amount_php: amountPhp,
      paymongo_checkout_id: pmSession.id,
      checkout_url: pmSession.checkoutUrl,
      status: 'awaiting_payment',
    })

    if (insertErr) {
      return { success: false, error: insertErr.message }
    }

    return {
      success: true,
      message: 'Checkout ready. Redirecting to PayMongo...',
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

export async function rescheduleAppointmentAction(
  input: RescheduleAppointmentInput
): Promise<ActionResult> {
  const profile = await requireRole('customer')
  const parsed = rescheduleAppointmentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Please choose a valid date and window.' }
  }

  if (parsed.data.scheduled_date < getManilaTodayISO()) {
    return { success: false, error: 'Please choose today or an upcoming date.' }
  }

  const supabase = await createClient()
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('appointment_id, ticket_id, technician_id, appointment_status')
    .eq('appointment_id', parsed.data.appointment_id)
    .eq('customer_id', profile.user_id)
    .single()

  if (fetchError || !appointment) {
    return { success: false, error: 'We could not find that visit.' }
  }

  if (['completed', 'cancelled'].includes(appointment.appointment_status)) {
    return { success: false, error: 'Finished or cancelled visits cannot be moved.' }
  }

  if (appointment.technician_id) {
    const { count: conflictCount } = await supabase
      .from('appointments')
      .select('appointment_id', { count: 'exact', head: true })
      .eq('technician_id', appointment.technician_id)
      .eq('scheduled_date', parsed.data.scheduled_date)
      .eq('time_slot', parsed.data.time_slot)
      .not('appointment_status', 'in', '(cancelled,completed)')
      .neq('appointment_id', appointment.appointment_id)

    if ((conflictCount ?? 0) > 0) {
      return {
        success: false,
        error: 'That time window is already taken for your assigned technician. Please choose another window or date.',
      }
    }
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

  revalidateCustomerBookingTags(profile.user_id, appointment.technician_id)
  return { success: true, message: 'Visit schedule updated.' }
}

export async function cancelRepairTicketAction(ticketId: string): Promise<ActionResult> {
  const profile = await requireRole('customer')
  const supabase = await createClient()

  const { data: repair, error: fetchError } = await supabase
    .from('repair')
    .select('ticket_id, status, technician_id')
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

  revalidateCustomerBookingTags(profile.user_id, repair.technician_id)
  return { success: true, message: 'Your booking has been cancelled.' }
}

export async function createTicketPaymentCheckoutAction(
  input: CustomerPaymentInput
): Promise<ActionResult<{ checkoutUrl: string; sessionId: string }>> {
  const profile = await requireRole('customer')
  const parsed = customerPaymentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Please check your payment details.' }
  }

  const supabase = await createClient()
  const { data: repairRow, error: repairErr } = await supabase
    .from('v_repair_details')
    .select('*')
    .eq('ticket_id', parsed.data.ticket_id)
    .eq('customer_id', profile.user_id)
    .maybeSingle()

  if (repairErr || !repairRow) {
    return { success: false, error: 'We could not find that booking.' }
  }

  const repair = repairRow as RepairDetailView
  const summary = getTicketPaymentSummary(repair)

  if (repair.status === 'cancelled' || repair.status === 'completed') {
    return { success: false, error: 'This booking is already completed or cancelled.' }
  }

  if (!summary.hasFinalBill) {
    return {
      success: false,
      error: 'Your technician has not posted the final service bill yet.',
    }
  }

  if (summary.payableRemaining <= 0) {
    return {
      success: false,
      error: summary.isCoveredByPending
        ? 'Your remaining balance is already covered by a payment being verified.'
        : 'This booking is already paid in full.',
    }
  }

  if (parsed.data.amount_php > summary.payableRemaining) {
    return {
      success: false,
      error: `Payment amount exceeds your remaining unpaid balance of PHP ${summary.payableRemaining.toFixed(2)}.`,
    }
  }

  const admin = createAdminClient()

  // Check if an open PayMongo checkout session already exists for this ticket to avoid double charging
  const { data: openSessions } = await admin
    .from('payment_checkout_sessions')
    .select('session_id, amount_php, paymongo_checkout_id, checkout_url')
    .eq('customer_id', profile.user_id)
    .eq('ticket_id', repair.ticket_id)
    .eq('session_kind', 'ticket_balance')
    .eq('status', 'awaiting_payment')
    .order('created_at', { ascending: false })

  for (const openSession of openSessions ?? []) {
    try {
      const pmCheck = await retrievePayMongoCheckoutSession(openSession.paymongo_checkout_id)
      if (pmCheck.paidPayment || pmCheck.paymentIntentStatus === 'succeeded') {
        await finalizePayMongoCheckoutSession({
          sessionId: openSession.session_id,
          expectedCustomerId: profile.user_id,
        })
        return {
          success: false,
          error: 'A completed PayMongo payment was found for this booking and has now been applied!',
        }
      }
      if (
        pmCheck.status === 'active' &&
        Math.abs(Number(openSession.amount_php) - parsed.data.amount_php) < 0.01 &&
        openSession.checkout_url
      ) {
        return {
          success: true,
          message: 'Resuming your active PayMongo checkout session.',
          data: {
            checkoutUrl: openSession.checkout_url,
            sessionId: openSession.session_id,
          },
        }
      }
      await admin
        .from('payment_checkout_sessions')
        .update({ status: 'cancelled' })
        .eq('session_id', openSession.session_id)
    } catch {
      await admin
        .from('payment_checkout_sessions')
        .update({ status: 'expired' })
        .eq('session_id', openSession.session_id)
    }
  }

  const sessionId = generateCheckoutSessionId()
  const origin = await getRequestOrigin()
  const successUrl = `${origin}/api/paymongo/callback?session_id=${encodeURIComponent(sessionId)}`
  const cancelUrl = `${origin}/customer/payments?payment_cancelled=1&ticket=${encodeURIComponent(repair.ticket_id)}`

  try {
    const pmSession = await createPayMongoCheckoutSession({
      amountPhp: parsed.data.amount_php,
      lineItemName: `${repair.appliance_brand} ${repair.appliance_category} (${repair.ticket_id})`,
      description: `Service balance payment for ${repair.ticket_id}`,
      referenceNumber: `${repair.ticket_id}-${sessionId}`,
      successUrl,
      cancelUrl,
      customerName: `${profile.first_name} ${profile.last_name}`.trim(),
      customerEmail: profile.email,
      customerPhone: profile.phone ?? undefined,
      metadata: {
        spindle_session_id: sessionId,
        spindle_kind: 'ticket_balance',
        ticket_id: repair.ticket_id,
        customer_id: profile.user_id,
      },
    })

    const { error: insertErr } = await admin.from('payment_checkout_sessions').insert({
      session_id: sessionId,
      session_kind: 'ticket_balance',
      customer_id: profile.user_id,
      ticket_id: repair.ticket_id,
      amount_php: parsed.data.amount_php,
      remarks: parsed.data.remarks || null,
      paymongo_checkout_id: pmSession.id,
      checkout_url: pmSession.checkoutUrl,
      status: 'awaiting_payment',
    })

    if (insertErr) {
      return { success: false, error: insertErr.message }
    }

    return {
      success: true,
      message: 'Checkout ready. Redirecting to PayMongo...',
      data: {
        checkoutUrl: pmSession.checkoutUrl,
        sessionId,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unable to start PayMongo checkout.',
    }
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

  updateTag(profile.auth_user_id ? `user-profile:${profile.auth_user_id}` : 'user-profile')
  updateTag(`customer-activity:${profile.user_id}`)
  updateTag('admin-users')
  updateTag('admin-activity')
  revalidatePath('/customer', 'layout')
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

  updateTag(profile.auth_user_id ? `user-profile:${profile.auth_user_id}` : 'user-profile')
  updateTag('admin-users')
  await supabase.auth.signOut()
  redirect('/login?error=account_inactive')
}
