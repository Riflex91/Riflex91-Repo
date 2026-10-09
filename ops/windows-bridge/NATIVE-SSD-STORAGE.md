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
