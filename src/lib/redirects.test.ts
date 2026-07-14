import { describe, it, expect } from 'vitest';
import { isSafeRedirect, getRedirectPath } from './redirects';

describe('isSafeRedirect', () => {
  it('allows relative paths', () => {
    expect(isSafeRedirect('/dashboard')).toBe(true);
  });

  it('allows query-string-only paths', () => {
    expect(isSafeRedirect('?foo=bar')).toBe(true);
  });

  it('rejects protocol-relative URLs', () => {
    expect(isSafeRedirect('//evil.com')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isSafeRedirect('')).toBe(false);
  });
});

describe('getRedirectPath', () => {
  it('returns safe redirectTo parameter', () => {
    const params = new URLSearchParams('redirectTo=/dashboard');
    expect(getRedirectPath(params, '/fallback')).toBe('/dashboard');
  });

  it('returns fallback for unsafe redirectTo', () => {
    const params = new URLSearchParams('redirectTo=//evil.com');
    expect(getRedirectPath(params, '/fallback')).toBe('/fallback');
  });

  it('returns fallback when no redirectTo', () => {
    const params = new URLSearchParams('');
    expect(getRedirectPath(params, '/fallback')).toBe('/fallback');
  });
});
