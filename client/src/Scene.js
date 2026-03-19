import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { OrbitControls, Stars } from "@react-three/drei";
import { Box, Typography } from "@mui/material";
import GalaxiesView from "./views/GalaxiesView";
import SolarSystemView from "./views/SolarSystemView";
import PlanetView from "./views/PlanetView";
import GlobeView from "./views/GlobeView";
import ContinentView from "./views/ContinentView";
import RegionView from "./views/RegionView";
import AreaView from "./views/AreaView";
import GroundView from "./views/GroundView";
import GrainView from "./views/GrainView";
import MoleculeView from "./views/MoleculeView";
import AtomView from "./views/AtomView";
import QuarkView from "./views/QuarkView";
import { GalaxyLocationWidget, GalaxyKeyspaceWidget } from "./components/GalaxyInfoPanel";
import StarInfoWidget from "./components/StarInfoPanel";
import {
  PlanetOverviewWidget,
  PlanetDetailWidget,
  PlanetHoverWidget,
} from "./components/PlanetInfoPanel";
import {
  GlobeWidget,
  ContinentWidget,
  RegionWidget,
  AreaWidget,
  GroundWidget,
  GrainWidget,
  MoleculeWidget,
  AtomWidget,
  QuarkWidget,
} from "./components/DeepZoomWidgets";
import ControlsOverlay from "./components/ControlsOverlay";
import BreadcrumbNav from "./components/BreadcrumbNav";
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
import { generateGalaxyName } from "./utils/galaxyNames";
import { generatePlanetName } from "./utils/planetStats";
import {
  computeHexKey,
  DEEP_ZOOM_LEVELS,
} from "./utils/keyspaceHierarchy";

// Ordered list of deep-zoom view names (after planet)
const DEEP_VIEWS = ["globe", "continent", "region", "area", "ground", "grain", "molecule", "atom", "quark"];

// Map from view name to the param that identifies the hovered/selected child
const VIEW_CHILD_PARAMS = {
  globe: "continentId",
  continent: "regionId",
  region: "areaId",
  area: "groundId",
  ground: "grainId",
  grain: "moleculeId",
  molecule: "atomId",
  atom: "quarkId",
  quark: "stringId",
};

// Build a URL path from params up to a given view level
function buildPath(params, upToView) {
  const { galaxyId, starId, planetId, continentId, regionId, areaId, groundId, grainId, moleculeId, atomId, quarkId, stringId } = params;
  let path = `/galaxy/${galaxyId}/star/${starId}/planet/${planetId}`;
  const segments = [
    ["globe", continentId, "globe"],
    ["continent", regionId, "region"],
    ["region", areaId, "area"],
    ["area", groundId, "ground"],
    ["ground", grainId, "grain"],
    ["grain", moleculeId, "molecule"],
    ["molecule", atomId, "atom"],
    ["atom", quarkId, "quark"],
    ["quark", stringId, "string"],
  ];
  for (const [viewName, paramVal, segmentName] of segments) {
    if (paramVal == null) break;
    path += `/${segmentName}/${paramVal}`;
    if (viewName === upToView) break;
  }
  return path;
}

