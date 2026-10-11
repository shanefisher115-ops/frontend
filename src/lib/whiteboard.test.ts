import { describe, it, expect } from "vitest";
import { DEFAULT_PRESETS } from "./whiteboardPresets";

describe("Whiteboard Presets and Data Models", () => {
  it("contains default presets including unified command workspace", () => {
    expect(DEFAULT_PRESETS.length).toBeGreaterThanOrEqual(3);
    const unified = DEFAULT_PRESETS.find((p) => p.id === "unified-command");
    expect(unified).toBeDefined();
    expect(unified?.widgets.length).toBe(4);
  });

  it("includes all 4 widget types in unified command center preset", () => {
    const unified = DEFAULT_PRESETS.find((p) => p.id === "unified-command");
    const types = unified?.widgets.map((w) => w.type);
    expect(types).toContain("3d-cad");
    expect(types).toContain("code-editor");
    expect(types).toContain("agent-graph");
    expect(types).toContain("telemetry");
  });

  it("validates widget connections in unified preset", () => {
    const unified = DEFAULT_PRESETS.find((p) => p.id === "unified-command");
    expect(unified?.connections.length).toBe(3);
    const conn1 = unified?.connections[0];
    expect(conn1?.fromWidgetId).toBe("cad-1");
    expect(conn1?.toWidgetId).toBe("code-1");
  });
});
