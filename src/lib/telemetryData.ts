import type { Agent, EventLog, LogLevel, RealmState, SystemGauges } from "../types/telemetry";

export const initialRealms: RealmState[] = [
  {
    id: "realm-core",
    name: "Primordia Core",
    code: "PRM-01",
    stabilityPct: 98.4,
    activeNodes: 128,
    totalNodes: 128,
    entropy: 0.12,
    dimensionalPhase: "Alpha-7",
    status: "stable",
    description: "Central neural sync manifold and primary telemetry grid.",
  },
  {
    id: "realm-astral",
    name: "Astral Mesh",
    code: "AST-02",
    stabilityPct: 91.2,
    activeNodes: 84,
    totalNodes: 90,
    entropy: 0.38,
    dimensionalPhase: "Beta-3",
    status: "stable",
    description: "Distributed quantum edge relays operating across high-bandwidth channels.",
  },
  {
    id: "realm-void",
    name: "Void Crucible",
    code: "VOD-03",
    stabilityPct: 76.8,
    activeNodes: 42,
    totalNodes: 64,
    entropy: 0.81,
    dimensionalPhase: "Gamma-9",
    status: "fluctuating",
    description: "Sub-space execution chamber handling high-intensity spectral compute.",
  },
  {
    id: "realm-nexus",
    name: "Nexus Gate",
    code: "NEX-04",
    stabilityPct: 99.9,
    activeNodes: 210,
    totalNodes: 210,
    entropy: 0.04,
    dimensionalPhase: "Delta-1",
    status: "stable",
    description: "Inbound payload router and cross-realm signal gateway.",
  },
];

export const initialAgents: Agent[] = [
  {
    id: "agt-nova",
    name: "Nova Sentinel",
    role: "Threat & Anomaly Detection",
    status: "active",
    latencyMs: 12,
    throughputOps: 1420,
    currentTask: "Scanning Primordia Core for spectral variance",
    healthScore: 99,
    realmId: "realm-core",
    lastHeartbeat: new Date().toISOString(),
    sparkline: [42, 58, 65, 70, 68, 85, 92],
  },
  {
    id: "agt-chrono",
    name: "Chrono Synchronizer",
    role: "Temporal Delta Alignment",
    status: "active",
    latencyMs: 18,
    throughputOps: 980,
    currentTask: "Calibrating sub-millisecond clock drift across Astral Mesh",
    healthScore: 96,
    realmId: "realm-astral",
    lastHeartbeat: new Date().toISOString(),
    sparkline: [88, 82, 90, 85, 91, 94, 96],
  },
  {
    id: "agt-aegis",
    name: "Aegis Monitor",
    role: "Security & Policy Guardrail",
    status: "syncing",
    latencyMs: 34,
    throughputOps: 620,
    currentTask: "Re-indexing cryptographic hashes on Void Crucible",
    healthScore: 88,
    realmId: "realm-void",
    lastHeartbeat: new Date().toISOString(),
    sparkline: [30, 45, 60, 50, 75, 70, 88],
  },
  {
    id: "agt-nexus",
    name: "Nexus Dispatcher",
    role: "Cross-Realm Message Bus",
    status: "active",
    latencyMs: 8,
    throughputOps: 2840,
    currentTask: "Routing multi-region ingress payload batch #891",
    healthScore: 100,
    realmId: "realm-nexus",
    lastHeartbeat: new Date().toISOString(),
    sparkline: [95, 98, 92, 96, 99, 97, 100],
  },
  {
    id: "agt-orion",
    name: "Orion Entropy Probe",
    role: "Quantum Entropy Sampling",
    status: "degraded",
    latencyMs: 145,
    throughputOps: 310,
    currentTask: "Mitigating memory pressure in Void Crucible node pool",
    healthScore: 68,
    realmId: "realm-void",
    lastHeartbeat: new Date().toISOString(),
    sparkline: [75, 62, 50, 45, 52, 60, 68],
  },
  {
    id: "agt-spectra",
    name: "Spectra Analyzer",
    role: "Telemetry Analytics Engine",
    status: "standby",
    latencyMs: 25,
    throughputOps: 0,
    currentTask: "Awaiting next scheduled telemetry rollup pass",
    healthScore: 92,
    realmId: "realm-core",
    lastHeartbeat: new Date().toISOString(),
    sparkline: [20, 20, 25, 20, 20, 20, 22],
  },
];

export const initialGauges: SystemGauges = {
  cpu: {
    usagePct: 42.5,
    coreCount: 16,
    clockGhz: 3.8,
    temperatureC: 48,
    history: [35, 38, 45, 42, 50, 41, 42.5],
  },
  memory: {
    usagePct: 61.2,
    usedGb: 19.6,
    totalGb: 32.0,
    swapUsedGb: 1.2,
    history: [58, 59, 60, 62, 61, 60.5, 61.2],
  },
  network: {
    rxMbps: 482.4,
    txMbps: 310.8,
    activeSockets: 1284,
    history: [320, 410, 450, 390, 490, 470, 482.4],
  },
  quantumQueue: {
    depth: 14,
    latencyUs: 120,
    capacityPct: 18.5,
  },
};

