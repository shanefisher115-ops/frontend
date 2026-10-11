export type WidgetType = "3d-cad" | "code-editor" | "agent-graph" | "telemetry";

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface CanvasTransform {
  x: number;
  y: number;
  zoom: number;
}

export interface CadWidgetData {
  modelType: "drone-chassis" | "quantum-core" | "robot-arm" | "satellite-bus";
  renderMode: "shaded" | "wireframe" | "xray";
  rotation: { x: number; y: number; z: number };
  autoRotate: boolean;
  explodedView: number; // 0 to 100%
  showGrid: boolean;
  colorScheme: "cyan" | "emerald" | "amber" | "violet";
}

export interface CodeWidgetData {
  language: "typescript" | "python" | "rust" | "sql";
  code: string;
  outputLog: string[];
  isExecuting: boolean;
  lastExecutedAt?: string;
  filename: string;
}

export interface AgentNode {
  id: string;
  label: string;
  type: "input" | "reasoning" | "tool" | "database" | "output";
  status: "idle" | "running" | "completed" | "failed";
  durationMs?: number;
  details: string;
  payload?: string;
}

export interface AgentEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface AgentGraphWidgetData {
  agentName: string;
  nodes: AgentNode[];
  edges: AgentEdge[];
  executionStatus: "idle" | "running" | "completed" | "failed";
  activeNodeId?: string;
  promptText: string;
}

export interface TelemetryMetricPoint {
  timestamp: string;
  cpuUsage: number; // 0-100%
  memoryMB: number;
  latencyMs: number;
  signalRate: number; // signals/sec
  activeConnections: number;
}

export interface TelemetryWidgetData {
  targetSystem: string;
  timeWindow: "1m" | "5m" | "15m";
  isLive: boolean;
  metrics: TelemetryMetricPoint[];
  alertThresholds: {
    cpuMax: number;
    latencyMaxMs: number;
  };
}

export type WidgetData =
  | { type: "3d-cad"; data: CadWidgetData }
  | { type: "code-editor"; data: CodeWidgetData }
  | { type: "agent-graph"; data: AgentGraphWidgetData }
  | { type: "telemetry"; data: TelemetryWidgetData };

export interface CanvasWidget {
  id: string;
  type: WidgetType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isPinned: boolean;
  isCollapsed: boolean;
  data: CadWidgetData | CodeWidgetData | AgentGraphWidgetData | TelemetryWidgetData;
}

export interface WidgetConnection {
  id: string;
  fromWidgetId: string;
  toWidgetId: string;
  label?: string;
  color?: string;
}

export interface PresetLayout {
  id: string;
  name: string;
  description: string;
  transform: CanvasTransform;
  widgets: CanvasWidget[];
  connections: WidgetConnection[];
}
