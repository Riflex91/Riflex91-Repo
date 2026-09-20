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
- `grundlage/vertraege/runtime/durable-planen-authority.json`;
- `architektur/adr/ADR-029-PRODUKTIVER-OPERATIONS-FEED.md`;
- `grundlage/vertraege/runtime/produktions-operations-feed.json`;
- `architektur/adr/ADR-030-KANONISCHE-NODE-HOST-KOMPOSITION.md`;
- `grundlage/vertraege/runtime/node-produktions-host-komposition.json`;
- `architektur/adr/ADR-031-BANK-PLANEN-OBSERVER-CANARY.md`;
- `grundlage/vertraege/runtime/bank-planen-observer-canary.json`.

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

## Produktiver Operations-Feed

Die kanonische produktive Health-Anforderung lautet
`produktiver-speicher`. Ohne explizite Ueberschreibung verwendet die
kanonische Produktionskomposition genau diese kritische Health-ID.

`NodeProduktionsOperationsQuelle` schreibt einen durable Storage-Probe unter
`D:\AdventureLand-V5\runtime\health\storage-probe.json`, misst reale
Write-Latenz und freie Bytes und erzeugt daraus Health-Evidence plus
Operations-Metrik. Dateisystemfehler werden als `KRITISCH` mit Backpressure
gemeldet; Grenzverletzungen werden `DEGRADIERT`.

Der Headless Supervisor verlangt zusaetzlich frische Operations-Metriken.
Zukuenftige Metriken und Metriken aelter als das konfigurierte Maximum
(default 60 Sekunden) gelten nicht als betriebsbereit.

`V5ProduktionsHostController` ist die neue observer-only Host-Grenze. Er
bezieht Health/Metriken ausschliesslich aus der Operations-Quelle, speist die
Metrik in die Runtime, startet den bestehenden Gesamtfreigabe-Bootstrap und
revalidiert PLANEN-Authority bei jedem Tick. Eine PLANEN-Aktivierung ueber den
Host verwendet frisch vom Host erhobene Evidence statt caller-gelieferter
Health-Werte. Faellt die Operations-Quelle aus, wird aktive PLANEN-Authority
fail-closed entzogen.

## Kanonische Node-/Windows-Host-Komposition

`erstelleNodeV5ProduktionsHost(...)` verdrahtet die produktive
Dateisystemwurzel, das deny-only Bedienerprotokoll, die Bediener-Richtlinie,
das durable PLANEN-Aktivierungsprotokoll, die Runtime, Gesamtfreigabe,
Bootstrap, Operations-Quelle und den Host-Controller zu genau einer
observer-only Fassade.

Die Fassade exponiert keinen direkten Runtime-, Register-, Supervisor- oder
Telemetrie-Zugriff. Produktive Aufrufer koennen nur starten, ticken,
PLANEN kontrolliert aktivieren, deny-only Operator-Befehle anwenden, stoppen
und Status lesen.

Deny-only Operator-Befehle werden bounded unter
`runtime/operator/deny.jsonl` gespeichert. Beim Neustart wird die Historie
vollstaendig validiert und in Originalreihenfolge auf einen frischen
`BedienerRichtlinienDienst` angewendet. Capability-Deny und NOTHALT
ueberleben dadurch den Prozessneustart. Ein widerspruechlicher Wirkungsverlauf,
eine kollidierende Befehls-ID oder ein korruptes Log blockiert fail-closed.

Schlaegt die Post-Start-Revalidierung beispielsweise wegen eines bereits
persistierten NOTHALT fehl, wird die gerade gestartete observer-only Runtime
sofort kontrolliert wieder gestoppt.

## Observer-only Bank-PLANEN-Canary

Der erste konkrete Host-Canary ist exakt `merchant.bank.planen` von
`merchant-core-a@1`. Er wird nur ueber die kanonische Node-Host-Fassade
aktiviert und nutzt einen fest verdrahteten read-only Browser-Observer.

Der Observer liest ausschliesslich Merchant-/Session-/Map-Status,
`character.bank`, Inventarbelegung und benoetigte Item-Metadaten aus
`G.items`. Er blockiert ohne Merchant, ohne sichtbaren Bankkontext, bei
totem Charakter oder wenn eine alternative V3/V4-Runtime aktiv ist.

Die Canary-Policy verbietet Bank-Erweiterung explizit. Damit kann die
produktive V5-Bankplanung im Canary nur `KEINE_AKTION`,
`KONSOLIDIEREN` oder `GESPERRT` liefern. Browser-Gameplay-Writes,
Execution-Authority und breite Runtime-Freigabe bleiben null bzw. `false`.

Der einmalige Nachweis wird durable unter
`D:\AdventureLand-V5\runtime\canary\bank-planen\latest.json`
gespeichert. Rohe Account-IDs werden dabei nicht persistiert; der Report
verwendet nur eine SHA-256-Bindung.

CI prueft den Canary mit:

`npm run bank-planen-canary:pruefen`

Der reale read-only Lauf erfolgt mit:

`npm run bank-planen-canary:live -- --cdp http://127.0.0.1:9222/`

## Naechster Integrationsschritt

Nach gruenem CI ist der naechste fehlende Nachweis erstmals eine echte
Adventure-Land-Beobachtung: ein eingeloggter Merchant muss manuell in einem
Bankkontext stehen, damit `character.bank` read-only erfasst werden kann.
Dieser Test sendet weiterhin keinerlei Gameplay-Write.

Die reine Registrierung oder Aktivierung von PLANEN-Capabilities erteilt keine
Mutationserlaubnis. Mutierende Merchant-Capabilities benoetigen einen
separaten ratifizierten Vertrag und eigene Integrations-/Live-Nachweise mit
Admission, Ressourcen/Fencing, Action-Channel, Budget, durable Intent und
Postcondition/Reconciliation.
