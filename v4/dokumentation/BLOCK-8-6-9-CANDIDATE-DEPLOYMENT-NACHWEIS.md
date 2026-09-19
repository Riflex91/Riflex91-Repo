# Block 8.6.9 – Candidate-Deployment- und HTTPS-Nachweis

Status: **immutable Deployment und öffentlicher HTTPS-Rückweg für den exakt gebundenen Block-8.6-Candidate bestanden; reale Adventure-Land-Stufen bleiben offen.**

## Exakter Candidate

- Release-SHA: `ca0dfee7685563c8b6003469300c8fd08777b053`
- Candidate-Version: `1.0.0`
- Runtime-Version: `1.1.5`
- Module: **51**
- Größe: **396471 Bytes**
- SHA-256: `b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5`
- Laufzeitpfad: `block8.6-capability-runtime`
- Änderungskennung: `git:ca0dfee7685563c8b6003469300c8fd08777b053`

Die historische Runtime 1.1.5 innerhalb dieses Candidates bleibt exakt:

- 31 Module
- 228607 Bytes
- SHA-256 `95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f`

## GitHub-Actions-Nachweis

- Workflow: `release-v4-block8-6-candidate-immutable`
- Run-ID: `35441831873`
- Run-Nummer: `4`
- Job-ID: `105893861206`
- Event: `workflow_dispatch`
- Branch: `main`
- Control-Head: `07e2af0f721219b50586b4c5e08cece717048610`
- Ergebnis: **success**
- Abschluss: `2026-09-19T12:05:07Z`

Der Release-Workflow wurde explizit mit dem Candidate-SHA `ca0dfee7685563c8b6003469300c8fd08777b053` ausgeführt.

## Erfolgreiche Release-Schritte

Im Run waren insbesondere erfolgreich:

1. `Require main dispatch exact SHA and explicit Block 8.6 confirmation`
2. `Validate Block 8.6 candidate manifest`
3. `Checkout exact Block 8.6 candidate`
4. `Build and verify exact Block 8.6 candidate`
5. `Prepare isolated R2-only Wrangler config`
6. `Publish immutable Block 8.6 candidate objects without overwrite`
7. `Verify immutable Block 8.6 objects from R2`
8. `Verify immutable Block 8.6 candidate over existing public HTTPS worker`

Damit ist für denselben Candidate nachgewiesen:

- exakter reproduzierbarer Candidate-Build,
- exakte Bytegröße und SHA-256,
- unveränderte Runtime 1.1.5,
- immutable R2-Veröffentlichung,
- bytegleicher R2-Rückdownload,
- bytegleicher öffentlicher HTTPS-Rückdownload,
- passender öffentlicher SHA-256,
- CORS `*`,
- `Cache-Control: no-store`,
- JavaScript-/Text-Content-Type,
- `x-aio-v4-release-sha: ca0dfee7685563c8b6003469300c8fd08777b053`.

## Immutable R2-Objekte

Bucket:

`aio-v3-logs`

Objekte:

- `releases/v4/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.js`
- `releases/v4/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.sha256`

Der Workflow legte beide Objekte neu an und lud sie danach zur Byte- und Hash-Verifikation wieder aus R2.

## Öffentliche HTTPS-Endpunkte

Runtime:

`https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.js`

SHA-256:

`https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.sha256`

Der erfolgreiche Workflow verifizierte beide Endpunkte über den bestehenden öffentlichen Worker; ein Worker-Deploy war dafür nicht erforderlich.

## Abgrenzung

Der Release-Workflow besitzt keine V3-Build-, V3-Release-, Worker-Deploy-, D1- oder Lifecycle-Autorität.

Dieser Nachweis bedeutet deshalb ausschließlich:

- `deploymentPerformed=true`
- `publicHttpsVerified=true`

Weiterhin offen und fail-closed:

- `adventureLandShadowVerified=false`
- `adventureLandControlledLiveVerified=false`
- `adventureLandSoakVerified=false`
- `block86Completed=false`
- `block9Freigegeben=false`

## Nächster Schritt

Als nächste sequenzielle Freigabestufe folgt der reale **Adventure-Land-Schattenlauf** mit exakt dem immutable Candidate `ca0dfee7685563c8b6003469300c8fd08777b053`.

Kontrolliert live und Soak dürfen daraus nicht vorgezogen werden.
