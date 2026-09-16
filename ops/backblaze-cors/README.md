# Backblaze CORS via GitHub Actions

Dieser Runbook konfiguriert die Browser-CORS-Regel fuer den privaten Backblaze-Bucket `al-aio-bot`, ohne Zugangsdaten in Repository-Dateien zu speichern.

## Zweck

Der Adventure-Land-Bot laeuft unter `https://adventure.land` und verwendet die S3-kompatible Backblaze-API fuer den verifizierten Object-Storage-Selbsttest. Der Browser benoetigt dafuer eine passende Bucket-CORS-Regel fuer `PUT` und `HEAD`.

Der manuelle Workflow `.github/workflows/backblaze-cors.yml` setzt folgende Regel an die erste Position und erhaelt alle anders benannten bestehenden CORS-Regeln:

```json
{
  "corsRuleName": "adventureLandBot",
  "allowedOrigins": ["https://adventure.land"],
  "allowedHeaders": ["*"],
  "allowedOperations": ["s3_put", "s3_head"],
  "exposeHeaders": [
    "etag",
    "x-amz-version-id",
    "x-amz-meta-aio-sha256",
    "content-length"
  ],
  "maxAgeSeconds": 3600
}
```

Der Workflow bricht ab, falls `al-aio-bot` nicht `allPrivate` ist. Er macht den Bucket niemals oeffentlich.

## Einmaligen Admin-Key in Backblaze anlegen

Verwende **nicht** den Master Key und nicht den normalen Bot-Key. Lege fuer diese administrative Aktion einen separaten, moeglichst kurzlebigen Application Key an.

Erforderliche Faehigkeiten fuer den B2-CLI-Weg:

- `listBuckets`
- `writeBucketSettings`

Wenn Backblaze die Auswahl erlaubt, beschraenke den Key auf `al-aio-bot` und setze eine kurze Ablaufzeit. Der normale Bot-Key benoetigt diese Admin-Rechte nicht.

## GitHub-Secrets anlegen

Im Repository:

`Settings -> Secrets and variables -> Actions -> New repository secret`

Lege exakt diese beiden Repository-Secrets an:

- `B2_CORS_KEY_ID` = Backblaze `keyID` des temporaeren Admin-Keys
- `B2_CORS_APPLICATION_KEY` = zugehoeriger `applicationKey`

Die Werte niemals in Issues, PRs, Logs oder Repository-Dateien einfuegen.

## Workflow ausfuehren

Der Workflow ist absichtlich nur per `workflow_dispatch` startbar.

### 1. Dry-run

`Actions -> backblaze-cors -> Run workflow`

- `mode`: `dry-run`
- `confirm`: leer lassen

Der Dry-run authentifiziert sich, liest den Bucket, bestaetigt `allPrivate` und baut die geplante CORS-Konfiguration. Er schreibt nichts nach Backblaze.

### 2. Apply

Wenn der Dry-run erfolgreich war, erneut starten:

- `mode`: `apply`
- `confirm`: `APPLY_CORS`

Der Workflow:

1. installiert die offizielle Backblaze-B2-CLI aus PyPI;
2. verwendet die beiden GitHub-Secrets nur als Laufzeit-Umgebungsvariablen;
3. speichert den B2-Auth-Cache nur temporaer unter `runner.temp`;
4. liest den aktuellen Bucket-Zustand;
5. verweigert die Aenderung, wenn der Bucket nicht privat ist;
6. setzt `adventureLandBot` an die erste Stelle und erhaelt anders benannte CORS-Regeln;
7. liest den Bucket erneut aus und verifiziert Origin, Header, Operationen, Expose-Headers, Max-Age und `allPrivate`;
8. entfernt den temporaeren Auth-Cache auch bei Fehlern.

## Danach

Backblaze-CORS-Aenderungen koennen einige Minuten benoetigen, bis sie wirksam sind. Danach in der Windows Bridge erneut den expliziten Backblaze-Live-Test ausfuehren (`PUT + HEAD`, kein automatisches DELETE).

Wenn der Test erfolgreich ist, kann der temporaere Admin-Key in Backblaze geloescht werden. Anschliessend koennen auch die beiden `B2_CORS_*` Repository-Secrets wieder entfernt werden.
