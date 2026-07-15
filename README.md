# Primordia · Database Console

A Vite + React + TypeScript frontend for `primordialorigin.com` with a Supabase
client that **auto-detects credentials and falls back to mock data** when they're
missing.

The dashboard shows a status badge:

- 🔴 **Using Mock Fallback** — when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
  are missing or still placeholders.
- 🟢 **Supabase Live** — when both env vars are configured.

Add your live Supabase keys to `.env`, then restart the dev server (or rebuild /
redeploy) — the badge flips to 🟢 Supabase Live automatically. Vite reads env
vars at startup, so they are not hot-reloaded; a restart or rebuild is required.
No code changes needed.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

## Going live

1. Create a project at [supabase.com](https://supabase.com).
2. Copy your **Project URL** and **anon public** key from
   *Project Settings → API*.
3. Put them in `.env`:

   ```env
   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-jwt...
   ```

4. Create the `signals` table with Row Level Security. The migration SQL (with
   a read-only public policy so the anon key can select) is in
   [`src/types/signal.ts`](src/types/signal.ts):

   ```sql
   create table public.signals (
     id uuid primary key default gen_random_uuid(),
     name text not null,
     origin text not null,
     status text not null default 'active'
       check (status in ('active','degraded','offline')),
     intensity integer not null default 0,
     recorded_at timestamptz not null default now()
   );

   alter table public.signals enable row level security;

   create policy "Public read signals"
     on public.signals
     for select
     to anon
     using (true);
   ```

5. Restart the dev server (or rebuild/redeploy) — the badge flips to 🟢
   **Supabase Live** and the table reads from your database.

## How the fallback works

- [`src/lib/supabase.ts`](src/lib/supabase.ts) — reads the env vars, detects
  placeholder/empty values, exports `databaseMode` (`"live"` | `"mock"`), the
  `supabase` client (`null` in mock mode), and env diagnostics for the UI.
- [`src/lib/database.ts`](src/lib/database.ts) — `fetchSignals()` routes to
  Supabase in live mode or the mock dataset otherwise. Live query errors fall
  back to mock data and surface an actionable message.
- [`src/components/DatabaseStatusBadge.tsx`](src/components/DatabaseStatusBadge.tsx)
  — renders the 🔴/🟢 badge from `databaseMode`.
- [`src/lib/mockData.ts`](src/lib/mockData.ts) — the mock dataset used out of
  the box.

The anon key is designed to be included in a client-side bundle — but it is
**not** a secret. Access control must be enforced by Supabase Row Level Security
policies (the sample migration above enables RLS with a read-only `anon`
policy). Never put the `service_role` key in a frontend `.env`.
