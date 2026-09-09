import { describe, it, expect } from "vitest";
import { generateToolpath, getToolpathStateAtProgress, type ToolpathPreset } from "./toolpath";

describe("toolpath utilities", () => {
  const presets: ToolpathPreset[] = ["pocket", "surface", "contour", "drilling"];

  presets.forEach((preset) => {
    it(`generates valid points and positive length for preset "${preset}"`, () => {
      const { points, totalLength } = generateToolpath(preset);
      expect(points.length).toBeGreaterThan(2);
      expect(totalLength).toBeGreaterThan(0);
    });
  });

  it("interpolates position and state at start, mid, and end progress", () => {
    const { points, totalLength } = generateToolpath("pocket");

    const start = getToolpathStateAtProgress(points, totalLength, 0);
    expect(start.position.x).toBeCloseTo(points[0].position.x);
    expect(start.position.y).toBeCloseTo(points[0].position.y);
    expect(start.position.z).toBeCloseTo(points[0].position.z);

    const end = getToolpathStateAtProgress(points, totalLength, 1);
    const lastPoint = points[points.length - 1].position;
    expect(end.position.x).toBeCloseTo(lastPoint.x);
    expect(end.position.y).toBeCloseTo(lastPoint.y);
    expect(end.position.z).toBeCloseTo(lastPoint.z);

    const mid = getToolpathStateAtProgress(points, totalLength, 0.5);
    expect(mid.position).toBeDefined();
    expect(mid.tangent.length()).toBeGreaterThan(0.9);
  });
});
