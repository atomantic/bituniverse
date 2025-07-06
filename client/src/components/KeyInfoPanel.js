import React from "react";
import { Box, Typography, Paper } from "@mui/material";

export default function KeyInfoPanel({ selectedBody }) {
  if (!selectedBody) return null;
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
      }}
    >
      <Typography variant="h6" sx={{ color: "var(--theme-secondary)", mb: 2 }}>
        Bitcoin Key Info
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="body2" sx={{ color: "var(--theme-accent)" }}>
          Private Key:
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: "monospace",
            wordBreak: "break-all",
            color: "var(--theme-text)",
          }}
        >
          {selectedBody.privateKey}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "var(--theme-accent)", mt: 1 }}
        >
          Public Key:
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: "monospace",
            wordBreak: "break-all",
            color: "var(--theme-text)",
          }}
        >
          {selectedBody.publicKey}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "var(--theme-accent)", mt: 1 }}
        >
          Address:
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: "monospace",
            wordBreak: "break-all",
            color: "var(--theme-text)",
          }}
        >
          {selectedBody.address}
        </Typography>
        {selectedBody.balance && (
          <>
            <Typography
              variant="body2"
              sx={{ color: "var(--theme-accent)", mt: 1 }}
            >
              Balance:
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontFamily: "monospace", color: "var(--theme-text)" }}
            >
              {selectedBody.balance.chain_stats.funded_txo_sum / 100000000} BTC
            </Typography>
          </>
        )}
      </Box>
    </Paper>
  );
}
