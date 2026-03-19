import React from "react";
import { Box, Typography } from "@mui/material";

export default function HudWidget({ title, children, sx, glowColor }) {
  const borderColor = glowColor
    ? `${glowColor}25`
    : "rgba(77, 244, 255, 0.12)";
  const shadow = glowColor ? `0 0 8px ${glowColor}15` : "none";

  return (
    <Box
      sx={{
        background: "rgba(10, 6, 30, 0.7)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${borderColor}`,
        borderRadius: "4px",
        padding: "8px 10px",
        boxShadow: shadow,
        ...sx,
      }}
    >
      {title && (
        <Typography
          sx={{
            color: "var(--theme-secondary)",
            fontSize: "0.55rem",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            mb: 0.5,
            opacity: 0.7,
          }}
        >
          {title}
        </Typography>
      )}
      {children}
    </Box>
  );
}

export function InfoRow({ label, value, mono }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
      <Typography
        component="span"
        sx={{
          color: "var(--theme-accent)",
          fontSize: "0.65rem",
          opacity: 0.8,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
      <Typography
        component="span"
        sx={{
          color: "var(--theme-text)",
          fontSize: "0.65rem",
          textAlign: "right",
          fontFamily: mono ? '"Roboto Mono", monospace' : "inherit",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export function SectionLabel({ children }) {
  return (
    <Typography
      sx={{
        color: "var(--theme-secondary)",
        fontSize: "0.55rem",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        mt: 0.75,
        mb: 0.25,
        borderBottom: "1px solid rgba(77, 244, 255, 0.1)",
        pb: 0.25,
        opacity: 0.8,
      }}
    >
      {children}
    </Typography>
  );
}
