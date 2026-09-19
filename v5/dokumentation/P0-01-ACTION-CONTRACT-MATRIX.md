# P0-01 – Action-Contract-Matrix wertverändernder Public Functions

**Status:** DONE  
**Stand:** 2026-09-19  
**Offizieller Repo-Snapshot:** `kaansoral/adventureland_mongodb@ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4`  
**Zusätzliche Live-Evidence:** aktuell deployte offizielle CODE-Dokumentation und `https://adventure.land/js/runner_functions.js`

## Zweck

Diese Matrix ist die Grundlage für V5-Execution, Transaction Journal, Locking und Recovery.

Ein Public Promise ist seit dem CODE-Update vom 24.08.2026 eine echte Serverresultat-Schnittstelle. Trotzdem bleibt ein Prozessabbruch oder Timeout nach möglicher Servermutation ein UNKNOWN-Outcome-Fall. Deshalb beschreibt jeder Contract zusätzlich fachliche Postconditions und eine Recovery-Regel.

## Abschlussstand

Alle **60** wert-/inventar-/equipment-relevanten Public Functions sind abschließend klassifiziert:

- **53** Contracts sind gegen den offiziellen GitHub-Source-Snapshot verifiziert.
- **6** zusätzliche Contracts sind gegen die aktuell deployte offizielle Live-CODE-Oberfläche und den aktuell deployten `runner_functions.js`-Clientcontract verifiziert:
  - `bet_wheel`
  - `poker_join`
  - `poker_act`
  - `poker_leave`
  - `poker_sit_in`
  - `poker_sit_out`
- **1** Contract bleibt bewusst **explizit deaktiviert**:
  - `cave_buy`

Damit ist P0-01 geschlossen: Jede erfasste wertverändernde Function besitzt entweder einen verifizierten Contract oder einen expliziten Automation-Deny.

## Wichtige Korrektur gegenüber dem Zwischenstand

`destroy_item` ist **nicht** live-only.

Der offizielle Repo-Snapshot enthält bereits:

```javascript
function destroy_item(i){return destroy(i)}
```

Damit ist `destroy_item` ein rückwärtskompatibler Alias von `destroy` und übernimmt dessen destruktiven, nicht-idempotenten Contract einschließlich Inventory-Identity-Revalidation und `RECONCILE_NO_BLIND_RETRY`.

## Live-verifizierte Tavern-Contracts

### bet_wheel

Der deployte Clientcontract:

- Signatur: `bet_wheel(side, gold, timeout_ms)`
- Socket-Event: `bet`
- Payload enthält `type:"wheel"`, `side`, `gold`, `request_id`
- Korrelation: `game_response` mit exakt derselben `request_id` und `place:"wheel"`
- Default-Timeout: 60.000 ms
- Erfolgsresultat enthält u. a. `won`, `side`, `result`, `slice`, `wager`, `payout`, `net`, `edge`
- Verlust ist ein normales Resultat mit `won:false`
- Timeout/Disconnect erlaubt **keinen Blind-Retry**

Die Live-Dokumentation nennt außerdem die serverseitige Einsatzspanne von 10.000 bis 100.000.000.000 Gold und verweigert einen zweiten Spin, solange der eigene Spin noch läuft.

### Poker – gemeinsamer Transportcontract

Alle fünf mutierenden Poker-Funktionen verwenden den deployten Helper `poker_request`:

- Socket-Event: `poker`
- pro Request `randomStr(30)` als `request_id`
- Antwort: `game_response`
- Korrelation: exakt gleiche `request_id` und `place:"poker"`
- Default-Timeout: 10.000 ms
- `response.failed` wird als Failure behandelt

Timeout bedeutet für V5 trotzdem **UNKNOWN**, weil der Server die Aktion bereits verarbeitet haben kann.

#### poker_join

- `poker_join(gold, seat, timeout_ms)`
- Event `join`
- Buy-in beziehungsweise Rebuy
- Gold verlässt während des Sitzens den Character-Purse und liegt im Poker-Stack
- ein Seat pro Account
- Rebuy während einer Hand wird verweigert
- Postcondition muss Purse + Stack + Seat/Table gemeinsam reconciliieren

