# P0-02 – Recovery- und UNKNOWN-Semantik

**Status:** DONE  
**Stand:** 2026-09-19  
**Basis:** P0-01 Action-Contract-Matrix, verifizierte Effect-Domains/Postconditions und V5-Sicherheitsarchitektur

## Zweck

P0-02 definiert fuer jede wertveraendernde Public Function, was nach Erfolg, Failure, Timeout, Disconnect, Prozessabbruch oder widerspruechlicher Postcondition passieren darf.

Die zentrale Erkenntnis lautet:

```text
Timeout != nicht ausgefuehrt
Disconnect != nicht ausgefuehrt
fehlende Antwort != nicht ausgefuehrt
fehlende Postcondition != nicht ausgefuehrt
```

Nach einem moeglichen Send ist `UNKNOWN` ein persistenter fachlicher Zustand.

## Globale Recovery-Regel

```text
INTENT
  -> PRECONDITION CHECK
  -> LOCK / LEASE / FENCING
  -> DURABLE INTENT
  -> SEND BOUNDARY
  -> SERVER RESULT?
  -> POSTCONDITION
  -> COMMIT
```

Wird nach dem moeglichen Send keine eindeutige Settlement-Aussage erreicht:

```text
UNKNOWN
  -> RECONNECT / REOBSERVE
  -> RECONCILE
  -> COMMITTED
     | NOT_APPLIED
     | PARTIAL
     | STILL_PENDING
     | UNRESOLVED
```

## Retry-Regeln

Nach einem moeglichen Send gilt fuer denselben Intent:

```text
same intent retry = NEVER
```

Folgezustaende:

| Reconciliation-Ergebnis | Erlaubte Folge |
|---|---|
| `COMMITTED` | Commit; niemals erneut senden |
| `NOT_APPLIED` | neuer Intent erst nach frischer Admission |
| `PARTIAL` | Restzustand neu planen; neuer Intent nur fuer den verbleibenden Delta |
| `STILL_PENDING` | warten und erneut beobachten; kein Send |
| `UNRESOLVED` | Quarantaene oder Operator-Policy; kein Send |

Einzige Ausnahme fuer denselben Intent: Das persistente Journal beweist positiv, dass die Send-Grenze **nicht** erreicht wurde (`SEND_NOT_ATTEMPTED`). Auch dann ist vor einem erneuten Versuch eine frische Admission erforderlich.

## Positive Evidence fuer NOT_APPLIED

`NOT_APPLIED` darf niemals aus dem blossen Fehlen eines Erfolgs abgeleitet werden.

Erforderlich ist positive, frische Evidence, dass alle relevanten Effect-Domains noch dem gepinnten Pre-State entsprechen und dass keine konkurrierende Mutation unter derselben Ownership/Fencing-Domaene den Zustand verfälscht.

## Recovery-Klassen

### STATE_REOBSERVE

Fuer normale atomare State-Mutationen.

Beispiele:
- `activate`
- `shift`
- `consume`
- `equip`
- `sell`
- `destroy`
- `craft`

Recovery:
- komplette Postcondition frisch sichtbar -> `COMMITTED`;
- alle relevanten Domaenen positiv unveraendert -> `NOT_APPLIED`;
- nur Teilmenge sichtbar -> `PARTIAL`;
- stale/widerspruechliche Evidence -> `UNRESOLVED`.

### DUAL_VALUE_SETTLEMENT

Fuer direkte Transfers:
- `send_gold`
- `send_item`
- `send_cx`

Sender- und – sofern beobachtbar – Empfaengerzustand werden reconciliert.

Senderseitiger Wertverlust bei unklarem Empfaengerzustand darf niemals einen erneuten Send erlauben.

### ACCOUNT_SHARED_STATE

Fuer Bankmutationen:
- Deposit
- Withdraw
- Store
- Retrieve
- Swap

Character- und accountweiter Bankzustand muessen gemeinsam konsistent sein.

Einseitige oder widerspruechliche Veraenderung -> `PARTIAL`/Recovery, niemals Replay des Originalrequests.

### MIXED_PATH_RECONCILE

`open_bank_pack` besitzt unterschiedliche Gold-/Shell-Pfade.

Der gewaehlte Pfad muss **vor** der Mutation durable feststehen. Recovery folgt danach der jeweiligen Pfadsemantik.

Ist nach moeglichem Send nicht mehr bekannt, welcher Pfad verwendet wurde -> `UNRESOLVED`.

### ROUTER_DELEGATE

`buy` ist ein Router.

Der Router selbst ist kein Settlement-Endpunkt. Vor dem Child-Send muss der konkret gewaehlte Child-ActionContract persistiert sein. Recovery delegiert vollstaendig an dessen RecoveryContract.

### PARTIAL_BATCH_REPLAN

