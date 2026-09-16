# v3 automatic problem diagnostics via FTPS

This host-side subsystem captures a bounded diagnostic bundle when v3 emits an ERROR/CRITICAL-style event, an important warning, the host watchdog becomes unhealthy, or the production host harness itself fails.

The subsystem is observation-only. It has no gameplay authority and every local/FTPS failure is isolated from the bot control loop.

## Data flow

```text
browser bot -> read-only BrowserBotClient debug bridge
            -> ProblemDiagnosticsArchive
            -> local gzip spool
            -> FtpsDiagnosticsUploader
            -> FTPS archive
```

A problem bundle contains the triggering signal, the current read-only debug snapshot, recent debug events, and a small host status envelope. Credential-like keys are recursively replaced with `[REDACTED]` before compression.

The local spool defaults to:

```text
v3/var/v3-diagnostics/
  latest-problem.json
  pending/
    problem-<timestamp>-<digest>.json.gz
    problem-<timestamp>-<digest>.json.gz.meta.json
```

Successful uploads are stored remotely as:

```text
<root>/<bot-id>/<YYYY-MM-DD>/problem-....json.gz
<root>/<bot-id>/<YYYY-MM-DD>/problem-....json.gz.sha256
<root>/<bot-id>/latest-problem.json
```

Uploads first use a `.part` name. The uploader checks the remote byte count before renaming the file to its final name. The local pending file is deleted only after this verification succeeds. If FTPS is unavailable, the pending file remains on disk and later host ticks retry it.

## Installation

From `v3/` install dependencies:

```bash
npm install
```

`basic-ftp` is used only by the host-side uploader and is loaded lazily. Local problem spooling still works if no FTPS destination is configured.

## Environment configuration

Do not put credentials in the repository, browser code, Adventure Land code slots, or diagnostic files. Configure them only in the host process environment.

```bash
AIO_V3_DIAGNOSTICS_ENABLED=true
AIO_V3_DIAGNOSTICS_BOT_ID=pi-main
AIO_V3_DIAGNOSTICS_SPOOL_DIR=/var/lib/aio-v3/diagnostics

AIO_V3_DIAGNOSTICS_FTPS_HOST=<bplaced FTPS host>
AIO_V3_DIAGNOSTICS_FTPS_PORT=21
AIO_V3_DIAGNOSTICS_FTPS_USER=<FTP user>
AIO_V3_DIAGNOSTICS_FTPS_PASSWORD=<FTP password>
AIO_V3_DIAGNOSTICS_FTPS_SECURE=true
AIO_V3_DIAGNOSTICS_FTPS_REJECT_UNAUTHORIZED=true
AIO_V3_DIAGNOSTICS_FTPS_ROOT=/diagnostics/v3
```

Optional tuning:

```bash
AIO_V3_DIAGNOSTICS_EVENT_LIMIT=200
AIO_V3_DIAGNOSTICS_DEDUPE_MS=600000
AIO_V3_DIAGNOSTICS_MAX_PENDING_FILES=200
AIO_V3_DIAGNOSTICS_MAX_PENDING_BYTES=536870912
AIO_V3_DIAGNOSTICS_FTPS_TIMEOUT_MS=15000
AIO_V3_DIAGNOSTICS_FTPS_MAX_FILES_PER_FLUSH=4
```

When complete FTPS credentials are configured, diagnostics default to enabled even if `AIO_V3_DIAGNOSTICS_ENABLED` is omitted. Set the flag explicitly to `false` to disable capture.

Plain FTP is rejected when credentials are configured. FTPS certificate verification is enabled by default; do not disable it for production.

## bplaced notes

Use FTPS/TLS, not plaintext FTP. Keep the private archive outside a publicly served web directory whenever the hosting layout permits it. The generated `latest-problem.json` is an index, not an authentication mechanism, and should not be made public together with the private diagnostic archive.

Because bplaced Free storage is limited, the local spool has bounded retention. Remote retention should also be configured operationally so routine repeated incidents do not consume the entire account.

## What triggers a bundle

The archive treats these as problems:

- `ERROR`, `CRITICAL`, `FATAL`, `EMERGENCY`, or `ALERT` debug events;
- warnings whose event/reason contains failure, restart-required, safe-mode, no-progress, disconnected, timeout, outage, degraded, or similar failure indicators;
- a non-healthy host watchdog state;
- a production-host-harness exception.

The same problem fingerprint is deduplicated for ten minutes by default.

## Security properties

- FTPS credentials exist only in the Node host process.
- Credentials are never passed through `BrowserBotClient` into the browser.
- Status objects expose only `hostConfigured`, `userConfigured`, and `passwordConfigured` booleans, never credential values.
- Credential-like fields in diagnostic payloads are recursively redacted before they are written.
- FTPS is fail-open with respect to gameplay: an archive/upload error cannot stop or change the bot's controller result.
- Remote uploads use `.part` names and byte-count verification before publication.
- Each bundle has a SHA-256 sidecar.

## ChatGPT access limitation

The FTPS archive solves automatic collection and durable storage. It does **not** by itself give ChatGPT direct authenticated access to a private FTP account in a later conversation.

For fully automatic support retrieval, add a separate read-only integration later, for example an authenticated connector/service that can return the newest sanitized bundle by bundle ID. Do not make the raw FTPS directory public and do not paste the FTPS password into chat.

Until that read integration exists, `latest-problem.json` provides a stable machine-readable pointer on the host/FTPS side and the compressed bundle can be supplied for analysis without changing the capture format.
