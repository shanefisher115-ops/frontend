export type AgentStatus = "active" | "idle" | "syncing" | "warning" | "offline";

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  currentTask: string;
  cpuUsage: number; // percentage 0-100
  memoryUsage: number; // percentage 0-100
  latencyMs: number;
  uptime: string;
  lastHeartbeat: string; // ISO string
}

export interface SystemGauges {
  cpuUsage: number; // percentage 0-100
  cpuTemp: number; // Celsius
  cpuCores: number[]; // core usage percentages
  memoryUsedGb: number;
  memoryTotalGb: number;
  memoryUsage: number; // percentage 0-100
  swapUsedGb: number;
  networkInKbps: number;
  networkOutKbps: number;
}

export type EventSeverity = "info" | "success" | "warning" | "error" | "critical";

export interface TelemetryEvent {
  id: string;
  timestamp: string; // ISO string
  severity: EventSeverity;
  source: string;
  message: string;
  details?: string;
}

export type RealmStatus = "synchronized" | "stable" | "fluctuating" | "critical";

export interface RealmNode {
  id: string;
  name: string;
  region: string;
  latencyMs: number;
  status: "online" | "degraded" | "offline";
  load: number; // percentage
}

export interface RealmState {
  id: string;
  name: string;
  code: string;
  status: RealmStatus;
  activeNodesCount: number;
  totalNodesCount: number;
  quantumSyncRate: number; // percentage 0-100
  anomalyLevel: number; // percentage 0-100
  dimensionalPhase: string;
  nodes: RealmNode[];
  activeDirectives: string[];
}
