import React, { useMemo } from "react";
import { Box, Typography, Paper } from "@mui/material";
import { STAR_TYPES, KEYS_PER_GALAXY, TOTAL_KEYS } from "../utils/constants";
import { generateGalaxyName } from "../utils/galaxyNames";

export default function GalaxyInfoPanel({ selectedBody }) {
  if (!selectedBody || selectedBody.type !== "galaxy") return null;

  const galaxyIndex = parseInt(selectedBody.key, 10);
  const startKey = BigInt(galaxyIndex) * KEYS_PER_GALAXY;
  const endKey = startKey + KEYS_PER_GALAXY;
  const startKeyHex = startKey.toString(16).padStart(64, "0");
  const endKeyHex = endKey.toString(16).padStart(64, "0");
  const starType = STAR_TYPES[selectedBody.class || "G"];
  const keyspacePosition =
    Number(startKey.toString()) / Number(TOTAL_KEYS.toString());

  const totalGalaxies = Number(TOTAL_KEYS / KEYS_PER_GALAXY);
  const galaxyName = generateGalaxyName(galaxyIndex);

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
      <Typography variant="h6" sx={{ color: "var(--theme-secondary)", mb: 0.5 }}>
        {galaxyName}
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--theme-accent)", mb: 2, fontSize: "0.75rem" }}>
        Galaxy {galaxyIndex.toLocaleString()} of {totalGalaxies.toLocaleString()}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ color: "var(--theme-accent)" }}>
            Cluster Class:
          </Typography>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: starType.color,
              boxShadow: `0 0 10px ${starType.color}`,
            }}
          />
          <Typography variant="body2" sx={{ color: "var(--theme-text)" }}>
            {selectedBody.class || "G"} Type
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: "var(--theme-accent)" }}>
          Keyspace Range ({(keyspacePosition * 100).toFixed(12)}%):
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: "monospace",
            wordBreak: "break-all",
            color: "var(--theme-text)",
          }}
        >
          {startKeyHex} → {endKeyHex}
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--theme-accent)" }}>
          Suns:
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--theme-text)" }}>
          100,000,000,000
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--theme-accent)" }}>
          Planets:
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--theme-text)" }}>
          1,000,000,000,000
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "var(--theme-accent)", mt: 1 }}
        >
          Quarks (unique keys):
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontFamily: "monospace", color: "var(--theme-text)" }}
        >
          {KEYS_PER_GALAXY.toLocaleString()}
        </Typography>
      </Box>
    </Paper>
  );
}
