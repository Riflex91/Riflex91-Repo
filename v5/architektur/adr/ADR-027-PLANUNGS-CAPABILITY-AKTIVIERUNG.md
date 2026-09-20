# ADR-027 – Kontrollierte Aktivierung produktiver PLANEN-Capabilities

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

ADR-026 registriert die acht produktiven Merchant-Capabilities als `PLANEN`, `VERFUEGBAR` und `standardAktiv=false`. Die produktive Runtime startet weiterhin vollständig default-deny. Für den nächsten Betriebsintegrationsschritt wird ein expliziter Aktivierungspfad benötigt, ohne daraus Execution-, Gameplay-, Raw-Write- oder Action-Authority abzuleiten.

Die vorhandene Bediener-Richtlinie ist absichtlich deny-only. Sie darf Authority reduzieren, aber keine neue Allow-Abkürzung bereitstellen. Gleichzeitig existieren bereits Modul-/Capability-Register, Headless-Health/Operations-Supervision und ein Authority-Status-Register.

Die Aktivierung einer produktiven Capability ist eine neue Authority-Grenze und wird deshalb separat ratifiziert.

## Entscheidung

1. Es gibt genau einen produktiven Kontrollpfad für die hier behandelte Aktivierung: `KontrolliertePlanungsAktivierung`.
2. Dieser Pfad akzeptiert ausschließlich registrierte Capabilities mit `modus=PLANEN`.
3. Aktivierung ist nur zulässig, wenn:
   - die V5-Produktionsruntime läuft und den Zustand `LAEUFT` meldet;
   - Gameplay-, Raw-Write- und Action-Authority der Runtime weiterhin `false` sind;
   - Provider-Modul und Provider-Version exakt zur Capability passen;
   - das Provider-Modul `GESUND` ist und die Capability deklariert;
   - die Capability `VERFUEGBAR`, `standardAktiv=false` und noch inaktiv ist;
   - der Headless Supervisor mit aktueller Health-Evidence und Operations-Metrik `bereit=true` meldet;
   - die deny-only Bediener-Richtlinie die Capability erlaubt und kein NOTHALT aktiv ist.
4. Vor jeder lokalen Authority-Erhöhung wird ein typisierter Aktivierungsdatensatz über `PlanungsAktivierungsProtokollPort.schreibeDurable(...)` geschrieben. Scheitert das durable Audit, bleibt die Aktivierung aus.
5. Nach dem asynchronen Audit werden alle Aktivierungsvoraussetzungen erneut fail-closed geprüft.
6. Erst danach werden das exakte Provider-Modul und die exakte PLANEN-Capability aktiviert.
7. Der resultierende Planungs-Authority-Status enthält Policy-ID, Owner, Health-Evidence, Audit-ID und eine durch die aktuelle Health-Evidence begrenzte Gültigkeit.
8. Der Pfad aktiviert niemals eine `MUTIEREN`-Capability und verändert keine Gameplay-Adapter, Action Contracts, Admission-, Ressourcen-, Budget-, Intent-, Recovery- oder Settlement-Verträge.
9. Der normale Runtime-Start aktiviert weiterhin weder Module noch Capabilities.
10. Die Bediener-Richtlinie erhält keinen Allow-/Enable-Befehl.

## Alternativen

- Bediener-Allow-Befehl ergänzen: verworfen, weil die bestehende deny-only Grenze dadurch Authority erhöhen könnte.
- Capability-Register direkt aus dem Host aufrufen: verworfen, weil Health-, Operator-, Provider- und Audit-Gates umgangen werden könnten.
- PLANEN-Capabilities beim Runtime-Start automatisch aktivieren: verworfen, weil dies Default-Deny verletzt.
- Bereits jetzt `MUTIEREN` registrieren oder aktivieren: verworfen, weil dafür die separate Action-/Admission-/Ressourcen-/Intent-/Recovery-/Postcondition-Kette erforderlich ist.
- Nur den Authority-Status setzen, ohne Registerzustand zu ändern: verworfen, weil Register- und Authority-Sicht dann auseinanderlaufen würden.

## Konsequenzen

- Produktive PLANEN-Capabilities können explizit und auditierbar freigeschaltet werden.
- Die Freischaltung bleibt nicht-mutierend: Planung ist weiterhin nicht Execution.
- Provider-Versionen werden beim Lifecycle exakt gebunden; ein gleichnamiger Provider anderer Version kann nicht versehentlich aktiviert werden.
- Health-Evidence begrenzt die Authority zeitlich. Ein produktiver Host muss diese Authority vor Nutzung fortlaufend revalidieren und bei verlorener Bereitschaft deaktivieren.
- Ein Audit-Ausfall, NOTHALT, Operator-Deny, stale/degradierte Health, falscher Provider oder eine nicht-PLANEN-Capability blockiert die Aktivierung.

## Invarianten

- `standardAktiv=false` bleibt unverändert.
- Runtime-Start bleibt default-deny.
- Nur `PLANEN` darf über diesen Pfad aktiviert werden.
- Provider-Modul-ID und Provider-Version müssen exakt stimmen.
- NOTHALT und Capability-Deny dominieren.
- Durable Audit erfolgt vor lokaler Aktivierung.
- Nach dem Audit wird revalidiert.
- Gameplay-Authority = `false`.
- Raw-Write-Authority = `false`.
- Action-Authority = `false`.
- Keine Gameplay-Mutation wird durch diesen ADR erlaubt.
- Keine bestehende Safety-/Authority-Grenze wird gelockert.

## Migration

Die bestehende Produktionskomposition und ADR-026 bleiben unverändert gültig. Der neue Dienst wird optional in `V5ProduktionsRuntime` verdrahtet. Ohne explizite Aktivierungs-Abhängigkeiten bleibt der neue Pfad fail-closed und wirft `PLANUNGS_AKTIVIERUNG_NICHT_KONFIGURIERT`.

Das Capability-Register erhält eine rückwärtskompatible optionale Provider-Versionsbindung für Aktivierung und Deaktivierung; der produktive Pfad übergibt die Version immer explizit.

## Rollback

Rollback entfernt den neuen Aktivierungsdienst und seine Runtime-Verdrahtung. Da keine `MUTIEREN`-Capability und keine Gameplay-/Raw-Write-/Action-Authority eingeführt wird, ist kein Gameplay-Reconciliation-Schritt erforderlich. Bereits bestehende Registrierungen aus ADR-026 bleiben default-off und können unverändert bestehen bleiben.
