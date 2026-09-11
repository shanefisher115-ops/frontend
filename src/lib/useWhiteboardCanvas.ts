import { useState, useCallback, useRef } from "react";
import type {
  CanvasTransform,
  CanvasWidget,
  WidgetConnection,
  WidgetType,
  Point,
} from "../types/whiteboard";
import { DEFAULT_PRESETS } from "./whiteboardPresets";

const MIN_ZOOM = 0.15;
const MAX_ZOOM = 3.5;
const GRID_SIZE = 20;

export function useWhiteboardCanvas(initialPresetId = "unified-command") {
  const initialPreset =
    DEFAULT_PRESETS.find((p) => p.id === initialPresetId) || DEFAULT_PRESETS[0];

  const [transform, setTransform] = useState<CanvasTransform>(
    initialPreset.transform
  );
  const [widgets, setWidgets] = useState<CanvasWidget[]>(
    initialPreset.widgets
  );
  const [connections, setConnections] = useState<WidgetConnection[]>(
    initialPreset.connections
  );
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<"select" | "pan" | "connect">(
    "select"
  );
  const [isSnapToGrid, setIsSnapToGrid] = useState<boolean>(true);
  const [connectingFromId, setConnectingFromId] = useState<string | null>(
    null
  );

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Helper: Clamp zoom level
  const clampZoom = (zoom: number) =>
    Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

  // Helper: Snap position to grid
  const snapValue = useCallback(
    (val: number) => {
      if (!isSnapToGrid) return val;
      return Math.round(val / GRID_SIZE) * GRID_SIZE;
    },
    [isSnapToGrid]
  );

  // Pan canvas relative
  const panBy = useCallback((dx: number, dy: number) => {
    setTransform((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  }, []);

  // Zoom relative to screen focal point (default center)
  const zoomAtPoint = useCallback(
    (focalPoint: Point, zoomMultiplier: number) => {
      setTransform((prev) => {
        const nextZoom = clampZoom(prev.zoom * zoomMultiplier);
        if (nextZoom === prev.zoom) return prev;

        const zoomRatio = nextZoom / prev.zoom;
        const newX = focalPoint.x - (focalPoint.x - prev.x) * zoomRatio;
        const newY = focalPoint.y - (focalPoint.y - prev.y) * zoomRatio;

        return {
          x: newX,
          y: newY,
          zoom: nextZoom,
        };
      });
    },
    []
  );

  const zoomIn = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const center = { x: rect.width / 2, y: rect.height / 2 };
    zoomAtPoint(center, 1.25);
  }, [zoomAtPoint]);

  const zoomOut = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const center = { x: rect.width / 2, y: rect.height / 2 };
    zoomAtPoint(center, 0.8);
  }, [zoomAtPoint]);

  const resetZoom = useCallback(() => {
    setTransform({ x: 100, y: 100, zoom: 1.0 });
  }, []);

  // Center/Fit all widgets into viewport
  const fitToContent = useCallback(() => {
    if (widgets.length === 0 || !containerRef.current) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    widgets.forEach((w) => {
      minX = Math.min(minX, w.x);
      minY = Math.min(minY, w.y);
      maxX = Math.max(maxX, w.x + w.width);
      maxY = Math.max(maxY, w.y + w.height);
    });

    const padding = 60;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    const rect = containerRef.current.getBoundingClientRect();
    const zoomX = rect.width / contentWidth;
    const zoomY = rect.height / contentHeight;
    const newZoom = clampZoom(Math.min(zoomX, zoomY, 1.2));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const newX = rect.width / 2 - centerX * newZoom;
    const newY = rect.height / 2 - centerY * newZoom;

    setTransform({ x: newX, y: newY, zoom: newZoom });
  }, [widgets]);

  // Convert screen coordinates to canvas workspace coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): Point => {
      if (!containerRef.current) return { x: screenX, y: screenY };
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = screenX - rect.left;
      const relativeY = screenY - rect.top;

      return {
        x: (relativeX - transform.x) / transform.zoom,
        y: (relativeY - transform.y) / transform.zoom,
      };
    },
    [transform]
  );

  // Convert canvas workspace coordinates to screen coordinates
  const canvasToScreen = useCallback(
    (canvasX: number, canvasY: number): Point => {
      if (!containerRef.current) return { x: canvasX, y: canvasY };
      const rect = containerRef.current.getBoundingClientRect();

      return {
        x: rect.left + transform.x + canvasX * transform.zoom,
        y: rect.top + transform.y + canvasY * transform.zoom,
      };
    },
    [transform]
  );

  // Widget Operations
  const bringToFront = useCallback(
    (widgetId: string) => {
      setWidgets((prev) => {
        const target = prev.find((w) => w.id === widgetId);
        if (!target) return prev;
        const highestZ = Math.max(...prev.map((w) => w.zIndex), 0);
        if (target.zIndex === highestZ) return prev;
        return prev.map((w) =>
          w.id === widgetId ? { ...w, zIndex: highestZ + 1 } : w
        );
      });
    },
    []
  );

  const addWidget = useCallback(
    (type: WidgetType, customPosition?: Point) => {
      let spawnPos: Point;

      if (customPosition) {
        spawnPos = customPosition;
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerCanvas = screenToCanvas(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2
        );
        spawnPos = {
          x: snapValue(centerCanvas.x - 250),
          y: snapValue(centerCanvas.y - 200),
        };
      } else {
        spawnPos = { x: 150, y: 150 };
      }

      const newId = `${type}-${Date.now()}`;
      const highestZ =
        widgets.length > 0 ? Math.max(...widgets.map((w) => w.zIndex)) : 0;

      let defaultWidget: CanvasWidget;

      switch (type) {
        case "3d-cad":
          defaultWidget = {
            id: newId,
            type: "3d-cad",
            title: "New 3D CAD Assembly",
            x: spawnPos.x,
            y: spawnPos.y,
            width: 500,
            height: 420,
            zIndex: highestZ + 1,
            isPinned: false,
            isCollapsed: false,
            data: {
              modelType: "robot-arm",
              renderMode: "shaded",
              rotation: { x: 20, y: 30, z: 0 },
              autoRotate: true,
              explodedView: 0,
              showGrid: true,
              colorScheme: "cyan",
            },
          };
          break;

        case "code-editor":
          defaultWidget = {
            id: newId,
            type: "code-editor",
            title: "Script Sandbox",
            x: spawnPos.x,
            y: spawnPos.y,
            width: 520,
            height: 400,
            zIndex: highestZ + 1,
            isPinned: false,
            isCollapsed: false,
            data: {
              filename: "script.ts",
              language: "typescript",
              code: `// Custom automation script\nexport function onTelemetry(signal) {\n  console.log("Received signal:", signal.name);\n}`,
              outputLog: ["[READY] Script environment initialized"],
              isExecuting: false,
            },
          };
          break;

        case "agent-graph":
          defaultWidget = {
            id: newId,
            type: "agent-graph",
            title: "Reasoning Graph",
            x: spawnPos.x,
            y: spawnPos.y,
            width: 600,
            height: 400,
            zIndex: highestZ + 1,
            isPinned: false,
            isCollapsed: false,
            data: {
              agentName: "Agent-Custom",
              promptText: "Analyze runtime health metrics",
              executionStatus: "idle",
              nodes: [
                {
                  id: "n-1",
                  label: "Start Execution",
                  type: "input",
                  status: "completed",
                  details: "Received prompt trigger.",
                },
                {
                  id: "n-2",
                  label: "Evaluate Rules",
                  type: "reasoning",
                  status: "completed",
                  details: "Checking safety bounds and constraints.",
                },
                {
                  id: "n-3",
                  label: "Dispatch Result",
                  type: "output",
                  status: "idle",
                  details: "Awaiting final confirmation.",
                },
              ],
              edges: [
                { id: "e1", from: "n-1", to: "n-2" },
                { id: "e2", from: "n-2", to: "n-3" },
              ],
            },
          };
          break;

        case "telemetry":
        default:
          defaultWidget = {
            id: newId,
            type: "telemetry",
            title: "Live Stream Metrics",
            x: spawnPos.x,
            y: spawnPos.y,
            width: 540,
            height: 400,
            zIndex: highestZ + 1,
            isPinned: false,
            isCollapsed: false,
            data: {
              targetSystem: "Node Telemetry",
              timeWindow: "5m",
              isLive: true,
              alertThresholds: { cpuMax: 80, latencyMaxMs: 100 },
              metrics: Array.from({ length: 10 }).map((_, i) => ({
                timestamp: new Date(Date.now() - (10 - i) * 5000).toLocaleTimeString(),
                cpuUsage: 40 + Math.floor(Math.random() * 20),
                memoryMB: 1024 + Math.floor(Math.random() * 100),
                latencyMs: 15 + Math.floor(Math.random() * 10),
                signalRate: 90 + Math.floor(Math.random() * 20),
                activeConnections: 30,
              })),
            },
          };
          break;
      }

      setWidgets((prev) => [...prev, defaultWidget]);
      setSelectedWidgetId(newId);
    },
    [widgets, screenToCanvas, snapValue]
  );

  const updateWidget = useCallback(
    (id: string, updates: Partial<CanvasWidget>) => {
      setWidgets((prev) =>
        prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
      );
    },
    []
  );

  const updateWidgetData = useCallback(
    (id: string, partialData: Record<string, any>) => {
      setWidgets((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, data: { ...w.data, ...partialData } as any }
            : w
        )
      );
    },
    []
  );

  const moveWidget = useCallback(
    (id: string, deltaCanvasX: number, deltaCanvasY: number) => {
      setWidgets((prev) =>
        prev.map((w) => {
          if (w.id !== id || w.isPinned) return w;
          const newX = snapValue(w.x + deltaCanvasX);
          const newY = snapValue(w.y + deltaCanvasY);
          return { ...w, x: newX, y: newY };
        })
      );
    },
    [snapValue]
  );

  const resizeWidget = useCallback(
    (id: string, width: number, height: number) => {
      setWidgets((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w;
          const clampedWidth = Math.max(280, snapValue(width));
          const clampedHeight = Math.max(180, snapValue(height));
          return { ...w, width: clampedWidth, height: clampedHeight };
        })
      );
    },
    [snapValue]
  );

  const togglePinWidget = useCallback((id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isPinned: !w.isPinned } : w))
    );
  }, []);

  const toggleCollapseWidget = useCallback((id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isCollapsed: !w.isCollapsed } : w))
    );
  }, []);

  const deleteWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    setConnections((prev) =>
      prev.filter((c) => c.fromWidgetId !== id && c.toWidgetId !== id)
    );
    setSelectedWidgetId((prev) => (prev === id ? null : prev));
  }, []);

  const duplicateWidget = useCallback(
    (id: string) => {
      const source = widgets.find((w) => w.id === id);
      if (!source) return;

      const newId = `${source.type}-${Date.now()}`;
      const highestZ = Math.max(...widgets.map((w) => w.zIndex), 0);

      const dup: CanvasWidget = {
        ...source,
        id: newId,
        title: `${source.title} (Copy)`,
        x: source.x + 40,
        y: source.y + 40,
        zIndex: highestZ + 1,
        isPinned: false,
        // Clone nested data structure cleanly
        data: JSON.parse(JSON.stringify(source.data)),
      };

      setWidgets((prev) => [...prev, dup]);
      setSelectedWidgetId(newId);
    },
    [widgets]
  );

  // Connection management
  const addConnection = useCallback((fromWidgetId: string, toWidgetId: string, label?: string) => {
    if (fromWidgetId === toWidgetId) return;
    setConnections((prev) => {
      const exists = prev.some(
        (c) => c.fromWidgetId === fromWidgetId && c.toWidgetId === toWidgetId
      );
      if (exists) return prev;
      return [
        ...prev,
        {
          id: `conn-${Date.now()}`,
          fromWidgetId,
          toWidgetId,
          label: label || "data-link",
          color: "#34d39e",
        },
      ];
    });
  }, []);

  const deleteConnection = useCallback((connectionId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
  }, []);

  // Preset operations
  const loadPreset = useCallback((presetId: string) => {
    const preset = DEFAULT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setTransform(preset.transform);
    setWidgets(JSON.parse(JSON.stringify(preset.widgets)));
    setConnections(JSON.parse(JSON.stringify(preset.connections)));
    setSelectedWidgetId(null);
  }, []);

  // Export / Import
  const exportLayout = useCallback(() => {
    const layout = {
      transform,
      widgets,
      connections,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(layout, null, 2);
  }, [transform, widgets, connections]);

  const importLayout = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.widgets && Array.isArray(parsed.widgets)) {
        if (parsed.transform) setTransform(parsed.transform);
        setWidgets(parsed.widgets);
        if (parsed.connections) setConnections(parsed.connections);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return {
    containerRef,
    transform,
    setTransform,
    widgets,
    connections,
    selectedWidgetId,
    setSelectedWidgetId,
    activeTool,
    setActiveTool,
    isSnapToGrid,
    setIsSnapToGrid,
    connectingFromId,
    setConnectingFromId,
    // Actions
    panBy,
    zoomAtPoint,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToContent,
    screenToCanvas,
    canvasToScreen,
    bringToFront,
    addWidget,
    updateWidget,
    updateWidgetData,
    moveWidget,
    resizeWidget,
    togglePinWidget,
    toggleCollapseWidget,
    deleteWidget,
    duplicateWidget,
    addConnection,
    deleteConnection,
    loadPreset,
    exportLayout,
    importLayout,
  };
}
