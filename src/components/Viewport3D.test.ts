import { describe, it, expect } from "vitest";
import { STATUS_COLORS, compute3DNodes } from "./Viewport3D";
import type { Signal } from "../types/signal";

const mockSignals: Signal[] = [
  {
    id: "sig-1",
    name: "Core Alpha",
    origin: "us-east-1",
    status: "active",
    intensity: 85,
    recorded_at: "2025-01-01T12:00:00Z",
  },
  {
    id: "sig-2",
    name: "Beacon Beta",
    origin: "eu-west-1",
    status: "degraded",
    intensity: 42,
    recorded_at: "2025-01-01T12:05:00Z",
  },
  {
    id: "sig-3",
    name: "Sensor Gamma",
    origin: "ap-southeast-1",
    status: "offline",
    intensity: 0,
    recorded_at: "2025-01-01T12:10:00Z",
  },
];

describe("Viewport3D Computation Tests", () => {
  it("defines color mappings for signal status types", () => {
    expect(STATUS_COLORS.active.hex).toBe("#34d39e");
    expect(STATUS_COLORS.degraded.hex).toBe("#e0a44a");
    expect(STATUS_COLORS.offline.hex).toBe("#6b7280");
  });

  it("computes 3D node spatial data deterministically from signal array", () => {
    const nodes = compute3DNodes(mockSignals);
    expect(nodes).toHaveLength(3);

    // Node 1 (active, 85% intensity)
    expect(nodes[0].signal.id).toBe("sig-1");
    expect(nodes[0].color).toBe("#34d39e");
    // height (y) is proportional to intensity: (85 / 100) * 80 - 20 = 48
    expect(nodes[0].y).toBeCloseTo(48);

    // Node 2 (degraded, 42% intensity)
    expect(nodes[1].signal.id).toBe("sig-2");
    expect(nodes[1].color).toBe("#e0a44a");
    expect(nodes[1].y).toBeCloseTo(13.6);

    // Node 3 (offline, 0% intensity)
    expect(nodes[2].signal.id).toBe("sig-3");
    expect(nodes[2].color).toBe("#6b7280");
    expect(nodes[2].y).toBeCloseTo(-20);
  });

  it("handles empty signals gracefully", () => {
    const nodes = compute3DNodes([]);
    expect(nodes).toEqual([]);
  });
});
