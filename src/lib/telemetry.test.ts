import { describe, it, expect } from "vitest";
import {
  initialAgents,
  initialGauges,
  initialLogs,
  initialRealms,
  stepAgentsData,
  stepGaugeData,
  generateRandomLog,
} from "./telemetryData";

describe("Telemetry Data Service", () => {
  it("should provide initial state with expected realms and agents", () => {
    expect(initialRealms.length).toBeGreaterThan(0);
    expect(initialAgents.length).toBeGreaterThan(0);
    expect(initialLogs.length).toBeGreaterThan(0);
    expect(initialGauges.cpu.usagePct).toBeGreaterThan(0);
  });

  it("stepGaugeData should update cpu, memory, and network metrics within valid ranges", () => {
    const next = stepGaugeData(initialGauges);
    expect(next.cpu.usagePct).toBeGreaterThanOrEqual(12);
    expect(next.cpu.usagePct).toBeLessThanOrEqual(98);
    expect(next.cpu.history.length).toBe(initialGauges.cpu.history.length);
    expect(next.memory.usagePct).toBeGreaterThanOrEqual(20);
    expect(next.memory.usagePct).toBeLessThanOrEqual(95);
  });

  it("stepAgentsData should update throughput and latency for active agents", () => {
    const next = stepAgentsData(initialAgents);
    const activePrev = initialAgents.find((a) => a.status === "active");
    const activeNext = next.find((a) => a.id === activePrev?.id);

    expect(activeNext).toBeDefined();
    if (activeNext) {
      expect(activeNext.sparkline.length).toBe(activePrev!.sparkline.length);
      expect(activeNext.lastHeartbeat).toBeDefined();
    }
  });

  it("generateRandomLog should produce valid log event objects", () => {
    const log = generateRandomLog();
    expect(log.id).toBeDefined();
    expect(log.timestamp).toBeDefined();
    expect(log.message).toBeTruthy();
    expect(["INFO", "WARN", "ERROR", "SUCCESS", "REALM", "SIGNAL"]).toContain(log.level);
  });
});
