import { BLOOM_PARAMS } from "./renderConfig";

// Calculate minimum RGB values needed for bloom threshold with safety buffer
const BLOOM_THRESHOLD = BLOOM_PARAMS.bloomThreshold;
const SAFETY_BUFFER = 12.0; // Increased buffer to ensure bloom trigger
const MIN_LUMINANCE = BLOOM_THRESHOLD * 255 * SAFETY_BUFFER; // ~1224 with buffer
const MIN_CHANNEL = 192; // Increased minimum value for any color channel
const MIN_AVERAGE = 224; // Minimum average of all channels

// Function to calculate minimum RGB values needed for a given hue while meeting luminance threshold
function calculateColor(hue) {
  // Convert hue to RGB (0-1 range)
  const h = hue / 360;
  let r, g, b;

  if (h < 1 / 6) {
    r = 1;
    g = h * 6;
    b = 0;
  } else if (h < 2 / 6) {
    r = 2 - h * 6;
    g = 1;
    b = 0;
  } else if (h < 3 / 6) {
    r = 0;
    g = 1;
    b = h * 6 - 2;
  } else if (h < 4 / 6) {
    r = 0;
    g = 4 - h * 6;
    b = 1;
  } else if (h < 5 / 6) {
    r = h * 6 - 4;
    g = 0;
    b = 1;
  } else {
    r = 1;
    g = 0;
    b = 6 - h * 6;
  }

  // Calculate current luminance
  const currentLuminance = (0.299 * r + 0.587 * g + 0.114 * b) * 255;

  // Scale up to meet minimum luminance if needed
  const scale = Math.max(1, MIN_LUMINANCE / currentLuminance);

  // Apply scaling while keeping hue
  r = Math.min(255, Math.round(r * scale * 255));
  g = Math.min(255, Math.round(g * scale * 255));
  b = Math.min(255, Math.round(b * scale * 255));

  // Ensure at least one channel is at maximum
  const maxChannel = Math.max(r, g, b);
  if (maxChannel < 255) {
    const ratio = 255 / maxChannel;
    r = Math.min(255, Math.round(r * ratio));
    g = Math.min(255, Math.round(g * ratio));
    b = Math.min(255, Math.round(b * ratio));
  }

  // Ensure no channel is below minimum
  r = Math.max(MIN_CHANNEL, r);
  g = Math.max(MIN_CHANNEL, g);
  b = Math.max(MIN_CHANNEL, b);

  // Ensure average is above minimum
  const average = (r + g + b) / 3;
  if (average < MIN_AVERAGE) {
    const ratio = MIN_AVERAGE / average;
    r = Math.min(255, Math.round(r * ratio));
    g = Math.min(255, Math.round(g * ratio));
    b = Math.min(255, Math.round(b * ratio));
  }

  return (r << 16) | (g << 8) | b;
}

// Base colors that meet the minimum luminance threshold
const BASE_COLORS = {
  white: 0xffffff, // Pure white
  blue: calculateColor(240), // Blue
  cyan: calculateColor(180), // Cyan
  green: calculateColor(120), // Green
  yellow: calculateColor(60), // Yellow
  orange: calculateColor(30), // Orange
  red: calculateColor(0), // Red
  magenta: calculateColor(300), // Magenta
};

export const starTypes = {
  percentage: [40.0, 20.0, 15.0, 10.0, 5.0, 5.0, 3.0, 2.0], // Adjusted for new color set
  color: [
    BASE_COLORS.white, // Pure white (young, hot stars)
    BASE_COLORS.blue, // Blue-white (very hot stars)
    BASE_COLORS.cyan, // Cyan-white (hot stars)
    BASE_COLORS.green, // Green-white (young stars)
    BASE_COLORS.yellow, // Yellow-white (medium temperature)
    BASE_COLORS.orange, // Orange-white (cooler stars)
    BASE_COLORS.red, // Red-white (red giants)
    BASE_COLORS.magenta, // Magenta-white (hot, young stars)
  ],
  size: [5.0, 7.0, 8.0, 7.0, 10.0, 12.0, 15.0, 9.0],
  temperature: [30000, 25000, 20000, 15000, 10000, 7500, 5000, 3500], // Temperature in Kelvin
  mass: [50, 25, 15, 10, 5, 3, 2, 1], // Mass in solar masses
  luminosity: [100000, 50000, 25000, 10000, 5000, 2500, 1000, 500], // Luminosity in solar luminosities
};
