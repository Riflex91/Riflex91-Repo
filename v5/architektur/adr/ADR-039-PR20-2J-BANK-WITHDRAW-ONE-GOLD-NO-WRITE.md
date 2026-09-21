# ADR-039 – PR20.2j Bank Withdraw One-Gold NO-WRITE Candidate

**Status:** RATIFIZIERT  
**Datum:** 2026-09-21

## Kontext

Der reale One-Shot-Pfad `bank_deposit(1)` ist produktiv bestanden und seine
Evidence ist in PR #565 gemerged. PR20.2 bleibt fuer die restlichen
Bankfaehigkeiten offen.

Als naechster enger Kandidat werden `bank_withdraw` und `bank_store`
verglichen. Withdraw besitzt wie Deposit nur die fachlichen Effektdomaenen
`gold` und `bank_gold`. Store benoetigt dagegen zusaetzlich exakte
Itemidentitaet, Mengen-, Stack- und Zielslot-/Workspace-Reconciliation.

## Entscheidung

Der naechste Kandidat ist exakt `bank_withdraw(1)`.

Dieser Schritt implementiert ausschliesslich:

- einen authority-freien Settlement-/Drift-Core;
- einen maschinenlesbaren NO-WRITE-Kandidatenvertrag;
- Tests fuer Bereitschaft, exaktes Delta, stale Evidence und Bindungsdrift.

Ein COMMIT-Modell gilt nur bei derselben Character-, Session-, Server-,
Lease- und Mount-Bindung, einer neueren Beobachtung, neuem Fingerprint und
gleichzeitig exakt:

- `character.gold + 1`;
- `bank.gold - 1`.

Einseitige Deltas, stale Beobachtungen oder Bindungsdrift sind kein Erfolg.

## Harte Grenze dieses Schritts

Nicht eingefuehrt werden:

- keine Capability `merchant.bank.gold_auslagern`;
- keine One-Shot-Authority;
- kein Current-Fence fuer Withdraw;
- kein Write-Adapter;
- kein Live-Runner;
- kein direkter `bank_withdraw`-Aufruf;
- keine Gameplay- oder Raw-Write-Authority;
- keine automatische Ausfuehrung.

Der Pfad bleibt damit gameplay-neutral und rollback-sicher.

## Recovery

Die bereits ratifizierte Action `AL-ACTION-BANK-WITHDRAW` ist
`NON_IDEMPOTENT`, nutzt den FIFO-Kanal `bank` und ist an
`AL-RECOVERY-BANK-WITHDRAW` sowie `AL-VERIFIER-BANK-WITHDRAW` gebunden.
Nach moeglichem Send bleibt Same-Intent-Retry verboten. Ein spaeterer
produktiver Pfad muss UNKNOWN durch frische Character-/Bank-/Inventory-
Evidence reconciliieren.

## Naechster Schritt

Erst nach gruener Exact-Head-CI darf in einem separaten PR eine
default-off Capability mit eigener kurzlebiger One-Shot-Authority und
durablem Current-Fence vorbereitet werden. Auch dieser Folgeschritt bleibt
zunaechst NO-WRITE.
