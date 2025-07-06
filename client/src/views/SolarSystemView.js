import React, { useEffect, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three";
import { useParams, useNavigate } from "react-router-dom";
import { starTypes } from "../config/starDistributions";
import ProceduralPlanet from "../components/3d/ProceduralPlanet";
import {
  getRandomPlanetType,
  generatePlanetColor,
} from "../config/planetTypes";
import { SCAVENGER_PALETTE } from "../shaders/ToonShader";

// Generate deterministic planet data based on galaxy and star IDs
function generatePlanetData(galaxyId, starId) {
  const planets = [];
  const baseSeed = `${galaxyId}${starId}`;

  // Always generate 10 planets
  for (let i = 0; i < 10; i++) {
    const planetSeed = `${baseSeed}${i}`;
    const planetType = getRandomPlanetType(planetSeed);
    const distance = 40 + (parseInt(planetSeed.slice(-2), 10) % 60); // 40-100 units from star
    const rotationSpeed = 0.1 + (parseInt(planetSeed.slice(-3), 10) % 20) / 100; // 0.1-0.3
    const rotationOffset =
      (parseInt(planetSeed.slice(-3), 10) % 360) * (Math.PI / 180); // Random starting rotation

    // Get size range for planet type
    const [minSize, maxSize] = planetType.sizeRange;
    const size =
      minSize +
      (parseInt(planetSeed.slice(-2), 10) / 100) * (maxSize - minSize);

    // Generate color based on planet type
    const color = generatePlanetColor(planetType, planetSeed);

    planets.push({
      id: i,
      type: planetType.id,
      name: planetType.name,
      distance,
      size,
      rotationSpeed,
      rotationOffset,
      color: color.getHex(),
      seed: planetSeed,
      hasAtmosphere: planetType.hasAtmosphere,
      atmosphereOpacity: planetType.atmosphereOpacity,
      metalness: planetType.metalness,
      roughness: planetType.roughness,
      terrainExaggeration: planetType.terrainExaggeration,
    });
  }

  return planets;
}

function SolarSystem({ galaxyId, starId, onPlanetHover, onStarHover }) {
  const groupRef = useRef();
  const starRef = useRef();
  const { camera, gl } = useThree();
  const controlsRef = useRef();
  const [planets, setPlanets] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [starColor, setStarColor] = useState(SCAVENGER_PALETTE.star);
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

    // Set up OrbitControls
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    return () => {
      controls.dispose();
    };
  }, [galaxyId, starId, camera, gl]);

  useEffect(() => {
    if (!camera) return;
    // Position camera directly above the solar system
    camera.position.set(0, 60, 0);
    camera.lookAt(0, 0, 0);
    camera.up.set(0, 0, 1); // Set up vector to maintain correct orientation
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
      {/* Ambient light for general illumination */}
      <primitive object={new THREE.AmbientLight(0xffffff, 0.5)} />
      <primitive
        object={new THREE.PointLight(0xffffff, 1, 100)}
        position={[0, 0, 0]}
      />

      {/* Star */}
      <mesh
        ref={starRef}
        onPointerOver={() => setHoveredStar(true)}
        onPointerOut={() => setHoveredStar(null)}
        onClick={handleStarClick}
      >
        <sphereGeometry args={[3, 32, 32]} />
        <meshStandardMaterial
          color={starColor}
          emissive={starColor}
          emissiveIntensity={selectedStar ? 3 : hoveredStar ? 2.5 : 2}
          metalness={0.1}
          roughness={0.2}
        />
      </mesh>

      {/* Planets */}
      {planets.map((planet) => {
        // Calculate position in a clockwise orbit
        const angle = -((planet.id * 2 * Math.PI) / planets.length); // Negative for clockwise
        const x = Math.cos(angle) * planet.distance;
        const z = Math.sin(angle) * planet.distance;

        const isSelected = selectedPlanet?.id === planet.id;
        const isHovered = hoveredPlanet?.id === planet.id;

        return (
          <ProceduralPlanet
            key={planet.id}
            radius={planet.size}
            seed={planet.seed}
            color={planet.color}
            type={planet.type}
            position={[x, 0, z]}
            hasAtmosphere={planet.hasAtmosphere}
            atmosphereOpacity={planet.atmosphereOpacity}
            metalness={planet.metalness}
            roughness={planet.roughness}
            terrainExaggeration={planet.terrainExaggeration}
            onHover={() => setHoveredPlanet(planet)}
            onUnhover={() => setHoveredPlanet(null)}
            onClick={() => handlePlanetClick(planet)}
            isSelected={isSelected}
            isHovered={isHovered}
          />
        );
      })}
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
