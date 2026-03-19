import React, { useEffect, useState, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { OrbitControls, Stars } from "@react-three/drei";
import GalaxiesView from "./views/GalaxiesView";
import SolarSystemView from "./views/SolarSystemView";
import KeyInfoPanel from "./components/KeyInfoPanel";
import GalaxyInfoPanel from "./components/GalaxyInfoPanel";
import StarInfoPanel from "./components/StarInfoPanel";
import ControlsOverlay from "./components/ControlsOverlay";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getGalaxyPosition, getGalaxyProperties } from "./utils/helpers";
import { KEYS_PER_GALAXY, TOTAL_KEYS } from "./utils/constants";
import {
  BLOOM_PARAMS,
  BLOOM_LAYER,
  CAMERA,
  ORBIT_CONTROLS,
  FOG,
  DEBUG_LOGGING,
} from "./config/renderConfig";
import {
  createKeyboardListener,
  KEYBOARD_ACTIONS,
} from "./utils/keyboardManager";
import * as THREE from "three";
import PlanetInfoPanel from "./components/PlanetInfoPanel";
import PlanetView from "./views/PlanetView";
import SurfaceView from "./views/SurfaceView";

// Create a wrapper component to access Three.js context
function SceneContent({
  baseKeyOffset,
  onKeyOffsetChange,
  setIsControlsVisible,
  setIsInfoVisible,
  onGalaxySelect,
  onStarHover,
  onPlanetHover,
  view = "galaxy",
}) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const [galaxies, setGalaxies] = useState([]);
  const { galaxyId, starId, planetId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle URL changes and galaxy ID
  useEffect(() => {
    const totalGalaxies = Number(TOTAL_KEYS / KEYS_PER_GALAXY);

    // Handle root path redirect
    if (location.pathname === "/") {
      navigate("/galaxy/0", { replace: true });
      return;
    }

    // Handle galaxy ID from URL
    if (galaxyId) {
      const galaxyIndex = parseInt(galaxyId, 10);
      // console.log(
      //   "Scene received galaxyId:",
      //   galaxyId,
      //   "parsed to:",
      //   galaxyIndex
      // );

      // Only redirect to galaxy/0 if the ID is invalid
      if (isNaN(galaxyIndex)) {
        console.log("Invalid galaxy ID, redirecting to 0");
        navigate("/galaxy/0", { replace: true });
        return;
      }

      // Wrap the index instead of redirecting to 0
      let wrappedIndex = galaxyIndex;
      if (galaxyIndex >= totalGalaxies) {
        wrappedIndex = galaxyIndex % totalGalaxies;
      } else if (galaxyIndex < 0) {
        wrappedIndex =
          ((galaxyIndex % totalGalaxies) + totalGalaxies) % totalGalaxies;
      }

      console.log("Setting galaxy index to:", wrappedIndex);
      onKeyOffsetChange(wrappedIndex);

      // Update URL if needed
      if (wrappedIndex !== galaxyIndex) {
        navigate(`/galaxy/${wrappedIndex}`, { replace: true });
      }
    }
  }, [galaxyId, location.pathname, navigate, onKeyOffsetChange]);

  // Generate single galaxy
  useEffect(() => {
    const galaxyIndex = parseInt(baseKeyOffset, 10);
    const position = getGalaxyPosition(galaxyIndex);
    const properties = getGalaxyProperties(galaxyIndex);

    const galaxy = {
      key: galaxyIndex.toString(),
      startKey: galaxyIndex.toString(),
      position,
      type: "galaxy",
      class: properties.type,
      color: properties.color,
      size: properties.size,
      rarity: properties.rarity,
    };

    setGalaxies([galaxy]);
    onGalaxySelect(galaxy); // Set the selected body when galaxy is loaded
  }, [baseKeyOffset, onGalaxySelect]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const totalGalaxies = Number(TOTAL_KEYS / KEYS_PER_GALAXY);
    const wrapIndex = (index, max) => {
      if (index < 0) {
        return max + (index % max);
      }
      return index % max;
    };

    const handlers = {
      [KEYBOARD_ACTIONS.TOGGLE_CONTROLS]: () =>
        setIsControlsVisible((prev) => !prev),
      [KEYBOARD_ACTIONS.TOGGLE_INFO]: () => setIsInfoVisible((prev) => !prev),
      [KEYBOARD_ACTIONS.NAVIGATE_LEFT]: () => {
        if (view === "surface") return; // No left/right nav on surface
        if (view === "planet") {
          const currentPlanetId = parseInt(planetId, 10);
          const newPlanetId = wrapIndex(currentPlanetId - 1, 10);
          navigate(`/galaxy/${galaxyId}/star/${starId}/planet/${newPlanetId}`, {
            replace: true,
          });
        } else if (view === "solarSystem") {
          const currentStarId = parseInt(starId, 10);
          const newStarId = wrapIndex(currentStarId - 1, 100000000000);
          navigate(`/galaxy/${galaxyId}/star/${newStarId}`, { replace: true });
        } else {
          const newIndex = wrapIndex(baseKeyOffset - 1, totalGalaxies);
          onKeyOffsetChange(newIndex);
          navigate(`/galaxy/${newIndex}`, { replace: true });
        }
      },
      [KEYBOARD_ACTIONS.NAVIGATE_RIGHT]: () => {
        if (view === "surface") return; // No left/right nav on surface
        if (view === "planet") {
          const currentPlanetId = parseInt(planetId, 10);
          const newPlanetId = wrapIndex(currentPlanetId + 1, 10);
          navigate(`/galaxy/${galaxyId}/star/${starId}/planet/${newPlanetId}`, {
            replace: true,
          });
        } else if (view === "solarSystem") {
          const currentStarId = parseInt(starId, 10);
          const newStarId = wrapIndex(currentStarId + 1, 100000000000);
          navigate(`/galaxy/${galaxyId}/star/${newStarId}`, { replace: true });
        } else {
          const newIndex = wrapIndex(baseKeyOffset + 1, totalGalaxies);
          onKeyOffsetChange(newIndex);
          navigate(`/galaxy/${newIndex}`, { replace: true });
        }
      },
      [KEYBOARD_ACTIONS.RANDOM_JUMP]: () => {
        const randomIndex = Math.floor(Math.random() * totalGalaxies);
        console.log("Random jump to:", randomIndex);
        onKeyOffsetChange(randomIndex);
        navigate(`/galaxy/${randomIndex}`, { replace: true });
      },
      [KEYBOARD_ACTIONS.ZOOM_TO_CENTER]: () => {
        console.log("M key pressed - starting zoom to center");
        if (!camera || !controlsRef.current) {
          console.log("Camera or controls not available:", {
            camera,
            controls: controlsRef.current,
          });
          return;
        }

        const controls = controlsRef.current;
        // Get the current galaxy position
        const galaxyIndex = parseInt(baseKeyOffset, 10);
        const position = getGalaxyPosition(galaxyIndex);
        console.log("Current galaxy position:", position);

        // Calculate a good viewing distance based on galaxy size
        const distance = 50; // Base distance
        const targetX = position[0];
        const targetY = position[1];
        const targetZ = position[2];

        console.log("Current camera position:", {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
        });

        // Set the target first
        controls.target.set(targetX, targetY, targetZ);
        console.log("Set controls target to:", { targetX, targetY, targetZ });

        // Animate the camera position
        const startPosition = camera.position.clone();
        const endPosition = new THREE.Vector3(
          targetX + distance,
          targetY + distance,
          targetZ + distance
        );

        console.log("Will animate to position:", {
          x: endPosition.x,
          y: endPosition.y,
          z: endPosition.z,
        });

        // Create an animation
        const duration = 1000; // 1 second
        const startTime = Date.now();

        function animate() {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Ease in-out function
          const t =
            progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          // Interpolate camera position
          camera.position.lerpVectors(startPosition, endPosition, t);
          controls.update();

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            console.log("Animation complete - final camera position:", {
              x: camera.position.x,
              y: camera.position.y,
              z: camera.position.z,
            });
          }
        }

        animate();
      },
      [KEYBOARD_ACTIONS.RESET_CAMERA]: () => {
        console.log("O key pressed - resetting camera position");
        if (!camera || !controlsRef.current) {
          console.log("Camera or controls not available:", {
            camera,
            controls: controlsRef.current,
          });
          return;
        }

        const controls = controlsRef.current;
        console.log("Current camera position:", {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
        });

        // Set the target to origin
        controls.target.set(0, 0, 0);
        console.log("Set controls target to origin");

        // Animate the camera position
        const startPosition = camera.position.clone();
        const endPosition = new THREE.Vector3(
          CAMERA.position[0],
          CAMERA.position[1],
          CAMERA.position[2]
        );

        console.log("Will animate to position:", {
          x: endPosition.x,
          y: endPosition.y,
          z: endPosition.z,
        });

        // Create an animation
        const duration = 1000; // 1 second
        const startTime = Date.now();

        function animate() {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Ease in-out function
          const t =
            progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          // Interpolate camera position
          camera.position.lerpVectors(startPosition, endPosition, t);
          controls.update();

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            console.log("Animation complete - final camera position:", {
              x: camera.position.x,
              y: camera.position.y,
              z: camera.position.z,
            });
          }
        }

        animate();
      },
      [KEYBOARD_ACTIONS.ZOOM_IN]: () => {
        if (view === "planet" && galaxyId && starId && planetId) {
          navigate(`/galaxy/${galaxyId}/star/${starId}/planet/${planetId}/surface`);
        } else if (view === "solarSystem" && galaxyId && starId) {
          navigate(`/galaxy/${galaxyId}/star/${starId}/planet/0`);
        } else if (view === "galaxy" && galaxyId) {
          navigate(`/galaxy/${galaxyId}/star/0`);
        }
      },
      [KEYBOARD_ACTIONS.ZOOM_OUT]: () => {
        if (view === "surface" && galaxyId && starId && planetId) {
          navigate(`/galaxy/${galaxyId}/star/${starId}/planet/${planetId}`);
        } else if (view === "planet" && galaxyId && starId) {
          navigate(`/galaxy/${galaxyId}/star/${starId}`);
        } else if (view === "solarSystem" && galaxyId) {
          navigate(`/galaxy/${galaxyId}`);
        }
      },
    };

    const handleKeyPress = createKeyboardListener(handlers);
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    baseKeyOffset,
    onKeyOffsetChange,
    navigate,
    camera,
    setIsControlsVisible,
    setIsInfoVisible,
    onGalaxySelect,
    view,
    galaxyId,
    starId,
    planetId,
  ]);

  // console.log("baseKeyOffset", baseKeyOffset);
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#ffffff" />

      {/* Background star field - dimmer, more numerous stars */}
      <Stars
        radius={view === "galaxy" ? 10000 : 500}
        depth={view === "galaxy" ? 200 : 25}
        count={view === "galaxy" ? 100000 : 2000}
        factor={2}
        saturation={1}
        fade
        speed={0.001}
        color="#ffffff"
      />

      {/* Foreground star field - brighter, fewer stars */}
      <Stars
        radius={view === "galaxy" ? 8000 : 400}
        depth={view === "galaxy" ? 100 : 15}
        count={view === "galaxy" ? 50000 : 1000}
        factor={4}
        saturation={1.5}
        fade
        speed={0.0005}
        color="#ffffff"
      />

      <OrbitControls
        ref={controlsRef}
        {...ORBIT_CONTROLS}
        onEnd={(e) => {
          if (DEBUG_LOGGING) {
            const controls = e.target;
            const camera = controls.object;
            console.log(
              "Camera position:",
              JSON.stringify(
                {
                  position: [
                    camera.position.x,
                    camera.position.y,
                    camera.position.z,
                  ],
                  lookAt: controls.target,
                },
                null,
                2
              )
            );
          }
        }}
      />

      {view === "galaxy" ? (
        <GalaxiesView galaxyIndex={baseKeyOffset} onStarHover={onStarHover} />
      ) : view === "solarSystem" ? (
        <SolarSystemView
          onPlanetHover={onPlanetHover}
          onStarHover={onStarHover}
        />
      ) : view === "planet" ? (
        <PlanetView onPlanetHover={onPlanetHover} />
      ) : (
        <SurfaceView onPlanetHover={onPlanetHover} />
      )}

      <EffectComposer>
        <Bloom
          mipmapBlur
          radius={BLOOM_PARAMS.bloomRadius}
          levels={6}
          luminanceSmoothing={0.8}
          luminanceThreshold={BLOOM_PARAMS.bloomThreshold}
          intensity={BLOOM_PARAMS.bloomStrength}
          exposure={BLOOM_PARAMS.exposure}
          renderToScreen={false}
          selection={[BLOOM_LAYER]}
        />
      </EffectComposer>
    </>
  );
}

