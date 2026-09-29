# Renderer texture capability guard

Adventure Land HD checks the browser's WebGL MAX_TEXTURE_SIZE before applying active HD file overrides. The check uses a temporary WebGL context and releases it through WEBGL_lose_context when that extension is available.

Each runtime manifest entry carries its physical HD pixel dimensions. If either edge exceeds the detected limit, that source is left on the original Adventure Land asset instead of being handed to the Pixi loader.

This guard is presentation-only. It does not alter map geometry, collision, movement, combat, networking, persistence, or server state.

ALHD.status() exposes the result through maxTextureSize, available, eligible, blocked, applied, and missing.
