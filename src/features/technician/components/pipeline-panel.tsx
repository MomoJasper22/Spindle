'use client'

import * as React from 'react'
import { Columns3, MapPin, Phone, Search, Table2, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { REPAIR_PRIORITIES } from '@/lib/constants'
import { formatManilaDate, formatPHPhone, formatPHP, humanizeLabel } from '@/lib/formatters'
import type { RepairDetailView } from '@/types/database'

interface PipelinePanelProps {
  repairs: RepairDetailView[]
  onSelectTicket: (ticket: RepairDetailView) => void
}

const PIPELINE_STAGES = [
  { key: 'assigned', title: 'Assigned / Confirmed', statuses: ['confirmed', 'assigned'] },
  { key: 'in_progress', title: 'In Progress', statuses: ['in_progress'] },
  { key: 'awaiting_payment', title: 'Awaiting Payment', statuses: ['awaiting_payment'] },
  { key: 'completed', title: 'Completed', statuses: ['completed'] },
] as const

export function PipelinePanel({ repairs, onSelectTicket }: PipelinePanelProps) {
  const [viewMode, setViewMode] = React.useState<'kanban' | 'table'>('kanban')
  const [search, setSearch] = React.useState('')
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  const filtered = repairs.filter((r) => {
    if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      r.ticket_id.toLowerCase().includes(q) ||
      `${r.customer_first_name} ${r.customer_last_name}`.toLowerCase().includes(q) ||
      r.appliance_brand.toLowerCase().includes(q) ||
      r.appliance_model_number.toLowerCase().includes(q) ||
      (r.customer_address_city ?? '').toLowerCase().includes(q) ||
      (r.customer_address_barangay ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Repair Pipeline &amp; Job Queue</CardTitle>
          <CardDescription>
            Inspect assigned customer repairs, update stage progression, and record diagnostics or on-site payments.
          </CardDescription>
        </div>

        <div className="inline-flex rounded-lg border border-border bg-muted p-1 self-start">
          <Button
            type="button"
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <Columns3 className="h-4 w-4" aria-hidden="true" />
            <span>Pipeline</span>
          </Button>
          <Button
            type="button"
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <Table2 className="h-4 w-4" aria-hidden="true" />
            <span>Table</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticket, customer, barangay, model..."
              aria-label="Search assigned jobs"
              className="pl-9"
            />
          </div>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Filter by priority">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {REPAIR_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {humanizeLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter by status">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {repairs.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No assigned jobs yet"
            description="Repair tickets assigned to you by dispatch administrators will appear in your pipeline queue."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching jobs"
            description="No assigned repair tickets match your current search or filter settings."
          />
        ) : viewMode === 'kanban' ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PIPELINE_STAGES.map((stage) => {
              const stageTickets = filtered.filter((t) =>
                (stage.statuses as readonly string[]).includes(t.status)
              )
              return (
                <section
                  key={stage.key}
                  aria-label={stage.title}
                  className="flex flex-col rounded-xl border border-border bg-slate-50/80 p-3"
                >
                  <header className="mb-3 flex items-center justify-between px-1">
                    <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {stage.title}
                    </h3>
                    <span className="rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-foreground border border-border tabular-nums">
                      {stageTickets.length}
                    </span>
                  </header>

                  <div className="space-y-2.5 flex-1">
                    {stageTickets.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-muted-foreground">
                        No jobs in stage
                      </p>
                    ) : (
                      stageTickets.map((ticket) => (
                        <button
                          key={ticket.ticket_id}
                          type="button"
                          onClick={() => onSelectTicket(ticket)}
                          className="w-full rounded-lg border border-border bg-card p-3.5 text-left shadow-2xs transition-colors hover:border-primary/50 hover:bg-primary-tint/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-semibold text-primary">
                              {ticket.ticket_id}
                            </span>
                            <StatusBadge status={ticket.priority} showIcon={false} />
                          </div>
                          <p className="mt-1.5 text-sm font-semibold text-foreground">
                            {ticket.customer_first_name} {ticket.customer_last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ticket.appliance_brand} &middot; {ticket.appliance_model_number}
                          </p>
                          <div className="mt-2.5 space-y-1 text-[11px] text-muted-foreground">
                            <p className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                              <span>
                                {[ticket.customer_address_barangay, ticket.customer_address_city]
                                  .filter(Boolean)
                                  .join(', ') || 'Address on file'}
                              </span>
                            </p>
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
                              <span>{formatPHPhone(ticket.customer_phone)}</span>
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs">
                            <span className="text-muted-foreground">
                              {formatManilaDate(ticket.scheduled_date)}
                            </span>
                            <span className="font-semibold text-foreground tabular-nums">
                              {ticket.final_cost_php !== null
                                ? formatPHP(ticket.final_cost_php)
                                : formatPHP(ticket.estimated_cost_php)}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <Table regionLabel="Assigned repair tickets">
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Customer &amp; Location</TableHead>
                <TableHead>Appliance</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status &amp; Priority</TableHead>
                <TableHead>Cost (PHP)</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ticket) => (
                <TableRow key={ticket.ticket_id}>
                  <TableCell className="font-mono text-xs font-semibold text-primary">
                    {ticket.ticket_id}
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-foreground">
                      {ticket.customer_first_name} {ticket.customer_last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatPHPhone(ticket.customer_phone)} &middot;{' '}
                      {[ticket.customer_address_barangay, ticket.customer_address_city]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {ticket.appliance_brand} {ticket.appliance_model_number}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {ticket.appliance_serial_number}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {formatManilaDate(ticket.scheduled_date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={ticket.status} />
                      <StatusBadge status={ticket.priority} showIcon={false} />
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums text-xs">
                    <p>Est: {formatPHP(ticket.estimated_cost_php)}</p>
                    <p className="font-semibold">
                      Final: {ticket.final_cost_php !== null ? formatPHP(ticket.final_cost_php) : '—'}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => onSelectTicket(ticket)}>
                      Open Drawer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
