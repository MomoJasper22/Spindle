import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const signupSchema = z
  .object({
    first_name: z
      .string()
      .trim()
      .min(2, 'First name must be at least 2 characters.')
      .max(100, 'First name cannot exceed 100 characters.'),
    middle_name: z
      .string()
      .trim()
      .max(100, 'Middle name cannot exceed 100 characters.')
      .optional()
      .or(z.literal('')),
    last_name: z
      .string()
      .trim()
      .min(2, 'Last name must be at least 2 characters.')
      .max(100, 'Last name cannot exceed 100 characters.'),
    email: z
      .string()
      .trim()
      .email('Enter a valid email address.')
      .max(255, 'Email cannot exceed 255 characters.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
      .regex(/[0-9]/, 'Password must contain at least one number.'),
    confirm_password: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match.',
    path: ['confirm_password'],
  })

export type SignupInput = z.infer<typeof signupSchema>

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required.'),
    new_password: z
      .string()
      .min(8, 'New password must be at least 8 characters.')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
      .regex(/[0-9]/, 'Password must contain at least one number.'),
    confirm_new_password: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    message: 'New passwords do not match.',
    path: ['confirm_new_password'],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
