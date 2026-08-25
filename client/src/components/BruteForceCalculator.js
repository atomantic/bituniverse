import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography } from "@mui/material";

// Presets for number of computers
const COMPUTER_PRESETS = [
  { label: "1 laptop", value: 1, rate: 1e6 },
  { label: "1,000 gaming PCs", value: 1000, rate: 1e9 },
  { label: "Bitcoin network", value: 1, rate: 6e20 },
  { label: "All computers on Earth", value: 1e9, rate: 1e12 },
  { label: "Every atom in the universe is a computer", value: 1e80, rate: 1e12 },
];

// 2^256 as a big number string for display, and as log10 for calculations
const KEYSPACE_LOG10 = 77.06; // log10(2^256) ≈ 77.06
const KEYSPACE_DISPLAY = "1.16 × 10⁷⁷";

const AGE_OF_UNIVERSE_SECONDS = 4.35e17; // ~13.8 billion years in seconds

// Format large numbers with scientific notation
function formatSci(n) {
  if (n === 0) return "0";
  if (n === Infinity) return "∞";
  if (n < 1000) return n.toFixed(1);
  if (n < 1e6) return (n / 1e3).toFixed(1) + " thousand";
  if (n < 1e9) return (n / 1e6).toFixed(1) + " million";
  if (n < 1e12) return (n / 1e9).toFixed(1) + " billion";
  if (n < 1e15) return (n / 1e12).toFixed(1) + " trillion";
  const exp = Math.floor(Math.log10(n));
  const mantissa = n / Math.pow(10, exp);
  return `${mantissa.toFixed(2)} × 10^${exp}`;
}

// Format time duration from seconds
function formatTime(seconds) {
  if (!isFinite(seconds)) return "∞";
  if (seconds < 60) return `${seconds.toFixed(1)} seconds`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} minutes`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hours`;
  if (seconds < 3.156e7) return `${(seconds / 86400).toFixed(1)} days`;
  const years = seconds / 3.156e7;
  if (years < 1e6) return `${formatSci(years)} years`;
  return `${formatSci(years)} years`;
}

// Compute ratio as "X universe lifetimes" or percentage
function formatProgress(totalKeysPerSec, elapsedSeconds) {
  // keys checked = rate * time
  // fraction = keys_checked / 2^256
  // We work in log10 to avoid overflow
  const logKeysChecked = Math.log10(totalKeysPerSec) + Math.log10(elapsedSeconds);
  const logFraction = logKeysChecked - KEYSPACE_LOG10;
  if (logFraction < -20) {
    // Express the *percentage* as 10^N (percent = fraction × 100)
    return `10^${(logFraction + 2).toFixed(1)}% (essentially 0%)`;
  }
  const fraction = Math.pow(10, logFraction);
  if (fraction < 0.000001) return `${(fraction * 100).toExponential(2)}%`;
  return `${(fraction * 100).toFixed(6)}%`;
}

