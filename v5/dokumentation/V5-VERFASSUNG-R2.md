# V5 – Verfassung R2

**Status:** R2 RATIFIZIERT  
**Stand:** 2026-09-19  
**Runtime-Gate:** GESCHLOSSEN

## 1. Zweck

Diese Verfassung bindet alle spaeteren V5-Phasen. Sie ratifiziert Architektur, Authority, Layer, Recovery, Persistenz, Sprache und Migrationsregeln. Sie ist **keine Runtime-Freigabe**.

## 2. Unveraenderbare Pipeline

```text
Wissen / Definitionen
→ beobachtete Evidence
→ abgeglichene Weltwahrheit
→ Bedarf / Ziel
→ Planung
→ Arbeitsauftrag
→ globaler Scheduler
→ Authority + Ressourcen + Action-Channel + Budget Admission
→ Transaktionsintent / Journal
→ Ausfuehrungsadapter
→ Serverergebnis
→ Postcondition-Beobachtung
→ COMMIT | UNKNOWN | Abgleich | sicher fehlgeschlagen
```

Definition ≠ Beobachtung. Beobachtung ≠ Authority. Planung ≠ Execution. Serverantwort ≠ Commit. Persistenz ≠ Authority.

## 3. Authority und Ownership

**Account Coordinator** besitzt accountweite Bank-, Merchant-, Produktions-, Budget-, Lock-/Lease- und Character-Koordination.

**Character Agents** besitzen lokale Beobachtung, Bewegung, Kampf, Skills, lokales Inventory und lokale Action-Ausfuehrung.

Raw Adventure-Land-Mutationen entstehen ausschliesslich in Ausfuehrungsadaptern nach vollstaendiger Admission.

Host, Dashboard, Windows Bridge, Wissenswaechter und Learning besitzen keine Gameplay-Authority.

## 4. Layer-Regel

Der Layergraph ist azyklisch. Fach-/Planungsschichten duerfen keine Raw Writes ausloesen. Ausfuehrungsadapter enthalten keine Domaenenpolicy. Host/Bridge besitzen keine Gameplay-Policy. Knowledge kann Planung informieren, aber keine ExecutionAuthority vergeben.

Der maschinenlesbare Vertrag ist `v5/architektur/verfassung.json`.

## 5. Transaktion und UNKNOWN

Vor wertveraendernder Mutation:

`INTENT → durable Persistenz → Preconditions → Claims/Fencing → Send → Server Result → Postcondition → Commit`

Nach moeglichem Send und unklarem Ergebnis:

`UNKNOWN → Reconnect/Reobserve → Abgleich → Commit | Abort | Bediener`

Same-Intent-Blind-Retry ist verboten.

## 6. Ressourcen und Scheduler

Action-Channels sind Ressourcen. Lange/shared Leases besitzen Epoche/Fencing. Lock-Reihenfolge ist deterministisch. Preemption ist nur an sicheren Unterbrechungspunkten erlaubt. Das character-globale Socket-Budget wird von allen Channels eines Characters geteilt.

## 7. Determinismus und Nachrichten

Fachlich relevante Uhr, Zufall, IDs und Sequenzen sind injizierbar und replay-faehig.

Langlebige/asynchrone Nachrichten besitzen Protokollversion, Nachrichten-ID, TTL und Dedupe-Semantik. Stale Nachrichten koennen keine neue Authority erteilen.

## 8. Wissen

Kanonischer Einstieg ist `v5/wissensbasis/manifest.json`.

Reihenfolge:

`Manifest → laufende Datenbank → strukturierte Wissensbasis → Evidence`

Spaetere Runtime liest persistiertes Wissen nur ueber den read-only `WissensZugriffPort` mit gepinntem WissensSnapshot. Kandidaten, Roh-Snapshots und LIVE_VERIFIZIERT besitzen allein keine ExecutionAuthority.

## 9. Persistenz und SSD

`D:\AdventureLand-V5` bleibt das Ziel-Datenfundament.

- HOT = RAM;
- WARM = SSD;
- COLD = SSD verdichtet;
- mindestens 15 % Standardreserve;
- nichtkritisches SSD-I/O blockiert keinen Gameplay-Hot-Path;
- kritische Intents sind vor Mutation durable;
- falsches Volume / kritischer Persistenzfehler => fail-closed;
- kein stiller Fallback auf das Systemlaufwerk.

## 10. Sprache

Neue V5-Domaenensprache und alle von uns kontrollierten sichtbaren Texte sind deutsch. Externe technische Namen bleiben nur an notwendigen Systemgrenzen und werden gekapselt.

Einzige fachliche Anzeigeausnahme: Monster duerfen ihren originalen Adventure-Land-Namen behalten, solange das Spiel selbst keine offizielle deutsche Bezeichnung anbietet.

## 11. Mehrfach-Verriegelung

Eine riskante Mutation benoetigt mehrere unabhaengige Schichten:

Capability Default-Deny, Single Owner, Live Preconditions, Ressourcen/Fencing, Action-Channel, Budget, Operator Policy, durable Intent und Postcondition/Reconciliation.

Kein einzelner einfacher Fachfehler darf allein bis zum Raw Write reichen.

## 12. V3/V4-Migration

V3/V4 sind Wissens-, Fehler-, Test- und Verhaltensquellen. Die 47 historischen Runtime-Capabilities sind in `v5/migration/v3-v4-zu-v5.json` einzeln klassifiziert. Die 30 V3-Fehlerklassen sind in `v5/migration/v3-fehlerabdeckung.json` strukturell abgedeckt.

Historische Runtime-Imports nach V5 sind verboten.

## 13. ADR-Regel

Architektur-, Authority-, Persistenz-, Recovery-, Layer- oder Safety-Aenderungen brauchen eine ADR mit Kontext, Entscheidung, Alternativen, Konsequenzen, betroffenen Invarianten, Migration und Rollback. Alte ADRs werden nicht still ueberschrieben.

## 14. R2 ist keine Runtime-Freigabe

Nach R2 folgt R3. Gameplay-Runtime-Code bleibt gesperrt, bis Roadmap und `laufzeit-bereitschaft.json` ihn ausdruecklich freigeben.
