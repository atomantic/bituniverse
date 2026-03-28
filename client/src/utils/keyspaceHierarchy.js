import { KEYS_PER_GALAXY } from "./constants";

// Subdivision factors at each level
export const STARS_PER_GALAXY = BigInt(1000);
export const PLANETS_PER_STAR = BigInt(10);

// 9-level deep zoom below planet: 10^7 × 8 + 10^5 = 10^61
export const REGIONS_PER_PLANET = BigInt(10000000);      // 10^7
export const SECTORS_PER_REGION = BigInt(10000000);      // 10^7
export const AREAS_PER_SECTOR = BigInt(10000000);        // 10^7
export const GROUNDS_PER_AREA = BigInt(10000000);        // 10^7
export const GRAINS_PER_GROUND = BigInt(10000000);       // 10^7
export const MOLECULES_PER_GRAIN = BigInt(10000000);     // 10^7
export const ATOMS_PER_MOLECULE = BigInt(10000000);      // 10^7
export const QUARKS_PER_ATOM = BigInt(10000000);         // 10^7
export const STRINGS_PER_QUARK = BigInt(100000);         // 10^5

// Derived keys-per-unit
export const KEYS_PER_STAR = KEYS_PER_GALAXY / STARS_PER_GALAXY;
export const KEYS_PER_PLANET = KEYS_PER_STAR / PLANETS_PER_STAR;
export const KEYS_PER_REGION = KEYS_PER_PLANET / REGIONS_PER_PLANET;
export const KEYS_PER_SECTOR = KEYS_PER_REGION / SECTORS_PER_REGION;
export const KEYS_PER_AREA = KEYS_PER_SECTOR / AREAS_PER_SECTOR;
export const KEYS_PER_GROUND = KEYS_PER_AREA / GROUNDS_PER_AREA;
export const KEYS_PER_GRAIN = KEYS_PER_GROUND / GRAINS_PER_GROUND;
export const KEYS_PER_MOLECULE = KEYS_PER_GRAIN / MOLECULES_PER_GRAIN;
export const KEYS_PER_ATOM = KEYS_PER_MOLECULE / ATOMS_PER_MOLECULE;
export const KEYS_PER_QUARK = KEYS_PER_ATOM / QUARKS_PER_ATOM;
export const KEYS_PER_STRING = KEYS_PER_QUARK / STRINGS_PER_QUARK;

// Visible items at each deep zoom level
export const VISIBLE_REGIONS = 49;       // 7x7 lat/lon zones on planet
export const VISIBLE_SECTORS = 400;      // 20x20 grid
export const VISIBLE_AREAS = 400;        // 20x20 grid
export const VISIBLE_GROUNDS = 400;      // 20x20 grid
export const VISIBLE_GRAINS = 2000;      // instanced spheres
export const VISIBLE_MOLECULES = 729;    // 9^3 crystal lattice
export const VISIBLE_ATOMS = 500;        // molecular bond structure
export const VISIBLE_QUARKS = 500;       // Bohr model quarks
export const VISIBLE_STRINGS = 500;      // gluon strings = SHA-256 keys

// Deep zoom level definitions (data-driven)
// Each level: what child items it contains, and what param navigates into
export const DEEP_ZOOM_LEVELS = [
  { id: "map",      label: "Map",      param: "regionId",   visible: VISIBLE_REGIONS,   total: REGIONS_PER_PLANET,  keysPerUnit: KEYS_PER_REGION },
  { id: "sector",   label: "Sector",   param: "sectorId",   visible: VISIBLE_SECTORS,   total: SECTORS_PER_REGION,  keysPerUnit: KEYS_PER_SECTOR },
  { id: "region",   label: "Area",     param: "areaId",     visible: VISIBLE_AREAS,     total: AREAS_PER_SECTOR,    keysPerUnit: KEYS_PER_AREA },
  { id: "area",     label: "Ground",   param: "groundId",   visible: VISIBLE_GROUNDS,   total: GROUNDS_PER_AREA,    keysPerUnit: KEYS_PER_GROUND },
  { id: "ground",   label: "Grain",    param: "grainId",    visible: VISIBLE_GRAINS,    total: GRAINS_PER_GROUND,   keysPerUnit: KEYS_PER_GRAIN },
  { id: "grain",    label: "Molecule", param: "moleculeId", visible: VISIBLE_MOLECULES, total: MOLECULES_PER_GRAIN, keysPerUnit: KEYS_PER_MOLECULE },
  { id: "molecule", label: "Atom",     param: "atomId",     visible: VISIBLE_ATOMS,     total: ATOMS_PER_MOLECULE,  keysPerUnit: KEYS_PER_ATOM },
  { id: "atom",     label: "Quark",    param: "quarkId",    visible: VISIBLE_QUARKS,    total: QUARKS_PER_ATOM,     keysPerUnit: KEYS_PER_QUARK },
  { id: "quark",    label: "String",   param: null,         visible: VISIBLE_STRINGS,   total: STRINGS_PER_QUARK,   keysPerUnit: KEYS_PER_STRING },
];

