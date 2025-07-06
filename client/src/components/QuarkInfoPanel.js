import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { useParams } from "react-router-dom";
import BreadcrumbNav from "./BreadcrumbNav";

export default function QuarkInfoPanel({ selectedQuark }) {
  const { galaxyId, starId, planetId, atomId } = useParams();

  if (!selectedQuark) return null;

  const breadcrumbItems = [
    { label: "Galaxy", path: `/galaxy/${galaxyId}` },
    { label: "Star", path: `/galaxy/${galaxyId}/star/${starId}` },
    {
      label: "Planet",
      path: `/galaxy/${galaxyId}/star/${starId}/planet/${planetId}`,
    },
    {
      label: "Atom",
      path: `/galaxy/${galaxyId}/star/${starId}/planet/${planetId}/atom/${atomId}`,
    },
    { label: `Quark ${selectedQuark.type}` },
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
        Quark Information
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography component="span" sx={{ color: "var(--theme-accent)" }}>
          Type:
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-text)" }}>
          {selectedQuark.type}
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-accent)" }}>
          Charge:
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-text)" }}>
          {selectedQuark.charge}
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-accent)" }}>
          Mass:
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-text)" }}>
          {selectedQuark.mass.toFixed(2)} MeV/c²
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-accent)" }}>
          Color:
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-text)" }}>
          {selectedQuark.color}
        </Typography>
      </Box>
    </Paper>
  );
}
