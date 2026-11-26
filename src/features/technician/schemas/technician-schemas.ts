import { z } from 'zod'
import {
  PAYMENT_METHODS,
  TECH_AVAILABILITY_STATUSES,
  TIME_SLOTS,
} from '@/lib/constants'

export const technicianRepairUpdateSchema = z.object({
  ticket_id: z.string().trim().min(1),
  status: z.enum(['confirmed', 'assigned', 'in_progress', 'awaiting_payment', 'completed']),
  diagnostic_notes: z.string().trim().max(2000).optional().or(z.literal('')),
  estimated_cost_php: z
    .number({ message: 'Enter a valid estimated cost in PHP.' })
    .min(0, 'Estimated cost cannot be negative.')
    .max(1000000),
  final_cost_php: z
    .number({ message: 'Enter a valid final cost in PHP.' })
    .min(0, 'Final cost cannot be negative.')
    .max(1000000)
    .nullable(),
})

export type TechnicianRepairUpdateInput = z.infer<typeof technicianRepairUpdateSchema>

export const technicianPaymentSchema = z.object({
  ticket_id: z.string().trim().min(1, 'Select a ticket.'),
  payment_method: z.enum(PAYMENT_METHODS, { message: 'Select a payment method.' }),
  amount_php: z
    .number({ message: 'Enter a valid PHP amount.' })
    .positive('Amount must be greater than PHP 0.00.')
    .max(1000000),
  installment_no: z
    .number({ message: 'Enter a whole installment number.' })
    .int()
    .min(1)
    .nullable(),
  reference_no: z.string().trim().max(100).optional().or(z.literal('')),
  remarks: z.string().trim().max(500).optional().or(z.literal('')),
})

export type TechnicianPaymentInput = z.infer<typeof technicianPaymentSchema>

export const technicianAppointmentActionSchema = z.object({
  appointment_id: z.string().trim().min(1),
  appointment_status: z.enum(['confirmed', 'rescheduled', 'completed']),
  scheduled_date: z.string().trim().min(1),
  time_slot: z.enum(TIME_SLOTS),
  remarks: z.string().trim().max(500).optional().or(z.literal('')),
})

export type TechnicianAppointmentActionInput = z.infer<typeof technicianAppointmentActionSchema>

export const technicianNicknameSchema = z.object({
  nickname: z
    .string()
    .trim()
    .max(60, 'Nickname cannot exceed 60 characters.')
    .optional()
    .or(z.literal('')),
})

export type TechnicianNicknameInput = z.infer<typeof technicianNicknameSchema>

export const technicianAvailabilitySchema = z.object({
  availability_status: z.enum(TECH_AVAILABILITY_STATUSES),
})

export type TechnicianAvailabilityInput = z.infer<typeof technicianAvailabilitySchema>
