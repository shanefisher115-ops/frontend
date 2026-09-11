import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type {
  CADFeature,
  SketchParameters,
  ExtrudeParameters,
  FilletParameters,
  HoleParameters,
  PatternParameters,
} from "../types/cad";

interface CADViewportProps {
  features: CADFeature[];
  selectedFeatureId: string | null;
  rollbackIndex: number;
  onSelectFeature?: (id: string) => void;
}

export function CADViewport({
  features,
  selectedFeatureId,
  rollbackIndex,
  onSelectFeature,
}: CADViewportProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);

  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [webGlSupported, setWebGlSupported] = useState(true);

  // Active features up to rollbackIndex
  const activeFeatures = features.slice(0, rollbackIndex).filter((f) => !f.suppressed && f.visible);

  // Rebuild 3D Meshes from active CAD features
  const updateModelGeometry = useCallback(() => {
    if (!meshGroupRef.current) return;

    // Clear existing meshes
    while (meshGroupRef.current.children.length > 0) {
      const child = meshGroupRef.current.children[0];
      meshGroupRef.current.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    }

    // Default base dimensions
    let width = 100;
    let height = 60;
    let depth = 30;
    let filletRadius = 0;

    const sketchFeat = activeFeatures.find((f) => f.type === "sketch");
    if (sketchFeat) {
      const p = sketchFeat.parameters as SketchParameters;
      width = p.width || width;
      height = p.height || height;
    }

    const extrudeFeat = activeFeatures.find((f) => f.type === "extrude");
    if (extrudeFeat) {
      const p = extrudeFeat.parameters as ExtrudeParameters;
      depth = p.depth || depth;
    }

    const filletFeat = activeFeatures.find((f) => f.type === "fillet");
    if (filletFeat) {
      const p = filletFeat.parameters as FilletParameters;
      filletRadius = p.radius || 0;
    }

    // Main Body Box Geometry (scale in mm -> scene units)
    const bodyGeometry = new THREE.BoxGeometry(width / 10, depth / 10, height / 10);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.35,
      metalness: 0.45,
      wireframe,
    });

    const isBodySelected = selectedFeatureId === sketchFeat?.id || selectedFeatureId === extrudeFeat?.id;
    if (isBodySelected) {
      bodyMaterial.emissive = new THREE.Color(0x1e3a8a);
      bodyMaterial.emissiveIntensity = 0.5;
    }

    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    meshGroupRef.current.add(bodyMesh);

    // Outline / Wireframe overlay for selected feature
    const edges = new THREE.EdgesGeometry(bodyGeometry);
    const lineMat = new THREE.LineBasicMaterial({
      color: isBodySelected ? 0x38bdf8 : 0x1e293b,
      linewidth: isBodySelected ? 2 : 1,
    });
    const lineSegments = new THREE.LineSegments(edges, lineMat);
    meshGroupRef.current.add(lineSegments);

    // Render Fillet Indicator visual mesh if Fillet Feature is active
    if (filletRadius > 0 && filletFeat) {
      const isFilletSelected = selectedFeatureId === filletFeat.id;
      const cornerGeo = new THREE.CylinderGeometry(filletRadius / 10, filletRadius / 10, depth / 10, 16);
      const cornerMat = new THREE.MeshStandardMaterial({
        color: isFilletSelected ? 0xf59e0b : 0x60a5fa,
        roughness: 0.2,
        metalness: 0.6,
        wireframe,
      });

      // 4 corners
      const xOffset = width / 20;
      const zOffset = height / 20;
      const positions = [
        [xOffset, zOffset],
        [-xOffset, zOffset],
        [xOffset, -zOffset],
        [-xOffset, -zOffset],
      ];

      positions.forEach(([x, z]) => {
        const cyl = new THREE.Mesh(cornerGeo, cornerMat);
        cyl.position.set(x, 0, z);
        meshGroupRef.current?.add(cyl);
      });
    }

    // Render Hole features
    const holeFeatures = activeFeatures.filter((f) => f.type === "hole");
    holeFeatures.forEach((holeFeat) => {
      const p = holeFeat.parameters as HoleParameters;
      const isHoleSelected = selectedFeatureId === holeFeat.id;
      const radius = (p.diameter || 10) / 20; // in scene units
      const holeDepth = (p.depth || depth) / 10 + 0.2;

      const holeGeo = new THREE.CylinderGeometry(radius, radius, holeDepth, 24);
      const holeMat = new THREE.MeshStandardMaterial({
        color: isHoleSelected ? 0xef4444 : 0x0f172a,
        roughness: 0.8,
        metalness: 0.1,
        wireframe,
      });

      const holeMesh = new THREE.Mesh(holeGeo, holeMat);
      holeMesh.position.set((p.xOffset || 0) / 10, 0, (p.yOffset || 0) / 10);
      meshGroupRef.current?.add(holeMesh);
    });

    // Render Pattern features
    const patternFeatures = activeFeatures.filter((f) => f.type === "pattern");
    patternFeatures.forEach((patFeat) => {
      const p = patFeat.parameters as PatternParameters;
      const isPatSelected = selectedFeatureId === patFeat.id;
      const count = p.count || 3;
      const spacing = (p.spacing || 20) / 10;

      for (let i = 1; i < count; i++) {
        const pinGeo = new THREE.CylinderGeometry(0.5, 0.5, depth / 10 + 0.1, 16);
        const pinMat = new THREE.MeshStandardMaterial({
          color: isPatSelected ? 0x10b981 : 0x64748b,
          wireframe,
        });
        const pinMesh = new THREE.Mesh(pinGeo, pinMat);

        if (p.direction === "X") {
          pinMesh.position.set((i * spacing) - ((count * spacing) / 2), 0, 0);
        } else {
          pinMesh.position.set(0, 0, (i * spacing) - ((count * spacing) / 2));
        }
        meshGroupRef.current?.add(pinMesh);
      }
    });
  }, [activeFeatures, selectedFeatureId, wireframe]);

  // Setup Three.js Scene
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f172a);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(
        45,
        mount.clientWidth / mount.clientHeight,
        0.1,
        1000
      );
      camera.position.set(20, 20, 25);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      rendererRef.current = renderer;

      mount.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controlsRef.current = controls;

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
      dirLight1.position.set(30, 40, 20);
      dirLight1.castShadow = true;
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.5);
      dirLight2.position.set(-20, -20, -20);
      scene.add(dirLight2);

      // Grid & Axes
      const gridHelper = new THREE.GridHelper(50, 50, 0x334155, 0x1e293b);
      gridHelper.position.y = -6;
      gridHelper.name = "gridHelper";
      scene.add(gridHelper);

      const axesHelper = new THREE.AxesHelper(8);
      axesHelper.name = "axesHelper";
      scene.add(axesHelper);

      // Mesh group
      const meshGroup = new THREE.Group();
      scene.add(meshGroup);
      meshGroupRef.current = meshGroup;

      let animationFrameId: number;
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        if (!mount || !cameraRef.current || !rendererRef.current) return;
        cameraRef.current.aspect = mount.clientWidth / mount.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(mount.clientWidth, mount.clientHeight);
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        cancelAnimationFrame(animationFrameId);
        renderer.dispose();
        if (mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement);
        }
      };
    } catch (err) {
      console.warn("WebGL initialization failed, using 2D fallback viewport:", err);
      setWebGlSupported(false);
    }
  }, []);

  // Update Grid Visibility
  useEffect(() => {
    if (!sceneRef.current) return;
    const grid = sceneRef.current.getObjectByName("gridHelper");
    if (grid) grid.visible = showGrid;
    const axes = sceneRef.current.getObjectByName("axesHelper");
    if (axes) axes.visible = showGrid;
  }, [showGrid]);

  // Update Geometry when active features or parameters change
  useEffect(() => {
    if (webGlSupported) {
      updateModelGeometry();
    }
  }, [updateModelGeometry, webGlSupported]);

  // Camera preset views
  const setCameraView = (view: "iso" | "front" | "top" | "right") => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctr = controlsRef.current;

    switch (view) {
      case "iso":
        cam.position.set(20, 20, 25);
        break;
      case "front":
        cam.position.set(0, 0, 35);
        break;
      case "top":
        cam.position.set(0, 35, 0);
        break;
      case "right":
        cam.position.set(35, 0, 0);
        break;
    }
    ctr.target.set(0, 0, 0);
    ctr.update();
  };

  return (
    <div className="cad-viewport">
      {/* Viewport Toolbar */}
      <div className="cad-viewport__toolbar">
        <div className="viewport-view-btns">
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setCameraView("iso")}>
            Iso
          </button>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setCameraView("top")}>
            Top
          </button>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setCameraView("front")}>
            Front
          </button>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setCameraView("right")}>
            Right
          </button>
        </div>

        <div className="viewport-toggle-btns">
          <button
            type="button"
            className={`btn btn--sm ${wireframe ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setWireframe(!wireframe)}
            title="Toggle Wireframe Mode"
          >
            Wireframe
          </button>
          <button
            type="button"
            className={`btn btn--sm ${showGrid ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid & Axes"
          >
            Grid
          </button>
        </div>
      </div>

      {/* 3D Canvas Mount or Fallback */}
      {webGlSupported ? (
        <div ref={mountRef} className="cad-viewport__canvas" />
      ) : (
        <FallbackCanvas
          features={activeFeatures}
          selectedFeatureId={selectedFeatureId}
          onSelectFeature={onSelectFeature}
        />
      )}

      {/* Viewport Legend / Active Info */}
      <div className="cad-viewport__info-overlay">
        <span className="info-overlay__item">
          3D CAD Engine · {activeFeatures.length} Active Features
        </span>
        {selectedFeatureId && (
          <span className="info-overlay__item info-overlay__item--active">
            Selected: {features.find((f) => f.id === selectedFeatureId)?.name}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Clean SVG 2D/3D representation fallback for non-WebGL environments.
 */
function FallbackCanvas({
  features,
  selectedFeatureId,
}: {
  features: CADFeature[];
  selectedFeatureId: string | null;
  onSelectFeature?: (id: string) => void;
}) {
  const sketchFeat = features.find((f) => f.type === "sketch");
  const extrudeFeat = features.find((f) => f.type === "extrude");
  const filletFeat = features.find((f) => f.type === "fillet");
  const holeFeat = features.find((f) => f.type === "hole");

  const pSketch = (sketchFeat?.parameters as SketchParameters) || { width: 120, height: 80 };
  const pExtrude = (extrudeFeat?.parameters as ExtrudeParameters) || { depth: 35 };
  const pFillet = (filletFeat?.parameters as FilletParameters) || { radius: 8 };

  const w = Math.min(240, Math.max(60, pSketch.width));
  const h = Math.min(180, Math.max(40, pSketch.height));
  const d = Math.min(100, Math.max(10, pExtrude.depth));

  const isSelected = (id?: string) => id && selectedFeatureId === id;

  return (
    <div className="fallback-viewport">
      <svg width="100%" height="100%" viewBox="-200 -150 400 300">
        <defs>
          <linearGradient id="cadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Isometric Box Projection */}
        {/* Top Face */}
        <polygon
          points={`0,${-h / 2} ${w / 2},${-h / 2 - d / 2} 0,${-h / 2 - d} ${-w / 2},${-h / 2 - d / 2}`}
          fill={isSelected(sketchFeat?.id) ? "#38bdf8" : "#60a5fa"}
          stroke="#1e293b"
          strokeWidth="2"
        />

        {/* Front Face */}
        <polygon
          points={`0,${-h / 2} ${w / 2},${-h / 2 - d / 2} ${w / 2},${h / 2 - d / 2} 0,${h / 2}`}
          fill={isSelected(extrudeFeat?.id) ? "#2563eb" : "url(#cadGrad)"}
          stroke="#1e293b"
          strokeWidth="2"
        />

        {/* Left Face */}
        <polygon
          points={`0,${-h / 2} ${-w / 2},${-h / 2 - d / 2} ${-w / 2},${h / 2 - d / 2} 0,${h / 2}`}
          fill="#1e40af"
          stroke="#1e293b"
          strokeWidth="2"
        />

        {/* Fillet Indicators */}
        {filletFeat && pFillet.radius > 0 && (
          <circle
            cx={w / 4}
            cy={-h / 4}
            r={pFillet.radius / 2}
            fill="none"
            stroke={isSelected(filletFeat.id) ? "#f59e0b" : "#fbbf24"}
            strokeWidth="3"
            strokeDasharray="3 3"
          />
        )}

        {/* Hole Indicator */}
        {holeFeat && (
          <ellipse
            cx="0"
            cy={-d / 2}
            rx="16"
            ry="10"
            fill="#0f172a"
            stroke={isSelected(holeFeat.id) ? "#ef4444" : "#94a3b8"}
            strokeWidth="2"
          />
        )}
      </svg>
    </div>
  );
}
