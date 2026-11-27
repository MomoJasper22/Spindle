'use client'

import * as React from 'react'
import { Loader2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TECH_AVAILABILITY_STATUSES,
  getTechAvailabilityLabel,
  type TechAvailabilityStatus,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import { updateTechnicianAvailabilityAction } from '../actions/technician-actions'
import { TECH_AVAILABILITY_DOT_CLASSES } from '../lib/technician-jobs'

interface TechnicianAvailabilityControlProps {
  availabilityStatus: TechAvailabilityStatus
  onError?: (message: string | null) => void
  className?: string
}

export function TechnicianAvailabilityControl({
  availabilityStatus,
  onError,
  className,
}: TechnicianAvailabilityControlProps) {
  const [optimisticStatus, setOptimisticStatus] = React.useOptimistic(availabilityStatus)
  const [isUpdating, startTransition] = React.useTransition()
  const selectId = React.useId()

  function handleStatusChange(nextValue: string) {
    const next = nextValue as TechAvailabilityStatus
    onError?.(null)
    startTransition(async () => {
      setOptimisticStatus(next)
      const result = await updateTechnicianAvailabilityAction({ availability_status: next })
      if (!result.success) {
        onError?.(result.error)
      }
    })
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {optimisticStatus === 'off_duty' && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isUpdating}
          onClick={() => handleStatusChange('available')}
          className="border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
        >
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Start Shift</span>
        </Button>
      )}

      <div className="flex items-center gap-2">
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-muted-foreground whitespace-nowrap"
        >
          Availability:
        </label>
        <Select
          value={optimisticStatus}
          onValueChange={handleStatusChange}
          disabled={isUpdating}
        >
          <SelectTrigger
            id={selectId}
            aria-label="Availability status"
            className="w-[155px] bg-card"
          >
            <div className="flex items-center gap-2 min-w-0">
              {isUpdating && (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" aria-hidden="true" />
              )}
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {TECH_AVAILABILITY_STATUSES.map((opt) => (
              <SelectItem key={opt} value={opt}>
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={cn('h-2 w-2 rounded-full', TECH_AVAILABILITY_DOT_CLASSES[opt])}
                  />
                  <span>{getTechAvailabilityLabel(opt)}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
