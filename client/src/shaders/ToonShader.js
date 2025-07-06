import * as THREE from "three";

// Color palette inspired by Scavenger's Reign
export const SCAVENGER_PALETTE = {
  // Main colors
  primary: new THREE.Color("#2A1B50"), // Deep purple background
  secondary: new THREE.Color("#4DF4FF"), // Cyan accent
  accent: new THREE.Color("#FF61D8"), // Pink highlight

  // Planet colors
  rocky: new THREE.Color("#8B4513"), // Earth brown
  gas: new THREE.Color("#FFD700"), // Gold
  ice: new THREE.Color("#00BFFF"), // Light blue
  dwarf: new THREE.Color("#808080"), // Gray

  // Star colors
  star: new THREE.Color("#FFD700"), // Gold
  starGlow: new THREE.Color("#FFA500"), // Orange glow

  // Atmosphere colors
  atmosphere: new THREE.Color("#4DF4FF"), // Cyan
  atmosphereGlow: new THREE.Color("#00BFFF"), // Light blue glow
};

// Toon shader with Scavenger's Reign style
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
  uniform float glowIntensity;
  uniform float outlineWidth;
  uniform float outlineStrength;
  uniform float time;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  
  // Noise function for texture variation
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  void main() {
    // Basic lighting
    vec3 lightDir = normalize(vec3(1.0, 0.0, 0.0));
    float diff = max(dot(vNormal, lightDir), 0.0);
    
    // Toon shading with 4 levels
    float toonLevel = floor(diff * 4.0) / 4.0;
    
    // Add some texture variation
    float noiseValue = noise(vUv * 10.0 + time * 0.1);
    
    // Outline effect
    float outline = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    outline = pow(outline, outlineWidth);
    
    // Combine effects
    vec3 finalColor = mix(color, glowColor, outline * outlineStrength);
    finalColor *= toonLevel;
    finalColor += noiseValue * 0.1; // Add subtle texture
    
    // Add glow
    float glow = pow(1.0 - diff, 2.0);
    finalColor += glowColor * glow * glowIntensity;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// Atmosphere shader with Scavenger's Reign style
export const atmosphereVertexShader = `
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

export const atmosphereFragmentShader = `
  uniform vec3 atmosphereColor;
  uniform float time;
  uniform float glowIntensity;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  
  // Noise function for atmosphere movement
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  void main() {
    vec3 lightDir = normalize(vec3(1.0, 0.0, 0.0));
    float intensity = pow(0.7 - dot(vNormal, lightDir), 2.0);
    
    // Add organic movement to the atmosphere
    float noiseValue = noise(vUv * 5.0 + time * 0.05);
    intensity += noiseValue * 0.2;
    
    // Add edge glow
    float edgeGlow = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.0);
    intensity += edgeGlow * glowIntensity;
    
    // Add some color variation
    vec3 finalColor = atmosphereColor;
    finalColor += vec3(noiseValue * 0.1);
    
    gl_FragColor = vec4(finalColor, intensity * 0.5);
  }
`;
