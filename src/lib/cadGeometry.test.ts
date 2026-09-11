import { describe, it, expect } from 'vitest';
import {
  createMechanicalBracketGeometry,
  createTurbineBladeGeometry,
  createIBeamGeometry,
  getCADGeometry,
} from './cadGeometry';

describe('CAD Geometry & FEA Data Generation', () => {
  it('generates Mechanical Bracket CAD geometry with FEA attributes', () => {
    const result = createMechanicalBracketGeometry();
    expect(result.geometry).toBeDefined();
    expect(result.meshName).toContain('Bracket');
    expect(result.maxStress).toBeGreaterThan(0);
    expect(result.maxTemp).toBeGreaterThan(0);

    const geom = result.geometry;
    expect(geom.getAttribute('aStressTensor')).toBeDefined();
    expect(geom.getAttribute('aTemperature')).toBeDefined();
    expect(geom.getAttribute('aThermalGradient')).toBeDefined();
    expect(geom.getAttribute('aYieldStrength')).toBeDefined();

    expect(geom.getAttribute('aStressTensor').count).toBe(geom.getAttribute('position').count);
  });

  it('generates Aerospace Turbine Blade CAD geometry', () => {
    const result = createTurbineBladeGeometry();
    expect(result.geometry).toBeDefined();
    expect(result.meshName).toContain('Turbine Blade');
    expect(result.maxStress).toBeGreaterThan(0);
    expect(result.maxTemp).toBeGreaterThan(0);
  });

  it('generates Structural I-Beam CAD geometry', () => {
    const result = createIBeamGeometry();
    expect(result.geometry).toBeDefined();
    expect(result.meshName).toContain('I-Beam');
    expect(result.maxStress).toBeGreaterThan(0);
  });

  it('fetches correct geometry using getCADGeometry wrapper', () => {
    const bracket = getCADGeometry('bracket');
    const blade = getCADGeometry('turbineBlade');
    const beam = getCADGeometry('iBeam');

    expect(bracket.meshName).toContain('Bracket');
    expect(blade.meshName).toContain('Turbine');
    expect(beam.meshName).toContain('I-Beam');
  });
});
