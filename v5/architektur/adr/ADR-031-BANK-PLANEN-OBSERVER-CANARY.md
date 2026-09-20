# ADR-031 – Observer-only Bank-PLANEN-Canary

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

ADR-030 stellt eine restart-sichere kanonische Node-Produktionshost-Komposition
bereit. Der naechste Nachweis soll erstmals eine konkrete produktive
`PLANEN`-Capability gegen echte Adventure-Land-Beobachtung aktivieren, ohne
dabei eine Gameplay-Aktion oder eine `MUTIEREN`-Authority einzufuehren.

Als erster Canary wird `merchant.bank.planen` gewaehlt. Der Bankplaner ist
fuer diesen Zweck geeignet, weil seine produktive Entscheidung rein planend
bleibt und nur `KEINE_AKTION`, `KONSOLIDIEREN`, `ERWEITERN` oder `GESPERRT`
liefert. Im Canary ist Erweiterung zusaetzlich durch Policy deaktiviert.

## Entscheidung

1. Der erste reale PLANEN-Canary verwendet genau die Capability
   `merchant.bank.planen` von `merchant-core-a@1`.
2. Der Browser-Observer verwendet einen festen, im Quelltext definierten
   read-only Ausdruck. Der Aufrufer kann keinen frei waehlbaren Browser-
   Ausdruck einspeisen.
3. Der Browser-Observer liest ausschliesslich:
   - Account-Bindung aus `user_id` oder `character.owner`;
   - Merchant-/Session-/Map-Status;
   - `character.bank` fuer sichtbare `itemsN`-Packs;
   - Inventarbelegung;
   - Item-Metadaten aus `G.items[name]`, insbesondere das Stacklimit `s`.
4. Der Observer blockiert, wenn:
   - kein Adventure-Land-Codekontext vorhanden ist;
   - der Charakter kein Merchant ist;
   - der Charakter tot ist;
   - kein beobachtbarer Bankkontext vorhanden ist;
   - eine alternative V3/V4-Runtime aktiv ist;
   - Cardinality-/Datengrenzen verletzt werden.
5. Der neue Browser-Observer darf keine Adventure-Land-Write-API enthalten.
   Insbesondere sind Bank-, Trade-, Craft-, Upgrade-, Combat-, Movement-,
   Equipment-, Send- und Raw-Socket-Writes verboten.
6. Der Canary aktiviert `merchant.bank.planen` ausschliesslich ueber
   `erstelleNodeV5ProduktionsHost(...)` und damit ueber dieselben durable
   PLANEN-, Operator-, Operations- und Bootstrap-Gates wie der produktive
   Host.
7. Die rohe Account-ID wird nicht durable geschrieben. Der Planning-Snapshot
   bindet den Account nur als SHA-256-Pseudonym.
8. Die Canary-Richtlinie setzt `erweiterungErlaubt=false` und uebergibt keine
   Erweiterungsoptionen oder Budgets. Deshalb kann dieser Canary keine
   Bank-Erweiterung planen.
9. Die erlaubten fachlichen Resultate des Canary sind damit
   `KEINE_AKTION`, `KONSOLIDIEREN` oder `GESPERRT`.
10. Der Canary schreibt nur seinen Evidence-Report durable nach
    `runtime/canary/bank-planen/latest.json`.
11. Der Report muss `browserGameplayWrites=0`,
    `hostGameplayAutoritaet=false`, `hostRawWriteAutoritaet=false`,
    `hostActionAuthority=false`, `ausfuehrungsAutoritaet=false` und
    `breiteRuntimeFreigabe=false` enthalten.
12. Der Live-Zugriff verwendet ausschliesslich den bestehenden
    loopback-only CDP-Pfad. Default ist `http://127.0.0.1:9222/`.
13. Der Canary stoppt den V5-Host nach dem einmaligen Planungsnachweis immer
    wieder.

## Alternativen

- Als ersten Canary eine mutierende Bankaktion verwenden: verworfen, weil
  dafuer Action-/Admission-/Recovery-/Settlement-Authority erforderlich ist.
- Einen generischen Browser-Evaluate-Port fuer beliebige Ausdruecke
  einfuehren: verworfen, weil dies die gehärtete Hostgrenze umgehen koennte.
- Bank-Erweiterung bereits im Canary erlauben: verworfen, weil sie einen
  separaten Kosten-/Budget-/Action-Nachweis benoetigt.
- Rohes Account- oder Character-Identity-Material durable speichern:
  verworfen; fuer den Planungsnachweis reicht eine pseudonyme Bindung.
- Den vorhandenen V3-Bankplanner wiederverwenden: verworfen; der Canary muss
  die produktive V5-Capability und ihren V5-Host-Pfad nachweisen.

## Konsequenzen

- Nach gruenem CI ist der naechste offene Nachweis nicht mehr synthetisch:
  `character.bank` muss in einem echten Adventure-Land-Merchant-Kontext
  beobachtet werden.
- Dieser reale Test ist weiterhin zero-write und veraendert weder Bank noch
  Inventar noch Charakterzustand.
- Der Test erfordert einen eingeloggten Merchant in einem Bankkontext und
  einen lokalen CDP-Endpunkt.
- Das Ergebnis wird gleichzeitig auf stdout und durable unter
  `D:\AdventureLand-V5\runtime\canary\bank-planen\latest.json`
  bereitgestellt.
- Ein erfolgreicher Observer-Canary erteilt keine breite Runtime- oder
  Execution-Freigabe.

## Invarianten

- Capability ist exakt `merchant.bank.planen`.
- Provider ist exakt `merchant-core-a@1`.
- Browserausdruck ist fest und read-only.
- Browser-Gameplay-Writes = 0.
- Erweiterung im Canary ist verboten.
- Alternative V3/V4-Runtime blockiert.
- Rohe Account-ID wird nicht durable geschrieben.
- `ausfuehrungsAutoritaet=false`.
- `gameplayAutoritaet=false`.
- `rawWriteAutoritaet=false`.
- `actionAuthority=false`.
- `breiteRuntimeFreigabe=false`.

## Migration

Der Canary ist ein explizites Werkzeug und wird nicht automatisch beim
Runtime- oder Host-Start ausgefuehrt. CI prueft Syntax, synthetische
Integrationsfaelle und den statischen Zero-Write-Vertrag.

Der reale Live-Aufruf erfolgt erst manuell, wenn der Benutzer den Merchant in
einen beobachtbaren Bankkontext gebracht hat.

## Rollback

Rollback entfernt Canary-Observer, Runner, Vertrag und Evidence-Datei.
Produktionshost, PLANEN-Authority und bestehende durable Operator-/Audit-
Evidence bleiben davon unberuehrt.
