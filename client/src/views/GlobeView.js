import React, { useRef, useMemo, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import { useParams, useNavigate } from "react-router-dom";
import { hashString } from "../config/planetTypes";
import { ORBIT_CONTROLS } from "../config/renderConfig";

// Hex grid constants
const HEX_RADIUS = 1.0;
const HEX_HEIGHT = HEX_RADIUS * Math.sqrt(3);
const GRID_COLS = 20;
const GRID_ROWS = 10;
const CELL_COUNT = GRID_COLS * GRID_ROWS; // 200 sectors
const HEX_GAP = 0.04;

// Terrain biome types with colors and heights
const BIOMES = [
  { name: "deep_ocean",  color: [0.04, 0.08, 0.32], height: -0.3 },
  { name: "ocean",       color: [0.06, 0.15, 0.45], height: -0.15 },
  { name: "shallow",     color: [0.10, 0.25, 0.55], height: -0.05 },
  { name: "beach",       color: [0.72, 0.65, 0.42], height: 0.02 },
  { name: "grass",       color: [0.22, 0.42, 0.15], height: 0.15 },
  { name: "forest",      color: [0.12, 0.32, 0.10], height: 0.3 },
  { name: "highland",    color: [0.35, 0.30, 0.20], height: 0.5 },
  { name: "mountain",    color: [0.45, 0.40, 0.35], height: 0.8 },
  { name: "snow",        color: [0.85, 0.88, 0.90], height: 1.1 },
  { name: "desert",      color: [0.75, 0.65, 0.35], height: 0.12 },
  { name: "tundra",      color: [0.50, 0.55, 0.50], height: 0.08 },
];

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

// Get biome based on elevation and moisture
function getBiome(elevation, moisture, temperature) {
  if (elevation < -0.2) return BIOMES[0]; // deep ocean
  if (elevation < -0.05) return BIOMES[1]; // ocean
  if (elevation < 0.02) return BIOMES[2]; // shallow
  if (elevation < 0.06) return BIOMES[3]; // beach
  if (elevation > 0.55) return BIOMES[8]; // snow
  if (elevation > 0.4) return BIOMES[7]; // mountain
  if (elevation > 0.3) return BIOMES[6]; // highland
  if (temperature < 0.25) return BIOMES[10]; // tundra
  if (moisture < -0.1 && temperature > 0.5) return BIOMES[9]; // desert
  if (moisture > 0.15) return BIOMES[5]; // forest
  return BIOMES[4]; // grass
}

// Create a single hexagon shape (flat-top)
function createHexGeometry(radius) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const extrudeSettings = { depth: 0.3, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.rotateX(-Math.PI / 2); // lay flat
  return geo;
}

// Convert hex grid col/row to world position (flat-top hex)
function hexToWorld(col, row) {
  const w = (HEX_RADIUS + HEX_GAP) * 2;
  const h = HEX_HEIGHT + HEX_GAP;
  const x = col * w * 0.75;
  const z = row * h + (col % 2 === 1 ? h * 0.5 : 0);
  // Center the grid
  const cx = ((GRID_COLS - 1) * w * 0.75) / 2;
  const cz = ((GRID_ROWS - 1) * h + h * 0.5) / 2;
  return [x - cx, z - cz];
}

function HexMap({ seed, onSectorHover, onSectorClick }) {
  const meshRef = useRef();
  const seedVal = hashString(seed);

  const hexGeo = useMemo(() => createHexGeometry(HEX_RADIUS), []);
  const hexMat = useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.05, flatShading: true }),
    []
  );

  // Compute hex data (positions, biomes, heights)
  const hexData = useMemo(() => {
    const data = [];
    for (let col = 0; col < GRID_COLS; col++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        const [wx, wz] = hexToWorld(col, row);
        const noiseX = wx * 0.08;
        const noiseZ = wz * 0.08;
        const elevation = fbm2D(noiseX, noiseZ, seedVal, 6);
        const moisture = fbm2D(noiseX + 100, noiseZ + 100, seedVal + 42, 4);
        const temperature = 1.0 - Math.abs(wz) / ((GRID_ROWS * HEX_HEIGHT) / 2);
        const biome = getBiome(elevation, moisture, temperature);
        // Add some variation to height
        const heightVariation = fbm2D(noiseX * 2, noiseZ * 2, seedVal + 99, 3) * 0.15;
        const height = Math.max(0, biome.height + heightVariation);
        data.push({ col, row, wx, wz, biome, height, elevation });
      }
    }
    return data;
  }, [seedVal]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  React.useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < CELL_COUNT; i++) {
      const d = hexData[i];
      dummy.position.set(d.wx, d.height, d.wz);
      // Scale height for water vs land
      const scaleY = d.elevation < 0 ? 0.5 : 0.5 + d.height * 0.8;
      dummy.scale.set(1, Math.max(0.3, scaleY), 1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Apply biome color with slight per-hex variation
      const variation = (hashString(`${seedVal}hex${i}`) % 100) / 800;
      const [r, g, b] = d.biome.color;
      meshRef.current.setColorAt(i, new THREE.Color(r + variation, g + variation, b + variation));
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor.needsUpdate = true;
  }, [hexData, seedVal, dummy]);

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
        onSectorHover?.(idx);
        document.body.style.cursor = "pointer";
      }
    } else if (hoveredIdx !== null) {
      setHoveredIdx(null);
      onSectorHover?.(null);
      document.body.style.cursor = "default";
    }

    // Highlight hovered hex
    for (let i = 0; i < CELL_COUNT; i++) {
      if (i === hoveredIdx) {
        // Brighten the hovered hex
        const [r, g, b] = hexData[i].biome.color;
        meshRef.current.setColorAt(i, new THREE.Color(
          Math.min(1, r + 0.3),
          Math.min(1, g + 0.3),
          Math.min(1, b + 0.3)
        ));
      } else {
        const variation = (hashString(`${seedVal}hex${i}`) % 100) / 800;
        const [r, g, b] = hexData[i].biome.color;
        meshRef.current.setColorAt(i, new THREE.Color(r + variation, g + variation, b + variation));
      }
    }
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  // Water plane
  const waterGeo = useMemo(() => {
    const totalW = GRID_COLS * (HEX_RADIUS + HEX_GAP) * 2 * 0.75 + 4;
    const totalH = GRID_ROWS * (HEX_HEIGHT + HEX_GAP) + 4;
    return new THREE.PlaneGeometry(totalW, totalH);
  }, []);

  return (
    <group>
      {/* Water plane */}
      <mesh geometry={waterGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <meshStandardMaterial
          color="#0a1a3a"
          roughness={0.2}
          metalness={0.4}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Hex tiles */}
      <instancedMesh
        ref={meshRef}
        args={[hexGeo, hexMat, CELL_COUNT]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId != null) onSectorClick?.(e.instanceId);
        }}
      />

      {/* Hovered hex label */}
      {hoveredIdx !== null && (() => {
        const d = hexData[hoveredIdx];
        return (
          <Html position={[d.wx, d.height + 1.2, d.wz]} center style={{ pointerEvents: "none" }}>
            <div style={{
              color: "#4df4ff", fontSize: "0.65rem", fontFamily: '"Roboto Mono", monospace',
              textShadow: "0 0 6px rgba(77, 244, 255, 0.6)", whiteSpace: "nowrap",
              background: "rgba(10, 6, 30, 0.7)", padding: "2px 8px", borderRadius: 3,
              border: "1px solid rgba(77, 244, 255, 0.2)",
            }}>
              Sector {hoveredIdx} — {d.biome.name.replace("_", " ")}
            </div>
          </Html>
        );
      })()}
    </group>
  );
}

