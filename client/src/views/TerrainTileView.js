import React, { useRef, useMemo, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import { useParams, useNavigate } from "react-router-dom";
import { hashString } from "../config/planetTypes";
import { ORBIT_CONTROLS } from "../config/renderConfig";

function noise2D(x, y, seed) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.12) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
}

function fbm2D(x, y, seed, octaves = 6) {
  let value = 0, amplitude = 1, frequency = 1, maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(x * frequency, y * frequency, seed + i * 17);
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value / maxValue;
}

// Route path builders for each level
const ROUTE_BUILDERS = {
  sector: (params, childIdx) =>
    `/galaxy/${params.galaxyId}/star/${params.starId}/planet/${params.planetId}/region/${params.regionId}/sector/${params.sectorId}/area/${childIdx}`,
  area: (params, childIdx) =>
    `/galaxy/${params.galaxyId}/star/${params.starId}/planet/${params.planetId}/region/${params.regionId}/sector/${params.sectorId}/area/${params.areaId}/ground/${childIdx}`,
  ground: (params, childIdx) =>
    `/galaxy/${params.galaxyId}/star/${params.starId}/planet/${params.planetId}/region/${params.regionId}/sector/${params.sectorId}/area/${params.areaId}/ground/${params.groundId}/grain/${childIdx}`,
};

const SEED_BUILDERS = {
  sector: (params) => `${params.galaxyId}${params.starId}${params.planetId}r${params.regionId}s${params.sectorId}`,
  area: (params) => `${params.galaxyId}${params.starId}${params.planetId}r${params.regionId}s${params.sectorId}a${params.areaId}`,
  ground: (params) => `${params.galaxyId}${params.starId}${params.planetId}r${params.regionId}s${params.sectorId}a${params.areaId}g${params.groundId}`,
};

// Biome palettes per zoom level (more granular = more detail)
const LEVEL_PALETTES = {
  sector: [
    { name: "meadow",    color: [0.28, 0.48, 0.18], heightMin: 0.1 },
    { name: "dense wood", color: [0.14, 0.30, 0.10], heightMin: 0.25 },
    { name: "clearing",  color: [0.38, 0.50, 0.25], heightMin: 0.08 },
    { name: "stream",    color: [0.10, 0.25, 0.50], heightMin: -0.1 },
    { name: "rocky",     color: [0.40, 0.35, 0.28], heightMin: 0.35 },
    { name: "scrub",     color: [0.45, 0.42, 0.22], heightMin: 0.15 },
  ],
  area: [
    { name: "soil",      color: [0.40, 0.32, 0.20], heightMin: 0.05 },
    { name: "moss",      color: [0.20, 0.38, 0.15], heightMin: 0.08 },
    { name: "pebbles",   color: [0.50, 0.47, 0.40], heightMin: 0.12 },
    { name: "mud",       color: [0.30, 0.25, 0.15], heightMin: 0.02 },
    { name: "leaf litter",color:[0.35, 0.28, 0.12], heightMin: 0.06 },
    { name: "clay",      color: [0.55, 0.38, 0.22], heightMin: 0.04 },
  ],
  ground: [
    { name: "fine sand",  color: [0.72, 0.65, 0.48], heightMin: 0.02 },
    { name: "coarse sand",color:[0.60, 0.52, 0.35], heightMin: 0.04 },
    { name: "gravel",    color: [0.50, 0.48, 0.42], heightMin: 0.06 },
    { name: "silt",      color: [0.45, 0.40, 0.30], heightMin: 0.01 },
    { name: "loam",      color: [0.38, 0.30, 0.18], heightMin: 0.03 },
    { name: "mineral",   color: [0.55, 0.55, 0.50], heightMin: 0.05 },
  ],
};

const CHILD_LABELS = { sector: "Area", area: "Ground", ground: "Grain" };

// Create hex geometry
function createHexGeo(radius, depth) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function hexToWorld(col, row, hexRadius, gap, cols, rows) {
  const w = (hexRadius + gap) * 2;
  const h = hexRadius * Math.sqrt(3) + gap;
  const x = col * w * 0.75;
  const z = row * h + (col % 2 === 1 ? h * 0.5 : 0);
  const cx = ((cols - 1) * w * 0.75) / 2;
  const cz = ((rows - 1) * h + h * 0.5) / 2;
  return [x - cx, z - cz];
}

