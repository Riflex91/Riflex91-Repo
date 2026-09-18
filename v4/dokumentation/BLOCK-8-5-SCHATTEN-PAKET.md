# Block 8.5 – Striktes Schatten-Komplettpaket

Status: **source-locked Schatten-Launcher vorbereitet; realer Adventure-Land-Schattenlauf noch nicht ausgefuehrt.**

## Zweck

Fuer die naechste Freigabestufe `schatten` existiert ein einzelnes Copy/Paste-Paket:

`v4/werkzeuge/block8-5-schatten-paket.js`

Es verbindet:

1. den HTTPS+SHA-256-Bootstrap,
2. die gemeinsame V4-Test-GUI,
3. den Block-8.5.9-Freigabe-Runner 1.1.0,
4. einen zusaetzlichen strikten Schatten-Launcher.

## Exakter Candidate

Das Paket ist fest gebunden an:

- Commit `88185523c81687dc16f9647ca5e7568c5e2c228c`
- Runtime **1.1.5**
- SHA-256 `95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f`
- URL `https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js`
- `aenderungsKennung: git:88185523c81687dc16f9647ca5e7568c5e2c228c`

## Was das Paket automatisch tut

Beim Einfuegen in einen **frischen Adventure-Land-Codekontext**:

1. verweigert es bereits vorhandene V4-Runtime-/Bootstrap-/Runner-Globals,
2. setzt `AIO_V4_RUNTIME_CONFIG.aktivFreigegeben: false`,
3. setzt `modus: 'schatten'`,
4. laedt die immutable Runtime ueber HTTPS,
5. verifiziert SHA-256 ueber den vorhandenen Bootstrap,
6. ruft **nicht** `V4ProduktionsLaufzeit.starte()` auf,
7. haelt den Schatten-Knopf waehrend des Downloads gesperrt,
8. prueft nach dem Laden erneut den strikten Nicht-Sende-Zustand,
9. gibt erst danach **1 · Schattennachweis** frei.

## Strikter Preflight

Vor der Freigabe des Schatten-Knopfs muessen gleichzeitig gelten:

- Runtime-Version 1.1.5,
- exakte Candidate-URL,
- exakter Runtime-SHA-256,
- `aktivFreigegeben: false`,
- `gestoppt: false`,
- `empfangInstalliert: false`,
- `lebensnachweisAutomatikAktiv: false`,
- `lebensnachweisAutomatikPausiert: false`,
- `lebensnachweisSendeVersuche: 0`,
- `lebensnachweisSendeErfolge: 0`,
- `lebensnachweisSendeFehler: 0`,
- `lebensnachweisSendeOffen: 0`,
- `lebensnachweisSendeMaxOffen: 0`,
- kein `performance_trick()`-Aufruf,
- kein Live-Smoke,
- keine Gruppenziel-Vorbereitung,
- LaufzeitSteuerung `laeuft`,
- Generation 0,
- `automatischeFortsetzung: false`.

## Was das Paket niemals tut

Der source-locked Pakettest verbietet insbesondere:

- `.starte(`
- `.sendeLebensnachweis(`
- Heartbeat-Pause/Fortsetzung,
- Gruppen-Ziel-Vorbereitung,
- Live-Smoke-Installation,
- Runtime-`stoppe()`,
- `location.reload()`,
- `window.close()`,
- direkte Aufrufe von `attack()`, `move()`, `smart_move()`, `use_skill()`, `loot()`, `send_cm()`, Kauf/Verkauf/Upgrade/Compound und weiteren Spielaktionen.

## Bedienung fuer den realen Schattennachweis

1. Einen frischen Adventure-Land-Codekontext verwenden.
2. Den gesamten Inhalt von `block8-5-schatten-paket.js` einfuegen.
3. Warten, bis die GUI meldet:

   `Strikter Schatten-Preflight bestanden`

4. Nur **1 · Schattennachweis** ausfuehren.
5. Danach **Gesamtbericht kopieren**.
6. Insbesondere die ausgegebene `schattenUebergabe` aufbewahren. Sie ist fuer den spaeteren separaten Live-Modus erforderlich.

Nicht manuell `V4ProduktionsLaufzeit.starte()` aufrufen.

## Source-Lock

Builder:

`v4/werkzeuge/block8-5-schatten-paket-bauen.mjs`

Pruefung:

`npm run block8-5-schatten-paket:pruefen`

Der Builder erzeugt das Paket deterministisch aus den drei kanonischen Quellen. Jede Abweichung der eingecheckten Paketdatei macht CI rot.

## Aktueller Freigabestand

- Candidate Deployment/HTTPS: **bestanden**
- Offline: **bestanden**
- Schatten: **offen**
- Kontrolliert live: **blockiert**
- Soak: **blockiert**
- Block 9: **gesperrt**