`equip_batch` kann echte Partial Completion erzeugen.

Nach Recovery wird der erreichte Equipment-Zustand frisch gelesen. Der Originalbatch wird niemals wiederholt. Stattdessen wird ein neuer Desired-State-Diff berechnet.

### MULTI_PHASE_Q_RECONCILE

Fuer:
- `upgrade`
- `compound`
- `exchange`
- `play_slots`

`q`/Placeholder sind echte Zwischenzustaende.

Solange der zugehoerige Zwischenzustand sichtbar ist -> `STILL_PENDING`.

Input konsumiert, aber terminaler Output nicht eindeutig -> `PARTIAL` oder `UNRESOLVED`; kein Retry.

### ASYNC_BACKEND_RECONCILE

Fuer Backend-Transaktionen wie:
- `send_mail`
- `buy_with_shells`
- `bless_server`

Ein Request-Result allein ist kein Domain-Commit. Currency-/Item-Debit und Backend-Zieleffekt muessen zusammenpassen.

Besonders bei `send_mail` kann Wert bereits vor einem spaeteren Fehler veraendert sein.

### CLAIM_BACKEND_RECONCILE

`take_mail_item` nutzt einen Claim-Mechanismus.

Claim verbraucht + Item angekommen -> `COMMITTED`.

Claim noch verfuegbar + Inventory unveraendert -> `NOT_APPLIED`.

Claim verbraucht, Item aber nicht beweisbar -> `PARTIAL`/Quarantaene; kein erneuter Claim-Versuch.

### LISTING_STATE_RECONCILE

Fuer Listing-/Stand-/Giveaway-Zustaende.

Beispiele:
- `trade`
- `wishlist`
- `giveaway`
- `open_stand`
- `close_stand`

Fresh Listing State inklusive RID/Preis/Menge ist Teil der Settlement-Evidence.

### RID_TRADE_RECONCILE

Fuer:
- `trade_buy`
- `trade_sell`
- `buy_secondhand`
- `buy_lost_and_found`

RID ist Optimistic Concurrency, keine Idempotency.

Verschwindet oder aendert sich ein Listing nach einem UNKNOWN, wird zuerst der eigene Gold-/Inventory-Delta reconciliert. Danach wird aus der neuen Listing Truth neu geplant. Der alte RID wird niemals erneut gesendet.

### REQUEST_RESPONSE_GAME_RECONCILE

Fuer wertveraendernde Tavern/Game-Aktionen:
- `bet_dice`
- `bet_wheel`
- Poker Join/Act/Sit-In/Sit-Out

Request-ID-Korrelation beweist, welche Antwort zu welchem Request gehoert. Sie beweist **nicht**, dass ein Timeout keine Mutation hatte.

Stake/Stack/Purse und aktiver Game-State sind Teil der Postcondition.

### DEFERRED_SETTLEMENT_RECONCILE

`poker_leave` ist ein eigener Sonderfall.

`leaving:true` bedeutet **nicht COMMITTED**, sondern `STILL_PENDING`.

Commit erst wenn:
1. Seat ist frisch nicht mehr vorhanden;
2. der Stack ist frisch im Character-Gold reconciliert.

Bei Disconnect kann die automatische Auszahlung erst spaeter erfolgen.

### DISABLED

`cave_buy` bleibt aufgrund des noch nicht vollstaendig verifizierten internen `cave_request`-Contracts deaktiviert.

Recovery darf eine deaktivierte Action niemals implizit freischalten.

## Journal-Pflicht vor jeder wertveraendernden Mutation

Mindestens persistieren:

- `intent_id`
- `attempt_id`
- ActionContract-ID
- RecoveryContract-ID
- Knowledge-Snapshot-ID
- gepinnter Pre-State-Fingerprint
- Resource Claims / Fencing
- Send-Boundary-State
- Request-/Correlation-ID falls vorhanden
- Serverresultat falls vorhanden
- Observation-Zeitpunkte
- Postcondition-Evidence

Der Send-Boundary-State ist fuer Recovery kritisch. Ohne positive Evidence, dass kein Send stattfand, wird nach Crash/Timeout nicht erneut gesendet.

## Restart

Jede nicht-terminale persistierte wertveraendernde Arbeit startet nach Prozessneustart als:

```text
RECONCILE_REQUIRED
```

Nicht als:
- RETRY
- RESUME_SEND
- ASSUME_FAILED
- ASSUME_SUCCESS

## Ergebnis

Alle 60 P0-01 Action Contracts besitzen genau einen Recovery Contract:

- **59** `VERIFIED_RECOVERY_POLICY`
- **1** `DISABLED_WITH_ACTION_CONTRACT` (`cave_buy`)

P0-02 ist damit geschlossen.

## Maschinenlesbare Quelle

`v5/wissensbasis/vertraege/recovery-contracts.json`
