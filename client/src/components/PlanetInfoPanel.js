import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { generatePlanetName, generatePlanetStats } from "../utils/planetStats";
import { getRandomPlanetType } from "../config/planetTypes";
import { KEYS_PER_GALAXY } from "../utils/constants";
import HudWidget, { InfoRow, SectionLabel } from "./HudWidget";

export function PlanetOverviewWidget({ selectedPlanet }) {
  const { galaxyId, starId, planetId } = useParams();
  const planetSeed = `${galaxyId}${starId}${planetId}`;
  const planetType = useMemo(() => getRandomPlanetType(planetSeed), [planetSeed]);
  const proceduralName = useMemo(() => generatePlanetName(planetSeed), [planetSeed]);
  const stats = useMemo(
    () => generatePlanetStats(planetSeed, planetType),
    [planetSeed, planetType]
  );

  if (!selectedPlanet) return null;

  const atmosColor = planetType.atmosphereColor;
  const glowHex = atmosColor ? `#${atmosColor.getHexString()}` : null;

  return (
    <HudWidget glowColor={glowHex}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Box
          sx={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: `#${selectedPlanet.color?.toString(16).padStart(6, "0") ?? "888888"}`,
            boxShadow: glowHex ? `0 0 6px ${glowHex}60` : "none",
            flexShrink: 0,
          }}
        />
        <Box>
          <Typography
            sx={{
              color: "var(--theme-secondary)",
              fontSize: "0.8rem",
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {proceduralName}
          </Typography>
          <Typography sx={{ color: "var(--theme-accent)", fontSize: "0.55rem", opacity: 0.7 }}>
            {selectedPlanet.name ?? planetType.name}
          </Typography>
        </Box>
      </Box>
      <SectionLabel>Physical</SectionLabel>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.2 }}>
        <InfoRow label="Size" value={`${selectedPlanet.size?.toFixed(2) ?? "?"} ER`} />
        <InfoRow label="Gravity" value={stats.gravity} />
        <InfoRow label="Temp" value={stats.surfaceTemp} />
        <InfoRow label="Distance" value={`${selectedPlanet.distance?.toFixed(1) ?? "?"} AU`} />
        <InfoRow label="Orbit" value={stats.orbitalPeriod} />
        <InfoRow label="Rotation" value={stats.rotationPeriod} />
      </Box>
    </HudWidget>
  );
}

export function PlanetDetailWidget({ selectedPlanet }) {
  const { galaxyId, starId, planetId } = useParams();
  const planetSeed = `${galaxyId}${starId}${planetId}`;
  const planetType = useMemo(() => getRandomPlanetType(planetSeed), [planetSeed]);
  const stats = useMemo(
    () => generatePlanetStats(planetSeed, planetType),
    [planetSeed, planetType]
  );

  if (!selectedPlanet) return null;

  const keysPerPlanet = KEYS_PER_GALAXY / BigInt(1000) / BigInt(10);
  const keysExponent = keysPerPlanet.toString().length - 1;
  const galaxyNum = BigInt(galaxyId ?? 0);
  const starNum = BigInt(starId ?? 0);
  const planetNum = BigInt(planetId ?? 0);
  const startKey =
    galaxyNum * KEYS_PER_GALAXY +
    starNum * (KEYS_PER_GALAXY / BigInt(1000)) +
    planetNum * keysPerPlanet;
  const endKey = startKey + keysPerPlanet - BigInt(1);
  const startHex = startKey.toString(16).padStart(64, "0").toUpperCase();
  const endHex = endKey.toString(16).padStart(64, "0").toUpperCase();

  return (
    <>
      {stats.atmosphere && (
        <HudWidget title="Atmosphere">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.2 }}>
            {stats.atmosphere.map((gas) => (
              <InfoRow key={gas.name} label={gas.name} value={`${gas.percentage}%`} />
            ))}
          </Box>
        </HudWidget>
      )}
      <HudWidget title="Keyspace">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
          <InfoRow label="Keys (grains)" value={`~10^${keysExponent}`} />
        </Box>
        <Typography
          sx={{
            color: "var(--theme-accent)",
            fontSize: "0.5rem",
            mt: 0.5,
            opacity: 0.6,
          }}
        >
          Range
        </Typography>
        <Typography
          sx={{
            color: "var(--theme-text)",
            fontSize: "0.45rem",
            fontFamily: '"Roboto Mono", monospace',
            wordBreak: "break-all",
            opacity: 0.5,
            lineHeight: 1.3,
          }}
        >
          {startHex.slice(0, 20)}...
        </Typography>
        <Typography
          sx={{
            color: "var(--theme-text)",
            fontSize: "0.45rem",
            fontFamily: '"Roboto Mono", monospace',
            wordBreak: "break-all",
            opacity: 0.5,
            lineHeight: 1.3,
          }}
        >
          {endHex.slice(0, 20)}...
        </Typography>
      </HudWidget>
    </>
  );
}

export function PlanetHoverWidget({ selectedPlanet }) {
  if (!selectedPlanet) return null;

  return (
    <HudWidget>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: `#${selectedPlanet.color?.toString(16).padStart(6, "0") ?? "888888"}`,
            flexShrink: 0,
          }}
        />
        <Typography
          sx={{ color: "var(--theme-secondary)", fontSize: "0.75rem", fontWeight: 600 }}
        >
          {selectedPlanet.name ?? "Planet"}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.2 }}>
        <InfoRow label="Size" value={`${selectedPlanet.size?.toFixed(2) ?? "?"} ER`} />
        <InfoRow label="Distance" value={`${selectedPlanet.distance?.toFixed(1) ?? "?"} AU`} />
      </Box>
    </HudWidget>
  );
}

export default PlanetOverviewWidget;
