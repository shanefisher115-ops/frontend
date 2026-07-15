# PrimordiaOS Runtime Integration

This document wires the PrimordiaOS runtime (ledger + livestream agents) into
the Supabase-backed dashboard, completing the closed loop:

```
TikTok LIVE → PrimordiaOS runtime → Supabase (public.signals) → this dashboard → back to LIVE
```

The dashboard already reads from `public.signals` and updates in realtime
(Supabase Realtime). The only missing piece is the **runtime write client** that
pushes signal rows from PrimordiaOS into Supabase.

## Supabase project

- **Project:** Creator OS
- **Project URL:** `https://jccxdlvzeckyaqprkmba.supabase.co`
- **Table:** `public.signals` (id, name, origin, status, intensity, recorded_at)
- **RLS:** enabled. `anon` can SELECT (read-only). `service_role` has full
  access (INSERT/UPDATE/DELETE) via the "Service role full access" policy. The
  `service_role` key also bypasses RLS entirely.

## Runtime credentials

The runtime must use the **`service_role` secret key** — NOT the anon key (the
anon key is read-only and baked into the public frontend). The `service_role`
key is a server-side secret; never commit it or ship it in a frontend bundle.

The Supabase connector does not expose the `service_role` key. Get it from:

> Supabase Dashboard → Creator OS project → Project Settings → API →
> `service_role` secret → Reveal

Store it in the PrimordiaOS runtime environment as:

```env
SUPABASE_URL=https://jccxdlvzeckyaqprkmba.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role secret from dashboard>
```

## Drop-in write client

Copy this into the PrimordiaOS runtime (e.g.
`primordia-codex-integration/integrations/supabase/signals-writer.ts`):

```ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  // service_role bypasses RLS; never use this key client-side.
  { auth: { persistSession: false } },
);

export type SignalStatus = "active" | "degraded" | "offline";

export interface SignalInput {
  name: string;
  origin: string;
  status?: SignalStatus;
  intensity?: number;
}

/** Insert a new signal row. Returns the created row. */
export async function emitSignal(input: SignalInput) {
  const { data, error } = await supabase
    .from("signals")
    .insert({
      name: input.name,
      origin: input.origin,
      status: input.status ?? "active",
      intensity: input.intensity ?? 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Update the latest signal for a given origin (e.g. intensity changes). */
export async function updateSignalByName(name: string, patch: Partial<SignalInput>) {
  const { data, error } = await supabase
    .from("signals")
    .update(patch)
    .eq("name", name)
    .select();
  if (error) throw error;
  return data;
}
```

## Realtime on the dashboard

The dashboard subscribes to `public.signals` changes via Supabase Realtime and
refetches on any INSERT/UPDATE/DELETE, so rows emitted by the runtime appear
within ~1 second without a page reload. Realtime must be enabled on the table
(Database → Replication) — it is on by default for new tables.

## What's needed to finish the loop end-to-end

To wire the actual PrimordiaOS agents, I need from you:

1. **Where the runtime lives** — repo path / server / local process (e.g. the
   `primordia-codex-integration` repo, or `api.primordialorigin.com` behind
   Cloudflare Tunnel).
2. **What events to emit as signals** — the TikTok LIVE / ledger event shape
   (which fields map to `name`, `origin`, `status`, `intensity`).
3. **Where to put the writer** — e.g. a new
   `primordia-codex-integration/integrations/supabase/` module, or an endpoint
   on `api.primordialorigin.com`.

Once you share those, I'll implement `emitSignal()` calls at the right points
in the livestream/ledger agents and confirm the dashboard updates live.
