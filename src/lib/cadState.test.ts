import { describe, it, expect } from "vitest";
import {
  createInitialCADState,
  reorderFeatures,
  moveFeatureUp,
  moveFeatureDown,
  updateFeatureParameters,
  createNewFeature,
  validateFeatureSequence,
  DEFAULT_CAD_FEATURES,
} from "./cadState";
import type { CADFeature } from "../types/cad";

describe("cadState - CAD Feature Tree & Parametric Model Logic", () => {
  it("initializes with default features and state", () => {
    const state = createInitialCADState();
    expect(state.features.length).toBeGreaterThan(0);
    expect(state.selectedFeatureId).toBe("feat-extrude-1");
    expect(state.rollbackIndex).toBe(state.features.length);
  });

  it("reorders operations in history sequence correctly", () => {
    const features = [...DEFAULT_CAD_FEATURES];
    const initialFirst = features[0].id;
    const initialSecond = features[1].id;

    const reordered = reorderFeatures(features, 0, 1);
    expect(reordered[0].id).toBe(initialSecond);
    expect(reordered[1].id).toBe(initialFirst);
  });

  it("moves feature up in history timeline", () => {
    const features = [...DEFAULT_CAD_FEATURES];
    const secondId = features[1].id;

    const updated = moveFeatureUp(features, secondId);
    expect(updated[0].id).toBe(secondId);
  });

  it("moves feature down in history timeline", () => {
    const features = [...DEFAULT_CAD_FEATURES];
    const firstId = features[0].id;

    const updated = moveFeatureDown(features, firstId);
    expect(updated[1].id).toBe(firstId);
  });

  it("updates parametric dimensions for a feature", () => {
    const features = [...DEFAULT_CAD_FEATURES];
    const extrudeId = "feat-extrude-1";

    const updated = updateFeatureParameters(features, extrudeId, { depth: 75 });
    const extrudeFeat = updated.find((f) => f.id === extrudeId);

    expect(extrudeFeat).toBeDefined();
    expect((extrudeFeat?.parameters as any).depth).toBe(75);
  });

  it("creates new CAD operations with correct defaults", () => {
    const sketch = createNewFeature("sketch", 1);
    expect(sketch.type).toBe("sketch");
    expect((sketch.parameters as any).width).toBe(100);

    const hole = createNewFeature("hole", 2);
    expect(hole.type).toBe("hole");
    expect((hole.parameters as any).diameter).toBe(12);
  });

  it("flags errors when parent feature appears later in sequence", () => {
    const features: CADFeature[] = [
      {
        id: "feat-child",
        name: "Child Extrude",
        type: "extrude",
        suppressed: false,
        visible: true,
        status: "ok",
        parentId: "feat-parent",
        created_at: new Date().toISOString(),
        parameters: { depth: 10, direction: "one-sided", draftAngle: 0, operation: "join" },
      },
      {
        id: "feat-parent",
        name: "Parent Sketch",
        type: "sketch",
        suppressed: false,
        visible: true,
        status: "ok",
        created_at: new Date().toISOString(),
        parameters: { plane: "XY", width: 50, height: 50, shape: "rectangle" },
      },
    ];

    const validated = validateFeatureSequence(features);
    expect(validated[0].status).toBe("error");
    expect(validated[0].statusMessage).toContain("depends on");
  });

  it("flags warning when parent feature is suppressed", () => {
    const features: CADFeature[] = [
      {
        id: "feat-parent",
        name: "Parent Sketch",
        type: "sketch",
        suppressed: true,
        visible: true,
        status: "ok",
        created_at: new Date().toISOString(),
        parameters: { plane: "XY", width: 50, height: 50, shape: "rectangle" },
      },
      {
        id: "feat-child",
        name: "Child Extrude",
        type: "extrude",
        suppressed: false,
        visible: true,
        status: "ok",
        parentId: "feat-parent",
        created_at: new Date().toISOString(),
        parameters: { depth: 10, direction: "one-sided", draftAngle: 0, operation: "join" },
      },
    ];

    const validated = validateFeatureSequence(features);
    expect(validated[1].status).toBe("warning");
    expect(validated[1].statusMessage).toContain("suppressed");
  });
});
