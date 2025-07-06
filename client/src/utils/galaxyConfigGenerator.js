import { hashString } from "./helpers";
import {
  // Nebula configuration imports
  NEBULA_COUNT,
  NEBULA_EXTEND_FACTOR,
  NEBULA_MAX_OPACITY,
  NEBULA_MIN_OPACITY,
  NEBULA_MAX_SIZE,
  NEBULA_MIN_SIZE,
  NEBULA_THICKNESS_RATIO,
  NEBULA_PATCHINESS,
  // Nebula density variation parameters
  NEBULA_DENSITY_START,
  NEBULA_DENSITY_NOISE_FREQS,
  NEBULA_DENSITY_NOISE_WEIGHTS,
  NEBULA_DENSITY_BASE_STRENGTH,
  NEBULA_DENSITY_OUTER_BOOST,
  // Secondary nebula imports
  SECONDARY_NEBULA_COUNT,
  SECONDARY_NEBULA_PATCHINESS,
  SECONDARY_NEBULA_EXTEND_FACTOR,
  SECONDARY_NEBULA_THICKNESS_RATIO,
  SECONDARY_NEBULA_MIN_SIZE,
  SECONDARY_NEBULA_MAX_SIZE,
  SECONDARY_NEBULA_MIN_OPACITY,
  SECONDARY_NEBULA_MAX_OPACITY,
  SECONDARY_NEBULA_COLORS,
  NEBULA_COLORS,
  // Structure
  ARMS,
  SPIRAL,
  ELLIPTICAL_FACTOR,
  // Core and arm parameters
  CORE_X_DIST,
  OUTER_CORE_X_DIST,
  ARM_X_DIST,
  ARM_Y_DIST,
  ARM_X_MEAN,
  ARM_Y_MEAN,
  // Galaxy thickness
  GALAXY_THICKNESS,
} from "../config/renderConfig";

// Helper function to generate a deterministic value between min and max based on a seed
function seededRandom(seed, min, max, isInteger = false) {
  const hash = hashString(seed.toString());
  // Use Math.abs to ensure positive value and modulo to keep within range
  const normalizedHash = Math.abs(hash % 1000) / 1000;
  const value = min + normalizedHash * (max - min);
  return isInteger ? Math.floor(value) : value;
}

// Helper function to generate a deterministic color variation
function generateColorVariation(baseColor, seed) {
  const hash = hashString(seed.toString());
  const hueShift = ((hash % 1000) / 1000) * 60 - 30; // ±30 degrees hue shift
  const saturationShift = ((hash % 1000) / 1000) * 0.2 - 0.1; // ±10% saturation
  const brightnessShift = ((hash % 1000) / 1000) * 0.2 - 0.1; // ±10% brightness

  // Convert hex to HSL
  const r = (baseColor >> 16) & 0xff;
  const g = (baseColor >> 8) & 0xff;
  const b = baseColor & 0xff;

  // Convert RGB to HSL
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r / 255:
        h = (g / 255 - b / 255) / d + (g / 255 < b / 255 ? 6 : 0);
        break;
      case g / 255:
        h = (b / 255 - r / 255) / d + 2;
        break;
      case b / 255:
        h = (r / 255 - g / 255) / d + 4;
        break;
      default:
        h = 0;
        break;
    }
    h /= 6;
  }

  // Apply variations
  h = (h + hueShift / 360) % 1;
  s = Math.max(0, Math.min(1, s + saturationShift));
  l = Math.max(0, Math.min(1, l + brightnessShift));

  // Convert back to RGB
  let r2, g2, b2;
  if (s === 0) {
    r2 = g2 = b2 = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r2 = hue2rgb(p, q, h + 1 / 3);
    g2 = hue2rgb(p, q, h);
    b2 = hue2rgb(p, q, h - 1 / 3);
  }

  return (
    (Math.round(r2 * 255) << 16) |
    (Math.round(g2 * 255) << 8) |
    Math.round(b2 * 255)
  );
}

