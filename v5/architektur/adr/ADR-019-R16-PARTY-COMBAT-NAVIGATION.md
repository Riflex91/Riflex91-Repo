# ADR-019 – R16 Party, Combat, Farming und Navigation

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

R16 fuehrt die V5-native Party-/Combat-/Farming-/Navigation-Foundation ein. P1B revalidiert Party-Freshness, Skill-/Cooldown-Wahrheit, Aggro/Threat/CC, Death/Respawn/Rejoin und Group Capabilities gegen aktuelle Adventure-Land-Quellen.

Die drei ratifizierten R16-MUSS-Anforderungen betreffen World-Safety: Movement-Return ist kein Arrival-Beweis, bewegte Ziele brauchen bewegungsbezogene Freshness und ein Raw Target ist keine fachliche Target-Ownership. Gleichzeitig muss die Phase Movement-Pingpong, stale Party-/Skill-Evidence, Death/Respawn-Drift, AoE-Hard-Caps und Encounter-Dedupe fail-closed behandeln.

## Entscheidung

1. Movement-Return beendet nur den Movement-Versuch. Fachliches Arrival braucht eine separate frische Postcondition fuer Character, Server, Map, Instanz, Position, Stabilitaet und Death-State.
2. Nichtterminale Travel-Snapshots werden nach Restart `RECOVERY_PENDING`; neues Movement ist erst nach expliziter Reconciliation erlaubt.
3. Moving Targets werden mit Entity-ID, Spawn-/Entity-Fingerprint, Server, Map/Instanz, Position, Geschwindigkeit, Beobachtungszeit, maximalem Alter, Driftbudget und Geschwindigkeitslimit gepinnt.
4. Eine neue Zielbeobachtung muss dieselbe Identitaet bestaetigen und innerhalb Zeit-/Motion-Budget liegen. Sichtverlust, Death, Spawnwechsel oder zu grosse Drift blockieren fail-closed.
5. Raw Target-/Threat-Felder sind volatile Evidence. Fachliche Target-Ownership wird separat mit Workflow-Owner, Character, Entity-/Spawn-Fingerprint, Epoche, TTL und Freshness-Grenze geleast.
6. Restart oder Lease-Ablauf setzt Target-Ownership `RECOVERY_PENDING`; alte Tokens bleiben fenced.
7. Ein Character hat gleichzeitig nur einen normalen Movement-Owner. Travel, Rendezvous, Kiting und Positionierung duerfen sich nicht gegenseitig uebernehmen.
8. Safety darf einen normalen Movement-Owner durch neue Epoche preempten, aber ein aktiver Safety-Owner darf nicht durch einen anderen Safety-Workflow pingpong-artig verdraengt werden. Handoffs besitzen eine Sperrfrist.
9. Party Truth ist zeitgebundene Beobachtung und keine langlebige Authority. Member-Evidence bleibt an R14-Roster-/Session-Bindungen gebunden.
10. Group Capabilities entstehen nur aus frischer Party-, Lifecycle- und Skill-Evidence.
11. Skill Capability bindet Klasse, Level, MP, Rip-/Disabled-State, Equipment, Character-Session sowie die aktuelle Cooldown-Domaene. Shared-Cooldowns werden als gemeinsame Domaene behandelt.
12. Death entzieht normale Combat-/Movement-Authority. Respawn-Response allein reaktiviert den Character nicht; erst frische Rejoin-Evidence stellt den Zustand `AKTIV` wieder her.
13. Threat/CC-Evidence ist volatil. Monster-Target, Conditions, Immunity und DPS-Annahmen werden nur zeitgebunden verwendet.
14. AoE-Learning darf Hard Caps fuer Zielanzahl, erwarteten Basis-DPS und HP-Reserve niemals lockern. Stale Targets blockieren AoE fail-closed.
15. Encounter-Outcomes werden per Encounter-ID dedupliziert. Widerspruechliche Outcomes werden abgelehnt; Restart behaelt abgeschlossene Outcomes und setzt offene Encounters auf Reconciliation.
16. Der Farmer ist ein bounded FSM. Wiederholte BLOCKED-Loops oder ueberschrittene Transition-Grenzen fuehren zu `FAILED_SAFE`.
17. Alle R16-Primitive bleiben no-write. Sie besitzen keine neue Gameplay- oder Raw-Write-Authority.

## Alternativen

