'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRoleHomePath } from '@/lib/auth/session'
import { USER_TYPE_IDS, type UserRole } from '@/lib/constants'
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from '../schemas/auth-schemas'

export type AuthActionResult =
  | { success: true }
  | { success: false; error: string }

export async function signInAction(input: LoginInput): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid login credentials.',
    }
  }

  const supabase = await createClient()
  const email = parsed.data.email.toLowerCase()

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  })

  if (authError || !authData.user) {
    return {
      success: false,
      error: 'Invalid email or password. Please verify your credentials and try again.',
    }
  }

  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('users')
    .select('user_id, is_onboarded, is_active, user_types(type_name)')
    .eq('auth_user_id', authData.user.id)
    .maybeSingle()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    return {
      success: false,
      error: 'We could not find your profile. Please reach out to Spindle support for help.',
    }
  }

  if (!profile.is_active) {
    await supabase.auth.signOut()
    return {
      success: false,
      error: 'This account is currently paused. Please reach out to Spindle support to reopen it.',
    }
  }

  const role = Array.isArray(profile.user_types)
    ? profile.user_types[0]?.type_name
    : (profile.user_types as { type_name?: UserRole } | null)?.type_name

  if (!profile.is_onboarded) {
    redirect('/onboarding')
  }

  redirect(getRoleHomePath(role ?? 'customer'))
}

export async function signUpAction(input: SignupInput): Promise<AuthActionResult> {
  const parsed = signupSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Please review the registration form fields.',
    }
  }

  const admin = createAdminClient()
  const email = parsed.data.email.toLowerCase()

  const { data: existingUser } = await admin
    .from('users')
    .select('user_id')
    .eq('email', email)
    .maybeSingle()

  if (existingUser) {
    return {
      success: false,
      error: 'An account with this email address already exists. Sign in instead.',
    }
  }

  const { data: createdAuth, error: createAuthError } = await admin.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
    },
  })

  if (createAuthError || !createdAuth.user) {
    return {
      success: false,
      error: createAuthError?.message ?? 'Unable to create authentication account. Please try again.',
    }
  }

  const authUserId = createdAuth.user.id

  const { data: hashedPassword, error: hashError } = await admin.rpc('hash_password_bcrypt', {
    raw_password: parsed.data.password,
  })

  if (hashError || typeof hashedPassword !== 'string') {
    await admin.auth.admin.deleteUser(authUserId)
    return {
      success: false,
      error: 'Account security initialization failed. Please try again shortly.',
    }
  }

  const { data: insertedUser, error: insertError } = await admin
    .from('users')
    .insert({
      auth_user_id: authUserId,
      first_name: parsed.data.first_name,
      middle_name: parsed.data.middle_name || null,
      last_name: parsed.data.last_name,
      email,
      password: hashedPassword,
      user_type_id: USER_TYPE_IDS.customer,
      is_onboarded: false,
      is_active: true,
    })
    .select('user_id')
    .single()

  if (insertError || !insertedUser) {
    await admin.auth.admin.deleteUser(authUserId)
    return {
      success: false,
      error: 'Could not save user profile. Please try again.',
    }
  }

  await admin.from('activity_logs').insert({
    actor_id: insertedUser.user_id,
    entity_type: 'user',
    entity_id: insertedUser.user_id,
    action: 'user_registered',
    description: `New customer account registered for ${parsed.data.first_name} ${parsed.data.last_name}.`,
  })

  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  })

  if (signInError) {
    redirect('/login')
  }

  redirect('/onboarding')
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
