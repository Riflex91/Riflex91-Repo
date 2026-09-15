# Bootstrap runtime delivery

Adventure Land stores only the small `dist/aio-v3.js` bootstrap in the code slot. The complete bot is built as `dist/aio-v3-runtime.js` and is fetched at runtime from the Cloudflare/R2 release mirror.

## Release contract

- `dist/aio-v3.js` must remain compatible with the legacy updater validation while staying comfortably below the Adventure Land code-slot size limit.
- `dist/aio-v3-runtime.js` contains the complete production runtime and is never persisted through Adventure Land `save_code`.
- The bootstrap exposes an immediate `AIO_V3` handshake proxy so a legacy updater can confirm the migration before the larger runtime download finishes.
- Runtime download failures keep the bootstrap alive and retry with bounded exponential backoff.
- A rollback or newer activation supersedes an in-flight runtime activation and prevents a late downloaded bundle from taking control.
- The Cloudflare worker serves `/v3/dist/aio-v3-runtime.js` from the dedicated R2 release object with CORS and no-store caching.

## Publication order

Deploy the worker first. Then publish the runtime bundle, the bootstrap bundle, and finally the release-version pointer. Readers therefore cannot observe a new release version before both matching artifacts are available.

## Verification

The release workflow builds both artifacts, runs the full v3 test suite and guardians, validates both JavaScript files, executes the runtime and bootstrap smoke tests, runs the Cloudflare control-center checks, and verifies that committed generated bundles are reproducible on pull requests.
