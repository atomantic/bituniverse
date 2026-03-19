import { hashString } from "../config/planetTypes";

const ATMOSPHERE_GASES = [
  "Nitrogen", "Oxygen", "Carbon Dioxide", "Methane", "Argon",
  "Hydrogen", "Helium", "Ammonia", "Sulfur Dioxide", "Water Vapor",
  "Neon", "Xenon", "Krypton",
];

const SYLLABLES = [
  "ko", "ri", "na", "th", "el", "ar", "im", "os", "en", "ul",
  "va", "si", "ta", "mu", "de", "lo", "ra", "ne", "pu", "ke",
  "xi", "zo", "fa", "hy", "we", "bu", "gi", "do", "je", "li",
  "mo", "nu", "pa", "qu", "ru", "se", "ti", "vo", "ya", "ze",
];

const SUFFIXES = [
  "Prime", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "Alpha", "Beta", "Gamma", "Delta",
];

export function generatePlanetName(seed) {
  const hash = hashString(seed);
  const syllableCount = 2 + (hash % 3); // 2-4 syllables
  let name = "";
  for (let i = 0; i < syllableCount; i++) {
    const idx = (hash >> (i * 5)) % SYLLABLES.length;
    const syllable = SYLLABLES[idx < 0 ? -idx : idx];
    name += i === 0 ? syllable.charAt(0).toUpperCase() + syllable.slice(1) : syllable;
  }

  // Sometimes add a suffix
  if ((hash >> 16) % 3 === 0) {
    const suffixIdx = (hash >> 20) % SUFFIXES.length;
    name += "-" + SUFFIXES[suffixIdx < 0 ? -suffixIdx : suffixIdx];
  }

  return name;
}

export function generatePlanetStats(seed, planetType) {
  const hash = hashString(seed);
  const hash2 = hashString(seed + "stats");
  const hash3 = hashString(seed + "atmo");

  // Gravity (0.1g to 3.5g, scaled by planet size range)
  const [minSize, maxSize] = planetType.sizeRange;
  const avgSize = (minSize + maxSize) / 2;
  const gravity = (0.3 + (avgSize / 12) * 3.2 + ((hash % 100) / 100) * 0.5).toFixed(2);

  // Surface temperature (50K to 2000K based on type)
  const tempRanges = {
    0: [120, 350],    // Gas Giant
    1: [50, 120],     // Ice Giant
    2: [200, 600],    // Rocky
    3: [350, 700],    // Desert
    4: [50, 180],     // Ice
    5: [250, 350],    // Ocean
    6: [270, 310],    // Paradise
    7: [80, 400],     // Dwarf
    8: [300, 600],    // Toxic
    9: [800, 2000],   // Lava
  };
  const [minTemp, maxTemp] = tempRanges[planetType.id] ?? [200, 500];
  const temperature = Math.round(minTemp + ((hash2 % 1000) / 1000) * (maxTemp - minTemp));

  // Orbital period (10 to 10000 days)
  const orbitalPeriod = Math.round(10 + ((hash >> 8) % 10000));

  // Rotation period (5 to 500 hours)
  const rotationPeriod = (5 + ((hash2 >> 8) % 495)).toFixed(1);

  // Atmosphere composition (2-4 gases)
  const gasCount = 2 + (hash3 % 3);
  const gases = [];
  const usedIndices = new Set();
  for (let i = 0; i < gasCount; i++) {
    let idx = ((hash3 >> (i * 4)) % ATMOSPHERE_GASES.length);
    if (idx < 0) idx = -idx;
    while (usedIndices.has(idx)) {
      idx = (idx + 1) % ATMOSPHERE_GASES.length;
    }
    usedIndices.add(idx);
    const percentage = i === 0
      ? 40 + ((hash3 >> (i * 3)) % 40)
      : Math.max(1, Math.round((100 - 60) / (gasCount - 1) + ((hash3 >> (i * 7)) % 10)));
    gases.push({ name: ATMOSPHERE_GASES[idx], percentage });
  }

  // Normalize percentages
  const totalPct = gases.reduce((sum, g) => sum + g.percentage, 0);
  gases.forEach((g) => {
    g.percentage = Math.round((g.percentage / totalPct) * 100);
  });

  return {
    gravity: `${gravity}g`,
    surfaceTemp: `${temperature}K`,
    orbitalPeriod: `${orbitalPeriod} days`,
    rotationPeriod: `${rotationPeriod} hours`,
    atmosphere: planetType.hasAtmosphere ? gases : null,
  };
}
