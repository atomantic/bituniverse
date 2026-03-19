import * as THREE from "three";

// Color palette inspired by Moebius and Scavenger's Reign
export const MOEBIUS_PALETTE = {
  background: new THREE.Color("#F0E8D8"), // Creamy white
  primary: new THREE.Color("#5E8B7E"), // Muted Teal
  secondary: new THREE.Color("#E9AFA3"), // Dusty Rose
  accent: new THREE.Color("#A999B3"), // Soft Lavender
  planet1: new THREE.Color("#D8C3A5"), // Pale Gold
  planet2: new THREE.Color("#8E8D8A"), // Light Grey
  atmosphere: new THREE.Color("#A9C4B5"), // Pastel Green
  glow: new THREE.Color("#F4E0B9"), // Pale Yellow
};

// Toon shader with elevation-based multi-color terrain
export const toonVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying float vElevation;

  uniform float elevationMin;
  uniform float elevationMax;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;

    // Compute elevation as normalized distance from center
    float dist = length(position);
    float range = elevationMax - elevationMin;
    vElevation = range > 0.0 ? (dist - elevationMin) / range : 0.5;
    vElevation = clamp(vElevation, 0.0, 1.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const toonFragmentShader = `
  uniform vec3 color;
  uniform vec3 colorLow;
  uniform vec3 colorMid;
  uniform vec3 colorHigh;
  uniform vec3 glowColor;
  uniform vec3 lightPosition;
  uniform float time;
  uniform float useElevationColors;

  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vElevation;

  // Simple noise for texture
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    // Dynamic lighting from uniform
    vec3 lightDir = normalize(lightPosition);
    float diff = dot(vNormal, lightDir);

    // Cel-shading with 3 distinct levels for a graphic look
    float toonLevel;
    if (diff > 0.8) {
      toonLevel = 0.9;
    } else if (diff > 0.4) {
      toonLevel = 0.6;
    } else {
      toonLevel = 0.3;
    }

    // Elevation-based color blending
    vec3 baseColor;
    if (useElevationColors > 0.5) {
      float lowToMid = smoothstep(0.0, 0.45, vElevation);
      float midToHigh = smoothstep(0.55, 1.0, vElevation);
      baseColor = mix(colorLow, colorMid, lowToMid);
      baseColor = mix(baseColor, colorHigh, midToHigh);
    } else {
      baseColor = color;
    }

    // Mix base color with a subtle texture
    vec3 finalColor = baseColor * toonLevel;
    finalColor += noise(vUv * 20.0 + time * 0.05) * 0.05;

    // Rim light effect for a soft glow
    float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    rim = pow(rim, 2.0);
    finalColor += glowColor * rim * 0.5;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// Atmosphere shader with a soft, ethereal feel
export const atmosphereVertexShader = `
  varying vec3 vNormal;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const atmosphereFragmentShader = `
  uniform vec3 atmosphereColor;
  uniform float time;

  varying vec3 vNormal;

  // Noise for a gentle, swirling effect
  float noise(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 151.7182))) * 43758.5453);
  }

  void main() {
    // Soft glow based on the viewing angle
    float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);

    // Add subtle, time-based noise to simulate atmospheric movement
    vec3 pos = vNormal * 5.0 + time * 0.1;
    intensity += noise(pos) * 0.1;

    gl_FragColor = vec4(atmosphereColor, intensity * 0.6);
  }
`;

// Ring shader for gas/ice giants
export const ringVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const ringFragmentShader = `
  uniform vec3 ringColor;
  uniform float seed;

  varying vec2 vUv;

  float hash(float n) {
    return fract(sin(n) * 43758.5453);
  }

  void main() {
    // Radial distance from center of ring (0 = inner, 1 = outer)
    float r = vUv.x;

    // Procedural opacity bands
    float band1 = smoothstep(0.0, 0.1, r) * (1.0 - smoothstep(0.15, 0.25, r));
    float band2 = smoothstep(0.3, 0.4, r) * (1.0 - smoothstep(0.7, 0.8, r));
    float band3 = smoothstep(0.85, 0.9, r) * (1.0 - smoothstep(0.95, 1.0, r));

    // Add noise variation based on seed
    float noise = hash(r * 50.0 + seed) * 0.3;

    float opacity = (band1 * 0.6 + band2 * 0.8 + band3 * 0.4 + noise * 0.2);
    opacity *= 0.7;

    // Fade at edges
    opacity *= smoothstep(0.0, 0.05, r) * (1.0 - smoothstep(0.95, 1.0, r));

    gl_FragColor = vec4(ringColor, opacity);
  }
`;
