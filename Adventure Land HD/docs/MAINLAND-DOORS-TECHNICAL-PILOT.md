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

The CI and local overlay preparation both rebuild this image from the pinned original checkout, verify the exact SHA-256, and then use the generated `hd-assets/map/doors@8x.png` as the active presentation-only override. CI additionally publishes the exact generated PNG as workflow artifact `alhd-mainland-doors-8x`.

## Scope boundary

This is an **active technical terrain pilot**, not the final artistic remaster. It proves that a Mainland atlas can be reproduced at exact 8× physical geometry and routed through the real HD runtime without moving or resizing any logical tile coordinates.

The final artistic HD atlas may replace this technical raster later, but it
must preserve the same logical geometry, original fallback, and runtime-only
visual override contract.
