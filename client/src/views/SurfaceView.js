import React, { useRef, useMemo, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import { useParams, useNavigate } from "react-router-dom";
import { getRandomPlanetType, generatePlanetColor, hashString } from "../config/planetTypes";
import { ORBIT_CONTROLS } from "../config/renderConfig";
import { KEYS_PER_GALAXY } from "../utils/constants";
import { generatePlanetName } from "../utils/planetStats";

// Simple fBm for terrain height
function noise2D(x, y, seed) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.12) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
}

function fbm2D(x, y, seed, octaves = 6) {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(x * frequency, y * frequency, seed + i * 17);
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value / maxValue;
}

const GRID_SIZE = 50;
const GRAIN_COUNT = 2000;
const GRAIN_RADIUS = 0.08;

function TerrainSurface({ seed, planetType }) {
  const seedVal = hashString(seed);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE, 128, 128);
    const vertices = geo.attributes.position.array;

    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const height = fbm2D(x * 0.1, y * 0.1, seedVal, planetType?.noiseOctaves ?? 5) * 3;
      vertices[i + 2] = height;
    }

    geo.computeVertexNormals();
    return geo;
  }, [seedVal, planetType]);

  const color = useMemo(() => {
    const palette = planetType?.colorPalette;
    return palette?.mid ?? new THREE.Color("#6B5B3A");
  }, [planetType]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} flatShading />
    </mesh>
  );
}

function Grains({ seed, planetType, onGrainHover }) {
  const meshRef = useRef();
  const seedVal = hashString(seed);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(GRAIN_COUNT * 3);
    const col = new Float32Array(GRAIN_COUNT * 3);
    const palette = planetType?.colorPalette;

    for (let i = 0; i < GRAIN_COUNT; i++) {
      const grainSeed = seedVal + i * 7919;
      const x = ((hashString(`${grainSeed}x`) % 1000) / 1000 - 0.5) * (GRID_SIZE - 4);
      const z = ((hashString(`${grainSeed}z`) % 1000) / 1000 - 0.5) * (GRID_SIZE - 4);
      const y = fbm2D(x * 0.1, z * 0.1, seedVal, planetType?.noiseOctaves ?? 5) * 3 + GRAIN_RADIUS;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Slight color variation per grain
      const variation = (hashString(`${grainSeed}c`) % 100) / 500;
      const baseColor = palette?.high ?? new THREE.Color("#C4A87A");
      col[i * 3] = baseColor.r + variation;
      col[i * 3 + 1] = baseColor.g + variation;
      col[i * 3 + 2] = baseColor.b + variation;
    }

    return { positions: pos, colors: col };
  }, [seedVal, planetType]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const grainGeometry = useMemo(() => new THREE.SphereGeometry(GRAIN_RADIUS, 8, 8), []);
  const grainMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.3 }),
    []
  );

  // Set instance matrices
  React.useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < GRAIN_COUNT; i++) {
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(
        i,
        new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2])
      );
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor.needsUpdate = true;
  }, [positions, colors, dummy]);

  const { raycaster, pointer, camera } = useThree();
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useFrame(() => {
    if (!meshRef.current) return;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(meshRef.current);
    if (intersects.length > 0) {
      const idx = intersects[0].instanceId;
      if (idx !== hoveredIdx) {
        setHoveredIdx(idx);
        onGrainHover?.(idx);
      }
    } else if (hoveredIdx !== null) {
      setHoveredIdx(null);
      onGrainHover?.(null);
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[grainGeometry, grainMaterial, GRAIN_COUNT]}
    />
  );
}

function GrainTooltipHtml({ grainIndex, seed, galaxyId, starId, planetId }) {
  if (grainIndex === null) return null;

  const keysPerPlanet = KEYS_PER_GALAXY / BigInt(1000) / BigInt(10);
  const planetStart =
    BigInt(galaxyId) * KEYS_PER_GALAXY +
    BigInt(starId) * (KEYS_PER_GALAXY / BigInt(1000)) +
    BigInt(planetId) * keysPerPlanet;
  const grainKey = planetStart + BigInt(grainIndex);
  const hexKey = grainKey.toString(16).padStart(64, "0").toUpperCase();

  return (
    <Html center style={{ pointerEvents: "none" }} position={[0, -8, 0]}>
      <div
        style={{
          background: "rgba(42, 27, 80, 0.95)",
          border: "1px solid rgba(77, 244, 255, 0.3)",
          borderRadius: 8,
          padding: "12px 16px",
          maxWidth: 500,
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ color: "#4df4ff", fontSize: "0.8rem", marginBottom: 4 }}>
          Grain #{grainIndex.toLocaleString()}
        </div>
        <div
          style={{
            color: "#e0e0e0",
            fontSize: "0.6rem",
            fontFamily: "monospace",
            wordBreak: "break-all",
            whiteSpace: "normal",
            maxWidth: 400,
            opacity: 0.8,
          }}
        >
          {hexKey}
        </div>
        <div style={{ color: "#a999b3", fontSize: "0.7rem", marginTop: 6 }}>
          Has this key been used? No.
        </div>
      </div>
    </Html>
  );
}

