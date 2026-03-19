import React, { useRef, useMemo, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
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

const GRID_SIZE = 50;
const GRAIN_COUNT = 2000;
const GRAIN_RADIUS = 0.08;

function TerrainSurface({ seedVal }) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE, 128, 128);
    const vertices = geo.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i + 2] = fbm2D(vertices[i] * 0.1, vertices[i + 1] * 0.1, seedVal, 7) * 2;
    }
    geo.computeVertexNormals();
    return geo;
  }, [seedVal]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial color="#6B5B3A" roughness={0.9} metalness={0.1} flatShading />
    </mesh>
  );
}

function Grains({ seedVal, onGrainHover, onGrainClick }) {
  const meshRef = useRef();

  const positions = useMemo(() => {
    const pos = new Float32Array(GRAIN_COUNT * 3);
    for (let i = 0; i < GRAIN_COUNT; i++) {
      const grainSeed = seedVal + i * 7919;
      const x = ((hashString(`${grainSeed}x`) % 1000) / 1000 - 0.5) * (GRID_SIZE - 4);
      const z = ((hashString(`${grainSeed}z`) % 1000) / 1000 - 0.5) * (GRID_SIZE - 4);
      const y = fbm2D(x * 0.1, z * 0.1, seedVal, 7) * 2 + GRAIN_RADIUS;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, [seedVal]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(GRAIN_RADIUS, 8, 8), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#C4A87A", roughness: 0.7, metalness: 0.3 }),
    []
  );

  React.useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < GRAIN_COUNT; i++) {
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      const scale = 0.8 + (hashString(`${seedVal}s${i}`) % 100) / 200;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      const variation = (hashString(`${seedVal}c${i}`) % 100) / 500;
      meshRef.current.setColorAt(i, new THREE.Color(0.77 + variation, 0.66 + variation, 0.48 + variation));
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor.needsUpdate = true;
  }, [positions, seedVal, dummy]);

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
        document.body.style.cursor = "pointer";
      }
    } else if (hoveredIdx !== null) {
      setHoveredIdx(null);
      onGrainHover?.(null);
      document.body.style.cursor = "default";
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, GRAIN_COUNT]}
      onClick={(e) => {
        e.stopPropagation();
        if (e.instanceId != null) onGrainClick?.(e.instanceId);
      }}
    />
  );
}

export default function GroundView({ onGrainHover }) {
  const params = useParams();
  const { galaxyId, starId, planetId, regionId, sectorId, areaId, groundId } = params;
  const navigate = useNavigate();
  const seed = `${galaxyId}${starId}${planetId}r${regionId}s${sectorId}a${areaId}g${groundId}`;
  const seedVal = hashString(seed);

  const handleGrainHover = useCallback(
    (idx) => { onGrainHover?.(idx); },
    [onGrainHover]
  );

  React.useEffect(() => {
    return () => { document.body.style.cursor = "default"; };
  }, []);

  const handleGrainClick = useCallback(
    (idx) => {
      navigate(
        `/galaxy/${galaxyId}/star/${starId}/planet/${planetId}/region/${regionId}/sector/${sectorId}/area/${areaId}/ground/${groundId}/grain/${idx}`
      );
    },
    [navigate, galaxyId, starId, planetId, regionId, sectorId, areaId, groundId]
  );

  return (
    <>
      <OrbitControls {...ORBIT_CONTROLS} minDistance={2} maxDistance={80} target={[0, 0, 0]} enableZoom enablePan enableRotate zoomSpeed={1.5} dampingFactor={0.05} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[-5, 8, 5]} intensity={1.4} castShadow />
      <pointLight position={[0, 10, 0]} intensity={0.3} color="#fff4ea" />
      <Stars radius={500} depth={25} count={2000} factor={2} saturation={1} fade speed={0} />
      <TerrainSurface seedVal={seedVal} />
      <Grains seedVal={seedVal} onGrainHover={handleGrainHover} onGrainClick={handleGrainClick} />
    </>
  );
}
