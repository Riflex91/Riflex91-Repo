# V5 Produktionskomposition

**Status:** DEFAULT-DENY / PLANEN REGISTRIERT / INAKTIV  
**Stand:** 2026-09-20

## Zweck

Die produktive V5-Runtime besitzt eine konkrete Kompositionswurzel und verwendet ausschliesslich ratifizierte Produktvertraege fuer Modul- und Capability-Identitaeten. Test-Fixtures sind keine Authority-Quelle.

Der kanonische Katalog liegt in:

- `grundlage/quelle/runtime/produktions-komposition.ts`;
- `grundlage/quelle/merchant/modul-vertrag.ts`;
- `grundlage/quelle/merchant/faehigkeits-vertrag.ts`;
- `grundlage/vertraege/runtime/merchant-core-a-planungsfaehigkeiten.json`;
- `architektur/adr/ADR-026-MERCHANT-PLANUNGSFAEHIGKEITEN.md`.

## Produktive Modulidentitaet

Der Merchant-Workflow und die Produktionskomposition verwenden dieselbe Identitaet:

`merchant-core-a@1`

`MERCHANT_CORE_A_MODUL_ID` und `MERCHANT_CORE_A_MODUL_VERSION` sind die kanonische Quelle im TypeScript-Core.

## Produktive PLANEN-Capabilities

`merchant-core-a@1` deklariert und registriert genau acht nicht-mutierende Planungsfaehigkeiten:

- `merchant.task.planen`
- `merchant.bank.planen`
- `merchant.verkauf.planen`
- `merchant.markt.planen`
- `merchant.mluck.planen`
- `merchant.logistik.planen`
- `merchant.gear.planen`
- `merchant.itemmutation.planen`

Alle besitzen:

- `modus=PLANEN`;
- `status=VERFUEGBAR`;
- `standardAktiv=false`;
- beim Runtime-Start `aktiv=false`.

Es wird dadurch keine Gameplay-, Raw-Write- oder Action-Authority erzeugt.

## Cross-Validation

Die Runtime prueft die Komposition vor jeder Registrierung fail-closed:

1. jede Capability muss ein exaktes Provider-Modul mit passender Modulversion besitzen;
2. das Provider-Modul muss die Capability in `bereitgestellteFaehigkeiten` deklarieren;
3. jede deklarierte bereitgestellte Capability muss exakt eine passende Provider-Definition besitzen;
4. jede `benoetigteFaehigkeit` eines Moduls muss mindestens einen registrierten Anbieter besitzen;
5. `standardAktiv=true` bleibt fuer Module und Capabilities verboten.

Dadurch reicht ein isolierter Registereintrag nicht aus, um eine neue Capability an einer Modulgrenze vorbei einzufuehren.

## Default-Deny-Grenze

Der Katalogstatus lautet:

`DEFAULT_DENY_PLANEN_REGISTRIERT_INAKTIV`

Die Komposition:

- registriert `merchant-core-a@1`;
- registriert die acht PLANEN-Capabilities;
- aktiviert kein Modul automatisch;
- aktiviert keine Capability automatisch;
- registriert aktuell keine produktive `MUTIEREN`-Capability;
- erfindet keine Owner-/Capability-Zuordnung aus Tests.

Testnamen wie `merchant-core` / `bank.deposit` bleiben Test-Fixtures und sind nicht Teil des produktiven Merchant-Vertrags.

## Kontrollierte PLANEN-Aktivierung

Die explizite Aktivierungsgrenze ist in
`architektur/adr/ADR-027-PLANUNGS-CAPABILITY-AKTIVIERUNG.md`
ratifiziert und maschinenlesbar unter
`grundlage/vertraege/runtime/planungs-aktivierung.json`
gespiegelt.

`KontrolliertePlanungsAktivierung` darf ausschließlich `PLANEN` aktivieren.
Vor lokaler Wirkung müssen Runtime-Laufzustand, exakte Provider-Bindung,
Provider-Health, Capability-Status, Headless-Supervisor, aktuelle
Health-Evidence, Operations-Metrik, deny-only Operator-Policy und NOTHALT
geprüft sein. Danach wird ein durable Audit geschrieben, die gesamte
Voraussetzungskette erneut geprüft und erst dann das exakte Modul samt
Capability aktiviert.

Die dabei sichtbare Planungs-Authority ist durch die aktuelle
Health-Evidence zeitlich begrenzt. Gameplay-, Raw-Write- und
Action-Authority bleiben `false`. Ein normaler Runtime-Start aktiviert
weiterhin nichts.

## Naechster Integrationsschritt

Als nächstes braucht der reale Host-/Bootstrap-Pfad eine dauerhafte Quelle
für Health-Evidence und Operations-Metriken sowie eine fortlaufende
Revalidierung bereits aktivierter PLANEN-Authority. Danach kann explizit
festgelegt werden, welche der acht PLANEN-Capabilities im realen Betrieb
aktiviert werden.

Die reine Registrierung oder Aktivierung von PLANEN-Capabilities erteilt
keine Mutationserlaubnis. Mutierende Merchant-Capabilities benötigen einen
separaten ratifizierten Vertrag mit Capability-Owner, Action Contract,
Admission, Ressourcen/Fencing, Budget, durable Intent, Recovery und
Postcondition/Reconciliation sowie eigenen Integrations-/Live-Nachweisen.
