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
  // Repair & Appointment Pending / Amber
  pending: { label: 'Pending', variant: 'amber', icon: Clock },
  requested: { label: 'Requested', variant: 'amber', icon: Clock },
  pending_verification: { label: 'Pending Verification', variant: 'amber', icon: Clock },
  busy: { label: 'Busy', variant: 'amber', icon: Clock },

  // Confirmed / Scheduled / Sky
  confirmed: { label: 'Confirmed', variant: 'sky', icon: CalendarClock },
  rescheduled: { label: 'Rescheduled', variant: 'sky', icon: CalendarClock },

  // Assigned / In Progress / Indigo
  assigned: { label: 'Assigned', variant: 'indigo', icon: UserCheck },
  in_progress: { label: 'In Progress', variant: 'indigo', icon: Wrench },

  // Awaiting Payment / Orange
  awaiting_payment: { label: 'Awaiting Payment', variant: 'orange', icon: CreditCard },
  high: { label: 'High Priority', variant: 'orange', icon: AlertTriangle },

  // Completed / Verified / Available / Emerald
  completed: { label: 'Completed', variant: 'emerald', icon: CheckCircle2 },
  verified: { label: 'Verified', variant: 'emerald', icon: ShieldCheck },
  available: { label: 'Available', variant: 'emerald', icon: CheckCircle2 },
  active: { label: 'Active', variant: 'emerald', icon: CheckCircle2 },

  // Cancelled / Urgent / Inactive / Rose
  cancelled: { label: 'Cancelled', variant: 'rose', icon: XCircle },
  urgent: { label: 'Urgent', variant: 'rose', icon: AlertTriangle },
  inactive: { label: 'Inactive', variant: 'rose', icon: XCircle },

  // Neutral / Slate
  low: { label: 'Low', variant: 'slate', icon: Clock },
  normal: { label: 'Normal', variant: 'sky', icon: Clock },
  off_duty: { label: 'Off Duty', variant: 'slate', icon: XCircle },
}

interface StatusBadgeProps {
  status: string
  className?: string
  showIcon?: boolean
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const key = status.toLowerCase()
  const config = STATUS_MAP[key] ?? {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    variant: 'slate' as const,
    icon: Clock,
  }
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={className}>
      {showIcon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
      <span>{config.label}</span>
    </Badge>
  )
}
