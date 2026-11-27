import { TIME_SLOTS, type AppointmentStatus, type RepairPriority, type RepairStatus, type TimeSlot } from '@/lib/constants'
import { formatAddress } from '@/lib/formatters'
import type { AppointmentDetailView, RepairDetailView } from '@/types/database'

export interface TechnicianJobItem {
  ticketId: string
  repair: RepairDetailView
  appointment: AppointmentDetailView | null
  scheduledDate: string
  timeSlot: TimeSlot | null
  serviceAddress: string
  appointmentStatus: AppointmentStatus | null
  arrivalRemarks: string | null
  isActive: boolean
  isCompleted: boolean
  isCancelled: boolean
  needsVisitConfirmation: boolean
}

const PRIORITY_RANK: Record<RepairPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
}

const TIME_SLOT_RANK: Record<string, number> = Object.fromEntries(
  TIME_SLOTS.map((slot, idx) => [slot, idx])
)

function pickPrimaryAppointment(
  candidates: AppointmentDetailView[]
): AppointmentDetailView | null {
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  const sorted = [...candidates].sort((a, b) => {
    const aActive = !['cancelled', 'completed'].includes(a.appointment_status) ? 0 : 1
    const bActive = !['cancelled', 'completed'].includes(b.appointment_status) ? 0 : 1
    if (aActive !== bActive) return aActive - bActive

    const aCancelled = a.appointment_status === 'cancelled' ? 1 : 0
    const bCancelled = b.appointment_status === 'cancelled' ? 1 : 0
    if (aCancelled !== bCancelled) return aCancelled - bCancelled

    return b.created_at.localeCompare(a.created_at)
  })

  return sorted[0] ?? null
}

/**
 * Joins technician repair tickets with their active/latest scheduled appointment
 * and sorts chronologically by scheduled date, time slot, and priority.
 */
export function buildTechnicianJobItems(
  repairs: RepairDetailView[],
  appointments: AppointmentDetailView[]
): TechnicianJobItem[] {
  const apptsByTicket = new Map<string, AppointmentDetailView[]>()
  for (const apt of appointments) {
    const list = apptsByTicket.get(apt.ticket_id)
    if (list) {
      list.push(apt)
    } else {
      apptsByTicket.set(apt.ticket_id, [apt])
    }
  }

  const items: TechnicianJobItem[] = repairs.map((repair) => {
    const appointment = pickPrimaryAppointment(apptsByTicket.get(repair.ticket_id) ?? [])
    const scheduledDate = appointment?.scheduled_date ?? repair.scheduled_date
    const timeSlot = appointment?.time_slot ?? null
    const formattedCustomerAddress = formatAddress({
      street: repair.customer_address_street,
      barangay: repair.customer_address_barangay,
      city: repair.customer_address_city,
      province: repair.customer_address_province,
      zip: repair.customer_address_zip_code,
    })
    const serviceAddress =
      appointment?.service_address?.trim() ||
      (formattedCustomerAddress !== '—' ? formattedCustomerAddress : 'Address on file')
    const appointmentStatus = appointment?.appointment_status ?? null
    const isCompleted = repair.status === 'completed'
    const isCancelled = repair.status === 'cancelled'
    const isActive = !isCompleted && !isCancelled
    const needsVisitConfirmation =
      isActive &&
      (appointmentStatus === 'requested' || appointmentStatus === 'rescheduled')

    return {
      ticketId: repair.ticket_id,
      repair,
      appointment,
      scheduledDate,
      timeSlot,
      serviceAddress,
      appointmentStatus,
      arrivalRemarks: appointment?.remarks ?? null,
      isActive,
      isCompleted,
      isCancelled,
      needsVisitConfirmation,
    }
  })

  return items.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
    const dateCompare = a.scheduledDate.localeCompare(b.scheduledDate)
    if (dateCompare !== 0) return dateCompare

    const aSlot = a.timeSlot ? (TIME_SLOT_RANK[a.timeSlot] ?? 99) : 99
    const bSlot = b.timeSlot ? (TIME_SLOT_RANK[b.timeSlot] ?? 99) : 99
    if (aSlot !== bSlot) return aSlot - bSlot

    return PRIORITY_RANK[a.repair.priority] - PRIORITY_RANK[b.repair.priority]
  })
}

export function getTechnicianStageIndex(status: RepairStatus): number {
  if (status === 'pending' || status === 'confirmed' || status === 'assigned') return 0
  if (status === 'in_progress') return 1
  if (status === 'awaiting_payment') return 2
  if (status === 'completed') return 3
  return -1
}

export function getTechnicianStageLabel(status: RepairStatus): string {
  switch (status) {
    case 'pending':
    case 'confirmed':
    case 'assigned':
      return 'Scheduled'
    case 'in_progress':
      return 'In Progress'
    case 'awaiting_payment':
      return 'Awaiting Payment'
    case 'completed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
  }
}
