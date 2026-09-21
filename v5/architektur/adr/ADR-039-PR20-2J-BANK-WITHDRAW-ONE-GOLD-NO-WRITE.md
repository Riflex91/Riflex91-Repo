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

## Alternativen

- `bank_store` als naechsten Kandidaten waehlen: verworfen, weil Store
  zusaetzlich Itemidentitaet, Menge, Stackverhalten, Zielslot und
  Workspace-/Capacity-Reconciliation benoetigt.
- Withdraw sofort mit Capability, Authority und Adapter implementieren:
  verworfen, weil der naechste Schritt zunaechst nur die fachliche
  Settlement-Grenze ratifizieren soll.
- Deposit-Authority oder Deposit-Current-Fence fuer Withdraw wiederverwenden:
  verworfen, weil Withdraw eine eigene Capability- und Intent-Grenze erhalten
  muss und keine Authority aus einem anderen Mutationspfad geerbt werden darf.
- Einen generischen Bank-Mutationspfad fuer Deposit und Withdraw oeffnen:
  verworfen, weil neue produktive Gameplay-Write-Pfade weiterhin einzeln
  ratifiziert werden.

## Konsequenzen

Der neue Core ist gameplay-neutral und erzeugt keine Ausfuehrungsauthority.
Er kann in Unit-/CI-Pruefungen die spaetere fachliche Postcondition fuer
Withdraw festhalten, ohne den Produktionspfad zu oeffnen.

Noch nicht vorhanden sind:

- keine Capability `merchant.bank.gold_auslagern`;
- keine One-Shot-Authority;
- kein Current-Fence fuer Withdraw;
- kein Write-Adapter;
- kein Live-Runner;
- kein direkter produktiver `bank_withdraw`-Aufruf;
- keine Gameplay- oder Raw-Write-Authority;
- keine automatische Ausfuehrung.

Die bereits ratifizierte Action `AL-ACTION-BANK-WITHDRAW` ist
`NON_IDEMPOTENT`, nutzt den FIFO-Kanal `bank` und ist an
`AL-RECOVERY-BANK-WITHDRAW` sowie `AL-VERIFIER-BANK-WITHDRAW` gebunden.
Nach moeglichem Send bleibt Same-Intent-Retry verboten. Ein spaeterer
produktiver Pfad muss UNKNOWN durch frische Character-/Bank-/Inventory-
Evidence reconciliieren.

## Invarianten

- Kandidat exakt `bank_withdraw(1)`;
- fachliche Deltas exakt `character.gold + 1` und `bank.gold - 1`;
- gleiche Character-, Session-, Server-, Lease- und Mount-Bindung;
- Beobachtung nach der Mutation muss neuer sein als der gepinnte Prestate;
- ein neuer Fingerprint ist fuer BESTAETIGT erforderlich;
- einseitige oder widerspruechliche Deltas ergeben niemals COMMIT;
- Same-Intent-Retry bleibt `false`;
- keine produktive Capability in diesem Schritt;
- keine Authority und kein Current-Fence in diesem Schritt;
- kein Write-Adapter und kein Live-Runner in diesem Schritt;
- exakt 0 Gameplay-Writes in diesem Schritt;
- keine breite Runtime-Freigabe und kein Raw-Write-Bypass.

## Migration

Dieser Schritt fuegt nur den Settlement-/Drift-Core, seinen Kandidatenvertrag,
Tests, Roadmap-Verankerung und statische NO-WRITE-Guards hinzu.

Erst nach gruener Exact-Head-CI darf in einem separaten PR eine default-off
Capability mit eigener kurzlebiger One-Shot-Authority und durablem
Current-Fence vorbereitet werden. Auch dieser Folgeschritt bleibt zunaechst
NO-WRITE.

## Rollback

Rollback ist gameplay-neutral, solange dieser ADR-Stand keine Capability,
Authority, Adapter oder Live-Ausfuehrung enthaelt. Der Settlement-Core,
Kandidatenvertrag, Tests und Roadmap-Eintraege koennen gemeinsam entfernt
werden, ohne Spielzustand rueckgaengig machen zu muessen.

Die bereits bestandene Deposit-Evidence und ihre produktive Grenze duerfen
durch einen Withdraw-Rollback weder geaendert noch als Withdraw-Authority
interpretiert werden.
