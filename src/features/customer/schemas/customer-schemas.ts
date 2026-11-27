import { z } from 'zod'
import {
  APPLIANCE_CATEGORIES,
  APPLIANCE_ICON_KEYS,
  PAYMENT_METHODS,
  REPAIR_PRIORITIES,
  SERVICE_BRANCHES,
  TIME_SLOTS,
} from '@/lib/constants'
import { validatePHPhone } from '@/lib/formatters'

export const applianceSchema = z.object({
  brand: z.string().trim().min(2, 'Enter the appliance brand.').max(50),
  category: z.enum(APPLIANCE_CATEGORIES, { message: 'Select an appliance category.' }),
  icon: z.enum(APPLIANCE_ICON_KEYS, { message: 'Select an appliance icon.' }).optional(),
  model_number: z.string().trim().min(2, 'Enter the model number.').max(100),
  serial_number: z.string().trim().min(3, 'Enter the serial number.').max(100),
  purchase_date: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
})

export type ApplianceInput = z.infer<typeof applianceSchema>

export const repairBookingSchema = z.object({
  appliance_id: z.string().trim().min(1, 'Select a registered appliance.'),
  service_type: z.enum(['diagnostic', 'repair', 'maintenance_cleaning', 'installation'], {
    message: 'Select a service type.',
  }),
  priority: z.enum(REPAIR_PRIORITIES),
  issue_description: z
    .string()
    .trim()
    .min(10, 'Describe the appliance issue in at least 10 characters.')
    .max(1000),
  scheduled_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a preferred service date.'),
  time_slot: z.enum(TIME_SLOTS, { message: 'Select a preferred time slot.' }),
  service_address: z
    .string()
    .trim()
    .min(8, 'Enter the full Philippine service address.')
    .max(500),
  remarks: z.string().trim().max(500).optional().or(z.literal('')),
})

export type RepairBookingInput = z.infer<typeof repairBookingSchema>

export const rescheduleAppointmentSchema = z.object({
  appointment_id: z.string().trim().min(1),
  scheduled_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a new date.'),
  time_slot: z.enum(TIME_SLOTS, { message: 'Select a time slot.' }),
  remarks: z.string().trim().max(500).optional().or(z.literal('')),
})

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>

export const customerPaymentSchema = z
  .object({
    ticket_id: z.string().trim().min(1, 'Select a repair ticket.'),
    payment_method: z.enum(PAYMENT_METHODS, { message: 'Select a payment method.' }),
    amount_php: z
      .number({ message: 'Enter a valid PHP amount.' })
      .positive('Payment amount must be greater than PHP 0.00.')
      .max(1000000, 'Amount exceeds single transaction limit.'),
    installment_no: z
      .number({ message: 'Enter a whole installment number.' })
      .int('Installment number must be a whole number.')
      .min(1, 'Installment number must be at least 1.')
      .nullable(),
    reference_no: z
      .string()
      .trim()
      .max(100, 'Reference number cannot exceed 100 characters.')
      .optional()
      .or(z.literal('')),
    remarks: z.string().trim().max(500).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.payment_method !== 'Cash' && !data.reference_no?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reference_no'],
        message: 'Enter the confirmation or reference number for your transfer.',
      })
    }
  })

export type CustomerPaymentInput = z.infer<typeof customerPaymentSchema>

export const customerProfileSchema = z.object({
  first_name: z.string().trim().min(2, 'First name is required.').max(100),
  middle_name: z.string().trim().max(100).optional().or(z.literal('')),
  last_name: z.string().trim().min(2, 'Last name is required.').max(100),
  phone: z
    .string()
    .trim()
    .refine(validatePHPhone, 'Enter a valid Philippine phone number (+63 9XX XXX XXXX or 09XX XXX XXXX).'),
  branch_location: z.enum(SERVICE_BRANCHES, { message: 'Select your preferred branch.' }),
  address_street: z.string().trim().min(3, 'Street address is required.').max(150),
  address_barangay: z.string().trim().min(2, 'Barangay is required.').max(100),
  address_city: z.string().trim().min(2, 'City or municipality is required.').max(100),
  address_province: z.string().trim().min(2, 'Province is required.').max(100),
  address_zip_code: z.string().trim().regex(/^\d{4}$/, 'Enter a valid 4-digit PH postal code.'),
})

export type CustomerProfileInput = z.infer<typeof customerProfileSchema>
