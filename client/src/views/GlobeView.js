import React, { useRef, useMemo, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import { useParams, useNavigate } from "react-router-dom";
import { hashString } from "../config/planetTypes";
import { ORBIT_CONTROLS } from "../config/renderConfig";

// Hex grid constants
const HEX_RADIUS = 1.0;
const HEX_HEIGHT_UNIT = HEX_RADIUS * Math.sqrt(3);
const GRID_COLS = 20;
const GRID_ROWS = 10;
const CELL_COUNT = GRID_COLS * GRID_ROWS;
const HEX_GAP = 0.06;

// Elevation levels (like hex-map-wfc's 5 levels)
const LEVEL_HEIGHT = 0.4;

// Biomes with richer color ranges
const BIOMES = {
  deep_ocean:  { color: [0.03, 0.06, 0.28], level: -2, isWater: true },
  ocean:       { color: [0.05, 0.12, 0.40], level: -1, isWater: true },
  shallow:     { color: [0.08, 0.22, 0.50], level: 0,  isWater: true },
  beach:       { color: [0.78, 0.72, 0.50], level: 0 },
  grass:       { color: [0.30, 0.50, 0.18], level: 1 },
  forest:      { color: [0.12, 0.35, 0.08], level: 1 },
  dense_forest:{ color: [0.08, 0.25, 0.06], level: 2 },
  highland:    { color: [0.42, 0.38, 0.28], level: 2 },
  mountain:    { color: [0.50, 0.46, 0.40], level: 3 },
  snow_peak:   { color: [0.88, 0.90, 0.92], level: 4 },
  desert:      { color: [0.80, 0.70, 0.38], level: 1 },
  tundra:      { color: [0.52, 0.56, 0.52], level: 1 },
};

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

function getBiome(elevation, moisture, temperature) {
  if (elevation < -0.25) return BIOMES.deep_ocean;
  if (elevation < -0.08) return BIOMES.ocean;
  if (elevation < 0.0) return BIOMES.shallow;
  if (elevation < 0.06) return BIOMES.beach;
  if (elevation > 0.6) return BIOMES.snow_peak;
  if (elevation > 0.45) return BIOMES.mountain;
  if (elevation > 0.32) return BIOMES.highland;
  if (temperature < 0.22) return BIOMES.tundra;
  if (moisture < -0.15 && temperature > 0.5) return BIOMES.desert;
  if (moisture > 0.25 && elevation > 0.15) return BIOMES.dense_forest;
  if (moisture > 0.1) return BIOMES.forest;
  return BIOMES.grass;
}

// Create detailed hex tile geometry with beveled top surface and textured sides
function createHexTileGeo(radius) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.5,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function hexToWorld(col, row) {
  const w = (HEX_RADIUS + HEX_GAP) * 2;
  const h = HEX_HEIGHT_UNIT + HEX_GAP;
  const x = col * w * 0.75;
  const z = row * h + (col % 2 === 1 ? h * 0.5 : 0);
  const cx = ((GRID_COLS - 1) * w * 0.75) / 2;
  const cz = ((GRID_ROWS - 1) * h + h * 0.5) / 2;
  return [x - cx, z - cz];
}

function HexTerrain({ seed, onSectorHover, onSectorClick }) {
  const meshRef = useRef();
  const seedVal = hashString(seed);

  const hexGeo = useMemo(() => createHexTileGeo(HEX_RADIUS), []);
  const hexMat = useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0.02, flatShading: true, vertexColors: false }),
    []
  );

  // Compute terrain data
  const hexData = useMemo(() => {
    const data = [];
    for (let col = 0; col < GRID_COLS; col++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        const [wx, wz] = hexToWorld(col, row);
        const nX = wx * 0.09, nZ = wz * 0.09;
        const elevation = fbm2D(nX, nZ, seedVal, 7);
        const moisture = fbm2D(nX + 100, nZ + 100, seedVal + 42, 5);
        const temperature = 1.0 - Math.abs(wz) / ((GRID_ROWS * HEX_HEIGHT_UNIT) / 2);
        const biome = getBiome(elevation, moisture, temperature);
        // Smooth level transitions
        const level = biome.level;
        const heightJitter = fbm2D(nX * 3, nZ * 3, seedVal + 77, 3) * 0.08;
        data.push({ col, row, wx, wz, biome, level, elevation, heightJitter });
      }
    }
    return data;
  }, [seedVal]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  React.useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < CELL_COUNT; i++) {
      const d = hexData[i];
      const y = Math.max(0, d.level * LEVEL_HEIGHT + d.heightJitter);
      dummy.position.set(d.wx, y, d.wz);
      // Water tiles are thinner, land tiles vary by elevation
      const scaleY = d.biome.isWater ? 0.3 : 0.4 + d.level * 0.25;
      dummy.scale.set(1, Math.max(0.2, scaleY), 1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Per-hex color variation
      const h = hashString(`${seedVal}c${i}`);
      const v = (h % 100) / 600 - 0.08;
      const [r, g, b] = d.biome.color;
      meshRef.current.setColorAt(i, new THREE.Color(
        Math.max(0, Math.min(1, r + v)),
        Math.max(0, Math.min(1, g + v)),
        Math.max(0, Math.min(1, b + v))
      ));
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

    // Update colors — brighten hovered
    for (let i = 0; i < CELL_COUNT; i++) {
      const [r, g, b] = hexData[i].biome.color;
      const h = hashString(`${seedVal}c${i}`);
      const v = (h % 100) / 600 - 0.08;
      if (i === hoveredIdx) {
        meshRef.current.setColorAt(i, new THREE.Color(
          Math.min(1, r + 0.25), Math.min(1, g + 0.25), Math.min(1, b + 0.25)
        ));
      } else {
        meshRef.current.setColorAt(i, new THREE.Color(
          Math.max(0, r + v), Math.max(0, g + v), Math.max(0, b + v)
        ));
      }
    }
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
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
  );
}

