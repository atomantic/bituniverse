import React, { useRef, useMemo, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useParams, useNavigate } from "react-router-dom";
import { hashString } from "../config/planetTypes";
import { ORBIT_CONTROLS } from "../config/renderConfig";

const LAT_DIVISIONS = 7;
const LON_DIVISIONS = 7;
const ZONE_COUNT = LAT_DIVISIONS * LON_DIVISIONS; // 49
const GLOBE_RADIUS = 10;

// Simple fbm noise for continent coloring
function noise3D(x, y, z, seed) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 45.164 + seed * 43.12) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
}

function fbm3D(x, y, z, seed, octaves = 6) {
  let value = 0, amplitude = 1, frequency = 1, maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise3D(x * frequency, y * frequency, z * frequency, seed + i * 17);
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value / maxValue;
}

function GlobeSphere({ seed, onZoneHover, onZoneClick }) {
  const meshRef = useRef();
  const seedVal = hashString(seed);
  const glowRef = useRef();

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const n = fbm3D(x * 0.15, y * 0.15, z * 0.15, seedVal, 6);

      // Land vs ocean coloring
      if (n > 0.1) {
        // Land - greens/browns
        const t = (n - 0.1) / 0.9;
        colors[i * 3] = 0.2 + t * 0.4;
        colors[i * 3 + 1] = 0.4 + t * 0.3;
        colors[i * 3 + 2] = 0.1 + t * 0.1;
      } else {
        // Ocean - blues
        const t = (n + 1) / 1.1;
        colors[i * 3] = 0.05 + t * 0.1;
        colors[i * 3 + 1] = 0.1 + t * 0.2;
        colors[i * 3 + 2] = 0.3 + t * 0.5;
      }

      // Slight terrain displacement
      const displacement = 1 + Math.max(0, n * 0.03);
      pos.setXYZ(i, x * displacement, y * displacement, z * displacement);
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [seedVal]);

  // Zone grid overlay - instanced flat discs on sphere surface
  const zoneData = useMemo(() => {
    const positions = [];
    const normals = [];
    for (let lat = 0; lat < LAT_DIVISIONS; lat++) {
      for (let lon = 0; lon < LON_DIVISIONS; lon++) {
        const phi = ((lat + 0.5) / LAT_DIVISIONS) * Math.PI;
        const theta = ((lon + 0.5) / LON_DIVISIONS) * Math.PI * 2;
        const r = GLOBE_RADIUS + 0.05;
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi);
        const z = r * Math.sin(phi) * Math.sin(theta);
        positions.push([x, y, z]);
        normals.push([x, y, z]); // normal points outward
      }
    }
    return { positions, normals };
  }, []);

  const zoneMeshRef = useRef();
  const zoneGeo = useMemo(() => new THREE.CircleGeometry(GLOBE_RADIUS * 0.2, 16), []);
  const zoneMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#4df4ff", opacity: 0, transparent: true, side: THREE.DoubleSide }),
    []
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  React.useEffect(() => {
    if (!zoneMeshRef.current) return;
    for (let i = 0; i < ZONE_COUNT; i++) {
      const [x, y, z] = zoneData.positions[i];
      dummy.position.set(x, y, z);
      dummy.lookAt(0, 0, 0);
      dummy.updateMatrix();
      zoneMeshRef.current.setMatrixAt(i, dummy.matrix);
    }
    zoneMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [zoneData, dummy]);

  const { raycaster, pointer, camera } = useThree();
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useFrame(() => {
    // Rotate globe slowly
    if (meshRef.current) meshRef.current.rotation.y += 0.001;

    // Raycast against zone instances
    if (!zoneMeshRef.current) return;
    raycaster.setFromCamera(pointer, camera);

    // Raycast against the main sphere for zone detection
    const sphereIntersects = raycaster.intersectObject(meshRef.current);
    if (sphereIntersects.length > 0) {
      const point = sphereIntersects[0].point;
      // Apply inverse rotation to get local coordinates
      const localPoint = point.clone();
      if (meshRef.current) {
        const invMatrix = new THREE.Matrix4().copy(meshRef.current.matrixWorld).invert();
        localPoint.applyMatrix4(invMatrix);
      }
      // Convert to lat/lon zone
      const r = localPoint.length();
      const phi = Math.acos(localPoint.y / r);
      const theta = Math.atan2(localPoint.z, localPoint.x);
      const lat = Math.floor((phi / Math.PI) * LAT_DIVISIONS);
      const lon = Math.floor(((theta + Math.PI) / (Math.PI * 2)) * LON_DIVISIONS);
      const clampedLat = Math.max(0, Math.min(LAT_DIVISIONS - 1, lat));
      const clampedLon = Math.max(0, Math.min(LON_DIVISIONS - 1, lon));
      const idx = clampedLat * LON_DIVISIONS + clampedLon;
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

    // Update zone highlight
    if (zoneMeshRef.current) {
      for (let i = 0; i < ZONE_COUNT; i++) {
        const color = i === hoveredIdx ? new THREE.Color("#4df4ff") : new THREE.Color("#4df4ff");
        zoneMeshRef.current.setColorAt(i, color);
      }
      if (zoneMeshRef.current.instanceColor) zoneMeshRef.current.instanceColor.needsUpdate = true;
    }
  });

  // Atmosphere glow
  const atmosphereGeo = useMemo(() => new THREE.SphereGeometry(GLOBE_RADIUS * 1.15, 32, 32), []);

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} onClick={(e) => {
        e.stopPropagation();
        // Determine which zone was clicked using same lat/lon logic
        const point = e.point;
        const localPoint = point.clone();
        if (meshRef.current) {
          const invMatrix = new THREE.Matrix4().copy(meshRef.current.matrixWorld).invert();
          localPoint.applyMatrix4(invMatrix);
        }
        const r = localPoint.length();
        const phi = Math.acos(localPoint.y / r);
        const theta = Math.atan2(localPoint.z, localPoint.x);
        const lat = Math.floor((phi / Math.PI) * LAT_DIVISIONS);
        const lon = Math.floor(((theta + Math.PI) / (Math.PI * 2)) * LON_DIVISIONS);
        const clampedLat = Math.max(0, Math.min(LAT_DIVISIONS - 1, lat));
        const clampedLon = Math.max(0, Math.min(LON_DIVISIONS - 1, lon));
        const idx = clampedLat * LON_DIVISIONS + clampedLon;
        onZoneClick?.(idx);
      }}>
        <meshStandardMaterial vertexColors roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Zone overlay for hover highlight */}
      <instancedMesh ref={zoneMeshRef} args={[zoneGeo, zoneMat, ZONE_COUNT]} />

      {/* Atmosphere */}
      <mesh ref={glowRef} geometry={atmosphereGeo}>
        <meshBasicMaterial color="#4488ff" opacity={0.08} transparent side={THREE.BackSide} />
      </mesh>
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
        minDistance={12}
        maxDistance={40}
        target={[0, 0, 0]}
        enableZoom
        enablePan
        enableRotate
        dampingFactor={0.05}
      />
      <ambientLight intensity={0.3} />
      <directionalLight position={[-5, 3, 5]} intensity={1.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#4488ff" />
      <Stars radius={500} depth={25} count={2000} factor={2} saturation={1} fade speed={0} />
      <GlobeSphere seed={seed} onZoneHover={handleZoneHover} onZoneClick={handleZoneClick} />
    </>
  );
}
