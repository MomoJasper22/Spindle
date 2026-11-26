'use client'

import * as React from 'react'
import { Camera, Loader2, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormBanner } from '@/components/shared/form-banner'
import { removeAvatarAction, uploadAvatarAction } from '@/features/auth/actions/avatar-actions'

interface ProfilePhotoFieldProps {
  currentAvatarUrl: string | null | undefined
  fullName: string
}

export function ProfilePhotoField({ currentAvatarUrl, fullName }: ProfilePhotoFieldProps) {
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(currentAvatarUrl ?? null)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setFeedback(null)
    const formData = new FormData()
    formData.append('avatar', file)

    startTransition(async () => {
      const result = await uploadAvatarAction(formData)
      if (result.success) {
        setAvatarUrl(result.avatarUrl)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    })
  }

  function handleRemove() {
    setFeedback(null)
    startTransition(async () => {
      const result = await removeAvatarAction()
      if (result.success) {
        setAvatarUrl(null)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-slate-50/70 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card text-muted-foreground shadow-2xs">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={`${fullName} profile photo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-7 w-7 text-slate-400" aria-hidden="true" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Profile Photo</p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, or WebP up to 2 MB. Shown next to your name in the sidebar.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            id="profile-photo-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            disabled={isPending}
            className="sr-only"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{avatarUrl ? 'Change Photo' : 'Add Photo'}</span>
          </Button>

          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={handleRemove}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Remove</span>
            </Button>
          )}
        </div>
      </div>

      {feedback && <FormBanner type={feedback.type} message={feedback.message} />}
    </div>
  )
}
