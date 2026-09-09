import * as THREE from "three";

export interface ToolpathPoint {
  position: THREE.Vector3;
  isRapid: boolean;
  cutDepth: number;
}

export type ToolpathPreset = "pocket" | "surface" | "contour" | "drilling";

export interface ToolpathPresetInfo {
  id: ToolpathPreset;
  name: string;
  description: string;
  estimatedTime: string; // e.g. "2m 15s"
  totalDistance: number;
}

export function generateToolpath(preset: ToolpathPreset): { points: ToolpathPoint[]; totalLength: number } {
  const points: ToolpathPoint[] = [];

  switch (preset) {
    case "pocket": {
      // Rectangular spiral pocket milling
      // Start high at safety Z
      points.push({ position: new THREE.Vector3(0, 8, 0), isRapid: true, cutDepth: 0 });
      points.push({ position: new THREE.Vector3(-15, 8, -15), isRapid: true, cutDepth: 0 });
      points.push({ position: new THREE.Vector3(-15, -2, -15), isRapid: false, cutDepth: 2 });

      const loops = 8;
      const maxR = 18;
      for (let i = 0; i <= loops * 50; i++) {
        const angle = (i / 50) * Math.PI * 2;
        const radius = (i / (loops * 50)) * maxR;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = -2 - (i / (loops * 50)) * 3; // gradually plunging
        points.push({ position: new THREE.Vector3(x, y, z), isRapid: false, cutDepth: Math.abs(y) });
      }

      // retract
      const last = points[points.length - 1].position;
      points.push({ position: new THREE.Vector3(last.x, 8, last.z), isRapid: true, cutDepth: 0 });
      points.push({ position: new THREE.Vector3(0, 8, 0), isRapid: true, cutDepth: 0 });
      break;
    }

    case "surface": {
      // 3D Wave Surface Finishing
      points.push({ position: new THREE.Vector3(0, 10, 0), isRapid: true, cutDepth: 0 });
      const width = 30;
      const depth = 30;
      const stepZ = 1.5;

      let leftToRight = true;
      for (let z = -depth / 2; z <= depth / 2; z += stepZ) {
        const xStart = leftToRight ? -width / 2 : width / 2;
        const xEnd = leftToRight ? width / 2 : -width / 2;

        if (points.length === 1) {
          points.push({ position: new THREE.Vector3(xStart, 8, z), isRapid: true, cutDepth: 0 });
        } else {
          points.push({ position: new THREE.Vector3(xStart, 2, z), isRapid: true, cutDepth: 0 });
        }

        const stepsX = 40;
        for (let i = 0; i <= stepsX; i++) {
          const t = i / stepsX;
          const x = xStart + t * (xEnd - xStart);
          const y = Math.sin(x * 0.2) * Math.cos(z * 0.2) * 2.5 + 1;
          points.push({ position: new THREE.Vector3(x, y, z), isRapid: false, cutDepth: 3 - y });
        }
        leftToRight = !leftToRight;
      }
      const lastS = points[points.length - 1].position;
      points.push({ position: new THREE.Vector3(lastS.x, 10, lastS.z), isRapid: true, cutDepth: 0 });
      points.push({ position: new THREE.Vector3(0, 10, 0), isRapid: true, cutDepth: 0 });
      break;
    }

    case "contour": {
      // Adaptive Outer Profile Cut with 3 Depth Layers
      points.push({ position: new THREE.Vector3(0, 10, 0), isRapid: true, cutDepth: 0 });
      const passes = [0, -2, -4, -6];
      const radius = 18;

      passes.forEach((depthLevel) => {
        // Lead-in
        points.push({ position: new THREE.Vector3(radius + 5, 5, radius + 5), isRapid: true, cutDepth: 0 });
        points.push({ position: new THREE.Vector3(radius, depthLevel, radius), isRapid: false, cutDepth: Math.abs(depthLevel) });

        const segments = 60;
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          // Star/gear-like complex curve shape
          const rMod = radius + Math.sin(theta * 5) * 3;
          const x = Math.cos(theta) * rMod;
          const z = Math.sin(theta) * rMod;
          points.push({ position: new THREE.Vector3(x, depthLevel, z), isRapid: false, cutDepth: Math.abs(depthLevel) });
        }
        // Retract
        const lastP = points[points.length - 1].position;
        points.push({ position: new THREE.Vector3(lastP.x, 5, lastP.z), isRapid: true, cutDepth: 0 });
      });

      points.push({ position: new THREE.Vector3(0, 10, 0), isRapid: true, cutDepth: 0 });
      break;
    }

    case "drilling": {
      // Matrix Hole Drilling Pattern
      points.push({ position: new THREE.Vector3(0, 10, 0), isRapid: true, cutDepth: 0 });
      const grid = [-12, -4, 4, 12];

      grid.forEach((x) => {
        grid.forEach((z) => {
          // Rapid move to above hole
          points.push({ position: new THREE.Vector3(x, 4, z), isRapid: true, cutDepth: 0 });
          // Peck 1
          points.push({ position: new THREE.Vector3(x, -2, z), isRapid: false, cutDepth: 2 });
          points.push({ position: new THREE.Vector3(x, 2, z), isRapid: true, cutDepth: 0 });
          // Peck 2 (full depth)
          points.push({ position: new THREE.Vector3(x, -6, z), isRapid: false, cutDepth: 6 });
          // Retract
          points.push({ position: new THREE.Vector3(x, 6, z), isRapid: true, cutDepth: 0 });
        });
      });

      points.push({ position: new THREE.Vector3(0, 10, 0), isRapid: true, cutDepth: 0 });
      break;
    }
  }

  // Calculate total path length
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    totalLength += points[i].position.distanceTo(points[i - 1].position);
  }

  return { points, totalLength };
}

