import React, { useRef, useMemo, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useParams, useNavigate } from "react-router-dom";
import { hashString } from "../config/planetTypes";

// Grid layout
const HEX_RADIUS = 1.0;
const HEX_H = HEX_RADIUS * Math.sqrt(3);
const COLS = 22;
const ROWS = 14;
const CELL_COUNT = COLS * ROWS;
const GAP = 0.04;

// Elevation
const LAND_Y = 0.0;
const WATER_Y = -0.35;
const BEACH_Y = -0.05;
const CLIFF_DEPTH = 0.6; // how deep land hex sides go

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

function hexToWorld(col, row) {
  const w = (HEX_RADIUS + GAP) * 2;
  const h = HEX_H + GAP;
  const x = col * w * 0.75;
  const z = row * h + (col % 2 === 1 ? h * 0.5 : 0);
  const cx = ((COLS - 1) * w * 0.75) / 2;
  const cz = ((ROWS - 1) * h + h * 0.5) / 2;
  return [x - cx, z - cz];
}

// Create hex prism geometry
function createHexGeo(radius, depth) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    if (i === 0) shape.moveTo(radius * Math.cos(angle), radius * Math.sin(angle));
    else shape.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 1,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

// Generate coherent island terrain using threshold on noise
function generateTerrain(seedVal) {
  const data = [];
  // Island shape: use low-frequency noise with distance falloff from center
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const [wx, wz] = hexToWorld(col, row);
      // Normalized distance from center (0=center, 1=edge)
      const maxDist = Math.max(COLS * 0.75, ROWS * HEX_H * 0.5);
      const dist = Math.sqrt(wx * wx + wz * wz) / maxDist;

      // Island mask: prefer land near center, water near edges
      const islandNoise = fbm2D(wx * 0.06, wz * 0.06, seedVal, 5);
      const islandValue = islandNoise - dist * 1.2 + 0.3;

      // Moisture for biome selection
      const moisture = fbm2D(wx * 0.08 + 50, wz * 0.08 + 50, seedVal + 42, 4);

      let biome;
      if (islandValue < -0.15) {
        biome = "water";
      } else if (islandValue < 0.0) {
        biome = "coast"; // beach/shallow boundary
      } else if (islandValue > 0.4) {
        biome = moisture > 0.1 ? "dense_forest" : "highland";
      } else if (islandValue > 0.2) {
        biome = moisture > 0 ? "forest" : "grass";
      } else {
        biome = "grass";
      }

      data.push({ col, row, wx, wz, biome, islandValue, moisture });
    }
  }
  return data;
}

// Biome visual properties
const BIOME_COLORS = {
  water:        [0.15, 0.35, 0.65],
  coast:        [0.72, 0.68, 0.50],
  grass:        [0.45, 0.62, 0.28],
  forest:       [0.22, 0.48, 0.18],
  dense_forest: [0.14, 0.38, 0.12],
  highland:     [0.48, 0.44, 0.32],
};

