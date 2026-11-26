'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuthenticatedUser } from '@/lib/auth/session'
import {
  DEFAULT_AVATAR_POSITION,
  normalizeAvatarPosition,
  type AvatarPosition,
} from '@/lib/avatar'

export type AvatarActionResult =
  | { success: true; message: string; avatarUrl: string | null; avatarPosition?: AvatarPosition }
  | { success: false; error: string }

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2 MB

function revalidateAllPortals() {
  revalidatePath('/customer', 'layout')
  revalidatePath('/technician', 'layout')
  revalidatePath('/admin', 'layout')
}

async function persistAvatarPositionMetadata(
  authUserId: string,
  userId: string,
  position: AvatarPosition
): Promise<void> {
  const admin = createAdminClient()
  const { data: authUserData } = await admin.auth.admin.getUserById(authUserId)
  const existingMeta =
    (authUserData?.user?.user_metadata as Record<string, unknown> | undefined) ?? {}

  await admin.auth.admin.updateUserById(authUserId, {
    user_metadata: {
      ...existingMeta,
      avatar_position: position,
    },
  })

  // Best-effort sync to public.users if migration 004 avatar_position column has been applied
  const { error: dbErr } = await admin
    .from('users')
    .update({ avatar_position: position })
    .eq('user_id', userId)

  if (dbErr && dbErr.code !== '42703') {
    throw new Error(dbErr.message)
  }
}

export async function uploadAvatarAction(formData: FormData): Promise<AvatarActionResult> {
  const profile = await requireAuthenticatedUser()
  const file = formData.get('avatar')

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Please select a photo to upload.' }
  }

  const ext = ALLOWED_TYPES[file.type]
  if (!ext) {
    return { success: false, error: 'Please choose a JPEG, PNG, or WebP image.' }
  }

  if (file.size > MAX_FILE_BYTES) {
    return { success: false, error: 'Please choose a photo that is 2 MB or smaller.' }
  }

  if (!profile.auth_user_id) {
    return { success: false, error: 'Please sign in again before updating your photo.' }
  }

  const admin = createAdminClient()
  const supabase = await createClient()
  const objectPath = `${profile.auth_user_id}/avatar-${Date.now()}.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadErr } = await admin.storage
    .from('avatars')
    .upload(objectPath, new Uint8Array(arrayBuffer), {
      contentType: file.type,
      upsert: true,
    })

  if (uploadErr) {
    return {
      success: false,
      error: uploadErr.message || 'Unable to upload photo right now. Please try again.',
    }
  }

  const { data: publicUrlData } = admin.storage.from('avatars').getPublicUrl(objectPath)
  const avatarUrl = publicUrlData.publicUrl

  const { error: updateErr } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('user_id', profile.user_id)

  if (updateErr) {
    return {
      success: false,
      error: updateErr.message || 'Unable to save your profile photo.',
    }
  }

  await persistAvatarPositionMetadata(
    profile.auth_user_id,
    profile.user_id,
    DEFAULT_AVATAR_POSITION
  )

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'user',
    entity_id: profile.user_id,
    action: 'avatar_updated',
    description: `${profile.first_name} ${profile.last_name} updated their profile photo.`,
  })

  revalidateAllPortals()
  return {
    success: true,
    message: 'Profile photo updated.',
    avatarUrl,
    avatarPosition: DEFAULT_AVATAR_POSITION,
  }
}

export async function updateAvatarPositionAction(
  positionInput: AvatarPosition
): Promise<AvatarActionResult> {
  const profile = await requireAuthenticatedUser()
  if (!profile.auth_user_id) {
    return { success: false, error: 'Please sign in again before saving your photo position.' }
  }
  if (!profile.avatar_url) {
    return { success: false, error: 'Upload a profile photo first before adjusting its position.' }
  }

  const normalized = normalizeAvatarPosition(positionInput)

  try {
    await persistAvatarPositionMetadata(profile.auth_user_id, profile.user_id, normalized)
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unable to save photo position.',
    }
  }

  revalidateAllPortals()
  return {
    success: true,
    message: 'Photo position saved.',
    avatarUrl: profile.avatar_url,
    avatarPosition: normalized,
  }
}

export async function removeAvatarAction(): Promise<AvatarActionResult> {
  const profile = await requireAuthenticatedUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from('users')
    .update({ avatar_url: null })
    .eq('user_id', profile.user_id)

  if (error) {
    return { success: false, error: error.message }
  }

  if (profile.auth_user_id) {
    await persistAvatarPositionMetadata(
      profile.auth_user_id,
      profile.user_id,
      DEFAULT_AVATAR_POSITION
    )
  }

  await supabase.from('activity_logs').insert({
    actor_id: profile.user_id,
    entity_type: 'user',
    entity_id: profile.user_id,
    action: 'avatar_removed',
    description: `${profile.first_name} ${profile.last_name} removed their profile photo.`,
  })

  revalidateAllPortals()
  return {
    success: true,
    message: 'Profile photo removed.',
    avatarUrl: null,
    avatarPosition: DEFAULT_AVATAR_POSITION,
  }
}
