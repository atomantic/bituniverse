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

// Toon shader with a Moebius/Scavenger's Reign style
export const toonVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const toonFragmentShader = `
  uniform vec3 color;
  uniform vec3 glowColor;
  uniform float time;
  
  varying vec3 vNormal;
  varying vec2 vUv;
  
  // Simple noise for texture
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  void main() {
    // Basic lighting with a softer falloff
    vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0));
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
    
    // Mix base color with a subtle texture
    vec3 finalColor = color * toonLevel;
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
