'use client'

import * as React from 'react'
import { Activity, CalendarClock, CreditCard, Wrench } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { ActivityFeed } from '@/features/customer/components/activity-feed'
import { formatManilaDate, formatPHP, getManilaTodayISO } from '@/lib/formatters'
import type {
  ActivityLogRow,
  AppointmentDetailView,
  PaymentDetailView,
  RepairDetailView,
} from '@/types/database'
import { DiagnosticDrawer } from './diagnostic-drawer'
import { PipelinePanel } from './pipeline-panel'
import { SchedulePanel } from './schedule-panel'
import { TechnicianKpiCards } from './technician-kpi-cards'

interface TechnicianWorkspaceProps {
  techFirstName: string
  availabilityStatus: string
  repairs: RepairDetailView[]
  appointments: AppointmentDetailView[]
  payments: PaymentDetailView[]
  activityLogs: ActivityLogRow[]
}

export function TechnicianWorkspace({
  techFirstName,
  availabilityStatus,
  repairs,
  appointments,
  payments,
  activityLogs,
}: TechnicianWorkspaceProps) {
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null)
  const selectedTicket = repairs.find((r) => r.ticket_id === selectedTicketId) ?? null

  const todayISO = getManilaTodayISO()
  const currentMonthPrefix = todayISO.slice(0, 7)

  const todaysAppointments = appointments.filter(
    (a) => a.scheduled_date === todayISO && a.appointment_status !== 'cancelled'
  ).length

  const assignedActiveJobs = repairs.filter(
    (r) => !['completed', 'cancelled'].includes(r.status)
  ).length

  const completedThisMonth = repairs.filter(
    (r) =>
      r.status === 'completed' &&
      (r.completed_at?.startsWith(currentMonthPrefix) || r.updated_at.startsWith(currentMonthPrefix))
  ).length

  const pendingCollectionsPhp = repairs
    .filter((r) => !['completed', 'cancelled'].includes(r.status))
    .reduce((sum, r) => {
      const target = Number(r.final_cost_php ?? r.estimated_cost_php ?? 0)
      const paid = Number(r.verified_paid_php ?? 0)
      return sum + Math.max(0, target - paid)
    }, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Field Dispatch Console, {techFirstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage assigned repair jobs, field diagnostics, scheduled time slots, and on-site collections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Status:</span>
          <StatusBadge status={availabilityStatus} />
        </div>
      </div>

      <TechnicianKpiCards
        todaysAppointments={todaysAppointments}
        assignedActiveJobs={assignedActiveJobs}
        completedThisMonth={completedThisMonth}
        pendingCollectionsPhp={pendingCollectionsPhp}
      />

      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">
            <Wrench className="h-4 w-4" aria-hidden="true" />
            <span>Repair Pipeline ({repairs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            <span>Schedule &amp; Agenda ({appointments.length})</span>
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            <span>Field Collections ({payments.length})</span>
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4" aria-hidden="true" />
            <span>Recent Activity</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <PipelinePanel
            repairs={repairs}
            onSelectTicket={(ticket) => setSelectedTicketId(ticket.ticket_id)}
          />
        </TabsContent>

        <TabsContent value="schedule">
          <SchedulePanel appointments={appointments} />
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>On-Site Payment Collections</CardTitle>
              <CardDescription>
                Payments recorded by you in the field or tied to your assigned repair tickets. Open any ticket in the Pipeline tab to capture a new payment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <EmptyState
                  icon={CreditCard}
                  title="No field collections recorded"
                  description="Open any assigned ticket from the Repair Pipeline to record Cash, GCash, Maya, or QR Ph payments collected on-site."
                />
              ) : (
                <Table regionLabel="Technician payment collections">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Method &amp; Ref</TableHead>
                      <TableHead>Amount (PHP)</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((pay) => (
                      <TableRow key={pay.payment_id}>
                        <TableCell className="font-mono text-xs font-semibold">
                          {pay.payment_id}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-primary">
                          {pay.ticket_id}
                        </TableCell>
                        <TableCell>
                          {pay.customer_first_name} {pay.customer_last_name}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{pay.payment_method}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {pay.reference_no || 'Cash receipt'}
                          </p>
                        </TableCell>
                        <TableCell className="font-semibold tabular-nums">
                          {formatPHP(pay.amount_php)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatManilaDate(pay.payment_date)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={pay.payment_status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <ActivityFeed
            logs={activityLogs}
            title="Technician Activity Log"
            description="Recent diagnostics, status updates, schedule confirmations, and payment logs."
          />
        </TabsContent>
      </Tabs>

      <DiagnosticDrawer
        key={selectedTicket?.ticket_id ?? 'closed'}
        ticket={selectedTicket}
        open={Boolean(selectedTicket)}
        onOpenChange={(open) => {
          if (!open) setSelectedTicketId(null)
        }}
      />
    </div>
  )
}