// 3D content inside Canvas
function SceneContent({
  baseKeyOffset,
  onKeyOffsetChange,
  setIsControlsVisible,
  setIsInfoVisible,
  onGalaxySelect,
  onStarHover,
  onPlanetHover,
  onDeepHover,
  hoveredChild,
  view = "galaxy",
}) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const [galaxies, setGalaxies] = useState([]);
  const params = useParams();
  const { galaxyId, starId, planetId } = params;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const totalGalaxies = Number(TOTAL_KEYS / KEYS_PER_GALAXY);
    if (location.pathname === "/") {
      navigate("/galaxy/0", { replace: true });
      return;
    }
    if (galaxyId) {
      const galaxyIndex = parseInt(galaxyId, 10);
      if (isNaN(galaxyIndex)) {
        navigate("/galaxy/0", { replace: true });
        return;
      }
      let wrappedIndex = galaxyIndex;
      if (galaxyIndex >= totalGalaxies) {
        wrappedIndex = galaxyIndex % totalGalaxies;
      } else if (galaxyIndex < 0) {
        wrappedIndex =
          ((galaxyIndex % totalGalaxies) + totalGalaxies) % totalGalaxies;
      }
      onKeyOffsetChange(wrappedIndex);
      if (wrappedIndex !== galaxyIndex) {
        navigate(`/galaxy/${wrappedIndex}`, { replace: true });
      }
    }
  }, [galaxyId, location.pathname, navigate, onKeyOffsetChange]);

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
    onGalaxySelect(galaxy);
  }, [baseKeyOffset, onGalaxySelect]);

  // Keyboard navigation
  useEffect(() => {
    const totalGalaxies = Number(TOTAL_KEYS / KEYS_PER_GALAXY);
    const wrapIndex = (index, max) =>
      index < 0 ? max + (index % max) : index % max;

    // Find the current deep-zoom level index
    const deepIdx = DEEP_VIEWS.indexOf(view);

    // Get the visible count for the current level for left/right nav
    const levelDef = deepIdx >= 0 ? DEEP_ZOOM_LEVELS[deepIdx] : null;
    const visibleCount = levelDef?.visible ?? 0;

    // Get current ID param for the current view level
    const currentParam = deepIdx >= 0 ? VIEW_CHILD_PARAMS[DEEP_VIEWS[deepIdx - 1]] : null;
    const currentId = currentParam ? parseInt(params[currentParam], 10) : 0;

    const handlers = {
      [KEYBOARD_ACTIONS.TOGGLE_CONTROLS]: () =>
        setIsControlsVisible((prev) => !prev),
      [KEYBOARD_ACTIONS.TOGGLE_INFO]: () => setIsInfoVisible((prev) => !prev),
      [KEYBOARD_ACTIONS.NAVIGATE_LEFT]: () => {
        if (deepIdx > 0) {
          // Navigate to sibling at the current level
          const paramName = VIEW_CHILD_PARAMS[DEEP_VIEWS[deepIdx - 1]];
          const curVal = parseInt(params[paramName], 10);
          const parentPath = buildPath(params, DEEP_VIEWS[deepIdx - 1]);
          // Go up one segment and replace with prev sibling
          const pathParts = parentPath.split("/");
          pathParts[pathParts.length - 1] = wrapIndex(curVal - 1, visibleCount).toString();
          navigate(pathParts.join("/"), { replace: true });
        } else if (view === "planet") {
          const cur = parseInt(planetId, 10);
          const next = wrapIndex(cur - 1, 10);
          navigate(`/galaxy/${galaxyId}/star/${starId}/planet/${next}`, { replace: true });
        } else if (view === "solarSystem") {
          const cur = parseInt(starId, 10);
          const next = wrapIndex(cur - 1, 100000000000);
          navigate(`/galaxy/${galaxyId}/star/${next}`, { replace: true });
        } else {
          const next = wrapIndex(baseKeyOffset - 1, totalGalaxies);
          onKeyOffsetChange(next);
          navigate(`/galaxy/${next}`, { replace: true });
        }
      },
      [KEYBOARD_ACTIONS.NAVIGATE_RIGHT]: () => {
        if (deepIdx > 0) {
          const paramName = VIEW_CHILD_PARAMS[DEEP_VIEWS[deepIdx - 1]];
          const curVal = parseInt(params[paramName], 10);
          const parentPath = buildPath(params, DEEP_VIEWS[deepIdx - 1]);
          const pathParts = parentPath.split("/");
          pathParts[pathParts.length - 1] = wrapIndex(curVal + 1, visibleCount).toString();
          navigate(pathParts.join("/"), { replace: true });
        } else if (view === "planet") {
          const cur = parseInt(planetId, 10);
          const next = wrapIndex(cur + 1, 10);
          navigate(`/galaxy/${galaxyId}/star/${starId}/planet/${next}`, { replace: true });
        } else if (view === "solarSystem") {
          const cur = parseInt(starId, 10);
          const next = wrapIndex(cur + 1, 100000000000);
          navigate(`/galaxy/${galaxyId}/star/${next}`, { replace: true });
        } else {
          const next = wrapIndex(baseKeyOffset + 1, totalGalaxies);
          onKeyOffsetChange(next);
          navigate(`/galaxy/${next}`, { replace: true });
        }
      },
      [KEYBOARD_ACTIONS.RANDOM_JUMP]: () => {
        const randomIndex = Math.floor(Math.random() * totalGalaxies);
        onKeyOffsetChange(randomIndex);
        navigate(`/galaxy/${randomIndex}`, { replace: true });
      },
      [KEYBOARD_ACTIONS.ZOOM_TO_CENTER]: () => {
        if (!camera || !controlsRef.current) return;
        const controls = controlsRef.current;
        const galaxyIndex = parseInt(baseKeyOffset, 10);
        const position = getGalaxyPosition(galaxyIndex);
        const distance = 50;
        controls.target.set(position[0], position[1], position[2]);
        const startPosition = camera.position.clone();
        const endPosition = new THREE.Vector3(
          position[0] + distance, position[1] + distance, position[2] + distance
        );
        const duration = 1000;
        const startTime = Date.now();
        function animate() {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const t = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          camera.position.lerpVectors(startPosition, endPosition, t);
          controls.update();
          if (progress < 1) requestAnimationFrame(animate);
        }
        animate();
      },
      [KEYBOARD_ACTIONS.RESET_CAMERA]: () => {
        if (!camera || !controlsRef.current) return;
        const controls = controlsRef.current;
        controls.target.set(0, 0, 0);
        const startPosition = camera.position.clone();
        const endPosition = new THREE.Vector3(CAMERA.position[0], CAMERA.position[1], CAMERA.position[2]);
        const duration = 1000;
        const startTime = Date.now();
        function animate() {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const t = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          camera.position.lerpVectors(startPosition, endPosition, t);
          controls.update();
          if (progress < 1) requestAnimationFrame(animate);
        }
        animate();
      },
      [KEYBOARD_ACTIONS.ZOOM_IN]: () => {
        if (deepIdx >= 0 && hoveredChild !== null) {
          // Navigate into the hovered child at the next deep level
          const currentPath = buildPath(params, view);
          const nextSegment = DEEP_ZOOM_LEVELS[deepIdx]?.param;
          if (nextSegment) {
            // Map param name to URL segment name
            const segName = nextSegment.replace("Id", "");
            navigate(`${currentPath}/${segName}/${hoveredChild}`);
          }
        } else if (view === "planet" && galaxyId && starId && planetId) {
          navigate(`/galaxy/${galaxyId}/star/${starId}/planet/${planetId}/globe/0`);
        } else if (view === "solarSystem" && galaxyId && starId) {
          navigate(`/galaxy/${galaxyId}/star/${starId}/planet/0`);
        } else if (view === "galaxy" && galaxyId) {
          navigate(`/galaxy/${galaxyId}/star/0`);
        }
      },
      [KEYBOARD_ACTIONS.ZOOM_OUT]: () => {
        if (deepIdx > 0) {
          // Go up one level
          const parentView = DEEP_VIEWS[deepIdx - 1];
          navigate(buildPath(params, parentView));
        } else if (view === "globe") {
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
    baseKeyOffset, onKeyOffsetChange, navigate, camera,
    setIsControlsVisible, setIsInfoVisible, onGalaxySelect,
    view, params, hoveredChild,
  ]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#ffffff" />

      <Stars
        radius={view === "galaxy" ? 10000 : 500}
        depth={view === "galaxy" ? 200 : 25}
        count={view === "galaxy" ? 100000 : 2000}
        factor={2} saturation={1} fade speed={0.001} color="#ffffff"
      />
      <Stars
        radius={view === "galaxy" ? 8000 : 400}
        depth={view === "galaxy" ? 100 : 15}
        count={view === "galaxy" ? 50000 : 1000}
        factor={4} saturation={1.5} fade speed={0.0005} color="#ffffff"
      />

      <OrbitControls
        ref={controlsRef}
        {...ORBIT_CONTROLS}
        onEnd={(e) => {
          if (DEBUG_LOGGING) {
            const controls = e.target;
            const cam = controls.object;
            console.log("Camera position:", JSON.stringify({
              position: [cam.position.x, cam.position.y, cam.position.z],
              lookAt: controls.target,
            }));
          }
        }}
      />

      {view === "galaxy" ? (
        <GalaxiesView galaxyIndex={baseKeyOffset} onStarHover={onStarHover} />
      ) : view === "solarSystem" ? (
        <SolarSystemView onPlanetHover={onPlanetHover} onStarHover={onStarHover} />
      ) : view === "planet" ? (
        <PlanetView onPlanetHover={onPlanetHover} />
      ) : view === "globe" ? (
        <GlobeView onContinentHover={onDeepHover} />
      ) : view === "continent" ? (
        <ContinentView onRegionHover={onDeepHover} />
      ) : view === "region" ? (
        <RegionView onAreaHover={onDeepHover} />
      ) : view === "area" ? (
        <AreaView onGroundHover={onDeepHover} />
      ) : view === "ground" ? (
        <GroundView onGrainHover={onDeepHover} />
      ) : view === "grain" ? (
        <GrainView onMoleculeHover={onDeepHover} />
      ) : view === "molecule" ? (
        <MoleculeView onAtomHover={onDeepHover} />
      ) : view === "atom" ? (
        <AtomView onQuarkHover={onDeepHover} />
      ) : view === "quark" ? (
        <QuarkView onStringHover={onDeepHover} />
      ) : null}

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

// Main Scene component with HUD dashboard layout
function Scene({ baseKeyOffset, onKeyOffsetChange, view = "galaxy" }) {
  const params = useParams();
  const { galaxyId, starId, planetId, continentId, regionId, areaId, groundId, grainId, moleculeId, atomId, quarkId, stringId } = params;
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [isInfoVisible, setIsInfoVisible] = useState(true);
  const [selectedBody, setSelectedBody] = useState(null);
  const [selectedStar, setSelectedStar] = useState(null);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [hoveredChild, setHoveredChild] = useState(null);
  const [hoveredString, setHoveredString] = useState(null);

  // Unified deep hover handler
  const handleDeepHover = useCallback((idx) => {
    setHoveredChild(idx);
    if (view === "quark") setHoveredString(idx);
  }, [view]);

  // Breadcrumbs
  const breadcrumbs = useMemo(() => {
    const items = [];
    if (galaxyId !== undefined) {
      const gName = generateGalaxyName(parseInt(galaxyId, 10));
      if (view === "galaxy") {
        items.push({ label: gName });
      } else {
        items.push({ label: gName, path: `/galaxy/${galaxyId}` });
      }
    }
    if (starId !== undefined && view !== "galaxy") {
      if (view === "solarSystem") {
        items.push({ label: `Star ${starId}` });
      } else {
        items.push({ label: "Star", path: `/galaxy/${galaxyId}/star/${starId}` });
      }
    }
    if (planetId !== undefined && !["galaxy", "solarSystem"].includes(view)) {
      const pSeed = `${galaxyId}${starId}${planetId}`;
      const pName = generatePlanetName(pSeed);
      if (view === "planet") {
        items.push({ label: pName });
      } else {
        items.push({ label: pName, path: `/galaxy/${galaxyId}/star/${starId}/planet/${planetId}` });
      }
    }

    // Deep zoom breadcrumbs
    const deepLevels = [
      { view: "globe",     id: continentId, label: `Zone ${continentId}`,     segment: "globe" },
      { view: "continent", id: regionId,    label: `Region ${regionId}`,      segment: "region" },
      { view: "region",    id: areaId,      label: `Area ${areaId}`,          segment: "area" },
      { view: "area",      id: groundId,    label: `Ground ${groundId}`,      segment: "ground" },
      { view: "ground",    id: grainId,     label: `Grain ${grainId}`,        segment: "grain" },
      { view: "grain",     id: moleculeId,  label: `Molecule ${moleculeId}`,  segment: "molecule" },
      { view: "molecule",  id: atomId,      label: `Atom ${atomId}`,          segment: "atom" },
      { view: "atom",      id: quarkId,     label: `Quark ${quarkId}`,        segment: "quark" },
      { view: "quark",     id: stringId,    label: `String ${stringId}`,      segment: "string" },
    ];

    const deepIdx = DEEP_VIEWS.indexOf(view);
    if (deepIdx >= 0) {
      for (let i = 0; i <= deepIdx; i++) {
        const lvl = deepLevels[i];
        if (lvl.id == null) break;
        if (i === deepIdx) {
          items.push({ label: lvl.label });
        } else {
          items.push({ label: lvl.label, path: buildPath(params, lvl.view) });
        }
      }
    }

    return items;
  }, [view, params, galaxyId, starId, planetId, continentId, regionId, areaId, groundId, grainId, moleculeId, atomId, quarkId, stringId]);

  // Keyspace position
  const totalGalaxies = Number(TOTAL_KEYS / KEYS_PER_GALAXY);
  const keyspacePosition = (parseInt(baseKeyOffset, 10) / totalGalaxies) * 100;

  // Hex key for quark view
  const hoveredHexKey = useMemo(() => {
    if (view !== "quark" || hoveredString === null) return null;
    return computeHexKey(
      galaxyId, starId, planetId, continentId, regionId, areaId,
      groundId, grainId, moleculeId, atomId, quarkId, hoveredString
    );
  }, [view, hoveredString, galaxyId, starId, planetId, continentId, regionId, areaId, groundId, grainId, moleculeId, atomId, quarkId]);

  const handleStarSelect = useCallback((star) => {
    if (star) {
      setSelectedStar(star);
      setSelectedPlanet(null);
    }
  }, []);

  const handlePlanetSelect = useCallback((planet) => {
    if (planet) setSelectedPlanet(planet);
  }, []);

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas
        camera={
          view === "galaxy"
            ? CAMERA
            : { position: [0, 0, 20], fov: 75, near: 0.1, far: 10000 }
        }
        gl={{ antialias: true, logarithmicDepthBuffer: true }}
        style={{ position: "absolute", inset: 0, background: "#000" }}
      >
        <color attach="background" args={[FOG.color]} />
        <fog attach="fog" args={[FOG.color, FOG.near, FOG.far]} />
        <SceneContent
          baseKeyOffset={baseKeyOffset}
          onKeyOffsetChange={onKeyOffsetChange}
          setIsControlsVisible={setIsControlsVisible}
          setIsInfoVisible={setIsInfoVisible}
          onGalaxySelect={setSelectedBody}
          onStarHover={handleStarSelect}
          onPlanetHover={handlePlanetSelect}
          onDeepHover={handleDeepHover}
          hoveredChild={hoveredChild}
          view={view}
        />
      </Canvas>

      {/* HUD Overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top Bar */}
        <Box
          sx={{
            pointerEvents: "auto",
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1.5,
            background: "linear-gradient(180deg, rgba(10, 6, 30, 0.85) 0%, rgba(10, 6, 30, 0) 100%)",
            borderBottom: "1px solid rgba(77, 244, 255, 0.06)",
          }}
        >
          <BreadcrumbNav items={breadcrumbs} />
          <Typography
            sx={{
              color: "var(--theme-secondary)",
              fontSize: "0.6rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              opacity: 0.5,
            }}
          >
            BITUNIVERSE
          </Typography>
        </Box>

        {/* Middle: Widget Columns */}
        <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left Column */}
          {isInfoVisible && (
            <Box
              sx={{
                width: 220,
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                p: 0.75,
                pointerEvents: "auto",
              }}
            >
              {view === "galaxy" && <GalaxyLocationWidget selectedBody={selectedBody} />}
              {view === "solarSystem" && selectedStar && <StarInfoWidget selectedStar={selectedStar} />}
              {view === "planet" && selectedPlanet && <PlanetOverviewWidget selectedPlanet={selectedPlanet} />}
              {view === "globe" && <GlobeWidget continentId={continentId} hoveredChild={hoveredChild} />}
              {view === "continent" && <ContinentWidget regionId={regionId} hoveredChild={hoveredChild} />}
              {view === "region" && <RegionWidget areaId={areaId} hoveredChild={hoveredChild} />}
              {view === "area" && <AreaWidget groundId={groundId} hoveredChild={hoveredChild} />}
              {view === "ground" && <GroundWidget grainId={grainId} hoveredChild={hoveredChild} />}
              {view === "grain" && <GrainWidget moleculeId={moleculeId} hoveredChild={hoveredChild} />}
              {view === "molecule" && <MoleculeWidget atomId={atomId} hoveredChild={hoveredChild} />}
              {view === "atom" && <AtomWidget quarkId={quarkId} hoveredChild={hoveredChild} />}
              {view === "quark" && <QuarkWidget stringId={stringId} hexKey={hoveredHexKey} />}
            </Box>
          )}

          <Box sx={{ flex: 1 }} />

          {/* Right Column */}
          {isInfoVisible && (
            <Box
              sx={{
                width: 220,
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                p: 0.75,
                pointerEvents: "auto",
              }}
            >
              {view === "galaxy" && <GalaxyKeyspaceWidget selectedBody={selectedBody} />}
              {view === "solarSystem" && selectedPlanet && <PlanetHoverWidget selectedPlanet={selectedPlanet} />}
              {view === "planet" && selectedPlanet && <PlanetDetailWidget selectedPlanet={selectedPlanet} />}
            </Box>
          )}
        </Box>

        {/* Bottom Bar */}
        <Box
          sx={{
            pointerEvents: "auto",
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1.5,
            background: "linear-gradient(0deg, rgba(10, 6, 30, 0.85) 0%, rgba(10, 6, 30, 0) 100%)",
            borderTop: "1px solid rgba(77, 244, 255, 0.06)",
          }}
        >
          <Typography
            sx={{ color: "var(--theme-secondary)", fontSize: "0.55rem", opacity: 0.6 }}
          >
            256-bit Keyspace Universe
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                sx={{ color: "var(--theme-accent)", fontSize: "0.5rem", opacity: 0.5 }}
              >
                Position
              </Typography>
              <Box
                sx={{
                  width: 120,
                  height: 2,
                  background: "rgba(77, 244, 255, 0.15)",
                  borderRadius: 1,
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    left: `${keyspacePosition}%`,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--theme-secondary)",
                    boxShadow: "0 0 6px var(--theme-glow-secondary)",
                  }}
                />
              </Box>
              <Typography sx={{ color: "var(--theme-text)", fontSize: "0.5rem" }}>
                {Math.round(keyspacePosition)}%
              </Typography>
            </Box>
            <Typography
              onClick={() => setIsControlsVisible((v) => !v)}
              sx={{
                color: "var(--theme-accent)",
                fontSize: "0.5rem",
                opacity: 0.4,
                cursor: "pointer",
                userSelect: "none",
                "&:hover": { opacity: 0.8 },
              }}
            >
              [C] Controls
            </Typography>
          </Box>
        </Box>
      </Box>

      <ControlsOverlay isVisible={isControlsVisible} />
    </Box>
  );
}

export default Scene;
