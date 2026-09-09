import { describe, it, expect } from "vitest";
import {
  calculateDistance,
  interpolateVector,
  interpolateArc,
  calculateBoundingBox,
  findSegmentAtTime,
  calculatePointAtProgress,
  formatTime,
  formatCoord,
} from "./camEngine";
import { createAdaptivePocketDataset, createMoldReliefDataset, createAerospaceHousingDataset } from "./camPresets";
import type { ToolpathSegment } from "../types/cam";

describe("camEngine math & utility functions", () => {
  it("calculates 3D Euclidean distance correctly", () => {
    const d = calculateDistance({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 12 });
    expect(d).toBeCloseTo(13, 5);
  });

  it("linearly interpolates 3D vectors", () => {
    const p1 = { x: 0, y: 10, z: -5 };
    const p2 = { x: 10, y: 30, z: 15 };

    const start = interpolateVector(p1, p2, 0);
    expect(start).toEqual(p1);

    const mid = interpolateVector(p1, p2, 0.5);
    expect(mid).toEqual({ x: 5, y: 20, z: 5 });

    const end = interpolateVector(p1, p2, 1);
    expect(end).toEqual(p2);
  });

  it("interpolates arc points correctly for G2 / G3 motions", () => {
    const segment: ToolpathSegment = {
      index: 0,
      motionType: "arc_ccw",
      start: { x: 10, y: 0, z: 0 },
      end: { x: 0, y: 10, z: 5 },
      feedRate: 1000,
      spindleSpeed: 10000,
      coolant: true,
      operationId: "op1",
      toolId: "T1",
      arcCenter: { x: 0, y: 0, z: 0 },
      arcRadius: 10,
      length: 15.7,
      cumulativeDistance: 15.7,
      startTime: 0,
      endTime: 1,
      gcodeLineIndex: 0,
    };

    const startPoint = interpolateArc(segment, 0);
    expect(startPoint.x).toBeCloseTo(10, 2);
    expect(startPoint.y).toBeCloseTo(0, 2);

    const midPoint = interpolateArc(segment, 0.5);
    expect(midPoint.x).toBeCloseTo(7.07, 1); // 10 * cos(45 deg)
    expect(midPoint.y).toBeCloseTo(7.07, 1);
    expect(midPoint.z).toBeCloseTo(2.5, 2);

    const endPoint = interpolateArc(segment, 1);
    expect(endPoint.x).toBeCloseTo(0, 2);
    expect(endPoint.y).toBeCloseTo(10, 2);
    expect(endPoint.z).toBeCloseTo(5, 2);
  });

  it("calculates accurate bounding boxes", () => {
    const segments: ToolpathSegment[] = [
      {
        index: 0,
        motionType: "linear",
        start: { x: -10, y: 20, z: 0 },
        end: { x: 50, y: -5, z: -15 },
        feedRate: 1000,
        spindleSpeed: 1000,
        coolant: false,
        operationId: "op1",
        toolId: "T1",
        length: 50,
        cumulativeDistance: 50,
        startTime: 0,
        endTime: 1,
        gcodeLineIndex: 0,
      },
    ];

    const bbox = calculateBoundingBox(segments);
    expect(bbox.min).toEqual({ x: -10, y: -5, z: -15 });
    expect(bbox.max).toEqual({ x: 50, y: 20, z: 0 });
  });

  it("binary searches active segment index at time", () => {
    const segments: ToolpathSegment[] = [
      { index: 0, startTime: 0, endTime: 10 } as ToolpathSegment,
      { index: 1, startTime: 10, endTime: 25 } as ToolpathSegment,
      { index: 2, startTime: 25, endTime: 60 } as ToolpathSegment,
    ];

    expect(findSegmentAtTime(segments, 0)).toBe(0);
    expect(findSegmentAtTime(segments, 5)).toBe(0);
    expect(findSegmentAtTime(segments, 9.9)).toBe(0);
    expect(findSegmentAtTime(segments, 10)).toBe(1);
    expect(findSegmentAtTime(segments, 15)).toBe(1);
    expect(findSegmentAtTime(segments, 25)).toBe(2);
    expect(findSegmentAtTime(segments, 30)).toBe(2);
    expect(findSegmentAtTime(segments, 100)).toBe(2);
  });

  it("formats time strings cleanly", () => {
    expect(formatTime(0)).toBe("0:00.0");
    expect(formatTime(65.4)).toBe("1:05.4");
    expect(formatTime(125.89)).toBe("2:05.9");
  });

  it("formats coordinates cleanly", () => {
    expect(formatCoord(12.3456)).toBe("12.346");
    expect(formatCoord(0)).toBe("0.000");
  });
});

describe("CAM Presets", () => {
  it("builds 3D Adaptive Pocketing preset successfully", () => {
    const dataset = createAdaptivePocketDataset();
    expect(dataset.id).toBe("preset-adaptive-pocket");
    expect(dataset.segments.length).toBeGreaterThan(10);
    expect(dataset.tools.length).toBe(3);
    expect(dataset.operations.length).toBe(4);
    expect(dataset.totalDistance).toBeGreaterThan(100);
    expect(dataset.totalDuration).toBeGreaterThan(5);

    // Verify progress calculation at 0%, 50%, 100%
    const p0 = calculatePointAtProgress(dataset, 0);
    expect(p0.segmentIndex).toBe(0);

    const pMid = calculatePointAtProgress(dataset, 0.5);
    expect(pMid.currentTime).toBeCloseTo(dataset.totalDuration / 2, 2);

    const p100 = calculatePointAtProgress(dataset, 1.0);
    expect(p100.segmentIndex).toBe(dataset.segments.length - 1);
  });

  it("builds Mold Relief surface dataset successfully", () => {
    const dataset = createMoldReliefDataset();
    expect(dataset.id).toBe("preset-mold-relief");
    expect(dataset.segments.length).toBeGreaterThan(100);
    expect(dataset.totalDistance).toBeGreaterThan(500);
  });

  it("builds Aerospace Housing dataset successfully", () => {
    const dataset = createAerospaceHousingDataset();
    expect(dataset.id).toBe("preset-aerospace-housing");
    expect(dataset.tools.length).toBe(3);
    expect(dataset.operations.length).toBe(3);
  });
});
