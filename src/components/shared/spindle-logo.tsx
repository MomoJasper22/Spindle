import * as React from 'react'
import { cn } from '@/lib/utils'

interface SpindleLogoProps {
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
  className?: string
}

export function SpindleLogo({
  variant = 'dark',
  size = 'md',
  showTagline = false,
  className,
}: SpindleLogoProps) {
  const iconSize = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8'
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg'
  const textColor = variant === 'light' ? 'text-white' : 'text-slate-900'
  const subColor = variant === 'light' ? 'text-slate-300' : 'text-slate-500'

  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-primary text-white shadow-xs shrink-0',
          iconSize
        )}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="M4.93 4.93l2.83 2.83" />
          <path d="M16.24 16.24l2.83 2.83" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
          <path d="M4.93 19.07l2.83-2.83" />
          <path d="M16.24 7.76l2.83-2.83" />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className={cn('font-heading font-bold tracking-tight', textSize, textColor)}>
          Spindle
        </span>
        {showTagline && (
          <span className={cn('text-[11px] font-medium mt-0.5', subColor)}>
            Field Service CRM
          </span>
        )}
      </div>
    </div>
  )
}