function HexTerrain({ hexData, seedVal, onSectorHover, onSectorClick }) {
  const landRef = useRef();
  const waterRef = useRef();

  const landGeo = useMemo(() => createHexGeo(HEX_RADIUS, CLIFF_DEPTH), []);
  const landMat = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.85, metalness: 0.02, flatShading: true,
  }), []);

  const waterGeo = useMemo(() => createHexGeo(HEX_RADIUS, 0.15), []);
  const waterMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#1a4a80", roughness: 0.3, metalness: 0.4, flatShading: true,
  }), []);

  const landHexes = useMemo(() => hexData.filter(d => d.biome !== "water"), [hexData]);
  const waterHexes = useMemo(() => hexData.filter(d => d.biome === "water"), [hexData]);

  // Index maps for raycasting
  const landIndexMap = useMemo(() => {
    const map = new Map();
    landHexes.forEach((d, i) => {
      const globalIdx = hexData.indexOf(d);
      map.set(i, globalIdx);
    });
    return map;
  }, [landHexes, hexData]);

  const waterIndexMap = useMemo(() => {
    const map = new Map();
    waterHexes.forEach((d, i) => {
      const globalIdx = hexData.indexOf(d);
      map.set(i, globalIdx);
    });
    return map;
  }, [waterHexes, hexData]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Place land tiles
  React.useEffect(() => {
    if (!landRef.current) return;
    for (let i = 0; i < landHexes.length; i++) {
      const d = landHexes[i];
      const y = d.biome === "coast" ? BEACH_Y : LAND_Y;
      dummy.position.set(d.wx, y, d.wz);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      landRef.current.setMatrixAt(i, dummy.matrix);

      const base = BIOME_COLORS[d.biome] || BIOME_COLORS.grass;
      const v = (hashString(`${seedVal}c${d.col}${d.row}`) % 100) / 500 - 0.1;
      landRef.current.setColorAt(i, new THREE.Color(
        Math.max(0, Math.min(1, base[0] + v)),
        Math.max(0, Math.min(1, base[1] + v)),
        Math.max(0, Math.min(1, base[2] + v))
      ));
    }
    landRef.current.instanceMatrix.needsUpdate = true;
    landRef.current.instanceColor.needsUpdate = true;
  }, [landHexes, seedVal, dummy]);

  // Place water tiles
  React.useEffect(() => {
    if (!waterRef.current) return;
    for (let i = 0; i < waterHexes.length; i++) {
      const d = waterHexes[i];
      dummy.position.set(d.wx, WATER_Y, d.wz);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      waterRef.current.setMatrixAt(i, dummy.matrix);
    }
    waterRef.current.instanceMatrix.needsUpdate = true;
  }, [waterHexes, dummy]);

  const { raycaster, pointer, camera } = useThree();
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useFrame(() => {
    raycaster.setFromCamera(pointer, camera);
    let foundIdx = null;

    // Check land first
    if (landRef.current) {
      const hits = raycaster.intersectObject(landRef.current);
      if (hits.length > 0) {
        foundIdx = landIndexMap.get(hits[0].instanceId);
      }
    }
    // Then water
    if (foundIdx === null && waterRef.current) {
      const hits = raycaster.intersectObject(waterRef.current);
      if (hits.length > 0) {
        foundIdx = waterIndexMap.get(hits[0].instanceId);
      }
    }

    if (foundIdx !== hoveredIdx) {
      setHoveredIdx(foundIdx);
      onSectorHover?.(foundIdx);
      document.body.style.cursor = foundIdx !== null ? "pointer" : "default";
    }

    // Update land colors for hover
    if (landRef.current) {
      for (let i = 0; i < landHexes.length; i++) {
        const globalIdx = landIndexMap.get(i);
        const d = landHexes[i];
        const base = BIOME_COLORS[d.biome] || BIOME_COLORS.grass;
        const v = (hashString(`${seedVal}c${d.col}${d.row}`) % 100) / 500 - 0.1;
        if (globalIdx === hoveredIdx) {
          landRef.current.setColorAt(i, new THREE.Color(
            Math.min(1, base[0] + 0.2), Math.min(1, base[1] + 0.2), Math.min(1, base[2] + 0.2)
          ));
        } else {
          landRef.current.setColorAt(i, new THREE.Color(
            Math.max(0, base[0] + v), Math.max(0, base[1] + v), Math.max(0, base[2] + v)
          ));
        }
      }
      landRef.current.instanceColor.needsUpdate = true;
    }
  });

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    // Determine global index from land or water
    if (landRef.current) {
      const hits = raycaster.intersectObject(landRef.current);
      if (hits.length > 0) {
        const idx = landIndexMap.get(hits[0].instanceId);
        if (idx != null) onSectorClick?.(idx);
        return;
      }
    }
    if (waterRef.current) {
      const hits = raycaster.intersectObject(waterRef.current);
      if (hits.length > 0) {
        const idx = waterIndexMap.get(hits[0].instanceId);
        if (idx != null) onSectorClick?.(idx);
      }
    }
  }, [onSectorClick, landIndexMap, waterIndexMap, raycaster]);

  return (
    <group onClick={handleClick}>
      {landHexes.length > 0 && (
        <instancedMesh ref={landRef} args={[landGeo, landMat, landHexes.length]} castShadow receiveShadow />
      )}
      {waterHexes.length > 0 && (
        <instancedMesh ref={waterRef} args={[waterGeo, waterMat, waterHexes.length]} receiveShadow />
      )}
    </group>
  );
}

