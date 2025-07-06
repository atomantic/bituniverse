import React, { useState, useEffect } from "react";
import * as THREE from "three";
import { GALAXY_RADIUS, KEYS_PER_SYSTEM } from "../../utils/constants";
import SolarSystem from "./SolarSystem";

export default function GalaxySystem({ position, startKey, onSelectSystem }) {
  const [systems, setSystems] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState(null);

  useEffect(() => {
    const newSystems = [];
    const numSystems = Math.floor(Math.random() * 5) + 3;
    const keysPerSystemBigInt = BigInt(KEYS_PER_SYSTEM);
    for (let i = 0; i < numSystems; i++) {
      const orbitRadius = 5 + i * 2;
      const orbitSpeed = 0.2 + Math.random() * 0.1;
      const systemStartKey = BigInt(startKey) + keysPerSystemBigInt * BigInt(i);
      newSystems.push({
        position: [
          Math.cos(i) * orbitRadius,
          Math.sin(i * 0.5) * orbitRadius * 0.5,
          Math.sin(i) * orbitRadius,
        ],
        key: i,
        orbitRadius,
        orbitSpeed,
        startKey: systemStartKey,
      });
    }
    setSystems(newSystems);
  }, [startKey]);

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[GALAXY_RADIUS * 2, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={2.0}
          metalness={0.9}
          roughness={0.1}
          toneMapped={false}
          transparent
          opacity={0.9}
        />
      </mesh>
      {systems.map((system) => (
        <SolarSystem
          key={system.key}
          position={system.position}
          startKey={system.startKey}
          onSelectBody={onSelectSystem}
          orbitRadius={system.orbitRadius}
          orbitSpeed={system.orbitSpeed}
        />
      ))}
    </group>
  );
}
