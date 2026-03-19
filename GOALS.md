# GOALS.md

*An interactive 3D visualization of the insane keyspace of SHA-256.*

---

## Mission

BitUniverse exists to make the incomprehensible scale of Bitcoin's 256-bit keyspace viscerally tangible. By mapping 2^256 possible keys onto a navigable cosmic hierarchy — Universes, Galaxies, Stars, Planets, and grains of sand — it transforms an abstract number into a spatial experience anyone can explore. The goal is not to teach cryptography theory, but to let people *feel* why brute-forcing a private key is impossible.

---

## Core Tenets

1. **Visual Education Over Abstraction** — The primary value is making scale intuitive. Every design decision should serve the "wow, that's impossibly big" moment.
2. **Deep Explorability** — Every location in the keyspace is a deep-linkable URL. Users can navigate, bookmark, and share any point in the universe.
3. **Procedural Determinism** — All cosmic structures are reproducibly generated from index seeds. No stored universe data — the same coordinates always produce the same galaxy, star, and planet.
4. **Immersive Rendering** — WebGL bloom, procedural nebulae, spectral-accurate star types, and smooth camera transitions create a visceral sense of scale and beauty.
5. **Keyboard-First Navigation** — The universe is explorable entirely via keyboard, with mouse/touch as secondary input.

---

## Milestones

### v1.0 — Explorable Universe

The core experience is polished and self-explanatory. A first-time visitor can land on the page, understand what they're looking at, and navigate the keyspace without reading documentation. Visual rendering is smooth across modern browsers, camera transitions feel cinematic, and the hierarchical zoom (galaxy → star → planet → key) communicates scale at every level.

- **Rendering quality** — Galaxies, stars, and planets look beautiful and distinct; bloom and nebula effects enhance immersion without hurting performance
- **Navigation fluidity** — Zooming between hierarchy levels feels seamless; keyboard controls are responsive and discoverable
- **Self-explanatory UX** — Info panels and breadcrumbs provide enough context that the scale metaphor lands without external explanation

### v2.0 — Educational Depth

The visualization becomes a teaching tool. Contextual overlays explain the probability of finding a used key, compare the keyspace to physical analogies, and guide users through the cosmic hierarchy with optional narration. The experience is useful for educators, conference talks, and crypto onboarding.

- **Contextual education** — Overlays and annotations explain what the numbers mean at each zoom level
- **Guided exploration** — Optional tour mode walks users through the hierarchy with explanatory stops
- **Probability context** — Visual or textual cues convey just how sparse "used" keys are within the total space

---

## Long-Term Vision

BitUniverse becomes the canonical way to understand keyspace scale — referenced in blog posts, linked in crypto discussions, shown in classrooms. The visualization is so intuitive that it replaces the usual "imagine every grain of sand on Earth" paragraph with a lived experience. It remains open-source, free, and beautiful.

---

## Non-Goals

- **Not a wallet or blockchain tool** — BitUniverse does not generate, store, or interact with real Bitcoin keys or transactions. It is purely a visualization.
- **Not a scientific simulation** — Cosmological accuracy (galaxy formation, orbital mechanics) is secondary to the educational metaphor. Stars and planets serve the keyspace mapping, not astrophysics.
- **No monetization** — This project will remain free and open-source. No paid tiers, ads, or premium features.

---

For the tactical backlog and current work items, see [PLAN.md](./PLAN.md).
