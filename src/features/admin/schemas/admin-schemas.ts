import { z } from 'zod'
import {
  ADMIN_FEATURE_KEYS,
  APPLIANCE_CATEGORIES,
  APPLIANCE_ICON_KEYS,
  APPOINTMENT_STATUSES,
  PAYMENT_METHODS,
  REPAIR_PRIORITIES,
  REPAIR_STATUSES,
  SERVICE_BRANCHES,
  TECH_AVAILABILITY_STATUSES,
  TIME_SLOTS,
} from '@/lib/constants'
import { validatePHPhone } from '@/lib/formatters'

const adminFeatureEnum = z.enum(ADMIN_FEATURE_KEYS)

export const adminCreateUserSchema = z.object({
  first_name: z.string().trim().min(2, 'First name is required.').max(100),
  middle_name: z.string().trim().max(100).optional().or(z.literal('')),
  last_name: z.string().trim().min(2, 'Last name is required.').max(100),
  email: z.string().trim().email('Valid email is required.').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Za-z]/, 'Must contain a letter.')
    .regex(/[0-9]/, 'Must contain a number.'),
  role: z.enum(['customer', 'technician', 'admin']),
  phone: z
    .string()
    .trim()
    .refine(validatePHPhone, 'Enter a valid Philippine phone (+63 9XX XXX XXXX or 09XX XXX XXXX).'),
  branch_location: z.enum(SERVICE_BRANCHES),
  address_street: z.string().trim().min(3, 'Street address is required.').max(150),
  address_barangay: z.string().trim().min(2, 'Barangay is required.').max(100),
  address_city: z.string().trim().min(2, 'City is required.').max(100),
  address_province: z.string().trim().min(2, 'Province is required.').max(100),
  address_zip_code: z.string().trim().regex(/^\d{4}$/, 'Enter a 4-digit PH postal code.'),
  specializations: z.array(z.string()).optional(),
  certification_no: z.string().trim().max(100).optional().or(z.literal('')),
  max_daily_jobs: z.number().int().min(1).max(15).optional(),
  admin_permissions: z.array(adminFeatureEnum).nullable().optional(),
})

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>

export const adminUpdateUserSchema = z.object({
  user_id: z.string().trim().min(1),
  first_name: z.string().trim().min(2).max(100),
  middle_name: z.string().trim().max(100).optional().or(z.literal('')),
  last_name: z.string().trim().min(2).max(100),
  role: z.enum(['customer', 'technician', 'admin']),
  phone: z
    .string()
    .trim()
    .refine(validatePHPhone, 'Enter a valid Philippine phone number.'),
  branch_location: z.enum(SERVICE_BRANCHES),
  address_street: z.string().trim().min(3).max(150),
  address_barangay: z.string().trim().min(2).max(100),
  address_city: z.string().trim().min(2).max(100),
  address_province: z.string().trim().min(2).max(100),
  address_zip_code: z.string().trim().regex(/^\d{4}$/),
  is_active: z.boolean(),
  admin_permissions: z.array(adminFeatureEnum).nullable().optional(),
})

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>

export const adminTechProfileSchema = z.object({
  technician_id: z.string().trim().min(1),
  branch_location: z.enum(SERVICE_BRANCHES),
  specializations: z.array(z.string()).min(1, 'Select at least one specialization.'),
  certification_no: z.string().trim().min(2, 'Certification number required.').max(100),
  availability_status: z.enum(TECH_AVAILABILITY_STATUSES),
  max_daily_jobs: z.number().int().min(1).max(15),
})

export type AdminTechProfileInput = z.infer<typeof adminTechProfileSchema>

export const adminAssignTechSchema = z.object({
  ticket_id: z.string().trim().min(1, 'Select a repair ticket.'),
  technician_id: z.string().trim().min(1, 'Select a technician.'),
  scheduled_date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a scheduled date.'),
  time_slot: z.enum(TIME_SLOTS, { message: 'Select a time slot.' }),
})

