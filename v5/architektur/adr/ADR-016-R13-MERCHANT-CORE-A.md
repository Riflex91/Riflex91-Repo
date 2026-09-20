# ADR-016 – R13 Merchant Core A: zentrale Economy-Wahrheit und accountweite Bankauthority

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

R13 ist die erste große fachliche Domäne nach dem minimalen R12-Vertical-Slice. Merchant-Operationen können Gold, physische Gegenstände, Bankzustand und fremde Market-Listings verändern. Die ratifizierten R13-Anforderungen verlangen deshalb eine zentrale Gegenstandsdisposition, konkrete physische Reservierungen, Workspace-/Capacity-Preflight, accountweite Bankownership, frische Listing-/RID-Evidence sowie starvation-freie Planung.

P0-03 zeigt zusätzlich, dass Adventure Land Bank-Mounts accountweit serialisiert und ein Character keine unabhängige Bankauthority besitzt. P0-04 zeigt, dass RID nur Listing-Replacement schützt, Partial Fills die RID nicht rotieren und `trade_sell` serverseitig selbst das erste passende Inventaritem auswählt.

## Entscheidung

1. **Eine zentrale Gegenstandsdisposition** entscheidet für physische Items über `BEHALTEN`, `BANK`, `NPC_VERKAUF`, `MARKT_VERKAUF`, `UPGRADE`, `COMPOUND`, `DELIVERY`, `VERBRAUCH` oder `QUARANTAENE`.
2. Physische Reservierungen sind an Character, Inventarindex und Beobachtungsfingerprint gebunden; Name/Level allein sind keine Identität.
3. Gleichzeitige Reservierungen derselben physischen Menge dürfen die beobachtete Menge niemals überschreiten.
4. Destruktive Itemworkflows verwenden einen konservativen Workspace-/Capacity-Preflight. Stack-Merge wird nur angerechnet, wenn Variant/Fingerprint exakt kompatibel ist; unbekannte Variantenzuordnung wird als zusätzlicher Slot geplant.
5. Gold wird über ein zentrales Budget-Ledger mit Safety-Reserve und exklusiven Reservierungen geplant.
6. Bankauthority liegt **außerhalb des Merchant-Moduls** in der accountweiten Koordinationsgrenze `koordination/account-bank-lease.ts`.
7. Eine Bankmutation benötigt gleichzeitig:
   - aktive accountweite Lease mit Epoche/Fencing;
   - exakt passenden externen Adventure-Land-Mount-Fence;
   - lokalen `bank`-Action-Channel des Lease-Owners.
8. Bank-Snapshots sind an Account, Owner, Lease-Epoche und Freshness gebunden.
9. Disconnect/Restart gibt Bankauthority nicht frei. Persistierte nicht-terminale Leases starten als `RECOVERY_PENDING`; erst ein expliziter External-Fence-Abgleich erlaubt spätere Neuvergabe.
10. Market-Intents pinnen Target, Slot, RID, Side, Item, Level und Unit Price; Menge besitzt zusätzlich eigene frische Evidence.
11. RID ist weder Idempotency-Key noch Quantity-Version. Ein Partial Fill darf bei gleichbleibender RID trotzdem eine neue Mengenbeobachtung erzwingen.
12. Listing-Replacement/Fingerprint-Drift invalidiert den geplanten Trade und verlangt Replan.
13. `trade_sell` reproduziert unmittelbar vor Send den realen Server-Scan von Inventarindex 0 aufwärts.
14. Die dabei serverseitig ausgewählte physische Identität wird gegen die zentrale Disposition geprüft. Nicht-fungible mehrdeutige Kandidaten blockieren die Aktion.
15. Merchant-Demands verwenden den vorhandenen R8-Scheduler mit `PriorityClass + prioritaetsRang + Aging`; R13 baut keinen separaten globalen Prioritätsscore.
16. R13 bleibt Planning-/Coordination-Core. Es werden keine neuen Raw Adventure-Land-Writes oder breite Gameplay-Autorität eingeführt.

## Alternativen

