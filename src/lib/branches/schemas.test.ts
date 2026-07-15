import { describe, it, expect } from 'vitest';
import {
  createBranchSchema,
  updateBranchStatusSchema,
  createStaffAssignmentSchema,
  updateStaffRoleSchema,
} from './schemas';

const UUID_VALID = 'a1b2c3d4-e5f6-4789-abcd-ef0123456789';
const UUID_VALID_2 = '00000000-0000-0000-0000-000000000000';

describe('createBranchSchema', () => {
  const valid = {
    name: 'Downtown Store',
    code: 'DT-001',
    email: 'store@example.com',
    phone: '+639123456789',
    address: '123 Main St',
    timezone: 'Asia/Manila',
  };

  it('accepts complete valid input', () => {
    const result = createBranchSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('accepts minimal valid input', () => {
    const result = createBranchSchema.safeParse({ name: 'Store', code: 'ST-01' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createBranchSchema.safeParse({ ...valid, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 200 chars', () => {
    const result = createBranchSchema.safeParse({ ...valid, name: 'A'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects empty code', () => {
    const result = createBranchSchema.safeParse({ ...valid, code: '' });
    expect(result.success).toBe(false);
  });

  it('rejects code exceeding 20 chars', () => {
    const result = createBranchSchema.safeParse({ ...valid, code: 'A'.repeat(21) });
    expect(result.success).toBe(false);
  });

  it('rejects code with lowercase letters', () => {
    const result = createBranchSchema.safeParse({ ...valid, code: 'dt-001' });
    expect(result.success).toBe(false);
  });

  it('rejects code with special characters', () => {
    const result = createBranchSchema.safeParse({ ...valid, code: 'DT 001!' });
    expect(result.success).toBe(false);
  });

  it('accepts code with uppercase, numbers, and hyphens', () => {
    const result = createBranchSchema.safeParse({ ...valid, code: 'BRANCH-002' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = createBranchSchema.safeParse({ ...valid, email: 'not-email' });
    expect(result.success).toBe(false);
  });

  it('accepts empty email', () => {
    const result = createBranchSchema.safeParse({ ...valid, email: '' });
    expect(result.success).toBe(true);
  });

  it('rejects email exceeding 254 chars', () => {
    const result = createBranchSchema.safeParse({ ...valid, email: 'a@' + 'b'.repeat(254) });
    expect(result.success).toBe(false);
  });

  it('accepts empty phone', () => {
    const result = createBranchSchema.safeParse({ ...valid, phone: '' });
    expect(result.success).toBe(true);
  });

  it('rejects phone exceeding 30 chars', () => {
    const result = createBranchSchema.safeParse({ ...valid, phone: '1'.repeat(31) });
    expect(result.success).toBe(false);
  });

  it('accepts empty address', () => {
    const result = createBranchSchema.safeParse({ ...valid, address: '' });
    expect(result.success).toBe(true);
  });

  it('rejects address exceeding 500 chars', () => {
    const result = createBranchSchema.safeParse({ ...valid, address: 'A'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('trims whitespace from name', () => {
    const result = createBranchSchema.safeParse({ name: '  My Store  ', code: 'MS-01' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('My Store');
    }
  });

  it('trims whitespace from code', () => {
    const result = createBranchSchema.safeParse({ name: 'Store', code: ' ST-01 ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe('ST-01');
    }
  });
});

describe('updateBranchStatusSchema', () => {
  it('accepts valid deactivation with replacement', () => {
    const result = updateBranchStatusSchema.safeParse({
      branchId: UUID_VALID,
      isActive: false,
      replacementBranchId: UUID_VALID_2,
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid activation without replacement', () => {
    const result = updateBranchStatusSchema.safeParse({
      branchId: UUID_VALID,
      isActive: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID branchId', () => {
    const result = updateBranchStatusSchema.safeParse({
      branchId: 'not-a-uuid',
      isActive: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID replacementBranchId', () => {
    const result = updateBranchStatusSchema.safeParse({
      branchId: UUID_VALID,
      isActive: false,
      replacementBranchId: 'bad-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing branchId', () => {
    const result = updateBranchStatusSchema.safeParse({
      isActive: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-boolean isActive', () => {
    const result = updateBranchStatusSchema.safeParse({
      branchId: UUID_VALID,
      isActive: 'yes',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty branchId', () => {
    const result = updateBranchStatusSchema.safeParse({
      branchId: '',
      isActive: true,
    });
    expect(result.success).toBe(false);
  });
});

describe('createStaffAssignmentSchema', () => {
  it('accepts valid input with role', () => {
    const result = createStaffAssignmentSchema.safeParse({
      branchId: UUID_VALID,
      userId: UUID_VALID_2,
      roleId: '11111111-1111-4111-8111-111111111111',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid input without role', () => {
    const result = createStaffAssignmentSchema.safeParse({
      branchId: UUID_VALID,
      userId: UUID_VALID_2,
      roleId: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts input with roleId omitted', () => {
    const result = createStaffAssignmentSchema.safeParse({
      branchId: UUID_VALID,
      userId: UUID_VALID_2,
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID branchId', () => {
    const result = createStaffAssignmentSchema.safeParse({
      branchId: 'bad',
      userId: UUID_VALID_2,
      roleId: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID userId', () => {
    const result = createStaffAssignmentSchema.safeParse({
      branchId: UUID_VALID,
      userId: 'bad',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID roleId', () => {
    const result = createStaffAssignmentSchema.safeParse({
      branchId: UUID_VALID,
      userId: UUID_VALID_2,
      roleId: 'bad',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing branchId', () => {
    const result = createStaffAssignmentSchema.safeParse({
      userId: UUID_VALID_2,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing userId', () => {
    const result = createStaffAssignmentSchema.safeParse({
      branchId: UUID_VALID,
    });
    expect(result.success).toBe(false);
  });
});

describe('updateStaffRoleSchema', () => {
  it('accepts valid input with role', () => {
    const result = updateStaffRoleSchema.safeParse({
      assignmentId: UUID_VALID,
      roleId: UUID_VALID_2,
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid input with null role', () => {
    const result = updateStaffRoleSchema.safeParse({
      assignmentId: UUID_VALID,
      roleId: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid input with roleId omitted', () => {
    const result = updateStaffRoleSchema.safeParse({
      assignmentId: UUID_VALID,
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID assignmentId', () => {
    const result = updateStaffRoleSchema.safeParse({
      assignmentId: 'bad',
      roleId: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID roleId', () => {
    const result = updateStaffRoleSchema.safeParse({
      assignmentId: UUID_VALID,
      roleId: 'bad',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing assignmentId', () => {
    const result = updateStaffRoleSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
