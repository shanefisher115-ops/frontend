import type { Signal } from "../types/signal";
import type { PkoFact } from "../types/fact";

/**
 * Mock dataset used when Supabase credentials are not configured. This keeps
 * the dashboard fully functional out of the box so the UI can be developed and
 * reviewed before any live database exists.
 */
export const mockSignals: Signal[] = [
  {
    id: "mock-001",
    name: "Genesis Pulse",
    origin: "Core Reactor",
    status: "active",
    intensity: 87,
    recorded_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
  {
    id: "mock-002",
    name: "Origin Echo",
    origin: "Outer Ring",
    status: "degraded",
    intensity: 54,
    recorded_at: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
  },
  {
    id: "mock-003",
    name: "Primordial Hum",
    origin: "Deep Field",
    status: "active",
    intensity: 73,
    recorded_at: new Date(Date.now() - 1000 * 60 * 17).toISOString(),
  },
  {
    id: "mock-004",
    name: "Void Resonance",
    origin: "Boundary",
    status: "offline",
    intensity: 0,
    recorded_at: new Date(Date.now() - 1000 * 60 * 41).toISOString(),
  },
  {
    id: "mock-005",
    name: "First Light",
    origin: "Core Reactor",
    status: "active",
    intensity: 91,
    recorded_at: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
  },
];

/**
 * Demo facts for the PKO Facts panel, shown only in mock mode. Shaped exactly
 * like a row of `pko_facts` (see src/types/fact.ts).
 */
export const mockFacts: PkoFact[] = [
  {
    id: "mock-fact-001",
    topic: "PrimordiaOS Task Claiming",
    summary:
      "Realms claim tasks through a governed claiming protocol rather than a central scheduler, preserving an audit-first ordering.",
    key_points: [
      "Task claims are recorded before downstream execution begins",
      "Failure handling is tied to the claim record for traceability",
    ],
    sources: ["https://github.com/shanefisher115-ops/PrimordiaOS-Origin"],
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "mock-fact-002",
    topic: "PrimordiaFlow Signal Pipeline",
    summary:
      "The dashboard reads signals from Supabase and subscribes to realtime updates, with public reads and privileged server writes.",
    key_points: [
      "The anon role is read-only; server-side writes use the service role",
      "Signal writes go through a fail-closed endpoint with bearer auth",
    ],
    sources: ["https://github.com/shanefisher115-ops/frontend"],
    created_at: new Date(Date.now() - 1000 * 60 * 26).toISOString(),
  },
];