// Animated water plane
function WaterPlane() {
  const meshRef = useRef();
  const totalW = GRID_COLS * (HEX_RADIUS + HEX_GAP) * 2 * 0.75 + 6;
  const totalH = GRID_ROWS * (HEX_HEIGHT_UNIT + HEX_GAP) + 6;
  const geo = useMemo(() => new THREE.PlaneGeometry(totalW, totalH, 64, 32), [totalW, totalH]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const pos = meshRef.current.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, Math.sin(x * 0.3 + t * 0.8) * 0.03 + Math.cos(z * 0.4 + t * 0.6) * 0.02);
    }
    pos.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
      <meshPhysicalMaterial
        color="#0a2040"
        roughness={0.15}
        metalness={0.6}
        transparent
        opacity={0.88}
        envMapIntensity={0.5}
      />
    </mesh>
  );
}

// Trees: multiple types (conifer, deciduous, small bush)
function Trees({ seed, hexData }) {
  const seedVal = hashString(seed);

  const treeData = useMemo(() => {
    const items = [];
    for (let i = 0; i < hexData.length; i++) {
      const d = hexData[i];
      const bName = Object.keys(BIOMES).find(k => BIOMES[k] === d.biome);
      if (!["grass", "forest", "dense_forest"].includes(bName)) continue;
      const count = bName === "dense_forest" ? 7 : bName === "forest" ? 4 : 1;
      for (let t = 0; t < count; t++) {
        const h = hashString(`${seedVal}t${i}${t}`);
        const angle = ((h % 360) / 360) * Math.PI * 2;
        const dist = ((h % 100) / 100) * HEX_RADIUS * 0.55;
        const x = d.wx + Math.cos(angle) * dist;
        const z = d.wz + Math.sin(angle) * dist;
        const y = Math.max(0, d.level * LEVEL_HEIGHT + d.heightJitter) + 0.2;
        const scale = 0.15 + (h % 40) / 100;
        const type = h % 3; // 0=conifer, 1=deciduous, 2=bush
        items.push({ x, y, z, scale, type });
      }
    }
    return items;
  }, [hexData, seedVal]);

  // Conifer (tall cone)
  const coniferGeo = useMemo(() => new THREE.ConeGeometry(0.12, 0.5, 6), []);
  const coniferMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1a4510", roughness: 0.9 }), []);
  // Deciduous (sphere)
  const decidGeo = useMemo(() => new THREE.SphereGeometry(0.15, 6, 5), []);
  const decidMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a5a18", roughness: 0.85 }), []);
  // Bush (small sphere)
  const bushGeo = useMemo(() => new THREE.SphereGeometry(0.08, 5, 4), []);
  const bushMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#385a20", roughness: 0.9 }), []);
  // Trunks
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.02, 0.03, 0.2, 4), []);
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#4a3018", roughness: 0.95 }), []);

  const conifers = useMemo(() => treeData.filter(t => t.type === 0), [treeData]);
  const deciduous = useMemo(() => treeData.filter(t => t.type === 1), [treeData]);
  const bushes = useMemo(() => treeData.filter(t => t.type === 2), [treeData]);

  const coniferRef = useRef();
  const decidRef = useRef();
  const bushRef = useRef();
  const trunkRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  React.useEffect(() => {
    const place = (ref, items, yOff) => {
      if (!ref.current) return;
      for (let i = 0; i < items.length; i++) {
        const t = items[i];
        dummy.position.set(t.x, t.y + t.scale * yOff, t.z);
        dummy.scale.setScalar(t.scale);
        dummy.updateMatrix();
        ref.current.setMatrixAt(i, dummy.matrix);
      }
      ref.current.instanceMatrix.needsUpdate = true;
    };
    place(coniferRef, conifers, 1.5);
    place(decidRef, deciduous, 1.2);
    place(bushRef, bushes, 0.5);

    // Trunks for conifers + deciduous
    if (trunkRef.current) {
      const trunks = [...conifers, ...deciduous];
      for (let i = 0; i < trunks.length; i++) {
        const t = trunks[i];
        dummy.position.set(t.x, t.y + t.scale * 0.3, t.z);
        dummy.scale.set(t.scale, t.scale * 1.5, t.scale);
        dummy.updateMatrix();
        trunkRef.current.setMatrixAt(i, dummy.matrix);
      }
      trunkRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [conifers, deciduous, bushes, dummy]);

  return (
    <>
      {conifers.length > 0 && <instancedMesh ref={coniferRef} args={[coniferGeo, coniferMat, conifers.length]} castShadow />}
      {deciduous.length > 0 && <instancedMesh ref={decidRef} args={[decidGeo, decidMat, deciduous.length]} castShadow />}
      {bushes.length > 0 && <instancedMesh ref={bushRef} args={[bushGeo, bushMat, bushes.length]} castShadow />}
      {(conifers.length + deciduous.length) > 0 && (
        <instancedMesh ref={trunkRef} args={[trunkGeo, trunkMat, conifers.length + deciduous.length]} />
      )}
    </>
  );
}

// Mountain peaks and rocks
function Mountains({ seed, hexData }) {
  const seedVal = hashString(seed);
  const items = useMemo(() => {
    const result = [];
    for (let i = 0; i < hexData.length; i++) {
      const d = hexData[i];
      const bName = Object.keys(BIOMES).find(k => BIOMES[k] === d.biome);
      if (!["mountain", "snow_peak", "highland"].includes(bName)) continue;
      const count = bName === "mountain" ? 3 : bName === "snow_peak" ? 2 : 1;
      for (let t = 0; t < count; t++) {
        const h = hashString(`${seedVal}m${i}${t}`);
        const angle = ((h % 360) / 360) * Math.PI * 2;
        const dist = ((h % 100) / 100) * HEX_RADIUS * 0.45;
        const x = d.wx + Math.cos(angle) * dist;
        const z = d.wz + Math.sin(angle) * dist;
        const y = Math.max(0, d.level * LEVEL_HEIGHT + d.heightJitter) + 0.2;
        const scale = 0.25 + (h % 50) / 100;
        const isSnow = bName === "snow_peak" || h % 4 === 0;
        result.push({ x, y, z, scale, isSnow });
      }
    }
    return result;
  }, [hexData, seedVal]);

  const rockPeaks = useMemo(() => items.filter(i => !i.isSnow), [items]);
  const snowPeaks = useMemo(() => items.filter(i => i.isSnow), [items]);

  const peakGeo = useMemo(() => new THREE.ConeGeometry(0.18, 0.6, 5), []);
  const rockMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#58504a", roughness: 0.92 }), []);
  const snowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#dce0e2", roughness: 0.6 }), []);

  const rockRef = useRef();
  const snowRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  React.useEffect(() => {
    const place = (ref, arr) => {
      if (!ref.current) return;
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];
        dummy.position.set(p.x, p.y + p.scale * 0.3, p.z);
        dummy.scale.setScalar(p.scale);
        dummy.rotation.y = hashString(`${seedVal}mr${i}`) % 360 * (Math.PI / 180);
        dummy.updateMatrix();
        ref.current.setMatrixAt(i, dummy.matrix);
      }
      ref.current.instanceMatrix.needsUpdate = true;
    };
    place(rockRef, rockPeaks);
    place(snowRef, snowPeaks);
  }, [rockPeaks, snowPeaks, seedVal, dummy]);

  return (
    <>
      {rockPeaks.length > 0 && <instancedMesh ref={rockRef} args={[peakGeo, rockMat, rockPeaks.length]} castShadow />}
      {snowPeaks.length > 0 && <instancedMesh ref={snowRef} args={[peakGeo, snowMat, snowPeaks.length]} castShadow />}
    </>
  );
}

