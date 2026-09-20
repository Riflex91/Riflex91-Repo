# ADR-020 – R17 World Autonomy

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

R17 schliesst die World-Autonomy-Foundation. P2 revalidiert Mapgraph, Spawn-Packs, Event-/Quest-State, Rare/Boss Discovery, Server-Hopping sowie PvP/Hardcore-Policies.

Die zentrale R17-Anforderung lautet: Event-/Quest-Drift zwischen Planung und Action darf niemals stillschweigend weiterlaufen.

## Entscheidung

1. Statische World-Definitionen und Live-State sind getrennt.
2. Mapgraph und Spawn-Packs sind Planning Evidence ohne ExecutionAuthority.
3. Event-/Quest-Plans pinnen Live-State mit Server, Map, optional Character, Semantikversion, TTL und Fingerprint.
4. Vor Action wird derselbe Zustand revalidiert.
5. Drift erzeugt `REPLAN_ERFORDERLICH`; stale Evidence erzeugt `BLOCKIERT_STALE`; unbekannte Semantik erzeugt `BLOCKIERT_UNBEKANNT`.
6. Nach Restart werden nichtterminale World-Plans `REVALIDIERUNG_ERFORDERLICH`.
7. Unbekannter Content startet in `QUARANTAENE`. Discovery allein kann keine Freigabe erteilen.
8. Definition Drift setzt auch zuvor erlaubten Content wieder in Quarantaene.
9. Rare/Boss Discovery benoetigt bekannte Definition plus frische Live-Entity-Evidence und besitzt keine CombatAuthority.
10. Server-Hopping benoetigt frische Registry-Evidence, bekannten Modus, explizite PvP/Hardcore-Policy und Fatigue-Grenzen.
11. Unknown Server Mode ist fail-closed.
12. R17 erzeugt keine Raw Game Writes.

## Alternativen

- Definition als Live-Wahrheit behandeln: verworfen.
- Discovery automatisch freigeben: verworfen.
- Unknown Server Mode als NORMAL behandeln: verworfen.
- Event-/Quest-Plan nach Restart blind fortsetzen: verworfen.
- V3/V4 Runtimecode importieren: verworfen.

## Konsequenzen

R18 kann Learning auf eine deterministische, quarantinierte World-Basis setzen. Learning darf diese Grenzen nicht lockern.

## Invarianten

- V5-INV-009 – Plan-/World-Drift wird vor Action erkannt.
- Unknown Content bleibt fail-closed.
- Runtime-Gate bleibt GESPERRT.

## Migration

V3-Discovery-/Content-Safety-Semantik dient nur als Wissens-/Testquelle. Es gibt keine V3/V4-Runtimeimporte.

## Rollback

R17 ist no-write. Nichtterminale World-Plans oder zuvor erlaubte Content-Eintraege werden nach Rollback/Restart nicht blind fortgesetzt, sondern erneut validiert bzw. quarantiniert.

## Nachweise

- `v5/dokumentation/P2-WORLD-AUTONOMY.md`
- `v5/grundlage/quelle/welt/event-quest-drift.ts`
- `v5/grundlage/quelle/welt/world-plan-ledger.ts`
- `v5/grundlage/quelle/welt/content-quarantaene.ts`
- `v5/grundlage/quelle/welt/server-hop-policy.ts`
- `v5/grundlage/quelle/welt/map-graph.ts`
- `v5/grundlage/quelle/welt/spawn-discovery.ts`