- **Disposition pro Funktion:** verworfen, da Sell/Bank/Upgrade/Delivery sonst unterschiedliche Wertentscheidungen treffen könnten.
- **Itemreservierung nur über Name/Level:** verworfen, weil physisch verschiedene Items kollidieren können.
- **Optimistische Capacity-Annahme:** verworfen, weil destructive Workflows durch Multi-Output oder unsichere Stack-Merges Inventar überfüllen können.
- **Character-lokaler Bank-Lock:** verworfen, weil Adventure Land Bankownership accountweit ist.
- **RID allein als Trade-Freshness:** verworfen, weil Partial Fill die RID nicht rotiert.
- **Caller wählt bei trade_sell den Inventarslot:** verworfen, weil der Server keinen Inventarindex erhält und selbst ab Index 0 scannt.
- **Merchant-eigener Scheduler:** verworfen, weil R8 bereits verbindliche PriorityClass-/Aging-Semantik besitzt.
- **Live-Merchant-Writes bereits in R13:** verworfen, weil der breite Runtime-/Execution-Gate weiterhin gesperrt bleibt.

## Konsequenzen

- Merchant-Funktionen erhalten eine gemeinsame Wert- und Reservationswahrheit.
- Bankplanung kann nicht gegen einen parallelen eigenen Character oder einen extern gemounteten Character schreiben.
- Restart und stale Bankepochs bleiben fail-closed.
- Market-Planung kann weder stale RID noch stale Restmenge als Autorität verwenden.
- `trade_sell` kann kein anderes physisches Item verkaufen als dasjenige, das der Server tatsächlich auswählen würde.
- R14 kann die bereits accountweit modellierte Bank-Lease in den vollständigen Account Coordinator integrieren, ohne Merchant selbst Bankauthority zu geben.
- R15 kann Upgrade/Compound/Production auf denselben Disposition-/Workspace-/Budget-Grundlagen aufbauen.

## Invarianten

Insbesondere:

- V5-ALT-027 – physische Reservierung referenziert konkrete Identität;
- V5-ALT-028 – wertrelevante Itemworkflows lesen dieselbe Disposition;
- V5-ALT-029 – destructive Workflows besitzen Workspace-/Capacity-Preflight;
- V5-INV-006 – langlebige Leases verwenden Epoche/Fencing;
- V5-ALT-024 – zeitkritische Market-Preconditions werden frisch revalidiert;
- V5-ALT-018 / V5-ALT-019 – PriorityClass + Aging verhindern Priority-Modell-Drift und Starvation.

## Migration

R13 importiert keine V3/V4-Merchant-Runtime. Die neuen Komponenten sind V5-native Foundation-/Coordination-Bausteine.

Die accountweite Bank-Lease ist absichtlich nicht im Merchant-Modul verankert. R14 erweitert diese Grenze um Account Coordinator, Character Agent Protocol, Liveness und Multi-Character-Authority.

Spätere Live-Adapter dürfen erst nach ihren jeweiligen Admission-/Execution-Gates gegen diese Planungs- und Evidence-Verträge schreiben.

## Rollback

Ein Rollback von R13 entfernt ausschließlich Planning-/Ledger-/Evidence-/Koordinationscode. Da R13 keine neue breite Live-Execution freigibt, ist kein Adventure-Land-Zustandsrollback notwendig.

Persistierte spätere Consumer müssen bei Rückbau von Schema-/Policy-Versionen fail-closed neu reconciliert werden.

## Nachweise

- `v5/grundlage/quelle/merchant/gegenstands-identitaet.ts`
- `v5/grundlage/quelle/merchant/disposition.ts`
- `v5/grundlage/quelle/merchant/workspace.ts`
- `v5/grundlage/quelle/merchant/gold-budget.ts`
- `v5/grundlage/quelle/koordination/account-bank-lease.ts`
- `v5/grundlage/quelle/merchant/markt-evidence.ts`
- `v5/grundlage/quelle/merchant/demand.ts`
- `v5/grundlage/tests/r13-disposition-workspace.test.mjs`
- `v5/grundlage/tests/r13-bank-lease.test.mjs`
- `v5/grundlage/tests/r13-market-evidence.test.mjs`
- `v5/grundlage/tests/r13-scheduler-budget.test.mjs`
- `v5/grundlage/vertraege/r13/merchant-core-abdeckung.json`
