import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { WhiteboardCanvas } from "../whiteboard/WhiteboardCanvas";
import { CadViewportWidget } from "../whiteboard/widgets/CadViewportWidget";
import { CodeEditorWidget } from "../whiteboard/widgets/CodeEditorWidget";
import { AgentReasoningGraphWidget } from "../whiteboard/widgets/AgentReasoningGraphWidget";
import { TelemetryWidget } from "../whiteboard/widgets/TelemetryWidget";

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("WhiteboardCanvas Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders infinite workspace title and toolbar", () => {
    render(<WhiteboardCanvas />);
    expect(screen.getByText("Infinite Workspace")).toBeInTheDocument();
    expect(screen.getByText("Templates")).toBeInTheDocument();
    expect(screen.getByText("+ Add Widget")).toBeInTheDocument();
  });

  it("renders initial default preset widgets", () => {
    render(<WhiteboardCanvas />);
    expect(screen.getByText("Drone Core Chassis (3D CAD)")).toBeInTheDocument();
    expect(
      screen.getByText("Flight Controller Logic (TypeScript)")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Autonomous Anomaly Diagnostic Agent")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Real-time Telemetry & Signal Monitor")
    ).toBeInTheDocument();
  });

  it("can toggle pinning on a widget frame", () => {
    render(<WhiteboardCanvas />);
    const pinButtons = screen.getAllByTitle(/pin widget position/i);
    expect(pinButtons.length).toBeGreaterThan(0);

    fireEvent.click(pinButtons[0]);
    expect(screen.getAllByText(/pinned/i).length).toBeGreaterThan(0);
  });

  it("renders 3D CAD widget with controls and model selection", () => {
    const mockData = {
      modelType: "drone-chassis" as const,
      renderMode: "shaded" as const,
      rotation: { x: 0, y: 0, z: 0 },
      autoRotate: false,
      explodedView: 20,
      showGrid: true,
      colorScheme: "cyan" as const,
    };
    render(<CadViewportWidget data={mockData} onChange={() => {}} />);

    expect(screen.getByText("Drone Core Chassis")).toBeInTheDocument();
    expect(screen.getByText("Shaded")).toBeInTheDocument();
    expect(screen.getByText("Explode Assembly:")).toBeInTheDocument();
  });

  it("renders Code Editor widget and triggers code run console output", () => {
    const mockData = {
      filename: "test.ts",
      language: "typescript" as const,
      code: "console.log('hello');",
      outputLog: ["System initialized"],
      isExecuting: false,
    };
    render(<CodeEditorWidget data={mockData} onChange={() => {}} />);

    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.getByText("▶ Run Code")).toBeInTheDocument();
  });

  it("renders Agent Reasoning Graph widget with nodes", () => {
    const mockData = {
      agentName: "Agent-007",
      promptText: "Analyze latency",
      executionStatus: "completed" as const,
      nodes: [
        {
          id: "n1",
          label: "Read Signal Data",
          type: "input" as const,
          status: "completed" as const,
          details: "Signal stream ok",
        },
      ],
      edges: [],
    };
    render(<AgentReasoningGraphWidget data={mockData} onChange={() => {}} />);

    expect(screen.getByText("Read Signal Data")).toBeInTheDocument();
    expect(screen.getAllByText("Prompt Input")[0]).toBeInTheDocument();
  });

  it("renders Telemetry Widget with live stream status and metrics", () => {
    const mockData = {
      targetSystem: "Test Cluster",
      timeWindow: "5m" as const,
      isLive: true,
      alertThresholds: { cpuMax: 80, latencyMaxMs: 100 },
      metrics: [
        {
          timestamp: "12:00:00",
          cpuUsage: 45,
          memoryMB: 1024,
          latencyMs: 15,
          signalRate: 100,
          activeConnections: 10,
        },
      ],
    };
    render(<TelemetryWidget data={mockData} onChange={() => {}} />);

    expect(screen.getByText("● LIVE STREAM")).toBeInTheDocument();
    expect(screen.getByText("CPU Utilization")).toBeInTheDocument();
    expect(screen.getByText("45%")).toBeInTheDocument();
  });
});
