# Block 8.5 – Kontrollierter Live-Freigabenachweis

Status: **Stufe 3 kontrolliert live fuer den exakten Runtime-1.1.5-Candidate real bestanden. Soak ist die naechste offene Stufe.**

## Kanonischer Nachweis

Maschinenlesbar:

`BLOCK-8-5-KONTROLLIERT-LIVE-FREIGABE-NACHWEIS.json`

Der reale Adventure-Land-Lauf wurde unter:

`block8-5-schatten-1789775266269`

mit Freigabe-Runner **1.1.0** ausgefuehrt.

Der Nutzer hat den vollständigen GUI-Bericht direkt im Chat bereitgestellt. Da kein separates Dateiartefakt vorlag, wird kein erfundener Datei-Hash dokumentiert. Stattdessen bindet der kanonische Nachweis die exakten fachlichen Felder des Berichts.

## Candidate-Bindung

Der Lauf bestaetigt exakt:

- Laufzeitpfad: `block8.5-basisbedienung-runtime`
- Aenderungskennung: `git:88185523c81687dc16f9647ca5e7568c5e2c228c`
- Runtime-Version: **1.1.5**
- Runtime-SHA-256: `95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f`
- immutable Runtime-URL unter Release `88185523c81687dc16f9647ca5e7568c5e2c228c`

## Live-Preflight

Vor der Freigabe des Live-Knopfs wurden real beobachtet:

- `aktivFreigegeben: true`
- `empfangInstalliert: true`
- Produktionsheartbeat aktiv
- Heartbeat-Versuche: **1**
- Heartbeat-Erfolge: **1**
- Heartbeat-Fehler: **0**
- Generation: **0**
- gebundener Schattennachweis: `block8-5-schatten-1789775266269:schatten`

Ein vorheriger Klick ohne Bestaetigung wurde korrekt blockiert.

## Sichere Basisbedienung

Der kontrollierte Live-Test bestaetigt exakt:

- Generation **0 -> 1 -> 2**
- Pause: `ausgefuehrt`
- Fortsetzen: `ausgefuehrt`
- Heartbeat-Erfolge vor Pause: **17**
- Heartbeat-Erfolge nach Pause: **17**
- Heartbeat-Erfolge nach Fortsetzen: **17**

Der Heartbeat blieb damit waehrend des Bedienpfads aktiv; die Laufzeitpause ist korrekt von der Produktionsheartbeat-Automatik getrennt.

Der Freigabe-Nachweis setzt:

- `spielAktionAusgefuehrt: true`
- `begrenzt: true`
- `telemetrieNachweis: false`
- `recoveryNachweis: false`
- `gesamtauswertungBestanden: false`

Das `spielAktionAusgefuehrt: true` ist korrekt, weil die aktive Produktionsruntime ihren Heartbeat ueber Adventure Lands `send_cm(...)` betreibt.

## Formale Freigabeauswertung

Zusammen mit Offline und Schatten ergibt die reale Auswertung:

- `offline -> bestanden`
- `schatten -> bestanden`
- `kontrolliert_live -> bestanden`
- `soak -> offen`
- `naechsteStufe: soak`
- `freigabeVollstaendig: false`
- `block9Freigegeben: false`

Block 9 bleibt gesperrt.

## Naechster Schritt

Soak wird in einer **separaten frischen Adventure-Land-Sitzung** ausgefuehrt.

Das Soak-Paket importiert sowohl den kanonischen Schatten- als auch den kanonischen Live-Nachweis. Dadurch haengt die letzte Freigabestufe nicht davon ab, dass die urspruengliche Live-Browser-Sitzung noch existiert.
