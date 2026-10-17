/**
 * Shape of a knowledge fact produced by the PrimordiaOS Knowledge Oracle
 * (PKO) and stored in the `pko_facts` Supabase table.
 *
 * The PKO emits a JSON `facts` array; each entry maps to one row of:
 *
 *   create table public.pko_facts (
 *     id uuid primary key default gen_random_uuid(),
 *     topic text not null,
 *     summary text not null,
 *     key_points text[] not null default '{}',
 *     sources text[] not null default '{}',
 *     created_at timestamptz not null default timezone('utc', now())
 *   );
 *
 *   alter table public.pko_facts enable row level security;
 *
 *   create policy "Allow authenticated PKO reads"
 *     on public.pko_facts for select to authenticated, service_role
 *     using (true);
 *
 *   create policy "Allow authenticated PKO inserts"
 *     on public.pko_facts for insert to authenticated, service_role
 *     with check (true);
 */

export interface PkoFact {
  id: string;
  topic: string;
  summary: string;
  key_points: string[];
  sources: string[];
  created_at: string; // ISO timestamp
}

/** Payload for inserting a new fact (id/created_at are server-generated). */
export interface NewFactInput {
  topic: string;
  summary: string;
  key_points: string[];
  sources: string[];
}
