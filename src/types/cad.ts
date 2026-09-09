export interface ToolpathPoint {
  x: number;
  y: number;
  z: number;
  feedRate: number; // mm/min
  type: 'rapid' | 'cut' | 'retract' | 'plunge';
}

export interface Toolpath {
  id: string;
  name: string;
  description: string;
  estimatedTimeSec: number;
  points: ToolpathPoint[];
  stockDimensions: { width: number; height: number; depth: number }; // X, Y, Z dimensions
}

export type MaterialType = 'aluminum' | 'brass' | 'steel' | 'wood';

export interface ViewportConfig {
  wireframe: boolean;
  showGrid: boolean;
  showAxes: boolean;
  showToolpath: boolean;
  material: MaterialType;
  cutColor: string;
  toolDiameter: number;
}
