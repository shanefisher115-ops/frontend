import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CAD_MODELS } from '../lib/cadModels';
import {
  CAM_TOOLPATHS,
  buildToolpathSegments,
  evaluateToolpathProgress,
  type MotionType,
  type ToolpathSegment,
} from '../lib/camToolpath';

export interface CadViewportProps {
  className?: string;
  initialModelId?: string;
  initialToolpathId?: string;
}

const MOTION_COLORS: Record<MotionType, number> = {
  rapid: 0xffcc00,  // Bright yellow
  plunge: 0xff6600, // Orange
  cutting: 0x00f0ff, // Vibrant cyan
  retract: 0xaa44ff, // Magenta / purple
};

const MOTION_LABELS: Record<MotionType, string> = {
  rapid: 'G0 Rapid Move',
  plunge: 'G1 Plunge Entry',
  cutting: 'G1 Milling Cut',
  retract: 'G0 Retract Exit',
};

export function CadViewport({
  className = '',
  initialModelId = 'bracket',
  initialToolpathId = 'contour3D',
}: CadViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  // Component states
  const [selectedModelKey, setSelectedModelKey] = useState<string>(initialModelId);
  const [selectedToolpathKey, setSelectedToolpathKey] = useState<string>(initialToolpathId);
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showAxes, setShowAxes] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [progress, setProgress] = useState<number>(0); // 0 to 1

  // Digital readout state
  const [readout, setReadout] = useState<{
    x: number;
    y: number;
    z: number;
    motionType: MotionType;
    feedRate: number;
    segmentIdx: number;
    totalSegments: number;
  }>({
    x: 0,
    y: 0,
    z: 0,
    motionType: 'rapid',
    feedRate: 3000,
    segmentIdx: 0,
    totalSegments: 0,
  });

  // Three.js scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const axesRef = useRef<THREE.AxesHelper | null>(null);

  // Cutter & Toolpath refs
  const cutterGroupRef = useRef<THREE.Group | null>(null);
  const cutterSpindleMeshRef = useRef<THREE.Mesh | null>(null);
  const toolpathLinesGroupRef = useRef<THREE.Group | null>(null);
  const cutTrailLineRef = useRef<THREE.Line | null>(null);

  // Animation tracking refs
  const animationFrameRef = useRef<number | null>(null);
  const segmentsRef = useRef<ToolpathSegment[]>([]);
  const totalLengthRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const isLoopingRef = useRef<boolean>(isLooping);
  const speedMultiplierRef = useRef<number>(speedMultiplier);

  // Sync state refs
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  useEffect(() => {
    speedMultiplierRef.current = speedMultiplier;
  }, [speedMultiplier]);

  // Set up toolpath data when selectedToolpathKey changes
  useEffect(() => {
    const toolpathDef = CAM_TOOLPATHS[selectedToolpathKey] || CAM_TOOLPATHS.contour3D;
    const { segments, totalLength } = buildToolpathSegments(toolpathDef.points);
    segmentsRef.current = segments;
    totalLengthRef.current = totalLength;

    // Build visual toolpath lines
    if (toolpathLinesGroupRef.current) {
      // Clear old lines
      while (toolpathLinesGroupRef.current.children.length > 0) {
        const child = toolpathLinesGroupRef.current.children[0];
        toolpathLinesGroupRef.current.remove(child);
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }

      // Rebuild colored segments
      segments.forEach((seg) => {
        const geom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(seg.start.x, seg.start.y, seg.start.z),
          new THREE.Vector3(seg.end.x, seg.end.y, seg.end.z),
        ]);
        const color = MOTION_COLORS[seg.type];
        const lineMat = new THREE.LineBasicMaterial({
          color,
          linewidth: seg.type === 'cutting' ? 2 : 1,
          transparent: true,
          opacity: seg.type === 'rapid' ? 0.5 : 0.85,
        });
        const line = new THREE.Line(geom, lineMat);
        toolpathLinesGroupRef.current?.add(line);
      });
    }

    // Reset progress on path change
    progressRef.current = 0;
    setProgress(0);
  }, [selectedToolpathKey]);

  // Update CAD Model Mesh when selectedModelKey or showWireframe changes
  useEffect(() => {
    if (!sceneRef.current) return;

    if (modelGroupRef.current) {
      sceneRef.current.remove(modelGroupRef.current);
      modelGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    const modelDef = CAD_MODELS[selectedModelKey] || CAD_MODELS.bracket;
    const meshGroup = modelDef.createMesh();

    meshGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (showWireframe) {
          child.material = new THREE.MeshBasicMaterial({
            color: modelDef.materialColor,
            wireframe: true,
          });
        }
      }
    });

    modelGroupRef.current = meshGroup;
    sceneRef.current.add(meshGroup);
  }, [selectedModelKey, showWireframe]);

  // Toggle Grid visibility
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // Toggle Axes visibility
  useEffect(() => {
    if (axesRef.current) {
      axesRef.current.visible = showAxes;
    }
  }, [showAxes]);

  // Three.js Scene Setup
  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    const width = mountEl.clientWidth || 800;
    const height = mountEl.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1322); // Dark studio slate blue
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 10, 14);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountEl.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.5, 0);
    controls.update();
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(15, 25, 15);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x4080ff, 0.5);
    dirLight2.position.set(-15, 10, -15);
    scene.add(dirLight2);

    const hemisphereLight = new THREE.HemisphereLight(0x334466, 0x111122, 0.5);
    scene.add(hemisphereLight);

    // 6. Grid Helper
    const grid = new THREE.GridHelper(24, 24, 0x00f0ff, 0x223355);
    grid.position.y = 0;
    gridRef.current = grid;
    scene.add(grid);

    // 7. Coordinate Axes Helper (X=Red, Y=Green, Z=Blue)
    const axes = new THREE.AxesHelper(4);
    axesRef.current = axes;
    scene.add(axes);

    // 8. Toolpath Lines Group
    const toolpathGroup = new THREE.Group();
    toolpathLinesGroupRef.current = toolpathGroup;
    scene.add(toolpathGroup);

    // 9. Cut Trail Line (Highlight active path taken)
    const trailGeom = new THREE.BufferGeometry();
    const trailMat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      linewidth: 3,
    });
    const trailLine = new THREE.Line(trailGeom, trailMat);
    cutTrailLineRef.current = trailLine;
    scene.add(trailLine);

    // 10. CNC Cutter Assembly
    const cutterGroup = new THREE.Group();

    // Tool Shank / Cylinder
    const toolBitGeom = new THREE.CylinderGeometry(0.3, 0.3, 2.5, 16);
    const toolBitMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 0.9,
      roughness: 0.1,
    });
    const toolBitMesh = new THREE.Mesh(toolBitGeom, toolBitMat);
    toolBitMesh.position.y = 1.25;
    toolBitMesh.castShadow = true;
    cutterGroup.add(toolBitMesh);

    // Tool Cone / Collet Chuck
    const colletGeom = new THREE.CylinderGeometry(0.8, 0.4, 1.5, 16);
    const colletMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      metalness: 0.8,
      roughness: 0.2,
    });
    const colletMesh = new THREE.Mesh(colletGeom, colletMat);
    colletMesh.position.y = 2.5 + 0.75;
    colletMesh.castShadow = true;
    cutterGroup.add(colletMesh);

    // Spindle Housing
    const spindleGeom = new THREE.CylinderGeometry(1.2, 1.2, 3.0, 24);
    const spindleMat = new THREE.MeshStandardMaterial({
      color: 0x333344,
      metalness: 0.5,
      roughness: 0.5,
    });
    const spindleMesh = new THREE.Mesh(spindleGeom, spindleMat);
    spindleMesh.position.y = 2.5 + 1.5 + 1.5;
    cutterSpindleMeshRef.current = spindleMesh;
    cutterGroup.add(spindleMesh);

    // Cutting Spark Point Indicator (small sphere at tool tip)
    const tipGeom = new THREE.SphereGeometry(0.12, 12, 12);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const tipMesh = new THREE.Mesh(tipGeom, tipMat);
    tipMesh.position.y = 0;
    cutterGroup.add(tipMesh);

    cutterGroupRef.current = cutterGroup;
    scene.add(cutterGroup);

    // 11. Initial Toolpath initialization
    const initialTp = CAM_TOOLPATHS[selectedToolpathKey] || CAM_TOOLPATHS.contour3D;
    const { segments, totalLength } = buildToolpathSegments(initialTp.points);
    segmentsRef.current = segments;
    totalLengthRef.current = totalLength;

    // Animation Loop
    let lastTime = performance.now();

    const animate = (time: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Update OrbitControls
      controls.update();

      // Update Toolpath Animation
      if (segmentsRef.current.length > 0 && totalLengthRef.current > 0) {
        if (isPlayingRef.current) {
          // Increment progress based on speed
          const baseRate = 0.05 * speedMultiplierRef.current;
          progressRef.current += delta * baseRate;

          if (progressRef.current >= 1.0) {
            if (isLoopingRef.current) {
              progressRef.current = 0.0;
            } else {
              progressRef.current = 1.0;
              setIsPlaying(false);
            }
          }
          setProgress(progressRef.current);
        }

        // Evaluate cutter position and cut path trail
        const state = evaluateToolpathProgress(
          segmentsRef.current,
          totalLengthRef.current,
          progressRef.current
        );

        // Position cutter group
        if (cutterGroupRef.current) {
          cutterGroupRef.current.position.copy(state.position);
          // Spin spindle if cutting
          if (cutterSpindleMeshRef.current && (state.motionType === 'cutting' || state.motionType === 'plunge')) {
            cutterSpindleMeshRef.current.rotation.y += delta * 25;
          }
        }

        // Update Cut Trail Line
        if (cutTrailLineRef.current && state.cutPathPoints.length > 1) {
          cutTrailLineRef.current.geometry.dispose();
          cutTrailLineRef.current.geometry = new THREE.BufferGeometry().setFromPoints(state.cutPathPoints);
        }

        // Update digital readout state
        setReadout({
          x: state.position.x,
          y: state.position.y,
          z: state.position.z,
          motionType: state.motionType,
          feedRate: state.feedRate,
          segmentIdx: state.segmentIndex + 1,
          totalSegments: segmentsRef.current.length,
        });
      }

      renderer.render(scene, camera);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Handle Resize
    const handleResize = () => {
      if (!mountEl || !rendererRef.current || !cameraRef.current) return;
      const w = mountEl.clientWidth;
      const h = mountEl.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mountEl && rendererRef.current) {
        mountEl.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Scrub progress handler
  const handleProgressScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    progressRef.current = val;
    setProgress(val);
  };

  // Camera Presets
  const setCameraView = useCallback((preset: 'iso' | 'top' | 'front' | 'side') => {
    if (!cameraRef.current || !controlsRef.current) return;

    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    const target = new THREE.Vector3(0, 1.5, 0);

    switch (preset) {
      case 'top':
        cam.position.set(0, 20, 0.001);
        break;
      case 'front':
        cam.position.set(0, 2, 18);
        break;
      case 'side':
        cam.position.set(18, 2, 0);
        break;
      case 'iso':
      default:
        cam.position.set(12, 10, 14);
        break;
    }

    ctrl.target.copy(target);
    cam.lookAt(target);
    ctrl.update();
  }, []);

  return (
    <div className={`cad-viewport-container ${className}`} ref={containerRef}>
      {/* CAD Toolbar */}
      <div className="cad-toolbar">
        <div className="cad-toolbar__group">
          <label className="cad-toolbar__label" htmlFor="model-select">CAD Model:</label>
          <select
            id="model-select"
            className="cad-toolbar__select"
            value={selectedModelKey}
            onChange={(e) => setSelectedModelKey(e.target.value)}
          >
            {Object.entries(CAD_MODELS).map(([key, def]) => (
              <option key={key} value={key}>
                {def.name}
              </option>
            ))}
          </select>
        </div>

        <div className="cad-toolbar__group">
          <label className="cad-toolbar__label" htmlFor="toolpath-select">CAM Path:</label>
          <select
            id="toolpath-select"
            className="cad-toolbar__select"
            value={selectedToolpathKey}
            onChange={(e) => setSelectedToolpathKey(e.target.value)}
          >
            {Object.entries(CAM_TOOLPATHS).map(([key, tp]) => (
              <option key={key} value={key}>
                {tp.name} ({tp.toolDiameter}mm cutter)
              </option>
            ))}
          </select>
        </div>

        <div className="cad-toolbar__group cad-toolbar__toggles">
          <button
            type="button"
            className={`cad-btn ${showWireframe ? 'cad-btn--active' : ''}`}
            onClick={() => setShowWireframe(!showWireframe)}
            title="Toggle Wireframe Mesh"
            aria-label="Toggle Wireframe Mesh"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            Wireframe
          </button>

          <button
            type="button"
            className={`cad-btn ${showGrid ? 'cad-btn--active' : ''}`}
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid Floor"
            aria-label="Toggle Grid Floor"
          >
            Grid
          </button>

          <button
            type="button"
            className={`cad-btn ${showAxes ? 'cad-btn--active' : ''}`}
            onClick={() => setShowAxes(!showAxes)}
            title="Toggle Axis Gizmo"
            aria-label="Toggle Axis Gizmo"
          >
            Axes
          </button>
        </div>

        <div className="cad-toolbar__group cad-toolbar__views">
          <span className="cad-toolbar__label">View:</span>
          <button type="button" className="cad-btn cad-btn--sm" onClick={() => setCameraView('iso')}>
            Iso
          </button>
          <button type="button" className="cad-btn cad-btn--sm" onClick={() => setCameraView('top')}>
            Top
          </button>
          <button type="button" className="cad-btn cad-btn--sm" onClick={() => setCameraView('front')}>
            Front
          </button>
          <button type="button" className="cad-btn cad-btn--sm" onClick={() => setCameraView('side')}>
            Side
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Canvas Mount */}
      <div className="cad-canvas-mount" ref={mountRef}>
        {/* Orientation Axis Indicator Gizmo Overlay */}
        <div className="cad-axis-gizmo" aria-hidden="true">
          <div className="axis-item axis-x"><span className="axis-label">X</span></div>
          <div className="axis-item axis-y"><span className="axis-label">Y</span></div>
          <div className="axis-item axis-z"><span className="axis-label">Z</span></div>
        </div>

        {/* Real-time Digital Readout (DRO) */}
        <div className="cad-dro-overlay">
          <div className="cad-dro__header">
            <span className="cad-dro__title">CNC DIGITAL READOUT</span>
            <span className={`cad-dro__motion cad-dro__motion--${readout.motionType}`}>
              {MOTION_LABELS[readout.motionType]}
            </span>
          </div>
          <div className="cad-dro__coords">
            <div className="dro-axis">
              <span className="dro-axis__name dro-x">X</span>
              <span className="dro-axis__val">{readout.x.toFixed(3)} mm</span>
            </div>
            <div className="dro-axis">
              <span className="dro-axis__name dro-y">Y</span>
              <span className="dro-axis__val">{readout.y.toFixed(3)} mm</span>
            </div>
            <div className="dro-axis">
              <span className="dro-axis__name dro-z">Z</span>
              <span className="dro-axis__val">{readout.z.toFixed(3)} mm</span>
            </div>
          </div>
          <div className="cad-dro__meta">
            <span>Feed: <strong>{readout.feedRate} mm/min</strong></span>
            <span>Seg: <strong>{readout.segmentIdx} / {readout.totalSegments}</strong></span>
          </div>
        </div>
      </div>

      {/* CAM Animation Control Panel */}
      <div className="cad-controls">
        <div className="cad-controls__playback">
          <button
            type="button"
            className="cad-btn cad-btn--primary"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? 'Pause Animation' : 'Play Animation'}
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <button
            type="button"
            className="cad-btn"
            onClick={() => {
              progressRef.current = 0;
              setProgress(0);
            }}
            title="Reset Cutter to Start"
            aria-label="Reset Cutter to Start"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset
          </button>

          <button
            type="button"
            className={`cad-btn ${isLooping ? 'cad-btn--active' : ''}`}
            onClick={() => setIsLooping(!isLooping)}
            title="Toggle Continuous Loop"
            aria-label="Toggle Continuous Loop"
          >
            Loop
          </button>
        </div>

        {/* Scrub Slider */}
        <div className="cad-controls__scrub">
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={progress}
            onChange={handleProgressScrub}
            className="cad-scrubber"
            aria-label="CAM Cutter Path Progress"
          />
          <span className="cad-scrub-val">{(progress * 100).toFixed(1)}%</span>
        </div>

        {/* Speed Selector */}
        <div className="cad-controls__speed">
          <label htmlFor="speed-select" className="cad-toolbar__label">Speed:</label>
          <select
            id="speed-select"
            className="cad-toolbar__select"
            value={speedMultiplier}
            onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
          >
            <option value={0.25}>0.25x</option>
            <option value={0.5}>0.5x</option>
            <option value={1.0}>1.0x</option>
            <option value={2.0}>2.0x</option>
            <option value={4.0}>4.0x</option>
          </select>
        </div>
      </div>
    </div>
  );
}
