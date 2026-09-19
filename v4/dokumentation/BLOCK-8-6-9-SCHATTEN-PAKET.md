# Block 8.6.9 – Striktes Schatten-Komplettpaket

Status: **source-locked Paket fuer den realen Adventure-Land-Schattenlauf vorbereitet; realer Schattennachweis noch offen.**

## Exakter Candidate

Das Paket ist fest gebunden an:

- Git-SHA `ca0dfee7685563c8b6003469300c8fd08777b053`
- Candidate-Version `1.0.0`
- Runtime-Version `1.1.5`
- 51 Module
- 396471 Bytes
- SHA-256 `b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5`
- URL `https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.js`

## Paket

Copy/Paste-Datei:

`v4/werkzeuge/block8-6-schatten-paket.js`

Builder:

`v4/werkzeuge/block8-6-schatten-paket-bauen.mjs`

Pruefung:

`npm run block8-6-schatten-paket:pruefen`

## Sicherheitszustand

Vor dem Laden werden gesetzt:

- `AIO_V4_RUNTIME_CONFIG.aktivFreigegeben=false`
- `AIO_V4_CAPABILITY_CONFIG.aktivFreigegeben=false`
- `AIO_V4_BLOCK86_FREIGABE_CONFIG.modus='schatten'`

Der Candidate wird nur nach HTTPS-Download, exakter Bytegroesse, Candidate-Marker und SHA-256-Pruefung evaluiert.

Danach verlangt der strikte Preflight gleichzeitig:

- Runtime 1.1.5
- Capability-Laufzeit 1.0.0
- Candidate 1.0.0
- Runner 1.0.0
- Candidate ohne Spiel- oder Restart-Autoritaet
- Runtime nicht aktiv freigegeben
- kein CM-Empfang
- kein Produktionsheartbeat
- exakt 0 Heartbeat-Versuche/-Erfolge/-Fehler
- Capability-Schicht nicht aktiv freigegeben
- keine Remote-Beobachtung
- kein Capability-Empfang
- exakt 0 Capability-Sendeversuche/-Erfolge/-Fehler

Erst danach wird der einzige Paketknopf **1 · Schattennachweis** aktiviert.

## Was der Schattenlauf tut

Der Runner ruft im Schatten nur `V4CapabilityLaufzeit.aktualisiere()` auf.

PASS verlangt:

- produktionsbereiten Skill-Katalog-Audit
- lokalen Capability-Snapshot
- keine Spielautoritaet
- 0 Produktionsheartbeat-Sendeversuche
- 0 Capability-Sendeversuche
- bestandene `schattenUebergabe` fuer exakt `git:ca0dfee7685563c8b6003469300c8fd08777b053`

## Bedienung

1. In Adventure Land einen **frischen Codekontext** verwenden.
2. Den gesamten Inhalt von `block8-6-schatten-paket.js` einfuegen und starten.
3. Warten, bis die GUI meldet: `Strikter Block-8.6-Schatten-Preflight bestanden`.
4. Nur **1 · Schattennachweis** anklicken.
5. Bei PASS **Gesamtbericht kopieren**.
6. Den kompletten Bericht an ChatGPT senden.

Nicht manuell `V4ProduktionsLaufzeit.starte()`, Remote-Beobachtung oder Capability-Senden ausloesen.

## Gate

Dieses Paket allein setzt noch keinen Release-Gate-Status um.

Bis ein realer PASS-Bericht kanonisch gebunden ist, bleibt:

- `adventureLandShadowVerified=false`
- `adventureLandControlledLiveVerified=false`
- `adventureLandSoakVerified=false`
- `block86Completed=false`
- `block9Freigegeben=false`
