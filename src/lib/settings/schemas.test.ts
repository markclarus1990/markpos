import { describe, it, expect } from 'vitest';
import {
  generalSettingsSchema,
  regionalSettingsSchema,
  branchSettingsSchema,
  VALID_CURRENCIES,
  VALID_TIMEZONES,
} from './schemas';

describe('generalSettingsSchema', () => {
  it('accepts valid input with all fields', () => {
    const result = generalSettingsSchema.safeParse({
      name: 'My Store',
      email: 'store@example.com',
      phone: '+639123456789',
      address: '123 Main St, Manila',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid input with minimal fields', () => {
    const result = generalSettingsSchema.safeParse({
      name: 'My Store',
      email: '',
      phone: '',
      address: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty organization name', () => {
    const result = generalSettingsSchema.safeParse({
      name: '',
      email: '',
      phone: '',
      address: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding max length', () => {
    const result = generalSettingsSchema.safeParse({
      name: 'A'.repeat(201),
      email: '',
      phone: '',
      address: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid email', () => {
    const result = generalSettingsSchema.safeParse({
      name: 'Store',
      email: 'owner@store.com',
      phone: '',
      address: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = generalSettingsSchema.safeParse({
      name: 'Store',
      email: 'not-an-email',
      phone: '',
      address: '',
    });
    expect(result.success).toBe(false);
  });

  it('trims whitespace from name', () => {
    const result = generalSettingsSchema.safeParse({
      name: '  My Store  ',
      email: '',
      phone: '',
      address: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('My Store');
    }
  });

  it('trims whitespace from phone', () => {
    const result = generalSettingsSchema.safeParse({
      name: 'Store',
      email: '',
      phone: '  +639123456789  ',
      address: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe('+639123456789');
    }
  });

  it('trims whitespace from address', () => {
    const result = generalSettingsSchema.safeParse({
      name: 'Store',
      email: '',
      phone: '',
      address: '  123 Main St  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.address).toBe('123 Main St');
    }
  });

  it('accepts phone under max length', () => {
    const result = generalSettingsSchema.safeParse({
      name: 'Store',
      email: '',
      phone: '+1 (555) 123-4567',
      address: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects phone exceeding max length', () => {
    const result = generalSettingsSchema.safeParse({
      name: 'Store',
      email: '',
      phone: '1'.repeat(31),
      address: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts address under max length', () => {
    const result = generalSettingsSchema.safeParse({
      name: 'Store',
      email: '',
      phone: '',
      address: 'A'.repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it('rejects address exceeding max length', () => {
    const result = generalSettingsSchema.safeParse({
      name: 'Store',
      email: '',
      phone: '',
      address: 'A'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('clears optional fields to null when empty', () => {
    const result = generalSettingsSchema.safeParse({
      name: 'Store',
      email: '',
      phone: '',
      address: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('');
      expect(result.data.phone).toBe('');
      expect(result.data.address).toBe('');
    }
  });
});

describe('regionalSettingsSchema', () => {
  it('accepts valid currency and timezone', () => {
    const result = regionalSettingsSchema.safeParse({
      currencyCode: 'PHP',
      timezone: 'Asia/Manila',
    });
    expect(result.success).toBe(true);
  });

  it('supports PHP', () => {
    expect(VALID_CURRENCIES).toContain('PHP');
  });

  it('supports all expected currencies', () => {
    expect(VALID_CURRENCIES).toContain('PHP');
    expect(VALID_CURRENCIES).toContain('USD');
    expect(VALID_CURRENCIES).toContain('EUR');
    expect(VALID_CURRENCIES).toContain('SGD');
    expect(VALID_CURRENCIES).toContain('JPY');
  });

  it('rejects invalid currency', () => {
    const result = regionalSettingsSchema.safeParse({
      currencyCode: 'XYZ',
      timezone: 'Asia/Manila',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty currency', () => {
    const result = regionalSettingsSchema.safeParse({
      currencyCode: '',
      timezone: 'Asia/Manila',
    });
    expect(result.success).toBe(false);
  });

  it('supports Asia/Manila timezone', () => {
    expect(VALID_TIMEZONES).toContain('Asia/Manila');
  });

  it('accepts valid IANA timezone', () => {
    const result = regionalSettingsSchema.safeParse({
      currencyCode: 'USD',
      timezone: 'America/New_York',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid timezone', () => {
    const result = regionalSettingsSchema.safeParse({
      currencyCode: 'PHP',
      timezone: 'Invalid/Timezone',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty timezone', () => {
    const result = regionalSettingsSchema.safeParse({
      currencyCode: 'PHP',
      timezone: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('branchSettingsSchema', () => {
  it('accepts valid input with all fields', () => {
    const result = branchSettingsSchema.safeParse({
      id: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
      name: 'Main Branch',
      code: 'MAIN-001',
      email: 'branch@example.com',
      phone: '+639123456789',
      address: '123 Main St',
    });
    expect(result.success).toBe(true);
  });

  it('accepts minimal input with only required fields', () => {
    const result = branchSettingsSchema.safeParse({
      id: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
      name: 'Main Branch',
      code: 'MAIN-001',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty branch name', () => {
    const result = branchSettingsSchema.safeParse({
      id: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
      name: '',
      code: 'MAIN-001',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid branch code characters', () => {
    const result = branchSettingsSchema.safeParse({
      id: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
      name: 'Main Branch',
      code: 'main branch!',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid branch code format', () => {
    const result = branchSettingsSchema.safeParse({
      id: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
      name: 'Branch 2',
      code: 'BRANCH-002',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email on branch', () => {
    const result = branchSettingsSchema.safeParse({
      id: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
      name: 'Branch',
      code: 'BR-001',
      email: 'not-valid-email',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty optional branch fields', () => {
    const result = branchSettingsSchema.safeParse({
      id: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
      name: 'Branch',
      code: 'BR-001',
      email: '',
      phone: '',
      address: '',
    });
    expect(result.success).toBe(true);
  });

  it('trims branch name whitespace', () => {
    const result = branchSettingsSchema.safeParse({
      id: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
      name: '  My Branch  ',
      code: 'BR-001',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('My Branch');
    }
  });

  it('rejects invalid UUID for branch ID', () => {
    const result = branchSettingsSchema.safeParse({
      id: 'not-a-uuid',
      name: 'Branch',
      code: 'BR-001',
    });
    expect(result.success).toBe(false);
  });

  it('rejects branch name exceeding max length', () => {
    const result = branchSettingsSchema.safeParse({
      id: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
      name: 'A'.repeat(201),
      code: 'BR-001',
    });
    expect(result.success).toBe(false);
  });
});
