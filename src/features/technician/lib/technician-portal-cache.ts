'use client'

import type { TechAvailabilityStatus } from '@/lib/constants'
import type {
  ActivityLogRow,
  AppointmentDetailView,
  PaymentDetailView,
  RepairDetailView,
} from '@/types/database'

export interface TechnicianPortalCacheData {
  techId?: string
  techDisplayName?: string
  availabilityStatus?: TechAvailabilityStatus
  repairs?: RepairDetailView[]
  appointments?: AppointmentDetailView[]
  payments?: PaymentDetailView[]
  activityLogs?: ActivityLogRow[]
}

let store: TechnicianPortalCacheData | null = null
const listeners = new Set<() => void>()

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

export function subscribeTechnicianCache(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getTechnicianCacheSnapshot(): TechnicianPortalCacheData | null {
  return store
}

export function getTechnicianCacheServerSnapshot(): TechnicianPortalCacheData | null {
  return null
}

export function seedTechnicianCache(patch: TechnicianPortalCacheData): void {
  if (patch.techId && store?.techId && store.techId !== patch.techId) {
    store = null
  }

  const next: TechnicianPortalCacheData = { ...(store ?? {}) }
  if (patch.techId !== undefined) next.techId = patch.techId
  if (patch.techDisplayName !== undefined) next.techDisplayName = patch.techDisplayName
  if (patch.availabilityStatus !== undefined) next.availabilityStatus = patch.availabilityStatus
  if (patch.repairs !== undefined) next.repairs = patch.repairs
  if (patch.appointments !== undefined) next.appointments = patch.appointments
  if (patch.payments !== undefined) next.payments = patch.payments
  if (patch.activityLogs !== undefined) next.activityLogs = patch.activityLogs

  store = next
  emitChange()
}