// Rocks scattered on beaches and highlands
function Rocks({ seed, hexData }) {
  const seedVal = hashString(seed);
  const items = useMemo(() => {
    const result = [];
    for (let i = 0; i < hexData.length; i++) {
      const d = hexData[i];
      const bName = Object.keys(BIOMES).find(k => BIOMES[k] === d.biome);
      if (!["beach", "highland", "tundra"].includes(bName)) continue;
      const count = bName === "highland" ? 3 : 2;
      for (let t = 0; t < count; t++) {
        const h = hashString(`${seedVal}r${i}${t}`);
        const angle = ((h % 360) / 360) * Math.PI * 2;
        const dist = ((h % 100) / 100) * HEX_RADIUS * 0.5;
        const x = d.wx + Math.cos(angle) * dist;
        const z = d.wz + Math.sin(angle) * dist;
        const y = Math.max(0, d.level * LEVEL_HEIGHT + d.heightJitter) + 0.15;
        const scale = 0.05 + (h % 30) / 200;
        result.push({ x, y, z, scale });
      }
    }
    return result;
  }, [hexData, seedVal]);

  const rockGeo = useMemo(() => new THREE.DodecahedronGeometry(0.1, 0), []);
  const rockMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#6a6560", roughness: 0.95 }), []);
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  React.useEffect(() => {
    if (!ref.current) return;
    for (let i = 0; i < items.length; i++) {
      const r = items[i];
      dummy.position.set(r.x, r.y, r.z);
      dummy.scale.setScalar(r.scale);
      dummy.rotation.set(hashString(`${seedVal}rx${i}`) % 6, hashString(`${seedVal}ry${i}`) % 6, 0);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [items, seedVal, dummy]);

  if (items.length === 0) return null;
  return <instancedMesh ref={ref} args={[rockGeo, rockMat, items.length]} />;
}

// Hover tooltip
function HoverLabel({ hexData, hoveredIdx }) {
  if (hoveredIdx === null) return null;
  const d = hexData[hoveredIdx];
  const bName = Object.keys(BIOMES).find(k => BIOMES[k] === d.biome) || "unknown";
  return (
    <Html position={[d.wx, Math.max(0, d.level * LEVEL_HEIGHT) + 1.5, d.wz]} center style={{ pointerEvents: "none" }}>
      <div style={{
        color: "#4df4ff", fontSize: "0.65rem", fontFamily: '"Roboto Mono", monospace',
        textShadow: "0 0 6px rgba(77, 244, 255, 0.6)", whiteSpace: "nowrap",
        background: "rgba(10, 6, 30, 0.75)", padding: "3px 10px", borderRadius: 4,
        border: "1px solid rgba(77, 244, 255, 0.25)",
      }}>
        Sector {hoveredIdx} — {bName.replace(/_/g, " ")}
      </div>
    </Html>
  );
}

export default function GlobeView({ onSectorHover }) {
  const { galaxyId, starId, planetId, regionId } = useParams();
  const navigate = useNavigate();
  const seed = `${galaxyId}${starId}${planetId}r${regionId}`;
  const seedVal = hashString(seed);

  const hexData = useMemo(() => {
    const data = [];
    for (let col = 0; col < GRID_COLS; col++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        const [wx, wz] = hexToWorld(col, row);
        const nX = wx * 0.09, nZ = wz * 0.09;
        const elevation = fbm2D(nX, nZ, seedVal, 7);
        const moisture = fbm2D(nX + 100, nZ + 100, seedVal + 42, 5);
        const temperature = 1.0 - Math.abs(wz) / ((GRID_ROWS * HEX_HEIGHT_UNIT) / 2);
        const biome = getBiome(elevation, moisture, temperature);
        const level = biome.level;
        const heightJitter = fbm2D(nX * 3, nZ * 3, seedVal + 77, 3) * 0.08;
        data.push({ col, row, wx, wz, biome, level, elevation, heightJitter });
      }
    }
    return data;
  }, [seedVal]);

  const [hoveredIdx, setHoveredIdx] = useState(null);

  const handleSectorHover = useCallback(
    (idx) => { setHoveredIdx(idx); onSectorHover?.(idx); },
    [onSectorHover]
  );

  React.useEffect(() => { return () => { document.body.style.cursor = "default"; }; }, []);

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
        target={[0, 0.5, 0]}
        enableZoom enablePan enableRotate
        dampingFactor={0.05}
        maxPolarAngle={Math.PI * 0.42}
        minPolarAngle={Math.PI * 0.1}
      />
      {/* Lighting: key + fill + rim like hex-map-wfc */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[-15, 20, 10]} intensity={1.4} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-far={100} shadow-camera-left={-30} shadow-camera-right={30}
        shadow-camera-top={30} shadow-camera-bottom={-30} shadow-bias={-0.001}
      />
      <directionalLight position={[10, 12, -8]} intensity={0.35} color="#aaccff" />
      <directionalLight position={[0, 5, 15]} intensity={0.2} color="#ffd4a0" />
      <Stars radius={500} depth={25} count={800} factor={0.8} saturation={0.4} fade speed={0} />

      {/* Fog for atmosphere */}
      <fog attach="fog" args={["#0a0620", 30, 80]} />

      <WaterPlane />
      <HexTerrain seed={seed} onSectorHover={handleSectorHover} onSectorClick={handleSectorClick} />
      <Trees seed={seed} hexData={hexData} />
      <Mountains seed={seed} hexData={hexData} />
      <Rocks seed={seed} hexData={hexData} />
      <HoverLabel hexData={hexData} hoveredIdx={hoveredIdx} />
    </>
  );
}
