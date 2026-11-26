import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/constants'
import type { TechnicianProfileRow, UserRow } from '@/types/database'

export interface AuthenticatedUserProfile extends UserRow {
  role: UserRole
  technician_profile: TechnicianProfileRow | null
}

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case 'customer':
      return '/customer/home'
    case 'technician':
      return '/technician/dashboard'
    case 'admin':
      return '/admin/dashboard'
  }
}

export async function getCurrentUserProfile(): Promise<AuthenticatedUserProfile | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, user_types(type_name)')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!profile || !profile.is_active) {
    return null
  }

  const rawRole = Array.isArray(profile.user_types)
    ? profile.user_types[0]?.type_name
    : (profile.user_types as { type_name?: UserRole } | null)?.type_name

  if (!rawRole) {
    return null
  }

  let techProfile: TechnicianProfileRow | null = null
  if (rawRole === 'technician') {
    const { data: tp } = await supabase
      .from('technician_profiles')
      .select('*')
      .eq('technician_id', profile.user_id)
      .maybeSingle()
    techProfile = tp as TechnicianProfileRow | null
  }

  const { user_types: _ignored, ...rest } = profile as UserRow & {
    user_types: unknown
  }
  void _ignored

  return {
    ...rest,
    role: rawRole,
    technician_profile: techProfile,
  }
}

export async function requireAuthenticatedUser(options?: {
  allowUnonboarded?: boolean
}): Promise<AuthenticatedUserProfile> {
  const profile = await getCurrentUserProfile()
  if (!profile) {
    redirect('/login')
  }
  if (!options?.allowUnonboarded && !profile.is_onboarded) {
    redirect('/onboarding')
  }
  return profile
}

export async function requireRole(allowedRole: UserRole): Promise<AuthenticatedUserProfile> {
  const profile = await requireAuthenticatedUser()
  if (profile.role !== allowedRole) {
    redirect(getRoleHomePath(profile.role))
  }
  return profile
}
