# ADR-029 – Produktiver Operations-Feed und Host-Revalidierung

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

ADR-028 verlangt durable Evidence vor jeder PLANEN-Authority und eine laufende
Revalidierung bereits aktiver PLANEN-Capabilities. Bislang wurden
`HealthEvidence` und `OperationsMetrik` jedoch weiterhin von Aufrufern an
Bootstrap und Runtime uebergeben. Fuer den realen Host-Betrieb darf diese
Betriebswahrheit nicht aus beliebigen Call-Sites stammen.

Ausserdem betrachtete der Headless Supervisor jede vorhandene
Operations-Metrik als ausreichend. Ein einmaliger alter Messwert durfte daher
nicht unbegrenzt als aktuelle Operations-Bereitschaft weiterleben.

## Entscheidung

1. Die kanonische produktive Storage-Health-ID lautet
   `produktiver-speicher`.
2. `erstelleKanonischeProduktionsKomposition()` verwendet ohne explizite
   Ueberschreibung genau diese kritische Health-Anforderung.
3. `NodeProduktionsOperationsQuelle` beobachtet ausserhalb des Core:
   - durable Schreibbarkeit der Produktionswurzel;
   - reale freie Bytes des Dateisystems;
   - reale Write-Latenz des durable Storage-Probes.
4. Der Storage-Probe liegt unter
   `D:\AdventureLand-V5\runtime\health\storage-probe.json`.
5. Ein erfolgreicher Probe erzeugt `GESUND` oder `DEGRADIERT` plus eine
   Operations-Metrik. Ein Dateisystem-/Probe-Fehler erzeugt `KRITISCH` und
   Backpressure; er darf niemals als gesunde Evidence erscheinen.
6. Der Headless Supervisor akzeptiert Operations-Metriken nur, wenn ihr
   Zeitstempel nicht in der Zukunft liegt und das konfigurierte maximale Alter
   nicht ueberschritten ist. Default sind 60 Sekunden.
7. `V5ProduktionsHostController` ist die produktive Host-Grenze fuer:
   - Erheben der Operations-/Health-Beobachtung;
   - Einspeisen der Metrik in die Runtime;
   - Starten des bestehenden Gesamtfreigabe-Bootstraps;
   - laufende PLANEN-Revalidierung;
   - PLANEN-Aktivierung ausschliesslich mit frisch selbst erhobener Evidence.
8. Ein Ausfall der Operations-Quelle beim Host-Tick fuehrt zu einer
   Revalidierung mit fehlender Health-Evidence und entzieht damit aktive
   PLANEN-Authority fail-closed.
9. Operator-Deny, NOTHALT, Provider-Verlust, Health-Verlust oder stale
   Operations-Metrik koennen weiterhin keine Authority erhoehen.
10. Der Host-Controller besitzt keine Gameplay-, Raw-Write- oder
    Action-Authority und fuehrt keine Adventure-Land-Action aus.

## Alternativen

- Health/Metriken weiter durch beliebige Aufrufer uebergeben: verworfen, weil
  damit die produktive Betriebswahrheit spoofbar bleibt.
- Operations-Metrik ohne Altersgrenze akzeptieren: verworfen, weil ein alter
  guter Messwert einen ausgefallenen Host verdecken kann.
- Bei Quellenausfall nur einen Fehler loggen: verworfen, weil bestehende
  PLANEN-Authority dann stale weiterlaufen koennte.
- Storage-Probe direkt im Core ausfuehren: verworfen, weil direkter
  Dateisystemzugriff eine Adapteraufgabe bleibt.
- Den Host-Controller Gameplay-Aktionen ausfuehren lassen: verworfen; Planung
  und Execution bleiben getrennte Authority-Grenzen.

## Konsequenzen

- Reale Storage-Bereitschaft ist erstmals direkt in die V5-Host-Grenze
  verdrahtbar.
- Ein Host-Tick erneuert Betriebswahrheit und revalidiert PLANEN-Authority.
- Der Host kann PLANEN nicht mit frei erfundener Health-Evidence aktivieren.
- Der naechste Schritt ist die vollstaendige Node-/Windows-Komposition aus
  Gesamtfreigabe, durable Bediener-Deny-Protokoll, durable
  PLANEN-Aktivierungsprotokoll, Operations-Quelle, Runtime, Bootstrap und
  Host-Controller.
- Danach kann die erste einzelne PLANEN-Capability in einem observer-only
  Host-Canary aktiviert werden. Dafuer ist weiterhin keine Gameplay-Mutation
  erforderlich.
- Ein Adventure-Land-Ingame-Test wird durch diesen ADR noch nicht benoetigt.

## Invarianten

- Storage-Health-ID ist `produktiver-speicher`.
- Fehlende/degradierte/kritische/stale Health blockiert.
- Fehlende/stale/zukuenftige Operations-Metrik blockiert.
- Host-Quellenausfall entzieht aktive PLANEN-Authority.
- PLANEN-Aktivierung nutzt vom Host frisch erhobene Evidence.
- Default-Deny beim Runtime-Start bleibt bestehen.
- `MUTIEREN` bleibt unveraendert gesperrt.
- `gameplayAutoritaet=false`.
- `rawWriteAutoritaet=false`.
- `actionAuthority=false`.

## Migration

Bestehende Tests und Spezialkompositionen koennen weiterhin eigene
Health-Anforderungen an `erstelleKanonischeProduktionsKomposition(...)`
uebergeben. Ohne Parameter gilt nun die produktive Storage-Anforderung.

Der Headless Supervisor erhaelt einen optionalen Parameter fuer das maximale
Operations-Alter. Bestehende Konstruktionen bleiben mit dem 60-Sekunden-
Default kompatibel.

## Rollback

Rollback entfernt Operations-Quelle und Host-Controller und setzt den
Supervisor auf das vorherige Vorhandensein-statt-Freshness-Verhalten zurueck.
Dabei muss PLANEN-Authority vor dem Rollback deaktiviert werden; gespeicherte
durable Aktivierungs-Evidence aus ADR-028 erteilt selbst keine Authority.