export const initialLogs: EventLog[] = [
  {
    id: "log-1",
    timestamp: new Date(Date.now() - 1000 * 120).toLocaleTimeString(),
    level: "INFO",
    source: "SystemInit",
    message: "Telemetry Cockpit core initialized. Subscribed to 4 active realms.",
    realmId: "realm-core",
  },
  {
    id: "log-2",
    timestamp: new Date(Date.now() - 1000 * 90).toLocaleTimeString(),
    level: "SUCCESS",
    source: "Nexus Dispatcher",
    message: "Inbound stream handshaking complete. 2,840 ops/sec registered.",
    realmId: "realm-nexus",
  },
  {
    id: "log-3",
    timestamp: new Date(Date.now() - 1000 * 60).toLocaleTimeString(),
    level: "WARN",
    source: "Orion Entropy Probe",
    message: "Void Crucible entropy spike detected (0.81). Latency increased to 145ms.",
    realmId: "realm-void",
  },
  {
    id: "log-4",
    timestamp: new Date(Date.now() - 1000 * 30).toLocaleTimeString(),
    level: "SIGNAL",
    source: "Supabase Relayer",
    message: "Realtime signal pulse captured: 'Genesis Pulse' (intensity: 87).",
    realmId: "realm-core",
  },
  {
    id: "log-5",
    timestamp: new Date(Date.now() - 1000 * 10).toLocaleTimeString(),
    level: "REALM",
    source: "Astral Mesh",
    message: "Dimensional phase synchronized: Beta-3 phase offset normalized.",
    realmId: "realm-astral",
  },
];

export function stepGaugeData(prev: SystemGauges): SystemGauges {
  const cpuDelta = (Math.random() - 0.48) * 4;
  const newCpuUsage = Math.min(98, Math.max(12, Number((prev.cpu.usagePct + cpuDelta).toFixed(1))));
  const newCpuHistory = [...prev.cpu.history.slice(1), newCpuUsage];

  const memDelta = (Math.random() - 0.49) * 1.2;
  const newMemUsage = Math.min(95, Math.max(20, Number((prev.memory.usagePct + memDelta).toFixed(1))));
  const usedGb = Number(((newMemUsage / 100) * prev.memory.totalGb).toFixed(1));
  const newMemHistory = [...prev.memory.history.slice(1), newMemUsage];

  const rxDelta = (Math.random() - 0.5) * 40;
  const txDelta = (Math.random() - 0.5) * 30;
  const newRx = Math.min(990, Math.max(80, Number((prev.network.rxMbps + rxDelta).toFixed(1))));
  const newTx = Math.min(850, Math.max(50, Number((prev.network.txMbps + txDelta).toFixed(1))));
  const newNetHistory = [...prev.network.history.slice(1), newRx];

  const queueDelta = Math.floor((Math.random() - 0.5) * 6);
  const newQueueDepth = Math.max(0, Math.min(100, prev.quantumQueue.depth + queueDelta));

  return {
    cpu: {
      ...prev.cpu,
      usagePct: newCpuUsage,
      temperatureC: Math.round(40 + newCpuUsage * 0.35),
      history: newCpuHistory,
    },
    memory: {
      ...prev.memory,
      usagePct: newMemUsage,
      usedGb,
      history: newMemHistory,
    },
    network: {
      ...prev.network,
      rxMbps: newRx,
      txMbps: newTx,
      history: newNetHistory,
    },
    quantumQueue: {
      ...prev.quantumQueue,
      depth: newQueueDepth,
      capacityPct: Number(((newQueueDepth / 80) * 100).toFixed(1)),
    },
  };
}

export function stepAgentsData(prev: Agent[]): Agent[] {
  return prev.map((agent) => {
    if (agent.status === "offline" || agent.status === "standby") return agent;

    const latDelta = Math.round((Math.random() - 0.5) * 6);
    const newLat = Math.max(4, agent.latencyMs + latDelta);

    const opsDelta = Math.round((Math.random() - 0.5) * 80);
    const newOps = Math.max(100, agent.throughputOps + opsDelta);

    const lastVal = agent.sparkline[agent.sparkline.length - 1] ?? 50;
    const newVal = Math.min(100, Math.max(10, lastVal + Math.round((Math.random() - 0.48) * 10)));
    const newSparkline = [...agent.sparkline.slice(1), newVal];

    return {
      ...agent,
      latencyMs: newLat,
      throughputOps: newOps,
      sparkline: newSparkline,
      lastHeartbeat: new Date().toISOString(),
    };
  });
}

const SAMPLE_MESSAGES: Array<{ level: LogLevel; source: string; message: string; realmId?: string }> = [
  { level: "INFO", source: "Nova Sentinel", message: "Telemetry packet trace clean. Zero dropped frames in ring buffer.", realmId: "realm-core" },
  { level: "SUCCESS", source: "Chrono Synchronizer", message: "Quantum lock established on temporal beacon #409.", realmId: "realm-astral" },
  { level: "WARN", source: "Aegis Monitor", message: "High encrypted traffic spike on port 8443.", realmId: "realm-void" },
  { level: "SIGNAL", source: "Signal Analyzer", message: "Inbound signal amplitude aligned with target threshold.", realmId: "realm-core" },
  { level: "REALM", source: "Nexus Gate", message: "Routing node buffer cleared. Latency reduced by 4ms.", realmId: "realm-nexus" },
  { level: "INFO", source: "Spectra Engine", message: "Aggregated 10,000 telemetry samples into core metrics store.", realmId: "realm-core" },
];

let logCounter = 100;
export function generateRandomLog(): EventLog {
  const sample = SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)];
  logCounter += 1;
  return {
    id: `log-${logCounter}`,
    timestamp: new Date().toLocaleTimeString(),
    level: sample.level,
    source: sample.source,
    message: sample.message,
    realmId: sample.realmId,
  };
}
