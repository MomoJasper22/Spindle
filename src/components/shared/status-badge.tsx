import * as React from 'react'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  ShieldCheck,
  UserCheck,
  Wrench,
  XCircle,
} from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/badge'

type StatusConfig = {
  label: string
  variant: NonNullable<BadgeProps['variant']>
  icon: React.ComponentType<{ className?: string }>
}

const STATUS_MAP: Record<string, StatusConfig> = {
  pending: { label: 'Pending', variant: 'amber', icon: Clock },
  requested: { label: 'Requested', variant: 'amber', icon: Clock },
  pending_verification: { label: 'Pending Verification', variant: 'amber', icon: Clock },
  busy: { label: 'Busy', variant: 'amber', icon: Clock },

  confirmed: { label: 'Confirmed', variant: 'sky', icon: CalendarClock },
  rescheduled: { label: 'Rescheduled', variant: 'sky', icon: CalendarClock },

  assigned: { label: 'Assigned', variant: 'indigo', icon: UserCheck },
  in_progress: { label: 'In Progress', variant: 'indigo', icon: Wrench },

  awaiting_payment: { label: 'Awaiting Payment', variant: 'orange', icon: CreditCard },
  high: { label: 'High Priority', variant: 'orange', icon: AlertTriangle },

  completed: { label: 'Completed', variant: 'emerald', icon: CheckCircle2 },
  verified: { label: 'Verified', variant: 'emerald', icon: ShieldCheck },
  available: { label: 'Available', variant: 'emerald', icon: CheckCircle2 },
  active: { label: 'Active', variant: 'emerald', icon: CheckCircle2 },

  cancelled: { label: 'Cancelled', variant: 'rose', icon: XCircle },
  urgent: { label: 'Urgent', variant: 'rose', icon: AlertTriangle },
  inactive: { label: 'Inactive', variant: 'rose', icon: XCircle },

  low: { label: 'Low', variant: 'slate', icon: Clock },
  normal: { label: 'Normal', variant: 'sky', icon: Clock },
  off_duty: { label: 'Off Duty', variant: 'slate', icon: XCircle },
}

const CUSTOMER_LABELS: Record<string, string> = {
  pending: 'Requested',
  confirmed: 'Confirmed',
  requested: 'Requested',
  pending_verification: 'Checking Details',
  assigned: 'Technician Assigned',
  in_progress: 'In Progress',
  awaiting_payment: 'Ready for Payment',
  completed: 'Done',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
  verified: 'Verified',
  high: 'Soon',
  low: 'Flexible',
  normal: 'Standard',
}

export function getCustomerStatusLabel(status: string): string {
  const key = status.toLowerCase()
  if (CUSTOMER_LABELS[key]) return CUSTOMER_LABELS[key]
  return STATUS_MAP[key]?.label ?? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

interface StatusBadgeProps {
  status: string
  audience?: 'customer' | 'staff'
  className?: string
  showIcon?: boolean
}

export function StatusBadge({
  status,
  audience = 'staff',
  className,
  showIcon = true,
}: StatusBadgeProps) {
  const key = status.toLowerCase()
  const config = STATUS_MAP[key] ?? {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    variant: 'slate' as const,
    icon: Clock,
  }
  const displayLabel = audience === 'customer' ? getCustomerStatusLabel(key) : config.label
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={className}>
      {showIcon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
      <span>{displayLabel}</span>
    </Badge>
  )
}
