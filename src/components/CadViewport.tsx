import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  generateToolpath,
  getToolpathStateAtProgress,
  type ToolpathPreset,
} from "../lib/toolpath";

export interface CadViewportRef {
  resetCamera: () => void;
  setViewPreset: (preset: "iso" | "top" | "front" | "side") => void;
}

export interface CadViewportProps {
  showWireframe?: boolean;
  showGrid?: boolean;
  showAxes?: boolean;
  toolpathPreset?: ToolpathPreset;
  isPlaying?: boolean;
  speedMultiplier?: number;
  progress?: number;
  onProgressChange?: (progress: number) => void;
  onToolStateChange?: (state: {
    isRapid: boolean;
    cutDepth: number;
    spindleRpm: number;
    feedRate: number;
  }) => void;
}

export const CadViewport = forwardRef<CadViewportRef, CadViewportProps>(function CadViewport(
  {
    showWireframe = true,
    showGrid = true,
    showAxes = true,
    toolpathPreset = "pocket",
    isPlaying = true,
    speedMultiplier = 1,
    progress: externalProgress,
    onProgressChange,
    onToolStateChange,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animation state refs
  const progressRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const speedRef = useRef<number>(speedMultiplier);

  // Sync refs with props
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    if (externalProgress !== undefined && Math.abs(externalProgress - progressRef.current) > 0.001) {
      progressRef.current = externalProgress;
    }
  }, [externalProgress]);

  // Three.js instances ref
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    gridHelper: THREE.GridHelper;
    axesGroup: THREE.Group;
    workpieceMesh: THREE.Mesh;
    wireframeMesh: THREE.LineSegments;
    fullPathLine: THREE.Line;
    rapidPathLine: THREE.Line;
    cutPathLine: THREE.Line;
    cutterGroup: THREE.Group;
    spindleMesh: THREE.Mesh;
    cutterGlow: THREE.Mesh;
    sparkParticles: THREE.Points;
  } | null>(null);

  // Camera presets API exposed via ref
  useImperativeHandle(ref, () => ({
    resetCamera: () => {
      if (!threeRef.current) return;
      const { camera, controls } = threeRef.current;
      camera.position.set(30, 25, 35);
      controls.target.set(0, 0, 0);
      controls.update();
    },
    setViewPreset: (preset: "iso" | "top" | "front" | "side") => {
      if (!threeRef.current) return;
      const { camera, controls } = threeRef.current;
      controls.target.set(0, 0, 0);
      switch (preset) {
        case "iso":
          camera.position.set(30, 25, 35);
          break;
        case "top":
          camera.position.set(0, 50, 0.001);
          break;
        case "front":
          camera.position.set(0, 0, 50);
          break;
        case "side":
          camera.position.set(50, 0, 0);
          break;
      }
      controls.update();
    },
  }));

  // Setup Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0a0e17");
    scene.fog = new THREE.FogExp2("#0a0e17", 0.008);

    // 2. Camera setup
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(30, 25, 35);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't flip below grid floor

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(30, 50, 20);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x3b82f6, 0.6); // Cyan/blue rim light
    dirLight2.position.set(-30, 20, -20);
    scene.add(dirLight2);

    // 6. Grid Helper
    const gridHelper = new THREE.GridHelper(80, 40, 0x3b82f6, 0x1e293b);
    gridHelper.position.y = -10;
    scene.add(gridHelper);

    // 7. Coordinate Axes Gizmo (Custom RGB triad)
    const axesGroup = new THREE.Group();
    const axisLen = 10;
    const axisRadius = 0.15;

    // X Axis (Red)
    const xAxisGeo = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLen);
    const xAxisMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const xAxis = new THREE.Mesh(xAxisGeo, xAxisMat);
    xAxis.rotation.z = -Math.PI / 2;
    xAxis.position.x = axisLen / 2;
    axesGroup.add(xAxis);

    // Y Axis (Green)
    const yAxisGeo = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLen);
    const yAxisMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const yAxis = new THREE.Mesh(yAxisGeo, yAxisMat);
    yAxis.position.y = axisLen / 2;
    axesGroup.add(yAxis);

    // Z Axis (Blue)
    const zAxisGeo = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLen);
    const zAxisMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const zAxis = new THREE.Mesh(zAxisGeo, zAxisMat);
    zAxis.rotation.x = Math.PI / 2;
    zAxis.position.z = axisLen / 2;
    axesGroup.add(zAxis);

    axesGroup.position.set(-32, -9.5, -32);
    scene.add(axesGroup);

    // 8. Workpiece CAD Mesh
    const blockGeo = new THREE.BoxGeometry(40, 16, 40);
    const blockMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.25,
      transparent: true,
      opacity: 0.85,
    });
    const workpieceMesh = new THREE.Mesh(blockGeo, blockMat);
    workpieceMesh.position.y = -8;
    workpieceMesh.receiveShadow = true;
    workpieceMesh.castShadow = true;
    scene.add(workpieceMesh);

    // Wireframe overlay on CAD model
    const wireGeo = new THREE.WireframeGeometry(blockGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 1,
      transparent: true,
      opacity: 0.4,
    });
    const wireframeMesh = new THREE.LineSegments(wireGeo, wireMat);
    workpieceMesh.add(wireframeMesh);

    // 9. Toolpath geometry lines
    // Background full toolpath line (faint grey/cyan)
    const fullPathMat = new THREE.LineDashedMaterial({
      color: 0x64748b,
      dashSize: 1,
      gapSize: 0.5,
      opacity: 0.5,
      transparent: true,
    });
    const fullPathGeo = new THREE.BufferGeometry();
    const fullPathLine = new THREE.Line(fullPathGeo, fullPathMat);
    scene.add(fullPathLine);

    // Rapid moves line (dashed orange)
    const rapidMat = new THREE.LineDashedMaterial({
      color: 0xf97316,
      dashSize: 0.8,
      gapSize: 0.4,
    });
    const rapidPathGeo = new THREE.BufferGeometry();
    const rapidPathLine = new THREE.Line(rapidPathGeo, rapidMat);
    scene.add(rapidPathLine);

    // Active Cut path line (bright glowing green/cyan traversed)
    const cutMat = new THREE.LineBasicMaterial({
      color: 0x10b981,
      linewidth: 2,
    });
    const cutPathGeo = new THREE.BufferGeometry();
    const cutPathLine = new THREE.Line(cutPathGeo, cutMat);
    scene.add(cutPathLine);

    // 10. CAM Tool Spindle Assembly
    const cutterGroup = new THREE.Group();

    // Spindle body (stainless steel metallic cylinder)
    const spindleGeo = new THREE.CylinderGeometry(1.2, 1.2, 8, 32);
    const spindleMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.1,
    });
    const spindleMesh = new THREE.Mesh(spindleGeo, spindleMat);
    spindleMesh.position.y = 4;
    spindleMesh.castShadow = true;
    cutterGroup.add(spindleMesh);

    // Carbide Endmill Tool tip (brass/gold metallic end)
    const toolTipGeo = new THREE.CylinderGeometry(0.5, 0.1, 4, 16);
    const toolTipMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      metalness: 0.95,
      roughness: 0.15,
    });
    const toolTipMesh = new THREE.Mesh(toolTipGeo, toolTipMat);
    toolTipMesh.position.y = 1;
    cutterGroup.add(toolTipMesh);

    // Cutter glow tip (active cutting indicator)
    const glowGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.6,
    });
    const cutterGlow = new THREE.Mesh(glowGeo, glowMat);
    cutterGlow.position.y = -1;
    cutterGroup.add(cutterGlow);

    // Spark Particles for active cutting
    const sparkCount = 40;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount * 3; i++) {
      sparkPositions[i] = (Math.random() - 0.5) * 1.5;
    }
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.3,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const sparkParticles = new THREE.Points(sparkGeo, sparkMat);
    sparkParticles.position.y = -1;
    cutterGroup.add(sparkParticles);

    scene.add(cutterGroup);

    threeRef.current = {
      scene,
      camera,
      renderer,
      controls,
      gridHelper,
      axesGroup,
      workpieceMesh,
      wireframeMesh,
      fullPathLine,
      rapidPathLine,
      cutPathLine,
      cutterGroup,
      spindleMesh,
      cutterGlow,
      sparkParticles,
    };

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // 11. Render Loop
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = (now - lastTime) / 1000;
      lastTime = now;

      controls.update();

      // Toolpath Animation update
      if (isPlayingRef.current) {
        // Advance progress
        const speed = speedRef.current * 0.08;
        progressRef.current += delta * speed;
        if (progressRef.current >= 1) {
          progressRef.current = 0; // Loop animation
        }
        if (onProgressChange) {
          onProgressChange(progressRef.current);
        }
      }

      // Update Tool & Line Geometry based on current progress
      const currentToolpath = generateToolpath(toolpathPreset);
      const state = getToolpathStateAtProgress(
        currentToolpath.points,
        currentToolpath.totalLength,
        progressRef.current
      );

      // Position cutter group
      cutterGroup.position.copy(state.position);

      // Rotate spindle for spinning tool visual
      spindleMesh.rotation.y += delta * (state.isRapid ? 5 : 25);

      // Particle sparks animation when cutting
      if (!state.isRapid) {
        sparkParticles.visible = true;
        (cutterGlow.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
        const positions = sparkParticles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += (Math.random() - 0.5) * 0.2;
          positions[i + 1] += Math.random() * 0.1;
          positions[i + 2] += (Math.random() - 0.5) * 0.2;
          if (Math.abs(positions[i]) > 1.2 || positions[i + 1] > 1.5) {
            positions[i] = (Math.random() - 0.5) * 0.4;
            positions[i + 1] = 0;
            positions[i + 2] = (Math.random() - 0.5) * 0.4;
          }
        }
        sparkParticles.geometry.attributes.position.needsUpdate = true;
      } else {
        sparkParticles.visible = false;
        (cutterGlow.material as THREE.MeshBasicMaterial).color.setHex(0xf97316);
      }

      // Update active cut line (traversed portion)
      const points = currentToolpath.points;
      const cutPositions: number[] = [];
      for (let i = 0; i <= state.segmentIndex && i < points.length; i++) {
        cutPositions.push(points[i].position.x, points[i].position.y, points[i].position.z);
      }
      cutPositions.push(state.position.x, state.position.y, state.position.z);

      cutPathLine.geometry.dispose();
      cutPathLine.geometry = new THREE.BufferGeometry();
      cutPathLine.geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(cutPositions, 3)
      );

      // Callback tool state info
      if (onToolStateChange) {
        onToolStateChange({
          isRapid: state.isRapid,
          cutDepth: state.cutDepth,
          spindleRpm: state.isRapid ? 1000 : 12000,
          feedRate: state.isRapid ? 5000 : 1500,
        });
      }

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [toolpathPreset]);

  // Handle visibility toggles
  useEffect(() => {
    if (!threeRef.current) return;
    threeRef.current.wireframeMesh.visible = showWireframe;
  }, [showWireframe]);

  useEffect(() => {
    if (!threeRef.current) return;
    threeRef.current.gridHelper.visible = showGrid;
  }, [showGrid]);

  useEffect(() => {
    if (!threeRef.current) return;
    threeRef.current.axesGroup.visible = showAxes;
  }, [showAxes]);

  // Update line geometries when toolpath preset changes
  useEffect(() => {
    if (!threeRef.current) return;
    const { fullPathLine, rapidPathLine } = threeRef.current;
    const toolpath = generateToolpath(toolpathPreset);

    // Full path geometry
    const fullPos: number[] = [];
    toolpath.points.forEach((p) => {
      fullPos.push(p.position.x, p.position.y, p.position.z);
    });
    fullPathLine.geometry.dispose();
    fullPathLine.geometry = new THREE.BufferGeometry();
    fullPathLine.geometry.setAttribute("position", new THREE.Float32BufferAttribute(fullPos, 3));
    fullPathLine.computeLineDistances();

    // Rapid lines
    const rapidPos: number[] = [];
    for (let i = 0; i < toolpath.points.length - 1; i++) {
      if (toolpath.points[i + 1].isRapid) {
        const p1 = toolpath.points[i].position;
        const p2 = toolpath.points[i + 1].position;
        rapidPos.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      }
    }
    rapidPathLine.geometry.dispose();
    rapidPathLine.geometry = new THREE.BufferGeometry();
    rapidPathLine.geometry.setAttribute("position", new THREE.Float32BufferAttribute(rapidPos, 3));
    rapidPathLine.computeLineDistances();
  }, [toolpathPreset]);

  return (
    <div className="cad-viewport-container" ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
});
