'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRoleHomePath, requireAuthenticatedUser } from '@/lib/auth/session'
import { normalizePHPhone } from '@/lib/formatters'
import { onboardingSchema, type OnboardingInput } from '../schemas/onboarding-schemas'

export type OnboardingActionResult =
  | { success: true }
  | { success: false; error: string }

export async function completeOnboardingAction(
  input: OnboardingInput
): Promise<OnboardingActionResult> {
  const profile = await requireAuthenticatedUser({ allowUnonboarded: true })
  const parsed = onboardingSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Please check your onboarding details.',
    }
  }

  if (profile.role === 'technician') {
    if (!parsed.data.specializations || parsed.data.specializations.length === 0) {
      return {
        success: false,
        error: 'Select at least one appliance specialization.',
      }
    }
    if (!parsed.data.certification_no?.trim()) {
      return {
        success: false,
        error: 'Enter your TESDA or technical certification number.',
      }
    }
  }

  const supabase = await createClient()
  const normalizedPhone = normalizePHPhone(parsed.data.phone)

  const { error: updateUserError } = await supabase
    .from('users')
    .update({
      phone: normalizedPhone,
      branch_location: parsed.data.branch_location,
      address_street: parsed.data.address_street,
      address_barangay: parsed.data.address_barangay,
      address_city: parsed.data.address_city,
      address_province: parsed.data.address_province,
      address_zip_code: parsed.data.address_zip_code,
      is_onboarded: true,
    })
    .eq('user_id', profile.user_id)

  if (updateUserError) {
    return {
      success: false,
      error: updateUserError.message || 'Failed to save onboarding details.',
    }
  }

  if (profile.role === 'technician') {
    const { error: techError } = await supabase
      .from('technician_profiles')
      .upsert(
        {
          technician_id: profile.user_id,
          specializations: parsed.data.specializations ?? [],
          certification_no: parsed.data.certification_no?.trim() || null,
        },
        { onConflict: 'technician_id' }
      )

    if (techError) {
      return {
        success: false,
        error: techError.message || 'Failed to save technician credentials.',
      }
    }
  }

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'user',
    entity_id: profile.user_id,
    action: 'user_onboarded',
    description: `${profile.first_name} ${profile.last_name} completed workspace onboarding (${parsed.data.branch_location}).`,
  })

  redirect(getRoleHomePath(profile.role))
}
