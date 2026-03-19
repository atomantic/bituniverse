import { hashString } from "../config/planetTypes";

const PREFIXES = [
  "An", "Bel", "Cor", "Dra", "El", "For", "Gal", "Hel", "Ir", "Jas",
  "Kel", "Lor", "Mir", "Nex", "Or", "Pax", "Qua", "Ren", "Sol", "Tor",
  "Ul", "Vex", "Wyn", "Xar", "Yth", "Zan",
];

const MIDDLES = [
  "ari", "eno", "ith", "ova", "ura", "emi", "oxi", "anu", "elu", "iro",
  "abi", "eto", "inu", "obe", "ulu",
];

const SUFFIXES = [
  "us", "ax", "on", "is", "ar", "el", "um", "ix", "or", "as",
  "ia", "ea", "os", "an", "en",
];

export function generateGalaxyName(galaxyIndex) {
  const seed = `galaxy_${galaxyIndex}`;
  const hash = hashString(seed);
  const hash2 = hashString(seed + "_name");

  const prefix = PREFIXES[Math.abs(hash) % PREFIXES.length];
  const middle = MIDDLES[Math.abs(hash2) % MIDDLES.length];
  const suffix = SUFFIXES[Math.abs(hash >> 8) % SUFFIXES.length];

  return prefix + middle + suffix;
}
