# P0-01 – Action-Contract-Matrix wertverändernder Public Functions

**Status:** IN PROGRESS  
**Stand:** 2026-09-19  
**Offizieller Source-Snapshot:** `kaansoral/adventureland_mongodb@ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4`

## Zweck

Diese Matrix ist die Grundlage für V5-Execution, Transaction Journal, Locking und Recovery.

Ein Public Promise ist seit dem CODE-Update vom 24.08.2026 eine echte Serverresultat-Schnittstelle. Trotzdem bleibt ein Prozessabbruch nach möglicher Servermutation ein UNKNOWN-Outcome-Fall. Deshalb beschreibt jeder Contract zusätzlich die fachliche Postcondition und die Recovery-Regel.

## Aktueller Umfang

- **60** wert-/inventar-/equipment-relevante Public Functions erfasst.
- **52** sind gegen den aktuellen offiziellen GitHub-Snapshot strukturell verifiziert.
- **8** sind im aktuellen Live-Funktionskatalog sichtbar, aber im Repo-Snapshot noch nicht vorhanden und bleiben deshalb gesperrt bis zum exakten Live-MCP-Contract.

Die acht Live-only Contracts sind:
`bet_wheel`, `poker_join`, `poker_act`, `poker_leave`, `poker_sit_in`, `poker_sit_out`, `cave_buy`, `destroy_item`.

## Contract-Familien

| Familie | Beispiele | Kritische Eigenschaft |
|---|---|---|
| direct_transfer | send_item, send_gold | nicht idempotent; gemeinsamer FIFO-Kanal `send` |
| bank | bank_store, bank_retrieve | gemeinsamer FIFO-Kanal + accountweiter Bankzustand |
| player_market_trade | trade_buy, trade_sell | RID schützt gegen stale Listing; trotzdem nicht idempotent |
| equipment | equip_batch | partielle Completion möglich |
| item_improvement | upgrade, compound | mehrphasig über `character.q` + Placeholder |
| exchange | exchange | Input wird vor finalem Reward konsumiert; Placeholder/`q` |
| mail | send_mail | Backend-Transaktion; Werte können vor finalem Ergebnis verändert sein |
| premium/server | buy_with_shells, bless_server | Backend-Transaktion + request_id |
| tavern | play_slots, bet_dice | Einsatz wird vor finalem Spielergebnis abgezogen |

## Harte V5-Regeln aus P0-01

1. **Action Channel ist eine Ressource.** Gleichartige FIFO-Deferred-Actions dürfen nicht unkontrolliert parallel laufen.
2. **Serverresult != Domain Settlement.** Transfers benötigen zusätzlich Empfänger-/Bestands-Reconciliation.
3. **UNKNOWN ist terminal für den Send-Versuch, nicht für den Workflow.** Danach beobachten/reconciliieren, nicht blind erneut senden.
4. **Inventory-Indizes sind keine Identität.** Vor jeder Mutation physisches Item neu auflösen.
5. **Mehrphasige q-Actions halten ihre fachliche Transaktion bis Placeholder/q aufgelöst ist.**
6. **equip_batch ist niemals all-or-nothing.** Nach jedem Resultat den gewünschten Endzustand diffen.
7. **RID ist Optimistic Concurrency, keine Retry-Erlaubnis.** Vor jedem neuen Trade-Intent Listing neu lesen.
8. **Live-Doku schlägt alten Source-Snapshot.** Funktionen, die nur live sichtbar sind, bleiben bis zum exakten Live-Contract für Automation gesperrt.

## Besonders relevante verifizierte Sonderfälle

### send_item / send_gold / send_cx

Alle verwenden den Client-Deferred-Kanal `send`. Ein verlorenes Ergebnis darf nicht durch Wiederholung ersetzt werden. V5 muss den Sender- und Empfängerzustand reconciliieren.

### equip_batch

Der Server arbeitet Einträge sequenziell ab. Ein späterer Fehler bricht die Schleife ab, bereits angewendete Equipment-Mutationen bleiben bestehen.

### upgrade / compound

Beide erzeugen `character.q`-Zustand und Placeholder. Eingaben/Scrolls/Offerings werden in einer mehrphasigen Mutation verarbeitet. V5 darf erst nach Auflösung von `q` und Placeholder fachlich committen.

### exchange

Der Input wird konsumiert und ein Placeholder erzeugt, bevor der Reward später entsteht. Das ist eine echte mehrphasige Transaktion.

### send_mail

Der aktuelle Servercode zieht bereits Grundporto ab, bevor manche späteren Prüfungen erfolgen. Bei Item-Mail können zusätzlich Gold und das Slot-0-Item vor dem endgültigen Backend-Ergebnis verändert werden. Dieser Contract ist deshalb ausdrücklich **nicht** als atomare "mail sent oder nichts passiert"-Operation zu behandeln.

### take_mail_item

Der Server verwendet einen Claim-Mechanismus in einer Backend-Transaktion. Das ist ein wertvoller Idempotenz-/Claim-Guard, ersetzt aber bei Disconnect nicht die Live-Reconciliation.

## Noch offen für P0-01-Abschluss

Die acht Live-only Functions müssen aus dem **deployed MCP exact contract** gelesen werden. Der öffentliche Live-Katalog beweist ihre Existenz, der ältere GitHub-Snapshot reicht aber nicht zur genauen Semantik.

Bis dahin bleibt P0-01 `IN_PROGRESS`; V5 darf diese acht Funktionen nicht automatisieren.

## Maschinenlesbare Quelle

`v5/wissensbasis/vertraege/action-contracts.json`
