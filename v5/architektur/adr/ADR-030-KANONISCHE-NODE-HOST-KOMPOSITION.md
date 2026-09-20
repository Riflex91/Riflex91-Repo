# ADR-030 – Kanonische Node-Produktionshost-Komposition

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

ADR-029 fuehrt reale Storage-/Operations-Evidence und den observer-only
Produktions-Host-Controller ein. Fuer den echten Node-/Windows-Betrieb muessen
die bislang getrennten Komponenten genau einmal und ohne neue Authority-
Nebenpfade zusammengesetzt werden.

Besonders kritisch ist die deny-only Bediener-Richtlinie. Ein durable Log, das
nach Prozessneustart nicht wieder eingelesen wird, wuerde eine bestehende
Capability-Sperre oder einen NOTHALT faktisch vergessen. Persistenz waere dann
kein wirksamer Sicherheitszustand.

## Entscheidung

1. `erstelleNodeV5ProduktionsHost(...)` ist die kanonische Node-Komposition
   fuer den observer-only V5-Produktionshost.
2. Die Komposition kapselt intern:
   - `NodeProduktionsDateisystem`;
   - `NodeBedienerDenyProtokoll`;
   - `BedienerRichtlinienDienst`;
   - `NodePlanenAktivierungsProtokoll`;
   - `V5ProduktionsRuntime`;
   - `ProduktivesV5GesamtfreigabeGate`;
   - `V5ProduktionsBootstrap`;
   - `NodeProduktionsOperationsQuelle`;
   - `V5ProduktionsHostController`.
3. Die Fassade exponiert keinen Runtime-, Register-, Supervisor- oder
   Telemetrie-Aktivierungs-Bypass.
4. Der Bediener-Deny-Verlauf wird bounded in
   `runtime/operator/deny.jsonl` gespeichert.
5. Der Deny-Verlauf ist auf maximal 4096 Eintraege und 5 MB begrenzt.
6. Jede `befehlId` ist eindeutig. Identische Wiederholung derselben ID und
   desselben Inhalts ist idempotent; abweichender Inhalt unter derselben ID ist
   eine Kollision und wird blockiert.
7. Beim Laden wird die historische `wirkung` deterministisch gegen die
   vorangegangene Deny-Historie validiert. Manipulierte oder widerspruechliche
   Historie blockiert den Start.
8. Vor Konstruktion der neuen Runtime werden alle gespeicherten
   deny-only Befehle in Originalreihenfolge wieder auf einen frischen
   `BedienerRichtlinienDienst` angewendet.
9. Dadurch ueberleben Capability-Sperren und NOTHALT einen Prozessneustart.
10. Ein bereits persistierter NOTHALT kann keine PLANEN-Authority zulassen.
    Falls die observer-only Runtime waehrend des Bootstrap bereits gestartet
    wurde und die Post-Start-Revalidierung den NOTHALT erkennt, wird sie sofort
    kontrolliert wieder gestoppt.
11. `wendeDenyAn(...)` auf der Node-Fassade persistiert zuerst ueber den
    bestehenden deny-only Dienst und revalidiert bei laufendem Host danach
    sofort die aktive PLANEN-Authority.
12. Die Fassade besitzt weiterhin keine Gameplay-, Raw-Write- oder
    Action-Authority.

## Alternativen

- Deny-Zustand nur im Speicher halten: verworfen, weil Restart Safety
  zuruecksetzen wuerde.
- Pro Deny-Befehl eine Datei ohne Index/Listing schreiben: verworfen, weil der
  vorhandene Produktions-Dateisystemport absichtlich keine ungebundene
  Verzeichnisauflistung exponiert.
- Einen Snapshot statt Historie speichern: verworfen, weil ein Crash zwischen
  Command-Persistenz und Snapshot-Aktualisierung eine mehrdeutige Recovery-
  Semantik erzeugen kann.
- Das Log beim Neustart ignorieren: verworfen, weil dies persistierten NOTHALT
  und Capability-Deny unwirksam machen wuerde.
- Runtime oder Register aus der Node-Fassade zurueckgeben: verworfen, weil
  damit die Host-/Bootstrap-Grenze umgangen werden koennte.
- Automatisch Gameplay-Aktionen aus der Komposition starten: verworfen;
  diese Komposition bleibt observer-only und PLANEN-only.

## Konsequenzen

- Der Node-/Windows-Host kann jetzt aus einer einzigen fail-closed Komposition
  aufgebaut werden.
- Deny-only Operator-Zustand ist restart-sicher.
- Aktivierungs-Audit, Operator-Deny und reale Storage-Evidence teilen dieselbe
  gebundene Produktionswurzel, ohne dadurch Gameplay-Authority zu erhalten.
- Der naechste Schritt ist ein erster observer-only Canary fuer genau eine
  PLANEN-Capability. Der Canary darf nur lesen/planen und muss seine Ausgabe
  als Evidence exportieren.
- Erst wenn dieser Canary echte Adventure-Land-Beobachtung benoetigt, ist ein
  manueller Ingame-Test erforderlich.

## Invarianten

- Capability-Deny ueberlebt Restart.
- NOTHALT ueberlebt Restart.
- Widerspruechliche Deny-Historie blockiert.
- Deny-Historie ist bounded.
- Keine Allow-Kommandos werden eingefuehrt.
- Keine Runtime-/Register-Aktivierungs-Bypaesse werden exponiert.
- Default-Deny beim Runtime-Start bleibt erhalten.
- `MUTIEREN` bleibt unveraendert gesperrt.
- `gameplayAutoritaet=false`.
- `rawWriteAutoritaet=false`.
- `actionAuthority=false`.

## Migration

Bestehende Einzelkomponenten bleiben fuer Unit-/Integrationstests verfuegbar.
Produktive Node-Aufrufer sollen ab dieser Stufe die kanonische Fassade statt
einer manuellen Komponentenverkabelung verwenden.

Die statischen Bereitschafts- und Gesamtfreigabe-Dokumente werden standardmaessig
aus dem V5-Repository geladen. Tests duerfen explizit alternative Objekte und
eine Testwurzel injizieren.

## Rollback

Rollback entfernt die Node-Fassade, nicht jedoch die bereits durable
gespeicherte Deny-Historie. Vor einem Rueckfall auf eine aeltere Komposition
muss sichergestellt werden, dass diese Historie weiterhin eingelesen wird;
andernfalls ist der Rollback fuer produktiven Betrieb nicht zulaessig.
