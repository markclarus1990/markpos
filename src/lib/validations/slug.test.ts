import { describe, it, expect } from 'vitest';
import { generateSlug, isValidSlug } from './slug';

describe('generateSlug', () => {
  it('generates slug from business name', () => {
    expect(generateSlug('My Business')).toBe('my-business');
  });

  it('removes special characters', () => {
    expect(generateSlug("John's Cafe & Grill!")).toBe('johns-cafe-grill');
  });

  it('trims whitespace', () => {
    expect(generateSlug('  Hello World  ')).toBe('hello-world');
  });

  it('handles multiple spaces', () => {
    expect(generateSlug('My   Business')).toBe('my-business');
  });
});

describe('isValidSlug', () => {
  it('validates correct slug', () => {
    expect(isValidSlug('my-business')).toBe(true);
  });

  it('rejects slug with uppercase', () => {
    expect(isValidSlug('My-Business')).toBe(false);
  });

  it('rejects slug with spaces', () => {
    expect(isValidSlug('my business')).toBe(false);
  });

  it('rejects empty slug', () => {
    expect(isValidSlug('')).toBe(false);
  });
});
