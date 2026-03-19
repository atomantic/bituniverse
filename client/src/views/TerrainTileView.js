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

// Route path builders for each level
const ROUTE_BUILDERS = {
  sector: (params, childIdx) =>
    `/galaxy/${params.galaxyId}/star/${params.starId}/planet/${params.planetId}/region/${params.regionId}/sector/${params.sectorId}/area/${childIdx}`,
  area: (params, childIdx) =>
    `/galaxy/${params.galaxyId}/star/${params.starId}/planet/${params.planetId}/region/${params.regionId}/sector/${params.sectorId}/area/${params.areaId}/ground/${childIdx}`,
  ground: (params, childIdx) =>
    `/galaxy/${params.galaxyId}/star/${params.starId}/planet/${params.planetId}/region/${params.regionId}/sector/${params.sectorId}/area/${params.areaId}/ground/${params.groundId}/grain/${childIdx}`,
};

// Seed builders for each level
const SEED_BUILDERS = {
  sector: (params) => `${params.galaxyId}${params.starId}${params.planetId}r${params.regionId}s${params.sectorId}`,
  area: (params) => `${params.galaxyId}${params.starId}${params.planetId}r${params.regionId}s${params.sectorId}a${params.areaId}`,
  ground: (params) => `${params.galaxyId}${params.starId}${params.planetId}r${params.regionId}s${params.sectorId}a${params.areaId}g${params.groundId}`,
};

export default function TerrainTileView({
  level,
  nextLevel,
  gridSize = 20,
  cameraHeight = 40,
  cameraAngle = -Math.PI / 2.5,
  noiseScale = 0.05,
  noiseOctaves = 5,
  heightScale = 5,
  onChildHover,
}) {
  const params = useParams();
  const navigate = useNavigate();
  const meshRef = useRef();
  const tileCount = gridSize * gridSize;
  const seed = SEED_BUILDERS[level]?.(params) ?? "default";
  const seedVal = hashString(seed);
  const terrainSize = gridSize * 3;

  // Terrain geometry
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(terrainSize, terrainSize, 128, 128);
    const vertices = geo.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      vertices[i + 2] = fbm2D(x * noiseScale, y * noiseScale, seedVal, noiseOctaves) * heightScale;
    }
    geo.computeVertexNormals();
    return geo;
  }, [seedVal, noiseScale, noiseOctaves, heightScale, terrainSize]);

  // Apply vertex colors to terrain geometry
  useMemo(() => {
    const vertices = terrainGeo.attributes.position.array;
    const colors = new Float32Array(vertices.length);
    for (let i = 0; i < vertices.length; i += 3) {
      const h = vertices[i + 2] / heightScale;
      colors[i] = 0.15 + h * 0.3;
      colors[i + 1] = 0.25 + h * 0.35;
      colors[i + 2] = 0.1 + h * 0.1;
    }
    terrainGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }, [terrainGeo, heightScale]);

  // Clickable tile grid
  const tileSize = terrainSize / gridSize;
  const tileGeo = useMemo(() => new THREE.PlaneGeometry(tileSize * 0.9, tileSize * 0.9), [tileSize]);
  const tileMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#4df4ff", opacity: 0.06, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
    []
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  React.useEffect(() => {
    if (!meshRef.current) return;
    const half = (terrainSize - tileSize) / 2;
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const idx = row * gridSize + col;
        const x = col * tileSize - half;
        const z = row * tileSize - half;
        const y = fbm2D(x * noiseScale, z * noiseScale, seedVal, noiseOctaves) * heightScale + 0.1;
        dummy.position.set(x, y, z);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx, dummy.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [gridSize, tileSize, terrainSize, noiseScale, noiseOctaves, heightScale, seedVal, dummy]);

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
        onChildHover?.(idx);
        document.body.style.cursor = "pointer";
      }
    } else if (hoveredIdx !== null) {
      setHoveredIdx(null);
      onChildHover?.(null);
      document.body.style.cursor = "default";
    }

    // Highlight hovered tile
    if (meshRef.current) {
      for (let i = 0; i < tileCount; i++) {
        const color = i === hoveredIdx
          ? new THREE.Color(0.3, 0.96, 1.0)
          : new THREE.Color(0.15, 0.5, 0.55);
        meshRef.current.setColorAt(i, color);
      }
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
      tileMat.opacity = hoveredIdx !== null ? 0.15 : 0.06;
    }
  });

  React.useEffect(() => {
    return () => { document.body.style.cursor = "default"; };
  }, []);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      const idx = e.instanceId;
      if (idx == null) return;
      const buildRoute = ROUTE_BUILDERS[level];
      if (buildRoute) navigate(buildRoute(params, idx));
    },
    [navigate, params, level]
  );

  return (
    <>
      <OrbitControls
        {...ORBIT_CONTROLS}
        minDistance={5}
        maxDistance={cameraHeight * 2}
        target={[0, 0, 0]}
        enableZoom
        enablePan
        enableRotate
        dampingFactor={0.05}
      />
      <ambientLight intensity={0.4} />
      <directionalLight position={[-5, cameraHeight * 0.8, 5]} intensity={1.2} castShadow />
      <Stars radius={500} depth={25} count={1000} factor={1} saturation={0.5} fade speed={0} />

      {/* Terrain mesh */}
      <mesh geometry={terrainGeo} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.9} metalness={0.1} flatShading />
      </mesh>

      {/* Grid lines */}
      <GridLines gridSize={gridSize} terrainSize={terrainSize} tileSize={tileSize} seedVal={seedVal} noiseScale={noiseScale} noiseOctaves={noiseOctaves} heightScale={heightScale} />

      {/* Clickable tile overlay */}
      <instancedMesh
        ref={meshRef}
        args={[tileGeo, tileMat, tileCount]}
        onClick={handleClick}
      />
    </>
  );
}

function GridLines({ gridSize, terrainSize, tileSize, seedVal, noiseScale, noiseOctaves, heightScale }) {
  const gridGeo = useMemo(() => {
    const points = [];
    const half = terrainSize / 2;
    // Vertical lines (along z)
    for (let i = 0; i <= gridSize; i++) {
      const x = i * tileSize - half;
      const y0 = fbm2D(x * noiseScale, (-half) * noiseScale, seedVal, noiseOctaves) * heightScale + 0.15;
      const y1 = fbm2D(x * noiseScale, half * noiseScale, seedVal, noiseOctaves) * heightScale + 0.15;
      points.push(new THREE.Vector3(x, y0, -half));
      points.push(new THREE.Vector3(x, y1, half));
    }
    // Horizontal lines (along x)
    for (let i = 0; i <= gridSize; i++) {
      const z = i * tileSize - half;
      const y0 = fbm2D((-half) * noiseScale, z * noiseScale, seedVal, noiseOctaves) * heightScale + 0.15;
      const y1 = fbm2D(half * noiseScale, z * noiseScale, seedVal, noiseOctaves) * heightScale + 0.15;
      points.push(new THREE.Vector3(-half, y0, z));
      points.push(new THREE.Vector3(half, y1, z));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [gridSize, terrainSize, tileSize, seedVal, noiseScale, noiseOctaves, heightScale]);

  return (
    <lineSegments geometry={gridGeo}>
      <lineBasicMaterial color="#4df4ff" opacity={0.15} transparent />
    </lineSegments>
  );
}
