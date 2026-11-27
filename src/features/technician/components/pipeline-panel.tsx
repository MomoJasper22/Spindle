'use client'

import * as React from 'react'
import {
  ArrowRight,
  CalendarClock,
  CreditCard,
  MapPin,
  Phone,
  Search,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { ScrollableList } from '@/components/shared/scrollable-list'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatManilaDate, formatPHPhone, formatPHP, getManilaTodayISO, humanizeLabel } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { PaymentDetailView } from '@/types/database'
import type { TechnicianJobItem } from '../lib/technician-jobs'

export type JobsTabKey = 'active' | 'today' | 'needs_payment' | 'completed' | 'collections'

interface PipelinePanelProps {
  jobs: TechnicianJobItem[]
  payments: PaymentDetailView[]
  activeTab: JobsTabKey
  onTabChange: (tab: JobsTabKey) => void
  onSelectJob: (job: TechnicianJobItem) => void
  onSelectTicketId: (ticketId: string) => void
}

function getBillingBadge(job: TechnicianJobItem): { label: string; tone: string } {
  const { paymentSummary, ticket } = job
  if (ticket.status === 'cancelled') {
    return { label: 'Cancelled', tone: 'text-muted-foreground' }
  }
  if (paymentSummary.isSettled) {
    return { label: `Paid ${formatPHP(paymentSummary.verifiedPaid)}`, tone: 'text-emerald-700' }
  }
  if (paymentSummary.isCoveredByPending) {
    return { label: 'Pending verify', tone: 'text-amber-700' }
  }
  if (paymentSummary.hasFinalBill && paymentSummary.payableRemaining > 0) {
    return { label: `Collect ${formatPHP(paymentSummary.payableRemaining)}`, tone: 'text-orange-700' }
  }
  if (ticket.estimated_cost_php > 0) {
    return { label: `Est. ${formatPHP(ticket.estimated_cost_php)}`, tone: 'text-muted-foreground' }
  }
  return { label: 'Final bill needed', tone: 'text-muted-foreground' }
}

