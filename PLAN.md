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
