import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight transition-colors whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-primary-tint text-primary border border-blue-200',
        secondary: 'bg-teal-50 text-teal-700 border border-teal-200',
        outline: 'border border-border text-muted-foreground bg-card',
        amber: 'bg-[#FEF3C7] text-[#B45309] border border-amber-200',
        sky: 'bg-[#E0F2FE] text-[#0369A1] border border-sky-200',
        indigo: 'bg-[#EEF2FF] text-[#4338CA] border border-indigo-200',
        orange: 'bg-[#FFEDD5] text-[#C2410C] border border-orange-200',
        emerald: 'bg-[#D1FAE5] text-[#047857] border border-emerald-200',
        rose: 'bg-[#FFE4E6] text-[#BE123C] border border-rose-200',
        slate: 'bg-slate-100 text-slate-700 border border-slate-200',
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
