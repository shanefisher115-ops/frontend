import { describe, it, expect } from 'vitest';
import { maskKey } from './supabase';

describe('maskKey', () => {
  it('returns "—" for falsy/empty input', () => {
    expect(maskKey('')).toBe('—');
  });

  it('masks short strings (length <= 12) with exact number of bullets', () => {
    expect(maskKey('abc')).toBe('•••');
    expect(maskKey('1234567890')).toBe('••••••••••');
  });

  it('handles exact 12-character boundary correctly', () => {
    expect(maskKey('123456789012')).toBe('••••••••••••');
  });

  it('masks long strings (length > 12) with prefix...suffix (length chars)', () => {
    // 14 characters total:
    // prefix is first 5 chars: "12345"
    // suffix is last 4 chars: "1234"
    expect(maskKey('12345678901234')).toBe('12345…1234 (14 chars)');
  });

  it('handles exact 13-character boundary correctly', () => {
    // 13 characters total
    // prefix: "12345"
    // suffix: "0123"
    expect(maskKey('1234567890123')).toBe('12345…0123 (13 chars)');
  });
});
