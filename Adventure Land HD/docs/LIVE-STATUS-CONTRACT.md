# ALHD live status contract

Adventure Land HD exposes runtime diagnostics through ALHD.status().

The status object includes:

- mode: HD or ORIGINAL;
- applied: number of presentation definitions whose .file field was replaced;
- available: number of valid active source paths in the loaded HD manifest;
- eligible: available paths that fit the detected WebGL texture-size limit;
- paths: unique source paths that were actually applied;
- missing: eligible manifest paths that were not found in the permitted runtime presentation families;
- blocked: manifest paths intentionally kept on the original asset because their HD dimensions exceed the detected WebGL MAX_TEXTURE_SIZE;
- maxTextureSize: detected WebGL texture-edge limit, or null when it cannot be determined;
- reason: READY, ORIGINAL_MODE, G_UNAVAILABLE, or MANIFEST_UNAVAILABLE.

For the complete staged Mainland build on hardware that supports every staged atlas, the verified target is:

- HD mode: available = 48, eligible = 48, applied = 48, paths.length = 48, blocked = [], missing = [];
- ORIGINAL mode: available = 48, applied = 0, paths.length = 0, missing = [].

If a device reports a smaller texture limit, oversized HD atlases are excluded before Adventure Land's loader sees them. They remain on their original source file and appear in blocked rather than missing.

A non-empty missing array in HD mode is a separate hard diagnostic signal: the manifest path was eligible for the hardware but was not applied to a permitted runtime presentation definition.
