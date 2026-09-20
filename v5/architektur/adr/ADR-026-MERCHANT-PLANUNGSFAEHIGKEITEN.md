# ADR-026 – Merchant Core A: produktive PLANEN-Capabilities

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

Die produktive V5-Kompositionswurzel kennt seit dem Post-Certification-Katalog die reale Modulidentitaet `merchant-core-a@1`, registriert aber absichtlich noch keine Capability. Gleichzeitig existieren im V5-Core bereits Merchant-Funktionen fuer Task-Koordination, Bank-Autonomie, Verkaufssicherheit, Marktanalyse, MLuck-Serviceplanung, Logistikplanung, Gear-Progression und Item-Mutationsplanung.

Diese Funktionen liefern Planung, Bewertung, Demand oder Koordination. Sie verleihen selbst keine Execution-, Gameplay- oder Raw-Write-Authority. Test-Fixtures wie `merchant-core` / `bank.deposit` sind keine produktiven Owner-Vertraege.

Die Architekturverfassung verlangt fuer eine neue Authority-Grenze einen expliziten ADR und verbietet, dass Planung allein Execution erteilt.

## Entscheidung

1. `merchant-core-a@1` stellt genau folgende produktive Capability-IDs bereit:
   - `merchant.task.planen`
   - `merchant.bank.planen`
   - `merchant.verkauf.planen`
   - `merchant.markt.planen`
   - `merchant.mluck.planen`
   - `merchant.logistik.planen`
   - `merchant.gear.planen`
   - `merchant.itemmutation.planen`
2. Alle acht Capabilities besitzen ausschliesslich den Modus `PLANEN`.
3. Alle acht Capabilities besitzen `standardAktiv=false`.
4. Die Kompositionswurzel registriert die Capabilities, aktiviert sie beim Runtime-Start aber nicht.
5. Es wird keine `MUTIEREN`-Capability durch diesen ADR eingefuehrt.
6. Die Produktionskomposition muss fail-closed pruefen, dass:
   - das Provider-Modul mit exakter ID und Version existiert;
   - die Capability vom Provider-Modul deklariert wird;
   - jede vom Modul deklarierte bereitgestellte Capability exakt eine passende Provider-Definition besitzt;
   - jede benoetigte Capability mindestens einen registrierten Anbieter besitzt.
7. Der maschinenlesbare Nachweis liegt unter
   `v5/grundlage/vertraege/runtime/merchant-core-a-planungsfaehigkeiten.json`.

## Alternativen

- Test-Fixture-IDs als Produktvertrag uebernehmen: verworfen, weil Tests keine produktive Authority-Quelle sind.
- Direkt mutierende Merchant-Capabilities registrieren: verworfen, weil eine Action-/Admission-/Recovery-Kette nicht allein durch vorhandene Planer bewiesen wird.
- Merchant-Funktionen weiter ohne Capability-Identitaet lassen: verworfen, weil die produktive Komposition dann keine auditierbare Owner-Grenze fuer vorhandene Planung besitzt.
- Capabilities automatisch aktivieren: verworfen; widerspricht Default-Deny und der R7-Verfassung.

## Konsequenzen

- Die Runtime kann reale Merchant-Planungsfaehigkeiten maschinenlesbar registrieren und einem eindeutigen Provider zuordnen.
- Runtime-Start bleibt authority-neutral: Module und Capabilities bleiben inaktiv.
- Spaetere explizite Aktivierung nicht-mutierender Capabilities kann separat und operator-/health-gebunden erfolgen.
- Mutierende Merchant-Autoritaet bleibt weiterhin absent und muss spaeter separat ratifiziert, verdrahtet und live nachgewiesen werden.

## Invarianten

- `merchant-core-a` bleibt Single Provider fuer die hier definierten PLANEN-Capabilities.
- `standardAktiv=false` fuer jede produktive Capability.
- Anzahl produktiver Merchant-`MUTIEREN`-Capabilities aus diesem Vertrag: 0.
- Capability-Definition ohne passendes Provider-Modul: fail-closed.
- Capability-Definition, die das Provider-Modul nicht deklariert: fail-closed.
- Moduldeklaration ohne passende Capability-Definition: fail-closed.
- Fehlende benoetigte Capability: fail-closed.
- Capability-Registrierung allein erteilt keine Gameplay-, Raw-Write- oder Action-Authority.

## Migration

Die bisherige Default-Deny-Komposition mit `merchant-core-a@1` bleibt kompatibel, wird aber um die acht PLANEN-Definitionen erweitert. Der Merchant-Workflow-Owner bleibt unveraendert `merchant-core-a`.

Kein bestehender Action Contract, Recovery Contract, Verifier, Admission-Pfad oder Gameplay-Adapter wird durch diese Migration geaendert.

## Rollback

Rollback entfernt die acht Capability-Definitionen und setzt die Moduldeklaration wieder auf eine leere Capability-Menge. Da keine Capability standardmaessig aktiv ist und keine MUTIEREN-Authority eingefuehrt wird, erfordert der Rollback keine Gameplay-Reconciliation.