// Small decoration meshes on land hexes
function HexDecorations({ seed, hexData }) {
  const seedVal = hashString(seed);

  // Trees on forest hexes
  const treePositions = useMemo(() => {
    const trees = [];
    for (let i = 0; i < hexData.length; i++) {
      const d = hexData[i];
      if (d.biome.name !== "forest" && d.biome.name !== "grass") continue;
      const treeCount = d.biome.name === "forest" ? 5 : 2;
      for (let t = 0; t < treeCount; t++) {
        const h = hashString(`${seedVal}tree${i}${t}`);
        const angle = ((h % 360) / 360) * Math.PI * 2;
        const dist = ((h % 100) / 100) * HEX_RADIUS * 0.6;
        const x = d.wx + Math.cos(angle) * dist;
        const z = d.wz + Math.sin(angle) * dist;
        const height = 0.2 + (h % 50) / 100;
        trees.push([x, d.height + 0.15, z, height]);
      }
    }
    return trees;
  }, [hexData, seedVal]);

  const treeGeo = useMemo(() => new THREE.ConeGeometry(0.15, 0.4, 6), []);
  const treeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1a4a12", roughness: 0.9 }), []);
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.03, 0.04, 0.15, 4), []);
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#4a3520", roughness: 0.9 }), []);

  const treeMeshRef = useRef();
  const trunkMeshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  React.useEffect(() => {
    if (!treeMeshRef.current || !trunkMeshRef.current) return;
    for (let i = 0; i < treePositions.length; i++) {
      const [x, y, z, h] = treePositions[i];
      dummy.position.set(x, y + h * 0.5 + 0.1, z);
      dummy.scale.set(h, h, h);
      dummy.updateMatrix();
      treeMeshRef.current.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, y + 0.05, z);
      dummy.scale.set(1, h * 0.5, 1);
      dummy.updateMatrix();
      trunkMeshRef.current.setMatrixAt(i, dummy.matrix);
    }
    treeMeshRef.current.instanceMatrix.needsUpdate = true;
    trunkMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [treePositions, dummy]);

  if (treePositions.length === 0) return null;

  return (
    <>
      <instancedMesh ref={treeMeshRef} args={[treeGeo, treeMat, treePositions.length]} />
      <instancedMesh ref={trunkMeshRef} args={[trunkGeo, trunkMat, treePositions.length]} />
    </>
  );
}

