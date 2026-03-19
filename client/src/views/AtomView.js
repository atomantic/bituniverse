import React, { useRef, useMemo, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useParams, useNavigate } from "react-router-dom";
import { hashString } from "../config/planetTypes";
import { ORBIT_CONTROLS } from "../config/renderConfig";

const QUARK_COUNT = 500;
const NUCLEUS_RADIUS = 8;
const QUARK_COLORS = [
  new THREE.Color("#ff3333"), new THREE.Color("#33ff33"), new THREE.Color("#3366ff"),
  new THREE.Color("#ff33ff"), new THREE.Color("#ffff33"), new THREE.Color("#33ffff"),
];

function Nucleus({ seed, onQuarkHover, onQuarkClick }) {
  const meshRef = useRef();
  const seedVal = hashString(seed);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(QUARK_COUNT * 3);
    const col = new Float32Array(QUARK_COUNT * 3);
    for (let i = 0; i < QUARK_COUNT; i++) {
      const h1 = hashString(`${seedVal}q${i}a`), h2 = hashString(`${seedVal}q${i}b`), h3 = hashString(`${seedVal}q${i}c`);
      const theta = ((h1 % 10000) / 10000) * Math.PI * 2;
      const phi = Math.acos((h2 % 10000) / 5000 - 1);
      const r = Math.cbrt((h3 % 10000) / 10000) * NUCLEUS_RADIUS;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      const qc = QUARK_COLORS[i % QUARK_COLORS.length];
      col[i * 3] = qc.r; col[i * 3 + 1] = qc.g; col[i * 3 + 2] = qc.b;
    }
    return { positions: pos, colors: col };
  }, [seedVal]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.25, 12, 12), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ metalness: 0.4, roughness: 0.2, emissiveIntensity: 0.5 }), []);

  React.useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < QUARK_COUNT; i++) {
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]));
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor.needsUpdate = true;
  }, [positions, colors, dummy]);

  const { raycaster, pointer, camera } = useThree();
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useFrame(() => {
    if (!meshRef.current) return;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(meshRef.current);
    if (intersects.length > 0) {
      const idx = intersects[0].instanceId;
      if (idx !== hoveredIdx) { setHoveredIdx(idx); onQuarkHover?.(idx); document.body.style.cursor = "pointer"; }
    } else if (hoveredIdx !== null) { setHoveredIdx(null); onQuarkHover?.(null); document.body.style.cursor = "default"; }
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, QUARK_COUNT]}
      onClick={(e) => { e.stopPropagation(); if (e.instanceId != null) onQuarkClick?.(e.instanceId); }}
    />
  );
}

function ElectronOrbits() {
  const orbits = useMemo(() => [
    { radius: 12, rotation: [0, 0, 0], color: "#4488ff" },
    { radius: 14, rotation: [Math.PI / 3, 0, Math.PI / 4], color: "#44aaff" },
    { radius: 16, rotation: [0, Math.PI / 3, -Math.PI / 6], color: "#44ccff" },
  ], []);

  return (
    <>{orbits.map((orbit, i) => {
      const curve = new THREE.EllipseCurve(0, 0, orbit.radius, orbit.radius, 0, 2 * Math.PI, false, 0);
      const pts = curve.getPoints(128).map((p) => new THREE.Vector3(p.x, 0, p.y));
      const geometry = new THREE.BufferGeometry().setFromPoints(pts);
      return <group key={i} rotation={orbit.rotation}><line geometry={geometry}><lineBasicMaterial color={orbit.color} opacity={0.15} transparent /></line></group>;
    })}</>
  );
}

export default function AtomView({ onQuarkHover }) {
  const { galaxyId, starId, planetId, regionId, sectorId, areaId, groundId, grainId, moleculeId, atomId } = useParams();
  const navigate = useNavigate();
  const base = `/galaxy/${galaxyId}/star/${starId}/planet/${planetId}/region/${regionId}/sector/${sectorId}/area/${areaId}/ground/${groundId}/grain/${grainId}/molecule/${moleculeId}/atom/${atomId}`;
  const seed = `${galaxyId}${starId}${planetId}r${regionId}s${sectorId}a${areaId}g${groundId}gr${grainId}m${moleculeId}a${atomId}`;

  const handleQuarkHover = useCallback((idx) => { onQuarkHover?.(idx); }, [onQuarkHover]);
  React.useEffect(() => { return () => { document.body.style.cursor = "default"; }; }, []);
  const handleQuarkClick = useCallback((idx) => { navigate(`${base}/quark/${idx}`); }, [navigate, base]);

  return (
    <>
      <OrbitControls {...ORBIT_CONTROLS} minDistance={5} maxDistance={50} target={[0, 0, 0]} enableZoom enablePan enableRotate dampingFactor={0.05} />
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} intensity={1.5} color="#ff6633" distance={30} />
      <pointLight position={[15, 10, 10]} intensity={0.5} color="#4488ff" />
      <Stars radius={500} depth={25} count={500} factor={1} saturation={0.3} fade speed={0} />
      <mesh><sphereGeometry args={[NUCLEUS_RADIUS + 0.5, 32, 32]} /><meshBasicMaterial color="#ff6633" opacity={0.05} transparent side={THREE.BackSide} /></mesh>
      <Nucleus seed={seed} onQuarkHover={handleQuarkHover} onQuarkClick={handleQuarkClick} />
      <ElectronOrbits />
    </>
  );
}
