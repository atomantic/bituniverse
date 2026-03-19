import React, { useMemo } from "react";
import { Box, Typography, Paper } from "@mui/material";
import { useParams } from "react-router-dom";
import BreadcrumbNav from "./BreadcrumbNav";
import { generatePlanetName, generatePlanetStats } from "../utils/planetStats";
import { PLANET_TYPES, getRandomPlanetType } from "../config/planetTypes";
import { KEYS_PER_GALAXY } from "../utils/constants";

function InfoRow({ label, value }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
      <Typography component="span" sx={{ color: "var(--theme-accent)", fontSize: "0.8rem" }}>
        {label}
      </Typography>
      <Typography component="span" sx={{ color: "var(--theme-text)", fontSize: "0.8rem", textAlign: "right" }}>
        {value}
      </Typography>
    </Box>
  );
}

function SectionHeader({ children }) {
  return (
    <Typography
      component="h6"
      sx={{
        color: "var(--theme-secondary)",
        fontSize: "0.75rem",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        mt: 1.5,
        mb: 0.5,
        borderBottom: "1px solid rgba(77, 244, 255, 0.15)",
        pb: 0.5,
      }}
    >
      {children}
    </Typography>
  );
}

export default function PlanetInfoPanel({ selectedPlanet }) {
  const { galaxyId, starId, planetId } = useParams();

  const planetSeed = `${galaxyId}${starId}${planetId}`;
  const planetType = useMemo(() => getRandomPlanetType(planetSeed), [planetSeed]);

  const proceduralName = useMemo(
    () => generatePlanetName(planetSeed),
    [planetSeed]
  );

  const stats = useMemo(
    () => generatePlanetStats(planetSeed, planetType),
    [planetSeed, planetType]
  );

  if (!selectedPlanet) return null;

  const breadcrumbItems = [
    { label: "Galaxy", path: `/galaxy/${galaxyId}` },
    { label: "Star", path: `/galaxy/${galaxyId}/star/${starId}` },
    { label: proceduralName },
  ];

  // Keyspace calculations
  const keysPerPlanet = KEYS_PER_GALAXY / BigInt(1000) / BigInt(10); // galaxy -> stars -> planets
  const keysPerPlanetStr = keysPerPlanet.toString();
  const keysExponent = keysPerPlanetStr.length - 1;

  // Hex key range
  const galaxyNum = BigInt(galaxyId ?? 0);
  const starNum = BigInt(starId ?? 0);
  const planetNum = BigInt(planetId ?? 0);
  const startKey = galaxyNum * KEYS_PER_GALAXY + starNum * (KEYS_PER_GALAXY / BigInt(1000)) + planetNum * keysPerPlanet;
  const endKey = startKey + keysPerPlanet - BigInt(1);
  const startHex = startKey.toString(16).padStart(64, "0").toUpperCase();
  const endHex = endKey.toString(16).padStart(64, "0").toUpperCase();

  // Atmosphere color for glow border
  const atmosColor = planetType.atmosphereColor;
  const glowHex = atmosColor ? `#${atmosColor.getHexString()}` : "rgba(77, 244, 255, 0.3)";

  return (
    <Paper
      sx={{
        position: "absolute",
        top: 20,
        right: 20,
        padding: 2,
        background: "rgba(42, 27, 80, 0.92)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${glowHex}40`,
        boxShadow: `0 0 20px ${glowHex}30`,
        animation: "fadeIn 0.3s ease-out",
        maxWidth: 340,
        minWidth: 280,
      }}
    >
      <BreadcrumbNav items={breadcrumbItems} />

      {/* Overview Section */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: `#${selectedPlanet.color?.toString(16).padStart(6, "0") ?? "888888"}`,
            boxShadow: `0 0 8px ${glowHex}60`,
            flexShrink: 0,
          }}
        />
        <Box>
          <Typography component="h5" sx={{ color: "var(--theme-secondary)", fontSize: "1rem", fontWeight: 600 }}>
            {proceduralName}
          </Typography>
          <Typography component="span" sx={{ color: "var(--theme-accent)", fontSize: "0.75rem" }}>
            {selectedPlanet.name ?? planetType.name}
          </Typography>
        </Box>
      </Box>

      {/* Physical Section */}
      <SectionHeader>Physical</SectionHeader>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <InfoRow label="Size" value={`${selectedPlanet.size?.toFixed(2) ?? "?"} Earth Radii`} />
        <InfoRow label="Gravity" value={stats.gravity} />
        <InfoRow label="Surface Temp" value={stats.surfaceTemp} />
        <InfoRow label="Distance" value={`${selectedPlanet.distance?.toFixed(2) ?? "?"} AU`} />
        <InfoRow label="Orbital Period" value={stats.orbitalPeriod} />
        <InfoRow label="Rotation" value={stats.rotationPeriod} />
      </Box>

      {/* Atmosphere Section */}
      {stats.atmosphere && (
        <>
          <SectionHeader>Atmosphere</SectionHeader>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
            {stats.atmosphere.map((gas) => (
              <InfoRow key={gas.name} label={gas.name} value={`${gas.percentage}%`} />
            ))}
          </Box>
        </>
      )}

      {/* Keyspace Section */}
      <SectionHeader>Keyspace</SectionHeader>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <InfoRow label="Keys (grains)" value={`~10^${keysExponent}`} />
        <Box sx={{ mt: 0.5 }}>
          <Typography component="span" sx={{ color: "var(--theme-accent)", fontSize: "0.65rem" }}>
            Range Start:
          </Typography>
          <Typography
            component="div"
            sx={{
              color: "var(--theme-text)",
              fontSize: "0.55rem",
              fontFamily: "monospace",
              wordBreak: "break-all",
              opacity: 0.7,
            }}
          >
            {startHex.slice(0, 32)}...
          </Typography>
        </Box>
        <Box>
          <Typography component="span" sx={{ color: "var(--theme-accent)", fontSize: "0.65rem" }}>
            Range End:
          </Typography>
          <Typography
            component="div"
            sx={{
              color: "var(--theme-text)",
              fontSize: "0.55rem",
              fontFamily: "monospace",
              wordBreak: "break-all",
              opacity: 0.7,
            }}
          >
            {endHex.slice(0, 32)}...
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
