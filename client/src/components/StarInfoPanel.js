import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { starTypes } from "../config/starDistributions";
import { useParams } from "react-router-dom";
import BreadcrumbNav from "./BreadcrumbNav";

export default function StarInfoPanel({ selectedStar }) {
  const { galaxyId } = useParams();

  // console.log("StarInfoPanel received selectedStar:", selectedStar);

  if (!selectedStar || !starTypes) return null;

  const starTypeIndex = selectedStar.type;

  // Safety check for starTypeIndex
  if (
    typeof starTypeIndex !== "number" ||
    starTypeIndex < 0 ||
    starTypeIndex >= starTypes.color.length
  ) {
    console.error("Invalid starTypeIndex:", starTypeIndex);
    return null;
  }

  const color = `#${starTypes.color[starTypeIndex]
    .toString(16)
    .padStart(6, "0")}`;

  const breadcrumbItems = [
    { label: "Galaxy", path: `/galaxy/${galaxyId}` },
    { label: `Star Type ${starTypeIndex}` },
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
        Star Information
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography component="span" sx={{ color: "var(--theme-accent)" }}>
            Star Class:
          </Typography>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}`,
            }}
          />
          <Typography component="span" sx={{ color: "var(--theme-text)" }}>
            Type {starTypeIndex}
          </Typography>
        </Box>
        <Typography component="span" sx={{ color: "var(--theme-accent)" }}>
          Temperature:
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-text)" }}>
          {starTypes.temperature[starTypeIndex]}K
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-accent)" }}>
          Mass:
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-text)" }}>
          {starTypes.mass[starTypeIndex]} M☉
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-accent)" }}>
          Luminosity:
        </Typography>
        <Typography component="span" sx={{ color: "var(--theme-text)" }}>
          {starTypes.luminosity[starTypeIndex]} L☉
        </Typography>
      </Box>
    </Paper>
  );
}
