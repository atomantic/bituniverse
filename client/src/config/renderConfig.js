export const DEBUG_LOGGING = false;

// Star appearance
export const STAR_MIN = 1.0;
export const STAR_MAX = 8.0;

// Galaxy structure
export const INSTANCE_MULTIPLIER = 1; // Multiplier for instanced rendering
export const NUM_STARS = 100000000000; // Base number of stars
export const TOTAL_STARS = NUM_STARS * INSTANCE_MULTIPLIER; // Total stars after instancing (10 billion)
export const GALAXY_THICKNESS = 200; // Reduced for flatter galaxy
export const ARMS = 3.0;
export const SPIRAL = 3.0;
export const ELLIPTICAL_FACTOR = 1.8; // Ratio of major to minor axis (>1.0 = stretched horizontally)

// Nebula configuration
export const NEBULA_CENTER_HOLE = 0.15; // Size of empty center hole as fraction of arm position
export const NEBULA_COUNT = 20000; // Total particles for primary nebula
export const NEBULA_EXTEND_FACTOR = 3.75; // How far beyond star arms (450% of arm length)
export const NEBULA_MAX_OPACITY = 0.25; // Maximum opacity for outer regions
export const NEBULA_MAX_SIZE = 400; // Maximum particle size (outer edges)
export const NEBULA_MIN_OPACITY = 0.05; // Minimum opacity for inner regions
export const NEBULA_MIN_SIZE = 10; // Minimum particle size (inner regions)
export const NEBULA_PATCHINESS = 0.6; // How patchy the primary nebula is (0-1)
export const NEBULA_THICKNESS_RATIO = 0.06; // Thickness of nebula relative to galaxy (6%)

// Nebula density variation parameters
export const NEBULA_DENSITY_START = 1; // Where density variations start (0-1, from center)
export const NEBULA_DENSITY_NOISE_FREQS = [30, 15, 8]; // Noise frequencies for different scales
export const NEBULA_DENSITY_NOISE_WEIGHTS = [0.5, 0.3, 0.2]; // Weights for each noise frequency
export const NEBULA_DENSITY_BASE_STRENGTH = 1.3; // Base strength of density variations
export const NEBULA_DENSITY_OUTER_BOOST = 1.4; // Additional strength in outer regions

// Primary nebula colors (pink/purple)
export const NEBULA_COLORS = [
  0xff9ef2, // Light pink
  0xff48d5, // Hot pink
  0xd03aeb, // Purple-pink
  0xa333de, // Purple
  0x7030a0, // Deep purple
];

// Secondary nebula configuration
export const SECONDARY_NEBULA_COUNT = 25000; // Particles for secondary nebula layer
export const SECONDARY_NEBULA_EXTEND_FACTOR = 4.8; // Slightly less extended than primary
export const SECONDARY_NEBULA_MAX_OPACITY = 0.18;
export const SECONDARY_NEBULA_MAX_SIZE = 800;
export const SECONDARY_NEBULA_MIN_OPACITY = 0.03;
export const SECONDARY_NEBULA_MIN_SIZE = 8; // Smaller particle sizes
export const SECONDARY_NEBULA_PATCHINESS = 0.35; // How patchy the secondary nebula is (0-1)
export const SECONDARY_NEBULA_THICKNESS_RATIO = 0.04; // Thinner than primary nebula

// Secondary nebula colors (orange/blue)
export const SECONDARY_NEBULA_COLORS = [
  0xff7b00, // Sherbet orange
  0xff4500, // Orange-red
  0xc93400, // Darker red
  0x9000ff, // Bright purple
  0x0066ff, // Blue
];

// Star distribution percentages (must sum to 1.0)
export const CORE_STAR_PERCENTAGE = 0.001;
export const OUTER_CORE_PERCENTAGE = 0.001;
export const ARM_STAR_PERCENTAGE = 0.998;

// Core region parameters
export const CORE_X_DIST = 300; // Increased for wider core
export const CORE_Y_DIST = 200; // Kept smaller for elliptical shape

// Outer core region parameters
export const OUTER_CORE_X_DIST = 600; // Increased for wider outer core
export const OUTER_CORE_Y_DIST = 400; // Kept smaller for elliptical shape

// Spiral arm parameters
export const ARM_X_DIST = 2400; // Increased for wider arms
export const ARM_Y_DIST = 2400; // Kept smaller for elliptical shape
export const ARM_X_MEAN = 2400; // Increased to match ARM_X_DIST
export const ARM_Y_MEAN = 2400; // Kept smaller for elliptical shape

// Camera settings
export const CAMERA = {
  position: [10400, 14000, 9500],
  near: 0.1,
  far: 2000000,
  up: [0, 0, 1],
};

// Orbit controls settings
export const ORBIT_CONTROLS = {
  minDistance: 200,
  maxDistance: 20000,
  maxPolarAngle: Math.PI,
  dampingFactor: 0.1,
  screenSpacePanning: false,
  enableDamping: true,
  rotateSpeed: 0.5,
  zoomSpeed: 0.5,
  panSpeed: 0.5,
  enableZoom: true,
  enableRotate: true,
  enablePan: true,
  target: [0, 0, 0],
  minZoom: 0.1,
  maxZoom: 10,
  minPan: [-10000, -10000, -10000],
  maxPan: [10000, 10000, 10000],
};

// Fog settings
export const FOG = {
  color: "#000",
  near: 4000, // Adjusted for larger galaxy
  far: 16000, // Increased for larger galaxy
};

// Haze effect parameters
export const HAZE_MAX = 50.0;
export const HAZE_MIN = 20.0;
export const HAZE_OPACITY = 0.2;
export const HAZE_RATIO = 0.5;

// Render layers
export const BASE_LAYER = 0;
export const BLOOM_LAYER = 1;
export const OVERLAY_LAYER = 2;

// Bloom effect parameters
export const BLOOM_PARAMS = {
  exposure: 0.8,
  bloomStrength: 1.0,
  bloomThreshold: 0.3,
  bloomRadius: 0.8,
};
