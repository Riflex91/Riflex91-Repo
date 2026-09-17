# Local Forgejo on Windows + guarded API bridge

This directory prepares a **local-first Forgejo evaluation on Windows** using Docker Desktop with the WSL2 backend.

Nothing in this setup merges or modifies `main` automatically. The existing GitHub workflows remain untouched. Forgejo is introduced in parallel until repository migration, CI, backup/restore, and the guarded API bridge have all been proven.

## Pinned versions / policy

- Forgejo server: `15.0.8` LTS
- Node used by the bridge and v3 CI: `22`
- Forgejo Runner: `13.1.0` (current supported release as of 2026-09-17; keep it pinned during evaluation)
- Forgejo and the bridge bind to **localhost only** during evaluation
- No router port-forwarding is required
- Do not store Forgejo tokens, bridge keys, or Cloudflare credentials in Git

## What is prepared

- `docker-compose.yml`: Forgejo plus an optional local API bridge
- `windows-preflight.ps1`: checks WSL2, Docker, ports, network, and images
- `configure-bridge.ps1`: creates a local `.env.bridge` without committing secrets
- `test-local.ps1`: verifies Forgejo and the bridge
- `bridge/server.mjs`: narrow read/merge API in front of Forgejo
- `bridge/openapi.yaml`: interface description for a future custom connector/integration
- `.forgejo/workflows/v3-ci.yml`: local Forgejo CI for v3 build/preflight/tests/smokes
- `.gitignore`: protects local secret/config files

## Phase 1 — Windows preflight

From PowerShell in the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\forgejo-windows\windows-preflight.ps1
```

The important checks are:

- WSL2 is available
- Docker Desktop is running Linux containers
- ports `3000`, `2222`, and `8788` are free
- the pinned Forgejo image can be pulled
- a Node 22 container can start

## Phase 2 — start Forgejo only

```powershell
cd .\infra\forgejo-windows
docker compose pull forgejo
docker compose up -d forgejo
docker compose ps
docker compose logs -f forgejo
```

Open:

- Web UI: `http://localhost:3000`
- Git SSH endpoint: `ssh://git@localhost:2222/...`

Complete the first-run setup and create the local administrator. Keep registration disabled.

## Phase 3 — migrate repositories

Do **not** delete GitHub copies. During evaluation, import from the verified Git mirror backup or from GitHub while read access still works.

The desired result is that all branches and tags are present in Forgejo, including unmerged work branches.

After migration, verify at minimum:

```powershell
git ls-remote http://localhost:3000/<owner>/<repo>.git
```

and compare important branch heads with the backup/GitHub.

## Phase 4 — Forgejo Actions

Forgejo Actions must be enabled for the repository. Register a dedicated Forgejo Runner and give it a `docker` label.

The prepared workflow is:

```text
.forgejo/workflows/v3-ci.yml
```

It intentionally does **not** auto-commit generated bundles. A pull request fails instead if tracked v3 bundles are stale. This keeps CI deterministic and prevents the runner from silently changing a branch.

Required v3 gate:

```text
build
+ release/logic/static preflight
+ unit tests
+ runtime/bootstrap syntax checks
+ runtime/bootstrap smoke tests
+ Cloudflare control-center checks
+ generated bundle diff check
+ git diff --check
```

## Phase 5 — guarded local API bridge

Create a **dedicated Forgejo automation user** (for example `aio-bot`) and issue a repository-scoped access token. Grant only the permissions required for repository/PR reads and, only if desired later, merge/write access.

Then configure the bridge:

```powershell
powershell -ExecutionPolicy Bypass -File .\configure-bridge.ps1
docker compose --profile bridge up -d --build bridge
powershell -ExecutionPolicy Bypass -File .\test-local.ps1
```

The bridge listens only on:

```text
http://127.0.0.1:8788
```

No secret is committed. `.env.bridge` is generated locally and ignored by Git.

### Bridge safety model

The bridge is intentionally **not a generic Forgejo API proxy**. It exposes only a small allow-list.

Read operations use one bridge key.

Merge requires all of the following:

1. bridge authentication
2. `ALLOW_MERGE=true`
3. a separate merge key
4. explicit request body confirmation `MERGE`
5. exact expected pull-request head SHA
6. PR is open and not draft
7. Forgejo explicitly reports the PR mergeable
8. combined commit status is successful

Even with this technical gate, project policy remains: **no merge unless the user explicitly authorizes that merge**.

### Local bridge vs ChatGPT connectivity

Starting the local bridge does not automatically make it reachable from a cloud ChatGPT session. Keep it localhost-only first. After local validation, add a separately authenticated connector/tunnel layer. Do not expose Forgejo itself to the public internet just to make the bridge reachable.

`bridge/openapi.yaml` is prepared so a future custom integration can target the narrow bridge instead of the full Forgejo API.

## Phase 6 — backup/restore before switching primary forge

Before Forgejo becomes primary:

1. stop writes
2. create a Forgejo data-volume backup
3. restore it into a disposable instance
4. verify repository refs and login
5. verify Actions/runner registration can be recreated
6. retain the independent Git mirror backup

GitHub remains an external source/backup until this restore test succeeds.

## Useful commands

```powershell
docker compose ps
docker compose logs -f forgejo
docker compose --profile bridge logs -f bridge
docker compose stop
docker compose start
docker compose down
```

`docker compose down` keeps the named data volume. Do **not** use `docker compose down -v` unless the Forgejo data may intentionally be destroyed.
