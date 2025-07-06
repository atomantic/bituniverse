import React, { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function CelestialBody({
  position,
  onHover,
  isSelected,
  type = "star",
}) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  const geometry = useMemo(() => {
    switch (type) {
      case "planet":
        return new THREE.SphereGeometry(0.4, 32, 32);
      case "moon":
        return new THREE.SphereGeometry(0.2, 16, 16);
      default:
        return new THREE.SphereGeometry(0.3, 16, 16);
    }
  }, [type]);

  const material = useMemo(() => {
    const baseColor =
      isSelected || hovered
        ? "#ffd700"
        : type === "planet"
        ? "#4df4ff"
        : type === "moon"
        ? "#ff61d8"
        : "#ffffff";
    return new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness: 0.8,
      roughness: 0.2,
      emissive: baseColor,
      emissiveIntensity: isSelected ? 2.0 : hovered ? 1.5 : 1.0,
      toneMapped: false,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
  }, [isSelected, hovered, type]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerEnter={() => {
        setHovered(true);
        onHover();
      }}
      onPointerLeave={() => setHovered(false)}
      scale={isSelected ? 1.2 : hovered ? 1.1 : 1}
      geometry={geometry}
      material={material}
    />
  );
}
