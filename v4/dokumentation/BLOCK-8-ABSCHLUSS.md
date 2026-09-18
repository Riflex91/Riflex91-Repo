# Block 8 – Abschlussnachweis

Status: **abgeschlossen am 18. September 2026**.

Block 8 gilt als technisch und formal abgeschlossen, weil die vorgesehenen Offline-, Replay-, Schatten-, begrenzten Live- und abschliessenden Mehrcharakter-Nachweise gemeinsam bestanden wurden. Kein einzelner Test ersetzt die anderen.

## Finaler Produktionsstand

Der abschliessende 10-Minuten-Gruppentest verwendete:

- Produktionsruntime: **1.1.4**
- Produktions-Bootstrap: **1.1.4**
- Produktions-Live-TTL: **8000 ms**
- Produktionsheartbeat: **2000 ms**
- immutable Runtime-Release: `024c121246a3ad1b579e2dc8d32771b284b3f6e1`
- SHA-256: `a5d70d798eb66725ceac6b6ffc80fe4e95751ce9b86e547a427183ee8b24a5a6`
- Adventure-Land-`performance_trick()`: auf beiden Browserlaufzeiten genau einmal erfolgreich aktiviert

Die Produktionsgrenzen fuer TTL, Heartbeat und Recovery wurden fuer den Abschlusslauf nicht aufgeweicht.

## 1. Deterministische Gruppenkoordination und Wiederholung

Nachgewiesen sind:

- Faehigkeiten statt hart verdrahteter Klassenrollen,
- deterministische Aufgabenverteilung,
- gemeinsames Ziel und gemeinsame Safety,
- Ausschluss stale/ausgefallener Teilnehmer,
- Aufgabenentzug und Neuverteilung,
- Reconnect und Wiederaufnahme,
- Produktionskopplung Block 7 -> Block 8,
- Mehrcharakter-Wiederholungen mit reproduzierbaren Ergebnissen.

## 2. Zentrale Aktionssteuerung und Ressourcen

Nachgewiesen sind:

- exklusive Ressource `gruppe`,
- Blockierung konkurrierender Arbeit,
- Safety-Preemption,
- Ablauf und Abbruch alter Gruppenarbeit,
- fail-safe Neustart,
- keine direkte Adventure-Land-Spielaktion aus der Spiellogik,
- Browser-/Produktionsparitaet der relevanten Gruppenpfade.

## 3. Begrenzter one-shot Live-Smoke

Der minimale aktive Pfad `GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN` wurde mit genau einer kontrollierten echten Adventure-Land-Aktion erfolgreich ausgefuehrt.

Dabei wurden insbesondere nachgewiesen:

- explizite Einmal-Freigabe,
- frische Produktions-Safety,
- zentrale AktionsSteuerung,
- gebundene Ausfuehrungsbruecke,
- automatische Wiedersperrung,
- keine zusaetzliche unerwartete Spielaktion,
- keine verbleibende Ressourcensperre nach Abschluss.

## 4. Finaler 10-Minuten-Gruppentest

### My_Ranger1 – Testleiter

Der Abschlusslauf dauerte **600008 ms**.

Ergebnis:

- Status: **PASS**
- Diagnose-Samples: **601**
- Heartbeat-Versuche: **313**
- bestaetigte Heartbeats: **313**
- Heartbeat-Fehler: **0**
- offene Heartbeats am Ende: **0**
- maximale offene Heartbeats: **1**
- maximale Tick-Luecke: **1025 ms**
- Timer-Luecken >2500 ms: **0**
- Heartbeat-Defizit-Luecken: **0**
- ungeplante Stale-Episoden: **0**
- zentrale Gruppenanfragen waehrend des Tests: **0**
- Ressourcensperren waehrend des Tests: **0**
- unerwartete Spielaktionen: **0**

