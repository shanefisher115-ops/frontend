import * as THREE from 'three';

export type MotionType = 'rapid' | 'cutting' | 'plunge' | 'retract';

export interface ToolpathPoint {
  x: number;
  y: number;
  z: number;
  type: MotionType;
  feedRate: number; // mm/min
}

export interface ToolpathSegment {
  start: ToolpathPoint;
  end: ToolpathPoint;
  length: number;
  type: MotionType;
  feedRate: number;
  cumulativeLength: number;
}

export interface ToolpathDef {
  id: string;
  name: string;
  description: string;
  toolDiameter: number; // mm
  targetModelId: string;
  points: ToolpathPoint[];
}

export interface InterpolatedToolState {
  position: THREE.Vector3;
  motionType: MotionType;
  feedRate: number;
  segmentIndex: number;
  progress: number; // 0 to 1
  cutPathPoints: THREE.Vector3[];
}

/**
 * Calculates cumulative lengths and segments for a toolpath points array.
 */
export function buildToolpathSegments(points: ToolpathPoint[]): {
  segments: ToolpathSegment[];
  totalLength: number;
} {
  const segments: ToolpathSegment[] = [];
  let cumulative = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    cumulative += length;

    segments.push({
      start: p1,
      end: p2,
      length,
      type: p2.type,
      feedRate: p2.feedRate,
      cumulativeLength: cumulative,
    });
  }

  return { segments, totalLength: cumulative };
}

/**
 * Evaluates position, motion type, and active cut path at progress t (0 to 1).
 */
export function evaluateToolpathProgress(
  segments: ToolpathSegment[],
  totalLength: number,
  t: number
): InterpolatedToolState {
  const clampedT = Math.max(0, Math.min(1, t));
  if (segments.length === 0 || totalLength === 0) {
    return {
      position: new THREE.Vector3(0, 5, 0),
      motionType: 'rapid',
      feedRate: 3000,
      segmentIndex: 0,
      progress: clampedT,
      cutPathPoints: [new THREE.Vector3(0, 5, 0)],
    };
  }

  const targetDist = clampedT * totalLength;
  let activeSegIdx = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (targetDist <= seg.cumulativeLength || i === segments.length - 1) {
      activeSegIdx = i;
      break;
    }
  }

  const activeSeg = segments[activeSegIdx];
  const prevCumulative = activeSegIdx > 0 ? segments[activeSegIdx - 1].cumulativeLength : 0;
  const segDist = targetDist - prevCumulative;
  const segFraction = activeSeg.length > 0 ? Math.max(0, Math.min(1, segDist / activeSeg.length)) : 0;

  const startVec = new THREE.Vector3(activeSeg.start.x, activeSeg.start.y, activeSeg.start.z);
  const endVec = new THREE.Vector3(activeSeg.end.x, activeSeg.end.y, activeSeg.end.z);
  const currentPos = new THREE.Vector3().lerpVectors(startVec, endVec, segFraction);

  // Gather past cutting path points up to current position
  const cutPathPoints: THREE.Vector3[] = [];
  cutPathPoints.push(new THREE.Vector3(segments[0].start.x, segments[0].start.y, segments[0].start.z));

  for (let i = 0; i < activeSegIdx; i++) {
    const seg = segments[i];
    cutPathPoints.push(new THREE.Vector3(seg.end.x, seg.end.y, seg.end.z));
  }
  cutPathPoints.push(currentPos.clone());

  return {
    position: currentPos,
    motionType: activeSeg.type,
    feedRate: activeSeg.feedRate,
    segmentIndex: activeSegIdx,
    progress: clampedT,
    cutPathPoints,
  };
}

/* =========================================================================
   TOOLPATH GENERATORS
   ========================================================================= */

/**
 * Toolpath 1: Face Milling (Zig-Zag rastering over workpiece surface)
 */
function generateFaceMillingToolpath(): ToolpathPoint[] {
  const points: ToolpathPoint[] = [];
  const safeZ = 4.5;
  const cutZ = 2.4;
  const xMin = -4.2;
  const xMax = 4.2;
  const zMin = -4.2;
  const zMax = 4.2;
  const stepOver = 0.8;

  // Approach rapid
  points.push({ x: xMin, y: safeZ, z: zMin, type: 'rapid', feedRate: 3000 });
  // Plunge
  points.push({ x: xMin, y: cutZ, z: zMin, type: 'plunge', feedRate: 300 });

  let forward = true;
  for (let z = zMin; z <= zMax + 0.01; z += stepOver) {
    const targetX = forward ? xMax : xMin;
    // Main cut pass
    points.push({ x: targetX, y: cutZ, z: Math.min(z, zMax), type: 'cutting', feedRate: 1500 });

    if (z + stepOver <= zMax + 0.01) {
      // Step over pass
      points.push({ x: targetX, y: cutZ, z: Math.min(z + stepOver, zMax), type: 'cutting', feedRate: 1200 });
    }
    forward = !forward;
  }

  // Retract to safe Z
  const last = points[points.length - 1];
  points.push({ x: last.x, y: safeZ, z: last.z, type: 'retract', feedRate: 2000 });
  // Return to home rapid
  points.push({ x: 0, y: safeZ, z: 0, type: 'rapid', feedRate: 3000 });

  return points;
}

/**
 * Toolpath 2: Spiral Pocket Milling (Clearing inner rectangular pocket)
 */
