# ADR-032 – Erste produktiv registrierte MUTIEREN-Capability: equipment.equip

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

Der reale observer-only Bank-PLANEN-Canary ist bestanden. Die V5-Runtime besitzt
bereits Admission, Fencing, Socket-Budget, durable Intent, Execution und
Recovery sowie reale Controlled-Live-/Canary-Evidence fuer `equip`. Bisher
registriert die produktive Komposition trotzdem absichtlich keine
`MUTIEREN`-Capability.

Der naechste sichere Schritt ist deshalb nur die produktive Registrierung
einer einzigen mutierenden Capability, noch ohne produktive Aktivierung.

## Entscheidung

1. Als erste produktiv registrierte `MUTIEREN`-Capability wird exakt
   `equipment.equip` verwendet.
2. Exakter Owner ist `equipment-core@1`.
3. Die Action-Bindung ist exakt:
   - `AL-ACTION-EQUIP`;
   - `AL-RECOVERY-EQUIP`;
   - `AL-VERIFIER-EQUIP`;
   - Public Function `equip`.
4. Die Capability besitzt `status=VERFUEGBAR`,
   `standardAktiv=false` und startet immer `aktiv=false`.
5. Dieser ADR fuehrt noch keinen produktiven Aktivierungspfad ein.
6. `aktiviereNichtMutierend(...)` bleibt fuer diese Capability technisch
   gesperrt.
7. Registrierung allein erteilt keine Gameplay-, Raw-Write- oder
   Action-Authority.
8. Bank-, Trade-, Transfer-, Upgrade-, Compound-, Exchange- und
   Craft-Mutationen bleiben produktiv unregistriert.
9. Der vorhandene R12-Controlled-Live-Testgate darf nicht als
   Produktionsaktivierung wiederverwendet werden.
10. Ein spaeterer Aktivierungspfad muss separat ratifiziert werden und
    mindestens Operator-Deny, aktuelle Health/Operations, Gesamtfreigabe,
    durable Aktivierung vor lokaler Wirkung, kurzlebige Admission,
    Ressourcen/Fencing, Action-Channel, Socket-Budget, durable Intent,
    Live-Preconditions und Postcondition/Reconciliation erzwingen.

## Begruendung der Auswahl

`equip` ist die kleinste bereits real nachgewiesene Mutation. Fuer denselben
Action-/Recovery-/Verifier-Vertrag existieren R12 Controlled Live sowie R19
Controlled-Live und Canary Evidence. Im Gegensatz dazu wurden Bank- und
wertrelevante Merchant-Mutationen bewusst nicht als erster produktiver
Mutationspfad gewaehlt.

## Alternativen

- Eine Bank-Mutation zuerst registrieren: verworfen, weil der reale Banknachweis
  bisher absichtlich nur PLANEN/zero-write abdeckt.
- Den R12-Testowner `vertical-slice-controlled-live` produktiv weiterverwenden:
  verworfen, weil ADR-014 diesen Owner und sein Gate auf den Testnachweis
  begrenzt.
- Mehrere MUTIEREN-Capabilities gleichzeitig registrieren: verworfen, weil der
  erste produktive Mutationsschnitt klein, einzeln auditierbar und
  rollback-faehig bleiben soll.
- `equipment.equip` automatisch aktivieren: verworfen; MUTIEREN bleibt
  default-off und benoetigt einen separaten produktiven Aktivierungsvertrag.

## Konsequenzen

- Die kanonische Produktionskomposition kennt erstmals eine mutierende
  Capability, sie bleibt jedoch in jedem Startzustand inaktiv.
- Bestehende PLANEN-Aktivierung kann `equipment.equip` nicht aktivieren,
  weil der Nicht-MUTIEREN-Pfad den Modus technisch ablehnt.
- Der produktive Host erhaelt durch diese Registrierung weder einen neuen
  Send-Endpunkt noch einen Register-Bypass.
- Ein spaeterer produktiver Equip-Live-Nachweis muss einen neuen,
  separat auditierbaren Authority-Pfad beweisen.
- Ein Rollback dieser Stufe ist gameplay-neutral, weil keine Mutation
  freigegeben oder ausgefuehrt wird.

## Invarianten

- genau ein produktiver Owner fuer `equipment.equip`;
- `modus=MUTIEREN`;
- `standardAktiv=false`;
- Runtime-Start aktiviert die Capability nicht;
- kein produktiver Aktivierungspfad durch diesen ADR;
- keine Wiederverwendung des R12-Testgates als Produktions-Authority;
- keine zusaetzliche mutierende Capability;
- Registrierung erzeugt keine Gameplay-/Raw-Write-/Action-Authority.

## Migration

Diese Stufe ist rein strukturell. Nach Merge darf kein Ingame-Test und kein
Gameplay-Write allein wegen dieser Registrierung ausgefuehrt werden.

Der naechste Schritt ist ein separater default-deny Einmal-Aktivierungsvertrag
fuer exakt diese Capability.

## Rollback

Rollback entfernt Equipment-Modul, Capability-Definition, Vertrag und
Kompositionsregistrierung. Da die Capability nie produktiv aktiviert wird,
entsteht durch diesen ADR kein zu reconciliender Gameplay-Zustand.
