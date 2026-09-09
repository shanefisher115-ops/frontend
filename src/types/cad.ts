export type FeatureType =
  | "sketch"
  | "extrude"
  | "revolve"
  | "fillet"
  | "chamfer"
  | "hole"
  | "shell"
  | "cut_extrude";

export type DimensionUnit = "mm" | "in" | "deg";

export interface CadDimension {
  id: string;
  name: string;
  value: number;
  unit: DimensionUnit;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

export interface CadFeature {
  id: string;
  name: string;
  type: FeatureType;
  suppressed: boolean;
  visible: boolean;
  status: "ok" | "warning" | "error";
  errorMessage?: string;
  dimensions: CadDimension[];
  createdAt: string;
  updatedAt: string;
  author?: string;
  color?: string;
}

export interface CadModelPreset {
  id: string;
  name: string;
  description: string;
  features: CadFeature[];
}
