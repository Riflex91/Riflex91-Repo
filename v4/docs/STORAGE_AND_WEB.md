# Storage, SFTP and web architecture

The archive server and web interface may live on the same physical VPS/NAS, but they are separate services.

## Roles

- **HTTPS API:** live control/read access, authentication, rate limiting
- **Dashboard:** browser UI; talks only to HTTPS APIs
- **Live store:** small/queryable status and metrics (for example D1/Postgres/SQLite depending on deployment)
- **Object/archive store:** large replay/incident/session files
- **SFTP:** server-side archival transport only

The Adventure Land runtime never receives FTP/SFTP credentials.

## Archive layout

```text
/v4/
├── sessions/YYYY-MM-DD/<realm>/<character>/
├── incidents/YYYY/MM/<incident-id>/
├── replays/
├── experiments/
├── learning/datasets/
├── models/
├── releases/
└── development/
    ├── inbox/
    ├── investigating/
    ├── ready/
    ├── resolved/
    └── rejected/
```

## Atomic archive publication

Large artifacts are uploaded with a temporary suffix, checksummed, then renamed/finalized. A bundle is consumable only after its manifest is complete. Analysis tooling must reject missing/mismatched hashes.

## Security

Prefer SFTP. If an existing host only supports FTP, do not use plain FTP; use FTPS/TLS at minimum. Runtime write tokens, dashboard read credentials, archive credentials and deployment credentials are separate secrets with minimum permissions.
