import 'server-only'
import { cache } from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { normalizeAvatarPosition, type AvatarPosition } from '@/lib/avatar'
import {
  ADMIN_FEATURES,
  type AdminFeatureKey,
  type UserRole,
} from '@/lib/constants'
import type { TechnicianProfileRow, UserRow } from '@/types/database'

export interface AuthenticatedUserProfile extends UserRow {
  role: UserRole
  avatar_position: AvatarPosition
  admin_permissions: AdminFeatureKey[] | null
  technician_profile: TechnicianProfileRow | null
}

export function isFullAdmin(profile: Pick<AuthenticatedUserProfile, 'role' | 'admin_permissions'>): boolean {
  return profile.role === 'admin' && (profile.admin_permissions === null || profile.admin_permissions === undefined)
}

export function hasAdminPermission(
  profile: Pick<AuthenticatedUserProfile, 'role' | 'admin_permissions'>,
  feature: AdminFeatureKey
): boolean {
  if (profile.role !== 'admin') return false
  if (profile.admin_permissions === null || profile.admin_permissions === undefined) {
    return true
  }
  return profile.admin_permissions.includes(feature)
}

export function getDefaultAdminPath(
  profile?: Pick<AuthenticatedUserProfile, 'role' | 'admin_permissions'> | null
): string {
  if (!profile || profile.admin_permissions === null || profile.admin_permissions === undefined) {
    return '/admin/dashboard'
  }
  const firstAllowed = ADMIN_FEATURES.find((f) => profile.admin_permissions!.includes(f.key))
  return firstAllowed ? firstAllowed.href : '/admin/profile'
}

export function getRoleHomePath(
  role: UserRole,
  profile?: Pick<AuthenticatedUserProfile, 'role' | 'admin_permissions'> | null
): string {
  switch (role) {
    case 'customer':
      return '/customer/home'
    case 'technician':
      return '/technician/dashboard'
    case 'admin':
      return getDefaultAdminPath(profile)
  }
}

async function fetchUserProfileByAuthId(
  authUserId: string,
  metaAvatarPositionJson: string | null
): Promise<AuthenticatedUserProfile | null> {
  'use cache: private'
  cacheTag('user-profile', `user-profile:${authUserId}`)
  cacheLife({ stale: 300, revalidate: 120, expire: 900 })

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select(
      'user_id, auth_user_id, first_name, last_name, middle_name, nickname, email, phone, user_type_id, branch_location, avatar_url, avatar_position, admin_permissions, address_street, address_barangay, address_city, address_province, address_zip_code, is_onboarded, is_active, created_at, updated_at, user_types(type_name)'
    )
    .eq('auth_user_id', authUserId)
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

  let fallbackMetaPosition: unknown = null
  if (!rest.avatar_position && metaAvatarPositionJson) {
    try {
      fallbackMetaPosition = JSON.parse(metaAvatarPositionJson)
    } catch {
      fallbackMetaPosition = null
    }
  }

  const avatarPosition = normalizeAvatarPosition(
    rest.avatar_position ?? fallbackMetaPosition
  )

  return {
    ...rest,
    role: rawRole,
    avatar_position: avatarPosition,
    admin_permissions: Array.isArray(rest.admin_permissions)
      ? (rest.admin_permissions as AdminFeatureKey[])
      : null,
    technician_profile: techProfile,
  }
}

export const getCurrentUserProfile = cache(async (): Promise<AuthenticatedUserProfile | null> => {
  const supabase = await createClient()
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()

  let authUserId = claimsData?.claims?.sub ?? null
  const claimsUserMeta = claimsData?.claims?.user_metadata as Record<string, unknown> | undefined
  let rawMetaPosition: unknown = claimsUserMeta?.avatar_position

  if (claimsError || !authUserId) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }
    authUserId = user.id
    rawMetaPosition = user.user_metadata?.avatar_position
  }

  const metaAvatarPositionJson =
    rawMetaPosition && typeof rawMetaPosition === 'object'
      ? JSON.stringify(rawMetaPosition)
      : null

  return fetchUserProfileByAuthId(authUserId, metaAvatarPositionJson)
})

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
    redirect(getRoleHomePath(profile.role, profile))
  }
  return profile
}

export async function requireAdminFeature(
  feature: AdminFeatureKey
): Promise<AuthenticatedUserProfile> {
  const profile = await requireRole('admin')
  if (!hasAdminPermission(profile, feature)) {
    redirect(getDefaultAdminPath(profile))
  }
  return profile
}
