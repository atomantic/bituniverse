# bituniverse

> An interactive 3D visualization of the insane keyspace of SHA-256.

Each Universe has 1 Trillion Galaxies.
Each Galaxy has 100 Billion Stars.
Each Star has an average of 10 planets.
Each Planet has an average of 10^19 grains of sand (10 quintillion).

It takes 1.16 × 10^34 Universes to cover the entire keyspace of Bitcoin.
That's about 10 nonillion universes each packed with sandy planets to represent every possible 256-bit key with one grain per key.

![bituniverse](./client/public/bituniverse-1024.png)

## Features

- **3D Galaxy Navigation** — Explore a trillion procedurally generated galaxies
- **Deep Zoom Levels** — Navigate from galaxy → star system → planet → individual keys
- **Deep-Linkable URLs** — Every location is shareable via URL routes
- **Keyboard Controls** — Full keyboard navigation for exploration
- **Real-time Rendering** — WebGL-powered Three.js with bloom post-processing

## Installation

### As a Docker Container

```bash
# create a directory for bituniverse data
mkdir ~/.bituniverse

# run the container
docker run --rm --name bituniverse -p 3233:3233 -v ~/.bituniverse:/app/server/data ghcr.io/atomantic/bituniverse:latest

# open in browser
open http://localhost:3233

# stop the container when done
docker stop bituniverse
```

### Development Setup

Requires Node.js (see `.nvmrc` for version).

```bash
# install dependencies for server and client
npm run setup

# start development servers (server + client with hot reload)
npm run dev
```

The client runs on http://localhost:3000 during development, with the API server on port 3233.

### Production Build

```bash
# build the Docker image
docker build -t bituniverse .

# or use docker-compose
docker-compose up
```

## Usage

### Keyboard Controls

| Key | Action |
|-----|--------|
| `←` `→` | Navigate between siblings at the current zoom level |
| `Enter` / `Space` / `Click` | Zoom into selection |
| `Esc` / `Backspace` | Zoom out one level |
| `j` | Jump to a random galaxy |
| `m` | Zoom camera to galaxy center |
| `o` | Reset camera to origin |
| `t` | Guided tour |
| `f` | Key lookup (find a 256-bit key's location) |
| `s` | Share current location |
| `h` | Navigation history |
| `b` | Brute-force calculator |
| `a` | Auto-explore |
| `k` | Bookmarks |
| `x` | Scale comparison |
| `c` | Toggle controls overlay |
| `i` | Toggle info panels |

### URL Routes

All views are deep-linkable:

- `/galaxy/:galaxyId` — View a specific galaxy
- `/galaxy/:galaxyId/star/:starId` — View a star's solar system
- `/galaxy/:galaxyId/star/:starId/planet/:planetId` — View a planet
- `/galaxy/:g/star/:s/planet/:p/region/:r[/sector/:sec/area/:a/ground/:gr/grain/:grn/molecule/:m/atom/:at/quark/:q/string/:str]` — Deep-zoom levels down to individual keys

## Architecture

```
bituniverse/
├── client/              # React frontend (Three.js/R3F)
│   └── src/
│       ├── components/  # UI components and 3D objects
│       ├── views/       # Route-level view components
│       ├── utils/       # Helpers, constants, keyboard manager
│       └── config/      # Render settings, planet/star types
├── server/              # Express.js API server
└── Dockerfile           # Multi-stage build for production
```

## License

MIT
