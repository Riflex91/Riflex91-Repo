# Windows unattended certification

Step 13 is the production-evidence gate for the Windows v3 host. It does not grant gameplay authority and it does not treat synthetic CI as real uptime.

## Gate order

The gates are strict and sequential:

1. `canary` — 15 minutes of stable sampling after two real canaries;
2. `1h` — one continuous hour;
3. `24h` — one continuous day;
4. `72h` — three continuous days;
5. `7d` — seven continuous days.

A later gate cannot initialize unless the previous gate has a hash-valid `FINAL` record with `passed:true`.

## What every sample proves

The collector reads only the authenticated loopback `GET /v1/status` host endpoint. An accepted sample requires all of the following at the same instant:

- host API listening, authenticated, loopback-only and GET-only;
- no gameplay/raw-gameplay authority in API, controller, launcher, harness, CDP session or reconciliation observer;
- managed browser process running without inheriting the Node host secret environment;
- Step-9 CDP session connected on loopback with no generic remote evaluation surface;
- narrow `BrowserBotClient` bridge active on the Adventure Land origin with exactly the four host operations `hostHeartbeat()`, `pendingAlerts()`, `claimAlerts()` and `reconciliationStatus()`;
- watchdog `HEALTHY` and dead-man closed;
- last accepted beacon has a run ID and `fourCharacterReady:true`;
- local character is not dead;
- reconciliation is `IDLE` or `OBSERVED_CLEAN`, and `reconciliationStatus()` has a fresh current clean observation with no unresolved transactions/recoveries or known open critical circuits;
- durable alert spool is ready;
- zero pending CRITICAL alerts;
- both required Step-12 CRITICAL routes are configured;
- no host tick, heartbeat or alert-relay error.

One failed sample fails that attempt. A sample gap greater than the gate maximum also fails the attempt. Time alone never passes a gate.

## Evidence format

Evidence is stored under:

`%LOCALAPPDATA%\AioBot\host-service\certification\<gate>.jsonl`

Every line contains a monotonically increasing sequence, monotonic evidence time, previous-row SHA-256 and its own SHA-256. The file is reverified before every append. Clock regression, implausible future timestamps, tampering, truncating/reordering rows or corrupt JSON cause fail-closed verification.

Sensitive-looking keys are redacted before persistence. API tokens, DPAPI alert secrets, cookies and provider credentials are not evidence fields.

## Canary

Start the canary with the explicit existing restart acknowledgement:

```powershell
.\ops\windows-host\start-certification.ps1 -RepoPath C:\path\to\repo -Gate canary -RestartAck ALPHA20_5_HOST_RESTART -Reset
```

Before the 15-minute stable timer begins, the script performs two production drills:

1. the Step-12 primary and fallback CRITICAL routes are canary-delivered independently;
2. the managed browser PID is deliberately terminated after restart authority is explicitly enabled.

The recovery canary passes only when the host records a bounded browser restart, observes a different run ID and reaches `OBSERVED_CLEAN` with incremented fresh-run/reconciliation counters.

After those drills are hash-recorded, the timed stable sampling phase starts. The deliberate fault therefore cannot be mistaken for an unplanned soak failure or reduce the stable duration.

## Later gates

After a passed canary:

```powershell
.\ops\windows-host\start-certification.ps1 -RepoPath C:\path\to\repo -Gate 1h -Reset
.\ops\windows-host\start-certification.ps1 -RepoPath C:\path\to\repo -Gate 24h -Reset
.\ops\windows-host\start-certification.ps1 -RepoPath C:\path\to\repo -Gate 72h -Reset
.\ops\windows-host\start-certification.ps1 -RepoPath C:\path\to\repo -Gate 7d -Reset
```

The collector runs as the per-user `AioV3Certification` scheduled task. Its logon trigger lets the collector resume the same hash chain after a collector process restart. A long interruption still fails the gate through the maximum-sample-gap rule; restartability cannot hide downtime.

## Runtime-action audit for 24h+

The loopback host API can prove authority boundaries and system health, but it intentionally cannot inspect or execute arbitrary gameplay operations. Therefore the 24h/72h/7d final gates also require an explicit review artifact for expected-vs-unexpected gameplay actions.

After reviewing the relevant retained runtime/diagnostic export:

```powershell
.\ops\windows-host\record-certification-audit.ps1 -RepoPath C:\path\to\repo -Gate 24h -EvidenceSource C:\path\to\reviewed-runtime-audit.json -IReviewedRuntimeActions -NoUnexpectedRawGameplayActions -Note "No unexpected raw gameplay actions observed"
```

Only the source filename, SHA-256, review timestamp, explicit clean result, zero unexpected-raw-action count and note enter the certification chain. The source file itself is not copied into the repository or certification log. A weak audit marker or any nonzero unexpected raw gameplay action count blocks the gate.

## Status and finalization

```powershell
.\ops\windows-host\status-certification.ps1 -RepoPath C:\path\to\repo -Gate 24h
.\ops\windows-host\finalize-certification.ps1 -RepoPath C:\path\to\repo -Gate 24h
```

The collector normally writes `FINAL` automatically when all requirements pass. Manual finalization is useful when ending a failed/incomplete attempt and returns a non-zero exit code unless the gate passes.

Use `-Reset` on a later retry. Existing evidence is moved into the local `certification\archive` directory rather than overwritten.

## What Step 13 does not certify by itself

Green GitHub CI certifies only the implementation, tests and safety boundaries of this evidence engine. The repository must not be labeled 24/7-certified until the actual Windows machine has produced passed real-world gate evidence through the intended duration.
