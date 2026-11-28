'use server'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRoleHomePath, requireAuthenticatedUser } from '@/lib/auth/session'
import { normalizePHPhone } from '@/lib/formatters'
import { getOnboardingSchema, type OnboardingInput } from '../schemas/onboarding-schemas'

export type OnboardingActionResult =
  | { success: true }
  | { success: false; error: string }

export async function completeOnboardingAction(
  input: OnboardingInput
): Promise<OnboardingActionResult> {
  const profile = await requireAuthenticatedUser({ allowUnonboarded: true })
  const parsed = getOnboardingSchema(profile.role).safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Please check your onboarding details.',
    }
  }

  const supabase = await createClient()
  const normalizedPhone = normalizePHPhone(parsed.data.phone)

  // Persist technician credentials & proposed specializations BEFORE flipping is_onboarded = true
  // so the post-onboarding field-lock trigger allows initial credential submission.
  if (profile.role === 'technician') {
    const { data: existingTechProfile } = await supabase
      .from('technician_profiles')
      .select('tech_profile_id')
      .eq('technician_id', profile.user_id)
      .maybeSingle()

    const techPayload = {
      certification_no: parsed.data.certification_no?.trim() || null,
      proposed_specializations: parsed.data.proposed_specializations ?? [],
    }

    const { error: techError } = existingTechProfile
      ? await supabase
          .from('technician_profiles')
          .update(techPayload)
          .eq('technician_id', profile.user_id)
      : await supabase.from('technician_profiles').insert({
          technician_id: profile.user_id,
          ...techPayload,
        })

    if (techError) {
      return {
        success: false,
        error: techError.message || 'Failed to save technician credentials.',
      }
    }
  }

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
      ...(profile.role === 'technician' ? { nickname: parsed.data.nickname?.trim() || null } : {}),
      is_onboarded: true,
    })
    .eq('user_id', profile.user_id)

  if (updateUserError) {
    return {
      success: false,
      error: updateUserError.message || 'Failed to save onboarding details.',
    }
  }

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'user',
    entity_id: profile.user_id,
    action: 'user_onboarded',
    description: `${profile.first_name} ${profile.last_name} completed workspace onboarding (${parsed.data.branch_location}).`,
  })

  updateTag(profile.auth_user_id ? `user-profile:${profile.auth_user_id}` : 'user-profile')
  updateTag('admin-users')
  updateTag('admin-tech-profiles')
  redirect(getRoleHomePath(profile.role, profile))
}
