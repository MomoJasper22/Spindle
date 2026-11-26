'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuthenticatedUser } from '@/lib/auth/session'
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from '@/features/auth/schemas/auth-schemas'

export type PasswordActionResult =
  | { success: true; message: string }
  | { success: false; error: string }

export async function changePasswordAction(
  input: ChangePasswordInput
): Promise<PasswordActionResult> {
  const profile = await requireAuthenticatedUser()
  const parsed = changePasswordSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid password input.',
    }
  }

  const supabase = await createClient()

  // Verify current password before changing credentials
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: parsed.data.current_password,
  })

  if (verifyError) {
    return {
      success: false,
      error: 'Current password is incorrect.',
    }
  }

  const { error: updateAuthError } = await supabase.auth.updateUser({
    password: parsed.data.new_password,
  })

  if (updateAuthError) {
    return {
      success: false,
      error: updateAuthError.message || 'Unable to update password.',
    }
  }

  const admin = createAdminClient()
  const { data: hashedPassword, error: hashError } = await admin.rpc('hash_password_bcrypt', {
    raw_password: parsed.data.new_password,
  })

  if (!hashError && typeof hashedPassword === 'string') {
    await admin
      .from('users')
      .update({ password: hashedPassword })
      .eq('user_id', profile.user_id)
  }

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'user',
    entity_id: profile.user_id,
    action: 'password_changed',
    description: `${profile.first_name} ${profile.last_name} updated account password.`,
  })

  return {
    success: true,
    message: 'Your password has been updated.',
  }
}
