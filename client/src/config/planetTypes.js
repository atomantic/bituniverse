import * as THREE from "three";

export const PLANET_TYPES = {
  // Gas Giants
  GAS_GIANT: {
    id: 0,
    name: "Gas Giant",
    sizeRange: [8, 12],
    colorRange: {
      hue: [30, 90], // Yellow to green
      saturation: [0.5, 0.9],
      value: [0.4, 0.8],
    },
    colorPalette: {
      low: new THREE.Color("#C4A265"),
      mid: new THREE.Color("#D4B896"),
      high: new THREE.Color("#E8D5B5"),
    },
    atmosphereColor: new THREE.Color("#D4A030"),
    terrainExaggeration: 0.05,
    hasAtmosphere: true,
    atmosphereOpacity: 0.3,
    metalness: 0.8,
    roughness: 0.2,
    noiseOctaves: 3,
    hasRings: true,
  },
  ICE_GIANT: {
    id: 1,
    name: "Ice Giant",
    sizeRange: [6, 8],
    colorRange: {
      hue: [180, 240], // Blue to cyan
      saturation: [0.5, 0.9],
      value: [0.4, 0.8],
    },
    colorPalette: {
      low: new THREE.Color("#3A6B8C"),
      mid: new THREE.Color("#6BA3C4"),
      high: new THREE.Color("#B0D8EF"),
    },
    atmosphereColor: new THREE.Color("#8CC8E8"),
    terrainExaggeration: 0.08,
    hasAtmosphere: true,
    atmosphereOpacity: 0.25,
    metalness: 0.7,
    roughness: 0.3,
    noiseOctaves: 2,
    hasRings: true,
  },
  // Rocky Planets
  ROCKY: {
    id: 2,
    name: "Rocky Planet",
    sizeRange: [3, 5],
    colorRange: {
      hue: [0, 60], // Red to yellow
      saturation: [0.4, 0.8],
      value: [0.3, 0.7],
    },
    colorPalette: {
      low: new THREE.Color("#5A4030"),
      mid: new THREE.Color("#8B7355"),
      high: new THREE.Color("#C4A87A"),
    },
    atmosphereColor: new THREE.Color("#A9C4B5"),
    terrainExaggeration: 0.15,
    hasAtmosphere: false,
    metalness: 0.2,
    roughness: 0.8,
    noiseOctaves: 6,
    hasRings: false,
  },
  DESERT: {
    id: 3,
    name: "Desert Planet",
    sizeRange: [3.5, 5.5],
    colorRange: {
      hue: [30, 60], // Orange to yellow
      saturation: [0.6, 0.9],
      value: [0.4, 0.8],
    },
    colorPalette: {
      low: new THREE.Color("#8B6914"),
      mid: new THREE.Color("#C4A035"),
      high: new THREE.Color("#E8D080"),
    },
    atmosphereColor: new THREE.Color("#D4945A"),
    terrainExaggeration: 0.12,
    hasAtmosphere: true,
    atmosphereOpacity: 0.1,
    metalness: 0.3,
    roughness: 0.7,
    noiseOctaves: 5,
    hasRings: false,
  },
  ICE: {
    id: 4,
    name: "Ice Planet",
    sizeRange: [3.2, 5.2],
    colorRange: {
      hue: [180, 220], // Light blue to cyan
      saturation: [0.4, 0.8],
      value: [0.5, 0.9],
    },
    colorPalette: {
      low: new THREE.Color("#4A7A8C"),
      mid: new THREE.Color("#A0D0E0"),
      high: new THREE.Color("#E8F4F8"),
    },
    atmosphereColor: new THREE.Color("#B0D8F0"),
    terrainExaggeration: 0.1,
    hasAtmosphere: true,
    atmosphereOpacity: 0.15,
    metalness: 0.4,
    roughness: 0.6,
    noiseOctaves: 5,
    hasRings: false,
  },
  OCEAN: {
    id: 5,
    name: "Ocean Planet",
    sizeRange: [3.4, 5.4],
    colorRange: {
      hue: [200, 240], // Blue to deep blue
      saturation: [0.5, 0.9],
      value: [0.3, 0.7],
    },
    colorPalette: {
      low: new THREE.Color("#1A3A5C"),
      mid: new THREE.Color("#2E8B8B"),
      high: new THREE.Color("#E0F0FF"),
    },
    atmosphereColor: new THREE.Color("#6AB0D0"),
    terrainExaggeration: 0.08,
    hasAtmosphere: true,
    atmosphereOpacity: 0.2,
    metalness: 0.3,
    roughness: 0.4,
    noiseOctaves: 4,
    hasRings: false,
  },
  PARADISE: {
    id: 6,
    name: "Paradise Planet",
    sizeRange: [3.2, 5.2],
    colorRange: {
      hue: [100, 160], // Green to blue-green
      saturation: [0.5, 0.9],
      value: [0.4, 0.8],
    },
    colorPalette: {
      low: new THREE.Color("#1A5C3A"),
      mid: new THREE.Color("#4CAF50"),
      high: new THREE.Color("#C8E6C9"),
    },
    atmosphereColor: new THREE.Color("#88C8A0"),
    terrainExaggeration: 0.12,
    hasAtmosphere: true,
    atmosphereOpacity: 0.15,
    metalness: 0.2,
    roughness: 0.5,
    noiseOctaves: 5,
    hasRings: false,
  },
  // Dwarf Planets
  DWARF: {
    id: 7,
    name: "Dwarf Planet",
    sizeRange: [1.5, 2.5],
    colorRange: {
      hue: [0, 360],
      saturation: [0.3, 0.7],
      value: [0.2, 0.6],
    },
    colorPalette: {
      low: new THREE.Color("#3A3A3A"),
      mid: new THREE.Color("#6B6B6B"),
      high: new THREE.Color("#A0A0A0"),
    },
    atmosphereColor: new THREE.Color("#808080"),
    terrainExaggeration: 0.2,
    hasAtmosphere: false,
    metalness: 0.1,
    roughness: 0.9,
    noiseOctaves: 6,
    hasRings: false,
  },
  // Special Types
  TOXIC: {
    id: 8,
    name: "Toxic Planet",
    sizeRange: [3.4, 5.4],
    colorRange: {
      hue: [80, 120], // Yellow-green to green
      saturation: [0.7, 1.0],
      value: [0.3, 0.7],
    },
    colorPalette: {
      low: new THREE.Color("#2A4A10"),
      mid: new THREE.Color("#6B8B23"),
      high: new THREE.Color("#ADFF2F"),
    },
    atmosphereColor: new THREE.Color("#8BC34A"),
    terrainExaggeration: 0.15,
    hasAtmosphere: true,
    atmosphereOpacity: 0.25,
    metalness: 0.3,
    roughness: 0.6,
    noiseOctaves: 5,
    hasRings: false,
  },
  LAVA: {
    id: 9,
    name: "Lava Planet",
    sizeRange: [3.2, 5.2],
    colorRange: {
      hue: [0, 30], // Red to orange
      saturation: [0.8, 1.0],
      value: [0.4, 0.8],
    },
    colorPalette: {
      low: new THREE.Color("#1A0A00"),
      mid: new THREE.Color("#CC3300"),
      high: new THREE.Color("#FF8C00"),
    },
    atmosphereColor: new THREE.Color("#CC4400"),
    terrainExaggeration: 0.18,
    hasAtmosphere: true,
    atmosphereOpacity: 0.2,
    metalness: 0.5,
    roughness: 0.4,
    noiseOctaves: 5,
    hasRings: false,
  },
};

// Helper function to generate a deterministic number from a string seed
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export { hashString };

export function getRandomPlanetType(seed) {
  const hash = hashString(seed);
  const planetTypes = Object.values(PLANET_TYPES);
  return planetTypes[hash % planetTypes.length];
}

export function generatePlanetColor(planetType, seed) {
  const hash = hashString(seed);
  const [minHue, maxHue] = planetType.colorRange.hue;
  const [minSat, maxSat] = planetType.colorRange.saturation;
  const [minVal, maxVal] = planetType.colorRange.value;

  // Use different parts of the hash for different color components
  const hue = minHue + ((hash % 1000) / 1000) * (maxHue - minHue);
  const saturation =
    minSat + (((hash >> 10) % 1000) / 1000) * (maxSat - minSat);
  const value = minVal + (((hash >> 20) % 1000) / 1000) * (maxVal - minVal);

  return new THREE.Color().setHSL(hue, saturation, value);
}
