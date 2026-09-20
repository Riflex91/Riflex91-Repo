# V5 Produktionskomposition

**Status:** DEFAULT-DENY BASISKATALOG  
**Stand:** 2026-09-20

## Zweck

Die produktive V5-Runtime besitzt eine konkrete Kompositionswurzel, darf aber keine Modul- oder Capability-Identitaet aus Test-Fixtures ableiten.

Der kanonische Katalog liegt in:

- `grundlage/quelle/runtime/produktions-komposition.ts`;
- `grundlage/quelle/merchant/modul-vertrag.ts`.

## Aktuell belegte Modulidentitaet

Der produktive Merchant-Workflow verwendet bereits explizit:

`merchant-core-a`

Diese Identitaet ist deshalb als `MERCHANT_CORE_A_MODUL_ID` zentralisiert und wird sowohl vom Merchant-Workflow als auch von der Produktionskomposition verwendet.

## Default-Deny-Grenze

Die aktuelle kanonische Komposition:

- registriert `merchant-core-a@1`;
- aktiviert kein Modul automatisch;
- registriert noch keine produktive Capability-Bindung;
- aktiviert keine mutierende Capability;
- erzeugt keine Gameplay-, Raw-Write- oder Action-Authority;
- erfindet keine Owner-/Capability-Zuordnung aus Tests.

Der Katalogstatus lautet:

`DEFAULT_DENY_OHNE_FAEHIGKEITSBINDUNGEN`

Testnamen wie `merchant-core` / `bank.deposit` bleiben Test-Fixtures, solange kein ratifizierter produktiver Vertrag dieselbe Bindung festlegt.

## Naechster Integrationsschritt

Weitere Module und Capabilities duerfen erst aufgenommen werden, wenn ihre produktive Owner-Identitaet aus V5-Quellcode, ratifizierter Architektur oder einem neuen expliziten Vertrag eindeutig ableitbar ist.

Ein spaeterer Betriebsstart muss zusaetzlich reale Health-Evidence, Gesamtfreigabe, Operator-Policy, Capability-Authority, Admission, Ressourcen/Fencing, Action-Channel, Budget, durable Intent und Postcondition/Reconciliation verwenden. Der Kompositionskatalog allein erteilt keine Mutationserlaubnis.