#### poker_act

- `poker_act(action, amount, timeout_ms)`
- Event `act`
- erlaubte Actions: `fold|check|call|bet|raise|allin`
- nur aktueller Acting Seat darf handeln
- Postcondition muss frischen Hand-/Stack-/Pot-State prüfen
- kein Wiederholen nach Timeout ohne Reconciliation

#### poker_leave

- `poker_leave(timeout_ms)`
- Event `leave`
- zwischen Händen sofortige Auszahlung
- während einer Hand kann das Resultat nur `leaving:true` bedeuten
- `leaving:true` ist **noch kein fachlicher Commit**
- Transaction bleibt offen, bis Seat entfernt und Stack wieder im Purse reconciliert wurde
- bei Disconnect kann der Stack erst nach fünf Minuten automatisch ausgezahlt werden

#### poker_sit_out

- Event `sit_out`
- eigener Seat/Stack bleiben zunächst erhalten
- Spieler wird nicht in neue Hände gedealt
- nach fünf Minuten Sit-out kann automatische Auszahlung erfolgen
- der delayed cash-out gehört zum späteren Reconciliation-Modell

#### poker_sit_in

- Event `sit_in`
- Resultat `out:false`
- benötigt mindestens einen Big Blind auf dem Seat
- frischer Seat-/Stack-State ist Postcondition

## cave_buy – bewusst deaktiviert

Die Live-Dokumentation belegt:

- `cave_buy(room)`
- öffentlicher Wrapper: `parent.cave_request("buy", { room: room })`
- Cave-Merchant muss innerhalb von 160 Pixeln sein
- Bezahlung aus gemeinsamem Cave-Gold
- ein zufälliges ursprüngliches Party-Mitglied erhält das Item
- Resultat enthält Empfänger, Item, ausgegebenes Gold und `currency:"cave_gold"`
- einmal verkauftes Shop-Item kann nicht erneut gekauft werden

**Nicht öffentlich verifizierbar** ist derzeit der interne `parent.cave_request`-Contract: exaktes Socket-Event, Request-Korrelation und Timeout-/Disconnect-Verhalten sind in den öffentlich zugänglichen Live-CODE-Quellen nicht offengelegt.

Daher gilt:

```text
cave_buy = EXPLICITLY_DISABLED_PENDING_EXACT_CONTRACT
```

Es wird **nicht** aus den bekannten Fachwirkungen auf unbekannte Transportsemantik geschlossen.

## Harte V5-Regeln aus P0-01

1. **Action Channel ist eine Ressource.**
2. **Serverresult != Domain Settlement.**
3. **UNKNOWN ist terminal für den Send-Versuch, nicht für den Workflow.**
4. **Inventory-Indizes sind keine langlebige Identität.**
5. **Mehrphasige q-Actions bleiben bis zur Postcondition fachlich offen.**
6. **equip_batch ist nicht all-or-nothing.**
7. **RID ist Optimistic Concurrency, keine Retry-Erlaubnis.**
8. **Production kann vor dem öffentlichen Repo-Snapshot liegen; dann muss der deployte Contract separat belegt oder die Action deaktiviert werden.**
9. **Ein explizit deaktivierter Contract darf weder Planung noch Execution automatisch freischalten.**
10. **Timeout/Disconnect einer wertverändernden Request-ID-Action wird als UNKNOWN reconciliert, nicht erneut gesendet.**

## Übergabe an P0-02

P0-01 beantwortet **was** jede Action technisch und fachlich verändert und wie ihr unmittelbarer Contract aussieht.

P0-02 formalisiert darauf aufbauend für jede Action-Familie:

- Recovery-Klasse;
- UNKNOWN-State;
- Reobserve-Quellen;
- Settlement-Kriterium;
- erlaubte Replan-/Retry-Bedingung;
- Operator-required-Pfad.

`cave_buy` bleibt auch während P0-02 vollständig disabled.

## Maschinenlesbare Quelle

`v5/wissensbasis/vertraege/action-contracts.json`
