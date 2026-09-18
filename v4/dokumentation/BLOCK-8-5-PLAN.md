# Block 8.5 – Implementierungsplan

Status: **gestartet**.

## Ziel

Block 8.5 macht die bereits vorhandenen V4-Faehigkeiten einheitlich erklaerbar, beobachtbar, sicher bedienbar und recovery-faehig, bevor mit Haendler-, Bank- und Wirtschaftslogik begonnen wird.

Die fachliche Grundlage bleibt unveraendert. Block 8.5 fuehrt keine neue Kampf-, Gruppen-, Bank- oder Handelsstrategie ein.

## Reihenfolge

### Schritt 8.5.1 – EntscheidungsDatensatz v1 — **IMPLEMENTIERT**

Fuer wichtige Gruppenentscheidungen ist ein versionierter Datensatz eingefuehrt mit:

- stabiler Entscheidungskennung,
- fachlicher Eingabe bzw. Fingerabdruck,
- erkannter Situation,
- betrachteten/zulaessigen Moeglichkeiten,
- gewaehlter Entscheidung,
- Begruendung,
- erwartetem Ergebnis,
- zugeordneten AktionsAnfragen,
- spaeterem tatsaechlichen Ergebnis.

Zeitstempel und reine Laufzeitkennungen duerfen den fachlichen Wiederholungsvergleich nicht verfaelschen.

Umgesetzt sind der allgemeine `EntscheidungsDatensatz`-Vertrag, die read-only Gruppen-Erzeugung, getrennte Eingabe-/Entscheidungs-Fingerabdruecke sowie Regressionstests fuer Zeitverschiebung, Eingabereihenfolge, Freshness und Safety. Aktions-/Ergebnis-Korrelation bleibt bewusst Schritt 8.5.2.

### Schritt 8.5.2 – Entscheidung -> Aktion -> Ergebnis — **IMPLEMENTIERT**

Die vorhandene `AktionsSteuerung` bleibt Autoritaet.

Block 8.5 ergaenzt nur Korrelation:

`EntscheidungsDatensatz -> AktionsAnfrage -> AktionsLaufZustand/AktionsErgebnis`

Keine Telemetriekomponente darf selbst eine Aktion einreichen oder ausfuehren.

Umgesetzt sind die fail-safe Verknuepfung mit Gruppen-AktionsAnfragen sowie die read-only Auswertung von `AktionsLaufZustand` und `AktionsErgebnis`. Fehlende oder fremde Ergebnisse bleiben explizit offen; die fachlichen Fingerabdruecke werden durch Laufzeitkennungen nicht veraendert.

### Schritt 8.5.3 – RuntimeGesundheit und RecoveryZustand — **IMPLEMENTIERT**

Ein gemeinsamer read-only Zustand fasst mindestens zusammen:

- Runtime-Freshness,
- letzter fachlicher Fortschritt,
- Gruppen-Liveness,
- Safety,
- offene/abgebrochene Arbeit,
- Recovery-Stufe,
- Nutzer-Handlungsbedarf.

Recovery-Eskalation:

`normal -> beobachten -> sicher_pausiert -> neustart_empfohlen -> blockiert`

Ein Prozess-/Host-Neustart wird nicht von der Adventure-Land-Laufzeit selbst ausgefuehrt.

Umgesetzt sind ein versionierter Gesundheitsvertrag, die Recovery-Stufen `normal -> beobachten -> sicher_pausiert -> neustart_empfohlen -> blockiert`, getrennte Freshness-/Fortschrittsbewertung, Gruppen-Liveness und Safety. `hostNeustartEmpfohlen` bleibt eine read-only Empfehlung; `automatischerNeustart` ist fest `false`.

### Schritt 8.5.4 – Recovery-Checkpoint v1 — **IMPLEMENTIERT**

Ein kleiner versionierter und pruefbarer Checkpoint speichert nur die Informationen, die fuer einen eindeutigen Wiederanlauf benoetigt werden.

Nicht gespeichert wird fluechtige Autoritaet, die nach Neustart ungeprueft weiterlaufen koennte.

