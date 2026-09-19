# P0-03 – Bank-Concurrency mehrerer eigener Characters

**Status:** DONE  
**Stand:** 2026-09-19  
**Offizieller Source-Snapshot:** `kaansoral/adventureland_mongodb@ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4`  
**Kernquellen:** `node/server.js`, `js/runner_functions.js`

## Forschungsfrage

Wie muss V5 Bankzugriffe mehrerer eigener Characters koordinieren, damit accountweiter Bankzustand, Character-Inventar und Recovery auch bei Disconnects, Restarts und parallelen Agenten konsistent bleiben?

## Source-Befund

### 1. Adventure Land besitzt bereits eine accountweite Single-Mount-Semantik

Beim Bank-Mount liest der Server den Account-Owner und den Character in einer Transaktion.

Der Account besitzt dabei die Felder:

```text
owner.server
owner.mounted_to
```

Ein Mount wird abgewiesen, wenn bereits ein inkompatibler Bank-Mount existiert:

```text
owner.server ist gesetzt
und
(owner.server != aktueller Server
 oder owner.mounted_to != aktueller Character)
```

Der Server erzeugt dann `already_in_bank`; clientseitig wird dies als `bank_opx` sichtbar und kann den bereits gemounteten Character nennen.

**Folge:** Bank-Concurrency ist fachlich accountweit. Zwei eigene Characters besitzen nicht zwei unabhaengige Bank-Sessions.

### 2. Mount erzeugt eine accountweite Bankkopie im aktiven Character

Nach erfolgreichem Mount wird aus `owner.info` ein `player.user` aufgebaut:

- Gold;
- Rewards;
- Unlocks;
- alle `items*`-Bankpacks.

Bankoperationen arbeiten danach auf diesem gemounteten In-Memory-State und dem lokalen Character-State.

### 3. Persistenz ist an den aktuellen Mount-Owner gebunden

`sync_call`, `unmount_call` und `stop_call` schreiben Bankdaten nur dann zum Account zurueck, wenn:

```text
owner.server == server_id
UND
owner.mounted_to == aktueller Character
```

Beim erfolgreichen `unmount_call` werden `owner.server` und `owner.mounted_to` geleert und der Bankzustand persistiert.

Erst danach wird der Character zum Exit-Ziel transportiert.

### 4. Bank-Actions teilen lokal einen FIFO-Channel

Die CODE-Funktionen:

- `bank_deposit`
- `bank_withdraw`
- `bank_store`
- `bank_retrieve`
- `bank_swap`
- Gold-Pfad von `open_bank_pack`

verwenden den lokalen Deferred-Channel `bank`.

Dieser Channel serialisiert nur den jeweiligen Character-Client. Er ist **kein accountweiter Multi-Character-Lock**.

### 5. Shell-Pack-Unlock ist asynchron

Der Shell-Pfad von `open_bank_pack` kann zunaechst `in_progress` liefern.

Der Server fuehrt anschliessend eine Backend-Transaktion aus und liefert erst spaeter:

- `bank_new_pack`
- oder `bank_new_pack_failed`.

Damit darf Bank-Autoritaet waehrend dieses Backend-Zustands nicht an einen anderen Character uebertragen werden.

## V5-Entscheidung

### Account Coordinator ist Bank-Owner

Bankautoritaet gehoert **nicht** dem Character Agent.

Einzig der Account Coordinator vergibt:

```text
account:bank
```

als accountweite Lease.

### Lease-Scope

Die Lease umfasst die **gesamte Banksitzung**:

```text
ACQUIRE LEASE
  -> Bewegung / Transport zur Bank
  -> Server-Mount
  -> frischen Bankzustand laden
  -> Banktransaktionen
  -> alle UNKNOWN/PARTIAL/PENDING-Zustaende klaeren
  -> graceful Unmount
  -> erwarteten Exit beobachten
  -> RELEASE LEASE
```

Die Lease wird also nicht nur fuer einzelne `bank_store`-Calls gehalten.

### Lease-Zustand

Mindestens:

```text
ACQUIRING
ACTIVE
RECOVERY_PENDING
RELEASING
RELEASED
QUARANTINED
```

Persistierte Lease-Evidence umfasst mindestens:

- Account-ID;
- Owner-Character-ID;
- Lease-Epoch;
- Fencing-Token;
- State;
- AcquiredAt;
- LastHeartbeatAt;
- Purpose;
- Server Region;
- Server Identifier.

## Zwei getrennte Schutzschichten

Vor jedem Bank-Write muessen gleichzeitig gelten:

1. aktuelle **accountweite `account:bank` Lease**;
2. lokaler **`bank` Action-Channel Claim** des Lease-Owners.

