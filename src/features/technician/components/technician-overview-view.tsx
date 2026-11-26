'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarClock, MapPin, Phone, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { ActivityFeed } from '@/features/customer/components/activity-feed'
import { formatManilaDate, formatPHPhone, formatPHP, getManilaTodayISO } from '@/lib/formatters'
import type {
  ActivityLogRow,
  AppointmentDetailView,
  RepairDetailView,
} from '@/types/database'
import { DiagnosticDrawer } from './diagnostic-drawer'
import { TechnicianKpiCards } from './technician-kpi-cards'

interface TechnicianOverviewViewProps {
  techFirstName: string
  availabilityStatus: string
  repairs: RepairDetailView[]
  appointments: AppointmentDetailView[]
  activityLogs: ActivityLogRow[]
}

export function TechnicianOverviewView({
  techFirstName,
  availabilityStatus,
  repairs,
  appointments,
  activityLogs,
}: TechnicianOverviewViewProps) {
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null)
  const selectedTicket = repairs.find((r) => r.ticket_id === selectedTicketId) ?? null

  const todayISO = getManilaTodayISO()
  const currentMonthPrefix = todayISO.slice(0, 7)

  const todaysVisits = appointments.filter(
    (a) => a.scheduled_date === todayISO && a.appointment_status !== 'cancelled'
  )

  const activeJobs = repairs.filter((r) => !['completed', 'cancelled'].includes(r.status))

  const completedThisMonth = repairs.filter(
    (r) =>
      r.status === 'completed' &&
      (r.completed_at?.startsWith(currentMonthPrefix) || r.updated_at.startsWith(currentMonthPrefix))
  ).length

  const pendingCollectionsPhp = activeJobs.reduce((sum, r) => {
    const target = Number(r.final_cost_php ?? r.estimated_cost_php ?? 0)
    const paid = Number(r.verified_paid_php ?? 0)
    return sum + Math.max(0, target - paid)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Field Overview, {techFirstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Today&apos;s dispatched visits, active jobs, and recent field logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Status:</span>
          <StatusBadge status={availabilityStatus} />
        </div>
      </div>

      <TechnicianKpiCards
        todaysAppointments={todaysVisits.length}
        assignedActiveJobs={activeJobs.length}
        completedThisMonth={completedThisMonth}
        pendingCollectionsPhp={pendingCollectionsPhp}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Agenda */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Today&apos;s Visits</span>
              </CardTitle>
              <CardDescription>Dispatched home visits for today</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/technician/schedule">
                <span>Full Schedule</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {todaysVisits.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="No visits scheduled for today"
                description="Check Upcoming in your Schedule page for your next assigned slots."
              />
            ) : (
              <div className="divide-y divide-dashed divide-border">
                {todaysVisits.slice(0, 4).map((apt) => (
                  <div key={apt.appointment_id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-primary">{apt.time_slot}</span>
                      <StatusBadge status={apt.appointment_status} />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {apt.customer_first_name} {apt.customer_last_name} &middot;{' '}
                      <span className="font-mono text-xs text-muted-foreground">{apt.ticket_id}</span>
                    </p>
                    <p className="flex items-start gap-1 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="line-clamp-1">{apt.service_address}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Active Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wrench className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Active Repair Queue</span>
              </CardTitle>
              <CardDescription>Tap any job to update diagnostics or collect payment</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/technician/jobs">
                <span>All Jobs</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activeJobs.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="No active jobs assigned"
                description="New repair tickets assigned to you will appear here automatically."
              />
            ) : (
              <div className="space-y-3">
                {activeJobs.slice(0, 4).map((ticket) => (
                  <button
                    key={ticket.ticket_id}
                    type="button"
                    onClick={() => setSelectedTicketId(ticket.ticket_id)}
                    className="w-full rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">
                        {ticket.ticket_id}
                      </span>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {ticket.customer_first_name} {ticket.customer_last_name} &mdash;{' '}
                      {ticket.appliance_brand} {ticket.appliance_model_number}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" aria-hidden="true" />
                        {formatPHPhone(ticket.customer_phone)}
                      </span>
                      <span className="font-medium tabular-nums text-foreground">
                        {formatManilaDate(ticket.scheduled_date)} &middot;{' '}
                        {formatPHP(ticket.final_cost_php ?? ticket.estimated_cost_php)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ActivityFeed
        logs={activityLogs.slice(0, 8)}
        audience="staff"
        title="Recent Field Activity"
        description="Ticket updates, appointment status changes, and on-site collection logs."
      />

      <DiagnosticDrawer
        ticket={selectedTicket}
        open={Boolean(selectedTicket)}
        onOpenChange={(open) => {
          if (!open) setSelectedTicketId(null)
        }}
      />
    </div>
  )
}
