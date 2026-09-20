# P2 – World Autonomy

**Status:** GESCHLOSSEN  
**Stand:** 2026-09-20  
**Zielphase:** R17 – World Autonomy  
**Offizieller Source-Snapshot:** kaansoral/adventureland_mongodb@ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4

## Forschungsumfang

R1.4 verlangt vor World Autonomy:

- vollstaendigen Mapgraph;
- Spawn-Packs;
- Event State Machines;
- Quests;
- Rare/Boss Discovery;
- Server Hopping;
- PvP/Hardcore Policies.

R17 muss zusaetzlich garantieren:

- Event-/Quest-Drift zwischen Planung und Action sperrt oder replanned die Aktion;
- Unknown Content bleibt fail-closed;
- Serverwechsel beruecksichtigt aktuelle Mode-/Fatigue-Regeln.

## Revalidierte aktuelle Fakten

### Definitionen versus Live-State

Die aktuelle Adventure-Land-Dokumentation trennt statische Definitionen in `G` von Live-State. Maps, Monster, NPCs, Events und andere Content-Definitionen beschreiben moegliche Inhalte; Live-Entities, Serverstatus, aktive Events und Action-Responses beschreiben, was jetzt tatsaechlich gilt.

Diese Trennung ist fuer R17 verbindlich. Eine Definition beweist weder, dass ein Event aktiv ist, noch dass ein Boss gerade existiert, noch dass eine Quest aktuell ausfuehrbar ist.

### Mapgraph

`design/maps.js` enthaelt pro Map unter anderem:

- `npcs`;
- `monsters`;
- `spawns`;
- `doors`;
- optionale `on_death` / `on_exit`;
- `pvp`, `safe`, `instance`, `mount`, `ignore`;
- Event-Bindungen wie `event` und teilweise Join-Code.

Doors referenzieren andere Maps und Spawn-/Door-Indizes. Instanzen und Eventmaps koennen gesonderte Regeln besitzen.

Konsequenz:

- der V5-Mapgraph ist Definition Evidence, keine Live-Path-Authority;
- nur bekannte, schema-valide Maps und Kanten werden in den Graph aufgenommen;
- unbekannte Zielmaps, ungueltige Door-Referenzen oder driftende Definitionen werden quarantiniert;
- Live Travel nutzt weiterhin R16 Arrival-/Movement-Grenzen.

### Spawn-Packs

Mapdefinitionen enthalten Monster-Packs mit Typ, Count und geometrischer Spawn-Beschreibung wie Boundary, Position, Radius oder Roam-Eigenschaften.

Konsequenz:

- Spawn-Packs sind Definitionen fuer moegliche Spawns;
- ein Pack beweist nicht, dass eine konkrete Entity gerade existiert;
- konkrete Rare-/Boss-Arbeit benoetigt frische Live-Entity-Evidence mit Spawn-/Entity-Fingerprint;
- Spawn-Definition und Live-Entity bleiben getrennte Modelle.

### Events

`design/events.js` definiert aktuell unter anderem Daily-, Nightly- und Seasonal-Events wie Goo Brawl, Giga Crab, Franky, Ice Golem, Holiday Season, Lunar New Year, Valentines, Egg Hunt und Halloween.

Eventmaps koennen in `design/maps.js` zusaetzlich `event`, `code`, PvP- oder Instance-Eigenschaften besitzen.

Konsequenz:

- Eventdefinition ist kein Aktivitaetsbeweis;
- Planung pinnt Event-ID, Live-Status, Server/Realm, Zustandsfingerprint und Freshness;
- vor einer Event-Action wird derselbe Eventzustand erneut validiert;
- Ende, Start, Serverwechsel oder Fingerprint-Drift erzwingt BLOCK/REPLAN.

### Quests

`design/npcs.js` bindet Quests unter anderem ueber NPC-`quest`-Felder, beispielsweise saisonale und permanente Quest-NPCs.

Es gibt keinen einzelnen universellen statischen Questzustand, der die aktuelle Ausfuehrbarkeit fuer einen Character beweist.

Konsequenz:

- Questdefinition und Character-/Server-Live-Queststate bleiben getrennt;
- Planung pinnt Quest-ID, NPC-/Map-Kontext, Character-Session, Live-State-Fingerprint und Freshness;
- vor Quest-Actions wird revalidiert;
- unbekannte oder nicht eindeutig interpretierbare Queststates sind nicht action-faehig.

### Rare/Boss Discovery

Monster- und Mapdefinitionen liefern moegliche Monsterarten und Spawnkontexte. Live Entities koennen erscheinen, verschwinden, sterben oder auf einem anderen Server/Instance existieren.

Konsequenz:

- Discovery darf unbekannte Entities beobachten und katalogisieren;
- Discovery darf unbekannten Content **nicht** automatisch in action-faehigen Content verwandeln;
- bekannte Rare/Boss-Definition + frische Live-Entity-Evidence kann einen Discovery Candidate bilden;
- unbekannter Typ bleibt `QUARANTAENE`, bis ein separater ratifizierter Revalidierungs-/Freigabepfad ihn klassifiziert.

### Servermodi

Der aktuelle Servercode unterscheidet unter anderem normale Server, `HARDCORE`, `TEST`, `DUNGEON` und Servernamen mit `PVP`.

