import React, { useMemo } from "react";
import { Box, Typography, Paper, Button } from "@mui/material";
import BreadcrumbNav from "./BreadcrumbNav";
import { generatePlanetName } from "../utils/planetStats";
import { KEYS_PER_GALAXY } from "../utils/constants";

export default function SurfaceInfoPanel({
  planetSeed,
  planetType,
  galaxyId,
  starId,
  planetId,
  grainCount,
  hoveredGrain,
  onBack,
}) {
  const planetName = useMemo(
    () => generatePlanetName(planetSeed),
    [planetSeed]
  );

  const keysPerPlanet = KEYS_PER_GALAXY / BigInt(1000) / BigInt(10);
  const keysStr = keysPerPlanet.toString();
  const keysExponent = keysStr.length - 1;

  const breadcrumbItems = [
    { label: "Galaxy", path: `/galaxy/${galaxyId}` },
    { label: "Star", path: `/galaxy/${galaxyId}/star/${starId}` },
    {
      label: planetName,
      path: `/galaxy/${galaxyId}/star/${starId}/planet/${planetId}`,
    },
    { label: "Surface" },
  ];

  return (
    <Paper
      sx={{
        position: "absolute",
        top: 20,
        right: 20,
        padding: 2,
        background: "rgba(42, 27, 80, 0.92)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(77, 244, 255, 0.3)",
        boxShadow: "0 0 15px var(--theme-glow-secondary)",
        animation: "fadeIn 0.3s ease-out",
        maxWidth: 300,
        minWidth: 240,
      }}
    >
      <BreadcrumbNav items={breadcrumbItems} />

      <Typography
        component="h6"
        sx={{
          color: "var(--theme-secondary)",
          fontSize: "0.9rem",
          mb: 1,
        }}
      >
        Surface of {planetName}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography component="span" sx={{ color: "var(--theme-accent)", fontSize: "0.8rem" }}>
            Type:
          </Typography>
          <Typography component="span" sx={{ color: "var(--theme-text)", fontSize: "0.8rem" }}>
            {planetType?.name ?? "Unknown"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography component="span" sx={{ color: "var(--theme-accent)", fontSize: "0.8rem" }}>
            Visible Grains:
          </Typography>
          <Typography component="span" sx={{ color: "var(--theme-text)", fontSize: "0.8rem" }}>
            {grainCount.toLocaleString()}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography component="span" sx={{ color: "var(--theme-accent)", fontSize: "0.8rem" }}>
            Total Grains:
          </Typography>
          <Typography component="span" sx={{ color: "var(--theme-text)", fontSize: "0.8rem" }}>
            ~10^{keysExponent}
          </Typography>
        </Box>

        {hoveredGrain !== null && (
          <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid rgba(77, 244, 255, 0.15)" }}>
            <Typography component="span" sx={{ color: "var(--theme-secondary)", fontSize: "0.75rem" }}>
              Selected Grain: #{hoveredGrain.toLocaleString()}
            </Typography>
          </Box>
        )}
      </Box>

      <Button
        onClick={onBack}
        size="small"
        sx={{
          mt: 1.5,
          color: "var(--theme-secondary)",
          borderColor: "rgba(77, 244, 255, 0.3)",
          fontSize: "0.7rem",
          "&:hover": { borderColor: "var(--theme-secondary)" },
        }}
        variant="outlined"
      >
        Back to Planet
      </Button>
    </Paper>
  );
}
