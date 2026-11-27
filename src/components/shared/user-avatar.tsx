import * as React from 'react'
import { User } from 'lucide-react'
import { getAvatarImageStyle, type AvatarPosition } from '@/lib/avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  avatarUrl?: string | null
  avatarPosition?: AvatarPosition | null
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  variant?: 'light' | 'dark'
  className?: string
}

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps['size']>, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
  xl: 'h-20 w-20',
  '2xl': 'h-24 w-24 sm:h-28 sm:w-28',
}

const ICON_CLASSES: Record<NonNullable<UserAvatarProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-4 w-4',
  lg: 'h-7 w-7',
  xl: 'h-8 w-8',
  '2xl': 'h-11 w-11',
}

export function UserAvatar({
  avatarUrl,
  avatarPosition,
  name,
  size = 'md',
  variant = 'light',
  className,
}: UserAvatarProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full border',
        variant === 'dark'
          ? 'border-slate-700 bg-slate-800 text-slate-200'
          : 'border-border bg-muted text-muted-foreground',
        SIZE_CLASSES[size],
        className
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={`${name} profile photo`}
          style={getAvatarImageStyle(avatarPosition)}
          className="h-full w-full object-cover select-none"
        />
      ) : (
        <User
          className={cn(
            variant === 'dark' ? 'text-slate-300' : 'text-muted-foreground',
            ICON_CLASSES[size]
          )}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
