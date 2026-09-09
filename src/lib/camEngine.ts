import type {
  Vector3D,
  ToolpathSegment,
  BoundingBox3D,
  CamDataset,
  GCodeLine,
  ToolInfo,
  CamOperation,
  StockDimensions,
} from "../types/cam";

/** Calculates Euclidean distance between two 3D points in mm. */
export function calculateDistance(p1: Vector3D, p2: Vector3D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Linear interpolation between two 3D points, t in [0, 1]. */
export function interpolateVector(p1: Vector3D, p2: Vector3D, t: number): Vector3D {
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    x: p1.x + (p2.x - p1.x) * clampedT,
    y: p1.y + (p2.y - p1.y) * clampedT,
    z: p1.z + (p2.z - p1.z) * clampedT,
  };
}

/**
 * Interpolates point along circular/helical arc for G2 (CW) or G3 (CCW) motions.
 * t in [0, 1]. Fallback to linear if arc parameters are invalid.
 */
export function interpolateArc(segment: ToolpathSegment, t: number): Vector3D {
  if (!segment.arcCenter || segment.arcRadius === undefined) {
    return interpolateVector(segment.start, segment.end, t);
  }

  const clampedT = Math.max(0, Math.min(1, t));
  const center = segment.arcCenter;
  const radius = segment.arcRadius;

  // Angles relative to arc center in XY plane
  const startAngle = Math.atan2(segment.start.y - center.y, segment.start.x - center.x);
  let endAngle = Math.atan2(segment.end.y - center.y, segment.end.x - center.x);

  const isCW = segment.motionType === "arc_cw";

  if (isCW) {
    if (endAngle >= startAngle) {
      endAngle -= 2 * Math.PI;
    }
  } else {
    if (endAngle <= startAngle) {
      endAngle += 2 * Math.PI;
    }
  }

  const currentAngle = startAngle + (endAngle - startAngle) * clampedT;

  // Linear Z interpolation for helical moves
  const currentZ = segment.start.z + (segment.end.z - segment.start.z) * clampedT;

  return {
    x: center.x + radius * Math.cos(currentAngle),
    y: center.y + radius * Math.sin(currentAngle),
    z: currentZ,
  };
}

/** Interpolates cutter position at factor t [0, 1] within a single segment. */
export function interpolateSegmentPosition(segment: ToolpathSegment, t: number): Vector3D {
  if (segment.motionType === "arc_cw" || segment.motionType === "arc_ccw") {
    return interpolateArc(segment, t);
  }
  return interpolateVector(segment.start, segment.end, t);
}

/** Computes bounding box covering all segment vertices. */
export function calculateBoundingBox(segments: ToolpathSegment[]): BoundingBox3D {
  if (segments.length === 0) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
    };
  }

  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;

  for (const seg of segments) {
    minX = Math.min(minX, seg.start.x, seg.end.x);
    minY = Math.min(minY, seg.start.y, seg.end.y);
    minZ = Math.min(minZ, seg.start.z, seg.end.z);

    maxX = Math.max(maxX, seg.start.x, seg.end.x);
    maxY = Math.max(maxY, seg.start.y, seg.end.y);
    maxZ = Math.max(maxZ, seg.start.z, seg.end.z);
  }

  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
  };
}

/** Binary search for segment index active at given time (in seconds). */
export function findSegmentAtTime(segments: ToolpathSegment[], time: number): number {
  if (segments.length === 0) return 0;
  if (time <= 0) return 0;
  const maxTime = segments[segments.length - 1].endTime;
  if (time >= maxTime) return segments.length - 1;

  let low = 0;
  let high = segments.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const seg = segments[mid];
    const isLast = mid === segments.length - 1;

    if (time >= seg.startTime && (isLast ? time <= seg.endTime : time < seg.endTime)) {
      return mid;
    }
    if (time < seg.startTime) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return Math.min(low, segments.length - 1);
}

/** Finds cutter position and segment state at a specific time in seconds. */
export function calculatePointAtTime(
  segments: ToolpathSegment[],
  time: number
): { position: Vector3D; segmentIndex: number; localProgress: number } {
  if (segments.length === 0) {
    return { position: { x: 0, y: 0, z: 0 }, segmentIndex: 0, localProgress: 0 };
  }

  const segmentIndex = findSegmentAtTime(segments, time);
  const seg = segments[segmentIndex];

  const duration = seg.endTime - seg.startTime;
  const localProgress = duration > 0 ? Math.max(0, Math.min(1, (time - seg.startTime) / duration)) : 1;

  const position = interpolateSegmentPosition(seg, localProgress);

  return { position, segmentIndex, localProgress };
}

/** Calculates time, position and segment index at global normalized progress [0, 1]. */
export function calculatePointAtProgress(
  dataset: CamDataset,
  progress: number
): {
  position: Vector3D;
  segmentIndex: number;
  currentTime: number;
  localProgress: number;
} {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const currentTime = clampedProgress * dataset.totalDuration;

  const { position, segmentIndex, localProgress } = calculatePointAtTime(
    dataset.segments,
    currentTime
  );

  return { position, segmentIndex, currentTime, localProgress };
}

