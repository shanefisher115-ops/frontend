export type AgentStatus = 'active' | 'standby' | 'degraded' | 'syncing' | 'offline';

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  latencyMs: number;
  throughputOps: number;
  currentTask: string;
  healthScore: number;
  realmId: string;
  lastHeartbeat: string;
  sparkline: number[];
}

export interface CpuMetrics {
  usagePct: number;
  coreCount: number;
  clockGhz: number;
  temperatureC: number;
  history: number[];
}

export interface MemoryMetrics {
  usagePct: number;
  usedGb: number;
  totalGb: number;
  swapUsedGb: number;
  history: number[];
}

export interface NetworkMetrics {
  rxMbps: number;
  txMbps: number;
  activeSockets: number;
  history: number[];
}

export interface QuantumQueueMetrics {
  depth: number;
  latencyUs: number;
  capacityPct: number;
}

export interface SystemGauges {
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  network: NetworkMetrics;
  quantumQueue: QuantumQueueMetrics;
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'REALM' | 'SIGNAL';

export interface EventLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  realmId?: string;
}

export type RealmStatus = 'stable' | 'fluctuating' | 'critical' | 'dormant';

export interface RealmState {
  id: string;
  name: string;
  code: string;
  stabilityPct: number;
  activeNodes: number;
  totalNodes: number;
  entropy: number;
  dimensionalPhase: string;
  status: RealmStatus;
  description: string;
}
