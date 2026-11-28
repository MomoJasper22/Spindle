import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import {
  getCustomerActivityLogs,
  getCustomerAppliances,
  getCustomerAppointments,
  getCustomerPayments,
  getCustomerRepairs,
} from '@/lib/data/portal-data'
import { CustomerHomeView } from '@/features/customer/components/customer-home-view'
import {
  CustomerCacheSeeder,
  CustomerHomeFallback,
} from '@/features/customer/components/customer-cached-fallbacks'

export const metadata: Metadata = {
  title: 'Home',
}

async function CustomerHomeContent() {
  const profile = await requireRole('customer')

  const [appliances, repairs, appointments, payments, activityLogs] = await Promise.all([
    getCustomerAppliances(profile.user_id),
    getCustomerRepairs(profile.user_id),
    getCustomerAppointments(profile.user_id),
    getCustomerPayments(profile.user_id),
    getCustomerActivityLogs(profile.user_id, 5),
  ])

  return (
    <>
      <CustomerCacheSeeder
        customerId={profile.user_id}
        firstName={profile.first_name}
        appliances={appliances}
        repairs={repairs}
        appointments={appointments}
        payments={payments}
        activityLogs={activityLogs}
      />
      <CustomerHomeView
        firstName={profile.first_name}
        appliances={appliances}
        repairs={repairs}
        appointments={appointments}
        payments={payments}
        activityLogs={activityLogs}
      />
    </>
  )
}

export default function CustomerHomePage() {
  return (
    <Suspense fallback={<CustomerHomeFallback />}>
      <CustomerHomeContent />
    </Suspense>
  )
}
