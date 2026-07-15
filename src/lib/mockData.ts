import type { Signal } from "../types/signal";

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
