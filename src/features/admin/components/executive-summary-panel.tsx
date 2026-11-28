import * as React from 'react'
import Link from 'next/link'
import { Activity, ArrowRight, CheckCircle2, Clock, CreditCard, ShieldCheck, Users, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { ScrollableList } from '@/components/shared/scrollable-list'
import { StatusBadge } from '@/components/shared/status-badge'
import { REPAIR_STATUSES } from '@/lib/constants'
import { formatManilaDateTime, formatPHP, humanizeLabel } from '@/lib/formatters'
import type {
  ActivityLogRow,
  CustomerApplianceRow,
  PaymentDetailView,
  RepairDetailView,
  TechnicianProfileRow,
  UserWithRole,
} from '@/types/database'

interface ExecutiveSummaryPanelProps {
  users: UserWithRole[]
  techProfiles: TechnicianProfileRow[]
  appliances: CustomerApplianceRow[]
  repairs: RepairDetailView[]
  payments: PaymentDetailView[]
  activityLogs: ActivityLogRow[]
}

export function ExecutiveSummaryPanel({
  users,
  techProfiles,
  appliances,
  repairs,
  payments,
  activityLogs,
}: ExecutiveSummaryPanelProps) {
  const verifiedRevenue = payments
    .filter((p) => p.payment_status === 'verified')
    .reduce((sum, p) => sum + Number(p.amount_php), 0)

  const activeRepairs = repairs.filter((r) => !['completed', 'cancelled'].includes(r.status)).length
  const pendingAppliances = appliances.filter(
    (a) => a.registration_status === 'pending_verification'
  ).length
  const pendingPayments = payments.filter((p) => p.payment_status === 'pending_verification').length
  const totalPendingVerifications = pendingAppliances + pendingPayments

  const activeTechUsers = users.filter(
    (u) => u.user_type_id === 'UTP-TECH' && u.is_active
  ).length
  const availableTechs = techProfiles.filter((tp) => tp.availability_status === 'available').length

  const kpis = [
    {
      label: 'Revenue Collected (PHP)',
      value: formatPHP(verifiedRevenue),
      sub: `${payments.filter((p) => p.payment_status === 'verified').length} verified payments`,
      icon: CreditCard,
      accent: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Active Repair Tickets',
      value: String(activeRepairs),
      sub: `${repairs.length} total tickets logged`,
      icon: Wrench,
      accent: 'text-primary bg-primary-tint',
    },
    {
      label: 'Technician Availability',
      value: `${availableTechs} / ${activeTechUsers}`,
      sub: 'Available vs. active field roster',
      icon: Users,
      accent: 'text-teal-700 bg-teal-50',
    },
    {
      label: 'Pending Verifications',
      value: String(totalPendingVerifications),
      sub: `${pendingAppliances} appliances · ${pendingPayments} payments`,
      icon: ShieldCheck,
      accent: 'text-amber-700 bg-amber-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="h-full">
              <CardContent standalone className="flex h-full items-start justify-between gap-3">
                <div className="flex h-full min-w-0 flex-col justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </p>
                  <div className="space-y-1">
                    <p className="font-heading text-2xl font-bold text-foreground tabular-nums truncate">
                      {item.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.accent}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {(pendingAppliances > 0 || pendingPayments > 0 || activeRepairs > 0) && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <span className="font-semibold text-foreground mr-2">Quick dispatch queues:</span>
          {pendingPayments > 0 && (
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/payments">
                <span>Verify Payments ({pendingPayments})</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          )}
          {pendingAppliances > 0 && (
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/appliances">
                <span>Verify Appliances ({pendingAppliances})</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          )}
          <Button asChild size="sm" variant="ghost">
            <Link href="/admin/repairs">
              <span>Manage Repairs ({activeRepairs} active)</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Tickets by Lifecycle Stage</span>
            </CardTitle>
            <CardDescription>Live distribution across all Philippine service branches.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {REPAIR_STATUSES.map((status) => {
              const count = repairs.filter((r) => r.status === status).length
              const pct = repairs.length > 0 ? Math.round((count / repairs.length) * 100) : 0
              return (
                <Link
                  key={status}
                  href={`/admin/repairs?status=${status}`}
                  aria-label={`View ${humanizeLabel(status)} repair tickets (${count})`}
                  className="group -mx-2 block space-y-1 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center justify-between text-xs">
                    <StatusBadge
                      status={status}
                      className="transition-transform group-hover:scale-[1.02]"
                    />
                    <span className="font-semibold text-foreground tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              )
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>System-Wide Activity Log</span>
            </CardTitle>
            <CardDescription>
              Audited operational changes across users, appliances, dispatches, and payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activityLogs.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No system activity yet"
                description="Operational events across customers, technicians, and administrators will appear here once transactions begin."
              />
            ) : (
              <ScrollableList
                regionLabel="System-Wide Activity Log"
                maxHeightClassName="max-h-[26rem]"
                className="pr-1"
              >
                <ul className="divide-y divide-border">
                  {activityLogs.map((log) => (
                    <li
                      key={log.log_id}
                      className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium text-foreground">{log.description}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-mono text-[11px]">{log.entity_id}</span> &middot;{' '}
                          {humanizeLabel(log.entity_type)} &middot; {humanizeLabel(log.action)}
                        </p>
                      </div>
                      <time
                        dateTime={log.created_at}
                        className="shrink-0 text-xs text-muted-foreground tabular-nums"
                      >
                        {formatManilaDateTime(log.created_at)}
                      </time>
                    </li>
                  ))}
                </ul>
              </ScrollableList>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
