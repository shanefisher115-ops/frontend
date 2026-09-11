import * as THREE from 'three';

export type CADModelType = 'bracket' | 'turbineBlade' | 'iBeam';

export interface CADGeometryResult {
  geometry: THREE.BufferGeometry;
  meshName: string;
  maxStress: number;
  minStress: number;
  maxTemp: number;
  minTemp: number;
}

/**
 * Calculates FEA physical attributes (stress tensor, temperature, thermal gradient, yield strength)
 * for each vertex in a CAD geometry.
 */
function attachFEAAttributes(
  geometry: THREE.BufferGeometry,
  calculateFEAPoint: (pos: THREE.Vector3) => {
    stressTensor: THREE.Vector3; // (sigma_x, sigma_y, tau_xy)
    temperature: number; // °C
    thermalGradient: THREE.Vector3; // (dT/dx, dT/dy, dT/dz)
    yieldStrength: number; // MPa
  }
): { minStress: number; maxStress: number; minTemp: number; maxTemp: number } {
  const posAttribute = geometry.attributes.position;
  const count = posAttribute.count;

  const stressTensors = new Float32Array(count * 3);
  const temperatures = new Float32Array(count);
  const thermalGradients = new Float32Array(count * 3);
  const yieldStrengths = new Float32Array(count);

  let minStress = Infinity;
  let maxStress = -Infinity;
  let minTemp = Infinity;
  let maxTemp = -Infinity;

  const vPos = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    vPos.fromBufferAttribute(posAttribute, i);
    const fea = calculateFEAPoint(vPos);

    // Save stress tensor
    stressTensors[i * 3 + 0] = fea.stressTensor.x;
    stressTensors[i * 3 + 1] = fea.stressTensor.y;
    stressTensors[i * 3 + 2] = fea.stressTensor.z;

    // Calculate Von Mises stress magnitude for range tracking
    const sx = fea.stressTensor.x;
    const sy = fea.stressTensor.y;
    const txy = fea.stressTensor.z;
    const vonMises = Math.sqrt(Math.max(0, sx * sx - sx * sy + sy * sy + 3 * txy * txy));

    minStress = Math.min(minStress, vonMises);
    maxStress = Math.max(maxStress, vonMises);

    // Temperature & gradient
    temperatures[i] = fea.temperature;
    minTemp = Math.min(minTemp, fea.temperature);
    maxTemp = Math.max(maxTemp, fea.temperature);

    thermalGradients[i * 3 + 0] = fea.thermalGradient.x;
    thermalGradients[i * 3 + 1] = fea.thermalGradient.y;
    thermalGradients[i * 3 + 2] = fea.thermalGradient.z;

    yieldStrengths[i] = fea.yieldStrength;
  }

  geometry.setAttribute('aStressTensor', new THREE.BufferAttribute(stressTensors, 3));
  geometry.setAttribute('aTemperature', new THREE.BufferAttribute(temperatures, 1));
  geometry.setAttribute('aThermalGradient', new THREE.BufferAttribute(thermalGradients, 3));
  geometry.setAttribute('aYieldStrength', new THREE.BufferAttribute(yieldStrengths, 1));

  return { minStress, maxStress, minTemp, maxTemp };
}

/**
 * Creates a Mechanical Bracket CAD Solid Model with stress concentrations around mounting holes.
 */
