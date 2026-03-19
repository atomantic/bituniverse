import React from "react";
import { Box, Typography } from "@mui/material";
import { starTypes } from "../config/starDistributions";
import HudWidget, { InfoRow } from "./HudWidget";

export default function StarInfoWidget({ selectedStar }) {
  if (!selectedStar || !starTypes) return null;

  const starTypeIndex = selectedStar.type;
  if (
    typeof starTypeIndex !== "number" ||
    starTypeIndex < 0 ||
    starTypeIndex >= starTypes.color.length
  ) {
    return null;
  }

  const color = `#${starTypes.color[starTypeIndex]
    .toString(16)
    .padStart(6, "0")}`;

  return (
    <HudWidget>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
            flexShrink: 0,
          }}
        />
        <Typography
          sx={{ color: "var(--theme-secondary)", fontSize: "0.8rem", fontWeight: 600 }}
        >
          Star Type {starTypeIndex}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
        <InfoRow label="Temperature" value={`${starTypes.temperature[starTypeIndex]}K`} />
        <InfoRow label="Mass" value={`${starTypes.mass[starTypeIndex]} M☉`} />
        <InfoRow label="Luminosity" value={`${starTypes.luminosity[starTypeIndex]} L☉`} />
      </Box>
    </HudWidget>
  );
}
