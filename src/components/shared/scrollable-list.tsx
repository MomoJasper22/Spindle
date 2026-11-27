import * as React from 'react'
import { cn } from '@/lib/utils'

interface ScrollableListProps extends React.HTMLAttributes<HTMLDivElement> {
  regionLabel: string
  maxHeightClassName?: string
}

export function ScrollableList({
  regionLabel,
  maxHeightClassName = 'max-h-[min(62dvh,34rem)]',
  className,
  children,
  ...props
}: ScrollableListProps) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={regionLabel}
      className={cn(
        'w-full overflow-y-auto overscroll-contain spindle-scroll rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        maxHeightClassName,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
