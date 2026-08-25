import { describe, it, expect } from 'vitest';
import { maskUrl } from './supabase';

describe('maskUrl', () => {
  it('returns "—" for empty, null, or undefined inputs', () => {
    expect(maskUrl('')).toBe('—');
    expect(maskUrl(undefined as unknown as string)).toBe('—');
    expect(maskUrl(null as unknown as string)).toBe('—');
  });

  it('masks valid URLs correctly', () => {
    expect(maskUrl('https://abcdefgh.supabase.co')).toBe('abcdef…gh.supabase.co');
    expect(maskUrl('https://example.com')).toBe('exampl…example.com');
  });

  it('masks invalid URLs using string slicing', () => {
    expect(maskUrl('just_some_random_string')).toBe('just…string');
    expect(maskUrl('shrt')).toBe('shrt…shrt');
  });
});
