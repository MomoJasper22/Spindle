import * as React from 'react'
import { CalendarClock, CheckCircle2, CreditCard, Wrench } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatPHP } from '@/lib/formatters'

interface TechnicianKpiCardsProps {
  todaysAppointments: number
  assignedActiveJobs: number
  completedThisMonth: number
  pendingCollectionsPhp: number
}

export function TechnicianKpiCards({
  todaysAppointments,
  assignedActiveJobs,
  completedThisMonth,
  pendingCollectionsPhp,
}: TechnicianKpiCardsProps) {
  const cards = [
    {
      label: "Today's Appointments",
      value: String(todaysAppointments),
      sub: 'Scheduled PHT slots today',
      icon: CalendarClock,
      accent: 'text-sky-700 bg-sky-50',
    },
    {
      label: 'Assigned Active Jobs',
      value: String(assignedActiveJobs),
      sub: 'Open jobs in your queue',
      icon: Wrench,
      accent: 'text-indigo-700 bg-indigo-50',
    },
    {
      label: 'Completed This Month',
      value: String(completedThisMonth),
      sub: 'Resolved service tickets',
      icon: CheckCircle2,
      accent: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Pending Collections',
      value: formatPHP(pendingCollectionsPhp),
      sub: 'Unsettled PHP balances',
      icon: CreditCard,
      accent: 'text-orange-700 bg-orange-50',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((item) => {
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
  )
}
