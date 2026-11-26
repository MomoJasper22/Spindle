import * as React from 'react'
import { CalendarClock, CheckCircle2, Wrench, Laptop } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatPHP } from '@/lib/formatters'

interface CustomerOverviewCardsProps {
  applianceCount: number
  activeRepairsCount: number
  upcomingAppointmentsCount: number
  totalPaidPhp: number
}

export function CustomerOverviewCards({
  applianceCount,
  activeRepairsCount,
  upcomingAppointmentsCount,
  totalPaidPhp,
}: CustomerOverviewCardsProps) {
  const stats = [
    {
      label: 'Registered Appliances',
      value: String(applianceCount),
      sub: 'Units on your profile',
      icon: Laptop,
      accent: 'text-primary bg-primary-tint',
    },
    {
      label: 'Active Repairs',
      value: String(activeRepairsCount),
      sub: 'In progress or queued',
      icon: Wrench,
      accent: 'text-indigo-700 bg-indigo-50',
    },
    {
      label: 'Upcoming Appointments',
      value: String(upcomingAppointmentsCount),
      sub: 'Scheduled field visits',
      icon: CalendarClock,
      accent: 'text-sky-700 bg-sky-50',
    },
    {
      label: 'Total Paid (Verified)',
      value: formatPHP(totalPaidPhp),
      sub: 'Settled PHP payments',
      icon: CheckCircle2,
      accent: 'text-emerald-700 bg-emerald-50',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="font-heading text-2xl font-bold text-foreground tabular-nums truncate">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.accent}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
