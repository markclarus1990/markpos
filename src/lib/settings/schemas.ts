import { z } from 'zod';

export const VALID_CURRENCIES = ['PHP', 'USD', 'SGD', 'AUD', 'JPY', 'EUR', 'GBP', 'MYR', 'IDR', 'THB', 'VND', 'KRW', 'CNY', 'HKD', 'TWD', 'NZD', 'CAD', 'CHF', 'SEK', 'NOK', 'DKK'] as const;

export const VALID_TIMEZONES = [
  'Asia/Manila',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Bangkok',
  'Asia/Jakarta',
  'Asia/Kuala_Lumpur',
  'Asia/Ho_Chi_Minh',
  'Asia/Taipei',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Pacific/Auckland',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'America/Mexico_City',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'UTC',
] as const;

export const generalSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Organization name is required')
    .max(200, 'Organization name must be under 200 characters'),
  email: z
    .string()
    .trim()
    .max(254, 'Email must be under 254 characters')
    .email('Please enter a valid email address')
    .nullable()
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone must be under 30 characters')
    .nullable()
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .trim()
    .max(500, 'Address must be under 500 characters')
    .nullable()
    .optional()
    .or(z.literal('')),
});

export const regionalSettingsSchema = z.object({
  currencyCode: z.enum(VALID_CURRENCIES, { message: 'Please select a valid currency' }),
  timezone: z.enum(VALID_TIMEZONES, { message: 'Please select a valid timezone' }),
});

export const branchSettingsSchema = z.object({
  id: z.string().uuid('Invalid branch ID'),
  name: z
    .string()
    .trim()
    .min(1, 'Branch name is required')
    .max(200, 'Branch name must be under 200 characters'),
  code: z
    .string()
    .trim()
    .min(1, 'Branch code is required')
    .max(20, 'Branch code must be under 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Code may only contain uppercase letters, numbers, and hyphens'),
  email: z
    .string()
    .trim()
    .max(254, 'Email must be under 254 characters')
    .email('Please enter a valid email address')
    .nullable()
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone must be under 30 characters')
    .nullable()
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .trim()
    .max(500, 'Address must be under 500 characters')
    .nullable()
    .optional()
    .or(z.literal('')),
});

export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>;
export type RegionalSettingsInput = z.infer<typeof regionalSettingsSchema>;
export type BranchSettingsInput = z.infer<typeof branchSettingsSchema>;
