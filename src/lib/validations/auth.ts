import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be under 100 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters')
      .max(128, 'Password must be under 128 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters')
      .max(128, 'Password must be under 128 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const organizationSetupSchema = z.object({
  name: z
    .string()
    .min(1, 'Business name is required')
    .max(200, 'Business name must be under 200 characters'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be under 100 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug may only contain lowercase letters, numbers, and hyphens',
    ),
  timezone: z.string().min(1, 'Timezone is required'),
  currencyCode: z.string().min(1, 'Currency is required').length(3, 'Currency code must be 3 characters'),
  countryCode: z.string().min(1, 'Country is required').length(2, 'Country code must be 2 characters'),
});

export const branchSetupSchema = z.object({
  name: z
    .string()
    .min(1, 'Branch name is required')
    .max(200, 'Branch name must be under 200 characters'),
  code: z
    .string()
    .min(1, 'Branch code is required')
    .max(20, 'Branch code must be under 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Code may only contain uppercase letters, numbers, and hyphens'),
  address: z.string().max(500, 'Address must be under 500 characters').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone must be under 20 characters').optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type OrganizationSetupInput = z.infer<typeof organizationSetupSchema>;
export type BranchSetupInput = z.infer<typeof branchSetupSchema>;
