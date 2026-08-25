import React, { useEffect, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useParams, useNavigate } from "react-router-dom";
import { starTypes } from "../config/starDistributions";
import ProceduralPlanet from "../components/3d/ProceduralPlanet";
import {
  getRandomPlanetType,
  generatePlanetColor,
} from "../config/planetTypes";
import { MOEBIUS_PALETTE } from "../shaders/ToonShader";

// Generate deterministic planet data based on galaxy and star IDs
function generatePlanetData(galaxyId, starId) {
  const planets = [];
  const baseSeed = `${galaxyId}${starId}`;

  // Always generate 10 planets
  for (let i = 0; i < 10; i++) {
    const planetSeed = `${baseSeed}${i}`;
    const planetType = getRandomPlanetType(planetSeed);
    // Distribute planets with increasing spacing (like real solar systems)
    const baseDistance = 15 + i * 12 + (parseInt(planetSeed.slice(-2), 10) % 8); // 15-135, well-spaced
    const rotationSpeed = 0.1 + (parseInt(planetSeed.slice(-3), 10) % 20) / 100; // 0.1-0.3
    // Use a simple hash to get well-distributed starting angles
    let hash = 0;
    for (let j = 0; j < planetSeed.length; j++) hash = ((hash << 5) - hash + planetSeed.charCodeAt(j)) | 0;
    const rotationOffset = (Math.abs(hash) % 360) * (Math.PI / 180);

    // Get size range for planet type
    const [minSize, maxSize] = planetType.sizeRange;
    const size =
      minSize +
      (parseInt(planetSeed.slice(-2), 10) / 100) * (maxSize - minSize);

    // Generate color based on planet type
    const color = generatePlanetColor(planetType, planetSeed);

    // Orbital inclination - each planet on a slightly different plane
    const orbitTilt = ((parseInt(planetSeed.slice(-4, -2), 10) % 30) - 15) * (Math.PI / 180); // ±15 degrees

    planets.push({
      id: i,
      type: planetType.id,
      name: planetType.name,
      distance: baseDistance,
      orbitTilt,
      size,
      rotationSpeed,
      rotationOffset,
      color: color.getHex(),
      seed: planetSeed,
      hasAtmosphere: planetType.hasAtmosphere,
      atmosphereOpacity: planetType.atmosphereOpacity,
      atmosphereColor: planetType.atmosphereColor,
      metalness: planetType.metalness,
      roughness: planetType.roughness,
      terrainExaggeration: planetType.terrainExaggeration,
      planetTypeConfig: planetType,
    });
  }

  return planets;
}

// Orbital path ring component
function OrbitalPath({ distance }) {
  const points = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, distance, distance, 0, 2 * Math.PI, false, 0);
    const pts = curve.getPoints(128);
    return pts.map((p) => new THREE.Vector3(p.x, 0, p.y));
  }, [distance]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#ffffff" opacity={0.08} transparent />
    </line>
  );
}

// Animated planet wrapper
function OrbitingPlanet({ planet, galaxyId, starId, isSelected, isHovered, onHover, onUnhover, onClick }) {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const elapsed = clock.getElapsedTime();
    const angle = -(planet.rotationOffset + planet.rotationSpeed * elapsed * 0.3);
    const x = Math.cos(angle) * planet.distance;
    const z = Math.sin(angle) * planet.distance;
    groupRef.current.position.set(x, 0, z);
  });

  const initAngle = -planet.rotationOffset;
  const initX = Math.cos(initAngle) * planet.distance;
  const initZ = Math.sin(initAngle) * planet.distance;

  return (
    <group ref={groupRef} position={[initX, 0, initZ]}>
      <ProceduralPlanet
        radius={planet.size}
        seed={planet.seed}
        color={planet.color}
        type={planet.type}
        planetTypeConfig={planet.planetTypeConfig}
        hasAtmosphere={planet.hasAtmosphere}
        atmosphereOpacity={planet.atmosphereOpacity}
        atmosphereColor={planet.atmosphereColor}
        metalness={planet.metalness}
        roughness={planet.roughness}
        terrainExaggeration={planet.terrainExaggeration}
        rotationSpeed={planet.rotationSpeed}
        detail={32}
        onHover={onHover}
        onUnhover={onUnhover}
        onClick={onClick}
        isSelected={isSelected}
        isHovered={isHovered}
      />
    </group>
  );
}

