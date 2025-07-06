import React from "react";
import { Box, Typography } from "@mui/material";
import { TOTAL_KEYS, KEYS_PER_GALAXY } from "../utils/constants";
import { DEBUG_LOGGING } from "../config/renderConfig";

export default function Footer({ baseKeyOffset }) {
  const totalGalaxies = Number(TOTAL_KEYS / KEYS_PER_GALAXY);
  const keyspacePosition = (parseInt(baseKeyOffset, 10) / totalGalaxies) * 100;
  if (DEBUG_LOGGING) {
    console.log(`Footer keyspacePosition: ${keyspacePosition}`, {
      totalGalaxies,
      baseKeyOffset,
    });
  }
  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "40px",
        background: "rgba(42, 27, 80, 0.9)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid rgba(77, 244, 255, 0.3)",
        boxShadow: "0 0 15px var(--theme-glow-secondary)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 20px",
        zIndex: 1000,
      }}
    >
      <Typography variant="body2" sx={{ color: "var(--theme-secondary)" }}>
        256-bit Keyspace Universe (press C to toggle controls)
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="body2" sx={{ color: "var(--theme-accent)" }}>
          Keyspace Position:
        </Typography>
        <Box
          sx={{
            width: "200px",
            height: "4px",
            background: "rgba(77, 244, 255, 0.2)",
            borderRadius: "2px",
            position: "relative",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              left: `${keyspacePosition}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "12px",
              height: "12px",
              background: "var(--theme-secondary)",
              borderRadius: "50%",
              boxShadow: "0 0 10px var(--theme-glow-secondary)",
            }}
          />
        </Box>
        <Typography variant="body2" sx={{ color: "var(--theme-text)" }}>
          {Math.round(keyspacePosition)}%
        </Typography>
      </Box>
    </Box>
  );
}