```text
Account Coordinator
  -> account:bank Lease + Epoch/Fencing
       -> Character Agent
            -> local channel:bank
                 -> Execution Adapter
                      -> Adventure Land bank write
```

Ein Character mit stale Epoch darf nicht mehr schreiben, selbst wenn sein Browser noch einen Bankzustand zeigt.

## External Fencing

V5-Fencing ist lokal notwendig, aber nicht die letzte Wahrheit.

Adventure Land selbst besitzt mit:

```text
owner.server
owner.mounted_to
bank_opx / already_in_bank
```

eine externe Fence-Schicht.

Wenn die lokale Lease Character A sagt, aber der Server Character B als Bank-Owner meldet:

```text
EXTERNAL_FENCE_MISMATCH
-> RECOVERY_PENDING
-> keine Bankmutation
-> Reconciliation
```

V5 darf den Serverkonflikt niemals mit Force/Retry umgehen.

## Manuelle oder unmanaged Characters

Ein Benutzer kann theoretisch ausserhalb des V5-Coordinators denselben Account benutzen.

Meldet der Server einen Bank-Owner, der V5 nicht als aktuellen Lease-Owner kennt:

```text
BANK_CAPABILITY -> QUARANTINED
```

bis die externe Belegung sicher beendet ist.

V5 konkurriert nicht aktiv mit manueller Account-Nutzung um Bankownership.

## Disconnect / Crash

Disconnect oder Prozesscrash ist **kein Lease-Release-Beweis**.

Stattdessen:

```text
ACTIVE
-> Holder verloren
-> RECOVERY_PENDING
-> Holder-Liveness / Server-Mount / Bankzustand reconciliieren
-> erst danach neuer Owner
```

Nach einem Coordinator-Restart werden nicht-terminale Bank-Leases als `RECONCILE_REQUIRED` geladen.

## Graceful Release

Eine Lease darf erst freigegeben werden, wenn:

- keine Banktransaktion mehr `UNKNOWN`, `PARTIAL`, `STILL_PENDING` oder `UNRESOLVED` ist;
- kein Shell-Pack-Backend mehr in progress ist;
- erwarteter Bank-Exit erfolgreich beobachtet wurde;
- `character.bank` nicht mehr aktiv ist;
- keine lokale Bank-Action mehr in flight ist.

Das blosse Verschwinden einer UI oder eines lokalen Feldes nach einem Fehler reicht nicht als Release-Beweis.

## Snapshot-Freshness

Bankdaten werden an die Mount-/Lease-Epoch gebunden.

```text
BankSnapshot {
  lease_epoch,
  owner_character,
  observed_at,
  server,
  packs,
  gold,
  ...
}
```

Nach:

- neuem Mount;
- Handover;
- Restart;
- Bank-Conflict;
- Wissens-/Serverdrift

muss ein neuer BankSnapshot entstehen.

Ein Snapshot einer alten Lease-Epoch darf keine Mutation autorisieren.

## Shell-Bankpack

Der Shell-Pfad von `open_bank_pack` behaelt:

- account:bank Lease;
- lokalen bank-Channel;
- Transaction Journal;

bis Backend-Terminalresultat **und** frische Currency-/Pack-Postcondition vorliegen.

Timeout/Disconnect folgt P0-02:

```text
UNKNOWN
-> RECONCILE
-> kein Blind-Retry
```

## Harte Invarianten

1. Bankownership ist accountweit.
2. Maximal eine aktive `account:bank` Lease je Account.
3. Raw Bank Write braucht Account-Lease + lokalen Bank-Channel.
4. Fencing-Epoch wird unmittelbar vor jedem Write erneut geprueft.
5. Disconnect/Crash gibt die Lease nicht automatisch frei.
6. `bank_opx` ist externes Fence und wird nie umgangen.
7. BankSnapshot ist an Mount-/Lease-Epoch gebunden.
8. Lease-Handover ist bei nicht-terminaler Banktransaktion verboten.
9. Shell-Pack `in_progress` haelt Lease und Channel.
10. Unmanaged/manual Bankownership fuehrt zu Quarantaene statt Konkurrenz.

## Architekturfolge

Der minimale Account Coordinator muss deshalb **vor Merchant Core A** existieren.

Merchant darf Bankarbeit nicht direkt als Character-Utility behandeln. Er erzeugt Account-Demand; der Coordinator waehlt genau einen Character als Bank-Executor und vergibt die Lease.

## Ergebnis

P0-03 ist geschlossen.

Die reale Adventure-Land-Serversemantik bestaetigt und verschaerft unsere geplante V5-Architektur:

**Account Coordinator = Bankauthority. Character Agent = temporaerer Executor unter Lease/Fencing.**

## Maschinenlesbare Quelle

`v5/wissensbasis/vertraege/bank-concurrency.json`
