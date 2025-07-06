import * as THREE from "three";
import { STAR_TYPES } from "./constants";

export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
}

export function hslToRgb(h, s, l) {
  h /= 360;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
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
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [r, g, b];
}

export function cubicBezier(p0, p1, p2, t) {
  const oneMinusT = 1 - t;
  const oneMinusTSquared = oneMinusT * oneMinusT;
  const tSquared = t * t;

  return new THREE.Vector3(
    oneMinusTSquared * p0.x + 2 * oneMinusT * t * p1.x + tSquared * p2.x,
    oneMinusTSquared * p0.y + 2 * oneMinusT * t * p1.y + tSquared * p2.y,
    oneMinusTSquared * p0.z + 2 * oneMinusT * t * p1.z + tSquared * p2.z
  );
}

export function generateKeyPair(keyValue) {
  try {
    const privateKey = keyValue.toString(16).padStart(64, "0");
    const publicKey = "placeholder_public_key";
    const address = "bc1...";
    return {
      privateKey,
      publicKey,
      address,
      keyValue: keyValue.toString(),
    };
  } catch (error) {
    console.error("Error generating key pair:", error);
    return null;
  }
}

export function getGalaxyPosition(index, previousPosition = [0, 0, 0]) {
  const galaxyString = `galaxy_${index}`;
  const hash = hashString(galaxyString);
  if (index === 0) return [0, 0, 0];

  // Use hash for vertical and depth variation only
  const heightHash = (hash >> 8) & 0xff;
  const depthHash = (hash >> 16) & 0xff;

  // Calculate base position with emphasis on rightward progression
  const baseX = 30 + index * 20; // Linear progression to the right
  const baseY = (heightHash / 255) * 20 - 10; // Slight vertical variation
  const baseZ = (depthHash / 255) * 40 - 20; // Moderate depth variation

  // Add subtle variations to make it less rigid
  const xVariation = Math.sin(index * 0.5) * 5;
  const yVariation = Math.cos(index * 0.3) * 3;
  const zVariation = Math.sin(index * 0.4) * 5;

  return [baseX + xVariation, baseY + yVariation, baseZ + zVariation];
}

export function getGalaxyProperties(index) {
  const galaxyString = `galaxy_${index}`;
  const hash = hashString(galaxyString);
  const typeHash = hash & 0xff;
  const colorHash = (hash >> 8) & 0xff;
  let type = "G";
  let sum = 0;
  const typeValue = typeHash / 255;
  for (const [starType, props] of Object.entries(STAR_TYPES)) {
    sum += props.rarity;
    if (typeValue <= sum) {
      type = starType;
      break;
    }
  }
  const baseColor = STAR_TYPES[type].color;
  const hue = (colorHash / 255) * 30 - 15;
  const saturation = 0.8 + (colorHash % 20) / 100;
  const brightness = 0.8 + (colorHash % 20) / 100;
  const rgb = hslToRgb(hue, saturation, brightness);
  const color = `#${rgb
    .map((x) =>
      Math.round(x * 255)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
  return {
    type,
    color,
    size: STAR_TYPES[type].size,
    rarity: STAR_TYPES[type].rarity,
  };
}