export function computeKeyStart(galaxyId, starId, planetId, regionId, sectorId, areaId, groundId, grainId, moleculeId, atomId, quarkId) {
  let start = BigInt(galaxyId ?? 0) * KEYS_PER_GALAXY;
  start += BigInt(starId ?? 0) * KEYS_PER_STAR;
  start += BigInt(planetId ?? 0) * KEYS_PER_PLANET;
  if (regionId != null) start += BigInt(regionId) * KEYS_PER_REGION;
  if (sectorId != null) start += BigInt(sectorId) * KEYS_PER_SECTOR;
  if (areaId != null) start += BigInt(areaId) * KEYS_PER_AREA;
  if (groundId != null) start += BigInt(groundId) * KEYS_PER_GROUND;
  if (grainId != null) start += BigInt(grainId) * KEYS_PER_GRAIN;
  if (moleculeId != null) start += BigInt(moleculeId) * KEYS_PER_MOLECULE;
  if (atomId != null) start += BigInt(atomId) * KEYS_PER_ATOM;
  if (quarkId != null) start += BigInt(quarkId) * KEYS_PER_QUARK;
  return start;
}

export function computeHexKey(galaxyId, starId, planetId, regionId, sectorId, areaId, groundId, grainId, moleculeId, atomId, quarkId, offset = 0) {
  const start = computeKeyStart(galaxyId, starId, planetId, regionId, sectorId, areaId, groundId, grainId, moleculeId, atomId, quarkId);
  const key = start + BigInt(offset);
  return key.toString(16).padStart(64, "0").toUpperCase();
}

export function formatKeysCount(keysPerUnit) {
  const str = keysPerUnit.toString();
  return `~10^${str.length - 1}`;
}

// Reverse-map a 256-bit hex key to its full hierarchy location
export function keyToLocation(hexKey) {
  const cleaned = hexKey.replace(/^0x/i, "").replace(/\s/g, "");
  if (!/^[0-9a-fA-F]{1,64}$/.test(cleaned)) return null;
  let remaining = BigInt("0x" + cleaned.padStart(64, "0"));

  const galaxyId = remaining / KEYS_PER_GALAXY;
  remaining = remaining % KEYS_PER_GALAXY;
  const starId = remaining / KEYS_PER_STAR;
  remaining = remaining % KEYS_PER_STAR;
  const planetId = remaining / KEYS_PER_PLANET;
  remaining = remaining % KEYS_PER_PLANET;
  const regionId = remaining / KEYS_PER_REGION;
  remaining = remaining % KEYS_PER_REGION;
  const sectorId = remaining / KEYS_PER_SECTOR;
  remaining = remaining % KEYS_PER_SECTOR;
  const areaId = remaining / KEYS_PER_AREA;
  remaining = remaining % KEYS_PER_AREA;
  const groundId = remaining / KEYS_PER_GROUND;
  remaining = remaining % KEYS_PER_GROUND;
  const grainId = remaining / KEYS_PER_GRAIN;
  remaining = remaining % KEYS_PER_GRAIN;
  const moleculeId = remaining / KEYS_PER_MOLECULE;
  remaining = remaining % KEYS_PER_MOLECULE;
  const atomId = remaining / KEYS_PER_ATOM;
  remaining = remaining % KEYS_PER_ATOM;
  const quarkId = remaining / KEYS_PER_QUARK;
  remaining = remaining % KEYS_PER_QUARK;
  const stringId = remaining / KEYS_PER_STRING;

  return {
    galaxyId: Number(galaxyId),
    starId: Number(starId),
    planetId: Number(planetId),
    regionId: Number(regionId),
    sectorId: Number(sectorId),
    areaId: Number(areaId),
    groundId: Number(groundId),
    grainId: Number(grainId),
    moleculeId: Number(moleculeId),
    atomId: Number(atomId),
    quarkId: Number(quarkId),
    stringId: Number(stringId),
    path: `/galaxy/${galaxyId}/star/${starId}/planet/${planetId}/region/${regionId}/sector/${sectorId}/area/${areaId}/ground/${groundId}/grain/${grainId}/molecule/${moleculeId}/atom/${atomId}/quark/${quarkId}/string/${stringId}`,
  };
}
