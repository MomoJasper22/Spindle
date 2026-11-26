'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuthenticatedUser } from '@/lib/auth/session'

export type AvatarActionResult =
  | { success: true; message: string; avatarUrl: string | null }
  | { success: false; error: string }

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2 MB

function revalidateAllPortals() {
  revalidatePath('/customer/profile')
  revalidatePath('/customer/home')
  revalidatePath('/technician/profile')
  revalidatePath('/technician/dashboard')
  revalidatePath('/admin/profile')
  revalidatePath('/admin/dashboard')
}

export async function uploadAvatarAction(formData: FormData): Promise<AvatarActionResult> {
  const profile = await requireAuthenticatedUser()
  const file = formData.get('avatar')

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Select an image file to upload.' }
  }

  const ext = ALLOWED_TYPES[file.type]
  if (!ext) {
    return { success: false, error: 'Only JPEG, PNG, or WebP images are supported.' }
  }

  if (file.size > MAX_FILE_BYTES) {
    return { success: false, error: 'Image must be 2 MB or smaller.' }
  }

  if (!profile.auth_user_id) {
    return { success: false, error: 'Account session missing auth identifier.' }
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
      error: uploadErr.message || 'Unable to upload photo. Ensure migration 004 has been applied.',
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
      error: updateErr.message || 'Unable to save profile photo URL.',
    }
  }

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
  }
}
