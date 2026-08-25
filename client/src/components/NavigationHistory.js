import React, { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

// View level labels and icons for display
const VIEW_META = {
  galaxy: { icon: "\u2726", label: "Galaxy" },
  solarSystem: { icon: "\u2600", label: "Star System" },
  planet: { icon: "\u25CF", label: "Planet" },
  map: { icon: "\u25CB", label: "Globe" },
  sector: { icon: "\u25A1", label: "Continent" },
  region: { icon: "\u25A0", label: "Region" },
  area: { icon: "\u25B3", label: "Area" },
  ground: { icon: "\u2593", label: "Ground" },
  grain: { icon: "\u00B7", label: "Grain" },
  molecule: { icon: "\u2B22", label: "Molecule" },
  atom: { icon: "\u2299", label: "Atom" },
  quark: { icon: "\u2742", label: "Quark" },
};

// Depth index for visual indent
const VIEW_DEPTH = {
  galaxy: 0, solarSystem: 1, planet: 2, map: 3, sector: 4,
  region: 5, area: 6, ground: 7, grain: 8, molecule: 9, atom: 10, quark: 11,
};

function formatTimeAgo(ts) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function HistoryEntry({ entry, isCurrent, onClick }) {
  const meta = VIEW_META[entry.view] || { icon: "?", label: entry.view };
  const depth = VIEW_DEPTH[entry.view] ?? 0;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        pl: 0.5 + depth * 0.4,
        py: 0.4,
        cursor: isCurrent ? "default" : "pointer",
        borderLeft: isCurrent
          ? "2px solid var(--theme-secondary)"
          : "2px solid transparent",
        background: isCurrent ? "rgba(77, 244, 255, 0.06)" : "transparent",
        transition: "all 0.15s ease",
        minHeight: 40,
        "&:hover": isCurrent ? {} : {
          background: "rgba(77, 244, 255, 0.04)",
          borderLeftColor: "rgba(77, 244, 255, 0.3)",
        },
      }}
    >
      <Typography sx={{ color: "var(--theme-secondary)", fontSize: "0.65rem", opacity: isCurrent ? 1 : 0.5, width: 14, textAlign: "center" }}>
        {meta.icon}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{
          color: isCurrent ? "var(--theme-text)" : "var(--theme-text)",
          fontSize: "0.55rem",
          opacity: isCurrent ? 0.9 : 0.6,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {entry.label}
        </Typography>
      </Box>
      <Typography sx={{ color: "var(--theme-accent)", fontSize: "0.45rem", opacity: 0.4, whiteSpace: "nowrap", pr: 0.5 }}>
        {formatTimeAgo(entry.timestamp)}
      </Typography>
    </Box>
  );
}

export default function NavigationHistory({ active, onClose, history, currentPath }) {
  const navigate = useNavigate();
  const overlayRef = useRef(null);
  const listRef = useRef(null);

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

  // Scroll to current entry when opened
  useEffect(() => {
    if (active && listRef.current) {
      const currentEl = listRef.current.querySelector("[data-current='true']");
      if (currentEl) currentEl.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [active]);

  if (!active) return null;

  const handleNavigate = (entry) => {
    if (entry.path !== currentPath) {
      navigate(entry.path);
    }
  };

  return (
    <Box
      onClick={onClose}
      sx={{
        position: "absolute",
        inset: 0,
        role: "dialog",
        "aria-modal": true,
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
          width: 380,
          maxWidth: "90vw",
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          background: "rgba(10, 6, 30, 0.95)",
          border: "1px solid rgba(77, 244, 255, 0.2)",
          borderRadius: "6px",
          boxShadow: "0 0 40px rgba(77, 244, 255, 0.08)",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2.5, pt: 2, pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
            <Typography sx={{ color: "var(--theme-secondary)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              Navigation History
            </Typography>
            <Typography sx={{ color: "var(--theme-accent)", fontSize: "0.5rem", opacity: 0.4 }}>
              {history.length} {history.length === 1 ? "location" : "locations"}
            </Typography>
          </Box>
          <Typography
            onClick={onClose}
            sx={{ color: "var(--theme-accent)", fontSize: "0.6rem", opacity: 0.5, cursor: "pointer", "&:hover": { opacity: 0.8 } }}
          >
            ESC
          </Typography>
        </Box>

        {/* Description */}
        <Typography sx={{ color: "var(--theme-text)", fontSize: "0.55rem", opacity: 0.5, px: 2.5, pb: 1, lineHeight: 1.5 }}>
          Click any location to jump back. Your exploration path through the keyspace this session.
        </Typography>

        {/* History list */}
        <Box
          ref={listRef}
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 1,
            pb: 1.5,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { background: "rgba(77, 244, 255, 0.15)", borderRadius: 2 },
          }}
        >
          {history.length === 0 ? (
            <Typography sx={{ color: "var(--theme-text)", fontSize: "0.55rem", opacity: 0.4, textAlign: "center", py: 3 }}>
              Start exploring to build your history
            </Typography>
          ) : (
            [...history].reverse().map((entry, i) => {
              const isCurrent = entry.path === currentPath;
              return (
                <Box key={entry.id} data-current={isCurrent ? "true" : undefined}>
                  <HistoryEntry
                    entry={entry}
                    isCurrent={isCurrent}
                    onClick={() => handleNavigate(entry)}
                  />
                </Box>
              );
            })
          )}
        </Box>
      </Box>
    </Box>
  );
}
