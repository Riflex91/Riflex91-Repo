# ADR-0004: Web/API and SFTP archive are separate trust boundaries

Status: accepted

The dashboard uses HTTPS APIs. SFTP is used only by trusted server-side archive/sync processes. Adventure Land runtime code contains no SFTP credentials and does not access the archive directly.

A platform outage must not remove local runtime safety authority.
