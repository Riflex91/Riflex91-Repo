# V5 Produktionskomposition

**Status:** DEFAULT-DENY / PLANEN KONTROLLIERT AKTIVIERBAR  
**Stand:** 2026-09-20

## Zweck

Die produktive V5-Runtime besitzt eine konkrete Kompositionswurzel und verwendet ausschliesslich ratifizierte Produktvertraege fuer Modul- und Capability-Identitaeten. Test-Fixtures sind keine Authority-Quelle.

Der kanonische Katalog liegt in:

- `grundlage/quelle/runtime/produktions-komposition.ts`;
- `grundlage/quelle/merchant/modul-vertrag.ts`;
- `grundlage/quelle/merchant/faehigkeits-vertrag.ts`;
- `grundlage/vertraege/runtime/merchant-core-a-planungsfaehigkeiten.json`;
- `architektur/adr/ADR-026-MERCHANT-PLANUNGSFAEHIGKEITEN.md`;
- `architektur/adr/ADR-027-KONTROLLIERTE-PLANEN-AKTIVIERUNG.md`;
- `architektur/adr/ADR-028-DURABLE-PLANEN-AUTHORITY.md`;
- `grundlage/vertraege/runtime/durable-planen-authority.json`.

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

Die Produktionsruntime besitzt jetzt einen expliziten Aktivierungspfad fuer
registrierte `PLANEN`-Capabilities. Eine Aktivierung ist nur moeglich, wenn:

- die Runtime bereits laeuft;
- die Laufsteuerung neue Arbeit erlaubt;
- eine explizit injizierte deny-only Bediener-Richtlinie vorhanden ist;
- NOTHALT nicht aktiv ist;
- die Capability nicht gesperrt ist;
- Provider-Modul-ID und Provider-Version exakt stimmen;
- das Provider-Modul die Capability deklariert und `GESUND` ist;
- die Capability `VERFUEGBAR`, `PLANEN` und weiterhin
  `standardAktiv=false` ist;
- der Headless Supervisor mit aktueller Health-Evidence und vorhandenen
  Operations-Metriken `bereit=true` ist.

Vor jeder lokalen Aktivierung muss zusaetzlich ein typisierter
`PLANEN_AKTIVIERUNG_VOR_WIRKUNG`-Intent durable bestaetigt werden.
Persistenzfehler oder eine ungueltige Durability-Bestaetigung lassen Modul und
Capability inaktiv. Nach dem asynchronen Durable-Write werden alle
Aktivierungsgates erneut geprueft, bevor lokale Authority entstehen darf.

Der produktive Node-Adapter schreibt die durable Evidence ausserhalb des
Testmodus ausschliesslich unter `D:\AdventureLand-V5`, konkret unter
`runtime/authority/planen/`. Gleiche Aktivierungs-ID mit gleichem Inhalt ist
idempotent; abweichender Inhalt unter derselben ID wird als Kollision
blockiert.

Erfolgreiche lokale Aktivierungen bleiben zusaetzlich mit Aktivierungs-ID,
Policy-ID, Providerbindung, Health-Evidence-IDs und Zeitpunkt im begrenzten
Runtime-Audit sichtbar.

`kernKomponenten()` exponiert fuer die Runtime-eigenen Modul- und
Capability-Register keine aktivierende Methode mehr. Deaktivierung und
authority-reduzierende Statusaenderungen bleiben moeglich.

Der kontrollierte Runtime-Stop deaktiviert zuvor aktivierte
Kompositionsbestandteile. `revalidierePlanenAuthority(...)` entzieht aktive
PLANEN-Authority ebenfalls fail-closed, sobald aktuelle Health-/Operations-,
Provider- oder deny-only Operator-Voraussetzungen verloren gehen.
Gameplay-, Raw-Write- und Action-Authority bleiben auch bei aktiver
PLANEN-Capability `false`.

## Naechster Integrationsschritt

Als naechstes bleibt der produktive Host-/Bootstrap-Pfad fuer **reale**
Health-Evidence und Operations-Metriken zu verdrahten. Dieser Host-Pfad muss
die Revalidierung fortlaufend ausfuehren und darf weiterhin keine Gameplay-
oder Action-Authority erhalten. Danach wird explizit festgelegt, welche der
acht PLANEN-Capabilities im realen Betrieb als erste Canary-Auswahl aktiviert
werden.

Die reine Registrierung oder Aktivierung von PLANEN-Capabilities erteilt keine
Mutationserlaubnis. Mutierende Merchant-Capabilities benoetigen einen
separaten ratifizierten Vertrag und eigene Integrations-/Live-Nachweise mit
Admission, Ressourcen/Fencing, Action-Channel, Budget, durable Intent und
Postcondition/Reconciliation.
