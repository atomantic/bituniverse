import React from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

const ZOOM_LEVELS = [
  { id: "galaxy",      label: "GAL", fullLabel: "Galaxy" },
  { id: "solarSystem", label: "STR", fullLabel: "Star System" },
  { id: "planet",      label: "PLN", fullLabel: "Planet" },
  { id: "map",         label: "GLB", fullLabel: "Globe",      urlSegment: "region",   paramName: "regionId" },
  { id: "sector",      label: "CNT", fullLabel: "Continent",  urlSegment: "sector",   paramName: "sectorId" },
  { id: "region",      label: "RGN", fullLabel: "Region",     urlSegment: "area",     paramName: "areaId" },
  { id: "area",        label: "ARE", fullLabel: "Area",       urlSegment: "ground",   paramName: "groundId" },
  { id: "ground",      label: "GND", fullLabel: "Ground",     urlSegment: "grain",    paramName: "grainId" },
  { id: "grain",       label: "GRN", fullLabel: "Grain",      urlSegment: "molecule", paramName: "moleculeId" },
  { id: "molecule",    label: "MOL", fullLabel: "Molecule",   urlSegment: "atom",     paramName: "atomId" },
  { id: "atom",        label: "ATM", fullLabel: "Atom",       urlSegment: "quark",    paramName: "quarkId" },
  { id: "quark",       label: "QRK", fullLabel: "Quark",      urlSegment: "string",   paramName: "stringId" },
];

const DEEP_LEVELS = ZOOM_LEVELS.filter((l) => l.urlSegment);

function buildNavPath(targetView, params) {
  const segments = [`/galaxy/${params.galaxyId}`];
  if (targetView === "galaxy") return segments.join("");
  segments.push(`/star/${params.starId}`);
  if (targetView === "solarSystem") return segments.join("");
  segments.push(`/planet/${params.planetId}`);
  if (targetView === "planet") return segments.join("");
  for (const level of DEEP_LEVELS) {
    const val = params[level.paramName];
    if (val == null) break;
    segments.push(`/${level.urlSegment}/${val}`);
    if (level.id === targetView) break;
  }
  return segments.join("");
}

const containerSx = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  alignSelf: "center",
  pointerEvents: "auto",
  mx: 0.5,
};

export default function ZoomDepthGauge({ view }) {
  const navigate = useNavigate();
  const params = useParams();
  const currentIdx = ZOOM_LEVELS.findIndex((l) => l.id === view);

  return (
    <Box sx={containerSx}>
      {ZOOM_LEVELS.map((level, idx) => {
        const isCurrent = idx === currentIdx;
        const isVisited = idx <= currentIdx;
        const isClickable = idx < currentIdx;

        return (
          <React.Fragment key={level.id}>
            {idx > 0 && (
              <Box
                sx={{
                  width: 1,
                  height: 4,
                  background: isVisited
                    ? "rgba(77, 244, 255, 0.25)"
                    : "rgba(77, 244, 255, 0.06)",
                  transition: "background 0.3s",
                }}
              />
            )}
            <Box
              title={level.fullLabel}
              onClick={
                isClickable
                  ? () => navigate(buildNavPath(level.id, params))
                  : undefined
              }
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                cursor: isClickable ? "pointer" : "default",
                py: 0.2,
                px: 0.4,
                borderRadius: "3px",
                transition: "all 0.2s",
                ...(isCurrent && {
                  background: "rgba(77, 244, 255, 0.08)",
                  boxShadow: "0 0 8px rgba(77, 244, 255, 0.2)",
                }),
                ...(isClickable && {
                  "&:hover": {
                    background: "rgba(77, 244, 255, 0.12)",
                    "& .gauge-dot": {
                      background: "var(--theme-secondary)",
                      boxShadow: "0 0 4px var(--theme-glow-secondary)",
                    },
                    "& .gauge-label": { opacity: 0.8 },
                  },
                }),
              }}
            >
              <Box
                className="gauge-dot"
                sx={{
                  width: isCurrent ? 6 : 4,
                  height: isCurrent ? 6 : 4,
                  borderRadius: "50%",
                  background: isCurrent
                    ? "var(--theme-secondary)"
                    : isVisited
                      ? "rgba(77, 244, 255, 0.4)"
                      : "rgba(77, 244, 255, 0.08)",
                  boxShadow: isCurrent
                    ? "0 0 6px var(--theme-glow-secondary)"
                    : "none",
                  animation: isCurrent
                    ? "depthGaugePulse 2s ease-in-out infinite"
                    : "none",
                  flexShrink: 0,
                  transition: "all 0.2s",
                }}
              />
              <Typography
                className="gauge-label"
                sx={{
                  fontSize: "0.4rem",
                  letterSpacing: "0.08em",
                  color: isCurrent
                    ? "var(--theme-secondary)"
                    : "var(--theme-accent)",
                  opacity: isCurrent ? 0.9 : isVisited ? 0.4 : 0.12,
                  whiteSpace: "nowrap",
                  fontWeight: isCurrent ? 600 : 400,
                  lineHeight: 1,
                  transition: "all 0.2s",
                }}
              >
                {level.label}
              </Typography>
            </Box>
          </React.Fragment>
        );
      })}
    </Box>
  );
}
