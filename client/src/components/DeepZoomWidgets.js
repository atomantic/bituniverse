import React from "react";
import { Box, Typography } from "@mui/material";
import HudWidget, { InfoRow } from "./HudWidget";
import {
  KEYS_PER_REGION,
  KEYS_PER_SECTOR,
  KEYS_PER_AREA,
  KEYS_PER_GROUND,
  KEYS_PER_GRAIN,
  KEYS_PER_MOLECULE,
  KEYS_PER_ATOM,
  KEYS_PER_QUARK,
  KEYS_PER_STRING,
  REGIONS_PER_PLANET,
  SECTORS_PER_REGION,
  AREAS_PER_SECTOR,
  GROUNDS_PER_AREA,
  GRAINS_PER_GROUND,
  MOLECULES_PER_GRAIN,
  ATOMS_PER_MOLECULE,
  QUARKS_PER_ATOM,
  STRINGS_PER_QUARK,
  VISIBLE_REGIONS,
  VISIBLE_SECTORS,
  VISIBLE_AREAS,
  VISIBLE_GROUNDS,
  VISIBLE_GRAINS,
  VISIBLE_MOLECULES,
  VISIBLE_ATOMS,
  VISIBLE_QUARKS,
  VISIBLE_STRINGS,
  formatKeysCount,
} from "../utils/keyspaceHierarchy";

function DeepWidget({ title, subtitle, visibleLabel, visibleCount, totalLabel, totalCount, keysPerUnit, hoveredChild, hoveredLabel }) {
  return (
    <HudWidget>
      <Typography sx={{ color: "var(--theme-secondary)", fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.2 }}>
        {title}
      </Typography>
      <Typography sx={{ color: "var(--theme-accent)", fontSize: "0.55rem", mb: 0.5, opacity: 0.7 }}>
        {subtitle}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
        <InfoRow label={visibleLabel} value={visibleCount.toLocaleString()} />
        <InfoRow label={totalLabel} value={formatKeysCount(totalCount)} />
        <InfoRow label="Keys" value={formatKeysCount(keysPerUnit)} />
      </Box>
      {hoveredChild !== null && hoveredChild !== undefined && (
        <Box sx={{ mt: 0.5, pt: 0.5, borderTop: "1px solid rgba(77, 244, 255, 0.1)" }}>
          <Typography sx={{ color: "var(--theme-secondary)", fontSize: "0.6rem" }}>
            {hoveredLabel} #{hoveredChild.toLocaleString()}
          </Typography>
        </Box>
      )}
    </HudWidget>
  );
}

export function MapWidget({ regionId, hoveredChild }) {
  return (
    <DeepWidget
      title={`Region #${parseInt(regionId).toLocaleString()}`}
      subtitle="Planetary Map"
      visibleLabel="Visible Sectors"
      visibleCount={VISIBLE_SECTORS}
      totalLabel="Total Sectors"
      totalCount={SECTORS_PER_REGION}
      keysPerUnit={KEYS_PER_SECTOR}
      hoveredChild={hoveredChild}
      hoveredLabel="Sector"
    />
  );
}

export function SectorWidget({ sectorId, hoveredChild }) {
  return (
    <DeepWidget
      title={`Sector #${parseInt(sectorId).toLocaleString()}`}
      subtitle="Terrain Overview"
      visibleLabel="Visible Areas"
      visibleCount={VISIBLE_AREAS}
      totalLabel="Total Areas"
      totalCount={AREAS_PER_SECTOR}
      keysPerUnit={KEYS_PER_AREA}
      hoveredChild={hoveredChild}
      hoveredLabel="Area"
    />
  );
}

export function RegionWidget({ areaId, hoveredChild }) {
  return (
    <DeepWidget
      title={`Area #${parseInt(areaId).toLocaleString()}`}
      subtitle="Regional Terrain"
      visibleLabel="Visible Grounds"
      visibleCount={VISIBLE_GROUNDS}
      totalLabel="Total Grounds"
      totalCount={GROUNDS_PER_AREA}
      keysPerUnit={KEYS_PER_GROUND}
      hoveredChild={hoveredChild}
      hoveredLabel="Ground"
    />
  );
}

