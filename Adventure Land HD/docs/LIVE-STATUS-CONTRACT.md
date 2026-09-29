# ALHD live status contract

Adventure Land HD exposes runtime diagnostics through ALHD.status().

The status object now includes:

- mode: HD or ORIGINAL;
- applied: number of presentation definitions whose .file field was replaced;
- available: number of valid active source paths in the loaded HD manifest;
- paths: unique source paths that were actually applied;
- missing: valid active manifest paths that were not found in the permitted runtime presentation families;
- reason: READY, ORIGINAL_MODE, G_UNAVAILABLE, or MANIFEST_UNAVAILABLE.

For the complete staged Mainland build, the verified target is:

- HD mode: available = 48, applied = 48, paths.length = 48, missing = [];
- ORIGINAL mode: available = 48, applied = 0, paths.length = 0, missing = [].

A non-empty missing array in HD mode is a hard diagnostic signal that a manifest source exists but was not applied to the runtime definitions.
