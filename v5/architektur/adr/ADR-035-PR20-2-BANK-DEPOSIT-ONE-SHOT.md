# ADR-035 – PR20.2 Bank Deposit One-Shot

**Status:** RATIFIZIERT  
**Datum:** 2026-09-21

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