function generateSpiralPocketToolpath(): ToolpathPoint[] {
  const points: ToolpathPoint[] = [];
  const safeZ = 4.5;
  const cutZ = 1.25;
  const numLoops = 7;
  const maxRadius = 3.2;

  // Approach center
  points.push({ x: 0, y: safeZ, z: 0, type: 'rapid', feedRate: 3000 });
  // Helical / plunge to Z depth
  points.push({ x: 0, y: cutZ, z: 0, type: 'plunge', feedRate: 250 });

  // Outward spiral path
  const steps = 120;
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const radius = fraction * maxRadius;
    const angle = fraction * numLoops * Math.PI * 2;

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    points.push({
      x,
      y: cutZ,
      z,
      type: 'cutting',
      feedRate: 1100,
    });
  }

  // Outer rectangular finishing pass
  const r = maxRadius;
  const finishPoints = [
    { x: r, y: cutZ, z: -r },
    { x: r, y: cutZ, z: r },
    { x: -r, y: cutZ, z: r },
    { x: -r, y: cutZ, z: -r },
    { x: r, y: cutZ, z: -r },
  ];

  finishPoints.forEach((p) => {
    points.push({ ...p, type: 'cutting', feedRate: 800 });
  });

  // Retract and home
  const last = points[points.length - 1];
  points.push({ x: last.x, y: safeZ, z: last.z, type: 'retract', feedRate: 2000 });
  points.push({ x: 0, y: safeZ, z: 0, type: 'rapid', feedRate: 3000 });

  return points;
}

/**
 * Toolpath 3: 3D Multi-Pass Outer Contour Profiling
 */
function generate3DContourToolpath(): ToolpathPoint[] {
  const points: ToolpathPoint[] = [];
  const safeZ = 5.0;
  const depths = [3.0, 2.0, 1.0, 0.5];
  const radius = 3.8;
  const corners = 8;

  points.push({ x: radius, y: safeZ, z: 0, type: 'rapid', feedRate: 3000 });

  depths.forEach((depth) => {
    // Helical entry / plunge pass
    points.push({ x: radius, y: depth, z: 0, type: 'plunge', feedRate: 350 });

    // Octagonal / Rounded Contour pass
    const steps = 36;
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      // Slight smooth modulation
      const rMod = radius + 0.3 * Math.sin(angle * corners);
      const x = Math.cos(angle) * rMod;
      const z = Math.sin(angle) * rMod;

      points.push({
        x,
        y: depth,
        z,
        type: 'cutting',
        feedRate: 1400,
      });
    }
  });

  // Final retract and safe position
  const last = points[points.length - 1];
  points.push({ x: last.x, y: safeZ, z: last.z, type: 'retract', feedRate: 2000 });
  points.push({ x: 0, y: safeZ, z: 0, type: 'rapid', feedRate: 3000 });

  return points;
}

/**
 * Toolpath 4: Helical Bore Threading
 */
function generateHelicalBoreToolpath(): ToolpathPoint[] {
  const points: ToolpathPoint[] = [];
  const safeZ = 5.5;
  const startZ = 4.2;
  const endZ = 1.0;
  const helixRadius = 1.2;
  const numTurns = 6;
  const totalSteps = 120;

  points.push({ x: helixRadius, y: safeZ, z: 0, type: 'rapid', feedRate: 3000 });
  points.push({ x: helixRadius, y: startZ, z: 0, type: 'plunge', feedRate: 400 });

  for (let i = 0; i <= totalSteps; i++) {
    const fraction = i / totalSteps;
    const currentY = startZ - fraction * (startZ - endZ);
    const angle = fraction * numTurns * Math.PI * 2;

    const x = Math.cos(angle) * helixRadius;
    const z = Math.sin(angle) * helixRadius;

    points.push({
      x,
      y: currentY,
      z,
      type: 'cutting',
      feedRate: 950,
    });
  }

  // Bottom circular clearing turn
  const bottomSteps = 24;
  for (let i = 0; i <= bottomSteps; i++) {
    const angle = (i / bottomSteps) * Math.PI * 2;
    const x = Math.cos(angle) * helixRadius;
    const z = Math.sin(angle) * helixRadius;
    points.push({ x, y: endZ, z, type: 'cutting', feedRate: 800 });
  }

  points.push({ x: 0, y: safeZ, z: 0, type: 'retract', feedRate: 2000 });

  return points;
}

export const CAM_TOOLPATHS: Record<string, ToolpathDef> = {
  faceMilling: {
    id: 'faceMilling',
    name: 'Face Milling Clearing Pass',
    description: 'High-speed raster toolpath for top face stock planar finishing.',
    toolDiameter: 12.0,
    targetModelId: 'pocket',
    points: generateFaceMillingToolpath(),
  },
  spiralPocket: {
    id: 'spiralPocket',
    name: 'Spiral Cavity Pocketing',
    description: 'Continuous Archimedean spiral clearing pass with zero sharp direction changes.',
    toolDiameter: 8.0,
    targetModelId: 'pocket',
    points: generateSpiralPocketToolpath(),
  },
  contour3D: {
    id: 'contour3D',
    name: '3D Adaptive Perimeter Contour',
    description: 'Multi-depth stepdown perimeter roughing and finishing contour.',
    toolDiameter: 6.0,
    targetModelId: 'bracket',
    points: generate3DContourToolpath(),
  },
  helicalBore: {
    id: 'helicalBore',
    name: 'Helical Bore Threading',
    description: 'Continuous smooth helical interpolation for precision cylindrical bores.',
    toolDiameter: 4.0,
    targetModelId: 'bracket',
    points: generateHelicalBoreToolpath(),
  },
};