Der geplante Stale von `My_Ranger2` wurde bei **250002 ms** beobachtet. `My_Ranger2` wurde korrekt aus den aktiven Teilnehmern entfernt und `unterstuetzung` wechselte fail-safe zu `My_Ranger1`.

Der Reconnect wurde bei **258008 ms** beobachtet. Danach war `My_Ranger2` wieder aktiv und `unterstuetzung` wurde wieder `My_Ranger2` zugeordnet.

### My_Ranger2 – Stoerteilnehmer

Der Abschlusslauf dauerte **600004 ms**.

Ergebnis:

- Status: **PASS**
- Diagnose-Samples: **601**
- Heartbeat-Versuche: **305**
- bestaetigte Heartbeats: **305**
- Heartbeat-Fehler: **0**
- offene Heartbeats am Ende: **0**
- maximale offene Heartbeats: **1**
- maximale Tick-Luecke: **1027 ms**
- Timer-Luecken >2500 ms: **0**
- Heartbeat-Defizit-Luecken: **0**
- ungeplante Stale-Episoden: **0**
- zentrale Gruppenanfragen waehrend des Tests: **0**
- Ressourcensperren waehrend des Tests: **0**
- unerwartete Spielaktionen: **0**

Die geplante Produktions-Heartbeat-Stoerung begann bei **240015 ms**. Die Runtime pausierte den echten Produktionsheartbeat und setzte ihn bei **256015 ms** wieder fort. Bei **257007 ms** war bereits wieder ein neuer bestaetigter Produktionsheartbeat sichtbar.

Besonders relevant fuer den 24/7-Betrieb: `My_Ranger2` war in **594 von 601** Diagnose-Samples browserseitig `hidden`, ohne eine einzige Timer-Luecke >2500 ms. Damit ist der zuvor beobachtete 60-Sekunden-Hintergrundstillstand im Abschlusslauf mit aktiviertem Adventure-Land-`performance_trick()` nicht mehr aufgetreten.

## 5. Performance-Trick-Nachweis

Auf beiden Charakteren meldete die Produktionsruntime:

- `performanceTrickErforderlich === true`
- `performanceTrickVerfuegbar === true`
- `performanceTrickAufgerufen === true`
- `performanceTrickAufrufe === 1`
- `performanceTrickLetzterFehler === null`

Die Runtime startet im Browser Empfang und Heartbeat nur nach erfolgreichem `performance_trick()`-Preflight.

## Erfuellte Block-8-Abnahmekriterien

- deterministische Gruppenlogik bestanden
- Mehrcharakter-Replay/Wiederholung bestanden
- Stale-/Reconnect- und Aufgabenwechselpfade bestanden
- zentrale AktionsSteuerung und Ressourcensperren bestanden
- minimaler aktiver Gruppenpfad offline, im Schatten und live begrenzt bestanden
- one-shot Live-Smoke bestanden und automatisch wiedergesperrt
- finaler 10-Minuten-Gruppentest auf beiden Rangern bestanden
- keine ungeplanten Stales im Abschlusslauf
- keine Heartbeat-Transportfehler im Abschlusslauf
- keine Timer-Ausduennung im Abschlusslauf
- keine zentrale Gruppenaktion oder Ressourcensperre waehrend des read-only Soak-Tests
- keine unerwartete Adventure-Land-Spielaktion
- Browser-Hintergrundbetrieb auf dem Stoerteilnehmer mit aktiviertem `performance_trick()` stabil

## Abgrenzung

Der bestandene Block-8-Abschlusslauf ersetzt nicht die spaeteren uebergeordneten 24-Stunden-, 72-Stunden- oder 7-Tage-Systemkampagnen der gesamten V4.

## Naechster Entwicklungsblock

Der naechste Entwicklungsblock ist **Block 8.5 – Instrumentierung, Ingame-HUD-Basis und Recovery-Vereinheitlichung**.

Block 9 beginnt erst nach bestandenem Block 8.5.
