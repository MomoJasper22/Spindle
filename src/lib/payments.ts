import type { RepairDetailView } from '@/types/database'

export interface TicketPaymentSummary {
  targetTotal: number
  verifiedPaid: number
  pendingPaid: number
  remainingBalance: number
  payableRemaining: number
  hasFinalBill: boolean
  isSettled: boolean
  isCoveredByPending: boolean
  canAcceptOnlinePayment: boolean
  canRecordFieldPayment: boolean
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Computes consistent PHP payment balances across Customer, Technician, and Admin portals.
 * Accounts for both verified and pending_verification payments to prevent double charges.
 */
export function getTicketPaymentSummary(
  ticket: Pick<
    RepairDetailView,
    'status' | 'estimated_cost_php' | 'final_cost_php' | 'verified_paid_php' | 'pending_paid_php'
  >
): TicketPaymentSummary {
  const hasFinalBill = ticket.final_cost_php !== null && ticket.final_cost_php !== undefined
  const targetTotal = roundCurrency(Number(ticket.final_cost_php ?? ticket.estimated_cost_php ?? 0))
  const verifiedPaid = roundCurrency(Number(ticket.verified_paid_php ?? 0))
  const pendingPaid = roundCurrency(Number(ticket.pending_paid_php ?? 0))

  const remainingBalance = roundCurrency(Math.max(0, targetTotal - verifiedPaid))
  const payableRemaining = roundCurrency(Math.max(0, targetTotal - verifiedPaid - pendingPaid))

  const isSettled = targetTotal > 0 && verifiedPaid >= targetTotal
  const isCoveredByPending = !isSettled && targetTotal > 0 && verifiedPaid + pendingPaid >= targetTotal

  const isTicketActive = ticket.status !== 'cancelled' && ticket.status !== 'completed'
  const canAcceptOnlinePayment = isTicketActive && hasFinalBill && payableRemaining > 0
  const canRecordFieldPayment =
    isTicketActive && (hasFinalBill ? payableRemaining > 0 : true)

  return {
    targetTotal,
    verifiedPaid,
    pendingPaid,
    remainingBalance,
    payableRemaining,
    hasFinalBill,
    isSettled,
    isCoveredByPending,
    canAcceptOnlinePayment,
    canRecordFieldPayment,
  }
}
