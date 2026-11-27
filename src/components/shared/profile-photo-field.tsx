'use client'

import * as React from 'react'
import { Camera, Loader2, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormBanner } from '@/components/shared/form-banner'
import { UserAvatar } from '@/components/shared/user-avatar'
import {
  removeAvatarAction,
  uploadAvatarAction,
} from '@/features/auth/actions/avatar-actions'
import type { AvatarPosition } from '@/lib/avatar'
import { cn } from '@/lib/utils'

interface ProfilePhotoFieldProps {
  currentAvatarUrl: string | null | undefined
  currentAvatarPosition?: AvatarPosition | null
  fullName: string
  layout?: 'centered' | 'compact'
}

export function ProfilePhotoField({
  currentAvatarUrl,
  currentAvatarPosition,
  fullName,
  layout = 'centered',
}: ProfilePhotoFieldProps) {
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(currentAvatarUrl ?? null)
  const [editorOpen, setEditorOpen] = React.useState(false)
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

  function openPhotoEditor() {
    setFeedback(null)
    setEditorOpen(true)
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
    <div
      className={cn(
        'space-y-3 rounded-xl border border-border bg-muted/35 p-4',
        layout === 'centered' && 'py-6'
      )}
    >
      <div
        className={cn(
          layout === 'centered'
            ? 'flex flex-col items-center justify-center gap-3.5 text-center'
            : 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'
        )}
      >
        <button
          type="button"
          onClick={openPhotoEditor}
          aria-label="Edit profile photo"
          className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserAvatar
            avatarUrl={avatarUrl}
            avatarPosition={currentAvatarPosition}
            name={fullName}
            size={layout === 'centered' ? '2xl' : 'lg'}
          />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-secondary/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-5 w-5" aria-hidden="true" />
          </span>
        </button>

        {layout === 'compact' && (
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">Profile Photo</p>
            <p className="text-xs text-muted-foreground">
              Add or update your photo for your account profile.
            </p>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={openPhotoEditor}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>Edit Photo</span>
        </Button>
      </div>

      {feedback && !editorOpen && <FormBanner type={feedback.type} message={feedback.message} />}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
            <DialogDescription>
              PNG, JPG, or WebP up to 2 MB.
            </DialogDescription>
          </DialogHeader>

          <input
            ref={fileInputRef}
            id="profile-photo-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            disabled={isPending}
            className="sr-only"
          />

          {feedback && editorOpen && <FormBanner type={feedback.type} message={feedback.message} />}

          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="relative h-44 w-44 overflow-hidden rounded-full border-2 border-primary bg-muted shadow-sm flex items-center justify-center">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={`${fullName} profile photo`}
                  className="h-full w-full object-cover select-none"
                />
              ) : (
                <UserAvatar avatarUrl={null} name={fullName} size="2xl" className="border-0 bg-transparent" />
              )}
            </div>

            {!avatarUrl && (
              <p className="text-sm text-muted-foreground">
                No profile photo uploaded yet.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant={avatarUrl ? 'outline' : 'default'}
                size={avatarUrl ? 'sm' : 'default'}
                disabled={isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
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
                  <span>Remove Photo</span>
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setEditorOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
