# ADR-040 – PR20.2k Bank Withdraw Authority + Current-Fence NO-WRITE

**Status:** RATIFIZIERT  
**Datum:** 2026-09-21

## Kontext

PR20.2j hat `bank_withdraw(1)` als naechsten engen Bank-Kandidaten mit einem
authority-freien Settlement-/Drift-Core ratifiziert. Der Deposit-One-Shot ist
bereits real bestanden, darf aber keine Authority oder Transaktionsidentitaet
an Withdraw vererben.

Withdraw bleibt eine eigene non-idempotente Action mit eigener
Action/Recovery/Verifier-Bindung und Same-Intent-Retry-Verbot.

## Entscheidung

`bank_withdraw(1)` erhaelt in PR20.2k:

- die eigene default-off MUTIEREN-Capability
  `merchant.bank.gold_auslagern` unter dem bestehenden Single Owner
  `merchant-bank-core@1`;
- eine eigene maximal einmal verwendbare, hoechstens 2000 ms gueltige
  One-Shot-Authority;
- durable Authority-Evidence unter
  `runtime/authority/mutieren/bank-withdraw/`;
- einen eigenen durable Transaction-Current-Fence unter
  `runtime/transactions/bank-withdraw/current.json`;
- gegenseitige Ausschliessung gegen offene Equip-, Deposit- und weitere
  Withdraw-Authorities;
- gemeinsame Bank-Lease-Grenzen mit Deposit, ohne dessen Current-Pointer
  wiederzuverwenden.

Dieser Schritt enthaelt keinen Adventure-Land-Send.

## Alternativen

- Deposit-Authority oder Deposit-Current-Fence wiederverwenden: verworfen,
  weil Action-Identitaet und UNKNOWN-Reconciliation sonst vermischt wuerden.
- Eine generische `merchant.bank.mutieren`-Capability einfuehren:
  verworfen, weil dadurch die kleinste freizugebende Wirkung verbreitert
  wuerde.
- Withdraw direkt mit Write-Adapter und Live-Runner verbinden: verworfen,
  weil read-only Preflight und Admission-Shadow noch fehlen.
- Gar keinen Current-Fence vorsehen: verworfen, weil eine offene oder nach
  Restart unbekannte Transaktion neue Same-Channel-Arbeit fail-closed
  blockieren muss.

## Konsequenzen

Die Produktionskomposition kennt nun drei getrennte default-off
MUTIEREN-Capabilities: Equip, Bank-Deposit und Bank-Withdraw. Registrierung
allein erzeugt weiterhin keine Gameplay-, Raw-Write- oder Action-Authority.

Withdraw-Authority kann nur nach durablem Audit entstehen, ist genau einmal
verwendbar, verfaellt schnell und wird bei Revalidation/Stop fail-closed
entzogen. Der separate Current-Fence kann eine offene Withdraw-Transaktion
dauerhaft markieren und blockiert neue Bankarbeit, ohne einen Send
auszufuehren.

## Invarianten

- `merchant.bank.gold_auslagern` bleibt `standardAktiv=false`;
- maximal eine Verwendung pro Withdraw-Authority;
- maximale Authority-Lebensdauer 2000 ms;
- durable Evidence vor Authority-Ausstellung;
- Restart reaktiviert keine alte Authority;
- eigener Withdraw-Current-Pointer, kein Deposit-Alias;
- offene Deposit- oder Withdraw-Transaktion blockiert neuen Bankstart;
- offene Equip-/Deposit-/Withdraw-Authority ist gegenseitig ausgeschlossen;
- kein `bank_withdraw(...)`-Aufruf in diesem Schritt;
- kein Raw-Socket-`.emit(...)`;
- kein Write-Adapter;
- kein Live-Runner;
- exakt 0 neue Gameplay-Writes;
- Same-Intent-Retry bleibt `false`.

## Migration

Nach gruener Exact-Head-CI wird als naechstes ein read-only
Withdraw-Preflight mit Bank-Lease/Fencing und ein NO-WRITE Admission-Shadow
vorbereitet. Erst nach dessen eigener Evidence darf ein separater
Write-Adapter/Live-Runner-PR erwogen werden.

## Rollback

Capability-Definition, Withdraw-Authority, durable Auditadapter und
Withdraw-Current-Fence koennen gemeinsam entfernt werden. Da PR20.2k keinen
Adventure-Land-Send und keinen Gameplay-Write ausfuehrt, ist kein
Spielzustands-Rollback erforderlich.

Deposit-Evidence und der bestandene Deposit-Live-Pfad bleiben davon
unveraendert.