// Main Scene component
function Scene({ baseKeyOffset, onKeyOffsetChange, view = "galaxy" }) {
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const [selectedBody, setSelectedBody] = useState(null);
  const [selectedStar, setSelectedStar] = useState(null);
  const [selectedPlanet, setSelectedPlanet] = useState(null);

  // Handle star selection
  const handleStarSelect = (star) => {
    if (star) {
      setSelectedStar(star);
      setSelectedPlanet(null); // Clear planet selection when selecting a star
    }
  };

  // Handle planet selection
  const handlePlanetSelect = (planet) => {
    if (planet) {
      setSelectedPlanet(planet);
    }
  };

  return (
    <>
      <Canvas
        camera={
          view === "galaxy"
            ? CAMERA
            : { position: [0, 0, 20], fov: 75, near: 0.1, far: 10000 }
        }
        gl={{
          antialias: true,
          logarithmicDepthBuffer: true,
        }}
        style={{ background: "#000" }}
      >
        <color attach="background" args={[FOG.color]} />
        <fog attach="fog" args={[FOG.color, FOG.near, FOG.far]} />
        <SceneContent
          baseKeyOffset={baseKeyOffset}
          onKeyOffsetChange={onKeyOffsetChange}
          setIsControlsVisible={setIsControlsVisible}
          setIsInfoVisible={setIsInfoVisible}
          isInfoVisible={isInfoVisible}
          onGalaxySelect={setSelectedBody}
          onStarHover={handleStarSelect}
          onPlanetHover={handlePlanetSelect}
          view={view}
        />
      </Canvas>
      <ControlsOverlay isVisible={isControlsVisible} />
      {isInfoVisible && (
        <>
          {selectedBody?.type === "galaxy" ? (
            <GalaxyInfoPanel selectedBody={selectedBody} />
          ) : (
            <KeyInfoPanel selectedBody={selectedBody} />
          )}
          {selectedStar && <StarInfoPanel selectedStar={selectedStar} />}
          {selectedPlanet && (
            <PlanetInfoPanel selectedPlanet={selectedPlanet} />
          )}
        </>
      )}
    </>
  );
}

export default Scene;
