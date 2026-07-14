import { describe, it, expect } from 'vitest';
import { getAuthErrorMessage } from './errors';

describe('getAuthErrorMessage', () => {
  it('returns user-friendly message for known error strings', () => {
    expect(getAuthErrorMessage('Invalid login credentials')).toBe(
      'Invalid email or password. Please check your credentials and try again.',
    );
  });

  it('returns user-friendly message for Email not confirmed', () => {
    expect(getAuthErrorMessage('Email not confirmed')).toBe(
      'Please verify your email address before signing in. Check your inbox for the confirmation link.',
    );
  });

  it('returns user-friendly message for User already registered', () => {
    expect(getAuthErrorMessage('User already registered')).toBe(
      'An account with this email already exists. Please sign in instead.',
    );
  });

  it('handles error objects with message', () => {
    const err = new Error('Invalid login credentials');
    expect(getAuthErrorMessage(err)).toBe(
      'Invalid email or password. Please check your credentials and try again.',
    );
  });

  it('handles error objects with code', () => {
    const err = { code: 'weak_password', message: 'too weak' };
    expect(getAuthErrorMessage(err)).toBe(
      'Please choose a stronger password.',
    );
  });

  it('returns fallback for unknown errors', () => {
    expect(getAuthErrorMessage('Unknown error happened')).toBe(
      'An unexpected error occurred. Please try again.',
    );
  });

  it('returns fallback for null/undefined', () => {
    expect(getAuthErrorMessage(null)).toBe(
      'An unexpected error occurred. Please try again.',
    );
  });
});