// Star with layered glow
function StarMesh({ starColor, isSelected, isHovered, onHover, onUnhover, onClick, starRef }) {
  return (
    <group>
      {/* Core */}
      <mesh
        ref={starRef}
        onPointerOver={onHover}
        onPointerOut={onUnhover}
        onClick={onClick}
      >
        <sphereGeometry args={[3, 32, 32]} />
        <meshStandardMaterial
          color={starColor}
          emissive={starColor}
          emissiveIntensity={isSelected ? 3 : isHovered ? 2.5 : 2}
          metalness={0.1}
          roughness={0.2}
        />
      </mesh>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[4.5, 32, 32]} />
        <meshBasicMaterial
          color={starColor}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function SolarSystem({ galaxyId, starId, onPlanetHover, onStarHover }) {
  const groupRef = useRef();
  const starRef = useRef();
  const { camera } = useThree();
  const [planets, setPlanets] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [starColor, setStarColor] = useState(MOEBIUS_PALETTE.glow);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [hoveredStar, setHoveredStar] = useState(null);
  const [selectedStar, setSelectedStar] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get star type from starId and set color
    const starType = parseInt(starId, 10) % starTypes.color.length;
    const color = starTypes.color[starType];
    setStarColor(color);

    // Generate planet data
    const planetData = generatePlanetData(galaxyId, starId);
    setPlanets(planetData);
    setIsReady(true);
  }, [galaxyId, starId]);

  useEffect(() => {
    if (!camera) return;
    // Position camera at a 45-degree angle
    camera.position.set(80, 100, 80);
    camera.lookAt(0, 0, 0);
    camera.up.set(0, 1, 0);
  }, [camera]);

  useFrame((state) => {
    if (starRef.current) {
      starRef.current.rotation.y += 0.001;
    }
  });

  // Update selectedPlanet state and notify parent
  useEffect(() => {
    onPlanetHover?.(selectedPlanet);
  }, [selectedPlanet, onPlanetHover]);

  // Update selectedStar state and notify parent
  useEffect(() => {
    if (selectedStar) {
      const starType = parseInt(starId, 10) % starTypes.color.length;
      onStarHover?.({
        type: starType,
        color: starTypes.color[starType],
        temperature: starTypes.temperature[starType],
        mass: starTypes.mass[starType],
        luminosity: starTypes.luminosity[starType],
      });
    }
  }, [selectedStar, starId, onStarHover]);

  const handlePlanetClick = (planet) => {
    setSelectedPlanet(planet);
    navigate(`/galaxy/${galaxyId}/star/${starId}/planet/${planet.id}`);
  };

  const handleStarClick = () => {
    setSelectedStar(true);
  };

  if (!isReady) return null;

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 0, 0]} intensity={1} distance={100} />

      {/* Star */}
      <StarMesh
        starRef={starRef}
        starColor={starColor}
        isSelected={selectedStar}
        isHovered={hoveredStar}
        onHover={() => setHoveredStar(true)}
        onUnhover={() => setHoveredStar(null)}
        onClick={handleStarClick}
      />

      {/* Orbital paths + planets - each in a tilted group */}
      {planets.map((planet) => (
        <group key={planet.id} rotation={[planet.orbitTilt || 0, 0, 0]}>
          <OrbitalPath distance={planet.distance} />
          <OrbitingPlanet
            planet={planet}
            galaxyId={galaxyId}
            starId={starId}
            isSelected={selectedPlanet?.id === planet.id}
            isHovered={hoveredPlanet?.id === planet.id}
            onHover={() => setHoveredPlanet(planet)}
            onUnhover={() => setHoveredPlanet(null)}
            onClick={() => handlePlanetClick(planet)}
          />
        </group>
      ))}
    </group>
  );
}

export default function SolarSystemView({ onPlanetHover, onStarHover }) {
  const { galaxyId, starId } = useParams();
  const navigate = useNavigate();

  // Handle back button or invalid navigation
  useEffect(() => {
    if (!galaxyId || !starId) {
      navigate("/");
      return;
    }

    // Validate starId is within range (0 to 99999999999)
    const starIdNum = parseInt(starId, 10);
    if (isNaN(starIdNum) || starIdNum < 0 || starIdNum > 99999999999) {
      navigate(`/galaxy/${galaxyId}/star/0`);
      return;
    }
  }, [galaxyId, starId, navigate]);

  return (
    <SolarSystem
      galaxyId={galaxyId}
      starId={starId}
      onPlanetHover={onPlanetHover}
      onStarHover={onStarHover}
    />
  );
}