/**
 * Interpolates a point along the toolpath given a normalized progress [0..1]
 */
export function getToolpathStateAtProgress(
  points: ToolpathPoint[],
  totalLength: number,
  progress: number
): {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  isRapid: boolean;
  cutDepth: number;
  segmentIndex: number;
} {
  if (points.length === 0) {
    return {
      position: new THREE.Vector3(0, 0, 0),
      tangent: new THREE.Vector3(0, 1, 0),
      isRapid: true,
      cutDepth: 0,
      segmentIndex: 0,
    };
  }

  if (progress <= 0) {
    const tangent = points.length > 1
      ? points[1].position.clone().sub(points[0].position).normalize()
      : new THREE.Vector3(0, 1, 0);
    return {
      position: points[0].position.clone(),
      tangent,
      isRapid: points[0].isRapid,
      cutDepth: points[0].cutDepth,
      segmentIndex: 0,
    };
  }

  if (progress >= 1) {
    const last = points[points.length - 1];
    const prev = points[points.length - 2] || last;
    const tangent = last.position.clone().sub(prev.position).normalize();
    return {
      position: last.position.clone(),
      tangent,
      isRapid: last.isRapid,
      cutDepth: last.cutDepth,
      segmentIndex: points.length - 1,
    };
  }

  const targetDist = progress * totalLength;
  let accumulated = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i].position;
    const p2 = points[i + 1].position;
    const dist = p1.distanceTo(p2);

    if (accumulated + dist >= targetDist) {
      const segT = dist > 0 ? (targetDist - accumulated) / dist : 0;
      const position = new THREE.Vector3().lerpVectors(p1, p2, segT);
      const tangent = p2.clone().sub(p1).normalize();
      if (tangent.lengthSq() < 0.0001) tangent.set(0, 1, 0);

      return {
        position,
        tangent,
        isRapid: points[i + 1].isRapid,
        cutDepth: points[i + 1].cutDepth,
        segmentIndex: i,
      };
    }
    accumulated += dist;
  }

  const lastPoint = points[points.length - 1];
  return {
    position: lastPoint.position.clone(),
    tangent: new THREE.Vector3(0, 1, 0),
    isRapid: lastPoint.isRapid,
    cutDepth: lastPoint.cutDepth,
    segmentIndex: points.length - 1,
  };
}
