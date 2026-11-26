'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface MarqueeTrackHandle {
  step: (direction: 'prev' | 'next') => void
}

interface MarqueeTrackProps<T> {
  ref?: React.Ref<MarqueeTrackHandle>
  items: readonly T[]
  getItemKey: (item: T) => string
  renderItem: (item: T, options: { isClone: boolean }) => React.ReactNode
  /** Auto-scroll speed in pixels per second moving from right to left. */
  speedPxPerSec?: number
  ariaLabel: string
  className?: string
  /** Flex gap and matching trailing padding on each looped set (e.g. "gap-4 pr-4 sm:gap-5 sm:pr-5"). */
  setSpacingClassName?: string
}

interface DragState {
  pointerId: number
  startX: number
  startY: number
  lastX: number
  lastTime: number
  startOffset: number
  active: boolean
}

const DRAG_THRESHOLD_PX = 6
const VERTICAL_CANCEL_PX = 8
const MAX_VELOCITY_PX_PER_SEC = 2400
const MOMENTUM_DECAY_PER_SEC = 5.5

/** Keep track offset normalized in (-setWidth, 0] for seamless wrapping in both directions. */
function wrapOffset(value: number, setWidth: number): number {
  if (setWidth <= 0) return 0
  let wrapped = ((value % setWidth) + setWidth) % setWidth
  if (wrapped > 0) {
    wrapped -= setWidth
  }
  return Object.is(wrapped, -0) ? 0 : wrapped
}

