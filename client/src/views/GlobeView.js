import React, { useRef, useMemo, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import { useParams, useNavigate } from "react-router-dom";
import { hashString } from "../config/planetTypes";
import { ORBIT_CONTROLS } from "../config/renderConfig";

const LAT_DIVISIONS = 7;
const LON_DIVISIONS = 7;
const ZONE_COUNT = LAT_DIVISIONS * LON_DIVISIONS; // 49
const MAP_WIDTH = 40;
const MAP_HEIGHT = 20;
const CELL_W = MAP_WIDTH / LON_DIVISIONS;
const CELL_H = MAP_HEIGHT / LAT_DIVISIONS;
const GAP = 0.08;

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

// Generate a color for a map cell based on noise (land vs ocean)
function getCellColor(cx, cy, seedVal) {
  const n = fbm2D(cx * 0.3, cy * 0.3, seedVal, 5);
  if (n > 0.05) {
    // Land
    const t = Math.min(1, (n - 0.05) / 0.7);
    if (t > 0.6) return new THREE.Color(0.55 + t * 0.15, 0.45 + t * 0.1, 0.25); // mountain
    return new THREE.Color(0.2 + t * 0.25, 0.35 + t * 0.3, 0.12 + t * 0.08); // green
  }
  // Ocean
  const t = (n + 1) / 1.05;
  return new THREE.Color(0.05 + t * 0.08, 0.12 + t * 0.15, 0.3 + t * 0.35);
}

function WorldMap({ seed, onZoneHover, onZoneClick }) {
  const meshRef = useRef();
  const seedVal = hashString(seed);

  // Generate detailed terrain background
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(MAP_WIDTH, MAP_HEIGHT, 200, 100);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const n = fbm2D(x * 0.3, y * 0.3, seedVal, 6);

      // Height displacement
      const h = Math.max(0, n * 0.5);
      pos.setZ(i, h);

      // Color
      const c = getCellColor(x, y, seedVal);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [seedVal]);

  // Zone grid cells (instanced boxes)
  const cellGeo = useMemo(() => new THREE.PlaneGeometry(CELL_W - GAP, CELL_H - GAP), []);
  const cellMat = useMemo(
    () => new THREE.MeshBasicMaterial({ opacity: 0.06, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
    []
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  React.useEffect(() => {
    if (!meshRef.current) return;
    for (let lat = 0; lat < LAT_DIVISIONS; lat++) {
      for (let lon = 0; lon < LON_DIVISIONS; lon++) {
        const idx = lat * LON_DIVISIONS + lon;
        const x = (lon + 0.5) * CELL_W - MAP_WIDTH / 2;
        const y = (lat + 0.5) * CELL_H - MAP_HEIGHT / 2;
        dummy.position.set(x, y, 0.6);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx, dummy.matrix);
        meshRef.current.setColorAt(idx, new THREE.Color(0.3, 0.95, 1.0));
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor.needsUpdate = true;
  }, [dummy]);

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
        onZoneHover?.(idx);
        document.body.style.cursor = "pointer";
      }
    } else if (hoveredIdx !== null) {
      setHoveredIdx(null);
      onZoneHover?.(null);
      document.body.style.cursor = "default";
    }

    // Update zone highlight — hovered zone gets bright, others stay dim
    for (let i = 0; i < ZONE_COUNT; i++) {
      if (i === hoveredIdx) {
        meshRef.current.setColorAt(i, new THREE.Color(0.3, 0.96, 1.0));
      } else {
        meshRef.current.setColorAt(i, new THREE.Color(0.15, 0.5, 0.55));
      }
    }
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    // Update opacity
    cellMat.opacity = hoveredIdx !== null ? 0.12 : 0.06;
  });

  // Grid lines
  const gridLines = useMemo(() => {
    const points = [];
    // Vertical lines
    for (let i = 0; i <= LON_DIVISIONS; i++) {
      const x = i * CELL_W - MAP_WIDTH / 2;
      points.push(new THREE.Vector3(x, -MAP_HEIGHT / 2, 0.55));
      points.push(new THREE.Vector3(x, MAP_HEIGHT / 2, 0.55));
    }
    // Horizontal lines
    for (let i = 0; i <= LAT_DIVISIONS; i++) {
      const y = i * CELL_H - MAP_HEIGHT / 2;
      points.push(new THREE.Vector3(-MAP_WIDTH / 2, y, 0.55));
      points.push(new THREE.Vector3(MAP_WIDTH / 2, y, 0.55));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  return (
    <group>
      {/* Terrain background */}
      <mesh geometry={terrainGeo}>
        <meshStandardMaterial vertexColors roughness={0.85} metalness={0.05} flatShading />
      </mesh>

      {/* Grid lines */}
      <lineSegments geometry={gridLines}>
        <lineBasicMaterial color="#4df4ff" opacity={0.25} transparent />
      </lineSegments>

      {/* Clickable zone overlay */}
      <instancedMesh
        ref={meshRef}
        args={[cellGeo, cellMat, ZONE_COUNT]}
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId != null) onZoneClick?.(e.instanceId);
        }}
      />

      {/* Zone labels */}
      {Array.from({ length: ZONE_COUNT }, (_, idx) => {
        const lat = Math.floor(idx / LON_DIVISIONS);
        const lon = idx % LON_DIVISIONS;
        const x = (lon + 0.5) * CELL_W - MAP_WIDTH / 2;
        const y = (lat + 0.5) * CELL_H - MAP_HEIGHT / 2;
        const isHovered = idx === hoveredIdx;
        return (
          <Html key={idx} position={[x, y, 0.7]} center style={{ pointerEvents: "none" }}>
            <div style={{
              color: isHovered ? "#4df4ff" : "rgba(77, 244, 255, 0.4)",
              fontSize: isHovered ? "0.7rem" : "0.55rem",
              fontFamily: '"Roboto Mono", monospace',
              textShadow: isHovered ? "0 0 8px rgba(77, 244, 255, 0.6)" : "none",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}>
              {isHovered ? `Zone ${idx}` : idx}
            </div>
          </Html>
        );
      })}
    </group>
  );
}

export default function GlobeView({ onContinentHover }) {
  const { galaxyId, starId, planetId } = useParams();
  const navigate = useNavigate();
  const seed = `${galaxyId}${starId}${planetId}`;

  const handleZoneHover = useCallback(
    (idx) => { onContinentHover?.(idx); },
    [onContinentHover]
  );

  React.useEffect(() => {
    return () => { document.body.style.cursor = "default"; };
  }, []);

  const handleZoneClick = useCallback(
    (idx) => {
      navigate(`/galaxy/${galaxyId}/star/${starId}/planet/${planetId}/globe/${idx}`);
    },
    [navigate, galaxyId, starId, planetId]
  );

  return (
    <>
      <OrbitControls
        {...ORBIT_CONTROLS}
        minDistance={8}
        maxDistance={50}
        target={[0, 0, 0]}
        enableZoom
        enablePan
        enableRotate
        dampingFactor={0.05}
      />
      <ambientLight intensity={0.5} />
      <directionalLight position={[-5, 8, 10]} intensity={1.2} />
      <pointLight position={[0, 0, 10]} intensity={0.3} color="#4df4ff" />
      <Stars radius={500} depth={25} count={2000} factor={2} saturation={1} fade speed={0} />
      <WorldMap seed={seed} onZoneHover={handleZoneHover} onZoneClick={handleZoneClick} />
    </>
  );
}
