# PR20.5–PR20.9 – Merchant Restvorbereitung ohne Gameplay-Writes

**Status:** VORBEREITET / NO-WRITE  
**Stand:** 2026-09-21  
**Aktives produktives Gate bleibt:** `PR20.1_EQUIP_PRODUKTIONSNACHWEIS`

## Sicherheitsgrenze

Diese Vorbereitung zieht nur Arbeit vor, die keine neue produktive Gameplay-Authority benoetigt.

Explizit **nicht** enthalten:

- keine neue `MUTIEREN`-Capability in der Produktionskomposition;
- keine neue produktive Authority;
- kein CDP-/Gameplay-Write-Adapter;
- kein Live-Runner fuer Bank, Markt, Transfer, MLuck, Upgrade, Compound, Exchange oder Craft;
- keine breite generische `use_skill`-Authority;
- keine Aenderung am ausstehenden Equip-Live-Pfad.

## PR20.5 – Merchant-Pingpong und Starvation

Neu vorbereitet ist der authority-freie Core
`grundlage/quelle/merchant/dienst-stabilitaet.ts`.

Er setzt vor einen fachlichen Bereichswechsel zusaetzliche Hysterese:

- keine Unterbrechung bei offener irreversibler Mutation;
- nur sichere Unterbrechung mit durable Checkpoint;
- Safety/Notfall darf normale Arbeit preempten;
- globale Scheduler-Prioritaet bleibt Voraussetzung;
- Mindesthaltedauer;
- Wechsel-Cooldown;
- bounded Wechselbudget pro Zeitfenster;
- Starvation-Grenze fuer lange wartende Arbeit.

Damit wird spaeter nicht jede geringfuegig bessere Aufgabe sofort zu
Bank -> Farmer -> Markt -> Bank-Pingpong.

Der Core besitzt `gameplayAutoritaet=false` und `rawWriteAutoritaet=false`.

## PR20.6 – MLuck

Die vorhandene Planung war bereits fail-closed. Zusaetzlich ist nun ein **enger
same-account Contract** gegen die vorhandenen offiziellen Source-Snapshots
ratifiziert:

- Action: `AL-ACTION-MLUCK-SAME-ACCOUNT`;
- Recovery: `AL-RECOVERY-MLUCK-SAME-ACCOUNT`;
- Verifier: `AL-VERIFIER-MLUCK-SAME-ACCOUNT`;
- Public Function: `use_skill`, jedoch **nur fuer `mluck` im fest gebundenen
  same-account Scope**.

Die Source-Evidence zeigt:

- Client: `use_skill("mluck", target)` wird auf den `skill`-Transport mit
  Ziel-ID und Deferred-Channel `mluck` abgebildet;
- Skilldefinition: Merchant, Level 40, 10 MP, Range 320, Cooldown 100,
  Player-Target;
- Server: Klasse, Level, MP, Cooldown, Ziel und Range werden geprueft;
- bei MLuck wird MP konsumiert, danach wird die Ziel-Condition gesetzt bzw.
  nur unter den serverseitigen Strong/Source-Regeln aktualisiert;
- same-account MLuck wird `strong=true`.

Wichtig: Weil MP serverseitig vor der finalen Overwrite-Entscheidung konsumiert
wird, muss die bestehende Target-MLuck-Condition inklusive `strong` und
`f` unmittelbar vor Send erneut geprueft werden.

Noch **nicht** vorhanden sind Capability, Authority, Journal, Adapter,
Preflight oder Live-Freigabe.

## PR20.7 – Gear

Die sichere Foundation bleibt:

- physisches Item hoechstens einmal reserviert;
- Recipient-Slot hoechstens einmal gleichzeitig reserviert;
- Farmer-Gear vor Merchant-Self-Gear;
- stale/inkompatible/unverifizierte Kandidaten fail-closed;
- Restart nichtterminaler Gear-Ziele => `RECOVERY_PENDING`.

Der ausstehende PR20.1-Nachweis bleibt Voraussetzung fuer jede Erweiterung des
Equip-Pfads. Belegte Slots, Swap, Waffen/Offhand und Remote-Gear-Delivery
werden spaeter getrennt ratifiziert und nicht in einen breiten Gear-Write
zusammengezogen.

## PR20.8 – Upgrade, Compound, Exchange

Die Action-/Recovery-/Verifier-Vertraege existieren fuer:

- `AL-ACTION-UPGRADE`;
- `AL-ACTION-COMPOUND`;
- `AL-ACTION-EXCHANGE`.

Der bestehende Werttransaktions-Ledger behandelt q/Placeholder und
attributable Consumable-Delta als accepted in-flight, setzt nichtterminale
Restart-Zustaende auf Abgleich und verbietet Same-Intent-Retry.

Upgrade und Compound besitzen zusaetzlich bereits den authority-freien
`ItemMutationsPlaner` mit physischen Identitaeten, Disposition, Workspace,
Wertbudget und Risiko-Policy.

Bewusst offen bleiben:

- separater Exchange-Produktivplaner;
- durables Journal/Current-Fence pro Mutationsfamilie;
- read-only Preflight;
- enge Authority;
- Live-Adapter;
- Fault/Shadow/5m Live-Evidence.

Spezielle Offering-/scroll4-/Compound-Pfade werden nicht mit einem ersten
einfachen Live-Kandidaten vermischt.

## PR20.9 – Craft und Production

Bereits vorhanden:

- bounded azyklischer Production Graph;
- eindeutige Operation-Schluessel fuer irreversible Schritte;
- Workspace-Nachweis fuer Mutationen;
- frischer Bank-Katalog-Pin;
- Event-/Quest-Gates;
- Action/Recovery/Verifier-Bindungen je produktivem Graph-Schritt;
- persistenter Production Controller ohne Gameplay-Authority;
- Restart/Reconciliation;
- finales Recipient Settlement.

Die wichtigste Grenze bleibt:

`CRAFT_COMMITTED != PRODUCTION_COMMITTED`.

Ein spaeterer Production-Executor darf **keine breite Graph-Authority**
erhalten. Jeder mutierende Node muss durch seinen eigenen bereits
ratifizierten Capability-/Admission-/Transaction-Pfad gehen.

## PR21 – Merchant-Integration

Der detaillierte NO-WRITE-Testplan liegt unter
`dokumentation/PR21-MERCHANT-INTEGRATION-TESTPLAN.md`.

PR21 wird erst produktiv ausgefuehrt, wenn PR20.1–PR20.9 einzeln ihre
Capability-Gates bestanden haben.

## Heute Abend

Trotz dieser Vorbereitung bleibt der erste reale Schritt unveraendert:
PR20.1 Equip-Preflight auf dem bereits exact-head getesteten Commit und erst
nach dessen Auswertung der eine kontrollierte Equip-Write.

Die Vorbereitungsarbeit in neueren Commits ist **kein Grund**, fuer diesen
Test einen anderen Source-SHA zu verwenden.
