# ADR-028 – Durable PLANEN-Authority und laufende Revalidierung

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

ADR-027 erlaubt die explizite Aktivierung produktiver `PLANEN`-Capabilities
unter Runtime-, Provider-, Health- und deny-only Operator-Gates. Der dort
eingefuehrte Runtime-Audit war absichtlich nur ein begrenzter In-Memory-
Betriebsnachweis und sollte die spaetere durable Host-Persistenz nicht
vorwegnehmen.

Damit produktive PLANEN-Authority einen Prozessabsturz oder einen Neustart
nicht ohne nachvollziehbaren Vor-Wirkung-Nachweis ueberleben kann, muss die
dauerhafte Protokollierung nun selbst Teil der Authority-Grenze werden.
Zusaetzlich muss eine bereits aktive PLANEN-Capability ihre Voraussetzungen
fortlaufend verlieren koennen; eine einmalige Aktivierung darf keine
unbegrenzte Freigabe erzeugen.

## Entscheidung

1. `V5ProduktionsRuntime.aktivierePlanenFaehigkeit(...)` wird asynchron und
   verlangt einen explizit injizierten
   `V5PlanenAktivierungsProtokollPort`.
2. Vor jeder lokalen Authority-Erhoehung wird ein typisierter Intent mit
   `art=PLANEN_AKTIVIERUNG_VOR_WIRKUNG` durable persistiert.
3. Ohne Protokollport, bei Schreibfehler oder bei ungueltiger
   Durability-Bestaetigung bleibt Modul- und Capability-Authority unveraendert
   inaktiv.
4. Nach dem asynchronen Durable-Write werden Runtime-, Laufsteuerungs-,
   Operator-, Provider-, Modul-, Capability-, Health- und Supervisor-Gates
   vollstaendig erneut geprueft. Ein zwischenzeitlicher Gate-Verlust blockiert
   die lokale Wirkung.
5. Der Capability-Lifecycle bindet Aktivierung und produktive Deaktivierung
   optional an die exakte Provider-Version. Der Produktionspfad uebergibt die
   Version immer explizit.
6. `revalidierePlanenAuthority(...)` entzieht bestehende PLANEN-Authority
   fail-closed, wenn globale Betriebsbereitschaft verloren geht oder eine
   aktive Capability ihre Capability-/Provider-/Operator-Voraussetzungen
   verliert.
7. Nach einem globalen Revalidierungsfehler werden alle aktiven
   Kompositions-Capabilities und -Module deaktiviert.
8. Nach einem capability-spezifischen Fehler wird die exakte Capability-Version
   deaktiviert; ein Provider-Modul ohne verbleibende aktive Capability wird
   ebenfalls deaktiviert.
9. Durable Aktivierungsnachweise sind idempotent nach `aktivierungsId`.
   Dieselbe ID mit abweichendem Inhalt ist eine Kollision und wird blockiert.
10. Der produktive Node-Dateisystemadapter ist ausserhalb des Testmodus fest
    auf `D:\AdventureLand-V5` begrenzt. PLANEN-Audits liegen unter
    `runtime/authority/planen/`.
11. Gameplay-, Raw-Write- und Action-Authority bleiben auf allen neuen Pfaden
    `false`. Es wird keine `MUTIEREN`-Capability registriert oder aktiviert.

## Alternativen

- Audit erst nach lokaler Aktivierung schreiben: verworfen, weil ein
  Persistenzfehler dann bereits Authority hinterlassen koennte.
- Nur den In-Memory-Audit aus ADR-027 verwenden: verworfen, weil er einen
  Prozessneustart nicht ueberdauert.
- Durable Write ohne Revalidierung danach: verworfen, weil waehrend des
  asynchronen Writes NOTHALT, Operator-Deny oder Health-Verlust eintreten
  koennen.
- Provider-Version nur vorab pruefen, Registry-Lifecycle aber weiterhin nur an
  Modul-ID binden: verworfen, weil mehrere registrierte Versionen sonst eine
  mehrdeutige lokale Wirkung erzeugen koennen.
- Revalidierung nur beobachten und nicht deaktivieren: verworfen, weil stale
  Authority dann trotz verlorenem Gate aktiv bliebe.

## Konsequenzen

- Durable Evidence liegt vor der lokalen PLANEN-Authority.
- Crash-/Restart-Analyse kann anhand einer stabilen Aktivierungs-ID feststellen,
  welcher Intent vor einer moeglichen lokalen Wirkung durable war.
- Eine durable Intent-Datei ist kein Beweis dafuer, dass die lokale Aktivierung
  erfolgreich stattgefunden hat; sie ist bewusst ein Vor-Wirkung-Nachweis.
- Aktive PLANEN-Authority ist weiterhin an aktuelle Health-/Operations- und
  Operator-Voraussetzungen gebunden.
- Der naechste Host-/Bootstrap-Schritt muss reale Health-Evidence und
  Operations-Metriken einspeisen und `revalidierePlanenAuthority(...)`
  fortlaufend aufrufen.
- Fuer diese Aenderung ist weiterhin kein Adventure-Land-Ingame-Test
  erforderlich, weil keine Gameplay-Mutation oder Browser-Action eingefuehrt
  wird.

## Invarianten

- Default-Deny beim Runtime-Start bleibt erhalten.
- `standardAktiv=false` bleibt erhalten.
- `MUTIEREN` bleibt ueber den PLANEN-Pfad verboten.
- Durable Audit liegt vor lokaler Wirkung.
- Nach Durable Audit erfolgt Revalidierung.
- Provider-ID und Provider-Version werden exakt gebunden.
- NOTHALT und deny-only Capability-Sperren dominieren.
- Verlorene Health-/Operations-Bereitschaft entzieht PLANEN-Authority.
- `gameplayAutoritaet=false`.
- `rawWriteAutoritaet=false`.
- `actionAuthority=false`.
- Keine Gameplay-Adapter oder Action Contracts werden veraendert.

## Migration

Bestehende Runtime-Konstruktionen bleiben syntaktisch kompatibel, weil der
neue Protokollport optional konstruiert werden kann. Der Aktivierungspfad ist
ohne diesen Port jedoch absichtlich fail-closed.

Produktive Aufrufer muessen `aktivierePlanenFaehigkeit(...)` nun `await`en und
einen durable Protokollport bereitstellen. Read-only Statuspfade und der
Runtime-Start bleiben unveraendert.

## Rollback

Rollback entfernt den durable Vor-Wirkung-Port und die laufende Revalidierung
und faellt auf ADR-027 zurueck. Bereits geschriebene Auditdateien bleiben als
historische Evidence erhalten; sie erteilen selbst keine Authority und muessen
nicht geloescht werden.