export function PipelinePanel({
  jobs,
  payments,
  activeTab,
  onTabChange,
  onSelectJob,
  onSelectTicketId,
}: PipelinePanelProps) {
  const [search, setSearch] = React.useState('')
  const todayISO = getManilaTodayISO()
  const q = search.trim().toLowerCase()

  const activeJobs = jobs.filter((j) => j.isActive)
  const todayJobs = jobs.filter((j) => j.isToday)
  const needsPaymentJobs = jobs.filter((j) => j.needsPayment)
  const completedJobs = jobs.filter((j) => !j.isActive)

  const tabs: ReadonlyArray<{ key: JobsTabKey; label: string; count: number }> = [
    { key: 'active', label: 'Active', count: activeJobs.length },
    { key: 'today', label: 'Today', count: todayJobs.length },
    { key: 'needs_payment', label: 'Needs Payment', count: needsPaymentJobs.length },
    { key: 'completed', label: 'Completed', count: completedJobs.length },
    { key: 'collections', label: 'Collections', count: payments.length },
  ]

  const jobTabPool =
    activeTab === 'today'
      ? todayJobs
      : activeTab === 'needs_payment'
        ? needsPaymentJobs
        : activeTab === 'completed'
          ? completedJobs
          : activeJobs

  const filteredJobs = jobTabPool.filter((job) => {
    if (!q) return true
    const { ticket, appointment } = job
    return (
      ticket.ticket_id.toLowerCase().includes(q) ||
      `${ticket.customer_first_name} ${ticket.customer_last_name}`.toLowerCase().includes(q) ||
      ticket.appliance_brand.toLowerCase().includes(q) ||
      ticket.appliance_category.toLowerCase().includes(q) ||
      ticket.appliance_model_number.toLowerCase().includes(q) ||
      (ticket.customer_address_city ?? '').toLowerCase().includes(q) ||
      (ticket.customer_address_barangay ?? '').toLowerCase().includes(q) ||
      (appointment?.service_address ?? '').toLowerCase().includes(q)
    )
  })

  const filteredPayments = payments.filter((p) => {
    if (!q) return true
    return (
      p.payment_id.toLowerCase().includes(q) ||
      p.ticket_id.toLowerCase().includes(q) ||
      `${p.customer_first_name} ${p.customer_last_name}`.toLowerCase().includes(q) ||
      p.payment_method.toLowerCase().includes(q) ||
      (p.reference_no ?? '').toLowerCase().includes(q)
    )
  })

  const jobByTicketId = new Map(jobs.map((j) => [j.ticket.ticket_id, j]))

  return (
    <Card>
      <CardContent standalone className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="Job queue filters"
            className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-muted/60 p-1"
          >
            {tabs.map((tab) => {
              const selected = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  onClick={() => onTabChange(tab.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    selected
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'text-muted-foreground hover:bg-card hover:text-foreground'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                      selected
                        ? 'bg-white/20 text-white'
                        : 'bg-background text-muted-foreground'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="relative w-full lg:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === 'collections'
                  ? 'Search payment ID, ticket, customer...'
                  : 'Search ticket, customer, barangay...'
              }
              aria-label="Search jobs or collections"
              className="pl-9"
            />
          </div>
        </div>

        {activeTab === 'collections' ? (
          payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No collections recorded yet"
              description="Payments collected on-site or paid online for your assigned tickets will appear here."
            />
          ) : filteredPayments.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matching payments"
              description="Try another ticket ID, customer name, or reference number."
            />
          ) : (
            <>
              <ScrollableList regionLabel="Field payment collections list" className="md:hidden p-0.5 pr-1">
                <div className="space-y-3">
                  {filteredPayments.map((pay) => {
                    const hasJob = jobByTicketId.has(pay.ticket_id)
                    return (
                      <div
                        key={pay.payment_id}
                        className="rounded-xl border border-border bg-card p-4 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-heading text-base font-bold tabular-nums text-foreground">
                              {formatPHP(pay.amount_php)}
                            </p>
                            <p className="font-mono text-xs text-primary">{pay.ticket_id}</p>
                          </div>
                          <StatusBadge status={pay.payment_status} />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {pay.customer_first_name} {pay.customer_last_name}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
                          <span>
                            {pay.payment_method} &middot; {pay.reference_no || 'Cash'} &middot;{' '}
                            {formatManilaDate(pay.payment_date)}
                          </span>
                          {hasJob && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => onSelectTicketId(pay.ticket_id)}
                            >
                              <span>Open Job</span>
                              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollableList>

              <div className="hidden md:block">
                <Table regionLabel="Field payment collections">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket &amp; Unit</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Method &amp; Ref</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((pay) => {
                      const hasJob = jobByTicketId.has(pay.ticket_id)
                      return (
                        <TableRow key={pay.payment_id}>
                          <TableCell>
                            <p className="font-mono text-xs font-semibold text-primary">{pay.ticket_id}</p>
                            <p className="text-xs text-muted-foreground">
                              {pay.appliance_brand} {pay.appliance_model_number}
                            </p>
                          </TableCell>
                          <TableCell className="font-medium">
                            {pay.customer_first_name} {pay.customer_last_name}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{pay.payment_method}</p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {pay.reference_no || 'Cash'}
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
                          <TableCell className="text-right">
                            {hasJob && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => onSelectTicketId(pay.ticket_id)}
                              >
                                <span>Open Job</span>
                                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )
        ) : jobTabPool.length === 0 ? (
          <EmptyState
            icon={activeTab === 'today' ? CalendarClock : Wrench}
            title={
              activeTab === 'today'
                ? 'No visits scheduled for today'
                : activeTab === 'needs_payment'
                  ? 'No unpaid bills right now'
                  : activeTab === 'completed'
                    ? 'No completed jobs yet'
                    : 'No active jobs assigned'
            }
            description={
              activeTab === 'today'
                ? 'Switch to Active to check upcoming dispatches or open tickets.'
                : 'Assigned service visits and repairs will show up here automatically.'
            }
          />
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching jobs"
            description="No jobs match your search query in this tab."
          />
        ) : (
          <>
            {/* Mobile Stacked Cards (Clear Visual Hierarchy) */}
            <ScrollableList regionLabel="Assigned jobs list" className="md:hidden p-0.5 pr-1">
              <div className="space-y-3">
                {filteredJobs.map((job) => {
                  const { ticket, appointment } = job
                  const billing = getBillingBadge(job)
                  const dateLabel =
                    job.visitDate === todayISO ? 'Today' : formatManilaDate(job.visitDate)
                  const shortLocation =
                    [ticket.customer_address_barangay, ticket.customer_address_city]
                      .filter(Boolean)
                      .join(', ') || appointment?.service_address || 'Address on file'

                  return (
                    <div
                      key={ticket.ticket_id}
                      className="rounded-xl border border-border bg-card p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-primary">
                            {dateLabel}
                            {appointment?.time_slot ? ` · ${appointment.time_slot}` : ''}
                          </p>
                          <p className="mt-0.5 text-base font-bold text-foreground truncate">
                            {ticket.customer_first_name} {ticket.customer_last_name}
                          </p>
                          <p className="text-xs font-medium text-foreground/85 truncate">
                            {ticket.appliance_brand} {ticket.appliance_category} &middot;{' '}
                            {humanizeLabel(ticket.service_type)}
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {ticket.ticket_id} &middot; {ticket.appliance_model_number}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <StatusBadge status={ticket.status} />
                          {(ticket.priority === 'high' || ticket.priority === 'urgent') && (
                            <StatusBadge status={ticket.priority} showIcon={false} />
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{shortLocation}</span>
                        </span>
                        {ticket.customer_phone && (
                          <a
                            href={`tel:${ticket.customer_phone.replace(/\s+/g, '')}`}
                            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                          >
                            <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span>{formatPHPhone(ticket.customer_phone)}</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
                        <span className={cn('text-xs font-semibold tabular-nums', billing.tone)}>
                          {billing.label}
                        </span>
                        <Button type="button" size="sm" onClick={() => onSelectJob(job)}>
                          <span>Open Job</span>
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollableList>

            {/* Desktop Scannable Table */}
            <div className="hidden md:block">
              <Table regionLabel="Assigned repair jobs and visit windows">
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer &amp; Location</TableHead>
                    <TableHead>Visit Window</TableHead>
                    <TableHead>Appliance &amp; Service</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => {
                    const { ticket, appointment } = job
                    const billing = getBillingBadge(job)
                    const dateLabel =
                      job.visitDate === todayISO ? 'Today' : formatManilaDate(job.visitDate)
                    const shortLocation =
                      [ticket.customer_address_barangay, ticket.customer_address_city]
                        .filter(Boolean)
                        .join(', ') || appointment?.service_address || 'Address on file'

                    return (
                      <TableRow
                        key={ticket.ticket_id}
                        onClick={() => onSelectJob(job)}
                        className="cursor-pointer transition-colors hover:bg-muted/40"
                      >
                        <TableCell className="max-w-xs">
                          <p className="font-semibold text-foreground">
                            {ticket.customer_first_name} {ticket.customer_last_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{shortLocation}</p>
                          {ticket.customer_phone && (
                            <a
                              href={`tel:${ticket.customer_phone.replace(/\s+/g, '')}`}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                              <Phone className="h-3 w-3" aria-hidden="true" />
                              <span>{formatPHPhone(ticket.customer_phone)}</span>
                            </a>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <p className="font-semibold text-foreground">{dateLabel}</p>
                          <p className="text-xs font-medium text-primary">
                            {appointment?.time_slot ?? 'No slot set'}
                          </p>
                          {job.needsSlotConfirm && appointment && (
                            <div className="mt-1">
                              <StatusBadge status={appointment.appointment_status} />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-foreground">
                            {ticket.appliance_brand} {ticket.appliance_category}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {humanizeLabel(ticket.service_type)} &middot;{' '}
                            <span className="font-mono">{ticket.ticket_id}</span>
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <StatusBadge status={ticket.status} />
                            {(ticket.priority === 'high' || ticket.priority === 'urgent') && (
                              <StatusBadge status={ticket.priority} showIcon={false} />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={cn('text-xs font-semibold tabular-nums', billing.tone)}>
                          {billing.label}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button type="button" size="sm" onClick={() => onSelectJob(job)}>
                            <span>Open Job</span>
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
