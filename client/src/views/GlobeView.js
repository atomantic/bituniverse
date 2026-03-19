import React, { useRef, useMemo, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import { useParams, useNavigate } from "react-router-dom";
import { hashString } from "../config/planetTypes";
import { ORBIT_CONTROLS } from "../config/renderConfig";

const GRID_X = 20;
const GRID_Y = 10;
const SECTOR_COUNT = GRID_X * GRID_Y; // 200 visible sectors (click targets)
const MAP_WIDTH = 48;
const MAP_HEIGHT = 24;
const CELL_W = MAP_WIDTH / GRID_X;
const CELL_H = MAP_HEIGHT / GRID_Y;

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

function WorldMap({ seed, onSectorHover, onSectorClick }) {
  const meshRef = useRef();
  const seedVal = hashString(seed);

  // Detailed terrain with biome coloring
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(MAP_WIDTH, MAP_HEIGHT, 240, 120);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);

      // Multiple noise layers for varied terrain
      const elevation = fbm2D(x * 0.12, y * 0.12, seedVal, 6);
      const moisture = fbm2D(x * 0.08 + 100, y * 0.08 + 100, seedVal + 42, 4);
      const temperature = 1.0 - Math.abs(y / (MAP_HEIGHT / 2)); // warmer at equator

      // Subtle height displacement for land
      const h = Math.max(0, elevation * 0.3);
      pos.setZ(i, h);

      // Biome coloring
      let r, g, b;
      if (elevation < -0.15) {
        // Deep ocean
        r = 0.04; g = 0.08; b = 0.35;
      } else if (elevation < 0.0) {
        // Shallow water
        const t = (elevation + 0.15) / 0.15;
        r = 0.06 + t * 0.05; g = 0.15 + t * 0.12; b = 0.4 + t * 0.15;
      } else if (elevation < 0.05) {
        // Beach/coast
        r = 0.65; g = 0.6; b = 0.4;
      } else if (elevation < 0.35) {
        // Land biomes based on moisture + temperature
        if (moisture > 0.2 && temperature > 0.3) {
          // Forest
          const t = (elevation - 0.05) / 0.3;
          r = 0.1 + t * 0.1; g = 0.3 + t * 0.15; b = 0.08 + t * 0.05;
        } else if (moisture < -0.1 && temperature > 0.5) {
          // Desert
          r = 0.7; g = 0.6; b = 0.35;
        } else if (temperature < 0.2) {
          // Tundra
          r = 0.55; g = 0.6; b = 0.58;
        } else {
          // Grassland
          const t = (elevation - 0.05) / 0.3;
          r = 0.25 + t * 0.15; g = 0.4 + t * 0.2; b = 0.15 + t * 0.05;
        }
      } else if (elevation < 0.55) {
        // Highland
        r = 0.35; g = 0.3; b = 0.2;
      } else {
        // Mountain/snow
        const t = Math.min(1, (elevation - 0.55) / 0.3);
        r = 0.4 + t * 0.5; g = 0.38 + t * 0.5; b = 0.35 + t * 0.5;
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [seedVal]);

  // Clickable grid overlay
  const cellGeo = useMemo(() => new THREE.PlaneGeometry(CELL_W - 0.06, CELL_H - 0.06), []);
  const cellMat = useMemo(
    () => new THREE.MeshBasicMaterial({ opacity: 0.04, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
    []
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  React.useEffect(() => {
    if (!meshRef.current) return;
    for (let row = 0; row < GRID_Y; row++) {
      for (let col = 0; col < GRID_X; col++) {
        const idx = row * GRID_X + col;
        const x = (col + 0.5) * CELL_W - MAP_WIDTH / 2;
        const y = (row + 0.5) * CELL_H - MAP_HEIGHT / 2;
        dummy.position.set(x, y, 0.35);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx, dummy.matrix);
        meshRef.current.setColorAt(idx, new THREE.Color(0.2, 0.6, 0.65));
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
        onSectorHover?.(idx);
        document.body.style.cursor = "pointer";
      }
    } else if (hoveredIdx !== null) {
      setHoveredIdx(null);
      onSectorHover?.(null);
      document.body.style.cursor = "default";
    }

    // Highlight hovered cell
    for (let i = 0; i < SECTOR_COUNT; i++) {
      meshRef.current.setColorAt(i,
        i === hoveredIdx ? new THREE.Color(0.3, 0.96, 1.0) : new THREE.Color(0.2, 0.6, 0.65)
      );
    }
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    cellMat.opacity = hoveredIdx !== null ? 0.15 : 0.04;
  });

  // Grid lines
  const gridLines = useMemo(() => {
    const points = [];
    for (let i = 0; i <= GRID_X; i++) {
      const x = i * CELL_W - MAP_WIDTH / 2;
      points.push(new THREE.Vector3(x, -MAP_HEIGHT / 2, 0.32));
      points.push(new THREE.Vector3(x, MAP_HEIGHT / 2, 0.32));
    }
    for (let i = 0; i <= GRID_Y; i++) {
      const y = i * CELL_H - MAP_HEIGHT / 2;
      points.push(new THREE.Vector3(-MAP_WIDTH / 2, y, 0.32));
      points.push(new THREE.Vector3(MAP_WIDTH / 2, y, 0.32));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  // Coastline contour lines
  const contourLines = useMemo(() => {
    const points = [];
    const resolution = 200;
    const threshold = 0.0; // sea level
    // Scan horizontally
    for (let row = 0; row < resolution; row++) {
      const y = (row / resolution) * MAP_HEIGHT - MAP_HEIGHT / 2;
      let prevAbove = null;
      for (let col = 0; col <= resolution; col++) {
        const x = (col / resolution) * MAP_WIDTH - MAP_WIDTH / 2;
        const e = fbm2D(x * 0.12, y * 0.12, seedVal, 6);
        const above = e > threshold;
        if (prevAbove !== null && above !== prevAbove) {
          points.push(new THREE.Vector3(x, y, 0.33));
          points.push(new THREE.Vector3(x + MAP_WIDTH / resolution, y, 0.33));
        }
        prevAbove = above;
      }
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [seedVal]);

  // Map border
  const borderGeo = useMemo(() => {
    const points = [
      new THREE.Vector3(-MAP_WIDTH / 2, -MAP_HEIGHT / 2, 0.31),
      new THREE.Vector3(MAP_WIDTH / 2, -MAP_HEIGHT / 2, 0.31),
      new THREE.Vector3(MAP_WIDTH / 2, MAP_HEIGHT / 2, 0.31),
      new THREE.Vector3(-MAP_WIDTH / 2, MAP_HEIGHT / 2, 0.31),
      new THREE.Vector3(-MAP_WIDTH / 2, -MAP_HEIGHT / 2, 0.31),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  return (
    <group>
      {/* Terrain */}
      <mesh geometry={terrainGeo}>
        <meshStandardMaterial vertexColors roughness={0.9} metalness={0.02} flatShading />
      </mesh>

      {/* Coastline highlights */}
      <lineSegments geometry={contourLines}>
        <lineBasicMaterial color="#88ddff" opacity={0.2} transparent />
      </lineSegments>

      {/* Grid lines */}
      <lineSegments geometry={gridLines}>
        <lineBasicMaterial color="#4df4ff" opacity={0.12} transparent />
      </lineSegments>

      {/* Map border */}
      <line geometry={borderGeo}>
        <lineBasicMaterial color="#4df4ff" opacity={0.4} transparent />
      </line>

      {/* Clickable sector overlay */}
      <instancedMesh
        ref={meshRef}
        args={[cellGeo, cellMat, SECTOR_COUNT]}
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId != null) onSectorClick?.(e.instanceId);
        }}
      />

      {/* Hovered sector label */}
      {hoveredIdx !== null && (() => {
        const row = Math.floor(hoveredIdx / GRID_X);
        const col = hoveredIdx % GRID_X;
        const x = (col + 0.5) * CELL_W - MAP_WIDTH / 2;
        const y = (row + 0.5) * CELL_H - MAP_HEIGHT / 2;
        return (
          <Html position={[x, y, 0.5]} center style={{ pointerEvents: "none" }}>
            <div style={{
              color: "#4df4ff", fontSize: "0.65rem", fontFamily: '"Roboto Mono", monospace',
              textShadow: "0 0 6px rgba(77, 244, 255, 0.6)", whiteSpace: "nowrap",
              background: "rgba(10, 6, 30, 0.6)", padding: "2px 6px", borderRadius: 3,
            }}>
              Sector {hoveredIdx}
            </div>
          </Html>
        );
      })()}
    </group>
  );
}

export default function GlobeView({ onSectorHover }) {
  const { galaxyId, starId, planetId, regionId } = useParams();
  const navigate = useNavigate();
  const seed = `${galaxyId}${starId}${planetId}r${regionId}`;

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
        minDistance={8}
        maxDistance={50}
        target={[0, 0, 0]}
        enableZoom
        enablePan
        enableRotate
        dampingFactor={0.05}
      />
      <ambientLight intensity={0.5} />
      <directionalLight position={[-5, 8, 10]} intensity={1.0} />
      <pointLight position={[0, 0, 10]} intensity={0.2} color="#4df4ff" />
      <Stars radius={500} depth={25} count={1000} factor={1} saturation={0.5} fade speed={0} />
      <WorldMap seed={seed} onSectorHover={handleSectorHover} onSectorClick={handleSectorClick} />
    </>
  );
}
