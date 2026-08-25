import React, { useEffect, useRef, useState, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Galaxy } from "../components/3d/Galaxy";
import * as THREE from "three";
import { CAMERA } from "../config/renderConfig";
import { TOTAL_KEYS, KEYS_PER_GALAXY } from "../utils/constants";
import { useParams, useNavigate } from "react-router-dom";

// Helper function to wrap galaxy index
function wrapGalaxyIndex(index) {
  const totalGalaxies = Number(TOTAL_KEYS / KEYS_PER_GALAXY);
  return ((index % totalGalaxies) + totalGalaxies) % totalGalaxies;
}

function GalaxyWrapper({ galaxyIndex = 0, onStarHover }) {
  const galaxyRef = useRef(null);
  const galaxyInstanceRef = useRef(null);
  const { camera, gl } = useThree();
  const navigate = useNavigate();
  const [isInteracting, setIsInteracting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const previousIndexRef = useRef(galaxyIndex);
  const isInitialMount = useRef(true);

  const createGalaxy = useCallback(() => {
    galaxyInstanceRef.current = new Galaxy(galaxyIndex);

    if (camera) {
      camera.position.set(...CAMERA.position);
      camera.updateProjectionMatrix();
      setIsReady(true);
    }
  }, [galaxyIndex, camera, gl]);

  // Initial mount effect
  useEffect(() => {
    if (isInitialMount.current) {
      createGalaxy();
      isInitialMount.current = false;
    }
  }, [createGalaxy]);

  // Handle galaxy index changes
  useEffect(() => {
    if (galaxyIndex === previousIndexRef.current) return;

    previousIndexRef.current = galaxyIndex;

    // Only trigger cleanup if we have an existing galaxy
    if (galaxyInstanceRef.current) {
      setIsReady(false);
      setIsCleaningUp(true);
    } else {
      // If no existing galaxy, just create a new one
      setIsReady(false);
      createGalaxy();
    }
  }, [galaxyIndex, createGalaxy]);

  // Cleanup previous galaxy
  useEffect(() => {
    if (!isCleaningUp) return;

    if (galaxyInstanceRef.current) {
      galaxyInstanceRef.current.cleanup();
      galaxyInstanceRef.current = null;
    }
    setIsCleaningUp(false);
    createGalaxy();
  }, [isCleaningUp, createGalaxy, galaxyIndex]);

  // Handle camera updates
  useEffect(() => {
    if (galaxyInstanceRef.current && isReady && !isCleaningUp) {
      galaxyInstanceRef.current.updateScale(camera);
    }
  }, [camera, isReady, isCleaningUp]);

  // Handle mouse move events (on the canvas only, so HUD clicks don't navigate)
  useEffect(() => {
    if (!galaxyInstanceRef.current || !isReady || isCleaningUp) return;

    const canvas = gl.domElement;

    const handleMouseMove = (event) => {
      galaxyInstanceRef.current.handleMouseMove(event, camera);
    };

    const handleClick = (event) => {
      galaxyInstanceRef.current.handleClick(event, camera);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);
    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
    };
  }, [camera, isReady, isCleaningUp, gl]);

  // Set up hover and click callbacks
  useEffect(() => {
    if (!galaxyInstanceRef.current || !isReady || isCleaningUp) return;

    galaxyInstanceRef.current.onStarHover = onStarHover;
    galaxyInstanceRef.current.onStarClick = (star) => {
      if (star) {
        navigate(`/galaxy/${galaxyIndex}/star/${star.index}`);
      }
    };

    return () => {
      if (galaxyInstanceRef.current) {
        galaxyInstanceRef.current.onStarHover = null;
        galaxyInstanceRef.current.onStarClick = null;
      }
    };
  }, [isReady, isCleaningUp, onStarHover, galaxyIndex, navigate]);

  useFrame((state, delta) => {
    if (
      galaxyInstanceRef.current &&
      isInteracting &&
      isReady &&
      !isCleaningUp
    ) {
      galaxyInstanceRef.current.update(delta);
    }
  });

  if (!galaxyInstanceRef.current || !isReady || isCleaningUp) {
    return null;
  }

  const galaxyObject = galaxyInstanceRef.current.toThreeObject();
  if (!galaxyObject) {
    console.warn("Failed to create galaxy object");
    return null;
  }

  return (
    <group ref={galaxyRef}>
      {galaxyObject.children.map((child, index) => {
        if (child instanceof THREE.Points) {
          return (
            <points
              key={index}
              geometry={child.geometry}
              material={child.material}
            />
          );
        }
        return null;
      })}
    </group>
  );
}

export default function GalaxiesView({
  galaxyIndex: propGalaxyIndex,
  onStarHover,
}) {
  // Get galaxy index from URL params
  const { galaxyId } = useParams();

  // Use URL param if available, otherwise use prop
  const galaxyIndex = galaxyId !== undefined ? galaxyId : propGalaxyIndex;

  // Ensure galaxyIndex is a number
  const numericIndex = Number(galaxyIndex);

  // Wrap the galaxy index only once at the top level
  const wrappedIndex = wrapGalaxyIndex(numericIndex);

  // Ensure we have a valid initial index
  const initialIndex = isNaN(numericIndex) ? 0 : wrappedIndex;

  return <GalaxyWrapper galaxyIndex={initialIndex} onStarHover={onStarHover} />;
}
