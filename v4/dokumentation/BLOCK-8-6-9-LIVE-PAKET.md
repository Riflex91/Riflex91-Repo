# Block 8.6.9 – Kontrolliertes Live-Komplettpaket

Status: **source-locked Paket fuer den realen kontrollierten Adventure-Land-Live-Lauf vorbereitet; Live-Nachweis noch offen.**

## Voraussetzung

Bereits kanonisch bestanden:

- Offline/Replay
- immutable Deployment
- oeffentlicher HTTPS-Rueckweg
- realer Schattenlauf

Kanonischer Schattennachweis:

`BLOCK-8-6-9-SCHATTEN-FREIGABE-NACHWEIS.json`

Laufkennung:

`block8-6-schatten-1789822653521`

## Exakter Candidate

- Git-SHA `ca0dfee7685563c8b6003469300c8fd08777b053`
- Candidate-Version `1.0.0`
- Runtime-Version `1.1.5`
- 396471 Bytes
- SHA-256 `b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5`
- URL `https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.js`

## Paket

Copy/Paste-Datei:

`v4/werkzeuge/block8-6-live-paket.js`

Builder:

`v4/werkzeuge/block8-6-live-paket-bauen.mjs`

Pruefung:

`npm run block8-6-live-paket:pruefen`

## Begrenzter Vertrauensraum

Das Paket ist fuer den bewaehrten Zwei-Ranger-Pfad fest auf folgende Vertrauensnamen begrenzt:

- `My_Ranger1`
- `My_Ranger2`

Es muss auf genau einem dieser beiden Charaktere laufen. Der lokale Charakter wird automatisch entfernt; exakt der andere Ranger bleibt als einziges Capability-One-Shot-Ziel.

## Start-Preflight

Das Paket:

1. verlangt einen frischen Codekontext,
2. setzt Runtime und Capability-Laufzeit explizit auf aktiv freigegeben,
3. bindet die vollstaendige reale Schattenuebergabe,
4. laedt exakt den immutable Candidate,
5. verifiziert Bytegroesse, Marker und SHA-256,
6. installiert Candidate und Runner,
7. verlangt vor Start 0 Heartbeat- und 0 Capability-Sendeversuche,
8. startet die Runtime exakt einmal,
9. wartet maximal 10 Sekunden auf mindestens einen bestaetigten fehlerfreien Produktionsheartbeat,
10. verlangt produktionsbereiten Capability-Audit und lokalen Snapshot,
11. verlangt weiterhin 0 Capability-Sendeversuche,
12. aktiviert erst dann **2 · Kontrolliert live**.

## Explizite Bestaetigung

Vor dem einzigen Live-One-Shot muss exakt eingegeben werden:

`BLOCK8-6-KONTROLLIERT-LIVE:block8-6-schatten-1789822653521`

Ohne exakten Text fuehrt die GUI die Aktion nicht aus.

## Was der Klick tut

Der bestehende Block-8.6-Runner:

- installiert die passive Remote-Beobachtung auf dem vorhandenen Block-8-CM-Pfad,
- installiert den Capability-Empfang,
- aktualisiert den lokalen Snapshot,
- sendet genau einen Capability-Snapshot an den anderen vertrauten Ranger,
- verlangt genau 1 Sendeversuch,
- verlangt genau 1 bestaetigten Sendeerfolg,
- verlangt 0 Capability-Sendefehler,
- erzeugt bei PASS die `liveUebergabe` fuer denselben Candidate/Lauf.

Der Launcher fuehrt selbst keine Adventure-Land-Spielaktionsfunktion direkt aus.

## Bedienung

1. **Beide Ranger muessen online sein.**
2. Auf genau einem der beiden Ranger einen **frischen Codekontext** verwenden.
3. Den gesamten Inhalt von `block8-6-live-paket.js` einfuegen und starten.
4. Warten auf:
   `Live-Preflight bestanden: echter Produktionsheartbeat bestaetigt...`
5. Nur **2 · Kontrolliert live** anklicken.
6. Den angezeigten Bestaetigungstext exakt eingeben:
   `BLOCK8-6-KONTROLLIERT-LIVE:block8-6-schatten-1789822653521`
7. Noch einmal **2 · Kontrolliert live** anklicken.
8. Bei PASS **Gesamtbericht kopieren**.
9. Den kompletten Bericht an ChatGPT senden.

## Gate

Das Paket selbst setzt noch keinen Live-Gate-Status.

Bis der reale PASS-Bericht kanonisch gebunden wurde, bleibt:

- `adventureLandControlledLiveVerified=false`
- `adventureLandSoakVerified=false`
- `block86Completed=false`
- `block9Freigegeben=false`

Soak bleibt in diesem Paket technisch nicht freigeschaltet.
