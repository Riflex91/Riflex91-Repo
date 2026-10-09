# AIO-V3 content-drift SSD transport (preparation only)

The `ContentDriftSsdStore` is an async, deliberately opt-in **data transport**
using the native Windows Bridge SSD endpoint from draft PR #995 (used by ALFinal draft PR #115). It reads and stores **only**
`aio-v3-content-drift-v1` and
`aio-v3-content-drift-v1:<safe-character-name>` keys, with revision-based
compare-and-swap and verified readback.

It does not use or fall back to browser `localStorage`. The saved snapshot is
validated before any write, and a failed host request is always an error.
The transport never manipulates game actions.

**Not yet wired into Alpha13/Alpha20 runtime**: the existing
`ContentDriftMonitor.load()/save()` calls are synchronous, whereas HTTP and
SSD acknowledgement are async. Their actual runtime migration must introduce
an awaited startup data restore, gate drift-dependent combat and supervision
until the restore completes, and preserve quarantine baselines across
character re-entry. Do **not** change to empty baselines on a host outage,
auto-enable live combat, or delete browser copies.

After the ALFinal SSD host is installed, the reviewed ALFinal migration helper
can copy and verify the existing V3 drift keys. This adapter can then serve
as the async persistence primitive for a later safe startup cutover.

No automatic opt-in, release promotion or browser key deletion is in this PR.

## Merge / release separation

This standalone client is safe to keep **dormant in a merge to main** once its
isolated regression suite and V3 full-check workflow are green. A merge is
not a storage cutover, does not opt the runtime into this adapter, and must
not deploy new Cloudflare/V3 runtime artifacts solely for this preparation.
Its own paths are excluded from the automatic V3 version, Cloudflare deploy
and documentation-release triggers. Revisit those exclusions as part of a
separately authorized, runtime-validated migration.

Required before real activation: confirmed preload of every old content-drift
and quarantine baseline, preservation of UNKNOWN/STOP conditions, explicit
rollback and live runtime evidence. Host outage must not reset any baseline.
