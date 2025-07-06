import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { useParams } from "react-router-dom";
import BreadcrumbNav from "./BreadcrumbNav";

export default function AtomInfoPanel({ selectedAtom }) {
  const { galaxyId, starId, planetId } = useParams();

  if (!selectedAtom) return null;

  const breadcrumbItems = [
    { label: "Galaxy", path: `/galaxy/${galaxyId}` },
    { label: "Star", path: `/galaxy/${galaxyId}/star/${starId}` },
    {
      label: "Planet",
      path: `/galaxy/${galaxyId}/star/${starId}/planet/${planetId}`,
    },
    { label: `Atom ${selectedAtom.element}` },
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
        Atom Information
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography component="span" sx={{ color: "var(--theme-accent)" }}>
          Element:
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-text)" }}>
          {selectedAtom.element}
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-accent)" }}>
          Atomic Number:
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-text)" }}>
          {selectedAtom.atomicNumber}
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-accent)" }}>
          Mass:
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-text)" }}>
          {selectedAtom.mass.toFixed(2)} u
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-accent)" }}>
          Electrons:
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-text)" }}>
          {selectedAtom.electrons}
        </Typography>
      </Box>
    </Paper>
  );
}
