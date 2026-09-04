import { describe, it, expect } from "vitest";
import { GlassCard } from "../GlassCard";
import { initialAgents, initialGauges, initialLogs, initialRealms } from "../../lib/telemetryData";

describe("Glassmorphism Components Data Handlers", () => {
  it("GlassCard component instantiates cleanly", () => {
    const element = <GlassCard interactive glowColor="rgba(0,255,0,0.5)">Content</GlassCard>;
    expect(element).toBeDefined();
    expect(element.props.children).toBe("Content");
  });

  it("Telemetry Initial Data contains expected structure for rendering", () => {
    expect(initialRealms[0].code).toBe("PRM-01");
    expect(initialAgents[0].name).toBe("Nova Sentinel");
    expect(initialGauges.cpu.coreCount).toBe(16);
    expect(initialLogs[0].level).toBe("INFO");
  });
});
