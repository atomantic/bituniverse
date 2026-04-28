import React, { useEffect, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { DEEP_ZOOM_LEVELS, KEYS_PER_PLANET, KEYS_PER_STAR } from "../utils/keyspaceHierarchy";
import { TOTAL_KEYS, KEYS_PER_GALAXY } from "../utils/constants";

function bigIntLog10(bn) {
  const s = bn.toString();
  if (s === "0") return 0;
  const digits = s.length;
  const lead = parseFloat(s.slice(0, Math.min(15, digits)));
  return Math.log10(lead) + (digits - Math.min(15, digits));
}

function viewKeysLog10(view) {
  if (view === "galaxy") return bigIntLog10(KEYS_PER_GALAXY);
  if (view === "solarSystem") return bigIntLog10(KEYS_PER_STAR);
  if (view === "planet") return bigIntLog10(KEYS_PER_PLANET);
  const lvl = DEEP_ZOOM_LEVELS.find((l) => l.id === view);
  if (lvl) return bigIntLog10(lvl.keysPerUnit);
  return null;
}

const QUANTITIES = [
  { id: "people-met", label: "People you'll meet in a lifetime", log10: 4.0, note: "~10,000", flavor: "social" },
  { id: "btc-used", label: "Used Bitcoin addresses (ever)", log10: 8.65, note: "~4.5 × 10⁸", flavor: "btc" },
  { id: "earth-pop", label: "Humans alive on Earth", log10: 9.9, note: "~8 billion", flavor: "world" },
  { id: "milky-stars", label: "Stars in the Milky Way", log10: 11.4, note: "~250 billion", flavor: "cosmic" },
  { id: "obs-galaxies", label: "Galaxies in the observable universe", log10: 12.0, note: "~10¹²", flavor: "cosmic" },
  { id: "earth-sand", label: "Grains of sand on Earth", log10: 19.0, note: "~7.5 × 10¹⁸", flavor: "world" },
  { id: "obs-stars", label: "Stars in the observable universe", log10: 23.4, note: "~10²³", flavor: "cosmic" },
  { id: "human-atoms", label: "Atoms in the human body", log10: 27.85, note: "~7 × 10²⁷", flavor: "world" },
  { id: "earth-atoms", label: "Atoms in the Earth", log10: 50.1, note: "~1.3 × 10⁵⁰", flavor: "world" },
  { id: "sun-atoms", label: "Atoms in the Sun", log10: 57.1, note: "~1.2 × 10⁵⁷", flavor: "cosmic" },
  { id: "milky-atoms", label: "Atoms in the Milky Way", log10: 68.0, note: "~10⁶⁸", flavor: "cosmic" },
  { id: "keyspace", label: "SHA-256 keyspace (2²⁵⁶)", log10: 77.06, note: "~1.16 × 10⁷⁷", flavor: "keyspace" },
  { id: "obs-atoms", label: "Atoms in the observable universe", log10: 80.0, note: "~10⁸⁰", flavor: "cosmic" },
  { id: "chess-games", label: "Possible chess games (Shannon)", log10: 120.0, note: "~10¹²⁰", flavor: "abstract" },
];

const FLAVOR_COLOR = {
  social: "rgba(180, 180, 220, 0.55)",
  world: "rgba(123, 255, 160, 0.6)",
  cosmic: "rgba(180, 140, 255, 0.7)",
  abstract: "rgba(255, 155, 61, 0.6)",
  btc: "rgba(247, 147, 26, 0.85)",
  keyspace: "rgba(77, 244, 255, 0.95)",
};

const AXIS_MIN = 0;
const AXIS_MAX = 130;

function barPercent(log10) {
  return Math.max(0, Math.min(100, ((log10 - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * 100));
}

export default function ScaleComparison({ active, onClose, view }) {
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

  const currentLog10 = useMemo(() => viewKeysLog10(view), [view]);
  const rows = useMemo(() => [...QUANTITIES].sort((a, b) => a.log10 - b.log10), []);

  if (!active) return null;

  const ticks = [0, 20, 40, 60, 80, 100, 120];

  const totalKeysLog = bigIntLog10(TOTAL_KEYS);

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
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(6px)",
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: 720,
          maxWidth: "92vw",
          maxHeight: "88vh",
          overflow: "auto",
          background: "rgba(10, 6, 30, 0.96)",
          border: "1px solid rgba(77, 244, 255, 0.2)",
          borderRadius: "6px",
          padding: "20px 24px",
          boxShadow: "0 0 50px rgba(77, 244, 255, 0.1)",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Typography sx={{ color: "var(--theme-secondary)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.18em" }}>
            Scale Comparison
          </Typography>
          <Typography
            onClick={onClose}
            sx={{ color: "var(--theme-accent)", fontSize: "0.6rem", opacity: 0.5, cursor: "pointer", "&:hover": { opacity: 0.85 } }}
          >
            ESC
          </Typography>
        </Box>

        {/* Subtitle */}
        <Typography sx={{ color: "var(--theme-text)", fontSize: "0.62rem", opacity: 0.65, mb: 2, lineHeight: 1.55 }}>
          Bars are logarithmic — each 10 orders of magnitude is a 10-billion-fold jump. The cyan
          bar is the full SHA-256 keyspace ({totalKeysLog.toFixed(2)} orders of magnitude), the
          orange bar is every Bitcoin address ever used. The chasm between them is why brute
          force is impossible.
        </Typography>

        {/* Bars */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {rows.map((q) => (
            <ComparisonRow
              key={q.id}
              label={q.label}
              note={q.note}
              log10={q.log10}
              color={FLAVOR_COLOR[q.flavor]}
              isKeyspace={q.flavor === "keyspace"}
              currentLog10={currentLog10}
            />
          ))}

          {currentLog10 != null && (
            <ComparisonRow
              label={`Your current view (${labelForView(view)})`}
              note={`~10^${currentLog10.toFixed(1)} keys`}
              log10={currentLog10}
              color="rgba(255, 224, 102, 0.9)"
              isCurrent
              currentLog10={null}
            />
          )}
        </Box>

        {/* Axis */}
        <Box sx={{ position: "relative", height: 24, mt: 1.5, borderTop: "1px solid rgba(77, 244, 255, 0.15)" }}>
          {ticks.map((t) => (
            <Box
              key={t}
              sx={{
                position: "absolute",
                left: `${barPercent(t)}%`,
                top: 0,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Box sx={{ width: 1, height: 4, background: "rgba(77, 244, 255, 0.35)" }} />
              <Typography sx={{ color: "var(--theme-accent)", fontSize: "0.5rem", opacity: 0.6, mt: 0.25 }}>
                {t === 0 ? "10⁰" : `10${superscript(t)}`}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Footnote */}
        <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px solid rgba(77, 244, 255, 0.1)" }}>
          <Typography sx={{ color: "var(--theme-accent)", fontSize: "0.55rem", opacity: 0.55, lineHeight: 1.6 }}>
            Even if every atom in the observable universe checked a billion keys per second
            since the Big Bang, the search would still be only a billionth of one percent done.
            Bitcoin's security rests entirely on this absurd emptiness.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function ComparisonRow({ label, note, log10, color, isKeyspace, isCurrent, currentLog10 }) {
  const pct = barPercent(log10);
  const showCurrentMarker = currentLog10 != null && Math.abs(currentLog10 - log10) < 0.4;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 0.4 }}>
      {/* Label column */}
      <Box sx={{ width: 220, flexShrink: 0, textAlign: "right" }}>
        <Typography
          sx={{
            color: isKeyspace
              ? "var(--theme-secondary)"
              : isCurrent
                ? "rgba(255, 224, 102, 0.95)"
                : "var(--theme-text)",
            fontSize: "0.6rem",
            fontWeight: isKeyspace || isCurrent ? 600 : 400,
            opacity: isKeyspace || isCurrent ? 0.95 : 0.78,
            lineHeight: 1.25,
          }}
        >
          {label}
        </Typography>
        <Typography sx={{ color: "var(--theme-accent)", fontSize: "0.5rem", opacity: 0.55, fontFamily: '"Roboto Mono", monospace' }}>
          {note}
        </Typography>
      </Box>

      {/* Bar column */}
      <Box sx={{ flex: 1, position: "relative", height: 14, background: "rgba(77, 244, 255, 0.04)", borderRadius: 1 }}>
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct}%`,
            background: color,
            borderRadius: 1,
            boxShadow: isKeyspace
              ? "0 0 10px rgba(77, 244, 255, 0.5)"
              : isCurrent
                ? "0 0 8px rgba(255, 224, 102, 0.5)"
                : "none",
            transition: "width 0.2s ease",
          }}
        />
        {showCurrentMarker && (
          <Box
            sx={{
              position: "absolute",
              left: `${barPercent(currentLog10)}%`,
              top: -3,
              bottom: -3,
              width: 2,
              transform: "translateX(-50%)",
              background: "rgba(255, 224, 102, 0.9)",
              boxShadow: "0 0 4px rgba(255, 224, 102, 0.7)",
            }}
          />
        )}
      </Box>
    </Box>
  );
}

function superscript(n) {
  const map = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  return String(n)
    .split("")
    .map((c) => map[c] ?? c)
    .join("");
}

function labelForView(view) {
  const map = {
    galaxy: "Galaxy",
    solarSystem: "Star System",
    planet: "Planet",
    map: "Region",
    sector: "Sector",
    region: "Area",
    area: "Ground",
    ground: "Grain",
    grain: "Molecule",
    molecule: "Atom",
    atom: "Quark",
    quark: "String / Key",
  };
  return map[view] ?? view;
}
