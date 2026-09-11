import * as THREE from 'three';

export type ColormapType = 'turbo' | 'jet' | 'viridis' | 'inferno' | 'coolwarm';
export type VisualizationMode = 'vonMises' | 'thermal' | 'thermalGradient' | 'combined';

export interface HeatmapShaderUniforms {
  uTime: { value: number };
  uMode: { value: number }; // 0: Von Mises, 1: Thermal, 2: Thermal Gradient, 3: Combined
  uColormap: { value: number }; // 0: Turbo, 1: Jet, 2: Viridis, 3: Inferno, 4: CoolWarm
  uStressMin: { value: number };
  uStressMax: { value: number };
  uTempMin: { value: number };
  uTempMax: { value: number };
  uShowIsoContours: { value: number }; // 0 or 1
  uContourFrequency: { value: number };
  uContourWidth: { value: number };
  uDeformationScale: { value: number }; // Dynamic surface displacement based on stress
  uProbePosition: { value: THREE.Vector3 };
  uShowProbeMarker: { value: number };
  uLightDirection: { value: THREE.Vector3 };
  uSpecularPower: { value: number };
  uAmbientIntensity: { value: number };
  uHeatSourcePos1: { value: THREE.Vector3 };
  uHeatSourcePos2: { value: THREE.Vector3 };
  uHeatSourceIntensity: { value: number };
  uLoadPointPos: { value: THREE.Vector3 };
  uLoadPointForce: { value: number };
  uOpacity: { value: number };
}

