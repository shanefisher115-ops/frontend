export type CADFeatureType =
  | "sketch"
  | "extrude"
  | "revolve"
  | "fillet"
  | "chamfer"
  | "hole"
  | "shell"
  | "pattern";

export type FeatureStatus = "ok" | "warning" | "error";

export interface SketchParameters {
  plane: "XY" | "XZ" | "YZ";
  width: number; // in mm
  height: number; // in mm
  shape: "rectangle" | "circle" | "polygon";
  circleRadius?: number; // in mm
}

export interface ExtrudeParameters {
  depth: number; // in mm
  direction: "one-sided" | "symmetric" | "two-sided";
  draftAngle: number; // in degrees
  operation: "join" | "cut" | "intersect";
}

export interface RevolveParameters {
  angle: number; // in degrees
  axis: "X" | "Y" | "Z";
}

export interface FilletParameters {
  radius: number; // in mm
  edgeSelection: "all-edges" | "top-edges" | "vertical-edges";
}

export interface ChamferParameters {
  distance: number; // in mm
  angle: number; // in degrees
}

export interface HoleParameters {
  diameter: number; // in mm
  depth: number; // in mm
  holeType: "simple" | "counterbore" | "countersink";
  xOffset: number; // in mm
  yOffset: number; // in mm
}

export interface ShellParameters {
  thickness: number; // in mm
  direction: "inside" | "outside";
}

export interface PatternParameters {
  count: number;
  spacing: number; // in mm
  direction: "X" | "Y" | "Z";
}

export type FeatureParameters =
  | { type: "sketch"; params: SketchParameters }
  | { type: "extrude"; params: ExtrudeParameters }
  | { type: "revolve"; params: RevolveParameters }
  | { type: "fillet"; params: FilletParameters }
  | { type: "chamfer"; params: ChamferParameters }
  | { type: "hole"; params: HoleParameters }
  | { type: "shell"; params: ShellParameters }
  | { type: "pattern"; params: PatternParameters };

export interface CADFeature {
  id: string;
  name: string;
  type: CADFeatureType;
  suppressed: boolean;
  visible: boolean;
  status: FeatureStatus;
  statusMessage?: string;
  created_at: string;
  parentId?: string; // Dependency parent (e.g. Extrude depends on Sketch)
  parameters: FeatureParameters["params"];
}

export interface CADState {
  features: CADFeature[];
  selectedFeatureId: string | null;
  rollbackIndex: number; // Index in features list (0 to features.length)
  searchQuery: string;
  filterType: CADFeatureType | "all";
}
