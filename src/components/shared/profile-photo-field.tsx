'use client'

import * as React from 'react'
import { Camera, Loader2, Move, RotateCcw, Trash2, ZoomIn } from 'lucide-react'
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

interface ProfilePhotoFieldProps {
  currentAvatarUrl: string | null | undefined
  currentAvatarPosition?: AvatarPosition | null
  fullName: string
}

export function ProfilePhotoField({
  currentAvatarUrl,
  currentAvatarPosition,
  fullName,
}: ProfilePhotoFieldProps) {
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(currentAvatarUrl ?? null)
  const [savedPosition, setSavedPosition] = React.useState<AvatarPosition>(() =>
    normalizeAvatarPosition(currentAvatarPosition)
  )
  const [draftPosition, setDraftPosition] = React.useState<AvatarPosition>(() =>
    normalizeAvatarPosition(currentAvatarPosition)
  )
  const [adjustOpen, setAdjustOpen] = React.useState(false)
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

  function openPositionEditor() {
    setDraftPosition(savedPosition)
    setFeedback(null)
    setAdjustOpen(true)
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
        setAdjustOpen(false)
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
    <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          {avatarUrl ? (
            <button
              type="button"
              onClick={openPositionEditor}
              aria-label="Adjust profile photo position"
              className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <UserAvatar
                avatarUrl={avatarUrl}
                avatarPosition={savedPosition}
                name={fullName}
                size="lg"
              />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-secondary/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <Move className="h-4 w-4" aria-hidden="true" />
              </span>
            </button>
          ) : (
            <UserAvatar avatarUrl={null} name={fullName} size="lg" />
          )}

          <div>
            <p className="text-sm font-semibold text-foreground">Profile Photo</p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, or WebP up to 2 MB. You can adjust how your photo is framed anytime.
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
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={openPositionEditor}
              >
                <Move className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Adjust Position</span>
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
                <span>Remove</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {feedback && !adjustOpen && <FormBanner type={feedback.type} message={feedback.message} />}

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Photo Position</DialogTitle>
            <DialogDescription>
              Drag your photo inside the circle or use the sliders to center your face.
            </DialogDescription>
          </DialogHeader>

          {feedback && adjustOpen && <FormBanner type={feedback.type} message={feedback.message} />}

          {avatarUrl && (
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
                  <span>Preview in header &amp; menu</span>
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
            </div>
          )}

          <DialogFooter className="sm:justify-between">
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

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setAdjustOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" disabled={isPending} onClick={handleSavePosition}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>Save Position</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