export function createMechanicalBracketGeometry(): CADGeometryResult {
  // Base plate with extruded holes and fillet
  const shape = new THREE.Shape();
  const width = 4.0;
  const height = 2.5;

  // Outer boundary
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);
  shape.lineTo(-width / 2, -height / 2);

  // Hole 1 (Left mounting hole)
  const hole1 = new THREE.Path();
  hole1.absarc(-1.2, 0, 0.45, 0, Math.PI * 2, true);
  shape.holes.push(hole1);

  // Hole 2 (Right mounting hole)
  const hole2 = new THREE.Path();
  hole2.absarc(1.2, 0, 0.45, 0, Math.PI * 2, true);
  shape.holes.push(hole2);

  const extrudeSettings = {
    steps: 16,
    depth: 0.8,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelSegments: 8,
    curveSegments: 32,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();

  // Attach realistic Mechanical FEA Stress & Thermal physics
  const bounds = attachFEAAttributes(geometry, (pos) => {
    // Distance to left and right holes
    const distHole1 = Math.hypot(pos.x - (-1.2), pos.y - 0);
    const distHole2 = Math.hypot(pos.x - 1.2, pos.y - 0);

    // Stress concentration factor around hole boundary (Kirsch solution / FEA approximation)
    let stressConc1 = 0;
    if (distHole1 < 1.2) {
      stressConc1 = Math.pow(0.45 / Math.max(distHole1, 0.45), 2.5) * 220;
    }

    let stressConc2 = 0;
    if (distHole2 < 1.2) {
      stressConc2 = Math.pow(0.45 / Math.max(distHole2, 0.45), 2.5) * 180;
    }

    // Tensile bending stress along X axis
    const bendingStress = Math.abs(pos.x) * 45 + Math.abs(pos.y) * 25;
    const sigmaX = bendingStress + stressConc1 + stressConc2;
    const sigmaY = Math.sin(pos.x * 2.0) * 30 + (distHole1 < 0.6 ? 80 : 10);
    const tauXY = Math.cos(pos.y * 3.0) * 25 + (distHole2 < 0.6 ? 60 : 5);

    // Thermal distribution: Hot heat source at hole 1 (-1.2, 0), cooler ambient at hole 2
    const heatSourceDist = distHole1;
    const temperature = 25.0 + 220.0 * Math.exp(-heatSourceDist * 1.2) + pos.z * 15.0;

    // Thermal gradient vector = -grad(T)
    const dTdx = -220.0 * 1.2 * Math.exp(-heatSourceDist * 1.2) * ((pos.x + 1.2) / Math.max(heatSourceDist, 0.01));
    const dTdy = -220.0 * 1.2 * Math.exp(-heatSourceDist * 1.2) * (pos.y / Math.max(heatSourceDist, 0.01));
    const dTdz = 15.0;

    return {
      stressTensor: new THREE.Vector3(sigmaX, sigmaY, tauXY),
      temperature,
      thermalGradient: new THREE.Vector3(dTdx, dTdy, dTdz),
      yieldStrength: 250.0, // Structural Steel Yield Strength (MPa)
    };
  });

  return {
    geometry,
    meshName: 'Mechanical Flange Bracket',
    ...bounds,
  };
}

/**
 * Creates a Turbine Blade / Heat Sink CAD geometry with cooling channels.
 */
export function createTurbineBladeGeometry(): CADGeometryResult {
  const geometry = new THREE.CylinderGeometry(0.3, 1.2, 4.5, 32, 64, true);
  geometry.center();

  // Twist the turbine blade geometry slightly along Y axis
  const posAttr = geometry.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < posAttr.count; i++) {
    v.fromBufferAttribute(posAttr, i);
    const twistAngle = v.y * 0.35;
    const cosA = Math.cos(twistAngle);
    const sinA = Math.sin(twistAngle);
    const xNew = v.x * cosA - v.z * sinA;
    const zNew = v.x * sinA + v.z * cosA;
    posAttr.setXYZ(i, xNew, v.y, zNew);
  }
  geometry.computeVertexNormals();

  const bounds = attachFEAAttributes(geometry, (pos) => {
    // Centrifugal & aerodynamic load stress higher near root (pos.y ~ -2.25)
    const normalizedY = (pos.y + 2.25) / 4.5; // 0 at root, 1 at tip
    const rootStress = Math.pow(1.0 - normalizedY, 1.8) * 310.0;
    const aeroLoad = Math.sin(normalizedY * Math.PI) * 80.0;

    const sigmaX = rootStress + aeroLoad;
    const sigmaY = rootStress * 0.7;
    const tauXY = Math.sin(pos.x * 4.0) * 35.0;

    // Thermal profile: Combustor hot gas at blade surface (highest at tip & leading edge)
    const temperature = 300.0 + normalizedY * 450.0 + Math.sin(pos.x * 3.0) * 50.0;

    const dTdx = Math.cos(pos.x * 3.0) * 150.0;
    const dTdy = 450.0 / 4.5;
    const dTdz = Math.sin(pos.z * 5.0) * 60.0;

    return {
      stressTensor: new THREE.Vector3(sigmaX, sigmaY, tauXY),
      temperature,
      thermalGradient: new THREE.Vector3(dTdx, dTdy, dTdz),
      yieldStrength: 450.0, // High-temp Nickel Alloy Yield Strength (MPa)
    };
  });

  return {
    geometry,
    meshName: 'Aerospace Turbine Blade',
    ...bounds,
  };
}

