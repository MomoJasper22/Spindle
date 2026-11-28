'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'
import {
  getTechnicianCacheServerSnapshot,
  getTechnicianCacheSnapshot,
  subscribeTechnicianCache,
} from '../lib/technician-portal-cache'
import { TechnicianJobsView } from './technician-jobs-view'
import { TechnicianOverviewView } from './technician-overview-view'

function useTechnicianPortalCache() {
  return React.useSyncExternalStore(
    subscribeTechnicianCache,
    getTechnicianCacheSnapshot,
    getTechnicianCacheServerSnapshot
  )
}

export function TechnicianDashboardFallback() {
  const cached = useTechnicianPortalCache()
  if (
    !cached?.techDisplayName ||
    !cached.availabilityStatus ||
    !cached.repairs ||
    !cached.appointments ||
    !cached.payments ||
    !cached.activityLogs
  ) {
    return <PortalContentSkeleton />
  }

  return (
    <TechnicianOverviewView
      techDisplayName={cached.techDisplayName}
      availabilityStatus={cached.availabilityStatus}
      repairs={cached.repairs}
      appointments={cached.appointments}
      payments={cached.payments}
      activityLogs={cached.activityLogs}
    />
  )
}

export function TechnicianJobsFallback() {
  const cached = useTechnicianPortalCache()
  if (
    !cached?.availabilityStatus ||
    !cached.repairs ||
    !cached.appointments ||
    !cached.payments
  ) {
    return <PortalContentSkeleton />
  }

  return (
    <TechnicianJobsView
      availabilityStatus={cached.availabilityStatus}
      repairs={cached.repairs}
      appointments={cached.appointments}
      payments={cached.payments}
    />
  )
}

export function TechnicianRouteFallback() {
  const pathname = usePathname()

  if (pathname === '/technician/dashboard') {
    return <TechnicianDashboardFallback />
  }
  if (pathname === '/technician/jobs') {
    return <TechnicianJobsFallback />
  }

  return <PortalContentSkeleton />
}
