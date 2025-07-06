import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { useParams } from "react-router-dom";
import BreadcrumbNav from "./BreadcrumbNav";

export default function PlanetInfoPanel({ selectedPlanet }) {
  const { galaxyId, starId } = useParams();

  if (!selectedPlanet) return null;

  const breadcrumbItems = [
    { label: "Galaxy", path: `/galaxy/${galaxyId}` },
    { label: "Star", path: `/galaxy/${galaxyId}/star/${starId}` },
    { label: `Planet Type ${selectedPlanet.type}` },
  ];

  return (
    <Paper
      sx={{
        position: "absolute",
        top: 20,
        right: 20,
        padding: 2,
        background: "rgba(42, 27, 80, 0.9)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(77, 244, 255, 0.3)",
        boxShadow: "0 0 15px var(--theme-glow-secondary)",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <BreadcrumbNav items={breadcrumbItems} />
      <Typography
        component="h6"
        sx={{ color: "var(--theme-secondary)", mb: 2 }}
      >
        Planet Information
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography component="span" sx={{ color: "var(--theme-accent)" }}>
          Planet Type:
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-text)" }}>
          {selectedPlanet.type}
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-accent)" }}>
          Size:
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-text)" }}>
          {selectedPlanet.size.toFixed(2)} Earth Radii
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-accent)" }}>
          Distance:
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-text)" }}>
          {selectedPlanet.distance.toFixed(2)} AU
        </Typography>
        {selectedPlanet.atmosphere && (
          <>
            <Typography component="span" sx={{ color: "var(--theme-accent)" }}>
              Atmosphere:
            </Typography>
            <Typography component="span" sx={{ color: "var(--theme-text)" }}>
              {selectedPlanet.atmosphere}
            </Typography>
          </>
        )}
      </Box>
    </Paper>
  );
}