Umgesetzt sind SHA-256-Integritaet ueber kanonische Nutzlast, A/B-Slots mit Fallback, monotone Sequenzen, Byte-Limit und strukturierte Speicherfehler. Jeder Checkpoint erzwingt `wiederaufnahmeErlaubt: false`, `abgleichErforderlich: true` und `aktionsAutoritaet: false`; offene Arbeit wird nur als Kennungsliste gespeichert.

### Schritt 8.5.5 – gemeinsame StatusSchnittstelle — **IMPLEMENTIERT**

Eine read-only Schnittstelle verbindet V4-Kern mit:

- Ingame-HUD,
- spaeterem Web-Command-Center,
- spaeterem Host-Supervisor.

Sie enthaelt keine Bot-Fachlogik und keine generische Spiel-/Host-Autoritaet.

Umgesetzt ist eine unveraenderliche gemeinsame Sicht fuer Charakter, RuntimeGesundheit, Gruppe, Entscheidung, Aktionsphasen, Recovery-Checkpoint und letzte BotMeldung. Die Schnittstelle setzt fest `nurLesen: true`, `spielAutoritaet: false`, `bedienAutoritaet: false` und `neustartAutoritaet: false`; bekannt/fehlend/unbekannt bleibt erhalten.

### Schritt 8.5.6 – schlankes Ingame-HUD — **IMPLEMENTIERT**

Anzeigen:

- Charakterstatus,
- Gruppenstatus,
- aktuelle Entscheidung,
- aktuelle Aktion/Phase,
- Safety,
- Recovery-Stufe,
- Warnungen,
- Heartbeat/Freshness,
- letzte relevante BotMeldung.

HUD-Ausfall oder Schliessen darf die Bot-Laufzeit nicht beeinflussen.

Umgesetzt ist `V4IngameHud` als rein beobachtender Browser-Adapter auf der gemeinsamen `StatusSchnittstelle`. Das HUD akzeptiert nur Status mit `nurLesen: true` und explizit fehlender Spiel-, Bedien- und Neustartautoritaet. Es besitzt in 8.5.6 nur lokale Anzeigeaktionen zum Minimieren und Schliessen; sein eigener Aktualisierungstimer ist vom Bot-/Produktionsheartbeat getrennt.

### Schritt 8.5.7 – sichere Basisbedienung

Erste veraendernde HUD-Funktionen bleiben bewusst klein:

- Pause anfordern,
- Fortsetzen anfordern,
- Diagnose aktualisieren.

Jede veraendernde Aktion:

`HUD -> BedienAnfrage -> BedienSicherung -> zentrale Aktions-/Laufzeitsteuerung`

Kein direkter Adventure-Land-Aufruf im HUD.

### Schritt 8.5.8 – Recovery-Abnahme

Mindestens:

- Reconnect,
- stale Daten,
- Browser-Hintergrundbetrieb,
- Runtime-Neustart,
- HUD-Schliessen/Fehler,
- unterbrochene Aktion,
- offener Checkpoint,
- doppelte Bedienanfrage,
- ungueltiger/veralteter Status,
- Telemetrie-/Speicherfehler.

### Schritt 8.5.9 – Freigabestufen

Fuer neue oder wesentlich geaenderte Laufzeitpfade:

1. deterministischer Offline-Test/Wiederholung,
2. Schattenbetrieb,
3. begrenzter kontrollierter Live-Test,
4. Soak-Test mit Telemetrie und Recovery-Nachweis.

Erst danach darf Block 9 beginnen.

## Nicht Teil von Block 8.5

- neue Merchant-/Bank-Fachlogik
- Kaufen/Verkaufen/Upgrade/Kombinieren
- lernende Strategieaenderung
- vollstaendiges Web-Command-Center
- automatische Host-Neustarts
- automatische Updates/Rollbacks

## Referenz

Der formale V3->V4-Wissenstransfer steht in:

`BLOCK-8-5-WISSENSTRANSFER-V3-V4.md`
