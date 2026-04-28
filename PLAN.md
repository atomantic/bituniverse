# Development Plan

For project mission and milestones, see [GOALS.md](./GOALS.md).
For completed work, see [DONE.md](./DONE.md).

The v1.0 (Explorable Universe) and v2.0 (Educational Depth) milestones from GOALS.md are both shipped. The backlog now focuses on cleanup, polish, and the long-term vision (classrooms, conference talks, kiosks).

## Next Up

1. **Delete dead code** — `client/src/views/SurfaceView.js`, `client/src/components/SurfaceInfoPanel.js`, and `client/src/Integrations.js` are no longer imported anywhere. The earlier PLAN claimed `SurfaceView`/`SurfaceInfoPanel` were deleted; they weren't. `Integrations.js` is a vestigial component referencing a non-existent `socketIO`.
2. **Trim unused root deps** — `@mempool/mempool.js`, `async`, `node-telegram-bot-api`, `socket.io`, `uuid`, and `ws` are declared in root `package.json` but not imported by `server/index.js` (or anywhere). Removing them shrinks attack surface and install size.
3. **Refresh README for v2.0 features** — README still only documents galaxy/star/planet routes and a small keyboard set. Add the new shortcuts (T, F, H, B, A, K, S) and screenshots/GIFs of the educational overlays.

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