export function generateGalaxyConfig(galaxyIndex) {
  // For galaxy 0, use the static config from renderConfig
  if (galaxyIndex === 0) {
    return {
      // Primary nebula variations
      NEBULA_COUNT,
      NEBULA_EXTEND_FACTOR,
      NEBULA_MAX_OPACITY,
      NEBULA_MIN_OPACITY,
      NEBULA_MAX_SIZE,
      NEBULA_MIN_SIZE,
      NEBULA_PATCHINESS,
      NEBULA_THICKNESS_RATIO,

      // Density variation parameters
      NEBULA_DENSITY_START,
      NEBULA_DENSITY_NOISE_FREQS,
      NEBULA_DENSITY_NOISE_WEIGHTS,
      NEBULA_DENSITY_BASE_STRENGTH,
      NEBULA_DENSITY_OUTER_BOOST,

      // Secondary nebula configuration
      SECONDARY_NEBULA_COUNT,
      SECONDARY_NEBULA_EXTEND_FACTOR,
      SECONDARY_NEBULA_MAX_OPACITY,
      SECONDARY_NEBULA_MIN_OPACITY,
      SECONDARY_NEBULA_MAX_SIZE,
      SECONDARY_NEBULA_MIN_SIZE,
      SECONDARY_NEBULA_PATCHINESS,
      SECONDARY_NEBULA_THICKNESS_RATIO,

      // Colors
      NEBULA_COLORS,
      SECONDARY_NEBULA_COLORS,

      // Structure
      ARMS,
      SPIRAL,
      ELLIPTICAL_FACTOR,

      // Core and arm parameters
      CORE_X_DIST,
      OUTER_CORE_X_DIST,
      ARM_X_DIST,
      ARM_Y_DIST,
      ARM_X_MEAN,
      ARM_Y_MEAN,

      // Galaxy thickness
      GALAXY_THICKNESS,
    };
  }

  // For all other galaxies, use dynamic config generation
  const colorSeed = hashString(`colors_${galaxyIndex}`);
  const structureSeed = hashString(`structure_${galaxyIndex}`);
  const nebulaSeed = hashString(`nebula_${galaxyIndex}`);

  // Generate color variations for both primary and secondary nebula
  const primaryColors = [0xff9ef2, 0xff48d5, 0xd03aeb, 0xa333de, 0x7030a0].map(
    (color, i) => generateColorVariation(color, `${colorSeed}_primary_${i}`)
  );

  const secondaryColors = [
    0xff7b00, 0xff4500, 0xc93400, 0x9000ff, 0x0066ff,
  ].map((color, i) =>
    generateColorVariation(color, `${colorSeed}_secondary_${i}`)
  );

  // Generate structure variations
  const arms = seededRandom(structureSeed + "arms", 1, 5, true);
  const spiral = seededRandom(structureSeed + "spiral", 2.5, 3.5);
  const ellipticalFactor = seededRandom(structureSeed + "elliptical", 1.5, 2.1);

  // Generate core and arm distance variations
  const coreDist = seededRandom(structureSeed + "core", 250, 350, true);
  const outerCoreDist = seededRandom(
    structureSeed + "outer_core",
    500,
    700,
    true
  );
  const armDist = seededRandom(structureSeed + "arm", 2000, 2800, true);
  const armMean = seededRandom(structureSeed + "arm_mean", 2000, 2800, true);

  // Generate galaxy thickness variation
  const galaxyThickness = seededRandom(
    structureSeed + "thickness",
    150,
    250,
    true
  );

  // Generate nebula variations
  const nebulaConfig = {
    // Primary nebula variations
    NEBULA_COUNT: seededRandom(nebulaSeed + "count", 15000, 25000, true),
    NEBULA_EXTEND_FACTOR: seededRandom(nebulaSeed + "extend", 3.5, 4.0),
    NEBULA_MAX_OPACITY: seededRandom(nebulaSeed + "max_opacity", 0.1, 0.3),
    NEBULA_MIN_OPACITY: seededRandom(nebulaSeed + "min_opacity", 0.02, 0.06),
    NEBULA_MAX_SIZE: seededRandom(nebulaSeed + "max_size", 350, 450, true),
    NEBULA_MIN_SIZE: seededRandom(nebulaSeed + "min_size", 8, 12, true),
    NEBULA_PATCHINESS: seededRandom(nebulaSeed + "patchiness", 0.2, 0.5),
    NEBULA_THICKNESS_RATIO: seededRandom(nebulaSeed + "thickness", 0.05, 0.07),

    // Density variation parameters
    NEBULA_DENSITY_START: seededRandom(nebulaSeed + "density_start", 0.2, 0.4),
    NEBULA_DENSITY_NOISE_FREQS: [
      seededRandom(nebulaSeed + "freq1", 25, 35, true),
      seededRandom(nebulaSeed + "freq2", 12, 18, true),
      seededRandom(nebulaSeed + "freq3", 6, 10, true),
    ],
    NEBULA_DENSITY_NOISE_WEIGHTS: [
      seededRandom(nebulaSeed + "weight1", 0.4, 0.6),
      seededRandom(nebulaSeed + "weight2", 0.2, 0.4),
      seededRandom(nebulaSeed + "weight3", 0.1, 0.3),
    ],
    NEBULA_DENSITY_BASE_STRENGTH: seededRandom(
      nebulaSeed + "base_strength",
      0.8,
      1.2
    ),
    NEBULA_DENSITY_OUTER_BOOST: seededRandom(
      nebulaSeed + "outer_boost",
      1.0,
      1.3
    ),

    // Secondary nebula variations
    SECONDARY_NEBULA_COUNT: seededRandom(
      nebulaSeed + "secondary_count",
      20000,
      30000,
      true
    ),
    SECONDARY_NEBULA_EXTEND_FACTOR: seededRandom(
      nebulaSeed + "secondary_extend",
      4.5,
      5.1
    ),
    SECONDARY_NEBULA_MAX_OPACITY: seededRandom(
      nebulaSeed + "secondary_max_opacity",
      0.15,
      0.21
    ),
    SECONDARY_NEBULA_MIN_OPACITY: seededRandom(
      nebulaSeed + "secondary_min_opacity",
      0.02,
      0.04
    ),
    SECONDARY_NEBULA_MAX_SIZE: seededRandom(
      nebulaSeed + "secondary_max_size",
      700,
      900,
      true
    ),
    SECONDARY_NEBULA_MIN_SIZE: seededRandom(
      nebulaSeed + "secondary_min_size",
      6,
      10,
      true
    ),
    SECONDARY_NEBULA_PATCHINESS: seededRandom(
      nebulaSeed + "secondary_patchiness",
      0.2,
      0.3
    ),
    SECONDARY_NEBULA_THICKNESS_RATIO: seededRandom(
      nebulaSeed + "secondary_thickness",
      0.03,
      0.05
    ),

    // Colors
    NEBULA_COLORS: primaryColors,
    SECONDARY_NEBULA_COLORS: secondaryColors,

    // Structure
    ARMS: arms,
    SPIRAL: spiral,
    ELLIPTICAL_FACTOR: ellipticalFactor,

    // Core and arm parameters
    CORE_X_DIST: coreDist,
    OUTER_CORE_X_DIST: outerCoreDist,
    ARM_X_DIST: armDist,
    ARM_Y_DIST: armDist,
    ARM_X_MEAN: armMean,
    ARM_Y_MEAN: armMean,

    // Galaxy thickness
    GALAXY_THICKNESS: galaxyThickness,
  };

  console.log("Generated nebula config:", nebulaConfig);

  return nebulaConfig;
}