`HARDCORE` setzt unter anderem PvP, eigene Character-/IP-Limits, andere Death-/Heal-Regeln und weitere Gameplay-Modifikatoren. PVP/HARDCORE beeinflussen XP-/Gold-/Luck-Multiplikatoren.

Konsequenz:

- Servermodus ist sicherheitsrelevante Live-/Registry-Evidence;
- unbekannte Modi werden nicht automatisch als NORMAL behandelt;
- PvP und Hardcore benoetigen explizite Policy-Freigabe;
- Server-Hopping pinnt Zielserver, Modus, Freshness, aktuellen Server und Fatigue-/Cooldown-Zustand;
- stale Registry-Evidence blockiert den Hop.

### Content Drift und Quarantaene

Historische V3-Tests enthalten bereits die Sicherheitssemantik, dass wirklich unbekannter Content vor Nutzung quarantiniert werden muss und Discovery ihn nicht im selben Schritt automatisch freigeben darf.

R17 uebernimmt nur diese Semantik. V3/V4-Runtimecode wird nicht importiert.

## R17-Entscheidungen

### World Definition Snapshot

Mapgraph, Spawn-Packs, Event-/NPC-/Monsterdefinitionen werden als versionierte Definition Evidence gepinnt. Ein Definitionssnapshot besitzt Hash/Fingerprint und erzeugt keine Gameplay-Authority.

### Live World Truth

Event-, Quest-, Server- und Entity-Truth besitzt:

- Serverregion und Serveridentifier;
- Map/Instance bzw. Character-Kontext;
- Beobachtungszeit;
- absolute Gueltigkeit;
- Fingerprint;
- bekannte Semantikversion.

Live Truth wird nicht aus statischen Definitionen abgeleitet.

### Event-/Quest-Plan-Pin

Jede action-relevante Event-/Quest-Planung pinnt den Live-State. Unmittelbar vor Action wird revalidiert.

Moegliche Ergebnisse:

- `GUELTIG`: derselbe frische Zustand;
- `REPLAN_ERFORDERLICH`: bekannter, aber veraenderter Zustand;
- `BLOCKIERT_STALE`: Evidence abgelaufen;
- `BLOCKIERT_UNBEKANNT`: unbekannte/inkompatible Semantik.

Kein Driftpfad darf stillschweigend weiter ausfuehren.

### Unknown Content

Unbekannte Content-IDs, Typen oder Semantikversionen starten `QUARANTAENE`.

Discovery ist Beobachtung. Freigabe ist ein separater, expliziter Revalidierungs-/Policy-Schritt. Beobachtung allein darf `QUARANTAENE` nicht zu `ERLAUBT` machen.

### Rare/Boss Discovery

Rare/Boss Candidates benoetigen bekannte Definition plus frische Live-Entity-Evidence. Kandidaten sind keine Target-/Combat-Authority; R16 Target-/Motion-Grenzen bleiben erforderlich.

### Server Hopping

Ein Hop-Plan ist nur planbar, wenn:

- Zielserver in einer frischen Registry vorhanden ist;
- Modus bekannt ist;
- PvP-/Hardcore-Policy explizit erlaubt;
- Fatigue-/Cooldown-Grenzen eingehalten werden;
- Ziel nicht dem aktuellen Server entspricht;
- Zielserver nicht als offline/stale markiert ist.

Der Hop-Plan besitzt keine Raw-Write-Authority.

### Restart

Nichtterminale Event-/Quest-/Server-Hop-Plans werden nach Restart `REVALIDIERUNG_ERFORDERLICH`.

Kein World-Autonomy-Plan darf nach Restart direkt weiter ausgefuehrt werden.

## P2-Abschluss

Die R1.4-Forschungsfragen sind fuer die R17-Foundation geschlossen:

- Mapgraph: versionierte Definition Evidence aus bekannten Maps/Doors;
- Spawn-Packs: Definition getrennt von Live-Entities;
- Event State Machines: Live-State-Pinning + Drift-Revalidation;
- Quests: Character-/Server-Live-State-Pinning + Drift-Revalidation;
- Rare/Boss Discovery: bekannte Definition + frische Entity-Evidence, keine automatische Freigabe;
- Server Hopping: frische Registry + Mode-/Fatigue-Policy;
- PvP/Hardcore: explizite opt-in Policy, Unknown Mode fail-closed;
- Unknown Content: Default `QUARANTAENE`, Discovery ist keine Freigabe.

Die breite Gameplay-Runtime bleibt `GESPERRT`.

## Aktuelle Referenzen

- Adventure Land Docs / MCP Guide: https://adventure.land/docs/guide/tracktrix/null/adventure-mcp
- Adventure Land Functions: https://adventure.land/docs/code/functions
- `kaansoral/adventureland_mongodb@ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4`
- `design/maps.js@5459d7bae0c970a62d500c991ae3a1f010266ff7`
- `design/monsters.js@99d7111b691fedac0b85166ef6ab93509cae8c25`
- `design/npcs.js@a99d3b18c5099a1824d0bd0c780bd2eabf1d53cb`
- `design/events.js@006659897eb714616f8e4a2043790f516758be37`
- `node/server.js@857fbe09e98d643ecb7cfd97e56fac0f14c893d2`
- `v3/src/world/discovery.js`
- `v3/src/world/content-drift.js`
- `v3/src/farmer/content-safety.js`
- `v3/test/unknown-content-safety.test.js`