/** Formats duration in seconds into MM:SS.m format. */
export function formatTime(seconds: number): string {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);
  const mins = Math.floor(absSeconds / 60);
  const secs = (absSeconds % 60).toFixed(1);
  const paddedSecs = parseFloat(secs) < 10 ? `0${secs}` : secs;
  return `${isNegative ? "-" : ""}${mins}:${paddedSecs}`;
}

/** Formats coordinate numbers for display (e.g., 25.040). */
export function formatCoord(val: number): string {
  return val.toFixed(3);
}

export interface RawSegmentInput {
  motionType: ToolpathSegment["motionType"];
  start: Vector3D;
  end: Vector3D;
  feedRate: number; // mm/min (for rapids G0, e.g. 5000 mm/min)
  spindleSpeed: number; // RPM
  coolant: boolean;
  operationId: string;
  toolId: string;
  arcCenter?: Vector3D;
  arcRadius?: number;
  gcodeRaw: string;
  comment?: string;
}

/** Enriches raw segment specifications into a complete CamDataset. */
export function buildCamDataset(params: {
  id: string;
  name: string;
  description: string;
  material: string;
  stock: StockDimensions;
  tools: ToolInfo[];
  operations: Omit<CamOperation, "startSegmentIndex" | "endSegmentIndex">[];
  rawSegments: RawSegmentInput[];
}): CamDataset {
  let cumulativeDistance = 0;
  let cumulativeTime = 0;

  const gcodeLines: GCodeLine[] = [];
  const processedSegments: ToolpathSegment[] = [];

  // Track operational segment indices
  const opIndices: Record<string, { start: number; end: number }> = {};

  params.rawSegments.forEach((raw, idx) => {
    let segLength = calculateDistance(raw.start, raw.end);

    // If arc motion, compute circular arc length
    if ((raw.motionType === "arc_cw" || raw.motionType === "arc_ccw") && raw.arcRadius && raw.arcCenter) {
      const vStart = { x: raw.start.x - raw.arcCenter.x, y: raw.start.y - raw.arcCenter.y };
      const vEnd = { x: raw.end.x - raw.arcCenter.x, y: raw.end.y - raw.arcCenter.y };
      let angle = Math.atan2(vEnd.y, vEnd.x) - Math.atan2(vStart.y, vStart.x);
      if (raw.motionType === "arc_cw" && angle >= 0) angle -= 2 * Math.PI;
      if (raw.motionType === "arc_ccw" && angle <= 0) angle += 2 * Math.PI;
      const arcLen2D = Math.abs(angle * raw.arcRadius);
      const dz = raw.end.z - raw.start.z;
      segLength = Math.sqrt(arcLen2D * arcLen2D + dz * dz);
    }

    cumulativeDistance += segLength;

    // Time calculation: feedRate is in mm/min, convert to mm/sec
    const feedMmPerSec = Math.max(1, raw.feedRate) / 60;
    const durationSec = segLength / feedMmPerSec;

    const startTime = cumulativeTime;
    const endTime = startTime + durationSec;
    cumulativeTime = endTime;

    const gcodeLineIndex = gcodeLines.length;

    gcodeLines.push({
      lineNumber: gcodeLineIndex + 1,
      raw: raw.gcodeRaw,
      segmentIndex: idx,
      comment: raw.comment,
      isMove: true,
    });

    processedSegments.push({
      index: idx,
      motionType: raw.motionType,
      start: raw.start,
      end: raw.end,
      feedRate: raw.feedRate,
      spindleSpeed: raw.spindleSpeed,
      coolant: raw.coolant,
      operationId: raw.operationId,
      toolId: raw.toolId,
      arcCenter: raw.arcCenter,
      arcRadius: raw.arcRadius,
      length: segLength,
      cumulativeDistance,
      startTime,
      endTime,
      gcodeLineIndex,
    });

    if (!opIndices[raw.operationId]) {
      opIndices[raw.operationId] = { start: idx, end: idx };
    } else {
      opIndices[raw.operationId].end = idx;
    }
  });

  const fullOperations: CamOperation[] = params.operations.map((op) => ({
    ...op,
    startSegmentIndex: opIndices[op.id]?.start ?? 0,
    endSegmentIndex: opIndices[op.id]?.end ?? 0,
  }));

  const boundingBox = calculateBoundingBox(processedSegments);

  return {
    id: params.id,
    name: params.name,
    description: params.description,
    material: params.material,
    stock: params.stock,
    tools: params.tools,
    operations: fullOperations,
    segments: processedSegments,
    gcodeLines,
    totalDistance: cumulativeDistance,
    totalDuration: cumulativeTime,
    boundingBox,
  };
}
