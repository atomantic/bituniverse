import React from "react";
import { Box, Typography } from "@mui/material";
import { STAR_TYPES, KEYS_PER_GALAXY, TOTAL_KEYS } from "../utils/constants";
import { generateGalaxyName } from "../utils/galaxyNames";
import HudWidget, { InfoRow, SectionLabel } from "./HudWidget";

export function GalaxyLocationWidget({ selectedBody }) {
  if (!selectedBody || selectedBody.type !== "galaxy") return null;

  const galaxyIndex = parseInt(selectedBody.key, 10);
  const starType = STAR_TYPES[selectedBody.class || "G"];
  const totalGalaxies = Number(TOTAL_KEYS / KEYS_PER_GALAXY);
  const galaxyName = generateGalaxyName(galaxyIndex);

  return (
    <HudWidget>
      <Typography
        sx={{ color: "var(--theme-secondary)", fontSize: "0.85rem", fontWeight: 600, lineHeight: 1.2 }}
      >
        {galaxyName}
      </Typography>
      <Typography
        sx={{ color: "var(--theme-accent)", fontSize: "0.55rem", mb: 0.75, opacity: 0.6 }}
      >
        Galaxy {galaxyIndex.toLocaleString()} of {totalGalaxies.toLocaleString()}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: starType.color,
            boxShadow: `0 0 6px ${starType.color}`,
            flexShrink: 0,
          }}
        />
        <Typography sx={{ color: "var(--theme-text)", fontSize: "0.65rem" }}>
          {selectedBody.class || "G"} Type Cluster
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
        <InfoRow label="Stars" value="100B" />
        <InfoRow label="Planets" value="1T" />
      </Box>
    </HudWidget>
  );
}

export function GalaxyKeyspaceWidget({ selectedBody }) {
  if (!selectedBody || selectedBody.type !== "galaxy") return null;

  const galaxyIndex = parseInt(selectedBody.key, 10);
  const startKey = BigInt(galaxyIndex) * KEYS_PER_GALAXY;
  const endKey = startKey + KEYS_PER_GALAXY;
  const startKeyHex = startKey.toString(16).padStart(64, "0").toUpperCase();
  const endKeyHex = endKey.toString(16).padStart(64, "0").toUpperCase();
  const keyspacePosition =
    Number(startKey.toString()) / Number(TOTAL_KEYS.toString());

  const keysStr = KEYS_PER_GALAXY.toString();
  const keysExponent = keysStr.length - 1;

  return (
    <HudWidget title="Keyspace">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
        <InfoRow label="Position" value={`${(keyspacePosition * 100).toFixed(10)}%`} />
        <InfoRow label="Unique Keys" value={`~10^${keysExponent}`} />
      </Box>
      <SectionLabel>Hex Range</SectionLabel>
      <Typography
        sx={{
          color: "var(--theme-text)",
          fontSize: "0.5rem",
          fontFamily: '"Roboto Mono", monospace',
          wordBreak: "break-all",
          opacity: 0.6,
          lineHeight: 1.4,
        }}
      >
        {startKeyHex.slice(0, 20)}...
      </Typography>
      <Typography sx={{ color: "var(--theme-accent)", fontSize: "0.45rem", opacity: 0.4 }}>
        to
      </Typography>
      <Typography
        sx={{
          color: "var(--theme-text)",
          fontSize: "0.5rem",
          fontFamily: '"Roboto Mono", monospace',
          wordBreak: "break-all",
          opacity: 0.6,
          lineHeight: 1.4,
        }}
      >
        {endKeyHex.slice(0, 20)}...
      </Typography>
    </HudWidget>
  );
}

export default GalaxyLocationWidget;
