import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { keyToLocation } from "../utils/keyspaceHierarchy";
import { generateGalaxyName } from "../utils/galaxyNames";
import { generatePlanetName } from "../utils/planetStats";

// Depth labels for the zoom level selector
const DEPTH_OPTIONS = [
  { value: "galaxy", label: "Galaxy" },
  { value: "star", label: "Star" },
  { value: "planet", label: "Planet" },
  { value: "region", label: "Region" },
  { value: "sector", label: "Sector" },
  { value: "area", label: "Area" },
  { value: "ground", label: "Ground" },
  { value: "grain", label: "Grain" },
  { value: "molecule", label: "Molecule" },
  { value: "atom", label: "Atom" },
  { value: "quark", label: "Quark" },
  { value: "string", label: "String (Key)" },
];

// Build a partial path up to a given depth
function buildPathToDepth(loc, depth) {
  const base = `/galaxy/${loc.galaxyId}`;
  if (depth === "galaxy") return base;
  const star = `${base}/star/${loc.starId}`;
  if (depth === "star") return star;
  const planet = `${star}/planet/${loc.planetId}`;
  if (depth === "planet") return planet;
  const region = `${planet}/region/${loc.regionId}`;
  if (depth === "region") return region;
  const sector = `${region}/sector/${loc.sectorId}`;
  if (depth === "sector") return sector;
  const area = `${sector}/area/${loc.areaId}`;
  if (depth === "area") return area;
  const ground = `${area}/ground/${loc.groundId}`;
  if (depth === "ground") return ground;
  const grain = `${ground}/grain/${loc.grainId}`;
  if (depth === "grain") return grain;
  const molecule = `${grain}/molecule/${loc.moleculeId}`;
  if (depth === "molecule") return molecule;
  const atom = `${molecule}/atom/${loc.atomId}`;
  if (depth === "atom") return atom;
  const quark = `${atom}/quark/${loc.quarkId}`;
  if (depth === "quark") return quark;
  return `${quark}/string/${loc.stringId}`;
}

// Generate a random 64-char hex key
function randomHexKey() {
  const chars = "0123456789ABCDEF";
  let key = "";
  for (let i = 0; i < 64; i++) key += chars[Math.floor(Math.random() * 16)];
  return key;
}

