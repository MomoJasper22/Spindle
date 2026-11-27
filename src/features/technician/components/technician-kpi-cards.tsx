import * as React from 'react'
import Link from 'next/link'
import { CalendarClock, CreditCard, Wrench } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatPHP } from '@/lib/formatters'

interface TechnicianKpiCardsProps {
  todaysVisits: number
  unconfirmedToday: number
  assignedActiveJobs: number
  pendingCollectionsPhp: number
  pendingCollectionCount: number
}

export function TechnicianKpiCards({
  todaysVisits,
  unconfirmedToday,
  assignedActiveJobs,
  pendingCollectionsPhp,
  pendingCollectionCount,
}: TechnicianKpiCardsProps) {
  const cards = [
    {
      label: "Today's Visits",
      value: String(todaysVisits),
      sub:
        todaysVisits === 0
          ? 'No slots booked today'
          : unconfirmedToday > 0
            ? `${unconfirmedToday} waiting confirmation`
            : 'All today slots confirmed',
      href: '/technician/jobs?tab=today',
      icon: CalendarClock,
      accent: 'text-sky-700 bg-sky-50',
    },
    {
      label: 'Active Jobs',
      value: String(assignedActiveJobs),
      sub: assignedActiveJobs === 0 ? 'Queue clear' : 'Open tickets assigned to you',
      href: '/technician/jobs?tab=active',
      icon: Wrench,
      accent: 'text-indigo-700 bg-indigo-50',
    },
    {
      label: 'To Collect',
      value: formatPHP(pendingCollectionsPhp),
      sub:
        pendingCollectionCount === 0
          ? 'No unpaid bills right now'
          : `Across ${pendingCollectionCount} active ticket${pendingCollectionCount === 1 ? '' : 's'}`,
      href: '/technician/jobs?tab=needs_payment',
      icon: CreditCard,
      accent: 'text-orange-700 bg-orange-50',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.label}
            href={item.href}
            className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/20">
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
          </Link>
        )
      })}
    </div>
  )
}
