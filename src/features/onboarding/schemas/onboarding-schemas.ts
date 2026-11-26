import { z } from 'zod'
import { SERVICE_BRANCHES, type UserRole } from '@/lib/constants'
import { validatePHPhone } from '@/lib/formatters'

const baseOnboardingSchema = z.object({
  phone: z
    .string()
    .trim()
    .refine(validatePHPhone, 'Enter a valid Philippine phone number (+63 9XX XXX XXXX or 09XX XXX XXXX).'),
  branch_location: z.enum(SERVICE_BRANCHES, {
    message: 'Select your nearest Spindle service branch.',
  }),
  address_street: z
    .string()
    .trim()
    .min(3, 'Enter your street, unit, or building address.')
    .max(150, 'Street address cannot exceed 150 characters.'),
  address_barangay: z
    .string()
    .trim()
    .min(2, 'Enter your barangay.')
    .max(100, 'Barangay cannot exceed 100 characters.'),
  address_city: z
    .string()
    .trim()
    .min(2, 'Enter your city or municipality.')
    .max(100, 'City cannot exceed 100 characters.'),
  address_province: z
    .string()
    .trim()
    .min(2, 'Enter your province.')
    .max(100, 'Province cannot exceed 100 characters.'),
  address_zip_code: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'Enter a valid 4-digit Philippine ZIP code.'),
  nickname: z
    .string()
    .trim()
    .max(60, 'Nickname cannot exceed 60 characters.')
    .optional()
    .or(z.literal('')),
  proposed_specializations: z.array(z.string()).optional(),
  certification_no: z
    .string()
    .trim()
    .max(100, 'Certification number cannot exceed 100 characters.')
    .optional()
    .or(z.literal('')),
})

export const onboardingSchema = baseOnboardingSchema

export function getOnboardingSchema(role: UserRole) {
  if (role !== 'technician') {
    return baseOnboardingSchema
  }
  return baseOnboardingSchema.superRefine((data, ctx) => {
    const nickname = data.nickname?.trim() ?? ''
    if (nickname.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nickname'],
        message: 'Enter a display nickname (at least 2 characters).',
      })
    }
    const cert = data.certification_no?.trim() ?? ''
    if (cert.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['certification_no'],
        message: 'Enter your TESDA or technical certification number.',
      })
    }
  })
}

export type OnboardingInput = z.infer<typeof onboardingSchema>