export default function KeyLookup({ active, onClose }) {
  const [input, setInput] = useState("");
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [depth, setDepth] = useState("string");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus input when overlay opens
  useEffect(() => {
    if (active && inputRef.current) {
      inputRef.current.focus();
    }
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

  const handleInputChange = useCallback((e) => {
    const val = e.target.value.replace(/[^0-9a-fA-Fx\s]/g, "").toUpperCase();
    setInput(val);
    setError(null);

    const cleaned = val.replace(/^0X/i, "").replace(/\s/g, "");
    if (cleaned.length === 0) {
      setLocation(null);
      return;
    }
    if (cleaned.length > 64) {
      setError("Key must be at most 64 hex characters");
      setLocation(null);
      return;
    }
    const loc = keyToLocation(cleaned);
    if (!loc) {
      setError("Invalid hex key");
      setLocation(null);
    } else {
      setLocation(loc);
    }
  }, []);

  const handleNavigate = useCallback(() => {
    if (!location) return;
    navigate(buildPathToDepth(location, depth));
    onClose();
  }, [location, depth, navigate, onClose]);

  const handleRandom = useCallback(() => {
    const key = randomHexKey();
    setInput(key);
    setError(null);
    setLocation(keyToLocation(key));
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && location) {
      e.preventDefault();
      handleNavigate();
    }
  }, [location, handleNavigate]);

  if (!active) return null;

  const galaxyName = location ? generateGalaxyName(location.galaxyId) : "";
  const planetName = location ? generatePlanetName(`${location.galaxyId}${location.starId}${location.planetId}`) : "";

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
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: 480,
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
            Key Lookup
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
          Enter a 256-bit hex key to find its exact location in the universe. Every possible key maps to a unique galaxy, star, planet, and
          all the way down to a single string.
        </Typography>

        {/* Input */}
        <Box sx={{ mb: 1.5 }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 00000000000000000000000000000000000000000000000000000000DEADBEEF"
            spellCheck={false}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "rgba(77, 244, 255, 0.05)",
              border: error ? "1px solid rgba(255, 87, 87, 0.4)" : "1px solid rgba(77, 244, 255, 0.15)",
              borderRadius: "4px",
              color: "var(--theme-text)",
              fontFamily: '"Roboto Mono", monospace',
              fontSize: "0.65rem",
              letterSpacing: "0.05em",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {error && (
            <Typography sx={{ color: "#ff5757", fontSize: "0.55rem", mt: 0.5 }}>{error}</Typography>
          )}
        </Box>

        {/* Random button */}
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <Typography
            onClick={handleRandom}
            sx={{
              color: "var(--theme-accent)", fontSize: "0.55rem", opacity: 0.5, cursor: "pointer",
              "&:hover": { opacity: 0.8, color: "var(--theme-secondary)" },
            }}
          >
            Random Key
          </Typography>
        </Box>

        {/* Location preview */}
        {location && (
          <Box sx={{
            background: "rgba(77, 244, 255, 0.03)",
            border: "1px solid rgba(77, 244, 255, 0.1)",
            borderRadius: "4px",
            padding: "10px 12px",
            mb: 2,
          }}>
            <Typography sx={{ color: "var(--theme-secondary)", fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.12em", mb: 0.75, opacity: 0.7 }}>
              Location
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
              <LocationRow label="Galaxy" value={`${galaxyName} (#${location.galaxyId})`} />
              <LocationRow label="Star" value={`#${location.starId}`} />
              <LocationRow label="Planet" value={`${planetName} (#${location.planetId})`} />
              <LocationRow label="Region" value={`#${location.regionId}`} />
              <LocationRow label="Sector" value={`#${location.sectorId}`} />
              <LocationRow label="Area" value={`#${location.areaId}`} />
              <LocationRow label="Ground" value={`#${location.groundId}`} />
              <LocationRow label="Grain" value={`#${location.grainId}`} />
              <LocationRow label="Molecule" value={`#${location.moleculeId}`} />
              <LocationRow label="Atom" value={`#${location.atomId}`} />
              <LocationRow label="Quark" value={`#${location.quarkId}`} />
              <LocationRow label="String" value={`#${location.stringId}`} />
            </Box>
          </Box>
        )}

        {/* Depth selector + Navigate button */}
        {location && (
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flex: 1 }}>
              <Typography sx={{ color: "var(--theme-accent)", fontSize: "0.55rem", opacity: 0.6, whiteSpace: "nowrap" }}>
                Navigate to:
              </Typography>
              <select
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  background: "rgba(77, 244, 255, 0.05)",
                  border: "1px solid rgba(77, 244, 255, 0.15)",
                  borderRadius: "4px",
                  color: "var(--theme-text)",
                  fontFamily: '"Roboto Mono", monospace',
                  fontSize: "0.6rem",
                  outline: "none",
                }}
              >
                {DEPTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ background: "#1a1040" }}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Box>
            <Box
              onClick={handleNavigate}
              sx={{
                padding: "6px 16px",
                background: "rgba(77, 244, 255, 0.12)",
                border: "1px solid rgba(77, 244, 255, 0.3)",
                borderRadius: "4px",
                cursor: "pointer",
                minHeight: 40,
                display: "flex",
                alignItems: "center",
                "&:hover": { background: "rgba(77, 244, 255, 0.2)", borderColor: "rgba(77, 244, 255, 0.5)" },
              }}
            >
              <Typography sx={{ color: "var(--theme-secondary)", fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.05em" }}>
                Go
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function LocationRow({ label, value }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
      <Typography sx={{ color: "var(--theme-accent)", fontSize: "0.55rem", opacity: 0.7 }}>{label}</Typography>
      <Typography sx={{ color: "var(--theme-text)", fontSize: "0.55rem", fontFamily: '"Roboto Mono", monospace' }}>{value}</Typography>
    </Box>
  );
}
