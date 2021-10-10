# WorldGeneration

World generation built with vanilla JavaScript.

# Demo:

## Pixel theme

https://n8brooks.github.io/world_generation/dist/index.html

## Atlas theme

http://127.0.0.1:5500/dist/index.html?theme=atlas&shape=square

## Other options:

- theme: "atlas" | "pixel"
- shape: "circle" | "square" | "flat"
- seed: integer
- octaves: integer
- frequency: float
- persistance: float

# Build Commands:

deno bundle src/world_generation.ts dist/world_generation.js -c deno.json

deno bundle src/worker.ts dist/worker.js -c deno.json
