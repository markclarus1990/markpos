import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  organizationSetupSchema,
  branchSetupSchema,
} from './auth';

describe('loginSchema', () => {
  it('accepts valid input', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'password' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '12345',
    });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('accepts valid input', () => {
    const result = registerSchema.safeParse({
      displayName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      displayName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'different',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing display name', () => {
    const result = registerSchema.safeParse({
      displayName: '',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'user@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: '' });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts valid input', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpassword123',
      confirmPassword: 'newpassword123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpassword123',
      confirmPassword: 'different',
    });
    expect(result.success).toBe(false);
  });
});

describe('organizationSetupSchema', () => {
  it('accepts valid input', () => {
    const result = organizationSetupSchema.safeParse({
      name: 'My Business',
      slug: 'my-business',
      timezone: 'Asia/Manila',
      currencyCode: 'PHP',
      countryCode: 'PH',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid slug characters', () => {
    const result = organizationSetupSchema.safeParse({
      name: 'My Business',
      slug: 'MY BUSINESS!',
      timezone: 'Asia/Manila',
      currencyCode: 'PHP',
      countryCode: 'PH',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = organizationSetupSchema.safeParse({
      name: '',
      slug: 'my-business',
      timezone: 'Asia/Manila',
      currencyCode: 'PHP',
      countryCode: 'PH',
    });
    expect(result.success).toBe(false);
  });
});

describe('branchSetupSchema', () => {
  it('accepts valid input', () => {
    const result = branchSetupSchema.safeParse({
      name: 'Main Branch',
      code: 'MAIN-001',
      address: '123 Main St',
      phone: '+639123456789',
      email: 'branch@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('accepts minimal input', () => {
    const result = branchSetupSchema.safeParse({
      name: 'Main Branch',
      code: 'MAIN-001',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid branch code characters', () => {
    const result = branchSetupSchema.safeParse({
      name: 'Main Branch',
      code: 'main branch!',
    });
    expect(result.success).toBe(false);
  });
});
