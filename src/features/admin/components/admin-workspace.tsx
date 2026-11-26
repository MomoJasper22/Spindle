'use client'

import * as React from 'react'
import {
  CalendarClock,
  CreditCard,
  Laptop,
  LayoutDashboard,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
  ActivityLogRow,
  AppointmentDetailView,
  CustomerApplianceRow,
  PaymentDetailView,
  RepairDetailView,
  TechnicianProfileRow,
  UserWithRole,
} from '@/types/database'
import { AdminAppliancesPanel } from './appliances-panel'
import { AdminAppointmentsPanel } from './appointments-panel'
import { ExecutiveSummaryPanel } from './executive-summary-panel'
import { AdminPaymentsPanel } from './payments-panel'
import { AdminRepairsPanel } from './repairs-panel'
import { TechniciansPanel } from './technicians-panel'
import { UsersPanel } from './users-panel'

interface AdminWorkspaceProps {
  adminFirstName: string
  currentAdminId: string
  users: UserWithRole[]
  techProfiles: TechnicianProfileRow[]
  appliances: CustomerApplianceRow[]
  repairs: RepairDetailView[]
  appointments: AppointmentDetailView[]
  payments: PaymentDetailView[]
  activityLogs: ActivityLogRow[]
}

export function AdminWorkspace({
  adminFirstName,
  currentAdminId,
  users,
  techProfiles,
  appliances,
  repairs,
  appointments,
  payments,
  activityLogs,
}: AdminWorkspaceProps) {
  const [activeTab, setActiveTab] = React.useState('summary')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Operations Command Hub, {adminFirstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Executive oversight across Philippine branches, technicians, appliance verification, dispatch locks, and PHP billing.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="summary">
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            <span>Executive Summary</span>
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>Users ({users.length})</span>
          </TabsTrigger>
          <TabsTrigger value="technicians">
            <UserCog className="h-4 w-4" aria-hidden="true" />
            <span>Technicians ({techProfiles.length})</span>
          </TabsTrigger>
          <TabsTrigger value="appliances">
            <Laptop className="h-4 w-4" aria-hidden="true" />
            <span>Appliances ({appliances.length})</span>
          </TabsTrigger>
          <TabsTrigger value="repairs">
            <Wrench className="h-4 w-4" aria-hidden="true" />
            <span>Repairs ({repairs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            <span>Appointments ({appointments.length})</span>
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            <span>Payments ({payments.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <ExecutiveSummaryPanel
            users={users}
            techProfiles={techProfiles}
            appliances={appliances}
            repairs={repairs}
            payments={payments}
            activityLogs={activityLogs}
          />
        </TabsContent>

        <TabsContent value="users">
          <UsersPanel users={users} currentAdminId={currentAdminId} />
        </TabsContent>

        <TabsContent value="technicians">
          <TechniciansPanel users={users} techProfiles={techProfiles} repairs={repairs} />
        </TabsContent>

        <TabsContent value="appliances">
          <AdminAppliancesPanel appliances={appliances} users={users} />
        </TabsContent>

        <TabsContent value="repairs">
          <AdminRepairsPanel repairs={repairs} users={users} appliances={appliances} />
        </TabsContent>

        <TabsContent value="appointments">
          <AdminAppointmentsPanel appointments={appointments} users={users} />
        </TabsContent>

        <TabsContent value="payments">
          <AdminPaymentsPanel payments={payments} repairs={repairs} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
