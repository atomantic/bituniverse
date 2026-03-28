import React from "react";
import { Box, Typography } from "@mui/material";

function ControlRow({ keys, action }) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
      <Typography
        sx={{
          color: "var(--theme-secondary)",
          fontSize: "0.6rem",
          minWidth: 100,
          textAlign: "right",
        }}
      >
        {keys}
      </Typography>
      <Typography sx={{ color: "var(--theme-text)", fontSize: "0.6rem", opacity: 0.7 }}>
        {action}
      </Typography>
    </Box>
  );
}

export default function ControlsOverlay({ isVisible }) {
  if (!isVisible) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 40,
        right: 8,
        padding: "10px 14px",
        background: "rgba(10, 6, 30, 0.9)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(77, 244, 255, 0.15)",
        borderRadius: "4px",
        pointerEvents: "auto",
        zIndex: 10,
      }}
    >
      <Typography
        sx={{
          color: "var(--theme-secondary)",
          fontSize: "0.55rem",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          mb: 0.75,
          opacity: 0.7,
        }}
      >
        Controls
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
        <ControlRow keys="← →" action="Navigate" />
        <ControlRow keys="Enter / Space" action="Zoom In" />
        <ControlRow keys="Esc / Backspace" action="Zoom Out" />
        <ControlRow keys="Mouse" action="Orbit / Select" />
        <ControlRow keys="J" action="Random Jump" />
        <ControlRow keys="M" action="Center Galaxy" />
        <ControlRow keys="O" action="Reset Camera" />
        <ControlRow keys="T" action="Guided Tour" />
        <ControlRow keys="F" action="Key Lookup" />
        <ControlRow keys="S" action="Share Location" />
        <ControlRow keys="H" action="Navigation History" />
        <ControlRow keys="B" action="Brute Force Calculator" />
        <ControlRow keys="A" action="Auto-Explore" />
        <ControlRow keys="C" action="Toggle Controls" />
        <ControlRow keys="I" action="Toggle HUD" />
      </Box>
    </Box>
  );
}
