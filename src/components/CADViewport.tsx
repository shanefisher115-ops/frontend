import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Toolpath, ViewportConfig, ToolpathPoint } from '../types/cad';

export interface CADViewportHandle {
  resetCamera: () => void;
  setView: (view: 'isometric' | 'top' | 'front' | 'right') => void;
  play: () => void;
  pause: () => void;
  resetAnimation: () => void;
  setAnimationProgress: (progress: number) => void;
}

interface CADViewportProps {
  toolpath: Toolpath;
  config: ViewportConfig;
  playbackSpeed: number; // e.g., 0.5x, 1x, 2x, 5x
  onProgressChange?: (progress: number, currentPoint: ToolpathPoint, currentSegment: number) => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
}

export const CADViewport = forwardRef<CADViewportHandle, CADViewportProps>(
  ({ toolpath, config, playbackSpeed, onProgressChange, onPlaybackStateChange }, ref) => {
    const mountRef = useRef<HTMLDivElement>(null);

    // Three.js object references
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);

    // CAD scene meshes & objects
    const stockMeshRef = useRef<THREE.Mesh | null>(null);
    const stockWireframeMeshRef = useRef<THREE.Mesh | null>(null);
    const toolGroupRef = useRef<THREE.Group | null>(null);
    const toolpathLineRef = useRef<THREE.Line | null>(null);
    const gridHelperRef = useRef<THREE.GridHelper | null>(null);
    const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
    const cutMeshGroupRef = useRef<THREE.Group | null>(null);

    // Animation state ref
    const animStateRef = useRef({
      isPlaying: false,
      progress: 0, // 0 to 1
      currentSegmentIndex: 0,
      segmentProgress: 0,
      lastTimestamp: 0,
    });

    // Precalculate toolpath distances & total length
    const pathMetrics = useRef<{
      distances: number[];
      totalDistance: number;
    }>({ distances: [], totalDistance: 0 });

    // Calculate path distances when toolpath changes
    useEffect(() => {
      const pts = toolpath.points;
      const distances: number[] = [0];
      let total = 0;

      for (let i = 1; i < pts.length; i++) {
        const p1 = pts[i - 1];
        const p2 = pts[i];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dz = p2.z - p1.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        total += dist;
        distances.push(dist);
      }

      pathMetrics.current = { distances, totalDistance: total };
      animStateRef.current.progress = 0;
      animStateRef.current.currentSegmentIndex = 0;
      animStateRef.current.segmentProgress = 0;
    }, [toolpath]);

    // Setup imperative handle for parent controls
    useImperativeHandle(ref, () => ({
      resetCamera: () => {
        if (!cameraRef.current || !controlsRef.current) return;
        cameraRef.current.position.set(120, 100, 140);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      },
      setView: (view) => {
        if (!cameraRef.current || !controlsRef.current) return;
        const dist = 180;
        switch (view) {
          case 'top':
            cameraRef.current.position.set(0, dist, 0.001);
            break;
          case 'front':
            cameraRef.current.position.set(0, 0, dist);
            break;
          case 'right':
            cameraRef.current.position.set(dist, 0, 0);
            break;
          case 'isometric':
          default:
            cameraRef.current.position.set(120, 100, 140);
            break;
        }
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      },
      play: () => {
        animStateRef.current.isPlaying = true;
        if (onPlaybackStateChange) onPlaybackStateChange(true);
      },
      pause: () => {
        animStateRef.current.isPlaying = false;
        if (onPlaybackStateChange) onPlaybackStateChange(false);
      },
      resetAnimation: () => {
        animStateRef.current.progress = 0;
        animStateRef.current.currentSegmentIndex = 0;
        animStateRef.current.segmentProgress = 0;
        updateSceneToProgress(0);
      },
      setAnimationProgress: (progress: number) => {
        const clamped = Math.max(0, Math.min(1, progress));
        animStateRef.current.progress = clamped;
        updateSceneToProgress(clamped);
      },
    }));

    // Reusable function to update tool position and cut animation based on 0..1 progress
    const updateSceneToProgress = (progress: number) => {
      const pts = toolpath.points;
      if (!pts || pts.length === 0) return;

      const totalDist = pathMetrics.current.totalDistance;
      if (totalDist === 0) return;

      const targetDist = progress * totalDist;
      let accumulatedDist = 0;
      let segIdx = 0;
      let segRatio = 0;

      for (let i = 1; i < pts.length; i++) {
        const segLen = pathMetrics.current.distances[i];
        if (accumulatedDist + segLen >= targetDist || i === pts.length - 1) {
          segIdx = i - 1;
          const remaining = targetDist - accumulatedDist;
          segRatio = segLen > 0 ? Math.min(1, Math.max(0, remaining / segLen)) : 0;
          break;
        }
        accumulatedDist += segLen;
      }

      animStateRef.current.currentSegmentIndex = segIdx;
      animStateRef.current.segmentProgress = segRatio;

      const p1 = pts[segIdx];
      const p2 = pts[segIdx + 1] || p1;

      // Interpolate current tool position
      const currX = p1.x + (p2.x - p1.x) * segRatio;
      const currY = p1.y + (p2.y - p1.y) * segRatio;
      const currZ = p1.z + (p2.z - p1.z) * segRatio;

      if (toolGroupRef.current) {
        toolGroupRef.current.position.set(currX, currY, currZ);
      }

      // Re-generate cut material visualization up to current segment / interpolation
      if (cutMeshGroupRef.current) {
        // Clear previous cut geometries
        while (cutMeshGroupRef.current.children.length > 0) {
          const obj = cutMeshGroupRef.current.children[0] as THREE.Mesh;
          if (obj.geometry) obj.geometry.dispose();
          cutMeshGroupRef.current.remove(obj);
        }

        const toolRadius = config.toolDiameter / 2;
        const cutMaterial = new THREE.MeshStandardMaterial({
          color: config.cutColor,
          roughness: 0.6,
          metalness: 0.2,
          side: THREE.DoubleSide,
        });

        // Add cylinders for cut paths up to segIdx
        for (let i = 0; i <= segIdx; i++) {
          const startPt = pts[i];
          const isCurrentSeg = i === segIdx;
          const endPt = isCurrentSeg
            ? {
                x: currX,
                y: currY,
                z: currZ,
                feedRate: p2.feedRate,
                type: p2.type,
              }
            : pts[i + 1];

          if (!endPt) continue;
          if (startPt.type === 'rapid' || startPt.type === 'retract') continue;

          // Only draw cut cylinders if tool is at or below stock top surface
          const stockTopY = toolpath.stockDimensions.height / 2;
          if (startPt.y > stockTopY && endPt.y > stockTopY) continue;

          const startVec = new THREE.Vector3(startPt.x, Math.min(stockTopY, startPt.y), startPt.z);
          const endVec = new THREE.Vector3(endPt.x, Math.min(stockTopY, endPt.y), endPt.z);
          const len = startVec.distanceTo(endVec);

          if (len > 0.01) {
            const geom = new THREE.CylinderGeometry(toolRadius, toolRadius, len, 12);
            const mesh = new THREE.Mesh(geom, cutMaterial);

            // Orient cylinder along segment vector
            const midpoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
            mesh.position.copy(midpoint);

            const dir = new THREE.Vector3().subVectors(endVec, startVec).normalize();
            const axis = new THREE.Vector3(0, 1, 0); // cylinder default axis
            const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, dir);
            mesh.quaternion.copy(quaternion);

            cutMeshGroupRef.current.add(mesh);
          }
        }
      }

      // Callback to parent for UI status updates
      if (onProgressChange) {
        const interpPoint: ToolpathPoint = {
          x: currX,
          y: currY,
          z: currZ,
          feedRate: p1.feedRate,
          type: p1.type,
        };
        onProgressChange(progress, interpPoint, segIdx);
      }
    };

    // Main Three.js Initialization
    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      // 1. Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0e111d); // Sleek CAD dark background
      sceneRef.current = scene;

      // 2. Camera
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(120, 100, 140);
      cameraRef.current = camera;

      // 3. Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // 4. OrbitControls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't flip below horizon too far
      controlsRef.current = controls;

      // 5. Ambient & Directional Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
      dirLight1.position.set(100, 150, 100);
      dirLight1.castShadow = true;
      dirLight1.shadow.mapSize.width = 2048;
      dirLight1.shadow.mapSize.height = 2048;
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0x7090ff, 0.4);
      dirLight2.position.set(-100, 50, -100);
      scene.add(dirLight2);

      // 6. CAD Grid & Axes Helpers
      const gridHelper = new THREE.GridHelper(200, 40, 0x3b82f6, 0x232942);
      gridHelper.position.y = -toolpath.stockDimensions.height / 2;
      scene.add(gridHelper);
      gridHelperRef.current = gridHelper;

      const axesHelper = new THREE.AxesHelper(30);
      // Offset axes to bottom corner of stock
      axesHelper.position.set(
        -toolpath.stockDimensions.width / 2 - 5,
        -toolpath.stockDimensions.height / 2,
        toolpath.stockDimensions.depth / 2 + 5
      );
      scene.add(axesHelper);
      axesHelperRef.current = axesHelper;

      // 7. Cut Material Group
      const cutMeshGroup = new THREE.Group();
      scene.add(cutMeshGroup);
      cutMeshGroupRef.current = cutMeshGroup;

      // 8. Tool Group (Cylinder spindle body + cone cutter tip)
      const toolGroup = new THREE.Group();

      // Tool shank / holder (metallic silver cylinder)
      const shankGeom = new THREE.CylinderGeometry(4, 4, 25, 16);
      const shankMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.9,
        roughness: 0.2,
      });
      const shankMesh = new THREE.Mesh(shankGeom, shankMat);
      shankMesh.position.y = 20;
      toolGroup.add(shankMesh);

      // Endmill cutter bit (gold/carbide coated)
      const bitGeom = new THREE.CylinderGeometry(
        config.toolDiameter / 2,
        config.toolDiameter / 2,
        15,
        16
      );
      const bitMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.8,
        roughness: 0.3,
      });
      const bitMesh = new THREE.Mesh(bitGeom, bitMat);
      bitMesh.position.y = 7.5;
      toolGroup.add(bitMesh);

      // Cutting tip marker indicator
      const tipGeom = new THREE.ConeGeometry(config.toolDiameter / 2, 3, 16);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const tipMesh = new THREE.Mesh(tipGeom, tipMat);
      tipMesh.rotation.x = Math.PI; // point downwards
      tipMesh.position.y = -1.5;
      toolGroup.add(tipMesh);

      scene.add(toolGroup);
      toolGroupRef.current = toolGroup;

      // Animation render loop
      let animationFrameId: number;

      const renderLoop = (time: number) => {
        animationFrameId = requestAnimationFrame(renderLoop);

        // Handle animation step if playing
        if (animStateRef.current.isPlaying) {
          if (animStateRef.current.lastTimestamp === 0) {
            animStateRef.current.lastTimestamp = time;
          }
          const deltaSec = (time - animStateRef.current.lastTimestamp) / 1000;
          animStateRef.current.lastTimestamp = time;

          // Calculate distance to travel this frame based on feed rate & speed multiplier
          const currSegIdx = animStateRef.current.currentSegmentIndex;
          const currentPoint = toolpath.points[currSegIdx] || toolpath.points[0];
          const feedRate = currentPoint?.feedRate || 1000; // mm/min
          const speedMmPerSec = (feedRate / 60) * playbackSpeed * 2.5; // Scaled for smooth interactive preview

          const deltaDist = speedMmPerSec * deltaSec;
          const totalDist = pathMetrics.current.totalDistance;

          if (totalDist > 0) {
            let nextProgress = animStateRef.current.progress + deltaDist / totalDist;
            if (nextProgress >= 1) {
              nextProgress = 1;
              animStateRef.current.isPlaying = false;
              if (onPlaybackStateChange) onPlaybackStateChange(false);
            }
            animStateRef.current.progress = nextProgress;
            updateSceneToProgress(nextProgress);
          }
        } else {
          animStateRef.current.lastTimestamp = time;
        }

        controls.update();
        renderer.render(scene, camera);
      };

      animationFrameId = requestAnimationFrame(renderLoop);

      // Resize Handler
      const handleResize = () => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);

        renderer.dispose();
        if (container && renderer.domElement) {
          container.removeChild(renderer.domElement);
        }
      };
    }, []); // Init once on mount

    // Update Stock Geometry & Material when config or stockDimensions change
    useEffect(() => {
      const scene = sceneRef.current;
      if (!scene) return;

      // Remove existing stock mesh
      if (stockMeshRef.current) {
        scene.remove(stockMeshRef.current);
        stockMeshRef.current.geometry.dispose();
        (stockMeshRef.current.material as THREE.Material).dispose();
        stockMeshRef.current = null;
      }
      if (stockWireframeMeshRef.current) {
        scene.remove(stockWireframeMeshRef.current);
        stockWireframeMeshRef.current.geometry.dispose();
        (stockWireframeMeshRef.current.material as THREE.Material).dispose();
        stockWireframeMeshRef.current = null;
      }

      const { width, height, depth } = toolpath.stockDimensions;
      const stockGeom = new THREE.BoxGeometry(width, height, depth);

      // Determine material appearance
      let matColor = 0x94a3b8;
      let roughness = 0.4;
      let metalness = 0.5;

      switch (config.material) {
        case 'aluminum':
          matColor = 0xc0c8d0;
          roughness = 0.3;
          metalness = 0.8;
          break;
        case 'brass':
          matColor = 0xeab308;
          roughness = 0.35;
          metalness = 0.7;
          break;
        case 'steel':
          matColor = 0x64748b;
          roughness = 0.5;
          metalness = 0.9;
          break;
        case 'wood':
          matColor = 0xd97706;
          roughness = 0.8;
          metalness = 0.05;
          break;
      }

      const stockMat = new THREE.MeshStandardMaterial({
        color: matColor,
        roughness,
        metalness,
        wireframe: config.wireframe,
        transparent: true,
        opacity: 0.92,
      });

      const stockMesh = new THREE.Mesh(stockGeom, stockMat);
      stockMesh.castShadow = true;
      stockMesh.receiveShadow = true;
      scene.add(stockMesh);
      stockMeshRef.current = stockMesh;

      // Add thin outline wireframe overlay if not in full wireframe mode
      if (!config.wireframe) {
        const wireframeGeom = new THREE.WireframeGeometry(stockGeom);
        const wireframeMat = new THREE.LineBasicMaterial({
          color: 0x38bdf8,
          opacity: 0.3,
          transparent: true,
        });
        const wireframeLine = new THREE.LineSegments(wireframeGeom, wireframeMat);
        scene.add(wireframeLine);
        stockWireframeMeshRef.current = wireframeLine as unknown as THREE.Mesh;
      }
    }, [toolpath.stockDimensions, config.material, config.wireframe]);

    // Toggle Grid and Axes display
    useEffect(() => {
      if (gridHelperRef.current) gridHelperRef.current.visible = config.showGrid;
      if (axesHelperRef.current) axesHelperRef.current.visible = config.showAxes;
    }, [config.showGrid, config.showAxes]);

    // Update CAM Toolpath Line overlay
    useEffect(() => {
      const scene = sceneRef.current;
      if (!scene) return;

      if (toolpathLineRef.current) {
        scene.remove(toolpathLineRef.current);
        toolpathLineRef.current.geometry.dispose();
        (toolpathLineRef.current.material as THREE.Material).dispose();
        toolpathLineRef.current = null;
      }

      if (!config.showToolpath) return;

      const points: THREE.Vector3[] = toolpath.points.map(
        (p) => new THREE.Vector3(p.x, p.y, p.z)
      );

      const geom = new THREE.BufferGeometry().setFromPoints(points);

      // Color code toolpath segments by type (cut vs rapid)
      const colors: number[] = [];
      toolpath.points.forEach((p) => {
        if (p.type === 'rapid' || p.type === 'retract') {
          colors.push(0.94, 0.27, 0.27); // Red for rapid/retract
        } else if (p.type === 'plunge') {
          colors.push(0.96, 0.62, 0.08); // Yellow for plunge
        } else {
          colors.push(0.2, 0.8, 0.4); // Emerald green for cutting feed
        }
      });

      geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        linewidth: 2,
      });

      const line = new THREE.Line(geom, mat);
      scene.add(line);
      toolpathLineRef.current = line;
    }, [toolpath, config.showToolpath]);

    return (
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '450px',
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      />
    );
  }
);

CADViewport.displayName = 'CADViewport';
