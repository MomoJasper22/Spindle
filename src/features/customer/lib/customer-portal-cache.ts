'use client'

import type {
  ActivityLogRow,
  AppointmentDetailView,
  CustomerApplianceRow,
  PaymentDetailView,
  RepairDetailView,
} from '@/types/database'

export interface CustomerPortalCacheData {
  customerId?: string
  firstName?: string
  defaultServiceAddress?: string
  appliances?: CustomerApplianceRow[]
  repairs?: RepairDetailView[]
  appointments?: AppointmentDetailView[]
  payments?: PaymentDetailView[]
  activityLogs?: ActivityLogRow[]
}

let store: CustomerPortalCacheData | null = null
const listeners = new Set<() => void>()

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

export function subscribeCustomerCache(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getCustomerCacheSnapshot(): CustomerPortalCacheData | null {
  return store
}

export function getCustomerCacheServerSnapshot(): CustomerPortalCacheData | null {
  return null
}

export function seedCustomerCache(patch: CustomerPortalCacheData): void {
  if (patch.customerId && store?.customerId && store.customerId !== patch.customerId) {
    store = null
  }

  const next: CustomerPortalCacheData = { ...(store ?? {}) }
  if (patch.customerId !== undefined) next.customerId = patch.customerId
  if (patch.firstName !== undefined) next.firstName = patch.firstName
  if (patch.defaultServiceAddress !== undefined) {
    next.defaultServiceAddress = patch.defaultServiceAddress
  }
  if (patch.appliances !== undefined) next.appliances = patch.appliances
  if (patch.repairs !== undefined) next.repairs = patch.repairs
  if (patch.appointments !== undefined) next.appointments = patch.appointments
  if (patch.payments !== undefined) next.payments = patch.payments
  if (patch.activityLogs !== undefined) next.activityLogs = patch.activityLogs

  store = next
  emitChange()
}
