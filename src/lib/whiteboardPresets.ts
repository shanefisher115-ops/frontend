import type { PresetLayout } from "../types/whiteboard";

export const DEFAULT_PRESETS: PresetLayout[] = [
  {
    id: "unified-command",
    name: "Unified Command Center",
    description: "Full system telemetry, 3D mechanical chassis CAD, code editor, and agent reasoning visualizer.",
    transform: { x: 80, y: 60, zoom: 0.85 },
    widgets: [
      {
        id: "cad-1",
        type: "3d-cad",
        title: "Drone Core Chassis (3D CAD)",
        x: 100,
        y: 100,
        width: 520,
        height: 440,
        zIndex: 2,
        isPinned: false,
        isCollapsed: false,
        data: {
          modelType: "drone-chassis",
          renderMode: "shaded",
          rotation: { x: 25, y: -45, z: 10 },
          autoRotate: true,
          explodedView: 0,
          showGrid: true,
          colorScheme: "emerald",
        },
      },
      {
        id: "code-1",
        type: "code-editor",
        title: "Flight Controller Logic (TypeScript)",
        x: 660,
        y: 100,
        width: 560,
        height: 440,
        zIndex: 3,
        isPinned: true,
        isCollapsed: false,
        data: {
          filename: "flight_controller.ts",
          language: "typescript",
          code: `import { SignalTelemetry, CadFrame } from "@primordia/core";

export async function processTelemetryCycle(telemetry: SignalTelemetry) {
  const { cpuUsage, latencyMs, signalRate } = telemetry;

  if (cpuUsage > 85) {
    console.warn("[ALERT] CPU spike detected: throttling agent reasoning");
    await adjustThrottle(0.75);
  }

  // Calculate real-time orientation vectors
  const thrustVector = Math.sin(Date.now() / 1000) * 100;
  return { status: "STABLE", thrustVector, signalRate };
}`,
          outputLog: [
            "[INIT] Flight controller module mounted",
            "[SYSTEM] Supabase Realtime telemetry stream attached",
            "[STABLE] CPU: 42% | Latency: 18ms | Signal Rate: 128/s",
          ],
          isExecuting: false,
          lastExecutedAt: "Just now",
        },
      },
      {
        id: "agent-1",
        type: "agent-graph",
        title: "Autonomous Anomaly Diagnostic Agent",
        x: 100,
        y: 580,
        width: 680,
        height: 420,
        zIndex: 4,
        isPinned: false,
        isCollapsed: false,
        data: {
          agentName: "Agent Primordia-v4",
          promptText: "Diagnose signal latency jump on node US-EAST-1",
          executionStatus: "completed",
          activeNodeId: "node-4",
          nodes: [
            {
              id: "node-1",
              label: "Ingest Signal Telemetry",
              type: "input",
              status: "completed",
              durationMs: 45,
              details: "Stream ingested 128 metrics from signals table via Supabase.",
            },
            {
              id: "node-2",
              label: "Analyze Latency Anomaly",
              type: "reasoning",
              status: "completed",
              durationMs: 120,
              details: "Identified packet queueing at network gateway. CPU load normal.",
            },
            {
              id: "node-3",
              label: "Query Supabase DB",
              type: "database",
              status: "completed",
              durationMs: 82,
              details: "SELECT * FROM public.signals WHERE status = 'degraded';",
            },
            {
              id: "node-4",
              label: "Trigger Micro-Reroute Tool",
              type: "tool",
              status: "completed",
              durationMs: 150,
              details: "Executing routing table shift to secondary edge proxy.",
            },
            {
              id: "node-5",
              label: "Synthesize System Resolution",
              type: "output",
              status: "completed",
              durationMs: 35,
              details: "Latency restored to 14ms (32% improvement).",
            },
          ],
          edges: [
            { id: "e1", from: "node-1", to: "node-2", label: "telemetry stream" },
            { id: "e2", from: "node-2", to: "node-3", label: "db query" },
            { id: "e3", from: "node-3", to: "node-4", label: "execute action" },
            { id: "e4", from: "node-4", to: "node-5", label: "verify result" },
          ],
        },
      },
      {
        id: "telemetry-1",
        type: "telemetry",
        title: "Real-time Telemetry & Signal Monitor",
        x: 820,
        y: 580,
        width: 580,
        height: 420,
        zIndex: 5,
        isPinned: false,
        isCollapsed: false,
        data: {
          targetSystem: "Primordia Production Cluster",
          timeWindow: "5m",
          isLive: true,
          alertThresholds: { cpuMax: 85, latencyMaxMs: 120 },
          metrics: Array.from({ length: 15 }).map((_, i) => ({
            timestamp: new Date(Date.now() - (15 - i) * 5000).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            cpuUsage: Math.floor(35 + Math.random() * 25),
            memoryMB: 1024 + Math.floor(Math.random() * 250),
            latencyMs: Math.floor(12 + Math.random() * 15),
            signalRate: Math.floor(110 + Math.random() * 40),
            activeConnections: 42 + Math.floor(Math.random() * 8),
          })),
        },
      },
    ],
    connections: [
      { id: "c1", fromWidgetId: "cad-1", toWidgetId: "code-1", label: "kinematic model", color: "#34d39e" },
      { id: "c2", fromWidgetId: "code-1", toWidgetId: "agent-1", label: "control loop", color: "#60a5fa" },
      { id: "c3", fromWidgetId: "agent-1", toWidgetId: "telemetry-1", label: "telemetry feedback", color: "#a78bfa" },
    ],
  },
  {
    id: "cad-firmware",
    name: "CAD & Firmware Workshop",
    description: "Focus on 3D spatial design, wireframe inspection, and embedded C++/Rust firmware execution.",
    transform: { x: 120, y: 80, zoom: 0.9 },
    widgets: [
      {
        id: "cad-quantum",
        type: "3d-cad",
        title: "Quantum Cryo Core Assembly (3D CAD)",
        x: 80,
        y: 100,
        width: 580,
        height: 480,
        zIndex: 1,
        isPinned: true,
        isCollapsed: false,
        data: {
          modelType: "quantum-core",
          renderMode: "xray",
          rotation: { x: 35, y: 60, z: -15 },
          autoRotate: false,
          explodedView: 30,
          showGrid: true,
          colorScheme: "cyan",
        },
      },
      {
        id: "code-firmware",
        type: "code-editor",
        title: "Embedded Controller (Rust)",
        x: 700,
        y: 100,
        width: 560,
        height: 480,
        zIndex: 2,
        isPinned: false,
        isCollapsed: false,
        data: {
          filename: "cryo_pump.rs",
          language: "rust",
          code: `#[no_std]
use primordia_hal::cryo::*;

#[entry]
fn main() -> ! {
    let mut pump = CryoPump::take().unwrap();
    pump.set_target_temp_kelvin(0.015);

    loop {
        let current = pump.read_thermal_sensor();
        if current > 0.050 {
            pump.engage_magnetic_damping();
        }
    }
}`,
          outputLog: [
            "Compiling cryo_pump v0.4.2 (/workspace)",
            "Finished dev [unoptimized + debuginfo] target(s) in 1.42s",
            "Running target/thumbv7em-none-eabihf/debug/cryo_pump",
          ],
          isExecuting: false,
          lastExecutedAt: "5m ago",
        },
      },
    ],
    connections: [
      { id: "c-cad-code", fromWidgetId: "cad-quantum", toWidgetId: "code-firmware", label: "HAL Mapping", color: "#38bdf8" },
    ],
  },
  {
    id: "blank-canvas",
    name: "Empty Workspace",
    description: "Clean infinite whiteboard canvas ready for custom layout pinning.",
    transform: { x: 200, y: 200, zoom: 1.0 },
    widgets: [],
    connections: [],
  },
];
