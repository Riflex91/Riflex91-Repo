# Block 8.5 – Kontrolliertes Live-/Soak-Komplettpaket

Status: **source-locked Live-Paket vorbereitet; realer kontrollierter Live-Nachweis noch nicht ausgefuehrt.**

## Voraussetzung

Die 8.5.9-Reihenfolge steht jetzt auf:

- Offline: **bestanden**
- Schatten: **bestanden**
- Kontrolliert live: **offen**
- Soak: **blockiert**
- Block 9: **gesperrt**

Der reale Schattenlauf ist kanonisch in:

`BLOCK-8-5-SCHATTEN-FREIGABE-NACHWEIS.json`

gebunden.

## Paket

Copy/Paste-Datei:

`v4/werkzeuge/block8-5-live-paket.js`

Builder:

`v4/werkzeuge/block8-5-live-paket-bauen.mjs`

Das Paket verbindet:

1. den HTTPS+SHA-Bootstrap,
2. die gemeinsame V4-Test-GUI,
3. den Freigabe-Runner 1.1.0,
4. den real bestandenen vollständigen Schattennachweis,
5. einen kontrollierten Live-Launcher.

## Runtime-Konfiguration

Das Paket verwendet bewusst dieselbe bereits fuer V4-Live-Pfade getestete minimale Produktionskonfiguration:

- `aktivFreigegeben: true`
- `vertrauensNamen: ['My_Ranger1', 'My_Ranger2']`
- Fähigkeiten:
  - `heilen: 0`
  - `schaden: 1`
  - `aggro: 0`
  - `schutz: 0`
  - `unterstuetzung: 0`

Es ist weiterhin exakt an Candidate `88185523c81687dc16f9647ca5e7568c5e2c228c` und Runtime-SHA-256 `95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f` gebunden.

## Start-Preflight

Nach dem Einfuegen in einen frischen Adventure-Land-Codekontext:

1. bleibt **2 · Kontrolliert live** zunaechst gesperrt,
2. wird die immutable Runtime geladen,
3. wird die Runtime genau einmal mit `runtime.starte()` aktiv gestartet,
4. wartet der Launcher auf einen **bestaetigten echten Produktionsheartbeat**,
5. jeder Heartbeat-Sendefehler blockiert den Test,
6. ohne bestaetigten Heartbeat innerhalb von 10 Sekunden bleibt der Test gesperrt.

Vor Freigabe des Live-Knopfs werden zusaetzlich verlangt:

- `aktivFreigegeben: true`
- `gestoppt: false`
- `empfangInstalliert: true`
- Heartbeat aktiv und nicht pausiert
- mindestens 1 Sendeversuch
- mindestens 1 Sendeerfolg
- 0 Sendefehler
- 0 offene Sendungen zum Pruefzeitpunkt
- erforderlicher `performance_trick()` bestaetigt
- kein Live-Smoke
- keine Gruppenziel-Vorbereitung
- LaufzeitSteuerung `laeuft`
- Generation 0
- `automatischeFortsetzung: false`

Damit wird kontrolliert live nicht allein aufgrund eines gestarteten Timers freigegeben, sondern erst nach nachgewiesener echter Adventure-Land-Kommunikation.

## Reale Bedienung

Fuer den kontrollierten Live-Nachweis:

1. Einen **frischen** Adventure-Land-Codekontext verwenden. Das alte Schattenpaket nicht wiederverwenden.
2. Sicherstellen, dass neben dem Testcharakter mindestens einer der Vertrauenscharaktere `My_Ranger1` / `My_Ranger2` erreichbar ist.
3. Den gesamten Inhalt von `block8-5-live-paket.js` einfuegen.
4. Warten auf:

   `Live-Preflight bestanden: Runtime aktiv, echter Produktionsheartbeat bestaetigt, Schattennachweis gebunden.`

5. Nur **2 · Kontrolliert live** verwenden.
6. Den in der GUI angezeigten Bestaetigungstext exakt eingeben. Er lautet fuer diesen Lauf:

   `BLOCK8-5-KONTROLLIERT-LIVE:block8-5-schatten-1789775266269`

7. Nach PASS **Gesamtbericht kopieren** und als neuen Freigabenachweis sichern.

Den Soak-Knopf noch nicht eigenstaendig starten, bevor der kontrollierte Live-Bericht kanonisch geprueft und dokumentiert wurde.

## Fail-safe

Das Paket:

- setzt einen fehlgeschlagenen Pause/Fortsetzen-Test nicht automatisch fort,
- stoppt die Runtime bei einem Preflight-Fehler nicht versteckt,
- startet keinen Browser/Host neu,
- ruft keine Adventure-Land-Spielaktionsfunktion direkt auf.

Die aktive Runtime selbst verwendet ihren vorgesehenen Produktionsheartbeat ueber `send_cm(...)`; deshalb setzt ein spaeter bestandener Live-Nachweis korrekt:

`spielAktionAusgefuehrt: true`

## Source-Lock

Pruefung:

`npm run block8-5-live-paket:pruefen`

CI verlangt bytegenaue Uebereinstimmung des Pakets mit:

- Bootstrap,
- Test-GUI,
- Freigabe-Runner,
- kanonischem Schatten-Freigabenachweis,
- Live-Launcher.
