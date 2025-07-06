import React, { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";

export default function ConnectionLine({ start, end }) {
  const ref = useRef();
  const geometry = useMemo(() => {
    // Validate input vectors
    if (
      !start ||
      !end ||
      !(start instanceof THREE.Vector3) ||
      !(end instanceof THREE.Vector3)
    ) {
      return null;
    }

    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();

    // Skip if the length is too small or invalid
    if (length < 0.1 || isNaN(length)) {
      return null;
    }

    const geo = new THREE.CylinderGeometry(0.1, 0.1, length, 16);
    geo.translate(0, length / 2, 0);
    return geo;
  }, [start, end]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.3,
        emissive: "#ffffff",
        emissiveIntensity: 0.5,
        metalness: 0.9,
        roughness: 0.1,
        side: THREE.DoubleSide,
      }),
    []
  );

  useEffect(() => {
    if (ref.current && geometry) {
      ref.current.position.copy(start);
      ref.current.lookAt(end);
      ref.current.rotateX(Math.PI / 2);
    }
  }, [start, end, geometry]);

  // Don't render if we couldn't create a valid geometry
  if (!geometry) {
    return null;
  }

  return <primitive object={new THREE.Mesh(geometry, material)} ref={ref} />;
}
