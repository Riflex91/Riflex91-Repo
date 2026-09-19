# Block 8.6.9 – Separates 10-Minuten-Soak-Paket

Status: **source-locked Paket fuer die letzte reale Block-8.6-Freigabestufe vorbereitet; realer Soak noch offen.**

## Bereits bestandene Vorstufen

- Offline/Replay: **bestanden**
- immutable Deployment/HTTPS: **bestanden**
- realer Schatten: **bestanden**
- kontrolliert live: **bidirektional bestanden**
- Soak: **offen**

## Exakte Bindung

- Candidate `ca0dfee7685563c8b6003469300c8fd08777b053`
- 396471 Bytes
- SHA-256 `b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5`
- Laufkennung `block8-6-schatten-1789822653521`
- Live-Report My_Ranger1: `fba08a78942b6d2de9da482bf44df6aac6f8c91349fa13484423554195a886a7`
- Live-Report My_Ranger2: `becc261eef26a674fe460befcd77dbeca8e9d3ed0fe1901ee026b216e979d4e2`
- Recovery-Replay: gebunden

## Paket

Copy/Paste-Datei:

`v4/werkzeuge/block8-6-soak-paket.js`

Builder:

`v4/werkzeuge/block8-6-soak-paket-bauen.mjs`

Pruefung:

`npm run block8-6-soak-paket:pruefen`

## Warum beide Ranger parallel laufen sollen

Die unmittelbaren Controlled-Live-Berichte haben die bestaetigten Capability-One-Shots belegt, aber beim Abschluss noch keine langfristig beobachteten Remote-Heartbeats ausgewiesen.

Deshalb ist dieses Soak-Paket strenger als der Minimalrunner:

- `My_Ranger1` und `My_Ranger2` sollen das Paket **gleichzeitig** ausfuehren,
- beide Runtime-Instanzen senden ihren bestehenden Produktionsheartbeat,
- der Soak installiert den bestehenden passiven Capability-/Liveness-Beobachtungspfad,
- PASS verlangt pro lokaler Sitzung mindestens **einen neu beobachteten akzeptierten Remote-Heartbeat**.

Es werden dabei keine zusaetzlichen Capability-Snapshots gesendet.

## Laufparameter

- Dauer: **600000 ms = 10 Minuten**
- Sampling: **5000 ms**
- erwartete Mindestdichte des Runners: etwa **118 Samples**

Waehren des Laufs verlangt der Runner:

- produktionsbereiten Skill-Katalog-Audit,
- unveraenderten Katalog-Fingerprint,
- lokalen Capability-Snapshot,
- unveraenderte Capability-Sendefehlerzahl,
- unveraenderte Produktionsheartbeat-Sendefehlerzahl,
- mindestens einen neuen Produktionsheartbeat-Erfolg.

Der Launcher verlangt zusaetzlich:

- weiterhin exakt 0 Capability-Sendeversuche,
- 0 Capability-Sendefehler,
- installierten Remote-/Capability-Empfangspfad,
- mindestens einen neu beobachteten Remote-Heartbeat.

## Bedienung

1. **Beide Ranger online lassen.**
2. Auf **My_Ranger1 und My_Ranger2 jeweils einen frischen Codekontext** oeffnen.
3. Auf beiden denselben kompletten Inhalt von `block8-6-soak-paket.js` einfuegen und starten.
4. Auf beiden auf den Status warten:
   `Soak-Preflight bestanden... Auf BEIDEN Rangern jetzt „3 · Soak starten“...`
5. Auf beiden **3 · Soak starten** anklicken.
6. Auf beiden exakt bestaetigen mit:

   `BLOCK8-6-SOAK-STARTEN:block8-6-schatten-1789822653521`

7. Beide Sitzungen die vollen **10 Minuten ungestoert** laufen lassen.
8. Nichts pausieren, neu laden oder manuell an Runtime/Capability aendern.
9. Nach PASS auf **beiden** Rangern **Gesamtbericht kopieren**.
10. Beide kompletten Berichte an ChatGPT senden.

## PASS

PASS setzt beim Runner:

- `telemetrieNachweis=true`
- `recoveryNachweis=true`
- `gesamtauswertungBestanden=true`

Das Paket verlangt darueber hinaus `remoteLivenessNeu >= 1`.

Erst nach realen PASS-Berichten wird `adventureLandSoakVerified=true` kanonisiert. Block 8.6 und Block 9 bleiben bis dahin gesperrt.