// Trees: conifers and deciduous, properly sized
function Trees({ hexData, seedVal }) {
  const treeData = useMemo(() => {
    const items = [];
    for (const d of hexData) {
      if (!["grass", "forest", "dense_forest"].includes(d.biome)) continue;
      const count = d.biome === "dense_forest" ? 6 : d.biome === "forest" ? 3 : 1;
      for (let t = 0; t < count; t++) {
        const h = hashString(`${seedVal}t${d.col}${d.row}${t}`);
        const angle = ((h % 360) / 360) * Math.PI * 2;
        const dist = ((h % 80) / 80) * HEX_RADIUS * 0.6;
        const x = d.wx + Math.cos(angle) * dist;
        const z = d.wz + Math.sin(angle) * dist;
        const scale = 0.6 + (h % 50) / 80;
        const type = h % 3; // 0=conifer, 1=deciduous, 2=tall conifer
        items.push({ x, z, scale, type });
      }
    }
    return items;
  }, [hexData, seedVal]);

  // Conifer: cone
  const coniferGeo = useMemo(() => new THREE.ConeGeometry(0.18, 0.7, 6), []);
  const coniferMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1e5c28", roughness: 0.85 }), []);
  // Deciduous: sphere
  const decidGeo = useMemo(() => new THREE.SphereGeometry(0.22, 6, 5), []);
  const decidMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2e6a20", roughness: 0.8 }), []);
  // Trunks
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.03, 0.05, 0.35, 5), []);
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5a3a1a", roughness: 0.95 }), []);

  const conifers = useMemo(() => treeData.filter(t => t.type === 0 || t.type === 2), [treeData]);
  const deciduous = useMemo(() => treeData.filter(t => t.type === 1), [treeData]);
  const allTrunks = useMemo(() => [...conifers, ...deciduous], [conifers, deciduous]);

  const coniferRef = useRef();
  const decidRef = useRef();
  const trunkRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  React.useEffect(() => {
    if (coniferRef.current) {
      for (let i = 0; i < conifers.length; i++) {
        const t = conifers[i];
        const h = t.type === 2 ? t.scale * 1.3 : t.scale;
        dummy.position.set(t.x, LAND_Y + h * 0.5 + 0.2, t.z);
        dummy.scale.set(t.scale, h, t.scale);
        dummy.updateMatrix();
        coniferRef.current.setMatrixAt(i, dummy.matrix);
        // Color variation
        const v = (hashString(`${t.x}${t.z}`) % 40) / 200;
        coniferRef.current.setColorAt(i, new THREE.Color(0.12 + v, 0.36 + v, 0.16 + v));
      }
      coniferRef.current.instanceMatrix.needsUpdate = true;
      coniferRef.current.instanceColor.needsUpdate = true;
    }
    if (decidRef.current) {
      for (let i = 0; i < deciduous.length; i++) {
        const t = deciduous[i];
        dummy.position.set(t.x, LAND_Y + t.scale * 0.5 + 0.3, t.z);
        dummy.scale.setScalar(t.scale);
        dummy.updateMatrix();
        decidRef.current.setMatrixAt(i, dummy.matrix);
        const v = (hashString(`${t.x}${t.z}d`) % 40) / 200;
        decidRef.current.setColorAt(i, new THREE.Color(0.18 + v, 0.42 + v, 0.12 + v));
      }
      decidRef.current.instanceMatrix.needsUpdate = true;
      decidRef.current.instanceColor.needsUpdate = true;
    }
    if (trunkRef.current) {
      for (let i = 0; i < allTrunks.length; i++) {
        const t = allTrunks[i];
        dummy.position.set(t.x, LAND_Y + 0.1, t.z);
        dummy.scale.set(t.scale, t.scale, t.scale);
        dummy.updateMatrix();
        trunkRef.current.setMatrixAt(i, dummy.matrix);
      }
      trunkRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [conifers, deciduous, allTrunks, dummy]);

  return (
    <>
      {conifers.length > 0 && <instancedMesh ref={coniferRef} args={[coniferGeo, coniferMat, conifers.length]} castShadow />}
      {deciduous.length > 0 && <instancedMesh ref={decidRef} args={[decidGeo, decidMat, deciduous.length]} castShadow />}
      {allTrunks.length > 0 && <instancedMesh ref={trunkRef} args={[trunkGeo, trunkMat, allTrunks.length]} />}
    </>
  );
}

// Simple houses on grass tiles
function Houses({ hexData, seedVal }) {
  const houseData = useMemo(() => {
    const items = [];
    for (const d of hexData) {
      if (d.biome !== "grass") continue;
      const h = hashString(`${seedVal}house${d.col}${d.row}`);
      if (h % 8 !== 0) continue; // ~12% of grass tiles get a house
      const angle = ((h % 360) / 360) * Math.PI * 2;
      const dist = ((h % 60) / 60) * HEX_RADIUS * 0.3;
      items.push({
        x: d.wx + Math.cos(angle) * dist,
        z: d.wz + Math.sin(angle) * dist,
        rotY: (h % 6) * Math.PI / 3,
        scale: 0.12 + (h % 30) / 200,
      });
    }
    return items;
  }, [hexData, seedVal]);

  // House body (box)
  const bodyGeo = useMemo(() => new THREE.BoxGeometry(0.4, 0.3, 0.35), []);
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c4a060", roughness: 0.8 }), []);
  // Roof (pyramid-ish)
  const roofGeo = useMemo(() => new THREE.ConeGeometry(0.32, 0.25, 4), []);
  const roofMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8b3a2a", roughness: 0.75 }), []);

  const bodyRef = useRef();
  const roofRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  React.useEffect(() => {
    if (bodyRef.current) {
      for (let i = 0; i < houseData.length; i++) {
        const h = houseData[i];
        dummy.position.set(h.x, LAND_Y + 0.15, h.z);
        dummy.rotation.set(0, h.rotY, 0);
        dummy.scale.setScalar(h.scale * 3);
        dummy.updateMatrix();
        bodyRef.current.setMatrixAt(i, dummy.matrix);
      }
      bodyRef.current.instanceMatrix.needsUpdate = true;
    }
    if (roofRef.current) {
      for (let i = 0; i < houseData.length; i++) {
        const h = houseData[i];
        dummy.position.set(h.x, LAND_Y + 0.35, h.z);
        dummy.rotation.set(0, h.rotY + Math.PI / 4, 0);
        dummy.scale.setScalar(h.scale * 3);
        dummy.updateMatrix();
        roofRef.current.setMatrixAt(i, dummy.matrix);
      }
      roofRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [houseData, dummy]);

  if (houseData.length === 0) return null;
  return (
    <>
      <instancedMesh ref={bodyRef} args={[bodyGeo, bodyMat, houseData.length]} castShadow />
      <instancedMesh ref={roofRef} args={[roofGeo, roofMat, houseData.length]} castShadow />
    </>
  );
}

// Rocks on coast/highland
function Rocks({ hexData, seedVal }) {
  const items = useMemo(() => {
    const result = [];
    for (const d of hexData) {
      if (!["coast", "highland"].includes(d.biome)) continue;
      const count = d.biome === "highland" ? 3 : 2;
      for (let t = 0; t < count; t++) {
        const h = hashString(`${seedVal}r${d.col}${d.row}${t}`);
        const angle = ((h % 360) / 360) * Math.PI * 2;
        const dist = ((h % 80) / 80) * HEX_RADIUS * 0.5;
        const y = d.biome === "coast" ? BEACH_Y : LAND_Y;
        result.push({
          x: d.wx + Math.cos(angle) * dist,
          y: y + 0.08,
          z: d.wz + Math.sin(angle) * dist,
          scale: 0.08 + (h % 30) / 250,
        });
      }
    }
    return result;
  }, [hexData, seedVal]);

  const geo = useMemo(() => new THREE.DodecahedronGeometry(0.12, 0), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#7a7570", roughness: 0.95 }), []);
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  React.useEffect(() => {
    if (!ref.current) return;
    for (let i = 0; i < items.length; i++) {
      const r = items[i];
      dummy.position.set(r.x, r.y, r.z);
      dummy.scale.setScalar(r.scale * 5);
      dummy.rotation.set(hashString(`${r.x}rx`) % 3, hashString(`${r.z}ry`) % 3, 0);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [items, dummy]);

  if (items.length === 0) return null;
  return <instancedMesh ref={ref} args={[geo, mat, items.length]} />;
}

// Animated water surface
function WaterSurface() {
  const ref = useRef();
  const totalW = COLS * (HEX_RADIUS + GAP) * 2 * 0.75 + 8;
  const totalH = ROWS * (HEX_H + GAP) + 8;
  const geo = useMemo(() => new THREE.PlaneGeometry(totalW, totalH, 80, 40), [totalW, totalH]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, Math.sin(x * 0.4 + t * 0.7) * 0.015 + Math.cos(z * 0.5 + t * 0.5) * 0.01);
    }
    pos.needsUpdate = true;
  });

  return (
    <mesh ref={ref} geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_Y - 0.08, 0]}>
      <meshPhysicalMaterial
        color="#1a4880"
        roughness={0.15}
        metalness={0.5}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

export default function GlobeView({ onSectorHover }) {
  const { galaxyId, starId, planetId, regionId } = useParams();
  const navigate = useNavigate();
  const seed = `${galaxyId}${starId}${planetId}r${regionId}`;
  const seedVal = hashString(seed);

  const hexData = useMemo(() => generateTerrain(seedVal), [seedVal]);
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
      {/* Isometric-style camera: limited rotation, fixed angle */}
      <OrbitControls
        minDistance={10}
        maxDistance={50}
        target={[0, 0, 0]}
        enableZoom enablePan
        enableRotate={true}
        dampingFactor={0.08}
        enableDamping
        // Lock to near-isometric angle
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.38}
        minAzimuthAngle={-Math.PI * 0.25}
        maxAzimuthAngle={Math.PI * 0.25}
      />

      {/* Sky-colored background light */}
      <color attach="background" args={["#87a8c4"]} />
      <fog attach="fog" args={["#87a8c4", 40, 90]} />

      {/* Lighting: warm key + cool fill */}
      <ambientLight intensity={0.5} color="#d4e0f0" />
      <directionalLight
        position={[-20, 25, 15]} intensity={1.6} color="#fff8e8"
        castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-far={80} shadow-camera-left={-25} shadow-camera-right={25}
        shadow-camera-top={25} shadow-camera-bottom={-25} shadow-bias={-0.001}
      />
      <directionalLight position={[15, 10, -10]} intensity={0.3} color="#8ab4e0" />

      <WaterSurface />
      <HexTerrain hexData={hexData} seedVal={seedVal} onSectorHover={handleSectorHover} onSectorClick={handleSectorClick} />
      <Trees hexData={hexData} seedVal={seedVal} />
      <Houses hexData={hexData} seedVal={seedVal} />
      <Rocks hexData={hexData} seedVal={seedVal} />

      {/* Hover label */}
      {hoveredIdx !== null && (() => {
        const d = hexData[hoveredIdx];
        const y = d.biome === "water" ? WATER_Y + 0.5 : LAND_Y + 0.8;
        return (
          <Html position={[d.wx, y, d.wz]} center style={{ pointerEvents: "none" }}>
            <div style={{
              color: "#fff", fontSize: "0.65rem", fontFamily: '"Roboto Mono", monospace',
              textShadow: "0 1px 3px rgba(0,0,0,0.5)", whiteSpace: "nowrap",
              background: "rgba(0, 0, 0, 0.5)", padding: "3px 10px", borderRadius: 4,
            }}>
              Sector {hoveredIdx} — {d.biome.replace(/_/g, " ")}
            </div>
          </Html>
        );
      })()}
    </>
  );
}
