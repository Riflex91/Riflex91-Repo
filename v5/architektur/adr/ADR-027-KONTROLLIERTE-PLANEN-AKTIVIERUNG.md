# ADR-027 – Kontrollierte Aktivierung produktiver PLANEN-Capabilities

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

ADR-026 registriert die produktiven Merchant-Capabilities ausschliesslich als
`PLANEN`, `VERFUEGBAR` und `standardAktiv=false`. Der normale Runtime-Start
bleibt dadurch default-deny und aktiviert weder das Provider-Modul noch eine
Capability.

Fuer den realen Betrieb wird ein expliziter Aktivierungspfad benoetigt. Dieser
Pfad darf die bestehende deny-only Bediener-Richtlinie nicht in eine
Allow-Policy umdeuten und darf insbesondere keine Gameplay-, Raw-Write- oder
Action-Authority erzeugen.

Die Aktivierung ist eine neue Authority-Grenze, weil ein bisher nur
registrierter Planungsanbieter gezielt in den aktiven Runtime-Zustand
ueberfuehrt wird.

## Entscheidung

1. Die Produktionsruntime erhaelt einen expliziten
   `aktivierePlanenFaehigkeit(...)`-Pfad.
2. Der Pfad ist ausschliesslich fuer Capabilities mit `modus=PLANEN`
   zulaessig. `MUTIEREN` wird fail-closed blockiert.
3. Eine Aktivierung setzt gleichzeitig voraus:
   - die Runtime laeuft im Zustand `LAEUFT`;
   - die Laufsteuerung erlaubt neue Arbeit;
   - eine explizit injizierte deny-only `BedienerRichtlinienDienst`-Instanz
     ist vorhanden;
   - NOTHALT ist nicht aktiv;
   - die Capability ist nicht durch die Deny-Policy gesperrt;
   - Capability-ID, Provider-Modul-ID und Provider-Version stimmen exakt mit
     der registrierten Providerbindung ueberein;
   - das Provider-Modul deklariert die Capability;
   - das Provider-Modul ist `GESUND`;
   - die Capability ist `VERFUEGBAR` und bleibt
     `standardAktiv=false`;
   - der Headless Supervisor ist mit aktueller Health-Evidence und vorhandenen
     Operations-Metriken `bereit=true`.
4. Ohne injizierte Bediener-Richtlinie bleibt die Aktivierung gesperrt.
5. Der normale Runtime-Start aktiviert weiterhin nichts implizit.
6. Die oeffentliche Kernansicht der Produktionsruntime stellt fuer Modul- und
   Capability-Register keine aktivierende Methode mehr bereit. Statusaenderung
   und Deaktivierung bleiben zulaessig, weil sie keine Authority erhoehen.
7. Erfolgreiche Aktivierungen erzeugen einen begrenzten, unveraenderlichen
   Runtime-Audit-Eintrag mit Aktivierungs-ID, Policy-ID, Providerbindung,
   Health-Evidence-IDs und Zeitpunkt.
8. Ein kontrollierter Runtime-Stop deaktiviert aktive Capabilities und Module
   der Komposition.
9. Gameplay-, Raw-Write- und Action-Authority bleiben auf diesem Pfad immer
   `false`.

## Alternativen

- Direkte Nutzung von `FaehigkeitsRegister.aktiviereNichtMutierend` aus der
  Produktionskomposition: verworfen, weil Policy-, Health- und
  Provider-Gates umgangen werden koennten.
- Bediener-Richtlinie um einen Allow-Befehl erweitern: verworfen, weil die
  bestehende Operator-Grenze bewusst deny-only ist.
- PLANEN automatisch beim Runtime-Start aktivieren: verworfen, weil dies
  Default-Deny aufheben wuerde.
- Bereits jetzt eine `MUTIEREN`-Capability registrieren oder aktivieren:
  verworfen; dafuer fehlen weiterhin der separat ratifizierte Owner-/Action-/
  Admission-/Recovery-/Settlement-Pfad und Controlled-Live-Evidence.

## Konsequenzen

- Produktive PLANEN-Capabilities koennen erstmals explizit und kontrolliert
  aktiviert werden.
- Die Aktivierung ist an aktuelle Betriebsbereitschaft und Deny-Policy
  gebunden.
- Ein fehlender Host-/Policy-Pfad fuehrt nicht zu einer impliziten
  Aktivierung, sondern zu einem fail-closed Ergebnis.
- Der In-Runtime-Audit ist ein aktueller Betriebsnachweis, ersetzt aber keine
  spaetere durable Host-Persistenz. Diese bleibt Teil des separaten
  Host-/Bootstrap-Schritts.
- Es entsteht keine neue Gameplay-Mutation und kein Adventure-Land-Livetest
  ist fuer diesen Schritt erforderlich.

## Invarianten

- `standardAktiv=false` bleibt unveraendert.
- `MUTIEREN` ist ueber den PLANEN-Aktivierungspfad unmoeglich.
- NOTHALT und Capability-Sperre gewinnen immer gegen Aktivierung.
- Fehlende oder stale Health-Evidence blockiert ueber den Supervisor.
- Fehlende Operations-Metriken blockieren ueber den Supervisor.
- Falsche Provider-ID oder Provider-Version blockiert.
- Ungesundes Provider-Modul blockiert.
- Runtime-Start allein aktiviert nichts.
- Runtime-Stop reduziert Authority und deaktiviert aktive
  Kompositionsbestandteile.
- `gameplayAutoritaet=false`, `rawWriteAutoritaet=false` und
  `actionAuthority=false` bleiben unveraendert.

## Migration

Bestehende Konstruktionen von `V5ProduktionsRuntime` bleiben kompatibel,
weil die Bediener-Richtlinie optional injiziert wird. Ohne sie bleibt der neue
Aktivierungspfad absichtlich gesperrt.

Der bisherige `kernKomponenten()`-Zugriff behaelt lesende Statussicht sowie
authority-reduzierende Status-/Deaktivierungsoperationen, exponiert aber keine
direkte Aktivierung der Runtime-eigenen Modul- oder Capability-Register mehr.

## Rollback

Rollback entfernt den kontrollierten PLANEN-Aktivierungspfad und stellt die
vollstaendig inaktive Default-Deny-Komposition aus ADR-026 wieder her. Da
dieser ADR keine mutierende Capability und keine Action-Authority einfuehrt,
ist fuer den Rollback keine Gameplay-Reconciliation erforderlich.
