# bituniverse client

React frontend for bituniverse, built with Three.js and React Three Fiber.

## Development

```bash
npm start    # start dev server on port 3000
npm test     # run tests
npm run build # production build to /build
```

## Key Dependencies

- **@react-three/fiber** — React renderer for Three.js
- **@react-three/drei** — Helpers for R3F (OrbitControls, Stars)
- **@react-three/postprocessing** — Post-processing effects (Bloom)
- **@mui/material** — UI components
- **react-router-dom** — Client-side routing

## Directory Structure

```
src/
├── components/
│   ├── 3d/           # Three.js mesh components
│   │   ├── CelestialBody.js
│   │   ├── Galaxy.js
│   │   ├── ProceduralPlanet.js
│   │   ├── SolarSystem.js
│   │   └── Star.js
│   ├── *InfoPanel.js # UI overlay panels
│   └── ControlsOverlay.js
├── views/
│   ├── GalaxiesView.js
│   ├── SolarSystemView.js
│   └── PlanetView.js
├── config/
│   ├── planetTypes.js     # Planet generation parameters
│   ├── renderConfig.js    # Camera, bloom, fog settings
│   └── starDistributions.js
├── utils/
│   ├── constants.js       # Key space calculations
│   ├── helpers.js         # Galaxy position/property functions
│   └── keyboardManager.js # Keyboard shortcut handling
├── App.js                 # Root component with routing
└── Scene.js               # Main Three.js canvas wrapper
```

## Rendering Pipeline

The scene uses a multi-layer approach:
1. Background star field (100k stars at far distance)
2. Foreground star field (50k stars, closer)
3. Galaxy/Solar System/Planet geometry
4. Bloom post-processing pass
