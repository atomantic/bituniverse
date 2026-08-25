import React, { useEffect, useRef, useMemo, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useParams, useNavigate } from "react-router-dom";
import ProceduralPlanet from "../components/3d/ProceduralPlanet";
import {
  getRandomPlanetType,
  generatePlanetColor,
} from "../config/planetTypes";
import { ORBIT_CONTROLS } from "../config/renderConfig";

const LAT_DIVISIONS = 7;
const LON_DIVISIONS = 7;
const ZONE_COUNT = LAT_DIVISIONS * LON_DIVISIONS;

// Grid overlay on planet showing regions
function RegionGrid({ planetRadius, onZoneHover, onZoneClick }) {
  const groupRef = useRef();

  // Lat/lon grid lines on sphere
  const gridLines = useMemo(() => {
    const points = [];
    const r = planetRadius + 0.05;

    // Latitude circles
    for (let i = 1; i < LAT_DIVISIONS; i++) {
      const phi = (i / LAT_DIVISIONS) * Math.PI;
      const ringR = r * Math.sin(phi);
      const y = r * Math.cos(phi);
      for (let j = 0; j <= 64; j++) {
        const theta = (j / 64) * Math.PI * 2;
        points.push(new THREE.Vector3(ringR * Math.cos(theta), y, ringR * Math.sin(theta)));
        if (j > 0 && j < 64) {
          points.push(new THREE.Vector3(ringR * Math.cos(theta), y, ringR * Math.sin(theta)));
        }
      }
    }

    // Longitude semicircles
    for (let i = 0; i < LON_DIVISIONS; i++) {
      const theta = (i / LON_DIVISIONS) * Math.PI * 2;
      for (let j = 0; j <= 64; j++) {
        const phi = (j / 64) * Math.PI;
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi);
        const z = r * Math.sin(phi) * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, z));
        if (j > 0 && j < 64) {
          points.push(new THREE.Vector3(x, y, z));
        }
      }
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [planetRadius]);

  // Invisible hit sphere for raycasting
  const hitSphereRef = useRef();
  const { raycaster, pointer, camera } = useThree();
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Zone highlight patches (instanced circles on sphere)
  const patchRef = useRef();
  const patchGeo = useMemo(() => new THREE.CircleGeometry(planetRadius * 0.18, 16), [planetRadius]);
  const patchMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#4df4ff", opacity: 0, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
    []
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!patchRef.current) return;
    const r = planetRadius + 0.08;
    for (let lat = 0; lat < LAT_DIVISIONS; lat++) {
      for (let lon = 0; lon < LON_DIVISIONS; lon++) {
        const idx = lat * LON_DIVISIONS + lon;
        const phi = ((lat + 0.5) / LAT_DIVISIONS) * Math.PI;
        const theta = ((lon + 0.5) / LON_DIVISIONS) * Math.PI * 2;
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi);
        const z = r * Math.sin(phi) * Math.sin(theta);
        dummy.position.set(x, y, z);
        dummy.lookAt(0, 0, 0);
        dummy.updateMatrix();
        patchRef.current.setMatrixAt(idx, dummy.matrix);
        patchRef.current.setColorAt(idx, new THREE.Color(0.3, 0.96, 1.0));
      }
    }
    patchRef.current.instanceMatrix.needsUpdate = true;
    patchRef.current.instanceColor.needsUpdate = true;
  }, [planetRadius, dummy]);

  useFrame(() => {
    if (!hitSphereRef.current) return;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(hitSphereRef.current);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const r = point.length();
      const phi = Math.acos(point.y / r);
      const theta = Math.atan2(point.z, point.x);
      const lat = Math.floor((phi / Math.PI) * LAT_DIVISIONS);
      const lon = Math.floor(((theta + Math.PI) / (Math.PI * 2)) * LON_DIVISIONS);
      const idx = Math.max(0, Math.min(LAT_DIVISIONS - 1, lat)) * LON_DIVISIONS + Math.max(0, Math.min(LON_DIVISIONS - 1, lon));
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
  });

  // Recolor only the affected patches when hover changes (not all 49 every frame)
  const prevHoveredRef = useRef(null);
  useEffect(() => {
    if (!patchRef.current) return;
    patchMat.opacity = hoveredIdx !== null ? 0.35 : 0;
    const baseColor = new THREE.Color(0.3, 0.96, 1.0);
    const hotColor = new THREE.Color(1.0, 1.0, 1.0);
    if (prevHoveredRef.current !== null && prevHoveredRef.current !== hoveredIdx) {
      patchRef.current.setColorAt(prevHoveredRef.current, baseColor);
    }
    if (hoveredIdx !== null) {
      patchRef.current.setColorAt(hoveredIdx, hotColor);
    }
    prevHoveredRef.current = hoveredIdx;
    if (patchRef.current.instanceColor) patchRef.current.instanceColor.needsUpdate = true;
  }, [hoveredIdx, patchMat]);

  return (
    <group ref={groupRef}>
      {/* Grid lines */}
      <lineSegments geometry={gridLines}>
        <lineBasicMaterial color="#4df4ff" opacity={0.12} transparent />
      </lineSegments>

      {/* Invisible hit sphere */}
      <mesh ref={hitSphereRef} visible={false} onClick={(e) => {
        e.stopPropagation();
        const point = e.point;
        const r = point.length();
        const phi = Math.acos(point.y / r);
        const theta = Math.atan2(point.z, point.x);
        const lat = Math.floor((phi / Math.PI) * LAT_DIVISIONS);
        const lon = Math.floor(((theta + Math.PI) / (Math.PI * 2)) * LON_DIVISIONS);
        const idx = Math.max(0, Math.min(LAT_DIVISIONS - 1, lat)) * LON_DIVISIONS + Math.max(0, Math.min(LON_DIVISIONS - 1, lon));
        onZoneClick?.(idx);
      }}>
        <sphereGeometry args={[planetRadius + 0.1, 32, 32]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Zone highlight patches */}
      <instancedMesh ref={patchRef} args={[patchGeo, patchMat, ZONE_COUNT]} />

      {/* Hovered zone label */}
      {hoveredIdx !== null && (() => {
        const lat = Math.floor(hoveredIdx / LON_DIVISIONS);
        const lon = hoveredIdx % LON_DIVISIONS;
        const phi = ((lat + 0.5) / LAT_DIVISIONS) * Math.PI;
        const theta = ((lon + 0.5) / LON_DIVISIONS) * Math.PI * 2;
        const r = planetRadius + 0.6;
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi);
        const z = r * Math.sin(phi) * Math.sin(theta);
        return (
          <Html position={[x, y, z]} center style={{ pointerEvents: "none" }}>
            <div style={{
              color: "#4df4ff", fontSize: "0.7rem", fontFamily: '"Roboto Mono", monospace',
              textShadow: "0 0 8px rgba(77, 244, 255, 0.8)", whiteSpace: "nowrap",
            }}>
              Region {hoveredIdx}
            </div>
          </Html>
        );
      })()}
    </group>
  );
}

