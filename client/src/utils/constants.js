export const GALAXIES_PER_CLUSTER = 5;
export const GALAXY_SPACING = 50;
export const GALAXY_RADIUS = 2;
export const JUMP_RANGE = 30;
export const VISIBLE_GALAXIES = 10;
export const GALAXY_WINDOW_SIZE = 5;

export const TOTAL_KEYS = BigInt(2) ** BigInt(256);
export const KEYS_PER_GALAXY = TOTAL_KEYS / BigInt(1000000000000);
export const KEYS_PER_SYSTEM = KEYS_PER_GALAXY / BigInt(1000);

export const STAR_TYPES = {
  O: { color: "#9bb0ff", size: 6.2, rarity: 0.05 },
  B: { color: "#aabfff", size: 6.1, rarity: 0.1 },
  A: { color: "#cad7ff", size: 6.0, rarity: 0.15 },
  F: { color: "#f8f7ff", size: 6.9, rarity: 0.2 },
  G: { color: "#fff4ea", size: 5.8, rarity: 0.2 },
  K: { color: "#ffd2a1", size: 5.7, rarity: 0.15 },
  M: { color: "#ffcc6f", size: 5.6, rarity: 0.15 },
};

export const NEBULA_COLORS = [
  { color: "#ff61d8", intensity: 0.3 },
  { color: "#4df4ff", intensity: 0.3 },
  { color: "#7bffa0", intensity: 0.2 },
  { color: "#ff9b3d", intensity: 0.2 },
  { color: "#ff5757", intensity: 0.2 },
];

export const BLOOM_CONFIG = {
  intensity: 2.0,
  luminanceThreshold: 0.2,
  luminanceSmoothing: 0.9,
};

export const MAX_KEY = BigInt(
  "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
);
export const MIN_KEY = BigInt(1);
