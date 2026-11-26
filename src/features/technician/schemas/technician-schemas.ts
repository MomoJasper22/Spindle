import { z } from 'zod'
import {
  PAYMENT_METHODS,
  SERVICE_BRANCHES,
  TECH_AVAILABILITY_STATUSES,
  TIME_SLOTS,
} from '@/lib/constants'
import { validatePHPhone } from '@/lib/formatters'

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

export const technicianProfileSchema = z.object({
  first_name: z.string().trim().min(2, 'First name is required.').max(100),
  middle_name: z.string().trim().max(100).optional().or(z.literal('')),
  last_name: z.string().trim().min(2, 'Last name is required.').max(100),
  phone: z
    .string()
    .trim()
    .refine(validatePHPhone, 'Enter a valid Philippine phone number (+63 9XX XXX XXXX or 09XX XXX XXXX).'),
  branch_location: z.enum(SERVICE_BRANCHES, { message: 'Select assigned branch.' }),
  address_street: z.string().trim().min(3, 'Street address is required.').max(150),
  address_barangay: z.string().trim().min(2, 'Barangay is required.').max(100),
  address_city: z.string().trim().min(2, 'City is required.').max(100),
  address_province: z.string().trim().min(2, 'Province is required.').max(100),
  address_zip_code: z.string().trim().regex(/^\d{4}$/, 'Enter a valid 4-digit ZIP code.'),
  specializations: z.array(z.string()).min(1, 'Select at least one appliance specialization.'),
  certification_no: z.string().trim().min(2, 'Certification number is required.').max(100),
  max_daily_jobs: z
    .number({ message: 'Enter daily job capacity.' })
    .int()
    .min(1, 'Minimum 1 job/day.')
    .max(15, 'Maximum 15 jobs/day.'),
  availability_status: z.enum(TECH_AVAILABILITY_STATUSES),
})

export type TechnicianProfileInput = z.infer<typeof technicianProfileSchema>
