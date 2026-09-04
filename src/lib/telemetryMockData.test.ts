import { describe, it, expect } from "vitest";
import {
  initialAgents,
  initialSystemGauges,
  initialTelemetryEvents,
  initialRealms,
} from "./telemetryMockData";

describe("Telemetry Mock Data Verification", () => {
  it("initializes agents with valid statuses and metrics", () => {
    expect(initialAgents.length).toBeGreaterThan(0);
    initialAgents.forEach((agent) => {
      expect(agent.id).toBeDefined();
      expect(agent.name).toBeDefined();
      expect(agent.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(agent.cpuUsage).toBeLessThanOrEqual(100);
      expect(agent.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(agent.memoryUsage).toBeLessThanOrEqual(100);
      expect(["active", "idle", "syncing", "warning", "offline"]).toContain(agent.status);
    });
  });

  it("initializes system gauges with proper core counts and percentages", () => {
    expect(initialSystemGauges.cpuUsage).toBeGreaterThanOrEqual(0);
    expect(initialSystemGauges.cpuUsage).toBeLessThanOrEqual(100);
    expect(initialSystemGauges.cpuCores.length).toBe(8);
    expect(initialSystemGauges.memoryUsedGb).toBeLessThanOrEqual(initialSystemGauges.memoryTotalGb);
  });

  it("initializes telemetry events with valid severities and ISO dates", () => {
    expect(initialTelemetryEvents.length).toBeGreaterThan(0);
    initialTelemetryEvents.forEach((evt) => {
      expect(evt.id).toBeDefined();
      expect(["info", "success", "warning", "error", "critical"]).toContain(evt.severity);
      expect(new Date(evt.timestamp).getTime()).not.toBeNaN();
    });
  });

  it("initializes realm state with nodes and valid quantum sync rate", () => {
    expect(initialRealms.length).toBeGreaterThan(0);
    const realm = initialRealms[0];
    expect(realm.quantumSyncRate).toBeGreaterThanOrEqual(0);
    expect(realm.quantumSyncRate).toBeLessThanOrEqual(100);
    expect(realm.nodes.length).toBeGreaterThan(0);
  });
});
