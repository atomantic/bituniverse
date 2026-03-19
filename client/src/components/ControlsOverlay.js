import React from "react";
import { Box, Typography } from "@mui/material";

export default function ControlsOverlay({ isVisible }) {
  if (!isVisible) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 60,
        left: 20,
        padding: 2,
        background: "rgba(42, 27, 80, 0.9)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(77, 244, 255, 0.3)",
        boxShadow: "0 0 15px var(--theme-glow-secondary)",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: "var(--theme-secondary)", mb: 1 }}
      >
        Controls
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--theme-text)" }}>
        Arrow Keys - Navigate Galaxies
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--theme-text)" }}>
        Enter/Space - Zoom Into Selection
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--theme-text)" }}>
        Escape/Backspace - Zoom Out
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--theme-text)" }}>
        Mouse - Select System
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--theme-text)" }}>
        j - Random Galaxy Jump
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--theme-text)" }}>
        m - Zoom to Galaxy Center
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--theme-text)" }}>
        o - Reset Camera Position to Origin
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: "var(--theme-text)", mt: 1, opacity: 0.7 }}
      >
        c - Toggle Controls
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: "var(--theme-text)", opacity: 0.7 }}
      >
        i - Toggle Info Panels
      </Typography>
    </Box>
  );
}
