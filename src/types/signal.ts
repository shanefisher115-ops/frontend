/**
 * Shared domain types for the Primordia database console.
 * These describe the shape of a "signal" record whether it comes from the live
 * Supabase table or the mock dataset.
 */

export type SignalStatus = "active" | "degraded" | "offline";

export interface Signal {
  id: string;
  name: string;
  origin: string;
  status: SignalStatus;
  intensity: number;
  recorded_at: string; // ISO timestamp
}

/**
 * Expected live Supabase table definition (run this in your Supabase SQL editor
 * to make the live dashboard work):
 *
 *   create table public.signals (
 *     id uuid primary key default gen_random_uuid(),
 *     name text not null,
 *     origin text not null,
 *     status text not null default 'active'
 *       check (status in ('active','degraded','offline')),
 *     intensity integer not null default 0,
 *     recorded_at timestamptz not null default now()
 *   );
 *
 *   -- The anon key is exposed client-side, so enforce access via RLS.
 *   alter table public.signals enable row level security;
 *
 *   create policy "Public read signals"
 *     on public.signals
 *     for select
 *     to anon
 *     using (true);
 *
 * The data adapter selects from `signals` in live mode and falls back to mock
 * data otherwise.
 */
