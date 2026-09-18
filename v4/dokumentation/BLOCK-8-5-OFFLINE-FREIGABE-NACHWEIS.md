# Block 8.5 – Offline-Freigabenachweis

Status: **Stufe 1 Offline fuer den exakten Runtime-1.1.5-Candidate bestanden; naechste Stufe ist Schattenbetrieb.**

## Bindung

Laufzeitpfad:

`block8.5-basisbedienung-runtime`

Aenderungskennung:

`git:88185523c81687dc16f9647ca5e7568c5e2c228c`

Candidate-Commit:

`88185523c81687dc16f9647ca5e7568c5e2c228c`

Runtime:

- Version **1.1.5**
- 31 Module
- 228607 Bytes
- SHA-256 `95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f`

## Kanonischer FreigabeNachweis

Maschinenlesbare Datei:

`v4/dokumentation/BLOCK-8-5-OFFLINE-FREIGABE-NACHWEIS.json`

Der darin enthaltene `FreigabeNachweis` setzt:

- `stufe: offline`
- `ergebnis: bestanden`
- `deterministisch: true`
- `spielAktionAusgefuehrt: false`

Bewusst nicht behauptet werden Eigenschaften spaeterer Stufen:

- `begrenzt: false`
- `telemetrieNachweis: false`
- `recoveryNachweis: false`
- `gesamtauswertungBestanden: false`

## Exakte CI-Evidenz

Der Nachweis ist nicht an einen beweglichen Branch oder einen spaeteren Main-Stand gebunden.

Er verweist auf zwei erfolgreiche Push-Workflows mit exakt:

`head_sha = 88185523c81687dc16f9647ca5e7568c5e2c228c`

### v4-ci

- Run-ID: `35402650442`
- Job-ID: `105785689353`
- Run-Nummer: **287**
- Ergebnis: **success**
- Abschluss: `2026-09-18T22:41:51Z`

Der Job hat den Pflichtschritt

`Typen, Tests, Namen und Struktur pruefen`

erfolgreich abgeschlossen.

### v4-grundlage-pruefen

- Run-ID: `35402650416`
- Job-ID: `105785688933`
- Run-Nummer: **1150**
- Ergebnis: **success**
- Abschluss: `2026-09-18T22:41:45Z`

Auch hier wurde

`Typen, Tests, Namen und Struktur pruefen`

erfolgreich abgeschlossen.

## Freigabezeitpunkt

Der kanonische Nachweis verwendet als `durchgefuehrtAm` den Abschlusszeitpunkt des spaeter abgeschlossenen der beiden erforderlichen Candidate-CI-Laeufe:

`1789771311000`

Das entspricht:

`2026-09-18T22:41:51Z`

Damit gilt die Offline-Stufe erst als abgeschlossen, nachdem beide erforderlichen Candidate-Pruefungen erfolgreich waren.

## Reale Auswertung

Regressionstest:

`v4/laufzeit/tests/block8-5-offline-freigabe-nachweis.test.mjs`

Der Test laedt die kanonische JSON-Datei und uebergibt ihren Nachweis an:

`werteFreigabestufenAus(...)`

Erwartetes Ergebnis:

- `offline -> bestanden`
- `schatten -> offen`
- `kontrolliert_live -> blockiert`
- `soak -> blockiert`
- `naechsteStufe: schatten`
- `freigabeVollstaendig: false`
- `block9Freigegeben: false`
- `spielAutoritaet: false`
- `neustartAutoritaet: false`

## Was dieser Nachweis nicht bedeutet

Der Offline-Nachweis ist kein Adventure-Land-Live-Nachweis.

Er bestaetigt nicht:

- einen realen Schattenlauf,
- eine reale Pause/Fortsetzung im Spielkontext,
- einen realen Soak-Lauf,
- Block-9-Freigabe.

Deployment und oeffentliche HTTPS-Verifikation des Candidate sind separat bereits bestaetigt. Sie ersetzen aber keine der drei verbleibenden operativen Freigabestufen.

## Naechste Stufe

Die naechste zulaessige Freigabestufe ist:

**Schattenbetrieb**

Dafuer muss Runtime 1.1.5 aus dem immutable Candidate geladen werden und der vorbereitete 8.5.9-Nachweisrunner ausschliesslich seine read-only Diagnose-Stufe ausfuehren.

Block 9 bleibt gesperrt.
