import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { createCADHeatmapMaterial, ColormapType, VisualizationMode } from '../shaders/cadHeatmapShader';
import { getCADGeometry, CADModelType, CADGeometryResult } from '../lib/cadGeometry';

export interface SurfaceProbeData {
  point: THREE.Vector3;
  vonMises: number;
  temperature: number;
  gradientMag: number;
  yieldStrength: number;
  safetyFactor: number;
}

export function CADViewer() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Shader & Model Controls State
  const [modelType, setModelType] = useState<CADModelType>('bracket');
  const [mode, setMode] = useState<VisualizationMode>('vonMises');
  const [colormap, setColormap] = useState<ColormapType>('turbo');
  const [stressMin, setStressMin] = useState<number>(0);
  const [stressMax, setStressMax] = useState<number>(350);
  const [tempMin, setTempMin] = useState<number>(20);
  const [tempMax, setTempMax] = useState<number>(450);
  const [showIsoContours, setShowIsoContours] = useState<boolean>(true);
  const [contourFreq, setContourFreq] = useState<number>(10);
  const [deformationScale, setDeformationScale] = useState<number>(0.15);
  const [isAnimating, setIsAnimating] = useState<boolean>(true);

  // Interactive Hover Inspection Probe Data
  const [probeData, setProbeData] = useState<SurfaceProbeData | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const pointerRef = useRef<THREE.Vector2>(new THREE.Vector2(-999, -999));
  const modelDataRef = useRef<CADGeometryResult | null>(null);

  // Orbit state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.4, y: 0.6 });

  // Map modes & colormaps to numeric uniforms
  const modeIndexMap: Record<VisualizationMode, number> = {
    vonMises: 0,
    thermal: 1,
    thermalGradient: 2,
    combined: 3,
  };

  const colormapIndexMap: Record<ColormapType, number> = {
    turbo: 0,
    jet: 1,
    viridis: 2,
    inferno: 3,
    coolwarm: 4,
  };

  // Re-load geometry when modelType changes
  const updateGeometry = useCallback(() => {
    if (!meshRef.current) return;
    const cadResult = getCADGeometry(modelType);
    modelDataRef.current = cadResult;

    if (meshRef.current.geometry) {
      meshRef.current.geometry.dispose();
    }
    meshRef.current.geometry = cadResult.geometry;

    // Update range slider defaults based on loaded model physics
    setStressMin(Math.round(cadResult.minStress));
    setStressMax(Math.round(cadResult.maxStress));
    setTempMin(Math.round(cadResult.minTemp));
    setTempMax(Math.round(cadResult.maxTemp));
  }, [modelType]);

  // Set up Three.js Canvas Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Dark slate background
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Grid Floor Helper for CAD Environment Context
    const gridHelper = new THREE.GridHelper(12, 24, 0x334155, 0x1e293b);
    gridHelper.position.y = -2.5;
    scene.add(gridHelper);

    // Shader Material
    const material = createCADHeatmapMaterial({
      mode: modeIndexMap[mode],
      colormap: colormapIndexMap[colormap],
      stressMin,
      stressMax,
      tempMin,
      tempMax,
      showIsoContours,
    });
    materialRef.current = material;

    // Initial CAD Mesh
    const cadResult = getCADGeometry(modelType);
    modelDataRef.current = cadResult;

    const mesh = new THREE.Mesh(cadResult.geometry, material);
    mesh.rotation.x = rotationRef.current.x;
    mesh.rotation.y = rotationRef.current.y;
    meshRef.current = mesh;
    scene.add(mesh);

    // Animation loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      if (materialRef.current && isAnimating) {
        materialRef.current.uniforms.uTime.value = elapsedTime;
      }

      if (meshRef.current) {
        meshRef.current.rotation.x = rotationRef.current.x;
        meshRef.current.rotation.y = rotationRef.current.y;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle Window Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Material Uniforms on state changes
  useEffect(() => {
    if (!materialRef.current) return;
    const u = materialRef.current.uniforms;
    u.uMode.value = modeIndexMap[mode];
    u.uColormap.value = colormapIndexMap[colormap];
    u.uStressMin.value = stressMin;
    u.uStressMax.value = stressMax;
    u.uTempMin.value = tempMin;
    u.uTempMax.value = tempMax;
    u.uShowIsoContours.value = showIsoContours ? 1.0 : 0.0;
    u.uContourFrequency.value = contourFreq;
    u.uDeformationScale.value = deformationScale;
  }, [mode, colormap, stressMin, stressMax, tempMin, tempMax, showIsoContours, contourFreq, deformationScale]);

  // React to modelType change
  useEffect(() => {
    updateGeometry();
  }, [modelType, updateGeometry]);

  // Pointer Interaction Handlers for Orbit & Surface Probe Tooltip
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const container = mountRef.current;
    if (!container) return;

    // Update screen coordinates for hover tooltip positioning
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Handle Camera Orbit Rotation when dragging
    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      rotationRef.current.y += deltaX * 0.008;
      rotationRef.current.x += deltaY * 0.008;

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Normalized Device Coordinates (-1 to +1) for Raycasting
    pointerRef.current.x = (x / rect.width) * 2 - 1;
    pointerRef.current.y = -(y / rect.height) * 2 + 1;

    if (cameraRef.current && meshRef.current && materialRef.current) {
      raycasterRef.current.setFromCamera(pointerRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObject(meshRef.current);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const face = hit.face;

        if (face && hit.point && meshRef.current.geometry) {
          const geom = meshRef.current.geometry;
          const aStress = geom.getAttribute('aStressTensor');
          const aTemp = geom.getAttribute('aTemperature');
          const aGrad = geom.getAttribute('aThermalGradient');
          const aYield = geom.getAttribute('aYieldStrength');

          if (aStress && face.a < aStress.count) {
            // Interpolate vertex FEA attributes using face indices
            const iA = face.a;

            const sx = aStress.getX(iA);
            const sy = aStress.getY(iA);
            const txy = aStress.getZ(iA);
            const vonMises = Math.sqrt(Math.max(0, sx * sx - sx * sy + sy * sy + 3 * txy * txy));

            const temp = aTemp.getX(iA);
            const gx = aGrad.getX(iA);
            const gy = aGrad.getY(iA);
            const gz = aGrad.getZ(iA);
            const gradMag = Math.sqrt(gx * gx + gy * gy + gz * gz);
            const yieldStr = aYield.getX(iA);

            const safetyFactor = yieldStr / (vonMises + 1e-5);

            setProbeData({
              point: hit.point.clone(),
              vonMises,
              temperature: temp,
              gradientMag: gradMag,
              yieldStrength: yieldStr,
              safetyFactor,
            });

            // Update uniform probe position
            materialRef.current.uniforms.uProbePosition.value.copy(hit.point);
            materialRef.current.uniforms.uShowProbeMarker.value = 1.0;
            return;
          }
        }
      }
    }

    setProbeData(null);
    if (materialRef.current) {
      materialRef.current.uniforms.uShowProbeMarker.value = 0.0;
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Helper gradient CSS string for color scale bar legend
  const getGradientCss = () => {
    switch (colormap) {
      case 'jet':
        return 'linear-gradient(to right, #000080, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000, #800000)';
      case 'viridis':
        return 'linear-gradient(to right, #440154, #3b528b, #21908d, #5dc863, #fde725)';
      case 'inferno':
        return 'linear-gradient(to right, #000004, #51127c, #b73779, #fc8961, #fcfdbf)';
      case 'coolwarm':
        return 'linear-gradient(to right, #3b4cc0, #88c0d0, #e2e2e2, #f49a7b, #b40426)';
      case 'turbo':
      default:
        return 'linear-gradient(to right, #30123b, #4686fb, #1ae4b6, #a2fc3c, #faba39, #e4460a, #7a0403)';
    }
  };

  return (
    <div className="cad-viewer-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* CAD Viewer Header */}
      <div className="cad-viewer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>3D FEA CAD Surface Thermal & Stress Visualizer</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>
            Real-time WebGL GLSL Shaders for Von Mises Equivalent Stress ($\sigma_v$) and Thermal Gradients ($\nabla T$)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn"
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid #334155',
              background: isAnimating ? '#2563eb' : '#1e293b',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
            onClick={() => setIsAnimating(!isAnimating)}
          >
            {isAnimating ? '⏸ Pause Wave Dynamics' : '▶ Play Wave Dynamics'}
          </button>
        </div>
      </div>

      {/* Main Viewport & Controls Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', minHeight: '520px' }}>
        {/* WebGL Canvas Viewport */}
        <div
          ref={mountRef}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: '520px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #334155',
            background: '#0f172a',
            cursor: isDraggingRef.current ? 'grabbing' : 'grab',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Overlay Model Badge */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              fontSize: '0.85rem',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <div style={{ fontWeight: 600, color: '#38bdf8' }}>{modelDataRef.current?.meshName}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Mode: {mode === 'vonMises' ? 'Von Mises Stress (MPa)' : mode === 'thermal' ? 'Temperature (°C)' : mode === 'thermalGradient' ? 'Thermal Gradient (|∇T|)' : 'Combined Multi-Physics'}
            </div>
          </div>

          {/* Interactive Raycast Probe Surface Tooltip */}
          {probeData && (
            <div
              style={{
                position: 'absolute',
                left: `${mousePos.x + 15}px`,
                top: `${mousePos.y + 15}px`,
                background: 'rgba(15, 23, 42, 0.92)',
                backdropFilter: 'blur(8px)',
                border: '1px solid #38bdf8',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#f8fafc',
                fontSize: '0.8rem',
                pointerEvents: 'none',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                zIndex: 20,
              }}
            >
              <div style={{ fontWeight: 700, borderBottom: '1px solid #334155', paddingBottom: '4px', marginBottom: '6px', color: '#38bdf8' }}>
                📍 CAD Surface Probe
              </div>
              <div>Position: ({probeData.point.x.toFixed(2)}, {probeData.point.y.toFixed(2)}, {probeData.point.z.toFixed(2)})</div>
              <div>Von Mises Stress: <strong style={{ color: probeData.vonMises > probeData.yieldStrength ? '#ef4444' : '#38bdf8' }}>{probeData.vonMises.toFixed(1)} MPa</strong></div>
              <div>Temperature: <strong style={{ color: '#f97316' }}>{probeData.temperature.toFixed(1)} °C</strong></div>
              <div>Thermal Gradient: <strong>{probeData.gradientMag.toFixed(1)} °C/m</strong></div>
              <div>Safety Factor: <strong style={{ color: probeData.safetyFactor < 1.0 ? '#ef4444' : '#22c55e' }}>{probeData.safetyFactor.toFixed(2)}</strong></div>
            </div>
          )}

          {/* Color Gradient Scale Legend Bar */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              right: '16px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>
              <span>{mode.startsWith('vonMises') ? `${stressMin} MPa` : `${tempMin} °C`}</span>
              <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                {mode === 'vonMises' ? 'Von Mises Equivalent Stress Range' : 'Surface Heat Spectrum'} ({colormap.toUpperCase()})
              </span>
              <span>{mode.startsWith('vonMises') ? `${stressMax} MPa` : `${tempMax} °C`}</span>
            </div>
            <div
              style={{
                height: '14px',
                borderRadius: '4px',
                background: getGradientCss(),
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            />
          </div>
        </div>

        {/* Control & Configuration Sidebar */}
        <div
          style={{
            background: '#1e293b',
            borderRadius: '8px',
            border: '1px solid #334155',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            color: '#f8fafc',
            overflowY: 'auto',
            maxHeight: '520px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem', color: '#38bdf8' }}>
            Shader & Geometry Parameters
          </h3>

          {/* 1. CAD Geometry Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
              CAD Solid Mesh Geometry
            </label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value as CADModelType)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#fff',
                fontSize: '0.85rem',
              }}
            >
              <option value="bracket">Mechanical Flange Bracket (Double Hole)</option>
              <option value="turbineBlade">Aerospace Turbine Blade (Twisted)</option>
              <option value="iBeam">Structural Steel I-Beam (3-Point Bending)</option>
            </select>
          </div>

          {/* 2. Shader Visualization Mode */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
              FEA Analysis Field Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as VisualizationMode)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#fff',
                fontSize: '0.85rem',
              }}
            >
              <option value="vonMises">Von Mises Equivalent Stress (MPa)</option>
              <option value="thermal">Thermal Surface Temperature (°C)</option>
              <option value="thermalGradient">Thermal Gradient Magnitude (|∇T|)</option>
              <option value="combined">Multi-Physics Combined (Stress + Thermal)</option>
            </select>
          </div>

          {/* 3. Colormap Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
              Heatmap Colormap Scheme
            </label>
            <select
              value={colormap}
              onChange={(e) => setColormap(e.target.value as ColormapType)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#fff',
                fontSize: '0.85rem',
              }}
            >
              <option value="turbo">Turbo (Google High-Contrast Spectral)</option>
              <option value="jet">Jet (Classic Rainbow FEA Standard)</option>
              <option value="viridis">Viridis (Perceptually Uniform Sequential)</option>
              <option value="inferno">Inferno (Perceptually Uniform Thermal)</option>
              <option value="coolwarm">CoolWarm (Diverging Divergence Spectrum)</option>
            </select>
          </div>

          {/* 4. Dynamic Deformation Scale */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
              <span>Stress Mesh Deformation</span>
              <span>{deformationScale.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.5"
              step="0.01"
              value={deformationScale}
              onChange={(e) => setDeformationScale(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* 5. ISO-Contour Settings */}
          <div style={{ borderTop: '1px solid #334155', paddingTop: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showIsoContours}
                onChange={(e) => setShowIsoContours(e.target.checked)}
              />
              <span>Render Anti-Aliased ISO-Contours</span>
            </label>

            {showIsoContours && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.2rem' }}>
                  <span>Contour Line Frequency</span>
                  <span>{contourFreq} lines</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="25"
                  step="1"
                  value={contourFreq}
                  onChange={(e) => setContourFreq(parseInt(e.target.value, 10))}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>

          {/* 6. Range Limits Sliders */}
          <div style={{ borderTop: '1px solid #334155', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
              {mode.startsWith('vonMises') ? 'Stress Range Clamp (MPa)' : 'Thermal Range Clamp (°C)'}
            </div>

            {mode.startsWith('vonMises') ? (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', width: '40px' }}>Max:</span>
                  <input
                    type="range"
                    min="100"
                    max="600"
                    value={stressMax}
                    onChange={(e) => setStressMax(parseInt(e.target.value, 10))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '0.75rem', width: '50px', textAlign: 'right' }}>{stressMax} MPa</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', width: '40px' }}>Max:</span>
                  <input
                    type="range"
                    min="100"
                    max="800"
                    value={tempMax}
                    onChange={(e) => setTempMax(parseInt(e.target.value, 10))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '0.75rem', width: '50px', textAlign: 'right' }}>{tempMax} °C</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
