export interface AvatarPosition {
  x: number
  y: number
  zoom: number
}

export const DEFAULT_AVATAR_POSITION: AvatarPosition = {
  x: 50,
  y: 50,
  zoom: 1,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Normalizes arbitrary persisted avatar framing values into safe percentage & zoom bounds. */
export function normalizeAvatarPosition(raw: unknown): AvatarPosition {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_AVATAR_POSITION }
  }
  const obj = raw as Record<string, unknown>
  const x = typeof obj.x === 'number' && Number.isFinite(obj.x) ? clamp(Math.round(obj.x * 10) / 10, 0, 100) : 50
  const y = typeof obj.y === 'number' && Number.isFinite(obj.y) ? clamp(Math.round(obj.y * 10) / 10, 0, 100) : 50
  const zoom =
    typeof obj.zoom === 'number' && Number.isFinite(obj.zoom)
      ? clamp(Math.round(obj.zoom * 100) / 100, 1, 2.5)
      : 1

  return { x, y, zoom }
}

/** Builds inline image styles so avatar focal position and zoom match across all surfaces. */
export function getAvatarImageStyle(position?: AvatarPosition | null): React.CSSProperties {
  const pos = normalizeAvatarPosition(position)
  return {
    objectPosition: `${pos.x}% ${pos.y}%`,
    transform: `scale(${pos.zoom})`,
    transformOrigin: `${pos.x}% ${pos.y}%`,
  }
}