export default function BruteForceCalculator({ active, onClose }) {
  const [presetIdx, setPresetIdx] = useState(3); // default: all computers on Earth
  const [customRate, setCustomRate] = useState(null); // null = use preset rate
  const [timeMultiplier, setTimeMultiplier] = useState(1); // multiplier of universe age

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

  const preset = COMPUTER_PRESETS[presetIdx];
  const totalRate = customRate ?? (preset.value * preset.rate);
  const elapsedSeconds = AGE_OF_UNIVERSE_SECONDS * timeMultiplier;

  const results = useMemo(() => {
    // Time to search entire keyspace
    const logTotalTime = KEYSPACE_LOG10 - Math.log10(totalRate);
    const totalTimeSeconds = Math.pow(10, logTotalTime);
    const universesNeeded = totalTimeSeconds / AGE_OF_UNIVERSE_SECONDS;

    // Keys checked in elapsed time
    const keysChecked = totalRate * elapsedSeconds;
    const progress = formatProgress(totalRate, elapsedSeconds);

    // Time to find one specific key (same as total search time / 2 on average)
    const avgTimeToFind = totalTimeSeconds / 2;

    return {
      totalRate,
      totalTimeDisplay: formatTime(totalTimeSeconds),
      universesNeeded: formatSci(universesNeeded),
      keysChecked: formatSci(keysChecked),
      progress,
      avgTimeToFind: formatTime(avgTimeToFind),
    };
  }, [totalRate, elapsedSeconds]);

  if (!active) return null;

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
          width: 520,
          maxWidth: "92vw",
          maxHeight: "85vh",
          overflowY: "auto",
          background: "rgba(10, 6, 30, 0.95)",
          border: "1px solid rgba(77, 244, 255, 0.2)",
          borderRadius: "6px",
          padding: "20px 24px",
          boxShadow: "0 0 40px rgba(77, 244, 255, 0.08)",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Typography sx={{ color: "var(--theme-secondary)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.15em" }}>
            Brute Force Calculator
          </Typography>
          <Typography
            onClick={onClose}
            sx={{ color: "var(--theme-accent)", fontSize: "0.6rem", opacity: 0.5, cursor: "pointer", "&:hover": { opacity: 0.8 } }}
          >
            ESC
          </Typography>
        </Box>

        <Typography sx={{ color: "var(--theme-text)", fontSize: "0.6rem", opacity: 0.6, mb: 2, lineHeight: 1.6 }}>
          How long would it take to find a specific key in the 256-bit keyspace ({KEYSPACE_DISPLAY} total keys)?
          Adjust the computing power and see why brute force is impossible.
        </Typography>

        {/* Computing Power Presets */}
        <SectionHeader>Computing Power</SectionHeader>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
          {COMPUTER_PRESETS.map((p, i) => (
            <PresetButton
              key={i}
              label={p.label}
              active={presetIdx === i && customRate === null}
              onClick={() => { setPresetIdx(i); setCustomRate(null); }}
            />
          ))}
        </Box>

        {/* Rate display */}
        <Box sx={{ mb: 2 }}>
          <ResultRow label="Keys checked per second" value={formatSci(totalRate)} highlight />
        </Box>

        {/* Time Slider */}
        <SectionHeader>Time Elapsed</SectionHeader>
        <Box sx={{ mb: 0.5 }}>
          <input
            type="range"
            min={-2}
            max={70}
            step={0.1}
            value={Math.log10(timeMultiplier)}
            onChange={(e) => setTimeMultiplier(Math.pow(10, parseFloat(e.target.value)))}
            style={{
              width: "100%",
              height: 4,
              accentColor: "#4df4ff",
              cursor: "pointer",
            }}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.25 }}>
            <Typography sx={{ color: "var(--theme-accent)", fontSize: "0.5rem", opacity: 0.5 }}>1 second</Typography>
            <Typography sx={{ color: "var(--theme-accent)", fontSize: "0.5rem", opacity: 0.5 }}>10⁷⁰ universe ages</Typography>
          </Box>
        </Box>
        <Box sx={{ mb: 2 }}>
          <ResultRow label="Time elapsed" value={formatTime(elapsedSeconds)} />
          {timeMultiplier > 1.01 && (
            <ResultRow label="Universe ages" value={`${formatSci(timeMultiplier)}×`} />
          )}
        </Box>

        {/* Results */}
        <SectionHeader>Results</SectionHeader>
        <Box sx={{
          background: "rgba(77, 244, 255, 0.03)",
          border: "1px solid rgba(77, 244, 255, 0.1)",
          borderRadius: "4px",
          padding: "10px 12px",
          mb: 2,
        }}>
          <ResultRow label="Keys checked" value={results.keysChecked} />
          <ResultRow label="Keyspace covered" value={results.progress} highlight />
          <Box sx={{ height: 6, background: "rgba(77, 244, 255, 0.08)", borderRadius: 3, my: 0.75, overflow: "hidden" }}>
            {/* The bar will always be invisibly thin — that's the point.
                The +2 in the exponent converts the keyspace fraction to a percent. */}
            <Box sx={{
              height: "100%",
              width: `${Math.min(Math.pow(10, Math.log10(totalRate) + Math.log10(elapsedSeconds) - KEYSPACE_LOG10 + 2), 100)}%`,
              minWidth: results.progress !== "0%" ? 1 : 0,
              background: "var(--theme-secondary)",
              borderRadius: 3,
              transition: "width 0.3s",
            }} />
          </Box>
          <ResultRow label="Time to search all keys" value={results.totalTimeDisplay} />
          <ResultRow label="That's about" value={`${results.universesNeeded} universe lifetimes`} />
        </Box>

        {/* Insight */}
        <Box sx={{
          background: "rgba(255, 200, 50, 0.04)",
          border: "1px solid rgba(255, 200, 50, 0.12)",
          borderRadius: "4px",
          padding: "10px 12px",
        }}>
          <Typography sx={{ color: "#ffc832", fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.12em", mb: 0.5, opacity: 0.8 }}>
            Insight
          </Typography>
          <Typography sx={{ color: "var(--theme-text)", fontSize: "0.55rem", lineHeight: 1.6, opacity: 0.85 }}>
            {getInsight(totalRate, timeMultiplier)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function getInsight(totalRate, timeMultiplier) {
  const logRate = Math.log10(totalRate);
  const logTime = Math.log10(timeMultiplier * AGE_OF_UNIVERSE_SECONDS);
  const logChecked = logRate + logTime;
  const logDeficit = KEYSPACE_LOG10 - logChecked;

  if (logDeficit > 60) {
    return "Even with this immense computing power, you haven't made a dent. The keyspace is so vast that meaningful progress is physically impossible — there aren't enough atoms in the universe to build enough computers.";
  }
  if (logDeficit > 40) {
    return "You'd need to mass-produce computers from every atom in every galaxy and run them for billions of universe lifetimes. SHA-256's security isn't based on technology — it's based on physics.";
  }
  if (logDeficit > 20) {
    return "Getting closer conceptually, but still impossibly far. Even if computing power doubled every year, it would take centuries of doublings before this becomes feasible.";
  }
  if (logDeficit > 5) {
    return "You're in fantasy territory — computing at rates that violate thermodynamic limits. The Landauer limit means each bit operation requires minimum energy; at this rate you'd need more energy than the Sun produces.";
  }
  if (logDeficit > 0) {
    return "At this absurd, physics-breaking rate, you're approaching coverage. But in reality, no civilization could ever achieve this — it requires more energy than exists in the observable universe.";
  }
  return "You've exceeded the keyspace — but only by assuming impossible physics. In the real universe, Bitcoin's 256-bit keys remain absolutely unbreakable by brute force.";
}

function SectionHeader({ children }) {
  return (
    <Typography sx={{
      color: "var(--theme-secondary)",
      fontSize: "0.55rem",
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      mb: 0.5,
      opacity: 0.7,
    }}>
      {children}
    </Typography>
  );
}

function ResultRow({ label, value, highlight }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.3 }}>
      <Typography sx={{ color: "var(--theme-accent)", fontSize: "0.55rem", opacity: 0.7 }}>{label}</Typography>
      <Typography sx={{
        color: highlight ? "var(--theme-secondary)" : "var(--theme-text)",
        fontSize: "0.55rem",
        fontFamily: '"Roboto Mono", monospace',
        textAlign: "right",
      }}>
        {value}
      </Typography>
    </Box>
  );
}

function PresetButton({ label, active, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        padding: "5px 10px",
        minHeight: 40,
        display: "flex",
        alignItems: "center",
        background: active ? "rgba(77, 244, 255, 0.12)" : "rgba(77, 244, 255, 0.03)",
        border: `1px solid ${active ? "rgba(77, 244, 255, 0.35)" : "rgba(77, 244, 255, 0.1)"}`,
        borderRadius: "4px",
        cursor: "pointer",
        transition: "all 0.15s",
        "&:hover": { background: "rgba(77, 244, 255, 0.08)", borderColor: "rgba(77, 244, 255, 0.25)" },
      }}
    >
      <Typography sx={{
        color: active ? "var(--theme-secondary)" : "var(--theme-text)",
        fontSize: "0.5rem",
        whiteSpace: "nowrap",
      }}>
        {label}
      </Typography>
    </Box>
  );
}
