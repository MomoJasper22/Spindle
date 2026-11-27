'use client'

import * as React from 'react'
import { Camera, Loader2, RotateCcw, Trash2, Upload, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
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

export function ProfilePhotoField({
  currentAvatarUrl,
  currentAvatarPosition,
  fullName,
  layout = 'centered',
}: ProfilePhotoFieldProps) {
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(currentAvatarUrl ?? null)
  const [savedPosition, setSavedPosition] = React.useState<AvatarPosition>(() =>
    normalizeAvatarPosition(currentAvatarPosition)
  )
  const [draftPosition, setDraftPosition] = React.useState<AvatarPosition>(() =>
    normalizeAvatarPosition(currentAvatarPosition)
  )
  const [editorOpen, setEditorOpen] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const dragOriginRef = React.useRef<{
    clientX: number
    clientY: number
    startX: number
    startY: number
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
        setAvatarUrl(result.avatarUrl)
        const nextPos = result.avatarPosition ?? DEFAULT_AVATAR_POSITION
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
    setDraftPosition(savedPosition)
    setFeedback(null)
    setEditorOpen(true)
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragOriginRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: draftPosition.x,
      startY: draftPosition.y,
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragOriginRef.current) return
    const dx = e.clientX - dragOriginRef.current.clientX
    const dy = e.clientY - dragOriginRef.current.clientY
    const sensitivity = 100 / (220 * draftPosition.zoom)

    setDraftPosition((prev) =>
      normalizeAvatarPosition({
        x: dragOriginRef.current!.startX - dx * sensitivity,
        y: dragOriginRef.current!.startY - dy * sensitivity,
        zoom: prev.zoom,
      })
    )
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (dragOriginRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId)
      dragOriginRef.current = null
    }
  }

  function handleSavePosition() {
    setFeedback(null)
    startTransition(async () => {
      const result = await updateAvatarPositionAction(draftPosition)
      if (result.success) {
        const nextPos = result.avatarPosition ?? draftPosition
        setSavedPosition(nextPos)
        setEditorOpen(false)
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
        setSavedPosition(DEFAULT_AVATAR_POSITION)
        setDraftPosition(DEFAULT_AVATAR_POSITION)
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
              Add or adjust your photo for your account profile.
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
              PNG, JPG, or WebP up to 2 MB. You can adjust how your photo is framed anytime.
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

          {avatarUrl ? (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3">
                <div
                  role="application"
                  aria-label="Drag to reposition profile photo"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  style={{ touchAction: 'none' }}
                  className="relative h-56 w-56 cursor-grab overflow-hidden rounded-full border-2 border-primary bg-muted shadow-md active:cursor-grabbing"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl}
                    alt={`${fullName} reposition preview`}
                    draggable={false}
                    style={getAvatarImageStyle(draftPosition)}
                    className="h-full w-full object-cover select-none pointer-events-none"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/40"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <UserAvatar
                    avatarUrl={avatarUrl}
                    avatarPosition={draftPosition}
                    name={fullName}
                    size="sm"
                  />
                  <span>Drag image or use sliders to center</span>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <Label htmlFor="avatar-zoom" className="flex items-center gap-1.5 text-xs">
                      <ZoomIn className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      Zoom
                    </Label>
                    <span className="tabular-nums text-muted-foreground">
                      {draftPosition.zoom.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    id="avatar-zoom"
                    type="range"
                    min={1}
                    max={2.5}
                    step={0.05}
                    value={draftPosition.zoom}
                    onChange={(e) =>
                      setDraftPosition((prev) =>
                        normalizeAvatarPosition({ ...prev, zoom: Number(e.target.value) })
                      )
                    }
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-medium">
                      <Label htmlFor="avatar-pos-x" className="text-[11px]">
                        Left / Right
                      </Label>
                      <span className="tabular-nums text-muted-foreground">
                        {Math.round(draftPosition.x)}%
                      </span>
                    </div>
                    <input
                      id="avatar-pos-x"
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={draftPosition.x}
                      onChange={(e) =>
                        setDraftPosition((prev) =>
                          normalizeAvatarPosition({ ...prev, x: Number(e.target.value) })
                        )
                      }
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-medium">
                      <Label htmlFor="avatar-pos-y" className="text-[11px]">
                        Up / Down
                      </Label>
                      <span className="tabular-nums text-muted-foreground">
                        {Math.round(draftPosition.y)}%
                      </span>
                    </div>
                    <input
                      id="avatar-pos-y"
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={draftPosition.y}
                      onChange={(e) =>
                        setDraftPosition((prev) =>
                          normalizeAvatarPosition({ ...prev, y: Number(e.target.value) })
                        )
                      }
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
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
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>Change Photo</span>
                </Button>

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
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <UserAvatar avatarUrl={null} name={fullName} size="2xl" />
              <p className="text-sm text-muted-foreground">
                No profile photo uploaded yet.
              </p>
              <Button
                type="button"
                disabled={isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Upload className="h-4 w-4" aria-hidden="true" />
                )}
                <span>Upload Photo</span>
              </Button>
            </div>
          )}

          <DialogFooter className={cn(avatarUrl ? 'sm:justify-between' : 'sm:justify-end')}>
            {avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => setDraftPosition({ ...DEFAULT_AVATAR_POSITION })}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset Center</span>
              </Button>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setEditorOpen(false)}
              >
                {avatarUrl ? 'Cancel' : 'Close'}
              </Button>
              {avatarUrl && (
                <Button type="button" disabled={isPending} onClick={handleSavePosition}>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  <span>Save Position</span>
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