export function MarqueeTrack<T>({
  ref,
  items,
  getItemKey,
  renderItem,
  speedPxPerSec = 40,
  ariaLabel,
  className,
  setSpacingClassName = 'gap-4 pr-4 sm:gap-5 sm:pr-5',
}: MarqueeTrackProps<T>) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const firstSetRef = React.useRef<HTMLDivElement>(null)

  const offsetRef = React.useRef(0)
  const setWidthRef = React.useRef(0)
  const isHoveredRef = React.useRef(false)
  const isDraggingRef = React.useRef(false)
  const velocityRef = React.useRef(0)
  const stepRemainingRef = React.useRef(0)
  const reducedMotionRef = React.useRef(false)
  const dragStateRef = React.useRef<DragState | null>(null)
  const suppressClickRef = React.useRef(false)
  const clickResetTimerRef = React.useRef<number | null>(null)

  const [isDragging, setIsDragging] = React.useState(false)

  const applyTransform = React.useCallback(() => {
    if (!trackRef.current) return
    trackRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`
  }, [])

  React.useImperativeHandle(
    ref,
    () => ({
      step: (direction) => {
        const firstSet = firstSetRef.current
        if (!firstSet || setWidthRef.current <= 0) return

        const firstChild = firstSet.children[0]
        const secondChild = firstSet.children[1]
        const stepDistance =
          firstChild && secondChild
            ? Math.max(
                1,
                secondChild.getBoundingClientRect().left -
                  firstChild.getBoundingClientRect().left,
              )
            : firstChild
              ? firstChild.getBoundingClientRect().width
              : 220

        velocityRef.current = 0
        stepRemainingRef.current +=
          direction === 'next' ? -stepDistance : stepDistance
      },
    }),
    [],
  )

  // Measure one complete set (including its trailing gap) and react to responsive resizes.
  React.useEffect(() => {
    const firstSet = firstSetRef.current
    if (!firstSet) return

    const updateWidth = () => {
      const width = firstSet.getBoundingClientRect().width
      if (width > 0) {
        setWidthRef.current = width
        offsetRef.current = wrapOffset(offsetRef.current, width)
        applyTransform()
      }
    }

    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(firstSet)
    return () => observer.disconnect()
  }, [applyTransform, items.length])

  // Respect user reduced-motion preference while keeping drag interaction working.
  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionRef.current = media.matches
    const onChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  // Smooth sub-pixel right-to-left loop + post-drag momentum coasting.
  React.useEffect(() => {
    let rafId = 0
    let lastTime = performance.now()

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      const setWidth = setWidthRef.current
      if (setWidth > 0 && !isDraggingRef.current) {
        const isPaused = isHoveredRef.current || reducedMotionRef.current
        let delta = 0

        if (Math.abs(velocityRef.current) > 2) {
          delta += velocityRef.current * dt
          velocityRef.current *= Math.exp(-MOMENTUM_DECAY_PER_SEC * dt)
        } else {
          velocityRef.current = 0
        }

        const stepRemaining = stepRemainingRef.current
        if (Math.abs(stepRemaining) > 0.25) {
          const stepDelta = reducedMotionRef.current
            ? stepRemaining
            : stepRemaining * (1 - Math.exp(-12 * dt))
          stepRemainingRef.current -= stepDelta
          delta += stepDelta
        } else if (stepRemaining !== 0) {
          delta += stepRemaining
          stepRemainingRef.current = 0
        }

        if (!isPaused) {
          delta -= speedPxPerSec * dt
        }

        if (delta !== 0) {
          offsetRef.current = wrapOffset(offsetRef.current + delta, setWidth)
          applyTransform()
        }
      }

      rafId = window.requestAnimationFrame(tick)
    }

    rafId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(rafId)
  }, [applyTransform, speedPxPerSec])

  React.useEffect(() => {
    return () => {
      if (clickResetTimerRef.current !== null) {
        window.clearTimeout(clickResetTimerRef.current)
      }
    }
  }, [])

  const scheduleClickReset = () => {
    if (clickResetTimerRef.current !== null) {
      window.clearTimeout(clickResetTimerRef.current)
    }
    clickResetTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = false
      clickResetTimerRef.current = null
    }, 0)
  }

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') {
      isHoveredRef.current = true
    }
  }

  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && !isDraggingRef.current) {
      isHoveredRef.current = false
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return

    if (clickResetTimerRef.current !== null) {
      window.clearTimeout(clickResetTimerRef.current)
      clickResetTimerRef.current = null
    }
    suppressClickRef.current = false
    velocityRef.current = 0
    stepRemainingRef.current = 0

    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastTime: performance.now(),
      startOffset: offsetRef.current,
      active: false,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current
    if (!drag || drag.pointerId !== e.pointerId) return

    const dxFromStart = e.clientX - drag.startX
    const dyFromStart = e.clientY - drag.startY

    if (!drag.active) {
      if (
        e.pointerType !== 'mouse' &&
        Math.abs(dyFromStart) > VERTICAL_CANCEL_PX &&
        Math.abs(dyFromStart) > Math.abs(dxFromStart)
      ) {
        dragStateRef.current = null
        return
      }

      if (Math.abs(dxFromStart) < DRAG_THRESHOLD_PX) return

      drag.active = true
      isDraggingRef.current = true
      suppressClickRef.current = true
      setIsDragging(true)

      try {
        viewportRef.current?.setPointerCapture(e.pointerId)
      } catch {
        // Ignore if pointer capture is unavailable on synthetic events.
      }
    }

    const now = performance.now()
    const dt = Math.max((now - drag.lastTime) / 1000, 0.001)
    const stepDx = e.clientX - drag.lastX
    const instantVelocity = Math.max(
      -MAX_VELOCITY_PX_PER_SEC,
      Math.min(MAX_VELOCITY_PX_PER_SEC, stepDx / dt),
    )

    velocityRef.current = velocityRef.current * 0.65 + instantVelocity * 0.35
    drag.lastX = e.clientX
    drag.lastTime = now

    const setWidth = setWidthRef.current
    if (setWidth > 0) {
      offsetRef.current = wrapOffset(drag.startOffset + dxFromStart, setWidth)
      applyTransform()
    }
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current
    if (!drag || drag.pointerId !== e.pointerId) return

    if (drag.active) {
      if (performance.now() - drag.lastTime > 80) {
        velocityRef.current = 0
      }

      try {
        if (viewportRef.current?.hasPointerCapture(e.pointerId)) {
          viewportRef.current.releasePointerCapture(e.pointerId)
        }
      } catch {
        // Ignore if already released.
      }

      isDraggingRef.current = false
      setIsDragging(false)
      scheduleClickReset()
    }

    if (e.pointerType === 'mouse' && viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect()
      isHoveredRef.current =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
    }

    dragStateRef.current = null
  }

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      e.preventDefault()
      e.stopPropagation()
      suppressClickRef.current = false
    }
  }

  const handleFocusCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current
    const target = e.target
    if (!viewport || !(target instanceof HTMLElement)) return
    if (target.closest('[aria-hidden="true"]')) return

    const setWidth = setWidthRef.current
    if (setWidth <= 0) return

    const viewportRect = viewport.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const padding = 16

    if (targetRect.left < viewportRect.left + padding) {
      offsetRef.current = wrapOffset(
        offsetRef.current + (viewportRect.left + padding - targetRect.left),
        setWidth,
      )
      applyTransform()
    } else if (targetRect.right > viewportRect.right - padding) {
      offsetRef.current = wrapOffset(
        offsetRef.current - (targetRect.right - (viewportRect.right - padding)),
        setWidth,
      )
      applyTransform()
    }
  }

  return (
    <div
      ref={viewportRef}
      role="region"
      aria-label={ariaLabel}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={handleClickCapture}
      onFocusCapture={handleFocusCapture}
      className={cn(
        'relative w-full overflow-hidden py-2 select-none touch-pan-y',
        '[mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)]',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        className,
      )}
    >
      <div ref={trackRef} className="flex w-max will-change-transform">
        {[0, 1, 2].map((copyIndex) => (
          <div
            key={copyIndex}
            ref={copyIndex === 0 ? firstSetRef : undefined}
            aria-hidden={copyIndex > 0 ? true : undefined}
            className={cn('flex shrink-0 items-stretch', setSpacingClassName)}
          >
            {items.map((item) => (
              <React.Fragment key={`${copyIndex}-${getItemKey(item)}`}>
                {renderItem(item, { isClone: copyIndex > 0 })}
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