/**
 * Creates a Structural I-Beam CAD solid model subjected to 3-point bending load.
 */
export function createIBeamGeometry(): CADGeometryResult {
  const shape = new THREE.Shape();
  const w = 1.6; // flange width
  const h = 2.4; // height
  const tf = 0.25; // flange thickness
  const tw = 0.2; // web thickness

  // I-beam cross section contour
  shape.moveTo(-w / 2, -h / 2);
  shape.lineTo(w / 2, -h / 2);
  shape.lineTo(w / 2, -h / 2 + tf);
  shape.lineTo(tw / 2, -h / 2 + tf);
  shape.lineTo(tw / 2, h / 2 - tf);
  shape.lineTo(w / 2, h / 2 - tf);
  shape.lineTo(w / 2, h / 2);
  shape.lineTo(-w / 2, h / 2);
  shape.lineTo(-w / 2, h / 2 - tf);
  shape.lineTo(-tw / 2, h / 2 - tf);
  shape.lineTo(-tw / 2, -h / 2 + tf);
  shape.lineTo(-w / 2, -h / 2 + tf);
  shape.lineTo(-w / 2, -h / 2);

  const extrudeSettings = {
    steps: 32,
    depth: 5.0,
    bevelEnabled: false,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();

  const bounds = attachFEAAttributes(geometry, (pos) => {
    // 3-point bending load applied at center (z = 0)
    // Moment M(z) decreases linearly towards supports at z = -2.5 and z = +2.5
    const spanDist = 2.5 - Math.abs(pos.z);
    const moment = Math.max(0, spanDist) * 120.0;

    // Bending stress sigma = M * y / I
    const sigmaX = moment * (pos.y / (h / 2));
    const sigmaY = Math.abs(pos.y) > (h / 2 - tf) ? moment * 0.4 : 10.0;
    // Shear stress in web
    const tauXY = (1.0 - Math.pow(pos.y / (h / 2), 2)) * 45.0;

    // Thermal expansion gradient from top flange to bottom flange
    const temperature = 40.0 + (pos.y + h / 2) * 35.0 + Math.abs(pos.z) * 10.0;

    const dTdx = 5.0;
    const dTdy = 35.0;
    const dTdz = pos.z > 0 ? 10.0 : -10.0;

    return {
      stressTensor: new THREE.Vector3(sigmaX, sigmaY, tauXY),
      temperature,
      thermalGradient: new THREE.Vector3(dTdx, dTdy, dTdz),
      yieldStrength: 350.0, // High Strength Steel Yield (MPa)
    };
  });

  return {
    geometry,
    meshName: 'Structural I-Beam',
    ...bounds,
  };
}

export function getCADGeometry(type: CADModelType): CADGeometryResult {
  switch (type) {
    case 'turbineBlade':
      return createTurbineBladeGeometry();
    case 'iBeam':
      return createIBeamGeometry();
    case 'bracket':
    default:
      return createMechanicalBracketGeometry();
  }
}
