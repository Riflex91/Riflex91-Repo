# Block 8.5 – Separates 10-Minuten-Soak-Paket

Status: **source-locked Soak-Paket vorbereitet; realer Soak-Nachweis noch nicht ausgefuehrt.**

## Freigabestand

- Candidate Deployment/HTTPS: **bestanden**
- Offline: **bestanden**
- Schatten: **bestanden**
- Kontrolliert live: **bestanden**
- Soak: **offen**
- Block 9: **gesperrt**

Der kontrollierte Live-Nachweis steht in:

`BLOCK-8-5-KONTROLLIERT-LIVE-FREIGABE-NACHWEIS.json`

## Paket

Copy/Paste-Datei:

`v4/werkzeuge/block8-5-soak-paket.js`

Builder:

`v4/werkzeuge/block8-5-soak-paket-bauen.mjs`

Das Paket ist absichtlich **nicht** von der bereits verwendeten Live-Browser-Sitzung abhängig. Es bindet:

1. den real bestandenen Schattennachweis,
2. den real bestandenen kontrollierten Live-Nachweis,
3. den immutable Runtime-1.1.5-Candidate,
4. die gemeinsame V4-Test-GUI,
5. eine neue frische aktive Runtime-Sitzung.

## Harte Vorstufenbindung

Das Paket verweigert den Start, wenn der Schattennachweis nicht den strikten Null-Heartbeat-Pfad bestaetigt oder wenn der Live-Nachweis nicht exakt:

- `generationVorher: 0`
- `generationNachPause: 1`
- `generationNachFortsetzen: 2`
- `pauseStatus: ausgefuehrt`
- `fortsetzenStatus: ausgefuehrt`
- `begrenzt: true`
- `spielAktionAusgefuehrt: true`

enthaelt.

Kontrolliert live muss zeitlich nach Schatten liegen.

## Soak-Preflight

Nach dem Einfuegen in einen frischen Adventure-Land-Codekontext:

1. bleibt **3 · Soak starten** gesperrt,
2. wird die immutable Runtime 1.1.5 geladen,
3. wird die Runtime genau einmal aktiv gestartet,
4. muss ein echter Produktionsheartbeat erfolgreich bestaetigt werden,
5. Heartbeat-Sendefehler muessen 0 sein,
6. die frische Laufzeit-Generation muss 0 sein,
7. `automatischeFortsetzung` muss false bleiben,
8. Live-Smoke und Gruppenziel-Vorbereitung muessen unbenutzt sein.

Erst dann wird der Soak-Knopf freigegeben.

## Soak-Lauf

Der Lauf ist fest gebunden an:

- Dauer: **600000 ms = 10 Minuten**
- Sampling: **alle 5000 ms**

Waehren des Laufs wird ausschließlich read-only geprueft:

- Runtime aktiv und nicht gestoppt,
- CM-Empfang installiert,
- Produktionsheartbeat aktiv und nicht pausiert,
- keine Heartbeat-Sendefehler,
- LaufzeitSteuerung weiterhin `laeuft`,
- Generation unveraendert,
- `automatischeFortsetzung: false`,
- ausreichende Sampling-Dichte.

Am Ende muss mindestens ein zusaetzlicher Produktionsheartbeat-Erfolg vorliegen.

Nur bei vollstaendigem PASS setzt der erzeugte Soak-Nachweis gleichzeitig:

- `spielAktionAusgefuehrt: true`
- `telemetrieNachweis: true`
- `recoveryNachweis: true`
- `gesamtauswertungBestanden: true`

## Reale Bedienung

1. **Frischen Adventure-Land-Codekontext** verwenden.
2. Mindestens einer der Vertrauenscharaktere `My_Ranger1` / `My_Ranger2` muss fuer den Produktionsheartbeat erreichbar sein.
3. Gesamten Inhalt von `block8-5-soak-paket.js` einfuegen.
4. Warten auf:

   `Soak-Preflight bestanden: Schatten und kontrolliert live gebunden, Runtime aktiv, echter Produktionsheartbeat bestaetigt.`

5. Nur **3 · Soak starten** anklicken.
6. Exakt bestaetigen mit:

   `BLOCK8-5-SOAK-STARTEN:block8-5-schatten-1789775266269`

7. Die Sitzung fuer die vollen 10 Minuten laufen lassen.
8. Nach PASS **Gesamtbericht kopieren** und als finalen 8.5.9-Nachweis sichern.

## Fail-safe

Das Paket:

- verwendet keine Basisbedienungsanfrage,
- pausiert oder setzt nichts fort,
- stoppt die Runtime nicht versteckt,
- startet Browser/Host nicht neu,
- installiert keinen Live-Smoke,
- bereitet kein Gruppenziel vor,
- ruft keine Adventure-Land-Spielaktionsfunktion direkt auf.

Die aktive Runtime selbst betreibt den bereits vorgesehenen Produktionsheartbeat.

## Source-Lock

Pruefung:

`npm run block8-5-soak-paket:pruefen`

Der Build muss bytegenau mit Bootstrap, GUI und beiden kanonischen Vorstufennachweisen uebereinstimmen.
