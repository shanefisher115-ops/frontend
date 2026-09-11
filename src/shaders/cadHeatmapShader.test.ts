import { describe, it, expect } from 'vitest';
import { createCADHeatmapMaterial, CADVertexShader, CADFragmentShader } from './cadHeatmapShader';

describe('CAD Heatmap Shader Material', () => {
  it('instantiates Three.js ShaderMaterial with vertex and fragment shaders', () => {
    const material = createCADHeatmapMaterial({
      mode: 0,
      colormap: 0,
      stressMin: 10,
      stressMax: 300,
      tempMin: 25,
      tempMax: 400,
      showIsoContours: true,
    });

    expect(material).toBeDefined();
    expect(material.vertexShader).toBe(CADVertexShader);
    expect(material.fragmentShader).toBe(CADFragmentShader);
  });

  it('contains expected GLSL uniform declarations', () => {
    const material = createCADHeatmapMaterial({ mode: 1, colormap: 2 });
    const u = material.uniforms;

    expect(u.uMode.value).toBe(1);
    expect(u.uColormap.value).toBe(2);
    expect(u.uTime.value).toBe(0.0);
    expect(u.uShowIsoContours.value).toBe(1.0);
    expect(u.uContourFrequency.value).toBeGreaterThan(0);
    expect(u.uDeformationScale.value).toBeGreaterThan(0);
  });

  it('includes custom attributes in vertex shader code', () => {
    expect(CADVertexShader).toContain('attribute vec3 aStressTensor');
    expect(CADVertexShader).toContain('attribute float aTemperature');
    expect(CADVertexShader).toContain('attribute vec3 aThermalGradient');
    expect(CADVertexShader).toContain('attribute float aYieldStrength');
    expect(CADVertexShader).toContain('calculateVonMises');
  });

  it('includes multi-colormap algorithms and iso-contour calculation in fragment shader code', () => {
    expect(CADFragmentShader).toContain('colormapTurbo');
    expect(CADFragmentShader).toContain('colormapJet');
    expect(CADFragmentShader).toContain('colormapViridis');
    expect(CADFragmentShader).toContain('colormapInferno');
    expect(CADFragmentShader).toContain('colormapCoolWarm');
    expect(CADFragmentShader).toContain('calcIsoContour');
  });
});
