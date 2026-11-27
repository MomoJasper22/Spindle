'use client'

import * as React from 'react'
import { Camera, Loader2, Move, RotateCcw, Save, Trash2, Upload, ZoomIn } from 'lucide-react'
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
  updateAvatarPositionAction,
  uploadAvatarAction,
} from '@/features/auth/actions/avatar-actions'
import {
  DEFAULT_AVATAR_POSITION,
  getAvatarImageStyle,
  normalizeAvatarPosition,
  type AvatarPosition,
} from '@/lib/avatar'
import { cn } from '@/lib/utils'

interface ProfilePhotoFieldProps {
  currentAvatarUrl: string | null | undefined
  currentAvatarPosition?: AvatarPosition | null
  fullName: string
  layout?: 'centered' | 'compact'
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function ProfilePhotoField({
  currentAvatarUrl,
  currentAvatarPosition,
  fullName,
  layout = 'centered',
}: ProfilePhotoFieldProps) {
  const initialPos = normalizeAvatarPosition(currentAvatarPosition)
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(currentAvatarUrl ?? null)
  const [savedPosition, setSavedPosition] = React.useState<AvatarPosition>(initialPos)
  const [draftPosition, setDraftPosition] = React.useState<AvatarPosition>(initialPos)
  const [editorOpen, setEditorOpen] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const dragStateRef = React.useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setFeedback(null)
    const formData = new FormData()
    formData.append('avatar', file)

    startTransition(async () => {
      const result = await uploadAvatarAction(formData)
      if (result.success) {
        const nextPos = normalizeAvatarPosition(result.avatarPosition)
        setAvatarUrl(result.avatarUrl)
        setSavedPosition(nextPos)
        setDraftPosition(nextPos)
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
    setDraftPosition(savedPosition)
    setEditorOpen(true)
  }

  function handleSavePosition() {
    setFeedback(null)
    startTransition(async () => {
      const result = await updateAvatarPositionAction(draftPosition)
      if (result.success) {
        const nextPos = normalizeAvatarPosition(result.avatarPosition ?? draftPosition)
        setSavedPosition(nextPos)
        setDraftPosition(nextPos)
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function handleRemove() {
    setFeedback(null)
    startTransition(async () => {
      const result = await removeAvatarAction()
      if (result.success) {
        setAvatarUrl(null)
        setSavedPosition({ ...DEFAULT_AVATAR_POSITION })
        setDraftPosition({ ...DEFAULT_AVATAR_POSITION })
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!avatarUrl || isPending) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: draftPosition.x,
      originY: draftPosition.y,
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragStateRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    const sensitivity = 0.55
    setDraftPosition((prev) => ({
      ...prev,
      x: Math.round(clamp(drag.originX - dx * sensitivity, 0, 100) * 10) / 10,
      y: Math.round(clamp(drag.originY - dy * sensitivity, 0, 100) * 10) / 10,
    }))
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null
    }
  }

  const hasPositionChanges =
    Math.abs(draftPosition.x - savedPosition.x) >= 0.1 ||
    Math.abs(draftPosition.y - savedPosition.y) >= 0.1 ||
    Math.abs(draftPosition.zoom - savedPosition.zoom) >= 0.01

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
            avatarPosition={savedPosition}
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
              Add, crop, or adjust the position of your profile photo.
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
              PNG, JPG, or WebP up to 2 MB. Drag the preview to adjust position and zoom.
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

          <div className="flex flex-col items-center gap-4 py-3 text-center">
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              role={avatarUrl ? 'slider' : undefined}
              aria-label={avatarUrl ? 'Drag to adjust profile photo position' : undefined}
              aria-valuenow={avatarUrl ? Math.round(draftPosition.x) : undefined}
              className={cn(
                'relative h-44 w-44 overflow-hidden rounded-full border-2 border-primary bg-muted shadow-sm flex items-center justify-center',
                avatarUrl && 'touch-none cursor-grab active:cursor-grabbing'
              )}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={`${fullName} profile photo`}
                  draggable={false}
                  style={getAvatarImageStyle(draftPosition)}
                  className="h-full w-full object-cover select-none pointer-events-none"
                />
              ) : (
                <UserAvatar avatarUrl={null} name={fullName} size="2xl" className="border-0 bg-transparent" />
              )}
            </div>

            {avatarUrl ? (
              <div className="w-full max-w-xs space-y-2.5">
                <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Move className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Drag photo to reposition</span>
                </p>

                <div className="flex items-center gap-2.5">
                  <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <input
                    type="range"
                    aria-label="Zoom level"
                    min={1}
                    max={2.5}
                    step={0.05}
                    value={draftPosition.zoom}
                    onChange={(e) =>
                      setDraftPosition((prev) => ({
                        ...prev,
                        zoom: Number(e.target.value),
                      }))
                    }
                    className="h-2 w-full accent-primary cursor-pointer"
                  />
                  <span className="w-10 text-right font-mono text-xs font-medium text-muted-foreground tabular-nums">
                    {draftPosition.zoom.toFixed(1)}x
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isPending || !hasPositionChanges}
                    onClick={handleSavePosition}
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Save className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>Save Position</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => setDraftPosition({ ...DEFAULT_AVATAR_POSITION })}
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Reset</span>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No profile photo uploaded yet.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border pt-3 w-full">
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
