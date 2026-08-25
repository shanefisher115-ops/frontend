import { describe, it, expect } from 'vitest';
import { looksPlaceholder } from './supabase';

describe('looksPlaceholder', () => {
  it('should return true for values shorter than 10 characters', () => {
    expect(looksPlaceholder('')).toBe(true);
    expect(looksPlaceholder('123456789')).toBe(true);
    expect(looksPlaceholder('short')).toBe(true);
  });

  it('should return false for valid values 10 characters or longer without hints', () => {
    expect(looksPlaceholder('1234567890')).toBe(false);
    expect(looksPlaceholder('https://abcdefgh.supabase.co')).toBe(false);
    expect(looksPlaceholder('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1hZG1pbiIsImlhdCI6MTYy')).toBe(false);
  });

  it('should return true if value contains any of the placeholder hints', () => {
    // "your_", "your-", "<", "example", "replace", "insert"
    expect(looksPlaceholder('https://your_project.supabase.co')).toBe(true);
    expect(looksPlaceholder('your-anon-key-here-12345')).toBe(true);
    expect(looksPlaceholder('https://<project>.supabase.co')).toBe(true);
    expect(looksPlaceholder('this_is_an_example_key')).toBe(true);
    expect(looksPlaceholder('please_replace_this_value')).toBe(true);
    expect(looksPlaceholder('insert_key_here_12345')).toBe(true);
  });

  it('should be case-insensitive when checking for hints', () => {
    expect(looksPlaceholder('HTTPS://YOUR_PROJECT.SUPABASE.CO')).toBe(true);
    expect(looksPlaceholder('YOUR-ANON-KEY-1234')).toBe(true);
    expect(looksPlaceholder('EXAMPLE_KEY_123456')).toBe(true);
    expect(looksPlaceholder('PLEASE_REPLACE_ME_12')).toBe(true);
    expect(looksPlaceholder('INSERT_HERE_123456')).toBe(true);
  });
});
