import React, { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useParams, useNavigate } from "react-router-dom";
import ProceduralPlanet from "../components/3d/ProceduralPlanet";
import {
  getRandomPlanetType,
  generatePlanetColor,
} from "../config/planetTypes";
import { ORBIT_CONTROLS } from "../config/renderConfig";
import { Stars } from "@react-three/drei";

function Planet({ planetData, isSelected = true, onClick }) {
  const groupRef = useRef();

  return (
    <group ref={groupRef}>
      <group renderOrder={-1}>
        <Stars
          radius={500}
          depth={25}
          count={2000}
          factor={2}
          saturation={1}
          fade
          speed={0}
          color="#ffffff"
        />
        <Stars
          radius={400}
          depth={15}
          count={1000}
          factor={4}
          saturation={1.5}
          fade
          speed={0}
          color="#ffffff"
        />
      </group>
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
          onClick={onClick}
          onHover={() => { document.body.style.cursor = "pointer"; }}
          onUnhover={() => { document.body.style.cursor = "default"; }}
        />
      </group>
    </group>
  );
}

export default function PlanetView({ onPlanetHover }) {
  const { galaxyId, starId, planetId } = useParams();
  const navigate = useNavigate();

  // Generate deterministic planet data based on galaxy, star, and planet IDs
  const planetSeed = `${galaxyId}${starId}${planetId}`;
  const planetType = getRandomPlanetType(planetSeed);
  const [minSize, maxSize] = planetType.sizeRange;
  const size =
    minSize + (parseInt(planetSeed.slice(-2), 10) / 100) * (maxSize - minSize);
  const color = generatePlanetColor(planetType, planetSeed);

  const planetData = {
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

  // Set the planet as selected when the view is mounted
  useEffect(() => {
    onPlanetHover?.(planetData);
  }, [planetData, onPlanetHover]);

  return (
    <>
      <OrbitControls
        {...ORBIT_CONTROLS}
        minDistance={1}
        maxDistance={1000}
        maxPolarAngle={Math.PI}
        target={[0, 0, 0]}
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        zoomSpeed={2.0}
        dampingFactor={0.05}
        rotateSpeed={1.0}
        panSpeed={1.0}
      />
      <Planet
        planetData={planetData}
        isSelected={true}
        onClick={() => navigate(`/galaxy/${galaxyId}/star/${starId}/planet/${planetId}/globe/0`)}
      />
    </>
  );
}
