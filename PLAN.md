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

### Key Lookup - DONE
Search overlay that lets users paste a 256-bit hex key and navigate directly to its exact location in the universe. Addresses GOALS.md Core Tenet #2 "Deep Explorability" and makes keyspace positions personally tangible.

- Accepts any hex string up to 64 characters, reverse-maps it to galaxy/star/planet/...string indices
- Shows the complete location breakdown with named galaxies and planets
- Depth selector lets users choose which zoom level to navigate to (galaxy through string)
- "Random Key" button generates a random 256-bit key for exploration
- Accessible via [F] button in bottom bar or F keyboard shortcut
- Enter submits, Escape closes; click outside to dismiss

#### Files Created
- `client/src/components/KeyLookup.js` - Key lookup overlay with hex input, location preview, depth selector

#### Files Modified
- `client/src/utils/keyspaceHierarchy.js` - Added `keyToLocation()` reverse-mapping function
- `client/src/Scene.js` - Imported KeyLookup, added lookup state, wired [F] Find Key button in bottom bar
- `client/src/utils/keyboardManager.js` - Added TOGGLE_KEY_LOOKUP action and F shortcut
- `client/src/components/ControlsOverlay.js` - Added F shortcut to controls reference

### Navigation History - DONE
Session-scoped exploration history that tracks every location visited and allows instant revisiting. Supports the "useful for educators, conference talks" v2.0 goal by letting presenters retrace their exploration path.

- Automatically records every navigation with view level, human-readable label, and timestamp
- Reverse-chronological display with newest entries at top
- Current location highlighted with accent border
- Click any entry to instantly navigate back to that location
- Visual depth indentation mirrors the zoom hierarchy
- Capped at 100 entries per session; deduplicates consecutive same-path visits
- Accessible via [H] button in bottom bar or H keyboard shortcut
- Escape closes; click outside to dismiss

#### Files Created
- `client/src/components/NavigationHistory.js` - History overlay with scrollable list, time-ago display, depth-indented entries

#### Files Modified
- `client/src/Scene.js` - Imported NavigationHistory, added history state/tracking effect, wired [H] History button in bottom bar
- `client/src/utils/keyboardManager.js` - Added TOGGLE_HISTORY action and H shortcut
- `client/src/components/ControlsOverlay.js` - Added H shortcut to controls reference

### Brute Force Calculator - DONE
Interactive overlay that lets users experiment with computing power scenarios to understand why brute-forcing a 256-bit key is physically impossible. Addresses GOALS.md mission ("let people feel why brute-forcing a private key is impossible") and v2.0 "probability context" milestone.

- 5 computing power presets: single laptop through "every atom in the universe is a computer"
- Time slider from 1 second to 10^70 universe ages
- Real-time results: keys checked, keyspace coverage percentage, time to search all keys
- Visual progress bar (always imperceptibly thin — that's the educational point)
- Dynamic insight text adapts to the scenario, explaining physics limits (Landauer bound, thermodynamics)
- Accessible via [B] button in bottom bar or B keyboard shortcut
- Escape closes; click outside to dismiss

#### Files Created
- `client/src/components/BruteForceCalculator.js` - Interactive calculator with presets, time slider, results, and dynamic insights

#### Files Modified
- `client/src/Scene.js` - Imported BruteForceCalculator, added state, wired [B] Brute Force button in bottom bar
- `client/src/utils/keyboardManager.js` - Added TOGGLE_BRUTE_FORCE action and B shortcut
- `client/src/components/ControlsOverlay.js` - Added B shortcut to controls reference

### Auto-Explore / Ambient Mode - DONE
Auto-pilot that navigates through random paths in the keyspace hierarchy, pausing at each zoom level. Ideal for classrooms, conference talks, and kiosk displays. Supports the GOALS.md long-term vision of BitUniverse being "shown in classrooms" and useful for "conference talks."

- Automatically cycles through all 12 zoom levels: Galaxy → Star → Planet → Globe → Continent → Region → Area → Ground → Grain → Molecule → Atom → Quark
- Picks random locations at each level, building a unique path each cycle
- Pauses 3-5 seconds per level so educational context (ScaleContextWidget) is visible
- Shows a floating indicator with pulsing dot, current level label, and cycle count
- Progress bar shows journey completion through the hierarchy
- Accessible via [A] button in bottom bar or A keyboard shortcut
- Escape or A stops; clicking the indicator stops

#### Files Created
- `client/src/components/AutoExplore.js` - Auto-explore overlay with timer-driven navigation, random path generation, progress indicator

#### Files Modified
- `client/src/Scene.js` - Imported AutoExplore, added state, wired [A] Auto-Explore button in bottom bar
- `client/src/utils/keyboardManager.js` - Added TOGGLE_AUTO_EXPLORE action and A shortcut
- `client/src/components/ControlsOverlay.js` - Added A shortcut to controls reference
