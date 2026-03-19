import React, { useRef, useMemo, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useParams, useNavigate } from "react-router-dom";
import { hashString } from "../config/planetTypes";
import { ORBIT_CONTROLS } from "../config/renderConfig";

const GRID_DIM = 9;
const ATOM_COUNT = GRID_DIM * GRID_DIM * GRID_DIM;
const SPACING = 3;

function CrystalLattice({ seed, onMoleculeHover, onMoleculeClick }) {
  const meshRef = useRef();
  const seedVal = hashString(seed);

  const positions = useMemo(() => {
    const pos = new Float32Array(ATOM_COUNT * 3);
    const offset = ((GRID_DIM - 1) * SPACING) / 2;
    let idx = 0;
    for (let x = 0; x < GRID_DIM; x++) {
      for (let y = 0; y < GRID_DIM; y++) {
        for (let z = 0; z < GRID_DIM; z++) {
          pos[idx * 3] = x * SPACING - offset + (hashString(`${seedVal}${idx}x`) % 100) / 500;
          pos[idx * 3 + 1] = y * SPACING - offset + (hashString(`${seedVal}${idx}y`) % 100) / 500;
          pos[idx * 3 + 2] = z * SPACING - offset + (hashString(`${seedVal}${idx}z`) % 100) / 500;
          idx++;
        }
      }
    }
    return pos;
  }, [seedVal]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.4, 16, 16), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#6B8FCC", metalness: 0.6, roughness: 0.3, emissive: new THREE.Color("#1a3060"), emissiveIntensity: 0.2 }),
    []
  );

  React.useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < ATOM_COUNT; i++) {
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, dummy]);

  const { raycaster, pointer, camera } = useThree();
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useFrame(() => {
    if (!meshRef.current) return;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(meshRef.current);
    if (intersects.length > 0) {
      const idx = intersects[0].instanceId;
      if (idx !== hoveredIdx) { setHoveredIdx(idx); onMoleculeHover?.(idx); document.body.style.cursor = "pointer"; }
    } else if (hoveredIdx !== null) { setHoveredIdx(null); onMoleculeHover?.(null); document.body.style.cursor = "default"; }
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, ATOM_COUNT]}
      onClick={(e) => { e.stopPropagation(); if (e.instanceId != null) onMoleculeClick?.(e.instanceId); }}
    />
  );
}

function CrystalBonds({ seed }) {
  const seedVal = hashString(seed);
  const lineGeometry = useMemo(() => {
    const points = [];
    const offset = ((GRID_DIM - 1) * SPACING) / 2;
    for (let x = 0; x < GRID_DIM; x++) for (let y = 0; y < GRID_DIM; y++) for (let z = 0; z < GRID_DIM; z++) {
      const px = x * SPACING - offset, py = y * SPACING - offset, pz = z * SPACING - offset;
      if (x < GRID_DIM - 1) { points.push(new THREE.Vector3(px, py, pz)); points.push(new THREE.Vector3(px + SPACING, py, pz)); }
      if (y < GRID_DIM - 1) { points.push(new THREE.Vector3(px, py, pz)); points.push(new THREE.Vector3(px, py + SPACING, pz)); }
      if (z < GRID_DIM - 1) { points.push(new THREE.Vector3(px, py, pz)); points.push(new THREE.Vector3(px, py, pz + SPACING)); }
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [seedVal]);

  return <lineSegments geometry={lineGeometry}><lineBasicMaterial color="#4df4ff" opacity={0.08} transparent /></lineSegments>;
}

export default function GrainView({ onMoleculeHover }) {
  const { galaxyId, starId, planetId, regionId, sectorId, areaId, groundId, grainId } = useParams();
  const navigate = useNavigate();
  const base = `/galaxy/${galaxyId}/star/${starId}/planet/${planetId}/region/${regionId}/sector/${sectorId}/area/${areaId}/ground/${groundId}/grain/${grainId}`;
  const seed = `${galaxyId}${starId}${planetId}r${regionId}s${sectorId}a${areaId}g${groundId}gr${grainId}`;

  const handleMoleculeHover = useCallback((idx) => { onMoleculeHover?.(idx); }, [onMoleculeHover]);
  React.useEffect(() => { return () => { document.body.style.cursor = "default"; }; }, []);
  const handleMoleculeClick = useCallback((idx) => { navigate(`${base}/molecule/${idx}`); }, [navigate, base]);

  return (
    <>
      <OrbitControls {...ORBIT_CONTROLS} minDistance={5} maxDistance={60} target={[0, 0, 0]} enableZoom enablePan enableRotate dampingFactor={0.05} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#4df4ff" />
      <Stars radius={500} depth={25} count={1000} factor={1} saturation={0.5} fade speed={0} />
      <CrystalLattice seed={seed} onMoleculeHover={handleMoleculeHover} onMoleculeClick={handleMoleculeClick} />
      <CrystalBonds seed={seed} />
    </>
  );
}
