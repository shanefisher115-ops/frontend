import { describe, it, expect } from 'vitest';
import { SAMPLE_TOOLPATHS } from './sampleToolpaths';

describe('SAMPLE_TOOLPATHS', () => {
  it('should contain predefined toolpaths', () => {
    expect(SAMPLE_TOOLPATHS).toHaveProperty('pocketAndContour');
    expect(SAMPLE_TOOLPATHS).toHaveProperty('logoEngraving');
  });

  it('pocketAndContour should have valid points and stock dimensions', () => {
    const tp = SAMPLE_TOOLPATHS.pocketAndContour;
    expect(tp.stockDimensions).toEqual({ width: 100, height: 20, depth: 80 });
    expect(tp.points.length).toBeGreaterThan(10);
    expect(tp.points[0]).toHaveProperty('x');
    expect(tp.points[0]).toHaveProperty('y');
    expect(tp.points[0]).toHaveProperty('z');
    expect(tp.points[0]).toHaveProperty('feedRate');
    expect(tp.points[0]).toHaveProperty('type');
  });

  it('logoEngraving should generate helical spiral points correctly', () => {
    const tp = SAMPLE_TOOLPATHS.logoEngraving;
    expect(tp.points.length).toBeGreaterThan(50);
    expect(tp.points[0].type).toBe('rapid');
  });
});