export const CADVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uDeformationScale;
  uniform vec3 uLoadPointPos;
  uniform float uLoadPointForce;

  // Vertex attributes for CAD geometry & FEA mesh
  attribute vec3 aStressTensor; // (sigma_x, sigma_y, tau_xy)
  attribute float aTemperature; // Local scalar temperature (°C)
  attribute vec3 aThermalGradient; // (dT/dx, dT/dy, dT/dz)
  attribute float aYieldStrength; // Material yield strength (MPa)

  // Varyings passed to fragment shader
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vStressTensor;
  varying float vTemperature;
  varying vec3 vThermalGradient;
  varying float vVonMisesStress;
  varying float vYieldStrength;
  varying vec2 vUv;

  // Function to compute 3D Von Mises equivalent stress from stress tensor component inputs
  float calculateVonMises(vec3 stress) {
    // stress = vec3(sigma_x, sigma_y, tau_xy)
    // von Mises = sqrt( sigma_x^2 - sigma_x*sigma_y + sigma_y^2 + 3*tau_xy^2 )
    float sx = stress.x;
    float sy = stress.y;
    float txy = stress.z;
    return sqrt(clamp(sx * sx - sx * sy + sy * sy + 3.0 * txy * txy, 0.0, 1e10));
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vStressTensor = aStressTensor;
    vYieldStrength = aYieldStrength;

    // Dynamic wave modulation based on distance to load point force
    float distToLoad = distance(position, uLoadPointPos);
    float dynamicPulse = sin(uTime * 4.0 - distToLoad * 2.0) * 0.15 + 1.0;

    // Dynamic Von Mises calculation with dynamic pulsing load
    float baseVonMises = calculateVonMises(aStressTensor);
    vVonMisesStress = baseVonMises * (1.0 + 0.25 * sin(uTime * 3.0) * exp(-distToLoad * 0.5));

    // Dynamic temperature diffusion wave propagation
    float thermalPulse = sin(uTime * 2.0 - length(position) * 1.5) * 5.0;
    vTemperature = aTemperature + thermalPulse;

    // Compute dynamic thermal gradient magnitude adjustment
    vThermalGradient = aThermalGradient * (1.0 + 0.2 * cos(uTime * 2.5));

    // Exaggerated physical displacement proportional to Von Mises stress along normal vector
    vec3 displacedPosition = position + normal * (vVonMisesStress / (vYieldStrength + 1.0e-5)) * uDeformationScale * dynamicPulse * 0.05;

    vPosition = displacedPosition;
    vec4 worldPos = modelMatrix * vec4(displacedPosition, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const CADFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform int uMode; // 0: Von Mises, 1: Thermal, 2: Thermal Gradient, 3: Combined
  uniform int uColormap; // 0: Turbo, 1: Jet, 2: Viridis, 3: Inferno, 4: CoolWarm
  uniform float uStressMin;
  uniform float uStressMax;
  uniform float uTempMin;
  uniform float uTempMax;
  uniform bool uShowIsoContours;
  uniform float uContourFrequency;
  uniform float uContourWidth;
  uniform vec3 uProbePosition;
  uniform bool uShowProbeMarker;
  uniform vec3 uLightDirection;
  uniform float uSpecularPower;
  uniform float uAmbientIntensity;
  uniform float uOpacity;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vStressTensor;
  varying float vTemperature;
  varying vec3 vThermalGradient;
  varying float vVonMisesStress;
  varying float vYieldStrength;
  varying vec2 vUv;

  // --- COLORMAP FUNCTIONS ---

  // 1. Turbo Colormap approximation
  vec3 colormapTurbo(float x) {
    x = clamp(x, 0.0, 1.0);
    const vec4 kRedVec4   = vec4(0.13572138, 4.61539260, -42.66032258, 132.13108234);
    const vec4 kGreenVec4 = vec4(0.09140261, 2.19418839, 4.84296658, -14.18503333);
    const vec4 kBlueVec4  = vec4(0.10667330, 12.64194608, -60.58204836, 110.36276771);
    const vec2 kRedVec2   = vec2(-152.94239396, 59.28637943);
    const vec2 kGreenVec2 = vec2(4.27729857, -2.82956604);
    const vec2 kBlueVec2  = vec2(-89.90310912, 27.34824973);

    vec4 x4 = vec4(1.0, x, x * x, x * x * x);
    vec2 x2 = vec2(x4.w * x, x4.w * x * x);

    float r = dot(x4, kRedVec4) + dot(x2, kRedVec2);
    float g = dot(x4, kGreenVec4) + dot(x2, kGreenVec2);
    float b = dot(x4, kBlueVec4) + dot(x2, kBlueVec2);

    return clamp(vec3(r, g, b), 0.0, 1.0);
  }

  // 2. Jet Colormap
  vec3 colormapJet(float x) {
    x = clamp(x, 0.0, 1.0);
    float r = clamp(min(4.0 * x - 1.5, -4.0 * x + 4.5), 0.0, 1.0);
    float g = clamp(min(4.0 * x - 0.5, -4.0 * x + 3.5), 0.0, 1.0);
    float b = clamp(min(4.0 * x + 0.5, -4.0 * x + 2.5), 0.0, 1.0);
    return vec3(r, g, b);
  }

  // 3. Viridis Colormap polynomial fit
  vec3 colormapViridis(float x) {
    x = clamp(x, 0.0, 1.0);
    vec3 c0 = vec3(0.2777273, 0.0054073, 0.3340998);
    vec3 c1 = vec3(0.1050500, 1.4046135, 1.3845382);
    vec3 c2 = vec3(-0.3308618, 0.2148475, 0.0950951);
    vec3 c3 = vec3(-4.6342305, -2.7100000, -3.2912217);
    vec3 c4 = vec3(6.2282699, 2.7779332, 3.1252834);
    vec3 c5 = vec3(-2.3761917, -0.9150186, -0.9715122);
    return clamp(c0 + x * (c1 + x * (c2 + x * (c3 + x * (c4 + x * c5)))), 0.0, 1.0);
  }

  // 4. Inferno Colormap approximation
  vec3 colormapInferno(float x) {
    x = clamp(x, 0.0, 1.0);
    vec3 c0 = vec3(0.000214, 0.001816, 0.013875);
    vec3 c1 = vec3(0.861541, -0.108000, -0.108000);
    vec3 c2 = vec3(0.891855, 2.126831, 0.433151);
    vec3 c3 = vec3(-4.322727, -1.804500, 1.930000);
    vec3 c4 = vec3(3.571000, -0.276000, -3.310000);
    return clamp(c0 + x * (c1 + x * (c2 + x * (c3 + x * c4))), 0.0, 1.0);
  }

  // 5. CoolWarm Colormap
  vec3 colormapCoolWarm(float x) {
    x = clamp(x, 0.0, 1.0);
    vec3 cool = vec3(0.230, 0.299, 0.754);
    vec3 mid = vec3(0.865, 0.865, 0.865);
    vec3 warm = vec3(0.706, 0.016, 0.150);
    if (x < 0.5) {
      return mix(cool, mid, x * 2.0);
    } else {
      return mix(mid, warm, (x - 0.5) * 2.0);
    }
  }

  vec3 sampleColormap(float t) {
    if (uColormap == 1) return colormapJet(t);
    if (uColormap == 2) return colormapViridis(t);
    if (uColormap == 3) return colormapInferno(t);
    if (uColormap == 4) return colormapCoolWarm(t);
    return colormapTurbo(t); // Default (0)
  }

  // Anti-aliased iso-contour line calculation using screen-space derivatives
  float calcIsoContour(float val, float freq, float width) {
    float cell = val * freq;
    float line = abs(fract(cell - 0.5) - 0.5);
    float df = fwidth(cell);
    return smoothstep(width * df, 0.0, line);
  }

  void main() {
    float normalizedVal = 0.0;

    if (uMode == 0) {
      // Von Mises Stress Mode
      normalizedVal = (vVonMisesStress - uStressMin) / max(uStressMax - uStressMin, 1.0e-5);
    } else if (uMode == 1) {
      // Thermal Temperature Mode
      normalizedVal = (vTemperature - uTempMin) / max(uTempMax - uTempMin, 1.0e-5);
    } else if (uMode == 2) {
      // Thermal Gradient Magnitude Mode
      float gradMag = length(vThermalGradient);
      normalizedVal = gradMag / 150.0; // Scaled to reasonable range
    } else if (uMode == 3) {
      // Combined Stress + Temperature Mode
      float stressNorm = (vVonMisesStress - uStressMin) / max(uStressMax - uStressMin, 1.0e-5);
      float tempNorm = (vTemperature - uTempMin) / max(uTempMax - uTempMin, 1.0e-5);
      normalizedVal = mix(stressNorm, tempNorm, 0.5);
    }

    normalizedVal = clamp(normalizedVal, 0.0, 1.0);

    // Sample CAD Heatmap Color
    vec3 heatmapColor = sampleColormap(normalizedVal);

    // High Yield Stress Warning Highlight (flashing hatch / brightness boost above yield limit)
    if (uMode == 0 && vVonMisesStress > vYieldStrength) {
      float flash = sin(uTime * 10.0) * 0.2 + 0.8;
      heatmapColor = mix(heatmapColor, vec3(1.0, 0.0, 0.2), 0.4 * flash);
    }

    // Overlay ISO-Contour Lines
    if (uShowIsoContours) {
      float contourPattern = calcIsoContour(normalizedVal, uContourFrequency, uContourWidth);
      heatmapColor = mix(heatmapColor, vec3(0.0, 0.0, 0.0), contourPattern * 0.75);
    }

    // CAD Shading & Lighting (Blinn-Phong model to preserve 3D geometry shape)
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uLightDirection);
    vec3 V = normalize(-vWorldPosition);
    vec3 H = normalize(L + V);

    float diff = max(dot(N, L), 0.0);
    float spec = pow(max(dot(N, H), 0.0), uSpecularPower);

    vec3 ambient = uAmbientIntensity * heatmapColor;
    vec3 diffuse = diff * heatmapColor * 0.75;
    vec3 specular = vec3(0.3) * spec;

    vec3 finalColor = ambient + diffuse + specular;

    // Interactive Raycast Probe Highlight Marker
    if (uShowProbeMarker) {
      float distToProbe = distance(vWorldPosition, uProbePosition);
      if (distToProbe < 0.2) {
        float probeRing = smoothstep(0.2, 0.15, distToProbe) - smoothstep(0.12, 0.08, distToProbe);
        finalColor = mix(finalColor, vec3(1.0, 1.0, 0.0), probeRing);
      }
    }

    gl_FragColor = vec4(finalColor, uOpacity);
  }
`;

export function createCADHeatmapMaterial(options?: {
  mode?: number;
  colormap?: number;
  stressMin?: number;
  stressMax?: number;
  tempMin?: number;
  tempMax?: number;
  showIsoContours?: boolean;
}): THREE.ShaderMaterial {
  const uniforms: HeatmapShaderUniforms = {
    uTime: { value: 0.0 },
    uMode: { value: options?.mode ?? 0 },
    uColormap: { value: options?.colormap ?? 0 },
    uStressMin: { value: options?.stressMin ?? 0.0 },
    uStressMax: { value: options?.stressMax ?? 350.0 },
    uTempMin: { value: options?.tempMin ?? 20.0 },
    uTempMax: { value: options?.tempMax ?? 350.0 },
    uShowIsoContours: { value: options?.showIsoContours ? 1.0 : 1.0 },
    uContourFrequency: { value: 10.0 },
    uContourWidth: { value: 1.5 },
    uDeformationScale: { value: 0.1 },
    uProbePosition: { value: new THREE.Vector3(0, 0, 0) },
    uShowProbeMarker: { value: 0.0 },
    uLightDirection: { value: new THREE.Vector3(1.0, 1.5, 2.0).normalize() },
    uSpecularPower: { value: 32.0 },
    uAmbientIntensity: { value: 0.35 },
    uHeatSourcePos1: { value: new THREE.Vector3(-1.5, 0.5, 0.0) },
    uHeatSourcePos2: { value: new THREE.Vector3(1.5, -0.5, 0.5) },
    uHeatSourceIntensity: { value: 100.0 },
    uLoadPointPos: { value: new THREE.Vector3(0.0, 1.0, 0.0) },
    uLoadPointForce: { value: 250.0 },
    uOpacity: { value: 1.0 },
  };

  return new THREE.ShaderMaterial({
    vertexShader: CADVertexShader,
    fragmentShader: CADFragmentShader,
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    transparent: true,
    side: THREE.DoubleSide,
  });
}