export default function TerrainTileView({
  level,
  gridCols = 20,
  gridRows = 10,
  hexRadius = 1.0,
  hexDepth = 0.25,
  cameraHeight = 30,
  noiseScale = 0.08,
  noiseOctaves = 5,
  heightScale = 0.4,
  onChildHover,
}) {
  const params = useParams();
  const navigate = useNavigate();
  const meshRef = useRef();
  const cellCount = gridCols * gridRows;
  const seed = SEED_BUILDERS[level]?.(params) ?? "default";
  const seedVal = hashString(seed);
  const gap = 0.04;
  const palette = LEVEL_PALETTES[level] || LEVEL_PALETTES.sector;
  const childLabel = CHILD_LABELS[level] || "Zone";

  const hexGeo = useMemo(() => createHexGeo(hexRadius, hexDepth), [hexRadius, hexDepth]);
  const hexMat = useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.05, flatShading: true }),
    []
  );

  const hexData = useMemo(() => {
    const data = [];
    for (let col = 0; col < gridCols; col++) {
      for (let row = 0; row < gridRows; row++) {
        const [wx, wz] = hexToWorld(col, row, hexRadius, gap, gridCols, gridRows);
        const n = fbm2D(wx * noiseScale, wz * noiseScale, seedVal, noiseOctaves);
        const biomeIdx = Math.floor(((n + 1) / 2) * palette.length) % palette.length;
        const biome = palette[biomeIdx];
        const height = biome.heightMin + Math.abs(n) * heightScale;
        data.push({ col, row, wx, wz, biome, height, n });
      }
    }
    return data;
  }, [seedVal, gridCols, gridRows, hexRadius, gap, noiseScale, noiseOctaves, heightScale, palette]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  React.useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < cellCount; i++) {
      const d = hexData[i];
      dummy.position.set(d.wx, d.height, d.wz);
      const scaleY = 0.5 + d.height * 1.5;
      dummy.scale.set(1, Math.max(0.3, scaleY), 1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      const v = (hashString(`${seedVal}h${i}`) % 100) / 800;
      const [r, g, b] = d.biome.color;
      meshRef.current.setColorAt(i, new THREE.Color(r + v, g + v, b + v));
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor.needsUpdate = true;
  }, [hexData, seedVal, cellCount, dummy]);

  const { raycaster, pointer, camera } = useThree();
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useFrame(() => {
    if (!meshRef.current) return;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(meshRef.current);
    if (intersects.length > 0) {
      const idx = intersects[0].instanceId;
      if (idx !== hoveredIdx) { setHoveredIdx(idx); onChildHover?.(idx); document.body.style.cursor = "pointer"; }
    } else if (hoveredIdx !== null) { setHoveredIdx(null); onChildHover?.(null); document.body.style.cursor = "default"; }
  });

  // Recolor only the affected tiles when hover changes — not every tile every frame
  const prevHoveredRef = React.useRef(null);
  React.useEffect(() => {
    if (!meshRef.current || !meshRef.current.instanceColor) {
      prevHoveredRef.current = hoveredIdx;
      return;
    }
    const colorFor = (i, highlighted) => {
      const [r, g, b] = hexData[i].biome.color;
      const v = (hashString(`${seedVal}h${i}`) % 100) / 800;
      return highlighted
        ? new THREE.Color(Math.min(1, r + 0.3), Math.min(1, g + 0.3), Math.min(1, b + 0.3))
        : new THREE.Color(r + v, g + v, b + v);
    };
    const prev = prevHoveredRef.current;
    if (prev !== null && prev !== hoveredIdx && hexData[prev]) {
      meshRef.current.setColorAt(prev, colorFor(prev, false));
    }
    if (hoveredIdx !== null && hexData[hoveredIdx]) {
      meshRef.current.setColorAt(hoveredIdx, colorFor(hoveredIdx, true));
    }
    prevHoveredRef.current = hoveredIdx;
    meshRef.current.instanceColor.needsUpdate = true;
  }, [hoveredIdx, hexData, seedVal]);

  React.useEffect(() => { return () => { document.body.style.cursor = "default"; }; }, []);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      const idx = e.instanceId;
      if (idx == null) return;
      const buildRoute = ROUTE_BUILDERS[level];
      if (buildRoute) navigate(buildRoute(params, idx));
    },
    [navigate, params, level]
  );

  return (
    <>
      <OrbitControls
        {...ORBIT_CONTROLS}
        minDistance={4}
        maxDistance={cameraHeight * 1.5}
        target={[0, 0, 0]}
        enableZoom
        enablePan
        enableRotate
        dampingFactor={0.05}
        maxPolarAngle={Math.PI * 0.45}
      />
      <ambientLight intensity={0.45} />
      <directionalLight position={[-8, cameraHeight * 0.6, 8]} intensity={1.1} castShadow />
      <directionalLight position={[5, 6, -3]} intensity={0.3} color="#aaccff" />
      <Stars radius={500} depth={25} count={1000} factor={1} saturation={0.5} fade speed={0} />

      <instancedMesh
        ref={meshRef}
        args={[hexGeo, hexMat, cellCount]}
        castShadow
        receiveShadow
        onClick={handleClick}
      />

      {hoveredIdx !== null && (() => {
        const d = hexData[hoveredIdx];
        return (
          <Html position={[d.wx, d.height + 1, d.wz]} center style={{ pointerEvents: "none" }}>
            <div style={{
              color: "#4df4ff", fontSize: "0.6rem", fontFamily: '"Roboto Mono", monospace',
              textShadow: "0 0 6px rgba(77, 244, 255, 0.6)", whiteSpace: "nowrap",
              background: "rgba(10, 6, 30, 0.7)", padding: "2px 8px", borderRadius: 3,
              border: "1px solid rgba(77, 244, 255, 0.2)",
            }}>
              {childLabel} {hoveredIdx} — {d.biome.name}
            </div>
          </Html>
        );
      })()}
    </>
  );
}
