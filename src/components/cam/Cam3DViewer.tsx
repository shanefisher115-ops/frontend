import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import type {
  CamDataset,
  Vector3D,
  VisualOptions,
  ViewPreset,
  ToolInfo,
} from "../../types/cam";
import {
  RotateCcw,
  Eye,
  Crosshair,
} from "lucide-react";

interface Cam3DViewerProps {
  dataset: CamDataset;
  currentPosition: Vector3D;
  activeSegmentIndex: number;
  currentTool: ToolInfo | null;
  isPlaying: boolean;
  visualOptions: VisualOptions;
  onToggleVisualOption: (key: keyof VisualOptions) => void;
}

export function Cam3DViewer({
  dataset,
  currentPosition,
  activeSegmentIndex,
  currentTool,
  isPlaying,
  visualOptions,
  onToggleVisualOption,
}: Cam3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cutterGroupRef = useRef<THREE.Group | null>(null);
  const bitMeshRef = useRef<THREE.Mesh | null>(null);
  const traversedLineRef = useRef<THREE.LineSegments | null>(null);
  const fullPathGroupRef = useRef<THREE.Group | null>(null);
  const stockMeshRef = useRef<THREE.Mesh | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesGroupRef = useRef<THREE.Group | null>(null);

  // Mouse Orbit Control state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 220 });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(60, 40, 0));

  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);

  // Update Camera position based on spherical coordinates
  const updateCamera = useCallback(() => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    const target = cameraTargetRef.current;

    const x = target.x + radius * Math.sin(phi) * Math.cos(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.sin(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  }, []);

  // Preset view change handler
  const setViewPreset = useCallback((preset: ViewPreset) => {
    if (!cameraRef.current) return;

    switch (preset) {
      case "iso":
        cameraAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 220 };
        break;
      case "top":
        cameraAngleRef.current = { theta: 0, phi: 0.001, radius: 200 };
        break;
      case "front":
        cameraAngleRef.current = { theta: -Math.PI / 2, phi: Math.PI / 2, radius: 220 };
        break;
      case "side":
        cameraAngleRef.current = { theta: 0, phi: Math.PI / 2, radius: 220 };
        break;
    }
    updateCamera();
  }, [updateCamera]);

  // Center camera on active cutter position
  const centerOnCutter = useCallback(() => {
    cameraTargetRef.current.set(currentPosition.x, currentPosition.y, currentPosition.z);
    updateCamera();
  }, [currentPosition, updateCamera]);

  // Reset view to stock center
  const resetView = useCallback(() => {
    const stock = dataset.stock;
    cameraTargetRef.current.set(stock.width / 2, stock.length / 2, 0);
    cameraAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 220 };
    updateCamera();
  }, [dataset.stock, updateCamera]);

  // Setup Three.js scene on mount or dataset change
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0e1a);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    cameraRef.current = camera;

    // Set camera target to center of stock
    const stock = dataset.stock;
    cameraTargetRef.current.set(stock.width / 2, stock.length / 2, 0);
    updateCamera();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(150, 200, 150);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.5);
    dirLight2.position.set(-150, -100, -100);
    scene.add(dirLight2);

    // 5. Machine Bed Grid
    const gridHelper = new THREE.GridHelper(300, 30, 0x2c3147, 0x1d2032);
    gridHelper.rotation.x = Math.PI / 2; // Orient grid along XY plane
    gridHelper.position.set(stock.width / 2, stock.length / 2, -0.5);
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // 6. Machine G54 Coordinate Axes
    const axesGroup = new THREE.Group();
    const axisLen = 30;
    const xAxis = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), axisLen, 0xef4444, 5, 3);
    const yAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), axisLen, 0x22c55e, 5, 3);
    const zAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), axisLen, 0x3b82f6, 5, 3);
    axesGroup.add(xAxis, yAxis, zAxis);
    scene.add(axesGroup);
    axesGroupRef.current = axesGroup;

    // 7. Stock Material Geometry Mesh
    const stockGeo = new THREE.BoxGeometry(stock.width, stock.length, stock.height);
    const stockMat = new THREE.MeshStandardMaterial({
      color: 0x232a3e,
      roughness: 0.3,
      metalness: 0.8,
      transparent: true,
      opacity: 0.45,
    });
    const stockMesh = new THREE.Mesh(stockGeo, stockMat);
    stockMesh.position.set(stock.width / 2, stock.length / 2, -stock.height / 2);
    const stockEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(stockGeo),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 })
    );
    stockMesh.add(stockEdges);
    scene.add(stockMesh);
    stockMeshRef.current = stockMesh;

    // 8. Toolpath Lines Group
    const fullPathGroup = new THREE.Group();

    const rapidPositions: number[] = [];
    const cuttingPositions: number[] = [];

    dataset.segments.forEach((seg) => {
      if (seg.motionType === "rapid") {
        rapidPositions.push(seg.start.x, seg.start.y, seg.start.z);
        rapidPositions.push(seg.end.x, seg.end.y, seg.end.z);
      } else {
        if (seg.motionType === "arc_cw" || seg.motionType === "arc_ccw") {
          const arcSubdivisions = 12;
          let prevP = seg.start;
          for (let i = 1; i <= arcSubdivisions; i++) {
            const t = i / arcSubdivisions;
            const nextP = {
              x: seg.start.x + (seg.end.x - seg.start.x) * t,
              y: seg.start.y + (seg.end.y - seg.start.y) * t,
              z: seg.start.z + (seg.end.z - seg.start.z) * t,
            };
            cuttingPositions.push(prevP.x, prevP.y, prevP.z);
            cuttingPositions.push(nextP.x, nextP.y, nextP.z);
            prevP = nextP;
          }
        } else {
          cuttingPositions.push(seg.start.x, seg.start.y, seg.start.z);
          cuttingPositions.push(seg.end.x, seg.end.y, seg.end.z);
        }
      }
    });

    if (rapidPositions.length > 0) {
      const rapidGeo = new THREE.BufferGeometry();
      rapidGeo.setAttribute("position", new THREE.Float32BufferAttribute(rapidPositions, 3));
      const rapidMat = new THREE.LineDashedMaterial({
        color: 0xeab308,
        dashSize: 2,
        gapSize: 2,
        transparent: true,
        opacity: 0.7,
      });
      const rapidLine = new THREE.LineSegments(rapidGeo, rapidMat);
      rapidLine.computeLineDistances();
      rapidLine.name = "rapidLine";
      fullPathGroup.add(rapidLine);
    }

    if (cuttingPositions.length > 0) {
      const cuttingGeo = new THREE.BufferGeometry();
      cuttingGeo.setAttribute("position", new THREE.Float32BufferAttribute(cuttingPositions, 3));
      const cuttingMat = new THREE.LineBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.6,
      });
      const cuttingLine = new THREE.LineSegments(cuttingGeo, cuttingMat);
      cuttingLine.name = "cuttingLine";
      fullPathGroup.add(cuttingLine);
    }

    scene.add(fullPathGroup);
    fullPathGroupRef.current = fullPathGroup;

    // 9. Traversed Cut Path (Highlighted Trail)
    const traversedGeo = new THREE.BufferGeometry();
    const traversedMat = new THREE.LineBasicMaterial({ color: 0x34d39e, linewidth: 2 });
    const traversedLine = new THREE.LineSegments(traversedGeo, traversedMat);
    scene.add(traversedLine);
    traversedLineRef.current = traversedLine;

    // 10. 3D Cutter Spindle & Tool Mesh Assembly
    const cutterGroup = new THREE.Group();

    // Spindle Arbor
    const arborGeo = new THREE.CylinderGeometry(14, 18, 30, 16);
    const arborMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
    const arborMesh = new THREE.Mesh(arborGeo, arborMat);
    arborMesh.position.z = 35;
    arborMesh.rotation.x = Math.PI / 2;
    cutterGroup.add(arborMesh);

    // Collet Toolholder
    const colletGeo = new THREE.CylinderGeometry(8, 12, 15, 16);
    const colletMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    const colletMesh = new THREE.Mesh(colletGeo, colletMat);
    colletMesh.position.z = 12.5;
    colletMesh.rotation.x = Math.PI / 2;
    cutterGroup.add(colletMesh);

    // Dynamic Cutter Bit
    const toolDia = currentTool?.diameter ?? 6;
    const toolLen = currentTool?.length ?? 30;
    const bitGeo = new THREE.CylinderGeometry(toolDia / 2, toolDia / 2, toolLen, 16);
    const bitMat = new THREE.MeshStandardMaterial({
      color: currentTool?.color ?? "#38bdf8",
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0x142a24,
    });
    const bitMesh = new THREE.Mesh(bitGeo, bitMat);
    bitMesh.position.z = toolLen / 2;
    bitMesh.rotation.x = Math.PI / 2;
    cutterGroup.add(bitMesh);
    bitMeshRef.current = bitMesh;

    // Cutter tip contact dot
    const tipGeo = new THREE.SphereGeometry(1.2, 12, 12);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const tipMesh = new THREE.Mesh(tipGeo, tipMat);
    tipMesh.position.set(0, 0, 0);
    cutterGroup.add(tipMesh);

    scene.add(cutterGroup);
    cutterGroupRef.current = cutterGroup;

    // 11. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isPlaying && cutterGroupRef.current) {
        cutterGroupRef.current.rotation.z += 0.2;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 12. Window Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 500;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container) container.innerHTML = "";
    };
  }, [dataset, updateCamera]);

  // Sync cutter position in 3D scene
  useEffect(() => {
    if (cutterGroupRef.current) {
      cutterGroupRef.current.position.set(currentPosition.x, currentPosition.y, currentPosition.z);
    }
  }, [currentPosition]);

  // Sync traversed cut path geometry
  useEffect(() => {
    if (!traversedLineRef.current || !dataset) return;

    const pathPoints: number[] = [];
    const segments = dataset.segments;
    const maxIdx = Math.min(activeSegmentIndex, segments.length - 1);

    for (let i = 0; i <= maxIdx; i++) {
      const seg = segments[i];
      if (seg.motionType !== "rapid") {
        pathPoints.push(seg.start.x, seg.start.y, seg.start.z);
        if (i === maxIdx) {
          pathPoints.push(currentPosition.x, currentPosition.y, currentPosition.z);
        } else {
          pathPoints.push(seg.end.x, seg.end.y, seg.end.z);
        }
      }
    }

    if (pathPoints.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pathPoints, 3));
      traversedLineRef.current.geometry.dispose();
      traversedLineRef.current.geometry = geo;
      traversedLineRef.current.visible = visualOptions.showCutTrail;
    }
  }, [activeSegmentIndex, currentPosition, dataset, visualOptions.showCutTrail]);

  // Update visual options toggles
  useEffect(() => {
    if (stockMeshRef.current) stockMeshRef.current.visible = visualOptions.showStock;
    if (gridHelperRef.current) gridHelperRef.current.visible = visualOptions.showGrid;
    if (axesGroupRef.current) axesGroupRef.current.visible = visualOptions.showAxes;
    if (cutterGroupRef.current) cutterGroupRef.current.visible = visualOptions.showToolMesh;

    if (fullPathGroupRef.current) {
      const rapidLine = fullPathGroupRef.current.getObjectByName("rapidLine");
      if (rapidLine) rapidLine.visible = visualOptions.showRapidMoves;

      const cuttingLine = fullPathGroupRef.current.getObjectByName("cuttingLine");
      if (cuttingLine) cuttingLine.visible = visualOptions.showCuttingMoves;
    }
  }, [visualOptions]);

  // Mouse Orbit Control Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    cameraAngleRef.current.theta -= deltaX * 0.008;
    cameraAngleRef.current.phi = Math.max(
      0.01,
      Math.min(Math.PI - 0.01, cameraAngleRef.current.phi - deltaY * 0.008)
    );

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    updateCamera();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    cameraAngleRef.current.radius = Math.max(
      20,
      Math.min(800, cameraAngleRef.current.radius + e.deltaY * 0.15)
    );
    updateCamera();
  };

  return (
    <div className="cam-viewer">
      <div
        ref={mountRef}
        className="cam-viewer__canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Top Toolbar Overlay */}
      <div className="cam-viewer__toolbar">
        <div className="cam-viewer__view-presets">
          <button
            type="button"
            className="cam-viewer__btn"
            title="Isometric View"
            onClick={() => setViewPreset("iso")}
          >
            ISO
          </button>
          <button
            type="button"
            className="cam-viewer__btn"
            title="Top View (XY Plane)"
            onClick={() => setViewPreset("top")}
          >
            Top (XY)
          </button>
          <button
            type="button"
            className="cam-viewer__btn"
            title="Front View (XZ Plane)"
            onClick={() => setViewPreset("front")}
          >
            Front (XZ)
          </button>
          <button
            type="button"
            className="cam-viewer__btn"
            title="Side View (YZ Plane)"
            onClick={() => setViewPreset("side")}
          >
            Side (YZ)
          </button>
        </div>

        <div className="cam-viewer__actions">
          <button
            type="button"
            className="cam-viewer__btn"
            title="Center View on Active Cutter Tip"
            onClick={centerOnCutter}
          >
            <Crosshair size={14} /> Center Cutter
          </button>
          <button
            type="button"
            className="cam-viewer__btn"
            title="Reset Camera View to Stock Center"
            onClick={resetView}
          >
            <RotateCcw size={14} /> Reset
          </button>

          {/* Visibility Layers Dropdown */}
          <div className="cam-viewer__dropdown-wrap">
            <button
              type="button"
              className={`cam-viewer__btn ${showOptionsDropdown ? "cam-viewer__btn--active" : ""}`}
              onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
            >
              <Eye size={14} /> Layers
            </button>

            {showOptionsDropdown && (
              <div className="cam-viewer__dropdown">
                <div className="cam-viewer__dropdown-title">3D Viewport Layers</div>
                <ToggleItem
                  label="Rapid Moves (G0)"
                  checked={visualOptions.showRapidMoves}
                  onChange={() => onToggleVisualOption("showRapidMoves")}
                  color="#eab308"
                />
                <ToggleItem
                  label="Cutting Moves (G1-G3)"
                  checked={visualOptions.showCuttingMoves}
                  onChange={() => onToggleVisualOption("showCuttingMoves")}
                  color="#0ea5e9"
                />
                <ToggleItem
                  label="Cut Trail Trace"
                  checked={visualOptions.showCutTrail}
                  onChange={() => onToggleVisualOption("showCutTrail")}
                  color="#34d39e"
                />
                <ToggleItem
                  label="Stock Material Volume"
                  checked={visualOptions.showStock}
                  onChange={() => onToggleVisualOption("showStock")}
                  color="#94a3b8"
                />
                <ToggleItem
                  label="Cutter Tool Mesh"
                  checked={visualOptions.showToolMesh}
                  onChange={() => onToggleVisualOption("showToolMesh")}
                  color={currentTool?.color ?? "#38bdf8"}
                />
                <ToggleItem
                  label="G54 Machine Axes"
                  checked={visualOptions.showAxes}
                  onChange={() => onToggleVisualOption("showAxes")}
                />
                <ToggleItem
                  label="Machine Bed Grid"
                  checked={visualOptions.showGrid}
                  onChange={() => onToggleVisualOption("showGrid")}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Viewport HUD overlay */}
      <div className="cam-viewer__hud">
        <div className="cam-viewer__hud-item">
          <span className="cam-viewer__hud-label">Tool</span>
          <span className="cam-viewer__hud-val" style={{ color: currentTool?.color ?? "inherit" }}>
            {currentTool ? `${currentTool.id} · ${currentTool.name}` : "None"}
          </span>
        </div>
        <div className="cam-viewer__hud-item">
          <span className="cam-viewer__hud-label">Position</span>
          <span className="cam-viewer__hud-val font-mono">
            X:{currentPosition.x.toFixed(2)} Y:{currentPosition.y.toFixed(2)} Z:
            {currentPosition.z.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

function ToggleItem({
  label,
  checked,
  onChange,
  color,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  color?: string;
}) {
  return (
    <label className="cam-viewer__toggle-item">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {color && (
        <span
          className="cam-viewer__toggle-dot"
          style={{ backgroundColor: color }}
        />
      )}
      <span>{label}</span>
    </label>
  );
}
