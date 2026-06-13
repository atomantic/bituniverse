# Done Log

Completed items archived from PLAN.md. For project mission and milestones, see [GOALS.md](./GOALS.md). For current work, see [PLAN.md](./PLAN.md).

## 2026-06 — Scale Comparison

- Scale Comparison — log-scaled overlay comparing 14 physical/conceptual quantities (humans on Earth, grains of sand, atoms in the Sun and observable universe, Shannon's number) against the 2²⁵⁶ keyspace and every Bitcoin address ever used, with a gold "you are here" current-view marker, [X] toggle — `client/src/components/ScaleComparison.js`

## 2026-04 — Zoom Depth Gauge

- Persistent vertical 12-level depth gauge (GAL → QRK) with current-level pulse, clickable parent navigation, and hover tooltips — `client/src/components/ZoomDepthGauge.js`

## 2026-03 — v2.0 Educational Depth

- Scale Context Widget — curated scale analogies, probability context, and perspective facts at every zoom level — `client/src/components/ScaleContextWidget.js`
- Guided Tour — 12-stop narrated walkthrough from Galaxy down to a single 256-bit key, [T] toggle — `client/src/components/GuidedTour.js`
- Key Lookup — paste a 256-bit hex key and navigate to its exact location, with depth selector and random-key generator, [F] toggle — `client/src/components/KeyLookup.js`
- Share Location — copy deep-link to current location for sharing — `client/src/components/ShareOverlay.js`
- Navigation History — session-scoped reverse-chronological list of visited locations with one-click revisit, [H] toggle — `client/src/components/NavigationHistory.js`
- Brute Force Calculator — interactive presets, time slider, and dynamic insights making the impossibility of brute-forcing visceral, [B] toggle — `client/src/components/BruteForceCalculator.js`
- Auto-Explore / Ambient Mode — auto-pilot that cycles through all 12 zoom levels for classrooms and conference talks, [A] toggle — `client/src/components/AutoExplore.js`
- Bookmarks — persistent (localStorage) saved locations with rename/delete and one-click navigation, [K] toggle — `client/src/components/Bookmarks.js`
- Reverse-mapping helper `keyToLocation()` added to `client/src/utils/keyspaceHierarchy.js` to power Key Lookup
- Hex map terrain redesign — coherent islands, isometric view, houses; richer hex-map-wfc-inspired visuals across region/area/ground

## 2026-03 — Planet & Solar System Polish

- Planet visual overhaul, surface zoom view, navigation polish
- Distribute planets at random positions around their orbits with tilted orbital planes
- Planet zoom limit and solar-system planet distribution fixes
- Region grid on planet, globe→region URL renames, improved map visual
- Redesigned GlobeView as a 2D map with clickable grid zones

## 2026-03 — 9-Level Deep Zoom Hierarchy

- Implemented full 9-level deep zoom below planet (Globe → Continent → Region → Area → Ground → Grain → Molecule → Atom → Quark) covering 10^61 keys per planet
- New view components: `GlobeView`, `ContinentView`, `RegionView`, `AreaView`, `GroundView`, `MoleculeView`, `TerrainTileView`
- 12 deep-linkable routes wired in `client/src/App.js`; data-driven view rendering, navigation, and breadcrumbs in `client/src/Scene.js`
- Subdivision constants + key/index helpers in `client/src/utils/keyspaceHierarchy.js`
- 9 deep-zoom HUD widgets in `client/src/components/DeepZoomWidgets.js`

## 2026-02 — Foundations & Dependency Hygiene

- Initial project scaffold: Express static server, React/Three.js client, Galaxy/Star/Planet hierarchy, deep-linkable routes, keyboard-first navigation, bloom post-processing
- Resolved Dependabot security alerts: path-to-regexp, brace-expansion, picomatch, qs, serialize-javascript, node-forge, flatted, yaml, lodash, minimatch, ajv, socket.io-parser, js-yaml, underscore, express
- Ecosystem config and dependency updates
- README expanded with features, controls, and architecture
