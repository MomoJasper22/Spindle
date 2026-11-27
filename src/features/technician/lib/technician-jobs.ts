import { TIME_SLOTS, type TechAvailabilityStatus } from '@/lib/constants'
import { getManilaTodayISO } from '@/lib/formatters'
import { getTicketPaymentSummary, type TicketPaymentSummary } from '@/lib/payments'
import type {
  AppointmentDetailView,
  PaymentDetailView,
  RepairDetailView,
} from '@/types/database'

export const TECH_AVAILABILITY_DOT_CLASSES: Record<TechAvailabilityStatus, string> = {
  available: 'bg-emerald-500',
  busy: 'bg-amber-500',
  lunch: 'bg-sky-500',
  off_duty: 'bg-slate-400',
}

export interface TechnicianJobItem {
  ticket: RepairDetailView
  appointment: AppointmentDetailView | null
  payments: PaymentDetailView[]
  paymentSummary: TicketPaymentSummary
  visitDate: string
  timeSlotOrder: number
  isToday: boolean
  isActive: boolean
  needsPayment: boolean
  needsSlotConfirm: boolean
}

function getSlotOrder(slot?: string | null): number {
  if (!slot) return TIME_SLOTS.length
  const index = (TIME_SLOTS as readonly string[]).indexOf(slot)
  return index === -1 ? TIME_SLOTS.length : index
}

function pickPrimaryAppointment(list: AppointmentDetailView[]): AppointmentDetailView | null {
  if (list.length === 0) return null
  const active = list.filter((a) => a.appointment_status !== 'cancelled')
  const pool = active.length > 0 ? active : list
  return [...pool].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
}

export function buildTechnicianJobItems(
  repairs: RepairDetailView[],
  appointments: AppointmentDetailView[],
  payments: PaymentDetailView[],
  todayISO = getManilaTodayISO()
): TechnicianJobItem[] {
  const appointmentsByTicket = new Map<string, AppointmentDetailView[]>()
  for (const apt of appointments) {
    const existing = appointmentsByTicket.get(apt.ticket_id)
    if (existing) {
      existing.push(apt)
    } else {
      appointmentsByTicket.set(apt.ticket_id, [apt])
    }
  }

  const paymentsByTicket = new Map<string, PaymentDetailView[]>()
  for (const pay of payments) {
    const existing = paymentsByTicket.get(pay.ticket_id)
    if (existing) {
      existing.push(pay)
    } else {
      paymentsByTicket.set(pay.ticket_id, [pay])
    }
  }

  return repairs
    .map((ticket) => {
      const ticketAppointments = appointmentsByTicket.get(ticket.ticket_id) ?? []
      const appointment = pickPrimaryAppointment(ticketAppointments)
      const ticketPayments = paymentsByTicket.get(ticket.ticket_id) ?? []
      const paymentSummary = getTicketPaymentSummary(ticket)
      const visitDate = appointment?.scheduled_date ?? ticket.scheduled_date
      const isActive = !['completed', 'cancelled'].includes(ticket.status)
      const isToday =
        isActive &&
        visitDate === todayISO &&
        appointment?.appointment_status !== 'cancelled'
      const needsPayment =
        isActive &&
        (ticket.status === 'awaiting_payment' ||
          (paymentSummary.hasFinalBill && paymentSummary.payableRemaining > 0))
      const needsSlotConfirm =
        isActive &&
        Boolean(appointment) &&
        ['requested', 'rescheduled'].includes(appointment?.appointment_status ?? '')

      return {
        ticket,
        appointment,
        payments: ticketPayments,
        paymentSummary,
        visitDate,
        timeSlotOrder: getSlotOrder(appointment?.time_slot),
        isToday,
        isActive,
        needsPayment,
        needsSlotConfirm,
      }
    })
    .sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
      if (a.isToday !== b.isToday) return a.isToday ? -1 : 1
      if (a.visitDate !== b.visitDate) {
        return a.isActive
          ? a.visitDate.localeCompare(b.visitDate)
          : b.visitDate.localeCompare(a.visitDate)
      }
      if (a.timeSlotOrder !== b.timeSlotOrder) {
        return a.timeSlotOrder - b.timeSlotOrder
      }
      return b.ticket.created_at.localeCompare(a.ticket.created_at)
    })
}
