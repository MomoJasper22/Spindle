import * as React from 'react'
import { Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { formatManilaDateTime, humanizeLabel } from '@/lib/formatters'
import type { ActivityLogRow } from '@/types/database'

interface ActivityFeedProps {
  logs: ActivityLogRow[]
  title?: string
  description?: string
  audience?: 'customer' | 'staff'
}

export function ActivityFeed({
  logs,
  title = 'Recent Updates',
  description = 'Latest updates on your appliances, visits, and payments.',
  audience = 'customer',
}: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>{title}</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No updates yet"
            description="Updates appear here as soon as you add an appliance, book a visit, or send a payment."
          />
        ) : (
          <ul className="divide-y divide-dashed divide-border">
            {logs.map((log) => (
              <li
                key={log.log_id}
                className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium text-foreground">{log.description}</p>
                  {audience === 'staff' && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono text-[11px]">{log.entity_id}</span> &middot;{' '}
                      {humanizeLabel(log.action)}
                    </p>
                  )}
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
        )}
      </CardContent>
    </Card>
  )
}
