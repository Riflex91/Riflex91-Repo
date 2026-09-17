# Forgejo local test on Windows

This setup is for a first local Forgejo evaluation on a Windows PC using Docker Desktop with the WSL2 backend. It does not replace GitHub yet and does not modify the existing v3 release pipeline.

## Why Docker/WSL2

Forgejo no longer provides official native Windows server support. Running the official Linux container under Docker Desktop keeps the installation close to the later Raspberry Pi/Linux setup.

## Pinned version

- Forgejo server: `15.0.8` LTS

Keep the version pinned during the evaluation. Upgrade only after a backup and a successful restore test.

## First test sequence

1. Install or update WSL2.
2. Install Docker Desktop and enable the WSL2 backend / Linux containers.
3. Open PowerShell in this repository.
4. Run:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\infra\forgejo-windows\windows-preflight.ps1
   ```

5. If the preflight is green, start Forgejo:

   ```powershell
   cd .\infra\forgejo-windows
   docker compose pull
   docker compose up -d
   docker compose ps
   ```

6. Open `http://localhost:3000`.
7. Complete the initial setup and create only the local administrator account.
8. Create an empty private repository for the Adventure Land project.
9. Test clone, push, branch creation and pull request handling locally.
10. Only after repository operations are proven, add Forgejo Actions / Runner.

## Ports

- Web UI: `http://localhost:3000`
- Git over SSH: `localhost:2222`

Nothing needs to be exposed through the router for this evaluation.

## Data

Forgejo data is stored in the Docker named volume `aio-forgejo-data`. This avoids Windows bind-mount permission quirks during the first test.

Useful commands:

```powershell
docker compose ps
docker compose logs -f forgejo
docker compose stop
docker compose start
docker compose down
```

`docker compose down` does not delete the named volume. Do **not** use `docker compose down -v` unless the local Forgejo data may intentionally be destroyed.

## Migration policy

GitHub remains the authoritative copy during the evaluation. Do not delete, force-push, or merge anything on GitHub as part of this setup. Once local Forgejo, backups, restores, and CI are proven, we can decide whether Forgejo becomes primary and GitHub becomes only a mirror/backup.
