import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Typography } from "@mui/material";
import { useLocation, useParams } from "react-router-dom";
import { generateGalaxyName } from "../utils/galaxyNames";
import { generatePlanetName } from "../utils/planetStats";

// View labels for human-readable descriptions
const VIEW_LABELS = {
  galaxy: "Galaxy",
  solarSystem: "Star System",
  planet: "Planet",
  map: "Globe Region",
  sector: "Continent Sector",
  region: "Region Area",
  area: "Ground Area",
  ground: "Surface Ground",
  grain: "Grain",
  molecule: "Molecule",
  atom: "Atom",
  quark: "Quark",
};

function buildLocationDescription(view, params) {
  const { galaxyId, starId, planetId } = params;
  const parts = [];

  if (galaxyId !== undefined) {
    parts.push(generateGalaxyName(parseInt(galaxyId, 10)));
  }
  if (starId !== undefined && view !== "galaxy") {
    parts.push(`Star ${starId}`);
  }
  if (planetId !== undefined && !["galaxy", "solarSystem"].includes(view)) {
    const pName = generatePlanetName(`${galaxyId}${starId}${planetId}`);
    parts.push(pName);
  }

  const deepParams = [
    { key: "regionId", label: "Region" },
    { key: "sectorId", label: "Sector" },
    { key: "areaId", label: "Area" },
    { key: "groundId", label: "Ground" },
    { key: "grainId", label: "Grain" },
    { key: "moleculeId", label: "Molecule" },
    { key: "atomId", label: "Atom" },
    { key: "quarkId", label: "Quark" },
    { key: "stringId", label: "String" },
  ];

  for (const { key, label } of deepParams) {
    if (params[key] !== undefined) {
      parts.push(`${label} ${params[key]}`);
    }
  }

  return parts.join(" > ");
}

export default function ShareOverlay({ active, onClose, view }) {
  const [copied, setCopied] = useState(null); // "link" | "text" | null
  const location = useLocation();
  const params = useParams();
  const overlayRef = useRef(null);

  // Reset copied state when overlay opens
  useEffect(() => {
    if (active) setCopied(null);
  }, [active]);

  // Close on Escape
  useEffect(() => {
    if (!active) return;
    const handleKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [active, onClose]);

  const currentUrl = `${window.location.origin}${location.pathname}`;
  const locationDesc = buildLocationDescription(view, params);
  const viewLabel = VIEW_LABELS[view] || view;

  const shareText = `Exploring the SHA-256 keyspace at ${viewLabel} level: ${locationDesc}\n\n${currentUrl}`;

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(currentUrl);
    setCopied("link");
    setTimeout(() => setCopied((v) => v === "link" ? null : v), 2000);
  }, [currentUrl]);

  const handleCopyText = useCallback(() => {
    navigator.clipboard.writeText(shareText);
    setCopied("text");
    setTimeout(() => setCopied((v) => v === "text" ? null : v), 2000);
  }, [shareText]);

  if (!active) return null;

  return (
    <Box
      onClick={onClose}
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
      }}
    >
      <Box
        ref={overlayRef}
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: 440,
          maxWidth: "90vw",
          background: "rgba(10, 6, 30, 0.95)",
          border: "1px solid rgba(77, 244, 255, 0.2)",
          borderRadius: "6px",
          padding: "20px 24px",
          boxShadow: "0 0 40px rgba(77, 244, 255, 0.08)",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography sx={{ color: "var(--theme-secondary)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.15em" }}>
            Share Location
          </Typography>
          <Typography
            onClick={onClose}
            sx={{ color: "var(--theme-accent)", fontSize: "0.6rem", opacity: 0.5, cursor: "pointer", "&:hover": { opacity: 0.8 } }}
          >
            ESC
          </Typography>
        </Box>

        {/* Description */}
        <Typography sx={{ color: "var(--theme-text)", fontSize: "0.6rem", opacity: 0.6, mb: 1.5, lineHeight: 1.6 }}>
          Share this exact location in the keyspace. Anyone with this link will see the same view.
        </Typography>

        {/* Current location */}
        <Box sx={{
          background: "rgba(77, 244, 255, 0.03)",
          border: "1px solid rgba(77, 244, 255, 0.1)",
          borderRadius: "4px",
          padding: "10px 12px",
          mb: 1.5,
        }}>
          <Typography sx={{ color: "var(--theme-secondary)", fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.12em", mb: 0.5, opacity: 0.7 }}>
            {viewLabel} View
          </Typography>
          <Typography sx={{
            color: "var(--theme-text)", fontSize: "0.6rem", opacity: 0.8, lineHeight: 1.5,
            wordBreak: "break-word",
          }}>
            {locationDesc}
          </Typography>
        </Box>

        {/* URL display */}
        <Box sx={{
          background: "rgba(77, 244, 255, 0.05)",
          border: "1px solid rgba(77, 244, 255, 0.15)",
          borderRadius: "4px",
          padding: "8px 12px",
          mb: 2,
          wordBreak: "break-all",
        }}>
          <Typography sx={{
            color: "var(--theme-text)", fontSize: "0.55rem",
            fontFamily: '"Roboto Mono", monospace',
            letterSpacing: "0.02em",
            opacity: 0.9,
            userSelect: "all",
          }}>
            {currentUrl}
          </Typography>
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <CopyButton
            label={copied === "link" ? "Copied!" : "Copy Link"}
            onClick={handleCopyLink}
            active={copied === "link"}
          />
          <CopyButton
            label={copied === "text" ? "Copied!" : "Copy with Context"}
            onClick={handleCopyText}
            active={copied === "text"}
            secondary
          />
        </Box>
      </Box>
    </Box>
  );
}

function CopyButton({ label, onClick, active, secondary }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        padding: "6px 16px",
        background: active
          ? "rgba(77, 244, 255, 0.25)"
          : secondary
            ? "rgba(77, 244, 255, 0.05)"
            : "rgba(77, 244, 255, 0.12)",
        border: `1px solid rgba(77, 244, 255, ${active ? "0.5" : secondary ? "0.15" : "0.3"})`,
        borderRadius: "4px",
        cursor: "pointer",
        minHeight: 40,
        display: "flex",
        alignItems: "center",
        transition: "all 0.15s ease",
        "&:hover": {
          background: `rgba(77, 244, 255, ${active ? "0.25" : "0.2"})`,
          borderColor: "rgba(77, 244, 255, 0.5)",
        },
      }}
    >
      <Typography sx={{
        color: active ? "var(--theme-text)" : "var(--theme-secondary)",
        fontSize: "0.6rem",
        fontWeight: 500,
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}>
        {label}
      </Typography>
    </Box>
  );
}
