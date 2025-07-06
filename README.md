# bituniverse

> An interactive visualization of the insande keyspace of sha-256.

Each Universe has 1 Trillion Gallaxies.
Each Galaxy has 100 Billion Stars.
Each Star has an average of 10 planets.
Each Planet has an average of 10^19 grains of sand (10 quintillion)

It takes 1.16 \* 10^34 Universes to cover the entire keyspace of Bitcoin.
That's about 10 nonillion universes each packed with sandy planets to represent every possible 256-bit key with one grain per key.

![bituniverse](./client/public/bituniverse-1024.png)

## Installation

### As a Docker Container

```bash
# make a directory for bituniverse data
mkdir ~/.bituniverse

# run the container
docker run --rm --name bituniverse -p 3233:3233 -v ~/.bituniverse:/app/server/data ghcr.io/atomantic/bituniverse:latest

# stop and remove the container
docker stop bituniverse
```

### Development Setup

```bash
npm run setup
npm run dev
```
