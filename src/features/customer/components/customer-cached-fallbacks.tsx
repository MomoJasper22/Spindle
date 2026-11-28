'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'
import {
  getCustomerCacheServerSnapshot,
  getCustomerCacheSnapshot,
  seedCustomerCache,
  subscribeCustomerCache,
  type CustomerPortalCacheData,
} from '../lib/customer-portal-cache'
import { AppliancesPanel } from './appliances-panel'
import { CustomerHomeView } from './customer-home-view'
import { PaymentsPanel } from './payments-panel'
import { RepairsPanel } from './repairs-panel'

function useCustomerPortalCache() {
  return React.useSyncExternalStore(
    subscribeCustomerCache,
    getCustomerCacheSnapshot,
    getCustomerCacheServerSnapshot
  )
}

export function CustomerCacheSeeder(props: CustomerPortalCacheData) {
  const {
    customerId,
    firstName,
    defaultServiceAddress,
    appliances,
    repairs,
    appointments,
    payments,
    activityLogs,
  } = props

  React.useEffect(() => {
    seedCustomerCache({
      customerId,
      firstName,
      defaultServiceAddress,
      appliances,
      repairs,
      appointments,
      payments,
      activityLogs,
    })
  }, [
    customerId,
    firstName,
    defaultServiceAddress,
    appliances,
    repairs,
    appointments,
    payments,
    activityLogs,
  ])

  return null
}

export function CustomerHomeFallback() {
  const cached = useCustomerPortalCache()
  if (
    !cached?.firstName ||
    !cached.appliances ||
    !cached.repairs ||
    !cached.appointments ||
    !cached.payments ||
    !cached.activityLogs
  ) {
    return <PortalContentSkeleton />
  }

  return (
    <CustomerHomeView
      firstName={cached.firstName}
      appliances={cached.appliances}
      repairs={cached.repairs}
      appointments={cached.appointments}
      payments={cached.payments}
      activityLogs={cached.activityLogs}
    />
  )
}

export function CustomerAppliancesFallback() {
  const cached = useCustomerPortalCache()
  if (!cached?.appliances) {
    return <PortalContentSkeleton />
  }

  return <AppliancesPanel appliances={cached.appliances} />
}

export function CustomerBookingsFallback() {
  const cached = useCustomerPortalCache()
  if (!cached?.appliances || !cached.repairs || !cached.appointments) {
    return <PortalContentSkeleton />
  }

  return (
    <RepairsPanel
      appliances={cached.appliances}
      repairs={cached.repairs}
      appointments={cached.appointments}
      defaultServiceAddress={cached.defaultServiceAddress ?? ''}
    />
  )
}

export function CustomerPaymentsFallback() {
  const cached = useCustomerPortalCache()
  if (!cached?.repairs || !cached.payments) {
    return <PortalContentSkeleton />
  }

  return <PaymentsPanel repairs={cached.repairs} payments={cached.payments} />
}

export function CustomerRouteFallback() {
  const pathname = usePathname()

  if (pathname === '/customer/home') {
    return <CustomerHomeFallback />
  }
  if (pathname === '/customer/appliances') {
    return <CustomerAppliancesFallback />
  }
  if (pathname === '/customer/bookings') {
    return <CustomerBookingsFallback />
  }
  if (pathname === '/customer/payments') {
    return <CustomerPaymentsFallback />
  }

  return <PortalContentSkeleton />
}