export function AreaWidget({ groundId, hoveredChild }) {
  return (
    <DeepWidget
      title={`Ground #${parseInt(groundId).toLocaleString()}`}
      subtitle="Ground Level"
      visibleLabel="Visible Grains"
      visibleCount={VISIBLE_GRAINS}
      totalLabel="Total Grains"
      totalCount={GRAINS_PER_GROUND}
      keysPerUnit={KEYS_PER_GRAIN}
      hoveredChild={hoveredChild}
      hoveredLabel="Grain"
    />
  );
}

export function GroundWidget({ grainId, hoveredChild }) {
  return (
    <DeepWidget
      title={`Grain #${parseInt(grainId).toLocaleString()}`}
      subtitle="Surface Grains"
      visibleLabel="Visible Molecules"
      visibleCount={VISIBLE_MOLECULES}
      totalLabel="Total Molecules"
      totalCount={MOLECULES_PER_GRAIN}
      keysPerUnit={KEYS_PER_MOLECULE}
      hoveredChild={hoveredChild}
      hoveredLabel="Molecule"
    />
  );
}

export function GrainWidget({ moleculeId, hoveredChild }) {
  return (
    <DeepWidget
      title={`Molecule #${parseInt(moleculeId).toLocaleString()}`}
      subtitle="Crystal Lattice"
      visibleLabel="Visible Atoms"
      visibleCount={VISIBLE_ATOMS}
      totalLabel="Total Atoms"
      totalCount={ATOMS_PER_MOLECULE}
      keysPerUnit={KEYS_PER_ATOM}
      hoveredChild={hoveredChild}
      hoveredLabel="Atom"
    />
  );
}

export function MoleculeWidget({ atomId, hoveredChild }) {
  return (
    <DeepWidget
      title={`Atom #${parseInt(atomId).toLocaleString()}`}
      subtitle="Molecular Structure"
      visibleLabel="Visible Quarks"
      visibleCount={VISIBLE_QUARKS}
      totalLabel="Total Quarks"
      totalCount={QUARKS_PER_ATOM}
      keysPerUnit={KEYS_PER_QUARK}
      hoveredChild={hoveredChild}
      hoveredLabel="Quark"
    />
  );
}

export function AtomWidget({ quarkId, hoveredChild }) {
  return (
    <DeepWidget
      title={`Quark #${parseInt(quarkId).toLocaleString()}`}
      subtitle="Subatomic Structure"
      visibleLabel="Visible Strings"
      visibleCount={VISIBLE_STRINGS}
      totalLabel="Total Strings"
      totalCount={STRINGS_PER_QUARK}
      keysPerUnit={KEYS_PER_STRING}
      hoveredChild={hoveredChild}
      hoveredLabel="String"
    />
  );
}

export function QuarkWidget({ stringId, hexKey }) {
  return (
    <HudWidget>
      <Typography sx={{ color: "var(--theme-secondary)", fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.2 }}>
        String #{parseInt(stringId).toLocaleString()}
      </Typography>
      <Typography sx={{ color: "var(--theme-accent)", fontSize: "0.55rem", mb: 0.5, opacity: 0.7 }}>
        Gluon Field
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
        <InfoRow label="Visible Strings" value={VISIBLE_STRINGS.toLocaleString()} />
        <InfoRow label="Total Keys" value={formatKeysCount(STRINGS_PER_QUARK)} />
      </Box>
      {hexKey && (
        <Box sx={{ mt: 0.5, pt: 0.5, borderTop: "1px solid rgba(77, 244, 255, 0.1)" }}>
          <Typography sx={{ color: "var(--theme-secondary)", fontSize: "0.55rem", mb: 0.25 }}>SHA-256 Key</Typography>
          <Typography sx={{ color: "var(--theme-text)", fontSize: "0.4rem", fontFamily: '"Roboto Mono", monospace', wordBreak: "break-all", opacity: 0.8, lineHeight: 1.4 }}>
            {hexKey}
          </Typography>
        </Box>
      )}
    </HudWidget>
  );
}