- `smart_move`-/Movement-Erfolg direkt als Arrival behandeln: verworfen; Transportabschluss ist kein fachlicher Postcondition-Beweis.
- Entity-Objektreferenz bis zur spaeteren Nutzung behalten: verworfen; Sichtverlust und Bewegung machen sie stale.
- Raw Game Target als fachliche Ownership verwenden: verworfen; Beobachtung und Ownership sind getrennte Konzepte.
- Travel und Kiting ohne Movement-Owner parallel planen: verworfen; fuehrt zu Pingpong/Thrash.
- Party-Objekt als dauerhaft frische Wahrheit verwenden: verworfen; offizieller Runner beschreibt es als infrequently updated.
- Skilldefinition allein als Nutzbarkeitsnachweis verwenden: verworfen; Live-Session, MP, Equipment, Conditions und Cooldown fehlen.
- Respawn-Promise als Rejoin behandeln: verworfen; frische Character-/Roster-/Party-Evidence ist danach erneut erforderlich.
- Learning Empfehlungen Hard Caps ueberschreiben lassen: verworfen; Safety-Invarianten sind nicht lernbar.
- V3/V4 Combat-/Farmer-Runtime importieren: verworfen; R16 ist eine V5-native no-write Foundation.

## Konsequenzen

R16 besitzt explizite Arrival-, Motion-, Target- und Movement-Ownership-Grenzen. Party/Skill/Lifecycle/Threat/AoE/Encounter/Farmer-Semantik ist bounded und restart-sicher modelliert. R17 kann World Autonomy auf diese Freshness-/Ownership-Grundlagen setzen, ohne stale World-Evidence als Authority zu verwenden.

Die breite Gameplay-Runtime bleibt `GESPERRT`.

## Invarianten

- V5-ALT-049 – Movement-Return ist kein Arrival-Beweis.
- V5-ALT-050 – bewegte Ziele benoetigen bewegungsbezogene Freshness.
- V5-ALT-051 – Raw Target ist keine fachliche Target-Ownership.
- V5-ALT-026 – Character-/Party-Ziele bleiben an aktuelle Identitaet/Roster-Epoche gebunden.
- V5-INV-008 – kritische Zustandsmaschinen arbeiten fail-closed.
- V5-INV-026 – Safety-Code besitzt Negativ-/Fault-Tests.

## Migration

Party-/Combat-/Farmer-/Navigation-Semantik aus V3/V4 wird nur als Wissens- und Testquelle verwendet. Runtimeklassen und Raw-Game-Write-Pfade werden nicht importiert. R14 liefert Roster/Liveness/CM-Fencing, R15 Merchant-/Production-Logistik; R16 setzt ausschliesslich auf diese V5-Grenzen und eigene no-write Primitive.

Produktive Adapter fuer Movement, Targetwechsel, Attack, Skills oder Respawn bleiben ausserhalb des R16-Cores und duerfen spaeter nur ueber explizite Execution-/Authority-Gates angeschlossen werden.

## Rollback

Ein Rollback von R16 entfernt no-write Planning-/Safety-/Ownership-Primitive und Metadaten. R16 selbst erzeugt keine direkten Adventure-Land-Mutationen.

Persistierte nichtterminale Travel-, Target-, Movement-, Lifecycle- oder Encounter-Snapshots duerfen nach Rollback oder Schemawechsel nicht blind fortgesetzt werden; unbekannte Versionen gehen fail-closed in Reconciliation.

## Nachweise

- `v5/dokumentation/P1B-PARTY-COMBAT-NAVIGATION.md`
- `v5/grundlage/quelle/navigation/reise-arrival.ts`
- `v5/grundlage/quelle/navigation/motion-freshness.ts`
- `v5/grundlage/quelle/navigation/bewegungs-owner.ts`
- `v5/grundlage/quelle/kampf/target-ownership.ts`
- `v5/grundlage/quelle/kampf/skill-capability.ts`
- `v5/grundlage/quelle/kampf/character-lifecycle.ts`
- `v5/grundlage/quelle/kampf/threat-cc.ts`
- `v5/grundlage/quelle/kampf/aoe-safety.ts`
- `v5/grundlage/quelle/kampf/encounter-ledger.ts`
- `v5/grundlage/quelle/gruppe/party-wahrheit.ts`
- `v5/grundlage/quelle/gruppe/group-capabilities.ts`
- `v5/grundlage/quelle/farmer/farmer-fsm.ts`
- `v5/grundlage/tests/r16-arrival-motion.test.mjs`
- `v5/grundlage/tests/r16-ownership-movement.test.mjs`
- `v5/grundlage/tests/r16-party-skill-lifecycle.test.mjs`
- `v5/grundlage/tests/r16-combat-farmer.test.mjs`
