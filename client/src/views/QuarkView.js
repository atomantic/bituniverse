import React, { useRef, useMemo, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import { useParams } from "react-router-dom";
import { hashString } from "../config/planetTypes";
import { ORBIT_CONTROLS } from "../config/renderConfig";
import { computeHexKey } from "../utils/keyspaceHierarchy";

const STRING_COUNT = 500;
const FIELD_RADIUS = 15;

function GluonStrings({ seed, onStringHover }) {
  const meshRef = useRef();
  const seedVal = hashString(seed);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(STRING_COUNT * 3);
    const col = new Float32Array(STRING_COUNT * 3);
    for (let i = 0; i < STRING_COUNT; i++) {
      const h1 = hashString(`${seedVal}s${i}x`), h2 = hashString(`${seedVal}s${i}y`), h3 = hashString(`${seedVal}s${i}z`);
      pos[i * 3] = ((h1 % 10000) / 10000 - 0.5) * FIELD_RADIUS * 2;
      pos[i * 3 + 1] = ((h2 % 10000) / 10000 - 0.5) * FIELD_RADIUS * 2;
      pos[i * 3 + 2] = ((h3 % 10000) / 10000 - 0.5) * FIELD_RADIUS * 2;
      const c = new THREE.Color().setHSL((i / STRING_COUNT) * 0.3 + 0.5, 1, 0.6);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, [seedVal]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.15, 8, 8), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ metalness: 0.3, roughness: 0.1, emissiveIntensity: 0.8 }), []);

  React.useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < STRING_COUNT; i++) {
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
      if (idx !== hoveredIdx) { setHoveredIdx(idx); onStringHover?.(idx); }
    } else if (hoveredIdx !== null) { setHoveredIdx(null); onStringHover?.(null); }
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, STRING_COUNT]} />;
}

function FluxTubes({ seed }) {
  const seedVal = hashString(seed);
  const lineGeometry = useMemo(() => {
    const points = [], positions = [];
    for (let i = 0; i < STRING_COUNT; i++) {
      const h1 = hashString(`${seedVal}s${i}x`), h2 = hashString(`${seedVal}s${i}y`), h3 = hashString(`${seedVal}s${i}z`);
      positions.push(new THREE.Vector3(
        ((h1 % 10000) / 10000 - 0.5) * FIELD_RADIUS * 2,
        ((h2 % 10000) / 10000 - 0.5) * FIELD_RADIUS * 2,
        ((h3 % 10000) / 10000 - 0.5) * FIELD_RADIUS * 2
      ));
    }
    for (let i = 0; i < STRING_COUNT; i += 3) { if (i + 1 < STRING_COUNT) { points.push(positions[i], positions[i + 1]); } }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [seedVal]);
  return <lineSegments geometry={lineGeometry}><lineBasicMaterial color="#ff61d8" opacity={0.06} transparent /></lineSegments>;
}

function StringTooltipHtml({ stringIndex, ...params }) {
  if (stringIndex === null) return null;
  const { galaxyId, starId, planetId, regionId, sectorId, areaId, groundId, grainId, moleculeId, atomId, quarkId } = params;
  const hexKey = computeHexKey(galaxyId, starId, planetId, regionId, sectorId, areaId, groundId, grainId, moleculeId, atomId, quarkId, stringIndex);

  return (
    <Html center style={{ pointerEvents: "none" }} position={[0, -10, 0]}>
      <div style={{ background: "rgba(10, 6, 30, 0.9)", border: "1px solid rgba(77, 244, 255, 0.2)", borderRadius: 4, padding: "8px 12px", maxWidth: 420, fontFamily: '"Roboto Mono", monospace' }}>
        <div style={{ color: "#ff61d8", fontSize: "0.7rem", marginBottom: 4 }}>SHA-256 Key #{stringIndex.toLocaleString()}</div>
        <div style={{ color: "#4df4ff", fontSize: "0.55rem", wordBreak: "break-all", whiteSpace: "normal", maxWidth: 380, letterSpacing: "0.05em" }}>{hexKey}</div>
        <div style={{ color: "#a999b3", fontSize: "0.55rem", marginTop: 4 }}>This is a unique Bitcoin private key.</div>
      </div>
    </Html>
  );
}

export default function QuarkView({ onStringHover }) {
  const params = useParams();
  const { galaxyId, starId, planetId, regionId, sectorId, areaId, groundId, grainId, moleculeId, atomId, quarkId } = params;
  const [hoveredString, setHoveredString] = useState(null);
  const seed = `${galaxyId}${starId}${planetId}r${regionId}s${sectorId}a${areaId}g${groundId}gr${grainId}m${moleculeId}a${atomId}q${quarkId}`;

  const handleStringHover = (idx) => { setHoveredString(idx); onStringHover?.(idx); };

  return (
    <>
      <OrbitControls {...ORBIT_CONTROLS} minDistance={3} maxDistance={40} target={[0, 0, 0]} enableZoom enablePan enableRotate dampingFactor={0.05} />
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} intensity={0.8} color="#ff61d8" distance={25} />
      <pointLight position={[10, 5, 10]} intensity={0.4} color="#4df4ff" />
      <Stars radius={500} depth={25} count={300} factor={0.5} saturation={0.2} fade speed={0} />
      <GluonStrings seed={seed} onStringHover={handleStringHover} />
      <FluxTubes seed={seed} />
      <StringTooltipHtml stringIndex={hoveredString} {...params} />
    </>
  );
}
