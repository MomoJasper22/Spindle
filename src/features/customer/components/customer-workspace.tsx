'use client'

import * as React from 'react'
import { CalendarClock, CreditCard, Laptop, LayoutGrid, Plus, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
  ActivityLogRow,
  AppointmentDetailView,
  CustomerApplianceRow,
  PaymentDetailView,
  RepairDetailView,
} from '@/types/database'
import { ActivityFeed } from './activity-feed'
import { AppliancesPanel } from './appliances-panel'
import { CustomerOverviewCards } from './overview-cards'
import { PaymentsPanel } from './payments-panel'
import { RepairsPanel } from './repairs-panel'

interface CustomerWorkspaceProps {
  customerFirstName: string
  defaultServiceAddress: string
  appliances: CustomerApplianceRow[]
  repairs: RepairDetailView[]
  appointments: AppointmentDetailView[]
  payments: PaymentDetailView[]
  activityLogs: ActivityLogRow[]
}

export function CustomerWorkspace({
  customerFirstName,
  defaultServiceAddress,
  appliances,
  repairs,
  appointments,
  payments,
  activityLogs,
}: CustomerWorkspaceProps) {
  const [activeTab, setActiveTab] = React.useState('overview')

  const activeRepairsCount = repairs.filter(
    (r) => !['completed', 'cancelled'].includes(r.status)
  ).length

  const upcomingAppointmentsCount = appointments.filter(
    (a) => !['completed', 'cancelled'].includes(a.appointment_status)
  ).length

  const totalPaidPhp = payments
    .filter((p) => p.payment_status === 'verified')
    .reduce((sum, p) => sum + Number(p.amount_php), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Magandang araw, {customerFirstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your registered appliances, service bookings, and PHP billing from one workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" onClick={() => setActiveTab('appliances')}>
            <Laptop className="h-4 w-4" aria-hidden="true" />
            <span>My Appliances</span>
          </Button>
          <Button onClick={() => setActiveTab('repairs')}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Book Repair</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="appliances">
            <Laptop className="h-4 w-4" aria-hidden="true" />
            <span>My Appliances ({appliances.length})</span>
          </TabsTrigger>
          <TabsTrigger value="repairs">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            <span>Repairs &amp; Appointments ({repairs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            <span>Payments ({payments.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <CustomerOverviewCards
            applianceCount={appliances.filter((a) => a.registration_status !== 'cancelled').length}
            activeRepairsCount={activeRepairsCount}
            upcomingAppointmentsCount={upcomingAppointmentsCount}
            totalPaidPhp={totalPaidPhp}
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ActivityFeed logs={activityLogs} />
            </div>

            <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-xs">
              <h2 className="font-heading text-base font-semibold text-foreground">
                Quick Service Actions
              </h2>
              <p className="text-sm text-muted-foreground">
                Jump directly to registering a new unit, scheduling a dispatch, or settling a bill.
              </p>
              <div className="space-y-2.5 pt-2">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab('appliances')}
                >
                  <Laptop className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>Register an Appliance</span>
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab('repairs')}
                >
                  <Wrench className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>Schedule Repair Dispatch</span>
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab('payments')}
                >
                  <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>Record Digital / Cash Payment</span>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appliances">
          <AppliancesPanel appliances={appliances} />
        </TabsContent>

        <TabsContent value="repairs">
          <RepairsPanel
            appliances={appliances}
            repairs={repairs}
            appointments={appointments}
            defaultServiceAddress={defaultServiceAddress}
            onGoToAppliances={() => setActiveTab('appliances')}
          />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsPanel repairs={repairs} payments={payments} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
