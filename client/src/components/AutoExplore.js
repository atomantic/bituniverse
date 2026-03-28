import React, { useEffect, useRef, useCallback, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { TOTAL_KEYS, KEYS_PER_GALAXY } from "../utils/constants";
import {
  VISIBLE_REGIONS,
  VISIBLE_SECTORS,
  VISIBLE_AREAS,
  VISIBLE_GROUNDS,
  VISIBLE_GRAINS,
  VISIBLE_MOLECULES,
  VISIBLE_ATOMS,
  VISIBLE_QUARKS,
  VISIBLE_STRINGS,
} from "../utils/keyspaceHierarchy";

// Steps the auto-explorer takes, with pause duration (ms) at each
const EXPLORE_STEPS = [
  { level: "galaxy",      pause: 4000, label: "Galaxy" },
  { level: "solarSystem", pause: 3500, label: "Star System" },
  { level: "planet",      pause: 3500, label: "Planet" },
  { level: "map",         pause: 3000, label: "Globe Region" },
  { level: "sector",      pause: 3000, label: "Continent" },
  { level: "region",      pause: 3000, label: "Region" },
  { level: "area",        pause: 3000, label: "Area" },
  { level: "ground",      pause: 3000, label: "Ground" },
  { level: "grain",       pause: 3000, label: "Grain" },
  { level: "molecule",    pause: 3000, label: "Molecule" },
  { level: "atom",        pause: 3000, label: "Atom" },
  { level: "quark",       pause: 5000, label: "Quark (Key Level)" },
];

const TOTAL_GALAXIES = Number(TOTAL_KEYS / KEYS_PER_GALAXY);

// Random int in [0, max)
function randInt(max) {
  return Math.floor(Math.random() * max);
}

// Visible count caps for each deep zoom level
const DEEP_VISIBLE = [
  VISIBLE_REGIONS,
  VISIBLE_SECTORS,
  VISIBLE_AREAS,
  VISIBLE_GROUNDS,
  VISIBLE_GRAINS,
  VISIBLE_MOLECULES,
  VISIBLE_ATOMS,
  VISIBLE_QUARKS,
  VISIBLE_STRINGS,
];

// Build the URL path for a given step index using the stored random choices
function buildPathForStep(stepIdx, choices) {
  if (stepIdx === 0) return `/galaxy/${choices.galaxyId}`;
  if (stepIdx === 1) return `/galaxy/${choices.galaxyId}/star/${choices.starId}`;
  if (stepIdx === 2) return `/galaxy/${choices.galaxyId}/star/${choices.starId}/planet/${choices.planetId}`;

  // Deep zoom levels (steps 3-11)
  const segments = ["region", "sector", "area", "ground", "grain", "molecule", "atom", "quark", "string"];
  let path = `/galaxy/${choices.galaxyId}/star/${choices.starId}/planet/${choices.planetId}`;
  const deepIdx = stepIdx - 3;
  for (let i = 0; i <= deepIdx; i++) {
    path += `/${segments[i]}/${choices.deepIds[i]}`;
  }
  return path;
}

export default function AutoExplore({ active, onClose }) {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const activeRef = useRef(active);
  const [currentStep, setCurrentStep] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const choicesRef = useRef(null);

  // Keep activeRef in sync
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Generate random choices for one full cycle
  const generateChoices = useCallback(() => {
    const choices = {
      galaxyId: randInt(TOTAL_GALAXIES),
      starId: randInt(1000),
      planetId: randInt(10),
      deepIds: DEEP_VISIBLE.map((max) => randInt(max)),
    };
    choicesRef.current = choices;
    return choices;
  }, []);

  // Advance to the next step
  const advanceStep = useCallback(() => {
    if (!activeRef.current) return;

    setCurrentStep((prev) => {
      const next = prev + 1;

      if (next >= EXPLORE_STEPS.length) {
        // Cycle complete — generate new random path and start over
        setCycleCount((c) => c + 1);
        const choices = generateChoices();
        const path = buildPathForStep(0, choices);
        navigate(path);
        // Schedule next advance
        timerRef.current = setTimeout(() => advanceStep(), EXPLORE_STEPS[0].pause);
        return 0;
      }

      // Navigate to next step
      const path = buildPathForStep(next, choicesRef.current);
      navigate(path);
      // Schedule next advance
      timerRef.current = setTimeout(() => advanceStep(), EXPLORE_STEPS[next].pause);
      return next;
    });
  }, [navigate, generateChoices]);

  // Start/stop the auto-explore loop
  useEffect(() => {
    if (active) {
      // Start: generate choices and navigate to the first step
      const choices = generateChoices();
      setCurrentStep(0);
      setCycleCount(0);
      const path = buildPathForStep(0, choices);
      navigate(path);
      timerRef.current = setTimeout(() => advanceStep(), EXPLORE_STEPS[0].pause);
    } else {
      // Stop
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [active, navigate, generateChoices, advanceStep]);

  // Close on Escape or any non-modifier keypress
  useEffect(() => {
    if (!active) return;
    const handleKey = (e) => {
      // Let Escape and 'a' close auto-explore
      if (e.key === "Escape" || e.key.toLowerCase() === "a") {
        e.stopPropagation();
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [active, onClose]);

  if (!active) return null;

  const step = EXPLORE_STEPS[currentStep];
  const progress = ((currentStep + 1) / EXPLORE_STEPS.length) * 100;

  return (
    <Box
      sx={{
        position: "absolute",
        top: 44,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
      }}
    >
      {/* Main indicator */}
      <Box
        onClick={onClose}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          padding: "6px 16px",
          background: "rgba(10, 6, 30, 0.9)",
          border: "1px solid rgba(77, 244, 255, 0.25)",
          borderRadius: "20px",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          transition: "border-color 0.3s",
          "&:hover": { borderColor: "rgba(77, 244, 255, 0.5)" },
        }}
      >
        {/* Pulsing dot */}
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--theme-secondary)",
            boxShadow: "0 0 8px var(--theme-glow-secondary)",
            animation: "autoExplorePulse 2s ease-in-out infinite",
            "@keyframes autoExplorePulse": {
              "0%, 100%": { opacity: 0.4, transform: "scale(0.8)" },
              "50%": { opacity: 1, transform: "scale(1.2)" },
            },
          }}
        />
        <Typography
          sx={{
            color: "var(--theme-secondary)",
            fontSize: "0.55rem",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            fontWeight: 500,
          }}
        >
          Auto-Explore
        </Typography>
        <Typography
          sx={{
            color: "var(--theme-accent)",
            fontSize: "0.5rem",
            opacity: 0.6,
          }}
        >
          {step.label}
        </Typography>
        {cycleCount > 0 && (
          <Typography
            sx={{
              color: "var(--theme-accent)",
              fontSize: "0.45rem",
              opacity: 0.4,
            }}
          >
            #{cycleCount + 1}
          </Typography>
        )}
        <Typography
          sx={{
            color: "var(--theme-accent)",
            fontSize: "0.45rem",
            opacity: 0.4,
          }}
        >
          [A] stop
        </Typography>
      </Box>

      {/* Progress bar */}
      <Box
        sx={{
          width: 160,
          height: 2,
          background: "rgba(77, 244, 255, 0.1)",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: `${progress}%`,
            height: "100%",
            background: "var(--theme-secondary)",
            borderRadius: 1,
            transition: "width 0.5s ease",
            boxShadow: "0 0 4px var(--theme-glow-secondary)",
          }}
        />
      </Box>
    </Box>
  );
}