function Planet({ planetData, isSelected = true }) {
  const groupRef = useRef();

  return (
    <group ref={groupRef}>
      <directionalLight position={[-5, 3, 5]} intensity={1.5} />
      <group renderOrder={1}>
        <ProceduralPlanet
          radius={planetData.size * 5}
          seed={planetData.seed}
          color={planetData.color}
          type={planetData.type}
          planetTypeConfig={planetData.planetTypeConfig}
          hasAtmosphere={planetData.hasAtmosphere}
          atmosphereOpacity={planetData.atmosphereOpacity}
          atmosphereColor={planetData.atmosphereColor}
          metalness={planetData.metalness}
          roughness={planetData.roughness}
          terrainExaggeration={planetData.terrainExaggeration}
          rotationSpeed={planetData.rotationSpeed}
          detail={64}
          isSelected={isSelected}
          onHover={() => { document.body.style.cursor = "pointer"; }}
          onUnhover={() => { document.body.style.cursor = "default"; }}
        />
      </group>
    </group>
  );
}

export default function PlanetView({ onPlanetHover, onRegionHover }) {
  const { galaxyId, starId, planetId } = useParams();
  const navigate = useNavigate();

  const planetData = useMemo(() => {
    const planetSeed = `${galaxyId}${starId}${planetId}`;
    const planetType = getRandomPlanetType(planetSeed);
    const [minSize, maxSize] = planetType.sizeRange;
    const size = minSize + (parseInt(planetSeed.slice(-2), 10) / 100) * (maxSize - minSize);
    const color = generatePlanetColor(planetType, planetSeed);
    return {
      id: planetId,
      type: planetType.id,
      name: planetType.name,
      size,
      seed: planetSeed,
      color: color.getHex(),
      hasAtmosphere: planetType.hasAtmosphere,
      atmosphereOpacity: planetType.atmosphereOpacity,
      atmosphereColor: planetType.atmosphereColor,
      metalness: planetType.metalness,
      roughness: planetType.roughness,
      terrainExaggeration: planetType.terrainExaggeration,
      distance: 40 + (parseInt(planetSeed.slice(-2), 10) % 60),
      rotationSpeed: 0.1 + (parseInt(planetSeed.slice(-3), 10) % 20) / 100,
      planetTypeConfig: planetType,
    };
  }, [galaxyId, starId, planetId]);

  const planetRadius = planetData.size * 5;

  useEffect(() => {
    onPlanetHover?.(planetData);
  }, [planetData, onPlanetHover]);

  const handleZoneHover = useCallback(
    (idx) => { onRegionHover?.(idx); },
    [onRegionHover]
  );

  useEffect(() => {
    return () => { document.body.style.cursor = "default"; };
  }, []);

  const handleZoneClick = useCallback(
    (idx) => {
      navigate(`/galaxy/${galaxyId}/star/${starId}/planet/${planetId}/region/${idx}`);
    },
    [navigate, galaxyId, starId, planetId]
  );

  return (
    <>
      <OrbitControls
        {...ORBIT_CONTROLS}
        minDistance={planetRadius * 0.1}
        maxDistance={1000}
        maxPolarAngle={Math.PI}
        target={[0, 0, 0]}
        enableZoom
        enablePan
        enableRotate
        zoomSpeed={2.0}
        dampingFactor={0.05}
        rotateSpeed={1.0}
        panSpeed={1.0}
      />
      <Planet planetData={planetData} isSelected={true} />
      <RegionGrid
        planetRadius={planetRadius}
        onZoneHover={handleZoneHover}
        onZoneClick={handleZoneClick}
      />
    </>
  );
}
