# PLAN: Deep Zoom Hierarchy Redesign

## Status: Implemented

9-level deep zoom hierarchy below planet, covering the full 10^61 keys per planet.

### Hierarchy
| # | View | Subdivision | Visible Items |
|---|------|------------|---------------|
| 1 | Globe | 10^7 | 49 (7x7 lat/lon) |
| 2 | Continent | 10^7 | 400 (20x20 grid) |
| 3 | Region | 10^7 | 400 (20x20 grid) |
| 4 | Area | 10^7 | 400 (20x20 grid) |
| 5 | Ground | 10^7 | 2000 (instanced) |
| 6 | Grain | 10^7 | 729 (9^3 lattice) |
| 7 | Molecule | 10^7 | 500 |
| 8 | Atom | 10^7 | 500 |
| 9 | Quark | 10^5 | 500 |

Math: 10^7 x 8 + 10^5 = 10^61

### Implementation - DONE
- [x] Phase 1: Foundation - keyspaceHierarchy.js, App.js routes, Scene.js, breadcrumbs, widgets
- [x] Phase 2: GlobeView (sphere with continent zones) + GroundView (adapted SurfaceView)
- [x] Phase 3: TerrainTileView (shared base), ContinentView, RegionView, AreaView
- [x] Phase 4: MoleculeView, updated GrainView/AtomView/QuarkView route paths

### Files Created
- `client/src/views/GlobeView.js` - 3D sphere with 7x7 lat/lon click zones
- `client/src/views/ContinentView.js` - Top-down terrain map (20x20 grid)
- `client/src/views/RegionView.js` - Closer terrain map (20x20 grid)
- `client/src/views/AreaView.js` - Ground-level terrain (20x20 grid)
- `client/src/views/TerrainTileView.js` - Shared terrain tile base for continent/region/area
- `client/src/views/GroundView.js` - Surface with 2000 instanced grains
- `client/src/views/MoleculeView.js` - Molecular bond structure (500 atoms)

### Files Modified
- `client/src/utils/keyspaceHierarchy.js` - 9-level subdivision constants
- `client/src/App.js` - 12 routes (galaxy, star, planet + 9 deep zoom)
- `client/src/Scene.js` - Data-driven view rendering, navigation, breadcrumbs
- `client/src/views/PlanetView.js` - Click navigates to globe (not surface)
- `client/src/views/GrainView.js` - Click navigates to molecule (not atom)
- `client/src/views/AtomView.js` - Updated route paths for new hierarchy
- `client/src/views/QuarkView.js` - Updated route paths + hex key computation
- `client/src/components/DeepZoomWidgets.js` - 9 widgets for all deep zoom levels

### Files Deleted
- `client/src/views/SurfaceView.js` - Replaced by GlobeView + GroundView
- `client/src/components/SurfaceInfoPanel.js` - Replaced by DeepZoomWidgets

---

## v2.0 — Educational Depth (In Progress)

### Scale Context Widget - DONE
Educational overlays at every zoom level showing physical analogies, probability context, and perspective facts. Addresses GOALS.md v2.0 "contextual education" and "probability context" milestones.

- Each of the 12 view levels has curated content: scale analogy, probability of finding a used Bitcoin key, and an expandable "perspective" fact
- Renders in the right-side HUD column alongside existing keyspace/planet widgets
- Collapsible "More/Less" toggle keeps the UI clean while offering depth

#### Files Created
- `client/src/components/ScaleContextWidget.js` - Scale context cards for all 12 zoom levels

#### Files Modified
- `client/src/Scene.js` - Imported and rendered ScaleContextWidget in right HUD column

### Guided Tour - DONE
Optional tour mode that walks users through all 12 zoom levels with narrated stops. Addresses GOALS.md v2.0 "guided exploration" milestone.

- 12-stop tour from Galaxy down to a single 256-bit key, with educational narration at each level
- Auto-navigates between stops via Next/Back buttons
- Accessible via [T] button in bottom bar or T keyboard shortcut
- Arrow keys / N/P navigate within the tour; T/Esc exits
- Tour intercepts keyboard in capture phase so it doesn't conflict with Scene navigation
- Progress bar shows tour completion percentage

#### Files Created
- `client/src/components/GuidedTour.js` - Tour overlay with 12 narrated stops

#### Files Modified
- `client/src/Scene.js` - Imported GuidedTour, added tour state, wired [T] Tour button in bottom bar
- `client/src/utils/keyboardManager.js` - Added TOGGLE_TOUR action and T shortcut
- `client/src/components/ControlsOverlay.js` - Added T shortcut to controls reference
