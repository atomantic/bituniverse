import React, { useRef, useMemo, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useParams, useNavigate } from "react-router-dom";
import { hashString } from "../config/planetTypes";
import { ORBIT_CONTROLS } from "../config/renderConfig";

const ATOM_COUNT = 500;
const CLUSTER_RADIUS = 12;

const ELEMENT_COLORS = [
  new THREE.Color("#ff4444"), // oxygen-like
  new THREE.Color("#4488ff"), // nitrogen-like
  new THREE.Color("#44ff88"), // carbon-like
  new THREE.Color("#ffaa22"), // sulfur-like
  new THREE.Color("#ff44ff"), // phosphorus-like
  new THREE.Color("#ffffff"), // hydrogen-like
];

function MolecularCluster({ seed, onAtomHover, onAtomClick }) {
  const meshRef = useRef();
  const seedVal = hashString(seed);

  const { positions, colors, radii } = useMemo(() => {
    const pos = new Float32Array(ATOM_COUNT * 3);
    const col = new Float32Array(ATOM_COUNT * 3);
    const rad = new Float32Array(ATOM_COUNT);

    for (let i = 0; i < ATOM_COUNT; i++) {
      const h1 = hashString(`${seedVal}m${i}a`);
      const h2 = hashString(`${seedVal}m${i}b`);
      const h3 = hashString(`${seedVal}m${i}c`);

      // Clustered organic arrangement
      const theta = ((h1 % 10000) / 10000) * Math.PI * 2;
      const phi = Math.acos((h2 % 10000) / 5000 - 1);
      const r = Math.cbrt((h3 % 10000) / 10000) * CLUSTER_RADIUS;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const elemIdx = h1 % ELEMENT_COLORS.length;
      const c = ELEMENT_COLORS[elemIdx];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      rad[i] = 0.15 + (h2 % 100) / 300;
    }
    return { positions: pos, colors: col, radii: rad };
  }, [seedVal]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 12, 12), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      metalness: 0.3,
      roughness: 0.4,
      emissiveIntensity: 0.2,
    }),
    []
  );

  React.useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < ATOM_COUNT; i++) {
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      const s = radii[i];
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]));
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor.needsUpdate = true;
  }, [positions, colors, radii, dummy]);

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
        onAtomHover?.(idx);
        document.body.style.cursor = "pointer";
      }
    } else if (hoveredIdx !== null) {
      setHoveredIdx(null);
      onAtomHover?.(null);
      document.body.style.cursor = "default";
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, ATOM_COUNT]}
      onClick={(e) => {
        e.stopPropagation();
        if (e.instanceId != null) onAtomClick?.(e.instanceId);
      }}
    />
  );
}

function MolecularBonds({ seed }) {
  const seedVal = hashString(seed);

  const lineGeometry = useMemo(() => {
    const points = [];
    const positions = [];
    for (let i = 0; i < ATOM_COUNT; i++) {
      const h1 = hashString(`${seedVal}m${i}a`);
      const h2 = hashString(`${seedVal}m${i}b`);
      const h3 = hashString(`${seedVal}m${i}c`);
      const theta = ((h1 % 10000) / 10000) * Math.PI * 2;
      const phi = Math.acos((h2 % 10000) / 5000 - 1);
      const r = Math.cbrt((h3 % 10000) / 10000) * CLUSTER_RADIUS;
      positions.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ));
    }
    // Connect nearby atoms
    for (let i = 0; i < ATOM_COUNT; i++) {
      for (let j = i + 1; j < Math.min(i + 8, ATOM_COUNT); j++) {
        const dist = positions[i].distanceTo(positions[j]);
        if (dist < 3) {
          points.push(positions[i], positions[j]);
        }
      }
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [seedVal]);

  return (
    <lineSegments geometry={lineGeometry}>
      <lineBasicMaterial color="#4df4ff" opacity={0.1} transparent />
    </lineSegments>
  );
}

export default function MoleculeView({ onAtomHover }) {
  const params = useParams();
  const { galaxyId, starId, planetId, continentId, regionId, areaId, groundId, grainId, moleculeId } = params;
  const navigate = useNavigate();
  const seed = `${galaxyId}${starId}${planetId}c${continentId}r${regionId}a${areaId}g${groundId}gr${grainId}m${moleculeId}`;

  const handleAtomHover = useCallback(
    (idx) => { onAtomHover?.(idx); },
    [onAtomHover]
  );

  React.useEffect(() => {
    return () => { document.body.style.cursor = "default"; };
  }, []);

  const handleAtomClick = useCallback(
    (idx) => {
      navigate(
        `/galaxy/${galaxyId}/star/${starId}/planet/${planetId}/globe/${continentId}/region/${regionId}/area/${areaId}/ground/${groundId}/grain/${grainId}/molecule/${moleculeId}/atom/${idx}`
      );
    },
    [navigate, galaxyId, starId, planetId, continentId, regionId, areaId, groundId, grainId, moleculeId]
  );

  return (
    <>
      <OrbitControls
        {...ORBIT_CONTROLS}
        minDistance={5}
        maxDistance={40}
        target={[0, 0, 0]}
        enableZoom
        enablePan
        enableRotate
        dampingFactor={0.05}
      />
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 0, 0]} intensity={0.8} color="#44ff88" distance={25} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#4488ff" />
      <directionalLight position={[-5, 5, 5]} intensity={0.6} />
      <Stars radius={500} depth={25} count={500} factor={1} saturation={0.3} fade speed={0} />
      <MolecularCluster seed={seed} onAtomHover={handleAtomHover} onAtomClick={handleAtomClick} />
      <MolecularBonds seed={seed} />
    </>
  );
}
