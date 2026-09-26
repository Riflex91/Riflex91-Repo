# Mainland terrain technical pilot: doors

This pilot validates the first real `main` / Mainland world-atlas override path
without changing Adventure Land gameplay, geometry, collisions, networking, or
server behavior.

## Source

- upstream: `kaansoral/adventureland_mongodb@90052162eb3ebda36c893e1eb4af643913c8f984`
- source: `images/tiles/map/doors.png`
- original Git blob: `09921450572b33ca17dab98ff5e705dba8adea1c`
- original pixels: **192×256**
- format contract: 8-bit indexed PNG, non-interlaced

## Deterministic technical 8x output

`tools/build-nearest-png.mjs` reconstructs PNG scanlines with Node's standard
library and applies exact nearest-neighbor expansion at 8×.

Expected output:

- physical pixels: **1536×2048**
- logical pixels through Pixi `@8x`: **192×256**
- SHA-256: `66fef5c19149ac4cf8a625b0c1b19a5ca6a359f35e1c0ec9d4350bf69de2235f`
- CI artifact: `alhd-mainland-doors-8x`

The CI rebuilds this image from the pinned original checkout and verifies the
exact SHA-256 before publishing the workflow artifact.

## Scope boundary

This is a **technical terrain pilot**, not the final artistic remaster. It
proves that a Mainland atlas can be reproduced at exact 8× physical geometry
without moving or resizing any logical tile coordinates.

The final artistic HD atlas may replace this technical raster later, but it
must preserve the same logical geometry, original fallback, and runtime-only
visual override contract.
