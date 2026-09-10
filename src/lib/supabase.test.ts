import { test, expect, vi, beforeEach, describe, afterEach } from 'vitest';

describe('supabase client', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('configures live mode when both valid credentials are provided', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abcdefgh.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'some-valid-jwt-key-that-is-long-enough');

    const supabaseModule = await import('./supabase.ts');

    expect(supabaseModule.databaseMode).toBe('live');
    expect(supabaseModule.isSupabaseConfigured).toBe(true);
    expect(supabaseModule.hasSupabaseUrl).toBe(true);
    expect(supabaseModule.hasSupabaseKey).toBe(true);
    expect(supabaseModule.supabase).not.toBeNull();
    expect(supabaseModule.supabaseUrl).toBe('https://abcdefgh.supabase.co');
    expect(supabaseModule.supabaseAnonKey).toBe('some-valid-jwt-key-that-is-long-enough');
  });

  test('falls back to mock mode if URL is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'some-valid-jwt-key-that-is-long-enough');

    const supabaseModule = await import('./supabase.ts');

    expect(supabaseModule.databaseMode).toBe('mock');
    expect(supabaseModule.isSupabaseConfigured).toBe(false);
    expect(supabaseModule.supabase).toBeNull();
  });

  test('falls back to mock mode if key is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abcdefgh.supabase.co');

    const supabaseModule = await import('./supabase.ts');

    expect(supabaseModule.databaseMode).toBe('mock');
    expect(supabaseModule.isSupabaseConfigured).toBe(false);
    expect(supabaseModule.supabase).toBeNull();
  });

  test('falls back to mock mode if URL looks like a placeholder', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'your_supabase_url');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'some-valid-jwt-key-that-is-long-enough');

    const supabaseModule = await import('./supabase.ts');

    expect(supabaseModule.databaseMode).toBe('mock');
    expect(supabaseModule.hasSupabaseUrl).toBe(false);
  });

  test('falls back to mock mode if key looks like a placeholder', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abcdefgh.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'replace_with_your_key');

    const supabaseModule = await import('./supabase.ts');

    expect(supabaseModule.databaseMode).toBe('mock');
    expect(supabaseModule.hasSupabaseKey).toBe(false);
  });

  test('correctly exposes and masks diagnostics', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abcdefgh.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'some-valid-jwt-key-that-is-long-enough');

    const supabaseModule = await import('./supabase.ts');

    expect(supabaseModule.envDiagnostics.url.configured).toBe(true);
    expect(supabaseModule.envDiagnostics.url.masked).toBe('abcdef…gh.supabase.co');
    expect(supabaseModule.envDiagnostics.key.configured).toBe(true);
    expect(supabaseModule.envDiagnostics.key.masked).toBe('some-…ough (38 chars)');
  });

  test('handles invalid URL for masking', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'not-a-url');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'short-key');

    const supabaseModule = await import('./supabase.ts');

    expect(supabaseModule.envDiagnostics.url.masked).toBe('not-…-a-url');
    expect(supabaseModule.envDiagnostics.key.masked).toBe('•••••••••');
  });

  test('handles empty values for masking', async () => {
    const supabaseModule = await import('./supabase.ts');

    expect(supabaseModule.envDiagnostics.url.masked).toBe('—');
    expect(supabaseModule.envDiagnostics.key.masked).toBe('—');
  });
});
