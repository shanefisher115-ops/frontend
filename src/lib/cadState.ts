import type { CADFeature, CADFeatureType, CADState } from "../types/cad";

export const DEFAULT_CAD_FEATURES: CADFeature[] = [
  {
    id: "feat-sketch-1",
    name: "Base Profile Sketch",
    type: "sketch",
    suppressed: false,
    visible: true,
    status: "ok",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    parameters: {
      plane: "XY",
      width: 120,
      height: 80,
      shape: "rectangle",
      circleRadius: 20,
    },
  },
  {
    id: "feat-extrude-1",
    name: "Base Pad Extrude",
    type: "extrude",
    suppressed: false,
    visible: true,
    status: "ok",
    parentId: "feat-sketch-1",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    parameters: {
      depth: 35,
      direction: "one-sided",
      draftAngle: 0,
      operation: "join",
    },
  },
  {
    id: "feat-fillet-1",
    name: "Base Corner Fillets",
    type: "fillet",
    suppressed: false,
    visible: true,
    status: "ok",
    parentId: "feat-extrude-1",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    parameters: {
      radius: 8,
      edgeSelection: "vertical-edges",
    },
  },
  {
    id: "feat-hole-1",
    name: "Central Mounting Hole",
    type: "hole",
    suppressed: false,
    visible: true,
    status: "ok",
    parentId: "feat-extrude-1",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    parameters: {
      diameter: 24,
      depth: 35,
      holeType: "counterbore",
      xOffset: 0,
      yOffset: 0,
    },
  },
  {
    id: "feat-chamfer-1",
    name: "Top Edge Chamfer",
    type: "chamfer",
    suppressed: false,
    visible: true,
    status: "ok",
    parentId: "feat-extrude-1",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    parameters: {
      distance: 3,
      angle: 45,
    },
  },
  {
    id: "feat-pattern-1",
    name: "Bolt Pattern Array",
    type: "pattern",
    suppressed: true,
    visible: true,
    status: "warning",
    statusMessage: "Pattern feature is currently suppressed.",
    parentId: "feat-hole-1",
    created_at: new Date().toISOString(),
    parameters: {
      count: 4,
      spacing: 35,
      direction: "X",
    },
  },
];

export function createInitialCADState(): CADState {
  return {
    features: DEFAULT_CAD_FEATURES,
    selectedFeatureId: "feat-extrude-1",
    rollbackIndex: DEFAULT_CAD_FEATURES.length,
    searchQuery: "",
    filterType: "all",
  };
}

/**
 * Reorders features by moving item at `fromIndex` to `toIndex`.
 */
export function reorderFeatures(features: CADFeature[], fromIndex: number, toIndex: number): CADFeature[] {
  if (fromIndex < 0 || fromIndex >= features.length) return features;
  if (toIndex < 0 || toIndex >= features.length) return features;
  if (fromIndex === toIndex) return features;

  const result = [...features];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);

  return validateFeatureSequence(result);
}

/**
 * Moves feature up in history order (closer to initial sketch).
 */
export function moveFeatureUp(features: CADFeature[], id: string): CADFeature[] {
  const index = features.findIndex((f) => f.id === id);
  if (index <= 0) return features;
  return reorderFeatures(features, index, index - 1);
}

/**
 * Moves feature down in history order (later in operation timeline).
 */
export function moveFeatureDown(features: CADFeature[], id: string): CADFeature[] {
  const index = features.findIndex((f) => f.id === id);
  if (index < 0 || index >= features.length - 1) return features;
  return reorderFeatures(features, index, index + 1);
}

/**
 * Validates dependencies and feature constraints.
 */
export function validateFeatureSequence(features: CADFeature[]): CADFeature[] {
  return features.map((feat, index) => {
    let status = feat.status;
    let statusMessage = feat.statusMessage;

    // Check parent dependency ordering
    if (feat.parentId) {
      const parentIndex = features.findIndex((f) => f.id === feat.parentId);
      if (parentIndex !== -1 && parentIndex > index) {
        status = "error";
        statusMessage = `Feature depends on "${features[parentIndex].name}", which appears later in history.`;
      } else if (parentIndex !== -1 && features[parentIndex].suppressed && !feat.suppressed) {
        status = "warning";
        statusMessage = `Parent feature "${features[parentIndex].name}" is suppressed.`;
      } else if (status === "error") {
        status = "ok";
        statusMessage = undefined;
      }
    }

    if (feat.suppressed && status !== "error") {
      status = "warning";
      statusMessage = "Feature is suppressed.";
    } else if (!feat.suppressed && status === "warning" && (!feat.parentId || !features.find(f => f.id === feat.parentId)?.suppressed)) {
      status = "ok";
      statusMessage = undefined;
    }

    return { ...feat, status, statusMessage };
  });
}

/**
 * Updates parametric dimensions for a feature.
 */
export function updateFeatureParameters<T extends CADFeature["parameters"]>(
  features: CADFeature[],
  id: string,
  newParameters: Partial<T>
): CADFeature[] {
  const updated = features.map((feat) => {
    if (feat.id !== id) return feat;
    return {
      ...feat,
      parameters: {
        ...feat.parameters,
        ...newParameters,
      },
    };
  });
  return validateFeatureSequence(updated);
}

/**
 * Creates a new default feature.
 */
export function createNewFeature(type: CADFeatureType, existingCount: number): CADFeature {
  const id = `feat-${type}-${Date.now().toString(36)}`;
  const timestamp = new Date().toISOString();

  let name = `${type.charAt(0).toUpperCase() + type.slice(1)} ${existingCount + 1}`;
  let parameters: CADFeature["parameters"];

  switch (type) {
    case "sketch":
      parameters = { plane: "XY", width: 100, height: 60, shape: "rectangle" };
      break;
    case "extrude":
      parameters = { depth: 25, direction: "one-sided", draftAngle: 0, operation: "join" };
      break;
    case "revolve":
      parameters = { angle: 360, axis: "Z" };
      break;
    case "fillet":
      parameters = { radius: 5, edgeSelection: "all-edges" };
      break;
    case "chamfer":
      parameters = { distance: 2, angle: 45 };
      break;
    case "hole":
      parameters = { diameter: 12, depth: 25, holeType: "simple", xOffset: 0, yOffset: 0 };
      break;
    case "shell":
      parameters = { thickness: 2, direction: "inside" };
      break;
    case "pattern":
      parameters = { count: 3, spacing: 20, direction: "X" };
      break;
  }

  return {
    id,
    name,
    type,
    suppressed: false,
    visible: true,
    status: "ok",
    created_at: timestamp,
    parameters,
  };
}
