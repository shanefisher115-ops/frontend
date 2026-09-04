import { describe, it, expect } from 'vitest';
import {
  CAM_TOOLPATHS,
  buildToolpathSegments,
  evaluateToolpathProgress,
} from './camToolpath';
import { CAD_MODELS } from './cadModels';

describe('CAD Models definitions', () => {
  it('should contain expected procedural CAD models', () => {
    expect(CAD_MODELS).toHaveProperty('bracket');
    expect(CAD_MODELS).toHaveProperty('pocket');
    expect(CAD_MODELS).toHaveProperty('impeller');

    const bracket = CAD_MODELS.bracket;
    expect(bracket.name).toBe('Mechanical Mounting Bracket');
    const group = bracket.createMesh();
    expect(group).toBeDefined();
    expect(group.children.length).toBeGreaterThan(0);
  });
});

describe('CAM Toolpath Generators & Interpolation', () => {
  it('should load preset toolpaths with valid points', () => {
    expect(CAM_TOOLPATHS).toHaveProperty('faceMilling');
    expect(CAM_TOOLPATHS).toHaveProperty('spiralPocket');
    expect(CAM_TOOLPATHS).toHaveProperty('contour3D');
    expect(CAM_TOOLPATHS).toHaveProperty('helicalBore');

    const facePath = CAM_TOOLPATHS.faceMilling;
    expect(facePath.points.length).toBeGreaterThan(5);
    expect(facePath.toolDiameter).toBeGreaterThan(0);
  });

  it('should build cumulative segments correctly', () => {
    const tp = CAM_TOOLPATHS.contour3D;
    const { segments, totalLength } = buildToolpathSegments(tp.points);

    expect(segments.length).toBe(tp.points.length - 1);
    expect(totalLength).toBeGreaterThan(0);
    expect(segments[segments.length - 1].cumulativeLength).toBeCloseTo(totalLength, 4);
  });

  it('should evaluate progress at t=0, t=0.5, and t=1.0 accurately', () => {
    const tp = CAM_TOOLPATHS.spiralPocket;
    const { segments, totalLength } = buildToolpathSegments(tp.points);

    // t = 0
    const stateStart = evaluateToolpathProgress(segments, totalLength, 0);
    expect(stateStart.progress).toBe(0);
    expect(stateStart.position.x).toBeCloseTo(tp.points[0].x);
    expect(stateStart.position.y).toBeCloseTo(tp.points[0].y);
    expect(stateStart.position.z).toBeCloseTo(tp.points[0].z);

    // t = 0.5
    const stateMid = evaluateToolpathProgress(segments, totalLength, 0.5);
    expect(stateMid.progress).toBe(0.5);
    expect(stateMid.cutPathPoints.length).toBeGreaterThan(1);

    // t = 1.0
    const lastPt = tp.points[tp.points.length - 1];
    const stateEnd = evaluateToolpathProgress(segments, totalLength, 1.0);
    expect(stateEnd.progress).toBe(1);
    expect(stateEnd.position.x).toBeCloseTo(lastPt.x, 3);
    expect(stateEnd.position.y).toBeCloseTo(lastPt.y, 3);
    expect(stateEnd.position.z).toBeCloseTo(lastPt.z, 3);
  });

  it('should handle edge cases with empty or zero-length segments', () => {
    const state = evaluateToolpathProgress([], 0, 0.5);
    expect(state.progress).toBe(0.5);
    expect(state.position).toBeDefined();
  });
});