export type AdminAssignTechInput = z.infer<typeof adminAssignTechSchema>

export const adminUpdateAppointmentSchema = z.object({
  appointment_id: z.string().trim().min(1, 'Appointment ID is required.'),
  appointment_status: z.enum(APPOINTMENT_STATUSES),
  scheduled_date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid date.'),
  time_slot: z.enum(TIME_SLOTS),
  remarks: z.string().trim().max(500).optional().or(z.literal('')),
})

export type AdminUpdateAppointmentInput = z.infer<typeof adminUpdateAppointmentSchema>

export const adminApplianceSchema = z.object({
  customer_id: z.string().trim().min(1, 'Select a customer.'),
  brand: z.string().trim().min(2).max(50),
  category: z.enum(APPLIANCE_CATEGORIES),
  icon: z.enum(APPLIANCE_ICON_KEYS).optional(),
  model_number: z.string().trim().min(2).max(100),
  serial_number: z.string().trim().min(3).max(100),
  purchase_date: z.string().trim().optional().or(z.literal('')),
  registration_status: z.enum(['pending_verification', 'verified', 'cancelled']),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
})

export type AdminApplianceInput = z.infer<typeof adminApplianceSchema>

export const adminCreateRepairSchema = z.object({
  customer_id: z.string().trim().min(1, 'Select a customer.'),
  appliance_id: z.string().trim().min(1, 'Select an appliance.'),
  service_type: z.enum(['diagnostic', 'repair', 'maintenance_cleaning', 'installation']),
  priority: z.enum(REPAIR_PRIORITIES),
  issue_description: z.string().trim().min(10, 'Describe the issue in at least 10 characters.').max(1000),
  scheduled_date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid scheduled date.'),
  time_slot: z.enum(TIME_SLOTS),
  service_address: z.string().trim().min(8).max(500),
  remarks: z.string().trim().max(500).optional().or(z.literal('')),
})

export type AdminCreateRepairInput = z.infer<typeof adminCreateRepairSchema>

export const adminUpdateRepairSchema = z.object({
  ticket_id: z.string().trim().min(1),
  status: z.enum(REPAIR_STATUSES),
  priority: z.enum(REPAIR_PRIORITIES),
  diagnostic_notes: z.string().trim().max(2000).optional().or(z.literal('')),
  estimated_cost_php: z.number().min(0).max(1000000),
  final_cost_php: z.number().min(0).max(1000000).nullable(),
})

export type AdminUpdateRepairInput = z.infer<typeof adminUpdateRepairSchema>

export const adminRecordPaymentSchema = z
  .object({
    ticket_id: z.string().trim().min(1, 'Select a ticket.'),
    payment_method: z.enum(PAYMENT_METHODS),
    amount_php: z.number().positive('Amount must be greater than PHP 0.00.').max(1000000),
    installment_no: z.number().int().min(1).nullable(),
    reference_no: z.string().trim().max(100).optional().or(z.literal('')),
    remarks: z.string().trim().max(500).optional().or(z.literal('')),
    verify_immediately: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.payment_method !== 'Cash' && !data.reference_no?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reference_no'],
        message: 'Reference number is required for non-cash payments.',
      })
    }
  })

export type AdminRecordPaymentInput = z.infer<typeof adminRecordPaymentSchema>

export const adminProfileSchema = z.object({
  first_name: z.string().trim().min(2).max(100),
  middle_name: z.string().trim().max(100).optional().or(z.literal('')),
  last_name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .refine(validatePHPhone, 'Enter a valid Philippine phone number.'),
  branch_location: z.enum(SERVICE_BRANCHES),
  address_street: z.string().trim().min(3).max(150),
  address_barangay: z.string().trim().min(2).max(100),
  address_city: z.string().trim().min(2).max(100),
  address_province: z.string().trim().min(2).max(100),
  address_zip_code: z.string().trim().regex(/^\d{4}$/),
})

export type AdminProfileInput = z.infer<typeof adminProfileSchema>
