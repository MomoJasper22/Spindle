'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import type { RepairDetailView } from '@/types/database'
import { PipelinePanel } from './pipeline-panel'

const DiagnosticDrawer = dynamic(
  () => import('./diagnostic-drawer').then((m) => m.DiagnosticDrawer),
  { ssr: false }
)

interface TechnicianJobsViewProps {
  repairs: RepairDetailView[]
}

export function TechnicianJobsView({ repairs }: TechnicianJobsViewProps) {
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null)
  const selectedTicket = repairs.find((r) => r.ticket_id === selectedTicketId) ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Assigned Jobs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update repair progression, record diagnostics, and capture on-site collections.
        </p>
      </div>

      <PipelinePanel
        repairs={repairs}
        onSelectTicket={(ticket) => setSelectedTicketId(ticket.ticket_id)}
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
