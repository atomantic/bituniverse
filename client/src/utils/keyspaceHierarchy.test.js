import {
  KEYS_PER_STAR,
  KEYS_PER_STRING,
  computeHexKey,
  formatKeysCount,
  keyToLocation,
} from "./keyspaceHierarchy";
import { KEYS_PER_GALAXY } from "./constants";

const F64 = "F".repeat(64);

describe("keyspaceHierarchy", () => {
  describe("round-trip: keyToLocation(computeHexKey(...))", () => {
    it("survives a galaxy-only location", () => {
      const key = computeHexKey(5);
      const loc = keyToLocation(key);
      expect(loc.galaxyId).toBe(5);
      expect(loc.starId).toBe(0);
      expect(loc.quarkId).toBe(0);
    });

    it("survives a full path down to quarkId", () => {
      const ids = {
        galaxyId: 3,
        starId: 42,
        planetId: 7,
        regionId: 123,
        sectorId: 4,
        areaId: 56,
        groundId: 78,
        grainId: 910,
        moleculeId: 11,
        atomId: 12,
        quarkId: 13,
      };
      const key = computeHexKey(
        ids.galaxyId, ids.starId, ids.planetId, ids.regionId,
        ids.sectorId, ids.areaId, ids.groundId, ids.grainId,
        ids.moleculeId, ids.atomId, ids.quarkId
      );
      // Independent vector: hand-computed from the hierarchy constants
      // (3 galaxies + 42 stars + 7 planets + deep-zoom offsets), so an
      // encoder bug cannot hide behind a matching decoder bug.
      expect(key).toBe(
        "00000000035871A4373C69343490CBB15B9D1A1AA055313507D11F6A6F086F01"
      );
      const loc = keyToLocation(key);
      for (const [param, value] of Object.entries(ids)) {
        expect(loc[param]).toBe(value);
      }
      expect(loc.stringId).toBe(0);
    });

    it("survives a nonzero offset and lands on the right string", () => {
      const OFFSET = 42;
      const key = computeHexKey(0, 0, 0, null, null, null, null, null, null, null, null, OFFSET);
      const loc = keyToLocation(key);
      expect(loc.quarkId).toBe(0);
      expect(loc.stringId).toBe(OFFSET);
    });
  });

  describe("boundary keys", () => {
    it("maps all-zero key to all-zero IDs", () => {
      const loc = keyToLocation("0".repeat(64));
      for (const field of [
        "galaxyId", "starId", "planetId", "regionId", "sectorId",
        "areaId", "groundId", "grainId", "moleculeId", "atomId", "quarkId",
        "stringId",
      ]) {
        expect(loc[field]).toBe(0);
      }
    });

    it("maps max key to max IDs without overflow", () => {
      const loc = keyToLocation(F64);
      // galaxyId = floor((2^256 - 1) / KEYS_PER_GALAXY); since KEYS_PER_GALAXY
      // floors 2^256/10^12, the remainder leaves one extra partial galaxy.
      expect(loc.galaxyId).toBe(10 ** 12);
      // Exact decode of the trailing partial-galaxy remainder (computed from
      // the current constants; guards against silent decoding regressions).
      expect(loc.quarkId).toBe(7885947);
      expect(loc.stringId).toBe(64911);
      for (const field of [
        "starId", "planetId", "regionId", "sectorId", "areaId",
        "groundId", "grainId", "moleculeId", "atomId", "quarkId", "stringId",
      ]) {
        expect(Number.isFinite(loc[field])).toBe(true);
        expect(loc[field]).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("invalid input", () => {
    it.each(["xyz", "", "a".repeat(65)])(
      "returns null for %j",
      (input) => {
        expect(keyToLocation(input)).toBeNull();
      }
    );
  });

  describe("formatting and derived constants", () => {
    it("derives keys-per-star from keys-per-galaxy", () => {
      expect(KEYS_PER_STAR).toBe(KEYS_PER_GALAXY / 1000n);
    });

    it("formats counts as order-of-magnitude prefixes", () => {
      // Current behavior: KEYS_PER_STRING floors to a single key (~10^0),
      // while the galaxy bucket spans ~10^65 keys.
      expect(formatKeysCount(KEYS_PER_STRING)).toBe("~10^0");
      expect(formatKeysCount(KEYS_PER_GALAXY)).toBe("~10^65");
    });
  });
});
