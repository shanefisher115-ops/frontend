/**
 * Stub of @supabase/supabase-js used ONLY for the demo bundle
 * (vite.demo.config.ts). The demo preview iframe forbids localStorage and
 * friends, and supabase-js's auth persistence touches them even in mock
 * mode. The real app never uses this file.
 */

export function createClient(): null {
  return null;
}

export type SupabaseClient = unknown;
