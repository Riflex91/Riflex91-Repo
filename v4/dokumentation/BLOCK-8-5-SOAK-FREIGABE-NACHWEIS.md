# Block 8.5 – Soak-Freigabenachweis

Status: **Stufe 4 Soak fuer den exakten Runtime-1.1.5-Candidate real bestanden. Block 8.5 ist damit vollstaendig freigegeben.**

## Kanonischer Nachweis

Maschinenlesbar:

`BLOCK-8-5-SOAK-FREIGABE-NACHWEIS.json`

Der reale Adventure-Land-Lauf wurde unter der Freigabekette

`block8-5-schatten-1789775266269`

mit dem separaten source-locked 10-Minuten-Soak-Paket ausgefuehrt.

Der Nutzer hat den vollstaendigen GUI-Bericht direkt im Chat bereitgestellt. Es lag kein separates Dateiartefakt vor. Deshalb wird **kein erfundener Rohdatei-Hash** und keine erfundene Rohdateigroesse dokumentiert; gebunden werden die exakten fachlichen Berichtswerte.

## Candidate-Bindung

- Laufzeitpfad: `block8.5-basisbedienung-runtime`
- Aenderungskennung: `git:88185523c81687dc16f9647ca5e7568c5e2c228c`
- Runtime-Version: **1.1.5**
- Runtime-SHA-256: `95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f`
- immutable Runtime-URL: Release `88185523c81687dc16f9647ca5e7568c5e2c228c`

Der Soak bindet ausserdem die bereits kanonischen Vorstufen:

- `block8-5-schatten-1789775266269:schatten`
- `block8-5-schatten-1789775266269:kontrolliert_live`

## Preflight

Der Launcher bestaetigte vor Soak:

- Generation: **0**
- Heartbeat-Versuche: **1**
- Heartbeat-Erfolge: **1**
- Heartbeat-Fehler: **0**
- Runtime-Version und SHA exakt
- Schatten- und Live-Nachweis exakt gebunden

Ein Klick ohne Bestaetigung wurde korrekt blockiert.

## 10-Minuten-Lauf

Realer Lauf:

- Start: `2026-09-19T07:08:45.312Z`
- Ende: `2026-09-19T07:18:45.319Z`
- konfigurierte Dauer: **600000 ms**
- reale Differenz Start/Ende: **600007 ms**
- Sampling: **5000 ms**
- Samples: **120**
- Mindest-Samples: **118**
- Fehler: **0**

Runtime-/Recovery-Grenzen:

- Generation: **0 -> 0**
- Heartbeat-Erfolge: **4 -> 304**
- Heartbeat-Fehler: **0 -> 0**

Damit blieb der Laufzeitsteuerungszustand stabil, waehrend der Produktionsheartbeat real fortschritt.

## Soak-Nachweis

Der finale Nachweis setzt korrekt:

- `spielAktionAusgefuehrt: true`
- `begrenzt: false`
- `telemetrieNachweis: true`
- `recoveryNachweis: true`
- `gesamtauswertungBestanden: true`

`spielAktionAusgefuehrt: true` bleibt korrekt, weil die aktive Produktionsruntime ihren Heartbeat ueber Adventure Lands `send_cm(...)` betreibt. Das Soak-Paket selbst besitzt keine direkte Adventure-Land-Spielaktionsautoritaet.

## Vollstaendige 8.5.9-Auswertung

Mit Offline, Schatten, kontrolliert live und Soak ergibt die echte Auswertung:

- `offline -> bestanden`
- `schatten -> bestanden`
- `kontrolliert_live -> bestanden`
- `soak -> bestanden`
- `naechsteStufe: null`
- `freigabeVollstaendig: true`
- `block9Freigegeben: true`
- `spielAutoritaet: false`
- `neustartAutoritaet: false`

Damit ist das **historische Block-8.5-Gate vollstaendig bestanden**.

## Roadmap-Grenze

Das Feld `block9Freigegeben: true` bedeutet ausschliesslich, dass Block 8.5 keine offene Freigabestufe mehr vor Block 9 besitzt.

Der inzwischen aktualisierte V4-Fahrplan schiebt jedoch **Block 8.6 – Live Skill Catalog und Capability Truth** verbindlich vor Block 9.

Deshalb gilt gleichzeitig:

- Block 8.5: **abgeschlossen**
- naechster Entwicklungsblock: **8.6**
- Block-9-Start nach aktuellem Fahrplan: **noch nicht freigegeben**
- Block 9 beginnt erst nach eigener vollstaendiger Block-8.6-Freigabe.
