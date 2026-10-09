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

`POST /v1/state/account` exists only behind disabled-by-default write gates.
Without explicit test-only permission, verified durable Bridge ownership **and**
the legacy-writer probe, it returns HTTP 423. Production never enables it.
This prevents the Bridge from racing the still-running Node account writer.
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

## Account write preparation and legacy writer guard

The native Bridge now contains a validated `AlFinalNativeAccountSnapshot.WriteAccount`
implementation that writes the legacy `account-profiles/*.json` and
`account-wealth.json` file formats with per-file fsync and rename. It
prevalidates all records and rejects duplicate names, traversal, stale
observations, and oversized/malformed input before modifying files. It is
**not a multi-file transaction**. A failure can leave an incomplete batch,
which must be reconciled rather than blindly retried.

The HTTP `POST /v1/state/account` route is **disabled by default** and
returns HTTP 423. The production Bridge never enables it. A test-only opt-in
parameter exists for controlled temporary-folder protocol tests. Both the
account and telemetry write routes reject writes when the legacy Node host
might be listening on 127.0.0.1:17391. This check is defense in depth and
**not** proof of exclusive filesystem ownership: safe operational handover
will require coordinated shutdown, a durable exclusive lease, and endpoint
switching before either writer is enabled in production.

## Durable account/telemetry writer ownership (staged; not a cutover)

ALFinal's instrumented Node host and the native Bridge share a cross-process
fencing protocol under `D:\\ALBot\\state`:

- `writer-owner.json` is a persistent, versioned JSON record with
  `schemaVersion: 1` and `owner: "node" | "bridge"`.
- `writer-lease.json` is created atomically using create-new/exclusive mode.
  While active, the Bridge also holds its Windows file handle with
  `FileShare.None`. The file includes a per-process random token.
- The Node daemon acquires its lease before serving HTTP, checks both records
  before account/telemetry mutations (including daily flush and pruning), and
  only removes its **verified** lease after a successful graceful flush/stop.
  Node refuses to restart when the durable owner is `bridge`.
- The Bridge's test-only account/telemetry write routes also require a
  confirmed native lease **in addition to** their existing opt-in and port
  checks. A missing, stale or foreign owner returns HTTP 423.
- Abnormal termination deliberately leaves the lease file behind. Neither
  process silently reclaims a stale lease. Manual reconciliation is required.

**No automated ownership handover is provided yet.** Never directly change
or remove either production marker to make a failed startup pass. A future
authorized cutover must stop/flush the legacy service, confirm it remains
stopped across restarts, back up and reconcile account/telemetry data,
atomically transition the owner record while no lease is held, then acquire
and verify Bridge ownership before switching browser endpoints. Rollback
must symmetrically stop and release the Bridge writer, preserve all writes,
and explicitly reassign ownership before starting Node. Native write opt-ins
remain inaccessible from the production Bridge GUI/config; the existing live
Node endpoints remain unchanged.

The lease is a cooperation/fail-closed mechanism for **instrumented** writers,
not a proof that an old uninstrumented Node process, a direct file-writing
tool, or a hostile local program is absent. Live exclusive ownership cannot
be claimed until all legacy writers are accounted for and disabled.

## Account/telemetry ownership revalidation during HTTP requests

The experimental native account and telemetry HTTP handlers now pass the
verified writer lease as a per-mutation check into the file-writing classes.
The original route-level gate is still required, but no longer sufficient:
a lease revoked **while the request is being parsed or the Node-port probe
is awaited** returns HTTP 423 rather than writing a file. Account snapshots
revalidate immediately before each write and final atomic rename; telemetry
revalidates for each raw record and daily-file replacement.

Both APIs are still test-only and production-disabled. Batches are **not
atomic across files**: a revocation part-way through an account/telemetry
batch can leave a durable prefix of the batch. Such an exception must not be
reported as a successful ACK. The operator must reconcile partial files using
a verified backup; retries must never be blind. Regression coverage explicitly
revokes the owner during the async HTTP probe and during multi-record writes.
