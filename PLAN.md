# Development Plan

For project mission and milestones, see [GOALS.md](./GOALS.md).
For completed work, see [DONE.md](./DONE.md).

The v1.0 (Explorable Universe) and v2.0 (Educational Depth) milestones from GOALS.md are both shipped. The backlog now focuses on cleanup, polish, and the long-term vision (classrooms, conference talks, kiosks).

## Next Up

1. **Refresh README for v2.0 features** — README still only documents galaxy/star/planet routes. Add the deep-zoom routes and screenshots/GIFs of the educational overlays.

## Recently Completed (cleanup pass)

- Dead code removed: `SurfaceView`, `SurfaceInfoPanel`, `Integrations.js`, `Configuration.js`, unused 3D components (`GalaxySystem`, `SolarSystem`, `CelestialBody`, `ConnectionLine`, `Star`), `CompositionShader`, `Footer`, legacy info panels, `createParticleTexture`.
- Unused root deps trimmed (`@mempool/mempool.js`, `async`, `node-telegram-bot-api`, `socket.io`, `ws`); the missing `cors` dependency was replaced with hand-rolled CORS headers, plus an SPA fallback route so deep links resolve.
- Fixed: infinite re-render loop on Planet view; global hotkeys firing while typing in inputs; duplicate OrbitControls fighting over the camera (galaxy + solar-system views); corrupt-localStorage white-screen in Bookmarks; brute-force progress bar math (100×); star hover/select highlighting every star of the same type (per-star id attribute); BigInt crashes on junk URL params; random-jump precision loss above 2^53 (BigInt sampling); negative-index wrap-around; uncancellable camera animation loops; AutoExplore duplicated timer chains; per-frame instanced-mesh recoloring (Planet/Globe/TerrainTile views); visible-count mismatches between URL wrap ranges and rendered grids.
- A11y: HUD toggles are real buttons, overlays expose `role="dialog"`/`aria-modal`.

## Backlog

- [ ] Add a minimal test setup — `npm test` currently exits with an error. Start with smoke tests for `keyspaceHierarchy.js` (round-trip `keyToLocation` ↔ `locationToKey`) since that's the most logic-heavy pure module.
- [ ] Audit mobile/touch UX — the visualization is keyboard-first, but kiosk/conference use cases benefit from touch gestures (pinch zoom, tap-to-drill-down).
- [ ] Lighthouse / performance pass — measure FPS and main-thread time at each zoom level on a mid-tier laptop; identify the most expensive view (likely `GlobeView` or instanced `GroundView`).
- [ ] Mempool "real used keys" overlay — a dot on the map at the location of every key that has ever been used on-chain, to make the sparseness viscerally tangible. Aligns with GOALS.md v2.0 "probability context" milestone.

## Future / Ideas

- Multi-language narration for Guided Tour — broaden classroom reach
- Embed mode (`/embed?...`) — minimal-chrome iframe for blog posts and presentations
- WebGPU renderer path — `@webgpu/types` is already in deps; explore a Three.js WebGPU pipeline for higher particle counts on capable browsers
- Sound design / ambient audio toggle — subtle drones tied to zoom depth for immersion
