# ALFinal native SSD API in Windows Bridge (candidate only)

Windows Bridge can host the SSD persistence API **in its own .NET process**.
No Node.js dependency or secondary updater is needed for SSD key/value data.

- Local bind: `http://127.0.0.1:17392` (native Bridge, opt-in)
- Data root: `D:\ALBot\state\durable-kv`
- `GET /health`: service, process and SSD schema
- `GET /v1/storage?key=...`: read { ok, found, value, revision }
- `POST /v1/storage?key=...`: { key, value, expectedRevision?, expiresAtMs? }
- `DELETE /v1/storage?key=...`: remove an owned key

Allowed key namespaces: `albot:`, `aio-v3-content-drift-v1`, and
`cstore_AIO_V3_WORLD_MODEL`. Keys are SHA-256 hashed to filenames, never
used as paths. SSD writes use an exclusive lock, temp file, write-through
flush and same-volume atomic replacement. CAS revisions prevent stale
writers from silently overwriting newer records. Value size is capped at
3 MiB and a single HTTP request is capped at 4 MiB.

The API runs only when the user explicitly enables the **Native SSD-Speicher-API**
toggle. It binds only to IPv4 loopback and permits browser origins under
adventure.land. The browser must use the opt-in API explicitly; no direct
filesystem access, arbitrary command execution, login/session access, or
gameplay authority is granted. **CORS is not authentication against other
local processes**, so the operator should treat localhost as a local trust
boundary and avoid untrusted native programs.

## Temporary migration topology

The existing Node host remains on `127.0.0.1:17391` **for telemetry and
account endpoints only**. The native SSD API uses `17392` so both can run
without interfering. ALFinal's draft browser SSD client must point to
`17392` after the Bridge has been released and enabled.

**This is not complete browserless operation:** ALFinal's H19/STOP safety
state and remaining V3 runtime stores still need a confirmed-write
migration. Do not automatically clear browser data or fail open on a native
Bridge restart/self-update. The live bot remains unchanged while this PR
is a draft. The older draft Windows host-updater PR #994 is superseded by
this native-storage direction, not required for the SSD API.

## Native account-state readback (shadow mode)

The Bridge now exposes a **read-only** `GET /v1/state/account` compatible
with the existing ALFinal Node host account snapshot JSON schema. It reads
`D:\ALBot\state\account-profiles\*.json` and
`D:\ALBot\state\account-wealth.json` without changing the files.
The parser bounds the number and size of records, refuses reparse-point
files, and fails explicitly on malformed JSON or unsafe filenames.

`POST /v1/state/account` is intentionally **not supported** yet. This
prevents the new Bridge from racing the still-running Node account writer.
ALFinal's host-state client therefore remains on Node port `17391`
until a safe single-writer cutover has been implemented and verified.

## Native telemetry ingest (shadow-gated)

The native .NET `AlFinalNativeTelemetryCapture` implements the legacy
`POST /v1/telemetry` JSON contract (`{records:[...]}`), writing the same
`raw/YYYY-MM-DD/HH/<character>.ndjson` and
`daily/YYYY-MM-DD/<character>.json` layout under
`D:\ALBot\telemetry`. It validates timestamps, bounds batches and
per-record sizes, preserves daily counters across restarts, and writes
durable files.

**Its HTTP write gate defaults to OFF** and is not enabled by the Bridge
settings/UI in this phase. A disabled route returns HTTP 423 rather than
silently accepting or losing telemetry. The live ALFinal telemetry client
continues using Node port `17391`. The native ingestion path can be
integration-tested with temporary roots and explicit test-only opt-in;
a single-writer cutover is still required.
