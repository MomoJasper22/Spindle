import Link from 'next/link'
import { ArrowRight, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formatManilaDate, formatPHP } from '@/lib/formatters'
import type { PaymentDetailView } from '@/types/database'

interface CollectionsPanelProps {
  payments: PaymentDetailView[]
}

export function CollectionsPanel({ payments }: CollectionsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Field Collections
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            On-site payments recorded by you or tied to your assigned repair tickets.
          </p>
        </div>

        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/technician/jobs">
            <span>Record in Assigned Jobs</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>On-Site Payment Collections</CardTitle>
          <CardDescription>
            Open any assigned ticket on the Assigned Jobs page to capture a new Cash, GCash, Maya, or QR Ph payment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No field collections recorded"
              description="Open any assigned ticket from Assigned Jobs to record on-site collections."
            />
          ) : (
            <>
              <ScrollableList regionLabel="Technician payment collections list" className="md:hidden p-0.5 pr-1">
                <div className="space-y-3">
                  {payments.map((pay) => (
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
                          {pay.payment_method} &middot; {pay.reference_no || 'Cash'}
                        </span>
                        <span>{formatManilaDate(pay.payment_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollableList>

              <div className="hidden md:block">
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
                        <TableCell>
                          <p className="font-mono text-xs text-primary">{pay.ticket_id}</p>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
