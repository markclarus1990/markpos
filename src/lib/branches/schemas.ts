import { z } from 'zod';

export const createBranchSchema = z.object({
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
  timezone: z.string().optional(),
});

export const updateBranchStatusSchema = z.object({
  branchId: z.string().uuid('Invalid branch ID'),
  isActive: z.boolean(),
  replacementBranchId: z.string().uuid().nullable().optional(),
});

export const createStaffAssignmentSchema = z.object({
  branchId: z.string().uuid('Invalid branch ID'),
  userId: z.string().uuid('Invalid user ID'),
  roleId: z.string().uuid('Invalid role ID').nullable().optional(),
});

export const updateStaffRoleSchema = z.object({
  assignmentId: z.string().uuid('Invalid assignment ID'),
  roleId: z.string().uuid('Invalid role ID').nullable().optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
