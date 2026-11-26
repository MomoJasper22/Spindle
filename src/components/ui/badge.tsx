import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight transition-colors whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-primary-tint text-primary border border-teal-200',
        secondary: 'bg-slate-100 text-[#141B29] border border-border',
        outline: 'border border-border text-muted-foreground bg-card',
        amber: 'bg-[#FEF3C7] text-[#92400E] border border-amber-200',
        sky: 'bg-[#E0F2FE] text-[#075985] border border-sky-200',
        indigo: 'bg-[#E6F4F1] text-[#0F766E] border border-teal-200',
        orange: 'bg-[#FFEDD5] text-[#9A3412] border border-orange-200',
        emerald: 'bg-[#D1FAE5] text-[#065F46] border border-emerald-200',
        rose: 'bg-[#FFE4E6] text-[#9F1239] border border-rose-200',
        slate: 'bg-muted text-muted-foreground border border-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
