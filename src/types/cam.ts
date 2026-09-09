export type MotionType = "rapid" | "linear" | "arc_cw" | "arc_ccw";

export type ToolType = "endmill" | "ballnose" | "chamfer" | "drill" | "vbit";

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface ToolInfo {
  id: string;
  name: string;
  type: ToolType;
  diameter: number; // in mm
  length: number; // total tool protrusion length in mm
  fluteLength: number; // flute length in mm
  flutes: number;
  color: string;
}

export interface CamOperation {
  id: string;
  name: string;
  toolId: string;
  color: string;
  description: string;
  startSegmentIndex: number;
  endSegmentIndex: number;
  type: "facing" | "adaptive" | "contour" | "drilling" | "chamfering" | "finishing";
}

export interface GCodeLine {
  lineNumber: number;
  raw: string;
  segmentIndex?: number;
  comment?: string;
  isMove?: boolean;
}

export interface ToolpathSegment {
  index: number;
  motionType: MotionType;
  start: Vector3D;
  end: Vector3D;
  feedRate: number; // mm/min
  spindleSpeed: number; // RPM
  coolant: boolean;
  operationId: string;
  toolId: string;
  arcCenter?: Vector3D;
  arcRadius?: number;
  arcNormal?: Vector3D;
  length: number; // segment length in mm
  cumulativeDistance: number; // total distance up to end of segment
  startTime: number; // estimated time from start in seconds
  endTime: number; // end time in seconds
  gcodeLineIndex: number;
}

export interface StockDimensions {
  width: number; // X size in mm
  length: number; // Y size in mm
  height: number; // Z size in mm
  origin: Vector3D; // Stock minimum corner offset
}

export interface BoundingBox3D {
  min: Vector3D;
  max: Vector3D;
}

export interface CamDataset {
  id: string;
  name: string;
  description: string;
  material: string;
  stock: StockDimensions;
  tools: ToolInfo[];
  operations: CamOperation[];
  segments: ToolpathSegment[];
  gcodeLines: GCodeLine[];
  totalDistance: number; // total path distance in mm
  totalDuration: number; // total duration in seconds
  boundingBox: BoundingBox3D;
}

export type PlaybackSpeed = 0.25 | 0.5 | 1 | 2 | 5 | 10;

export interface CamPlaybackState {
  isPlaying: boolean;
  currentTime: number; // in seconds
  progress: number; // 0 to 1
  speed: PlaybackSpeed;
  isLooping: boolean;
  activeSegmentIndex: number;
  currentPosition: Vector3D;
  currentFeedrate: number;
  currentSpindle: number;
  currentTool: ToolInfo | null;
  currentOperation: CamOperation | null;
}

export type ViewPreset = "iso" | "top" | "front" | "side";

export interface VisualOptions {
  showRapidMoves: boolean;
  showCuttingMoves: boolean;
  showStock: boolean;
  showAxes: boolean;
  showToolMesh: boolean;
  showCutTrail: boolean;
  showGrid: boolean;
}