// Mountain peaks on highland/mountain hexes
function MountainPeaks({ seed, hexData }) {
  const seedVal = hashString(seed);

  const peakPositions = useMemo(() => {
    const peaks = [];
    for (let i = 0; i < hexData.length; i++) {
      const d = hexData[i];
      if (d.biome.name !== "mountain" && d.biome.name !== "highland" && d.biome.name !== "snow") continue;
      const count = d.biome.name === "mountain" ? 3 : d.biome.name === "snow" ? 2 : 1;
      for (let t = 0; t < count; t++) {
        const h = hashString(`${seedVal}peak${i}${t}`);
        const angle = ((h % 360) / 360) * Math.PI * 2;
        const dist = ((h % 100) / 100) * HEX_RADIUS * 0.5;
        const x = d.wx + Math.cos(angle) * dist;
        const z = d.wz + Math.sin(angle) * dist;
        const height = 0.3 + (h % 60) / 100;
        const isSnow = d.biome.name === "snow" || (h % 3 === 0);
        peaks.push([x, d.height + 0.15, z, height, isSnow]);
      }
    }
    return peaks;
  }, [hexData, seedVal]);

  const peakGeo = useMemo(() => new THREE.ConeGeometry(0.2, 0.5, 5), []);
  const rockMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5a5045", roughness: 0.9 }), []);
  const snowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d8dde0", roughness: 0.7 }), []);

  const rockRef = useRef();
  const snowRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const rockPeaks = useMemo(() => peakPositions.filter(p => !p[4]), [peakPositions]);
  const snowPeaks = useMemo(() => peakPositions.filter(p => p[4]), [peakPositions]);

  React.useEffect(() => {
    if (rockRef.current) {
      for (let i = 0; i < rockPeaks.length; i++) {
        const [x, y, z, h] = rockPeaks[i];
        dummy.position.set(x, y + h * 0.3, z);
        dummy.scale.set(h, h, h);
        dummy.updateMatrix();
        rockRef.current.setMatrixAt(i, dummy.matrix);
      }
      rockRef.current.instanceMatrix.needsUpdate = true;
    }
    if (snowRef.current) {
      for (let i = 0; i < snowPeaks.length; i++) {
        const [x, y, z, h] = snowPeaks[i];
        dummy.position.set(x, y + h * 0.3, z);
        dummy.scale.set(h, h, h);
        dummy.updateMatrix();
        snowRef.current.setMatrixAt(i, dummy.matrix);
      }
      snowRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [rockPeaks, snowPeaks, dummy]);

  return (
    <>
      {rockPeaks.length > 0 && <instancedMesh ref={rockRef} args={[peakGeo, rockMat, rockPeaks.length]} />}
      {snowPeaks.length > 0 && <instancedMesh ref={snowRef} args={[peakGeo, snowMat, snowPeaks.length]} />}
    </>
  );
}

export default function GlobeView({ onSectorHover }) {
  const { galaxyId, starId, planetId, regionId } = useParams();
  const navigate = useNavigate();
  const seed = `${galaxyId}${starId}${planetId}r${regionId}`;
  const seedVal = hashString(seed);

  // Pre-compute hex data for decorations
  const hexData = useMemo(() => {
    const data = [];
    for (let col = 0; col < GRID_COLS; col++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        const [wx, wz] = hexToWorld(col, row);
        const noiseX = wx * 0.08;
        const noiseZ = wz * 0.08;
        const elevation = fbm2D(noiseX, noiseZ, seedVal, 6);
        const moisture = fbm2D(noiseX + 100, noiseZ + 100, seedVal + 42, 4);
        const temperature = 1.0 - Math.abs(wz) / ((GRID_ROWS * HEX_HEIGHT) / 2);
        const biome = getBiome(elevation, moisture, temperature);
        const heightVariation = fbm2D(noiseX * 2, noiseZ * 2, seedVal + 99, 3) * 0.15;
        const height = Math.max(0, biome.height + heightVariation);
        data.push({ col, row, wx, wz, biome, height, elevation });
      }
    }
    return data;
  }, [seedVal]);

  const handleSectorHover = useCallback(
    (idx) => { onSectorHover?.(idx); },
    [onSectorHover]
  );

  React.useEffect(() => {
    return () => { document.body.style.cursor = "default"; };
  }, []);

  const handleSectorClick = useCallback(
    (idx) => {
      navigate(`/galaxy/${galaxyId}/star/${starId}/planet/${planetId}/region/${regionId}/sector/${idx}`);
    },
    [navigate, galaxyId, starId, planetId, regionId]
  );

  return (
    <>
      <OrbitControls
        {...ORBIT_CONTROLS}
        minDistance={5}
        maxDistance={45}
        target={[0, 0, 0]}
        enableZoom
        enablePan
        enableRotate
        dampingFactor={0.05}
        maxPolarAngle={Math.PI * 0.45}
      />
      <ambientLight intensity={0.4} />
      <directionalLight position={[-10, 15, 10]} intensity={1.2} castShadow />
      <directionalLight position={[5, 8, -5]} intensity={0.4} color="#aaccff" />
      <pointLight position={[0, 5, 0]} intensity={0.2} color="#4df4ff" />
      <Stars radius={500} depth={25} count={1000} factor={1} saturation={0.5} fade speed={0} />

      <HexMap seed={seed} onSectorHover={handleSectorHover} onSectorClick={handleSectorClick} />
      <HexDecorations seed={seed} hexData={hexData} />
      <MountainPeaks seed={seed} hexData={hexData} />
    </>
  );
}
