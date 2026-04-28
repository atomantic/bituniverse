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

### Bookmarks - DONE
Persistent saved locations using localStorage that let users bookmark interesting keyspace locations and revisit them across sessions. Supports the GOALS.md long-term vision of being "shown in classrooms" by letting educators prepare demos, and complements the session-only Navigation History with permanent saves.

- Bookmarks persist across browser sessions via localStorage
- Add current location with one click; duplicate detection prevents re-adding
- Rename bookmarks with inline editing for custom labels
- Delete individual bookmarks on hover
- Click any bookmark to navigate directly to that location
- Reverse-chronological display with date stamps and view-level icons
- Visual depth indentation mirrors the zoom hierarchy
- Accessible via [K] button in bottom bar or K keyboard shortcut
- Escape closes; click outside to dismiss

#### Files Created
- `client/src/components/Bookmarks.js` - Bookmarks overlay with localStorage persistence, inline rename, delete, and navigation

#### Files Modified
- `client/src/Scene.js` - Imported Bookmarks, added state, extracted currentLabel memo, wired [K] Bookmarks button in bottom bar
- `client/src/utils/keyboardManager.js` - Added TOGGLE_BOOKMARKS action and K shortcut
- `client/src/components/ControlsOverlay.js` - Added K shortcut to controls reference

### Zoom Depth Gauge - DONE
Persistent vertical gauge showing all 12 zoom levels as a slim strip, with the current level highlighted and pulsing. Click any visited level to navigate back up the hierarchy. Makes the scale depth immediately tangible at a glance. Supports the GOALS.md v1.0 "Self-explanatory UX" milestone and long-term vision of being "shown in classrooms."

- [x] 12 zoom levels displayed as connected dots with 3-letter labels (GAL, STR, PLN, GLB, CNT, RGN, ARE, GND, GRN, MOL, ATM, QRK)
- Current level highlighted with cyan glow and pulsing animation
- Visited (parent) levels are clickable to navigate up the hierarchy
- Unvisited (deeper) levels shown as dim indicators
- Hover reveals full level name via tooltip; visited dots brighten on hover
- Positioned between left info panel and center, vertically centered
- Connecting lines between levels show visited/unvisited state

#### Files Created
- `client/src/components/ZoomDepthGauge.js` - Vertical depth gauge with clickable navigation, pulse animation, hover effects

#### Files Modified
- `client/src/Scene.js` - Imported ZoomDepthGauge, rendered in HUD middle section
- `client/src/theme.css` - Added depthGaugePulse keyframe animation

### Scale Comparison - DONE
Visual log-scaled comparison of physical and conceptual quantities — humans on Earth, grains of sand, atoms in the Sun, atoms in the observable universe — against the SHA-256 keyspace and the count of every Bitcoin address ever used. Directly addresses GOALS.md v2.0 "Probability context" milestone (visual cues for sparsity) and the Long-Term Vision goal of replacing the "imagine every grain of sand on Earth" paragraph with a lived experience.

- 14 reference quantities ranging from ~10⁴ (people you'll meet in a lifetime) to ~10¹²⁰ (Shannon's number for chess games)
- Each row has a logarithmic horizontal bar — every 10 ticks is a 10-billion-fold jump, so bars stay readable across 120 orders of magnitude
- 2²⁵⁶ keyspace bar highlighted in cyan; used Bitcoin addresses bar highlighted in Bitcoin-orange — the chasm between them is the educational point
- Current zoom level rendered as its own gold "Your current view" row, plus a gold tick on any reference row within ~0.4 orders of magnitude (visceral "you are here in the keyspace, even at quark scale" moment)
- Bottom log-scale axis with 10⁰…10¹²⁰ ticks for orientation
- Footer note about Landauer-bound thermodynamics ("even every atom checking a billion keys/sec since the Big Bang")
- Accessible via [X] button in bottom bar or X keyboard shortcut
- Escape closes; click outside to dismiss

#### Files Created
- `client/src/components/ScaleComparison.js` - Log-scale comparison overlay with 14 reference quantities, dynamic current-view marker, and axis ticks

#### Files Modified
- `client/src/Scene.js` - Imported ScaleComparison, added state, wired [X] Compare button in bottom bar, passed view prop for current-level marker
- `client/src/utils/keyboardManager.js` - Added TOGGLE_SCALE_COMPARISON action and X shortcut
- `client/src/components/ControlsOverlay.js` - Added X shortcut to controls reference
