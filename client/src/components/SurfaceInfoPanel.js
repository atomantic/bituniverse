import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { generatePlanetName } from "../utils/planetStats";
import { KEYS_PER_GALAXY } from "../utils/constants";
import HudWidget, { InfoRow } from "./HudWidget";

export function SurfaceWidget({ planetSeed, planetType, grainCount, hoveredGrain }) {
  const planetName = useMemo(() => generatePlanetName(planetSeed), [planetSeed]);
  const keysPerPlanet = KEYS_PER_GALAXY / BigInt(1000) / BigInt(10);
  const keysExponent = keysPerPlanet.toString().length - 1;

  return (
    <HudWidget>
      <Typography
        sx={{ color: "var(--theme-secondary)", fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.2 }}
      >
        Surface of {planetName}
      </Typography>
      <Typography sx={{ color: "var(--theme-accent)", fontSize: "0.55rem", mb: 0.5, opacity: 0.7 }}>
        {planetType?.name ?? "Unknown"}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
        <InfoRow label="Visible Grains" value={grainCount.toLocaleString()} />
        <InfoRow label="Total Grains" value={`~10^${keysExponent}`} />
      </Box>
      {hoveredGrain !== null && (
        <Box sx={{ mt: 0.5, pt: 0.5, borderTop: "1px solid rgba(77, 244, 255, 0.1)" }}>
          <Typography sx={{ color: "var(--theme-secondary)", fontSize: "0.6rem" }}>
            Grain #{hoveredGrain.toLocaleString()}
          </Typography>
        </Box>
      )}
    </HudWidget>
  );
}

export default SurfaceWidget;
