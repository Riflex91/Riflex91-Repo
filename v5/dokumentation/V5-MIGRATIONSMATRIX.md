# V5 – V3/V4-zu-V5-Migrationsmatrix

**Status:** R2 RATIFIZIERT  
**Stand:** 2026-09-19

## Grundsatz

V5 ist ein Architektur-Neustart. V3 und V4 liefern Verhalten, Fehlerwissen, Tests und Design-Evidence, aber keine automatische Runtime-Implementierung.

Erlaubte Entscheidungen:

- `PORTIEREN`
- `UMBAUEN`
- `NEU_BAUEN`
- `NUR_WISSENSQUELLE`
- `VERWERFEN`

Fuer die 47 historisch auditierten Runtime-Capabilities lautet die R2-Entscheidung:

- **44 × NEU_BAUEN**
- **1 × NUR_WISSENSQUELLE**
- **2 × VERWERFEN**
- **0 × PORTIEREN**
- **0 × UMBAUEN**

Dass keine Runtime-Capability direkt portiert oder umgebaut wird, ist beabsichtigt. V5 uebernimmt Semantik nur ueber die neue Pipeline, Ports, Invarianten und Action-/Recovery-Vertraege.

## Explizit nicht uebernommen

- **CAP-004 Patch Registry:** nur Wissens-/Testquelle. V5 verbietet Patch-Kaskaden als Erweiterungsarchitektur.
- **CAP-006 Alpha-Runtime-Vererbung:** verworfen. V5 darf nicht von historischen Feature-/Alpha-Runtimes erben.
- **CAP-047 Dist Bundles:** verworfen. Generierter Code ist weder Spezifikation noch Implementierungsautoritaet.

## Neu zu bauende Capabilities

Alle anderen historisch relevanten Capabilities werden auf V5-Layern neu gebaut, unter anderem:

- Execution/Outcome Verification;
- Scheduler/Workflows/Resource Claims;
- Recovery/Reconciliation;
- Persistenz;
- World Truth/Content Safety;
- Combat/Navigation;
- Party/Account Coordination;
- Merchant/Bank/Inventory/Production;
- Learning ohne Authority;
- Host/Operations/Certification;
- Architekturguards.

Die maschinenlesbare Vollmatrix liegt unter:

`v5/migration/v3-v4-zu-v5.json`

## Quellcode-Regel

`quellcodeWiederverwendung=false` bedeutet fuer diese Matrix: historische Runtime-Dateien werden nicht als V5-Implementierungsbasis kopiert. Tests, Failure Cases und beobachtete Semantik duerfen als Evidence in neue V5-Vertraege einfließen.

## Freigabe

Eine spaetere Capability darf erst implementiert werden, wenn ihre V5-Zielphase freigegeben ist und die zugehoerigen Knowledge-/Action-/Recovery-/Safety-Vertraege aktuell und gruen sind.
