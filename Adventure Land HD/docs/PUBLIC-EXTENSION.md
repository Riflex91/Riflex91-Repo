# Public browser extension architecture

Adventure Land HD can run on the official Adventure Land website without replacing the game client or changing the game servers.

## Runtime boundary

The extension is Manifest V3 and is limited to:

- https://adventure.land/*
- https://www.adventure.land/*

Its page scripts run at document_start in the page MAIN world. The bootstrap installs an early window.G hook, waits for the official client to assign G, applies presentation-only file replacements, and then restores window.G as a normal writable property.

Only the file field of definitions in these presentation families may change:

- G.sprites
- G.animations
- G.tilesets
- G.imagesets

The extension contains no socket.emit, api_call, smart_move, use_skill, attack, WebSocket, XHR, or fetch authority.

## Public assets

Remote JavaScript is not permitted by the ALHD distribution contract. The extension package contains all executable code.

The public asset host serves images only. A release build creates a cdn directory with exactly 48 Mainland HD files and cdn-manifest.json containing SHA-256 hashes and byte sizes.

The generated page-manifest.js contains absolute HTTPS image URLs with an alhdv query derived from each image SHA-256.

## CDN requirements

The configured asset base must use HTTPS and must not require cookies, credentials, query parameters, or fragments.

The CDN should return:

- the correct image/png Content-Type;
- Access-Control-Allow-Origin: * or an equivalent policy allowing the official Adventure Land origin;
- Cache-Control suitable for immutable versioned image responses.

The public build never loads JavaScript, HTML, WASM, JSON configuration, or executable content from the CDN.

## Compatibility behavior

The public extension does not assume that the official website remains forever identical to the pinned development checkout.

At runtime, every replacement is matched against the current official G.*.file value. If an official source path changes, the HD replacement is not applied and ALHD.status().missing reports the old expected source path.

The existing GPU guard remains active. If an HD atlas exceeds the detected WebGL MAX_TEXTURE_SIZE, the original official asset is retained and the source appears in ALHD.status().blocked.

The user can disable HD from the extension popup. This stores only alhd.public.enabled on the official site's localStorage and reloads the page. The query parameter ?alhd=off remains an additional A/B override.

## Expected full Mainland status

On compatible hardware and a compatible official client:

- mode = HD
- reason = READY
- available = 48
- eligible = 48
- applied = 48
- paths.length = 48
- missing = []
- blocked = []

The official account, login, characters, gameplay logic, networking and server state remain authoritative and untouched.
