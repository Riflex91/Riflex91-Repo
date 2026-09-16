# V3 Backblaze / S3-Objektspeicher

V3 kann eine von der Windows Bridge bereitgestellte S3-kompatible Objektspeicher-Konfiguration verwenden. Die erste Zielplattform ist Backblaze B2 Cloud Storage.

## Sicherheitsgrenze

Die Windows Bridge setzt die Zugangsdaten ausschließlich zur Laufzeit im Adventure-Land-Kontext unter:

```js
globalThis.AIO_V3_BACKBLAZE_CONFIG
```

Der Bot schreibt diese Zugangsdaten nicht in LocalStorage, Telemetrie, Statusausgaben oder Fehlerdetails. `AIO_V3.objectStorage.status()` gibt nur nicht geheime Konfigurationsdaten aus.

Die Browser-Übergabe ist eine Übergangslösung. Langfristig sollen Objektspeicher-Geheimnisse wieder aus dem Browserkontext entfernt und host-/plattformseitig verwendet werden.

## Unterstützter Ablauf

```text
AIO_V3_BACKBLAZE_CONFIG
  -> S3-kompatible AWS-Signature-V4-Anfrage
  -> PUT
  -> HEAD
  -> Größe + x-amz-meta-aio-sha256 prüfen
  -> erst dann verified=true
```

Automatische Rohdatenlöschung gehört ausdrücklich **nicht** zu diesem Adapter.

## Laufzeit-API

Status ohne Geheimnisse:

```js
AIO_V3.objectStorage.status()
```

Ein kleiner Live-Selbsttest erzeugt ein Objekt unter `v4/_health/...`, lädt es hoch und prüft es per HEAD. Standardmäßig wird das Testobjekt **nicht** gelöscht:

```js
await AIO_V3.objectStorage.selfTest()
```

Explizite Testbereinigung:

```js
await AIO_V3.objectStorage.selfTest({ cleanup: true })
```

Die Bereinigung ist bewusst versionsgenau: Der Adapter übernimmt die von Backblaze zurückgegebene `x-amz-version-id` und löscht exakt diese hochgeladene Version. Ein namenbasiertes DELETE ohne `versionId` wird nicht als Laufzeit-API angeboten, weil Backblaze dabei nur einen Delete Marker anlegt und die gespeicherten Dateiversionen erhalten bleiben.

Vor der expliziten Bereinigung wartet der Selbsttest mindestens eine Sekunde zwischen Upload und DELETE. Wenn Backblaze dem Browser keine Version-ID bereitstellt, verweigert der Selbsttest die Bereinigung anstatt einen namenbasierten Delete Marker zu erzeugen.

Ein eigener Upload wird nach dem PUT automatisch per HEAD verifiziert:

```js
const result = await AIO_V3.objectStorage.put(
  'raw/test.json',
  JSON.stringify({ hello: 'world' }),
  { contentType: 'application/json' }
)
```

Das Ergebnis enthält bei Backblaze zusätzlich die `versionId`, sofern der Header für den Browser sichtbar ist.

HEAD eines vorhandenen Objekts:

```js
await AIO_V3.objectStorage.head('raw/test.json')
```

Eine bestimmte Version kann nur mit Version-ID und expliziter Bestätigung dauerhaft gelöscht werden:

```js
await AIO_V3.objectStorage.deleteVersionExplicit(
  'raw/test.json',
  result.versionId,
  AIO_V3.objectStorage.deleteConfirmation
)
```

Es gibt keinen Hintergrund-Cleanup, keinen namenbasierten Delete-Marker-Aufruf und keinen automatischen DELETE-Aufruf.

## Backblaze Application Key

Für normalen Upload + HEAD-Prüfung benötigt der bucket-begrenzte Application Key mindestens `writeFiles` und `readFiles` auf dem verwendeten Präfix. Für eine dauerhafte, versionsgenaue Löschung wird zusätzlich `deleteFiles` benötigt.

Empfohlen:

- Bucket: `al-aio-bot`
- Präfix: `v4`
- kein Master Key
- Key auf diesen Bucket und nach Möglichkeit auf das Präfix `v4/` begrenzen
- `writeFiles` für PUT
- `readFiles` für HEAD und die dauerhafte Upload-Verifikation
- `deleteFiles` nur dann freigeben, wenn die explizite Testbereinigung oder spätere kontrollierte Speicherfreigabe wirklich benötigt wird

Da der Selbsttest mit Bereinigung zuerst hochlädt und anschließend genau diese Version löscht, braucht ein dafür verwendeter Key `writeFiles`, `readFiles` und `deleteFiles`.

## CORS für Browserzugriff

Da Adventure Land direkt aus `https://adventure.land` zum privaten S3-Endpunkt sendet, muss der Bucket eine passende S3-CORS-Regel besitzen.

Eine passende Regel ist sinngemäß:

```xml
<CORSConfiguration>
  <CORSRule>
    <ID>AdventureLandAioV3</ID>
    <AllowedOrigin>https://adventure.land</AllowedOrigin>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedMethod>DELETE</AllowedMethod>
    <AllowedHeader>Authorization</AllowedHeader>
    <AllowedHeader>Content-Type</AllowedHeader>
    <AllowedHeader>x-amz-content-sha256</AllowedHeader>
    <AllowedHeader>x-amz-date</AllowedHeader>
    <AllowedHeader>x-amz-meta-aio-sha256</AllowedHeader>
    <ExposeHeader>Content-Length</ExposeHeader>
    <ExposeHeader>ETag</ExposeHeader>
    <ExposeHeader>x-amz-version-id</ExposeHeader>
    <ExposeHeader>x-amz-meta-aio-sha256</ExposeHeader>
    <MaxAgeSeconds>3600</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>
```

Wenn der Browser die Anfrage bereits beim Preflight blockiert, meldet der Adapter `OBJECT_STORAGE_CORS_OR_NETWORK` statt Zugangsdaten oder Authorization-Inhalte in einen Fehler zu kopieren.

Wenn `x-amz-meta-aio-sha256` beim HEAD nicht für den Browser sichtbar ist, bricht die Standard-Verifikation mit `OBJECT_STORAGE_VERIFY_HASH_NOT_EXPOSED` ab. Damit wird ein Upload nicht fälschlich als vollständig verifiziert markiert.

Für die optionale permanente Testbereinigung muss außerdem `x-amz-version-id` sichtbar sein. Fehlt dieser Header, bleibt das bereits verifizierte Testobjekt erhalten und der Adapter meldet `OBJECT_STORAGE_CLEANUP_VERSION_ID_REQUIRED`.

## Bewusste Nicht-Ziele dieses Schritts

Noch nicht enthalten:

- automatisches Hochladen des bestehenden `FlightRecorder`
- vollständiges deterministisches Session-Journal
- Chunk-Rotation
- automatisches Löschen von Rohdaten
- Speicher-Lern-Zyklus
- automatische CORS-Konfiguration des Buckets

Der nächste Replay-Schritt kann auf `AIO_V3.objectStorage.put(...)` aufbauen und darf lokale Daten erst nach erfolgreichem `verified=true` als dauerhaft archiviert behandeln. Eine spätere Speicherfreigabe muss die konkrete `versionId` des archivierten Objekts mitführen, damit nur die beabsichtigte Version dauerhaft gelöscht werden kann.
