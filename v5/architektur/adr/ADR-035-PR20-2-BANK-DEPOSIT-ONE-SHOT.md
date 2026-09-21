# ADR-035 – PR20.2 Bank Deposit One-Shot

**Status:** RATIFIZIERT  
**Datum:** 2026-09-21

## Kontext

PR20.1 hat den ersten produktiven Equip-Einmal-Write erfolgreich
nachgewiesen. PR20.2a hat fuer den ersten Bankkandidaten
`bank_deposit(1)` bereits einen authority-freien Settlement-/Drift-Core
ratifiziert. Fuer die weitere Produktivierung fehlt damit eine enge,
default-off Mutationsgrenze, die weder die acht bestehenden
`merchant-core-a@1`-PLANEN-Capabilities aufweicht noch bereits einen
Bank-Write-Pfad oeffnet.

Bankmutationen sind nicht idempotent, verwenden den gemeinsamen
Bank-FIFO-Kanal und benoetigen accountweite Bank-Lease/Fencing-Evidence.
Deshalb darf die erste produktive Bank-Capability nur als exakt benannter,
kurzlebiger One-Shot-Pfad mit durablem Current-Fence eingefuehrt werden.

## Entscheidung

Der erste produktive Bank-Mutationspfad ist ausschliesslich
`bank_deposit(1)`.

Die Mutation gehoert **nicht** zu `merchant-core-a@1`. Dieses Modul bleibt
gemaess ADR-026 exakt der Owner der acht PLANEN-Capabilities. Fuer die
Mutation wird der separate Single Owner `merchant-bank-core@1` eingefuehrt.

Er stellt genau eine default-off Capability bereit:

- `merchant.bank.gold_einlagern`
- Modus `MUTIEREN`
- `standardAktiv=false`

Die Capability ist exakt an
`AL-ACTION-BANK-DEPOSIT`,
`AL-RECOVERY-BANK-DEPOSIT` und
`AL-VERIFIER-BANK-DEPOSIT` gebunden.

Eine Registrierung aktiviert weder Modul noch Capability und erteilt keine
Gameplay- oder Raw-Write-Authority. Eine spaetere Mutation benoetigt eine
durable protokollierte One-Shot-Authority mit maximal einer Verwendung und
maximal 2 Sekunden Lebensdauer.

PR20.2b fuehrt noch keinen Bank-Write-Adapter und keinen Live-Runner ein.
Der Preflight ist read-only.

## Alternativen

- `merchant-core-a@1` direkt um eine MUTIEREN-Capability erweitern:
  verworfen, weil damit die klare PLANEN-/MUTIEREN-Ownergrenze aufgeloest
  wuerde.
- Eine dauerhafte Bank-Mutationsauthority aktivieren: verworfen, weil der
  erste produktive Banknachweis bewusst auf genau einen moeglichen Intent
  begrenzt bleiben muss.
- Bereits in diesem Schritt einen `bank_deposit`-Adapter und Live-Runner
  einfuehren: verworfen, solange persistente accountweite Lease-
  Restart-Reconciliation und die konkrete Admission-Orchestrierung noch
  nicht vollstaendig verdrahtet und Fault-/Shadow-geprueft sind.
- Den bestehenden Bank-PLANEN-Canary als Mutation-Authority verwenden:
  verworfen, weil PLANEN-Evidence keine Write-Authority erzeugen darf.

## Konsequenzen

- Die kanonische Produktionskomposition enthaelt kuenftig drei Module und zehn
  Capabilities: acht Merchant-PLANEN, Equip-MUTIEREN und
  Bank-Deposit-MUTIEREN.
- Beide mutierenden Capabilities bleiben beim Runtime-Start inaktiv.
- Equip- und Bank-Deposit-One-Shot-Authority duerfen nicht gleichzeitig offen
  sein.
- Ein separates Bank-Deposit-Journal mit globalem Current-Pointer blockiert
  konkurrierende oder nach Restart ungeklärte neue Deposit-Intents.
- Der read-only Preflight darf reale Session-/Server-/Bank-/Gold-Baselines
  pruefen, aber weder Lease noch One-Shot-Authority erteilen.
- Vor einem echten Bank-Write bleiben persistente accountweite Bank-Lease,
  externer Fence, lokaler `bank`-Action-Channel, Socket-Budget,
  Fault/Restart/UNKNOWN/Shadow sowie erneut gruene Exact-Head-CI Pflicht.

## Invarianten

- Single Owner exakt `merchant-bank-core@1`;
- Capability exakt `merchant.bank.gold_einlagern`;
- `standardAktiv=false`;
- exakt `AL-ACTION-BANK-DEPOSIT` /
  `AL-RECOVERY-BANK-DEPOSIT` /
  `AL-VERIFIER-BANK-DEPOSIT`;
- One-Shot-Authority maximal eine Verwendung;
- One-Shot-Authority maximal 2000 ms Lebensdauer;
- durable Authority-Audit vor lokaler Authority;
- keine generische MUTIEREN-Aktivierung;
- kein Raw-Write-Bypass;
- keine breite Runtime-Freigabe;
- offener Current-Fence blockiert neuen Deposit-Intent;
- Same-Intent-Retry bleibt fuer den spaeteren Bank-Write verboten;
- Preflight erzeugt exakt null Gameplay-Writes;
- PR20.2b enthaelt weder Bank-Write-Adapter noch Live-Runner.

## Migration

Die kanonische Produktionskomposition registriert
`merchant-bank-core@1` und seine einzige Capability default-off. Runtime und
Node-Host erhalten einen exakt benannten Bank-Deposit-One-Shot-Authority-Pfad
sowie durable Authority-/Journal-Adapter.

Der read-only Preflight lautet:

`npm run bank-deposit-production:preflight -- --cdp http://127.0.0.1:9222/`

Die naechste Migration bindet die bestehende accountweite
`BankLeaseKoordinator`-Grenze restart-sicher persistent an Admission und
verbindet sie mit externem Fence, lokalem `bank`-Action-Channel und
Socket-Budget. Erst danach duerfen Write-Adapter und Live-Runner in einem
separaten Schritt eingefuehrt werden.

## Rollback

Vor Einfuehrung eines Write-Adapters ist Rollback gameplay-neutral:
Capability und One-Shot-Authority koennen aus der Komposition entfernt
werden, ohne eine Spielmutation rueckgaengig machen zu muessen.

Durable Authority-Audits und ein bereits vorhandener nichtterminaler
Bank-Deposit-Current-Fence duerfen bei Rollback jedoch nicht still geloescht
oder als freigegeben interpretiert werden. Ungeklaerte Evidence bleibt
fail-closed und muss vor einer spaeteren erneuten Produktivierung
reconciliiert werden.