function SurfaceInfoHtml({ planetSeed, planetType, galaxyId, starId, planetId, hoveredGrain }) {
  const navigate = useNavigate();
  const planetName = useMemo(() => generatePlanetName(planetSeed), [planetSeed]);

  const keysPerPlanet = KEYS_PER_GALAXY / BigInt(1000) / BigInt(10);
  const keysStr = keysPerPlanet.toString();
  const keysExponent = keysStr.length - 1;

  return (
    <Html
      style={{ pointerEvents: "auto" }}
      position={[20, 10, 0]}
      distanceFactor={undefined}
      transform={false}
      portal={undefined}
      fullscreen
    >
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          padding: 16,
          background: "rgba(42, 27, 80, 0.92)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(77, 244, 255, 0.3)",
          boxShadow: "0 0 15px rgba(77, 200, 255, 0.2)",
          borderRadius: 4,
          maxWidth: 300,
          minWidth: 240,
          fontFamily: '"Roboto Mono", monospace',
        }}
      >
        {/* Breadcrumb */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, fontSize: "0.75rem" }}>
          <span
            style={{ color: "#4df4ff", cursor: "pointer" }}
            onClick={() => navigate(`/galaxy/${galaxyId}`)}
          >
            Galaxy
          </span>
          <span style={{ color: "#a999b3" }}>/</span>
          <span
            style={{ color: "#4df4ff", cursor: "pointer" }}
            onClick={() => navigate(`/galaxy/${galaxyId}/star/${starId}`)}
          >
            Star
          </span>
          <span style={{ color: "#a999b3" }}>/</span>
          <span
            style={{ color: "#4df4ff", cursor: "pointer" }}
            onClick={() => navigate(`/galaxy/${galaxyId}/star/${starId}/planet/${planetId}`)}
          >
            {planetName}
          </span>
          <span style={{ color: "#a999b3" }}>/</span>
          <span style={{ color: "#4df4ff" }}>Surface</span>
        </div>

        <div style={{ color: "#4df4ff", fontSize: "0.9rem", marginBottom: 8 }}>
          Surface of {planetName}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#a999b3", fontSize: "0.8rem" }}>Type:</span>
            <span style={{ color: "#e0e0e0", fontSize: "0.8rem" }}>{planetType?.name ?? "Unknown"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#a999b3", fontSize: "0.8rem" }}>Visible Grains:</span>
            <span style={{ color: "#e0e0e0", fontSize: "0.8rem" }}>{GRAIN_COUNT.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#a999b3", fontSize: "0.8rem" }}>Total Grains:</span>
            <span style={{ color: "#e0e0e0", fontSize: "0.8rem" }}>~10^{keysExponent}</span>
          </div>
        </div>

        {hoveredGrain !== null && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(77, 244, 255, 0.15)" }}>
            <span style={{ color: "#4df4ff", fontSize: "0.75rem" }}>
              Grain #{hoveredGrain.toLocaleString()}
            </span>
          </div>
        )}

        <button
          onClick={() => navigate(`/galaxy/${galaxyId}/star/${starId}/planet/${planetId}`)}
          style={{
            marginTop: 12,
            padding: "6px 12px",
            background: "transparent",
            border: "1px solid rgba(77, 244, 255, 0.3)",
            color: "#4df4ff",
            fontSize: "0.7rem",
            fontFamily: '"Roboto Mono", monospace',
            cursor: "pointer",
            borderRadius: 4,
          }}
        >
          Back to Planet
        </button>
      </div>
    </Html>
  );
}

export default function SurfaceView({ onPlanetHover }) {
  const { galaxyId, starId, planetId } = useParams();
  const [hoveredGrain, setHoveredGrain] = useState(null);

  const planetSeed = `${galaxyId}${starId}${planetId}`;
  const planetType = useMemo(() => getRandomPlanetType(planetSeed), [planetSeed]);

  return (
    <>
      <OrbitControls
        {...ORBIT_CONTROLS}
        minDistance={2}
        maxDistance={80}
        target={[0, 0, 0]}
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        zoomSpeed={1.5}
        dampingFactor={0.05}
      />
      <ambientLight intensity={0.4} />
      <directionalLight position={[-5, 8, 5]} intensity={1.2} castShadow />
      <Stars radius={500} depth={25} count={2000} factor={2} saturation={1} fade speed={0} />
      <TerrainSurface seed={planetSeed} planetType={planetType} />
      <Grains
        seed={planetSeed}
        planetType={planetType}
        onGrainHover={setHoveredGrain}
      />
      <GrainTooltipHtml
        grainIndex={hoveredGrain}
        seed={planetSeed}
        galaxyId={galaxyId}
        starId={starId}
        planetId={planetId}
      />
      <SurfaceInfoHtml
        planetSeed={planetSeed}
        planetType={planetType}
        galaxyId={galaxyId}
        starId={starId}
        planetId={planetId}
        hoveredGrain={hoveredGrain}
      />
    </>
  );
}
