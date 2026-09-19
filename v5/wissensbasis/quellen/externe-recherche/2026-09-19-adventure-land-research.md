# Adventure Land AiO Bot V4 — Externe Research-Wissensbasis

**Research-Worker:** ausschließlich externe Adventure-Land-Recherche  
**Abrufdatum:** 2026-09-19 (Europe/Berlin)  
**Projektkontext:** Adventure Land AiO Bot V4  
**Repo des Nutzers:** nicht verändert  
**GitHub-Aktionen am Nutzerprojekt:** keine Branches, keine PRs, keine Merges, keine Dateiänderungen

## 0. Status und Scope

Dieses Dokument konsolidiert den ersten tiefen externen Research-Pass für **Adventure Land – The Code MMORPG** mit Fokus auf einen langfristig autonomen, fehlertoleranten 24/7-Bot.

Die stärksten Quellen dieses Passes sind:

1. aktuelle offizielle Adventure-Land-Dokumentation,
2. offizielle Live-/MCP-Dokumentation,
3. aktueller offizieller Open-Source-Code,
4. aktuelle `design/*`-Spieldaten,
5. offizielle Update Notes,
6. hochwertige öffentliche Community-Repositories als Erfahrungsquelle.

Der geprüfte offizielle Open-Source-Stand von `kaansoral/adventureland_mongodb` löste beim Abruf für `main` auf:

`ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4`

Wichtig: Selbst dieser Commit ist **nicht automatisch identisch mit dem aktuell deployten Produktionszustand**. Die offizielle MCP-Dokumentation sagt ausdrücklich, dass die dort angebotenen Live-Game-Data- und Function-Contracts gegenüber einem Repository-Branch vorzuziehen sind, falls sie voneinander abweichen.

### Vertrauensklassen in diesem Dokument

- `OFFIZIELL_BESTAETIGT`
- `SPIELDATEN_BESTAETIGT`
- `MEHRFACH_EXTERN_BESTAETIGT`
- `COMMUNITY_HINWEIS`
- `ABGELEITETE_HYPOTHESE`
- `UNGEKLAERT`

`V3_REAL_BEOBACHTET` und `V3_TEST_ABGESICHERT` werden hier absichtlich nicht verwendet.

---

# 1. Kritische V4-Erkenntnisse

| ID | Kernaussage | Klasse | Confidence | Drift | V4_ARCHITEKTURRELEVANT |
|---|---|---:|---:|---:|---:|
| AL-API-001 | `G` beschreibt Definitionen/Capabilities, nicht den sicheren aktuellen Weltzustand. | OFFIZIELL_BESTAETIGT | 0.99 | mittel | true |
| AL-API-002 | Seit 24.08.2026 sollen alle öffentlichen asynchronen CODE-Funktionen auf echte Serverergebnisse settle'n. | OFFIZIELL_BESTAETIGT | 0.99 | niedrig | true |
| AL-API-003 | Mehrere Legacy-Actions werden clientseitig weiterhin über FIFO-Deferred-Queues pro `place` korreliert, nicht über eine eindeutige Request-ID. | SPIELDATEN_BESTAETIGT | 0.98 | mittel | true |
| AL-ACT-001 | Ein empfangenes erfolgreiches Public-Promise ist starke Action-Level-Bestätigung, aber ein verlorenes Ergebnis nach Disconnect darf nicht durch blindes Retry ersetzt werden. | MEHRFACH_EXTERN_BESTAETIGT | 0.98 | niedrig | true |
| AL-ACT-002 | `equip_batch` ist serverseitig nicht vollständig atomar: frühere Einträge können bereits angewendet sein, wenn ein späterer Eintrag fehlschlägt. | SPIELDATEN_BESTAETIGT | 0.99 | mittel | true |
| AL-INV-001 | Inventory-Indizes sind nach Mutationen nicht stabil und müssen unmittelbar vor einer Aktion neu aufgelöst werden. | OFFIZIELL_BESTAETIGT | 0.99 | niedrig | true |
| AL-INV-002 | Upgrade/Compound/Exchange verwenden serverseitig temporäre `placeholder`-Items und `character.q`/`player.q`-Zustände. | SPIELDATEN_BESTAETIGT | 0.99 | mittel | true |
| AL-TRADE-001 | Player-Shop-Käufe können mit `rid` gegen stale Listings geschützt werden; bei geänderter RID schlägt der Kauf fehl. | SPIELDATEN_BESTAETIGT | 0.99 | mittel | true |
| AL-SEND-001 | `send_item` und `send_gold` sind nicht idempotent und teilen clientseitig denselben Deferred-Kanal `send`. | SPIELDATEN_BESTAETIGT | 0.99 | mittel | true |
| AL-BANK-001 | Bankoperationen teilen einen `bank`-Deferred-Kanal; Bankzugriff hängt vom aktuell gemounteten Bankzustand/der Bankmap ab. | SPIELDATEN_BESTAETIGT | 0.98 | mittel | true |
| AL-BANK-002 | Der geprüfte Client kennt 48 Bank-Packs (`items0`–`items47`) über `bank`, `bank_b`, `bank_u`, je 42 Slots. | SPIELDATEN_BESTAETIGT | 0.98 | hoch | true |
| AL-BANK-003 | Laut aktuellem offiziellen Banking-Tutorial kann nur ein eigener Charakter gleichzeitig in der Bank sein. | OFFIZIELL_BESTAETIGT | 0.99 | mittel | true |
| AL-UPG-001 | Upgrade ist eine mehrphasige Transaktion: Ressourcen werden verbraucht, Zielslot wird Placeholder, Ergebnis wird später abgeschlossen. | SPIELDATEN_BESTAETIGT | 0.99 | mittel | true |
| AL-CMP-001 | Compound ist ebenfalls mehrphasig und benötigt drei aktuelle, zueinander passende Item-Referenzen sowie Scroll/ggf. Offering. | SPIELDATEN_BESTAETIGT | 0.99 | mittel | true |
| AL-EXCH-001 | Exchange ist mehrphasig und kann Input bereits konsumieren/placeholdern, bevor der Reward später entsteht. | SPIELDATEN_BESTAETIGT | 0.99 | mittel | true |
| AL-REC-001 | Beim Server-Exit werden laufende `player.q`-Operationen als `stale` markiert; Upgrade/Compound propagieren das beim späteren Abschluss. | SPIELDATEN_BESTAETIGT | 0.99 | mittel | true |
| AL-REC-002 | Nach Reconnect muss V4 zuerst `q`, Placeholder, Inventory, Gold und erwartete Postconditions reconciliieren; nicht einfach erneut senden. | ABGELEITETE_HYPOTHESE | 0.99 | niedrig | true |
| AL-NAV-001 | Ein neuer `smart_move` kann den vorherigen Smart-Move unterbrechen; Travel muss daher explizit preemptionsfähig modelliert werden. | SPIELDATEN_BESTAETIGT | 0.98 | mittel | true |
| AL-NAV-002 | Historisch/öffentlich dokumentiert kann `smart_move` auf Monsterziele zwischen mehreren Spawn-Packs wählen; ein Monstername ist keine feste Koordinate. | MEHRFACH_EXTERN_BESTAETIGT | 0.92 | hoch | true |
| AL-PARTY-001 | `get_party()` ist laut aktuellem Runner „infrequently updated“ und ist allein keine zuverlässige Liveness-Wahrheit. | SPIELDATEN_BESTAETIGT | 0.99 | mittel | true |
| AL-CM-001 | CODE-Messages müssen als potenziell verspätet/stale/untrusted behandelt und Sender/Payload validiert werden. | OFFIZIELL_BESTAETIGT | 0.99 | niedrig | true |
| AL-CM-002 | `send_cm` liefert `{receivers, locals}`; fehlende/offline Serverempfänger fehlen aus `receivers`, lokal bereits zugestellte Empfänger bleiben bei Serverfehler im Fehlerobjekt erhalten, damit Retries nicht duplizieren müssen. | OFFIZIELL_BESTAETIGT | 0.99 | niedrig | true |
| AL-RATE-001 | In-Game-Socket-Call-Cost wird über ein rollendes 4-Sekunden-Fenster begrenzt; Überschreitung kann `limitdc` auslösen. Mainframe-„Call cost“ ist dagegen CPU-Prozent und ein anderer Begriff. | SPIELDATEN_BESTAETIGT | 0.98 | hoch | true |
| AL-MERCH-001 | Ein Merchant ist erst dann als Shop funktional zu betrachten, wenn Stand **und** tatsächliche Trade-Listings vorhanden sind. | OFFIZIELL_BESTAETIGT | 0.99 | niedrig | true |
| AL-MERCH-002 | Stand-Kapazität ist aktuell abhängig von Merchant-Level/Stand: 16, 24 oder 30 Trade-Slots. | SPIELDATEN_BESTAETIGT | 0.98 | hoch | true |
| AL-PERSIST-001 | `set/get` speichern JSON lokal; `pset/pget` abstrahieren persistente String-Werte. Das ist kein Ersatz für transaktionale Workflow-Persistenz. | SPIELDATEN_BESTAETIGT | 0.98 | mittel | true |
| AL-EVENT-001 | `G.events` beschreibt Eventdefinitionen; ob ein Event jetzt lebt, muss aus Live-State/Serverstatus kommen. | OFFIZIELL_BESTAETIGT | 0.99 | niedrig | true |
| AL-SERVER-001 | Seit 04.09.2026 kann schnelles Serverwechseln für Nicht-Merchants 30 Minuten Realm Fatigue auslösen. | OFFIZIELL_BESTAETIGT | 0.99 | hoch | true |
| AL-ARCH-001 | Wertbewegende Workflows brauchen Intent-Journal + Locks + Postcondition-Reconciliation + UNKNOWN-Zustand statt „Retry bis Erfolg“. | ABGELEITETE_HYPOTHESE | 0.99 | niedrig | true |

## 1.1 Konsequenz für die V4-Architektur

Die wichtigste Systemregel lautet:

> **Command completion und gewünschter Weltzustand sind zwei getrennte Ebenen.**

Seit dem CODE-Update vom 24.08.2026 ist ein erfolgreich erfülltes öffentliches Promise eine wesentlich stärkere Serverbestätigung als in älteren Adventure-Land-Versionen. Trotzdem kann ein autonomer Prozess das Ergebnis verlieren, wenn der Server die Mutation durchgeführt hat, während Client/CODE/Socket stirbt, bevor die Bestätigung verarbeitet oder persistiert wurde.

Daraus folgt für irreversibel oder wertverändernd arbeitende V4-Workflows:

`INTENT -> PRECONDITION CHECK -> LOCK -> ACTION -> SERVER RESULT -> POSTCONDITION -> COMMIT`

Bei Disconnect/Timeout:

`UNKNOWN -> RECONNECT -> OBSERVE -> RECONCILE -> COMMIT | ABORT | MANUAL_POLICY`

**Nicht:**

`TIMEOUT -> blind retry`

---

# 2. API

## AL-API-001 — Definition Truth vs. Live Truth

**Aussage:** `G` liefert Definitionen für Items, Skills, Monster, Maps, Crafting, Events usw. Es beweist nicht, dass ein Objekt aktuell sichtbar, verfügbar oder in einem bestimmten Zustand ist.

**Quelle:** offizielle MCP-/AI-Dokumentation  
**Klasse:** `OFFIZIELL_BESTAETIGT`  
**Confidence:** 0.99  
**Drift-Gefahr:** mittel  
**Revalidierung:** nach Game-Updates; live `G.version`/MCP bevorzugen  
**Bot-Bedeutung:** Capability- und World-State-Schichten müssen getrennt bleiben.  
**Edge Cases:** saisonale NPCs, Events, instanzierte Maps, despawnte Monster, geänderte Shop-Listings.

### Empfohlene V4-Schichten

- **Definition/Capability Layer:** `G.items`, `G.skills`, `G.maps`, `G.monsters`, `G.craft`, `G.events`
- **Observed Live State:** `character`, `parent.entities`, `parent.S`, Party-/Server-/Event-State
- **Confirmed Action Result:** Promise/Game-Response
- **Reconciled State:** erneut beobachteter Zustand nach Mutation

---

## AL-API-002 — Promise-Semantik ab 24.08.2026

Die offiziellen Update Notes enthalten:

> „all public asynchronous functions now settle on real server results“

Damit ist ältere Community-Logik wie „Promise bedeutet nur, dass der Client etwas gesendet hat“ **für den heutigen Public-API-Contract nicht mehr pauschal korrekt**.

Aber:

- ein Request kann serverseitig durchgeführt worden sein, bevor die Verbindung abreißt;
- der neue Prozess kennt dann den Promise-Ausgang nicht;
- ein erfolgreicher Action-Result kann unmittelbar danach durch andere Aktionen/Spieler/Weltzustände überholt werden;
- Multi-Step-Aktionen haben Zwischenzustände.

**V4-Regel:** Public-Promise verwenden und ernst nehmen, aber Recoverability nicht ausschließlich darauf aufbauen.

---

## AL-API-003 — Deferred-Korrelation

Im aktuellen gemeinsamen Client-Code:

- `push_deferred(name)` legt pro `name` eine Queue an;
- `resolve_deferred(name, data)` nimmt den **ältesten** wartenden Eintrag;
- `reject_deferred(name, data)` ebenfalls;
- viele Legacy-Funktionen verwenden Namen wie:
  - `send`
  - `bank`
  - `party`
  - `upgrade`
  - `compound`
  - `equip`
  - usw.

Neuere/komplexere Actions verwenden teilweise zusätzlich `request_id`, dedizierte Eventlistener, Timeout und Disconnect-Handling.

### V4-Auswirkung

Für gleichartige, besonders wertverändernde Actions empfiehlt sich:

- per-Action-Channel Serialization,
- zusätzlich Resource Locks,
- keine unkontrollierte Parallelität von `send_item` + `send_gold`,
- keine parallelen Bankmutationen ohne eigenes Sequencing,
- keine parallelen Party-Mutationsbefehle aus mehreren Controllern.

---

## Globals / wichtige Zustände

### `character`

Live-Charakterzustand: Position, Map, HP/MP, Inventory, Slots, Conditions, `q`, Death-State, Gold, Class usw.

### `parent`

Enthält u.a. Engine-/Clientzustände, Socket, `entities`, Party und andere globale Runtime-Komponenten. Direkte interne Zugriffe sind mächtiger, aber V4 sollte öffentliche Contracts bevorzugen, wenn vorhanden.

### `G`

Definitionen/Metadaten. Aktuell öffentlich dokumentierte Bereiche umfassen u.a.:

- `G.version`
- `G.monsters`
- `G.maps`
- `G.geometry`
- `G.npcs`
- `G.items`
- `G.craft`
- `G.conditions`
- `G.classes`
- `G.upgrades`
- `G.compounds`
- `G.skills`
- `G.events`

### `parent.entities`

Nur beobachtbare Entities. Die offizielle Doku warnt ausdrücklich vor kurzlebigen Entity-Referenzen. Map-/Instance-/Serverwechsel, Visibility und Tod können die Referenz ungültig machen.

**V4-Regel:** Entity-ID/Name als logischen Bezug halten; unmittelbar vor einer Action neu auflösen.

---

# 3. Actions

## 3.1 Action-Risikomatrix

| Action | Serverbestätigung | Hauptgefahr | Idempotent? | V4-Behandlung |
|---|---|---|---|---|
| `attack` | Public Promise / Serverresult | Target verschwindet/stirbt/Range ändert sich | bedingt | Target neu auflösen, Fehler als World-State behandeln |
| `move` | Promise | neuer Move unterbricht vorherigen | weitgehend | Movement-Owner + Preemption Token |
| `smart_move` | Promise | Unterbrechung, dynamisches Ziel, Mapwechsel | nein als Workflow | Travel-Intent + Arrival Predicate |
| `use_skill` | Promise | Cooldown/MP/Range/Target drift | bedingt | Skillcontract + live capability + cooldown |
| `send_cm` | Result/Receivers | stale/delayed/untrusted message | nein | schema/version/nonce/TTL |
| `send_item` | Promise | Doppeltransfer nach Unknown Outcome | **nein** | Journal + Transfer-Lock + Reconcile |
| `send_gold` | Promise | Doppeltransfer nach Unknown Outcome | **nein** | Journal + Gold-Delta-Reconcile |
| `buy` | Promise | Preis/Stock/Gold/Space drift | nein | unmittelbar vor Kauf neu prüfen |
| `sell` | Promise | falscher Slot nach Inventory-Mutation | nein | Item neu lokalisieren |
| `equip` | Promise | Slot/Item verschoben | reversibel, nicht völlig | Item neu lokalisieren + Postcondition |
| `equip_batch` | Serverresult | **Partial Completion** | nein | niemals Atomizität annehmen; Slots reconcile |
| `unequip` | Promise | Inventory Space | reversibel | Space reservieren + Postcondition |
| `upgrade` | Promise | Multi-Step/Placeholder/Verlust | **nein** | exclusive item lock + q reconcile |
| `compound` | Promise | Multi-Step/3 Items/Verlust | **nein** | multi-resource lock + q reconcile |
| `exchange` | Promise | Input weg, Reward später | **nein** | q-aware transaction |
| `craft` | Promise | mehrere Inputs + Gold + Outputslot | nein | Resource set vor Mutation erneut auflösen |
| `transport` | Promise | transition in progress/disconnect | bedingt | Zielmap als Postcondition |
| `town` | Promise/timed server state | interrupted/timed | nein als travel step | Travel owner + completion predicate |
| `respawn` | Promise | death/live state drift | bedingt | nur bei bestätigtem `rip` |

---

## AL-ACT-002 — `equip_batch` kann teilweise committen

Der Server iteriert sequenziell über bis zu 15 Einträge. Für jeden gültigen Eintrag wird Equipment unmittelbar mutiert. Bei einem späteren ungültigen Eintrag wird die Schleife abgebrochen; vorherige Mutationen bleiben bestehen.

**Bedeutung:**

Ein V4-Gear-Workflow darf ein Batch-Ergebnis nicht als „alles oder nichts“ behandeln.

**Sichere Strategie:**

1. gewünschten Gear-Endzustand definieren;
2. alle Inventory-Referenzen direkt vor Start neu bestimmen;
3. Batch ausführen;
4. danach `character.slots` gegen Sollzustand reconciliieren;
5. fehlende Änderungen ggf. in neuer, frisch geplanten Runde durchführen.

`V4_ARCHITEKTURRELEVANT=true`

---

# 4. Classes

Der aktuelle offizielle `design/classes.js` enthält sieben relevante Klassen:

- Warrior
- Paladin
- Rogue
- Ranger
- Mage
- Priest
- Merchant

Diese Klassendaten enthalten u.a. Basestats, Level-Stat-Wachstum, Damage Type, HP/MP, Speed, Attack-Frequency, Range und erlaubte Weapon Types.

## Rollen für Bot-Architektur

### Warrior
Physischer Frontliner mit Taunt/Aggro-, AoE- und Defensive-Tools. Für V4 besonders wichtig: Aggro-Ownership darf nicht nur aus „wer greift an“ abgeleitet werden; Taunt/Agitate verändern den Zustand aktiv.

### Priest
Heil-/Supportklasse mit Heal, Party Heal, Revive, Curse, Absorb und defensiven Zuständen. Für autonome Gruppen muss Healing auf Live-HP/Range/Party-Zustand reagieren.

### Ranger
Hohe Range, Multi-Target- und Marking-Skills. Skills können die normale Attack-Range verwenden; fehlender fixer `range`-Wert darf nicht als „keine Range“ interpretiert werden.

### Rogue
Schneller physischer Charakter mit Invis, Burst, Pickpocket, Shadowstrike und Fan of Knives. Stealth/Visibility und PvP-Semantik benötigen getrennte Policy.

### Mage
Magische Range-Klasse mit Burst, Energize, Blink, Magiport und neuem Arcane Needle ab Level 90.

### Paladin
Seit September 2026 deutlich modernisiert: Schutz-, Aura-, Cleanse- und Ally-Link-Mechaniken. Alte Guides können hier besonders schnell veraltet sein.

### Merchant
Ökonomische/logistische Klasse mit MLuck, Mass Production, Mass Exchange, Fishing, Mining und Stand-/Marktfokus.

---

# 5. Skills

## Aktueller extrahierter Skill-Überblick

Die folgenden Werte stammen aus dem geprüften aktuellen `design/skills.js`. Sie sind **Spieldaten-Snapshots** und sollten in V4 nicht blind hart codiert, sondern aus Live-`G.skills` abgeleitet werden.

### Warrior

- `charge`: MP 0, CD 40 s
- `dash`: MP 120
- `taunt`: MP 40, CD 3 s, Range 200
- `agitate`: Level 68, MP 420, CD 2.2 s, Range 320
- `hardshell`: Level 60, MP 480, CD 16 s
- `cleave`: Level 52, MP 720, CD 1.2 s, Range 160
- `stomp`: Level 52, MP 120, CD 24 s, Range 400
- `warcry`: Level 70, MP 320, CD 60 s, Range 600

### Priest

- `curse`: MP 400, CD 5 s, Range 200
- `phaseout`: Level 64, MP 200, CD 4 s
- `darkblessing`: Level 70, MP 900, CD 60 s, Range 600
- `absorb`: Level 55, MP 200, CD 0.4 s, Range 240
- `partyheal`: MP 400, CD 0.2 s
- `revive`: MP 500, CD 0.2 s, Range 240
- `heal`: verwendet Attack-/Class-Range statt eines einfachen festen `range`-Felds

### Ranger

- `poisonarrow`: MP 360, CD 0.3 s, Attack-Range
- `piercingshot`: Level 72, MP 64, Shared-/Attack-Cooldown-Semantik
- `huntersmark`: MP 240, CD 10 s, Attack-Range
- `track`: MP 80, CD 1.6 s, Range 1440
- `supershot`: MP 400, CD 30 s, Attack-Range
- `3shot`: Level 60, MP 200
- `5shot`: Level 75, MP 320
- `4fingers`: Level 64, MP 260, CD 40 s, Range 120

### Rogue

- `rspeed`: Level 40, MP 320, CD 0.1 s, Range 320
- `pickpocket`: Level 16, MP 10, Range 15
- `pcoat`: MP 600, CD 50 s
- `invis`
- `mentalburst`: MP 180, CD 0.9 s, Attack-Range
- `quickpunch`: MP 240, CD 0.25 s
- `quickstab`: MP 320, CD 0.25 s
- `stack`
- `shadowstrike`: Level 70, MP 320, CD 1.2 s, Range 360
- `fanofknives`: Level 65, MP 180, Range 160

### Mage

- `reflection`: Level 60, MP 540, CD 30 s, Range 320
- `burst`: MP 0, CD 6 s, Attack-Range
- `cburst`: Level 75, MP 80, CD 0.24 s
- `arcane_needle`: Level 90, MP 160, Attack-Range
- `energize`: Level 20, CD 4 s, Range 320
- `light`: MP 2000
- `blink`: MP 1600, CD 1.2 s
- `magiport`: MP 900
- `entangle`: Level 72, MP 360, CD 40 s, Range 480
- `alchemy`: Level 40, MP 347, CD 8 s

### Paladin

- `selfheal`: MP 20, CD 1.2 s
- `mshield`: Toggle, CD 0.5 s
- `aether_shield`: Level 60, teilt Semantik mit Mana Shield
- `cleansing_light`: Level 30, MP 320, CD 24 s, Range 240
- `guardians_oath`: Level 50, MP 320, CD 24 s, Range 240
- `beacon_of_resolve`: Level 70, MP 640, CD 60 s, Range 480
- `paladin_aura`: Level 60, MP 0, CD 0.5 s, Range 320
- `purify`: Level 60, MP 360, CD 24 s, Range 480
- `shield_slam`: Level 60, MP 2000, CD 0.6 s
- `smash`: Level 10, MP 380, CD 0.32 s

### Merchant

- `fishing`: Level 16, MP 120, Range 15
- `mining`: Level 16, MP 120, Range 15
- `mluck`: Level 40, MP 10, CD 0.1 s, Range 320
- `mcourage`: Level 70, MP 2400, CD 2 s
- `mfrenzy`: Level 85, MP 400, CD 20 s
- `massproduction`: Level 30, MP 20, CD 0.05 s
- `massproductionpp`: Level 60, MP 200, CD 0.05 s
- `massexchange`: Level 40, MP 30, CD 0.05 s
- `massexchangepp`: Level 70, MP 200, CD 0.05 s
- `throw`: Level 60, MP 200, CD 0.4 s, Range 200

## Skill-Engine-Regel

Nicht jedes Skill-Objekt hat einen simplen festen `cooldown` und `range`.

Mögliche Semantiken:

- `use_range`
- shared cooldown (`share`)
- Class/Attack Range
- toggle/exclusive condition
- Level-gated values
- dynamische Scaling-Tabellen
- serverseitige Conditions

**V4 Capability Truth:** immer aus aktuellem `G.skills[skill]` + `can_use`/Cooldown/Live-State ableiten.

---

# 6. Items

## Itemstruktur

Der aktuelle Servercode dokumentiert u.a. folgende Itemfelder:

- `name`
- `level`
- `stat_type`
- `p` / Properties
- `q` / Quantity
- `m` / Merchant Luck
- `v` / PvP-bezogener Zustand
- `l` / Lock State
- `b` / Block State
- `r` / Rented
- `skin`
- `charges`
- `data`
- `expires`
- `gift`
- `acl`
- `rid` bei Trade-/Listing-Kontexten

Ein Feld kann kontextabhängig unterschiedliche Bedeutung haben. Beispiel: `p` wird im Upgrade-Placeholder ebenfalls für Upgrade-State benutzt.

## AL-INV-001 — Inventory Index Drift

Offizielle aktuelle Dokumentation:

> Inventory indexes can change after loot, move, sell, exchange, upgrade, compound, or consume.

Daher:

**Falsch:**
- Slot 17 langfristig als „mein Sword +8“ speichern.

**Besser:**
- logische Item-Identität speichern:
  - name
  - level
  - stat_type
  - properties
  - lock/special flags
  - quantity expectation
- vor jeder Mutation erneut lokalisieren.

## Stacking

Server und Client besitzen `can_stack`-Logik. Bank-Store versucht bei automatischer Zielwahl zuerst kompatible Stacks, danach leere Slots.

**Bot-Regel:** Nicht allein auf `name` stacken; Properties/PvP/Sonderzustände können Stackbarkeit beeinflussen.

## Placeholder

`placeholder` ist kein normales Inventarobjekt, sondern ein wichtiger laufender Transaktionszustand bei Upgrade/Compound/Exchange.

**Bot-Regel:** Ein Placeholder darf niemals wie verkaufbarer/verschiebbarer Stock behandelt werden.

---

# 7. Monsters

Der geprüfte `design/monsters.js` enthält im Repo rund 129 Monsterdefinitionen. Diese Zahl ist ein **Repo-Snapshot**, kein garantierter Live-Production-Count.

Typische Definitionsfelder:

- `hp`
- `xp`
- `attack`
- `damage_type`
- `respawn`
- `gold`
- `range`
- `frequency`
- `aggro`
- Armor/Resistance/Piercing/Spezialfelder
- spezielle Verhaltensfelder

Beispiele im geprüften Datensatz:

- Goo: `respawn: 1`, `aggro: 0`
- Bee: `respawn: 2`, `aggro: 1`
- Cute Bee: `respawn: -1`, Erklärung verweist auf seltenes Spawnverhalten
- Squig: `respawn: 12`
- Squigtoad: `respawn: 120`

**Wichtig:** Die Einheit/konkrete Semantik von Feldern muss aus Engine/Docs interpretiert werden; nicht nur aufgrund des Feldnamens.

## V4 Monster Truth

Ein Monsterziel braucht mindestens:

- Definition (`G.monsters[mtype]`)
- aktuelle Entity
- Map/Instance/Server
- `dead`/visibility
- Target/Aggro
- Distanz/Range
- aktuelle Party-Situation
- erwartetes Risk Budget

## Spawn Discovery

Mapdefinitionen enthalten Monster-Packs mit:

- `type`
- `boundary` oder `position`
- `count`
- ggf. `roam`, `grow`, `polygon`, spezielle Spawnmechanik

Daher ist „Monster X lebt auf Map Y“ nicht ausreichend für robuste Navigation; V4 sollte Spawn-Packs als eigenständige Ziele modellieren.

---

# 8. Maps

Aktuelle Mapdefinitionen enthalten u.a.:

- NPCs
- Monsterpacks
- `spawns`
- `doors`
- `on_death`
- `on_exit`
- `pvp`
- `instance`
- `ignore`
- spezielle Geometry-/Boundary-Eigenschaften

Beispiel: Türen sind strukturierte Übergänge mit Quellposition, Zielmap und Spawnindex.

## Konsequenzen für Navigation

V4 sollte einen **Map Graph** aus `G.maps`/aktuellen Live-Daten aufbauen:

`Map -> Door/Transport -> Target Map -> Target Spawn`

Dabei getrennt modellieren:

- geometrisch erreichbar?
- Door/Transport vorhanden?
- Instanz?
- Event-/seasonal gate?
- NPC/quest/level restriction?
- PvP?
- Exit-/death behavior?

## Bank-Maps

Aktuell verwendete Bankbereiche:

- `bank`
- `bank_b`
- `bank_u`

Bank-Pack-Zugriff ist an die passende Bankmap gekoppelt.

---

# 9. Events

Der aktuelle Repo-Snapshot von `design/events.js` enthält 11 Eventdefinitionen:

- anniversary
- abtesting
- goobrawl
- crabxx
- franky
- icegolem
- holidayseason
- lunarnewyear
- valentines
- egghunt
- halloween

Typen umfassen:

- seasonal
- daily
- nightly

Mehrere Events besitzen `duration` und/oder `join`.

## AL-EVENT-001 — Definition ist nicht Aktivität

`G.events` sagt, **welche Events existieren können**.

Live-Wahrheit für „läuft jetzt“ muss aus:

- Serverstatus,
- `parent.S`,
- Game Events,
- Mainframe Live State,
- aktueller Map/Entity-Lage

kommen.

### Event Worker

Empfohlener Event-State:

- `UNKNOWN`
- `INACTIVE`
- `DISCOVERED`
- `JOINING`
- `ACTIVE`
- `COMPLETING`
- `DISAPPEARED`
- `COOLDOWN`

Der Worker muss tolerieren, dass ein Event zwischen Planung und Ankunft endet.

---

# 10. Quests

Dieser Pass hat Questdetails **nicht vollständig record-by-record exportiert**.

Gesichert ist:

- Crafting-Rezepte können `quest`-Abhängigkeiten tragen;
- Events/Guides besitzen questartige Progression;
- Monster Hunts und wiederkehrende Systeme existieren;
- aktuelle Docs bieten eigene Guides für Exchanges & Quests, Monster Hunts, Eventquests und Progression.

**Status:** `UNGEKLAERT` für vollständige universelle Quest-State-Maschine.

## Offene V4-Fragen

- eindeutige Quest-State-Felder pro Questtyp,
- Daily Reset Semantik,
- Questannahme vs. Fortschritt vs. Reward-Claim,
- Wiederholbarkeit,
- Server-/Realm-Bindung,
- Verhalten bei Reconnect während Questabschluss.

---

# 11. Navigation

## `move`

Lokale Gehbewegung mit Serverprüfung. Ein neuer Move kann laufende Movement-Logik überschreiben.

## `smart_move`

Der Runner kommentiert selbst sinngemäß, dass `smart_move` nicht besonders „smart“ oder effizient ist.

Bekannte Eigenschaften:

- mehrere Maps möglich;
- Doors/Transporter werden berücksichtigt;
- bestehender Smart-Move kann durch neuen unterbrochen werden;
- Promise repräsentiert Completion/Failure;
- Monsterziele können auf Spawn-Packs aufgelöst werden;
- historische offizielle Notes dokumentieren Randomisierung zwischen Monster-Packs.

## AL-NAV-001 — Movement Ownership

V4 braucht einen einzelnen Movement Owner pro Charakter.

Beispielhafte Prioritäten:

`EMERGENCY > RECOVERY > PARTY_RENDEZVOUS > EVENT > TASK > FARM_POSITIONING`

Jeder Travel-Auftrag erhält:

- `travel_id`
- Owner
- Zieltyp
- Ziel/Predicate
- Preemption Policy
- Timeout Budget
- Recovery Strategy

## `transport`

Aktuelle Wrapper zeigen einen wichtigen Semantiktyp:

Ein internes Serverresult kann zunächst „in progress“ sein; die öffentliche Funktion wartet dann weiter, bis die Map-Postcondition erreicht ist oder Timeout/Disconnect entsteht.

Das ist ein starkes Muster für V4:

> **Nicht jedes Zwischen-ACK ist Workflow-Completion.**

---

# 12. Combat

## Server-owned Combat Truth

Die offizielle Doku ordnet dem Game Server die Verantwortung für:

- Range
- Cooldowns
- MP
- Damage
- Threat/Aggro
- Death
- Results

zu.

V4 sollte deshalb nie versuchen, die Serverwahrheit durch rein lokale Timer vollständig zu ersetzen.

## Target Lifecycle

Target-Referenzen können veralten durch:

- Tod
- Despawn
- Visibility
- Mapwechsel
- Instanzwechsel
- anderer Spieler killt Ziel
- Ziel wird aus Range bewegt

### V4 Combat Loop

1. Zielstrategie entscheidet logisches Ziel.
2. Entity Resolver sucht aktuelle Entity.
3. Safety Gate prüft HP/MP/Risk/Aggro/Party.
4. Capability Gate prüft Skill/Range/Cooldown.
5. Action wird awaited.
6. Result wird klassifiziert.
7. Zustand wird erneut beobachtet.
8. Nächste Entscheidung.

## Race Conditions

Historische Update Notes enthalten mehrere Fixes für Race Conditions/Death/Deferreds. Das zeigt, dass autonome Combat-Logik defensive Zustandsprüfungen behalten sollte, selbst wenn alte konkrete Bugs behoben sind.

---

# 13. Party

Aktuelle öffentliche Funktionen umfassen:

- `send_party_invite`
- `send_party_request`
- `accept_party_invite`
- `accept_party_request`
- `leave_party`
- `kick_party_member`
- `get_party`
- Party Chat

Diese Mutationen teilen im Runner den Deferred-Kanal `party`.

## AL-PARTY-001 — Party Snapshot Freshness

Der Runner beschreibt `get_party()` als:

> returns an infrequently updated object

Daher:

- Roster nach Mutationen explizit verifizieren;
- Party-State nicht als Heartbeat missbrauchen;
- Liveness zusätzlich über erwartete Character-State-/CM-/Serverinformationen bewerten.

## Multi-Character

Offizielle MCP-Doku:

- Parteien,
- CODE-Messages,
- Entities,
- Combat,
- Events

sind realm-/serverlokal.

Für direkt koordinierende Charaktere gilt daher praktisch:

**gleicher Server ist Voraussetzung für normale Echtzeitkoordination.**

## Party-State Drift

Mögliche Fälle:

- Invite gesendet, aber nie akzeptiert
- Leader wechselt/verlässt
- Character disconnectet
- Character wechselt Server
- Party Snapshot hinkt hinterher
- schwächerer Ersatzcharakter wird in bestehende Farmposition übernommen

V4 sollte Gruppenfähigkeit aus **aktueller Komposition** neu berechnen, nicht aus der vorherigen Gruppe erben.

---


## 13.1 CODE Messages — genaue Delivery-Semantik

Die aktuelle offizielle CODE-Message-Dokumentation präzisiert `send_cm`:

- Serverdelivery bleibt im aktuellen Game Server/Realm.
- Lokal geöffnete eigene Charaktere können zusätzlich einen schnellen lokalen Delivery-Pfad verwenden.
- `send_cm(...)` liefert ein Promise mit `{receivers, locals}`.
- Offline oder nicht vorhandene Serverempfänger tauchen einfach nicht in `receivers` auf.
- Falls lokale Zustellung bereits erfolgreich war, aber der Serverteil fehlschlägt, bleiben die lokal zugestellten Namen im Rejection-Objekt in `locals` und `receivers`. Retry-Logik kann dadurch vermeiden, dieselbe Nachricht lokal doppelt zuzustellen.
- Payloads müssen JSON-serialisierbar sein.
- Live Entity Objects, Funktionen, zyklische Objekte und DOM-Objekte sind keine geeigneten Payloads.
- Größere servergeroutete Nachrichten verbrauchen mehr Kommunikations-/Call-Capacity.
- Ein Batch an mehrere Empfänger ist günstiger als dieselbe Nachricht einzeln mehrfach zu senden.

### V4 CM Envelope

Für kritische Koordination empfiehlt sich trotzdem ein eigenes Protokoll:

- `protocol_version`
- `message_id`
- `sender`
- `sent_at`
- `expires_at`
- `type`
- `workflow_id`
- `payload`
- optional `reply_to`

Empfänger sollten zusätzlich deduplizieren und abgelaufene Nachrichten verwerfen. `send_cm` ist ein Transport, kein dauerhaftes Transaction Log.


# 14. Merchant

**Höchste Research-Priorität.**

## 14.1 Merchant als Workflow-Orchestrator

Ein robuster Merchant ist nicht nur „verkaufe Loot“.

Er ist ein Koordinator für:

- Bank
- Inventory Compression
- Goldreserve
- Materialbeschaffung
- NPC Buy/Sell
- Player Market
- Shop Listings
- Upgrade
- Compound
- Exchange
- Craft
- Supply Delivery
- Potion Delivery
- Equipment Distribution
- MLuck
- Rücktransport
- Recovery

## 14.2 Stand und Listings

Offizielle MCP-Doku:

> Ein brauchbarer Merchant benötigt sowohl einen geöffneten Stand als auch tatsächlich gelistete Items.

Daraus folgt:

`STAND_OPEN != SHOP_READY`

V4-Zustand sollte mindestens unterscheiden:

- `STAND_CLOSED`
- `STAND_OPEN_EMPTY`
- `STAND_LISTED`
- `STAND_DEGRADED`
- `STAND_REBUILDING`

## 14.3 Trade-Slot-Kapazität

Aktueller Servercode:

- Stand allgemein: 16 Slots
- Merchant Level >= 70 **oder** `cstand`: 24 Slots
- Merchant Level >= 80: 30 Slots
- `p.trades` ohne Stand: 4 Slots

**Drift:** hoch — immer live/source-revalidieren.

## 14.4 Marktbeobachtung

Marktdaten sind zeitabhängig.

Jeder beobachtete Listing-Datensatz sollte mindestens haben:

- seller
- slot
- `rid`
- item fingerprint
- quantity
- price
- observed_at
- server
- map
- distance/reachability
- expiry/TTL im Bot

### V4-Regel

Eine Beobachtung kann zur **Entscheidungsfindung** dienen, aber direkt vor `trade_buy` muss das Listing neu validiert werden.

## 14.5 RID als Optimistic Concurrency Guard

Beim Player-Shop-Kauf prüft der Server die `rid`, sofern mitgesendet. Stimmt sie nicht mehr, kann `item_gone` zurückkommen.

Das ist ein sehr wertvolles primitives Concurrency-Control-Muster.

V4 sollte bei Shops verwenden:

`observed RID -> purchase intent -> re-read -> same RID? -> buy`

## 14.6 Merchant Task Locking

Empfohlene Lock-Domänen:

- `inventory`
- `gold`
- `bank`
- `trade_slots`
- `upgrade_station`
- `compound_station`
- `exchange_station`
- `craft_inputs`
- `delivery:<character>`
- `item:<logical-fingerprint>`

Nicht jeder Task braucht alle Locks.

Beispiel:

`deliver_potions` benötigt:
- inventory,
- Zielcharaktertransfer,
- ggf. gold,
- movement.

`upgrade_item` benötigt:
- exklusive Item-Identität,
- Inventory,
- Upgrade-q,
- Scroll/Offering,
- ggf. Einkauf.

## 14.7 MLuck

`mluck` ist im aktuellen Skilldatensatz Merchant Level 40, MP 10, Range 320, sehr kurzer Cooldown.

V4 muss dennoch:

- Ziel in Range haben,
- Skill verfügbar haben,
- aktuelle Condition prüfen,
- Renewal nicht nur über lokalen Timer annehmen.

---

# 15. Economy

## Nicht hardcoden

Ökonomische Werte gehören in Live-/Definition-Daten:

- NPC-Preis
- Item Value
- Scrollkosten
- Bank-Pack-Kosten
- Craftkosten
- Listingpreise
- Shellpreise
- eventabhängige Preise/Rewards

## Goldtransfer

Aktueller Servercode enthält Transferlogik, die abhängig davon sein kann, ob Sender/Empfänger als „same“ gelten.

Da solche Economy-Regeln besonders driftanfällig und wertkritisch sind:

**V4 sollte Transferkosten niemals als ewige Konstante hardcoden.**

## Profitability

Für autonome Entscheidungen reicht Verkaufspreis minus Einkaufspreis nicht.

Mindestens berücksichtigen:

- Transaktionskosten
- Potion/Travel Cost
- Opportunity Cost
- Inventory Pressure
- benötigte Reserve
- Upgrade-/Compound-Risiko
- Materialverbrauch
- Zeit bis Verkauf
- Preisalter
- verfügbare Shop Slots

---

# 16. Bank

## AL-BANK-001 — Bank als gemounteter Zustand

`character.bank` ist kontextabhängig. Bankaktionen benötigen den Bankzustand/Bankzugriff.

Die offizielle MCP-Doku weist zudem darauf hin, dass ein Account-Bank-Snapshot nicht automatisch Live-Freshness garantiert.

## AL-BANK-002 — Packs

Geprüfter aktueller Client-Snapshot:

- `items0`–`items7`: `bank`
- `items8`–`items23`: `bank_b`
- `items24`–`items47`: `bank_u`

Je Pack werden 42 Slots verwendet.

Maximaler theoretischer Slotraum dieses Snapshots:

`48 × 42 = 2016 Slots`

Nicht alle Packs sind automatisch freigeschaltet.


## AL-BANK-003 — Nur ein eigener Charakter gleichzeitig in der Bank

Das aktuelle offizielle Banking-Tutorial sagt ausdrücklich:

> Only one of your characters can be inside the bank at a time.

Das ist eine sehr wichtige Ownership-Regel für V4.

### Konsequenz

Bankzugriff sollte als **accountweiter exklusiver Lease/Lock** betrachtet werden:

`bank_lease(account) -> character`

Ein zweiter eigener Charakter darf einen Bankworkflow nicht gleichzeitig beginnen und sollte stattdessen warten oder einen anderen Task übernehmen.

Das reduziert außerdem Race Conditions auf dem gemeinsam genutzten Bankbestand.


## Auto Store

`bank_store(num)` sucht ohne explizites Ziel:

1. passenden stackbaren Bankslot,
2. sonst ersten leeren Slot.

Bei keiner Möglichkeit: `bank_full`.

## V4 Bank Manager

Sollte verwalten:

- Pack ownership/unlocked state
- Pack map
- freie Slots
- Stack Capacity
- Reserved Slots
- Kategorie/Disposition
- Material Pools
- Gear Vault
- Sell Stock
- Upgrade Stock
- Compound Stock
- Event Stock
- Safety Reserve

## Bank Full

„Bank voll“ muss als **Planungszustand** behandelt werden, nicht erst als Fehler am Ende des Workflows.

Merchant Planner sollte Inventory Pressure vorausschauend berechnen.

---

# 17. Craft

Aktuelle Rezepte liegen im offiziellen Repo in `design/recipes.js` und werden als `G.craft` veröffentlicht.

Ein Recipe kann enthalten:

- Inputs `[quantity, item, optional level]`
- `cost`
- ggf. `quest`
- ggf. abweichendes `output`

Beispiele im aktuellen Snapshot:

- Event-/Anniversary-Rezepte
- `wblade`
- `rod`
- `pickaxe`
- weitere reguläre und spezielle Rezepte

## Server-Craft-Semantik

Der Server validiert u.a.:

- aktuelles Rezept
- benötigte Items/Levels/Quantities
- NPC/Ort bzw. zugelassene Crafting-Situation
- Gold
- Inventory Space
- aktuelle Slots

Danach werden Ressourcen mutiert und Output erzeugt.

### V4 Craft Transaction

Vor Start:

1. Rezept live lesen.
2. exakte Resource Requirements expandieren.
3. Inputs logisch reservieren.
4. Inventory-Indizes neu auflösen.
5. Outputspace reservieren.
6. Goldreserve prüfen.
7. Action.
8. Postcondition: Inputs reduziert + Output vorhanden + Gold delta.

---

# 18. Upgrade

## Mehrphasiger Ablauf

Im aktuellen Servercode:

1. aktuelles Item und Scroll prüfen;
2. Level/Grade/Offering prüfen;
3. `clevel` kann als Stale-Level-Guard dienen;
4. Scroll/Offering werden bei echter Ausführung verbraucht;
5. Ergebnis/Chance wird serverseitig bestimmt;
6. `player.q.upgrade` wird angelegt;
7. Zielslot wird `placeholder`;
8. später wird der Vorgang abgeschlossen;
9. Placeholder wird entweder durch Erfolgsitem ersetzt oder bei Verlust entfernt;
10. Result wird gesendet.

## Upgrade Timing

Aktueller normaler Code berechnet eine Dauer ungefähr aus:

`500 * new_level * sqrt(new_level) * tier_multiplier`

Mass Production kann die Dauer reduzieren.

**Nicht hardcoden** — nur als Hinweis für Workflow Timeout Budgets.

## Sichere Upgrade-Policy

V4 benötigt:

- max Item Value
- max Upgrade Level
- Scroll Policy
- Offering Policy
- min Gold Reserve
- per Session Attempt Cap
- Item Lock
- Inventory Lock
- no duplicate retry
- Recovery/Reconciliation

Die offizielle Samaritan-Merchant-Baseline folgt einem ähnlichen konservativen Prinzip: Upgrade/Compound sind standardmäßig deaktiviert, bis explizite Regeln konfiguriert sind.

---

# 19. Compound

## Preconditions

Aktueller Servercode prüft u.a.:

- kein laufendes Compound
- nicht im Bank-Mount
- drei gültige, unterschiedliche Inventory-Referenzen
- gleicher Itemname
- gleiches Level
- compoundable
- passende Scroll Grade
- aktuelle Level-/`clevel`-Semantik
- nicht locked/blocked

Dann startet ebenfalls ein zeitlicher `q.compound`-Workflow mit Placeholder.

## V4 Multi-Resource Lock

Compound benötigt eine **atomare Reservierung auf Bot-Ebene** für:

- item A
- item B
- item C
- scroll
- offering optional
- target slot/placeholder
- inventory mutation domain

Kein anderer Task darf eines dieser Items zwischen Planning und Commit verwenden.

---

# 20. Recovery

## Fehlerklassen für V4

### 1. Deterministic Reject
Beispiele:

- no item
- not enough
- out of range
- invalid target
- locked

Behandlung:
- Zustand korrigieren, nicht blind retry.

### 2. Transient Reject
Beispiele:

- Ziel kurz nicht sichtbar
- Travel temporär interrupted
- server/network temporary

Behandlung:
- begrenztes Retry mit neuem Precondition Check.

### 3. Unknown Outcome
Beispiel:
- Socket bricht nach möglicher Mutation ab, bevor Client das Ergebnis sicher persistiert.

Behandlung:
- **kein Retry**
- Reconciliation.

### 4. Partial Completion
Beispiele:
- `equip_batch`
- komplexer Merchant-Workflow nach mehreren erfolgreich ausgeführten Substeps

Behandlung:
- Istzustand gegen Sollzustand diffen und neuen Restplan bilden.

## Recovery Ledger

Empfohlene Persistenzfelder:

- `operation_id`
- `workflow_id`
- `character`
- `operation_type`
- logical resources
- expected pre-state
- expected post-state
- status:
  - PREPARED
  - SENT
  - CONFIRMED
  - UNKNOWN
  - RECONCILING
  - COMMITTED
  - ABORTED
- action result
- observed_at
- last reconciliation result

---

# 21. Reconnect

## AL-REC-001 — Serverseitiges `stale`

Beim Player-Exit markiert die Serverlogik laufende `player.q`-Einträge als `stale=true`.

Beim späteren Upgrade-/Compound-Abschluss wird dieses `stale` in den Resultdaten weitergegeben.

Das ist ein deutlicher Hinweis, dass Adventure Land selbst den Fall „Operation lief über einen Disconnect hinweg“ kennt.

## Reconnect-Protokoll für V4

Nach Wiederverbindung:

1. keine wertverändernden Workflows sofort starten;
2. Charakteridentität/Server/Map prüfen;
3. `character.q` lesen;
4. Inventory nach `placeholder` durchsuchen;
5. Gold vergleichen;
6. erwartete Transfer-/Trade-/Bank-Postconditions prüfen;
7. offene Journal-Operationen reconciliieren;
8. erst danach Scheduler freigeben.

## Aktuelle Reconnect-Note

Die offiziellen Update Notes vom 13.09.2026 melden einen Fix für fehlgeschlagene Logins, die Charaktere „stuck online“ ließen und Reconnect verhinderten.

**Bedeutung:** Reconnect ist ein aktiv entwickelter Bereich und sollte als Drift-/Regression-Risiko behandelt werden.

---

# 22. Persistence

## `set` / `get`

Aktueller Runner:

- serialisierbare Objekte
- Browser `window.localStorage`
- Key-Präfix `cstore_`
- `set()` kann bei Fehler `false` liefern
- `get()` kann `null` liefern

## `pset` / `pget`

Persistent string values; Web nutzt `localStorage`, andere Clients können eine andere Storage-Abstraktion verwenden.

## Lokale CODE Messages

Für lokal laufende Charaktere werden CM-Nachrichten über `localStorage` transportiert; dabei gibt es Heartbeat-/Stale-Mechanik.

### Architekturgrenze

Diese Storage-Funktionen sind praktisch für:

- Preferences
- Cache
- kleine Checkpoints

Sie sind kein vollwertiges Transaction Log mit:

- atomarem Compare-and-Swap
- genau-einmal Semantik
- Multi-Character Consensus

Für kritische Workflow-Recovery muss V4 daher zusätzlich durch Live-State-Reconciliation abgesichert sein.

---


# 22.1 Request-/Call-Cost-Semantik

Der aktuelle Game-Server führt für Socket-Aktionen eine Call-Cost-Historie in einem rollenden Fenster von ungefähr **4 Sekunden**.

Im geprüften Servercode:

- alte Einträge älter als 4000 ms werden aus der Cost-Historie entfernt;
- Methoden können unterschiedliche Costs über eine `CC`-Konfiguration bekommen;
- CODE-Messages werden zusätzlich nach Payload-/Empfängercharakteristik belastet;
- überschreitet die aufsummierte Cost das aktuelle Serverlimit `limits.calls`, sendet der Server einen `limitdcreport`, setzt den Disconnect-Grund `limitdc` und trennt die Verbindung;
- ein interner Handlerfehler kann zusätzliche Call-Cost verursachen.

Der **konkrete Threshold** ist in dem hier geprüften Open-Source-Stand nicht als universelle feste Konstante abgesichert und sollte deshalb nicht hart codiert werden.

## Wichtige Begriffsabgrenzung: Mainframe „Call cost“

Die aktuelle Mainframe-Dokumentation verwendet denselben Ausdruck für etwas anderes:

> Mainframe „Call cost“ = aktuelle CPU-Nutzung des Workers als Prozent seines festen CPU-Budgets.

Das ist **keine Shell-Gebühr und nicht dasselbe wie der Game-Server-Socket-Call-Cost-Limiter**.

### V4-Regel

Der Scheduler sollte Game-Actions nicht mit Maximalfrequenz feuern, sondern:

- Cooldown-/Action-aware schedulen,
- gleiche Async-Loops serialisieren,
- CM bündeln,
- Retry-Backoff verwenden,
- `limitdc` als eigener Recovery-Grund erfassen,
- keine fixe magische Calls-per-Second-Zahl einbauen, sofern diese nicht live verifiziert wurde.


# 23. Community Findings

Community-Code wird hier **nicht** als offizielle Spielwahrheit behandelt.

## CF-001 — Merchant Loops

Repository: `grimery/Adventure.Land`

Interessante historische/erprobte Patterns:

- Stand zyklisch schließen
- Supplies kaufen
- Fighter beliefern
- Loot/Gold einsammeln
- Bank/Upgrade/Exchange erledigen
- zurück zum Shop
- Stand wieder öffnen
- Trash verkaufen
- Inventory sortieren
- MLuck verteilen
- Marktgelegenheiten prüfen

**Klasse:** `COMMUNITY_HINWEIS`

**V4-Wert:** gutes Taskgraph-Beispiel, aber nicht als Architektur direkt kopieren.

## CF-002 — Smart-Move Spawn Pack

Community-Code dokumentiert, dass `smart_move` auf einen Monster-Typ bei mehreren Spawn-Packs zu unterschiedlichen Packs führen kann.

Historische offizielle Update Notes bestätigen, dass Randomisierung zwischen Monster-Packs bewusst eingeführt wurde.

**Klasse:** `MEHRFACH_EXTERN_BESTAETIGT`

**Revalidierung:** exakte 2026-Live-Semantik testen.

## CF-003 — Monitoring

`adventureland-community/monitoring` erfasst u.a.:

- kills
- damage dealt/received
- skills
- deaths
- chests
- loot
- gold
- buys/sales
- XP
- upgrade success/fail
- compound success/fail
- ping
- sent/received gold

**V4-Wert:** bestätigt, dass gute Adventure-Land-Automation observability-first gedacht werden sollte.

## CF-004 — Alternative Clients

Projekte wie ALClient/caracAL zeigen:

- headless/multi-character Ansätze
- Pathfinder
- Server-/Client abstraction
- Monitoring

**Warnung:** alternative Clients sind nicht identisch mit dem offiziellen CODE-Contract und können eigene Semantik hinzufügen.

---

# 24. GitHub Findings

## Offizielles Repository

`kaansoral/adventureland_mongodb`

Projektstruktur laut README:

- `main.js`
- `api.js`
- `adventure_functions.js`
- `models.js`
- `crons.js`
- `node/server.js`
- `node/server_functions.js`
- `node/precompute_bfs.js`
- `design/*`
- `docs/*`
- `js/*`
- `mainframe.js`
- `mcp_api.js`

Das Repository ist die heutige Node.js-/MongoDB-Edition und verwendet Express, Socket.IO und MongoDB.

## Besonders relevante Dateien für V4-Research

### Client/Public API
- `js/runner_functions.js`
- `js/functions.js`
- `js/game.js`
- `js/old_common_functions.js`

### Server Truth
- `node/server.js`
- `node/server_functions.js`

### Game Data
- `design/classes.js`
- `design/skills.js`
- `design/items.js`
- `design/monsters.js`
- `design/maps.js`
- `design/events.js`
- `design/recipes.js`
- `design/npcs.js`
- `design/drops.js`

### AI/Mainframe
- `mcp_api.js`
- `mainframe.js`
- aktuelle MCP-Dokumentation

---

# 25. Open Questions

Diese Fragen bleiben nach diesem Pass bewusst offen oder benötigen Live-Revalidierung.

## API / Runtime

1. Welche Public Functions besitzen aktuell intern eindeutige `request_id`-Korrelation und welche nur Legacy-`place`-FIFO?
2. Welche Deferreds werden bei vollständigem Code-Restart/Reload verworfen?
3. Welche Socket-/Game Events sind für exakt-einmalartige Reconciliation besonders zuverlässig?
4. Wie unterscheiden sich Browser, Steam/Tauri und Mainframe bei Storage/Reload?

## Call Costs / Limits

5. Vollständige aktuelle `CC`-Cost-Tabelle je Socket-Action und ihre Live-Abweichungen.
6. Exakter aktueller `limits.calls`-Threshold je Server/Mode; der Mechanismus ist bestätigt, die universelle Zahl noch nicht.
7. Wie sollten mehrere Character in einer Mainframe-Gruppe ihren Game-Call-Budget und ihr separates CPU-Budget koordinieren?

## Navigation

8. Exakte aktuelle Spawn-Pack-Wahl von `smart_move({to: monster})` im Live-System.
9. Alle Failure Reasons von `smart_move`.
10. Verhalten bei Eventmap-Verschwinden während Travel.
11. Pathfinding-Unreachable Detection und optimale Anti-Stuck-Timeouts.

## Party

12. Exakte Aktualisierungsfrequenz von `parent.party`.
13. Beste serverseitige Liveness-Quelle für Partycharaktere.
14. Verhalten bei Leader-Disconnect über verschiedene Modes.

## Merchant / Economy

15. Live-Market-Snapshot-Zugriff und zulässige Scan-Frequenzen.
16. Exakte aktuelle Tax-/Transferregeln in allen Servermodi.
17. Player-Shop-Listing-Lebensdauer/Standverhalten bei Disconnect.
18. Verhalten eines Trade-Slots bei Stack-Teilverkauf.
19. Vollständige Semantik aller Special Properties beim Listing.
20. Event-/Home-Server-spezifische Ökonomie.

## Bank

21. Aktuell deployte Packanzahl/Unlockpreise im Live-`G`/Account-System.
22. Welche genaue Failure-/Queue-Semantik sieht ein zweiter eigener Charakter, wenn bereits ein anderer Charakter die Bank belegt?
23. Welche Bankänderungen werden wie schnell in anderen Character-Snapshots sichtbar?

## Upgrade / Compound

24. Exakte aktuelle Wahrscheinlichkeitsformeln aus Live-Daten.
25. Grace-/Offering-Semantik über alle Upgradegrade.
26. Was passiert bei vollständigem Game-Server-Prozessausfall während `q`?
27. Persistiert `q` über jeden Restart-Typ oder nur Character Disconnect/Reconnect?
28. Welche transienten Result-Events können nach Reconnect erneut/verspätet eintreffen?

## Craft / Exchange

29. Vollständige Live-Rezeptliste und alle quest-/event-gated Rezepte.
30. Alle Exchange-Tables und Input-/Output-Sonderfälle.
31. Outputspace-Verhalten für Mehrfach-/Sonderoutputs.

## Quests / Events

32. Einheitliches Quest State Model.
33. Resetzeiten für Daily/Nightly.
34. Event-State-Transitions pro Event.
35. Reward-Claim-Idempotenz.

## PvP / Hardcore

36. Action-/Range-/Aggro-Unterschiede.
37. Item-/Death-/Loot-Risiken.
38. Welche normalen Automationsstrategien müssen hart deaktiviert werden?

---

# 26. V4 Architektur-Mapping

## Ownership

Erforderliche eindeutige Owner:

- Movement Owner
- Combat Target Owner
- Inventory Mutation Owner
- Bank Owner
- Merchant Stand Owner
- Upgrade/Compound/Exchange Owner
- Party Mutation Owner

## Workflows

Workflows müssen explizite Phasen haben:

- PREPARE
- ACQUIRE
- VALIDATE
- EXECUTE
- WAIT
- VERIFY
- COMMIT
- RECOVER

## Transactions

Transaktionale Behandlung insbesondere für:

- gold transfer
- item transfer
- trade buy/sell
- bank deposit/withdraw/store/retrieve
- upgrade
- compound
- exchange
- craft
- multi-step gear changes

## Locks

Locks sollten logische Ressourcen adressieren, nicht nur Funktionsnamen.

## Recovery

`UNKNOWN` ist ein legitimer Zustand und darf nicht in „failed“ umgeschrieben werden, bevor geprüft wurde, was der Server tatsächlich getan hat.

## Reconciliation

Postconditions müssen domänenspezifisch sein.

Beispiele:

### send_item
- Senderquantity reduziert?
- Empfängerquantity erhöht?
- Item eventuell in anderen Slot gestackt?
- Event/History vorhanden?

### upgrade
- `q.upgrade` noch aktiv?
- Placeholder vorhanden?
- Item neues Level?
- Item verschwunden?
- Scroll/Offering verbraucht?

### trade_buy
- Golddelta?
- Item im Inventory?
- Listing RID noch vorhanden?
- Quantity verändert?

## Idempotency

Wo der Game Contract keine Idempotency-Key-Semantik bietet, muss V4 Idempotenz durch **Beobachtung und Workflow-Design** herstellen.

## Preemption

Nicht jede Operation darf unterbrochen werden.

### preemptible
- normales Travel
- Farmpositionierung
- Market scan

### nur kontrolliert preemptible
- Party rendezvous
- Supply run

### nicht blind preemptible
- Upgrade/Compound/Exchange
- wertkritische Transfers
- gerade laufende Bank-/Trade-Transaktionssequenzen

## Persistence

Persistieren:

- offene Intentions
- Workflowphase
- logische Ressourcen
- erwartete Postconditions
- Recovery Status
- letzte sichere Beobachtung

Nicht persistieren als Wahrheit:

- langfristige Inventory-Slotnummer
- Entity-Objektreferenz
- alte Party Snapshot-Objekte
- stale Shop Listing ohne TTL

## Capability Truth

Skill-/Item-/Mapfähigkeit muss aus:

`Definition + Character State + Live World + Server Rules`

entstehen.

## Safety

Harte Sicherheitsgrenzen:

- kein wertveränderndes blind retry nach UNKNOWN
- keine Nutzung gelockter/special Items ohne explizite Policy
- kein Upgrade/Compound über configured max level/value
- keine Marktaktion auf stale Listing
- kein Combat Target nur aufgrund alter Entity
- kein Serverhop ohne Mode/Class-aware Policy
- kein Merchant Task ohne Reserve/Space Plan

---

# 27. Priorisierte Research-Fortsetzung

## P0 — Muss vor Merchant-Orchestrator abgeschlossen werden

1. vollständige Action-Contract-Matrix aller wertverändernden Public Functions;
2. genaue Recovery-Semantik pro Action;
3. Bank-Concurrency mehrerer eigener Characters;
4. Trade Listing lifecycle/RID/partial sale;
5. vollständige Upgrade-/Compound-Formeln und Resultcodes;
6. Exchange/Craft Special Cases;
7. Request-/Call-Cost- und Rate-Limit-Modell.

## P1 — Für autonome Gruppen

8. Party freshness/liveness;
9. CM delivery/retry;
10. server-local constraints;
11. Skill-/Cooldown-Matrix live;
12. Aggro/Threat/CC details;
13. death/respawn/rejoin;
14. Group composition capability calculation.

## P2 — Für World Autonomy

15. vollständiger Mapgraph;
16. alle Spawn-Packs;
17. Event State Machines;
18. Quests;
19. Rare/Boss discovery;
20. server hopping;
21. PvP/Hardcore policies.

---

# 28. Quellenindex

## Offiziell

1. Adventure Land — MCP / AI Guide  
   https://adventure.land/docs/guide/tracktrix/null/adventure-mcp

2. Adventure Land — CODE Functions  
   https://adventure.land/docs/code/functions

3. Adventure Land — Update Notes  
   https://adventure.land/allnotes

4. Adventure Land — Website / Docs Hub  
   https://adventure.land/

5. Adventure Land — current official source repository  
   https://github.com/kaansoral/adventureland_mongodb

6. Current runner functions  
   https://github.com/kaansoral/adventureland_mongodb/blob/main/js/runner_functions.js

7. Current client/game handlers  
   https://github.com/kaansoral/adventureland_mongodb/blob/main/js/game.js

8. Shared client helpers / deferred implementation  
   https://github.com/kaansoral/adventureland_mongodb/blob/main/js/old_common_functions.js

9. Current server handlers  
   https://github.com/kaansoral/adventureland_mongodb/blob/main/node/server.js

10. Current server helpers  
    https://github.com/kaansoral/adventureland_mongodb/blob/main/node/server_functions.js

11. Classes  
    https://github.com/kaansoral/adventureland_mongodb/blob/main/design/classes.js

12. Skills  
    https://github.com/kaansoral/adventureland_mongodb/blob/main/design/skills.js

13. Items  
    https://github.com/kaansoral/adventureland_mongodb/blob/main/design/items.js

14. Monsters  
    https://github.com/kaansoral/adventureland_mongodb/blob/main/design/monsters.js

15. Maps  
    https://github.com/kaansoral/adventureland_mongodb/blob/main/design/maps.js

16. Events  
    https://github.com/kaansoral/adventureland_mongodb/blob/main/design/events.js

17. Recipes  
    https://github.com/kaansoral/adventureland_mongodb/blob/main/design/recipes.js

## Community / Erfahrungsquellen

18. Adventure Land Community Monitoring  
    https://github.com/adventureland-community/monitoring

19. grimery / Adventure.Land  
    https://github.com/grimery/Adventure.Land

20. ALClient  
    https://github.com/earthiverse/ALClient

---

# 29. Research-Fazit

Die wichtigste Änderung gegenüber vielen älteren Adventure-Land-Botannahmen ist der **aktuelle Public-API-Contract**: Seit 24.08.2026 sollen öffentliche asynchrone Funktionen auf echte Serverergebnisse warten. V4 kann diese Promises daher als Action-Level-Bestätigung verwenden.

Für einen echten 24/7-Bot reicht das trotzdem nicht. Die aktuelle offizielle Implementierung zeigt zahlreiche Zustandsübergänge, die einen robusten Workflow- und Recovery-Layer verlangen:

- Inventory-Slots driften.
- Entities sind kurzlebig.
- Party-Snapshots können hinterherhinken.
- gleichartige Legacy-Actions teilen FIFO-Deferred-Kanäle.
- wertkritische Aktionen sind nicht idempotent.
- Upgrade/Compound/Exchange sind mehrphasig.
- Disconnect kann den Kenntnisstand des Bots vom tatsächlichen Serverzustand trennen.
- Batch-Aktionen können teilweise abgeschlossen sein.
- Player-Shop-Listings sind veränderlich und besitzen mit `rid` einen wichtigen Stale-Guard.
- Bank und Merchant benötigen Kapazitäts-, Ownership- und Lock-Management.
- Live-State hat Vorrang vor Definitionen und alten Caches.

Damit ist für V4 eine **reconciliation-first, transaction-aware Architektur** nicht nur ein theoretischer Qualitätsgewinn, sondern direkt durch aktuelle Adventure-Land-Mechaniken begründet.
# 30. Vollständiger NPC- und Event-Katalog

**Snapshot-Basis:** offizielles `G.npcs`/`design/npcs.js`, `G.maps`/`design/maps.js`, `G.events`/`design/events.js`, aktueller Client-Interaktionscode und offizielle Event-Guides. Geprüfter Repo-Commit: `ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4`.

Im geprüften Snapshot existieren **135 NPC-Definitionen in 46 Rollen**. Davon sind **48 Bank-Pack-NPCs** (`items0`–`items47`) und **30 `citizen`-Definitionen**. Ein wichtiger Architekturpunkt: `role: citizen` bedeutet nicht automatisch „nur Dekoration“; einige Citizens besitzen echte World-/Market-Verhaltenslogik.

## 30.1 NPC Truth Model für V4

- **Stabile Identität:** In CODE nach Möglichkeit NPC-ID (`G.npcs[id]`) verwenden, nicht Displayname.
- **Definition:** `G.npcs[id]` beschreibt Rolle, Shopitems, Questkey, Skin und Dialog.
- **Platzierung:** `G.maps[map].npcs` bzw. `seasonal_npcs`; saisonale/servererzeugte NPCs können ohne statische Platzierung existieren.
- **Live Entity:** `get_nearest_npc()` sieht nur aktuell gerenderte NPCs. `find_npc(id)` findet statische/saisonale Smart-Move-Ziele, soweit in den aktuellen Maps vorhanden.
- **Serverprüfung bleibt maßgeblich:** Distanz, Inventory, Currency und Itemregeln werden serverseitig geprüft.
- **V4-Kategorien statt Displaynamen:** z. B. `NPC_SHOP`, `TOKEN_EXCHANGE`, `BANK`, `CRAFT`, `UPGRADE`, `EVENT`, `WORLD_BEHAVIOR`.

## 30.2 Funktions-NPCs

| NPC-ID | Name | Rolle | Map/Position | Funktion | V4-Kategorie |
|---|---|---|---|---|---|
| anniversary_baker | Mira | anniversary_crafter | main* (64,-88) | Anniversary-Werkstatt: Sixfold Cake und auswählbare Anniversary-Geschenke craften; eventgebunden. | CRAFT / EVENT |
| pots | — | merchant | old_main (10,10); original_main (112,40) | Legacy/alte Potion-Shop-Definition: HP-/MP-Potions. | NPC_SHOP |
| standmerchant | Divian | standmerchant | main (-193,680) | Verkauft Merchant Stand (`stand0`) und weitere Stand-/Giveaway-bezogene Waren. | MERCHANT_INFRA |
| pvptokens | Gn. Spence | pvptokens | main (159,403) | PvP-Token-Shop; Token gegen definierte Rewards tauschen. | TOKEN_EXCHANGE |
| funtokens | Tricksy | funtokens | main (303,-87) | Fun-Token-Shop; `exchange_buy('funtoken', ...)`. | TOKEN_EXCHANGE |
| friendtokens | Fvona | friendtokens | main (120,-560) | Friend-Token-Shop. | TOKEN_EXCHANGE |
| shellsguy | Mr. Dworf | shells | keine statische Platzierung im Snapshot | Shell-Kauf/Gold-zu-Shells-Interaktion; Definition vorhanden, Platzierung dynamisch/legacy. | CURRENCY |
| monsterhunter | Daisy | monstertokens | main (126,-413) | Monster-Token-Shop sowie Monster-Hunt starten/abschließen (`interact('monsterhunt')`). | QUEST / TOKEN_EXCHANGE |
| favors | Favoré | favors | main (79,-47) | Realm-weite Server-Blessing gegen Shells; aktuelle UI nennt 3 Tage und 1.200 Shells. | SERVER_STATE |
| mcollector | Cole | mcollector | main (81,-283) | Material Collector: spezielle `mcollector`-Rezepte/Materialtausch. | CRAFT / EXCHANGE |
| thief | Crun | merchant | level2 (-133,-187) | Spezialhändler u.a. für `licence`, `softstepgloves`, `scroll3`, `cscroll3`. | NPC_SHOP |
| fancypots | Ernis | merchant | main (-35,-162); halloween (201,-180) | Potion-Händler. | NPC_SHOP |
| tbartender | Jaqk | merchant | tavern (150,-202) | Tavern-Händler für Getränke/Consumables und Spezialitems. | NPC_SHOP / TAVERN |
| wbartender | Warin | merchant | winter_inn (-143,-220) | Winter-Inn-Händler: Potions und Luck-Elixir. | NPC_SHOP |
| scrolls | Lucas | merchant | old_main (112,-152); original_main (241,-215); main (-464,-96) | Scroll-Händler für Upgrade-/Compound- und Stat-Scrolls. | NPC_SHOP / ITEM_IMPROVEMENT |
| secondhands | Ponty | secondhands | main (106,-47) | Secondhands-Markt: Listings abrufen und per RID kaufen (`get_secondhands`, `buy_secondhand`). | MARKET |
| rewards | Werdars | rewards | bank (155,-105) | Reward-NPC-Definition. Im geprüften `npc_right_click`-Pfad kein eigener Servicehandler gefunden; live revalidieren. | UNGEKLAERT |
| lostandfound | Ron | lostandfound | woffice (-24,-178) | Lost-and-Found-Markt: Bestand abrufen und per RID kaufen. | MARKET |
| holo | Z | resort | resort (-8,-108) | Resort/Holo-NPC. Definition vorhanden; konkrete Workflow-API in diesem Pass nicht als eigener Handler bestätigt. | RESORT / UNGEKLAERT |
| tavern | Jaqk | tavern | keine statische Platzierung im Snapshot | Tavern-Informations-/Interaktionsrolle; eigentliche Spiele besitzen eigene CODE-Funktionen. | TAVERN |
| pete | Pete | petkeeper | main (-776,1256) | Pet Shrine / Pet-Verwaltung. | PET |
| guard | Guard | guard | winterland (1065,-2015) | Zugangssperre/Guard-Dialog; kein regulärer Shop. | ACCESS_CONTROL |
| ship | — | ship | keine statische Platzierung im Snapshot | Schiffs-/Transportdefinition; dynamisch/legacy, keine stabile statische Platzierung. | TRAVEL / UNGEKLAERT |
| newyear_tree | New Year Tree | newyear_tree | keine statische Platzierung im Snapshot | Holiday-Spirit-Interaktion; erneute gültige Nutzung kann Fun Token geben. | EVENT / BUFF |
| lotterylady | Rose | lottery | main (-341,168) | Lottery-NPC; aktuelle Client-Interaktion meldet, dass Tickets noch nicht angekommen sind. | TAVERN / UNGEKLAERT |
| mistletoe | Faith | quest | saisonal/dynamisch | Holiday-Turn-in für `mistletoe`. | QUEST / EVENT |
| ornaments | Jayson | quest | saisonal/dynamisch | Holiday-Turn-in für `ornament`. | QUEST / EVENT |
| santa | Santa | santa | saisonal/dynamisch | Holiday-Turn-in für `candycane`. | QUEST / EVENT |
| witch | Witch | witch | halloween (858,-160) | Witch-Rezepte/Materialsammlung; spezielle Craft-/Collect-Rezepte. | CRAFT / EVENT |
| jailer | Jailord | jailer | jail (191,-156) | Jail-Exit; UI bietet `LEAVE`. | RECOVERY / TRAVEL |
| leathermerchant | Landon | quest | winterland (262,-48.5) | Leather-Turn-in / Exchange. | QUEST / EXCHANGE |
| gemmerchant | Mine Heathcliff | quest | tunnel (-264,-96,2) | Gem-Fragment-Turn-in / Exchange. | QUEST / EXCHANGE |
| fisherman | Tristian | quest | main (-1572,552,1) | Seashell-Turn-in / Exchange. | QUEST / EXCHANGE |
| pwincess | Wynifreed | quest | mansion (0,-303) | Lost-Earring-Turn-in / Exchange. | QUEST / EXCHANGE |
| firstc | — | companion | keine statische Platzierung im Snapshot | Companion-/Dialogdefinition; kein bestätigter kritischer Workflow. | AMBIENT |
| pvpblocker | — | blocker | keine statische Platzierung im Snapshot | PvP-Zugangssperre; serverseitige Blocker-Interaktion. | ACCESS_CONTROL |
| pvp | Ace | pvp_announcer | original_main Pfad; main Pfad | PvP-Announcer/Interaktionsfigur; bewegte Platzierung. | PVP |
| bean | Bean | events | main (74,-34) | Setzt/zeigt Home Realm; Homewechsel hat Cooldown und beeinflusst Home-Rewards. | SERVER_STATE / EVENT |
| bouncer | Wogue | bouncer | tavern (208,-156) | Tavern-Bouncer/Guard- und Dialogrolle. | ACCESS_CONTROL / TAVERN |
| goldnpc | Mr. Rich | gold | old_bank (57,0); bank (1,-416) | Bank-Gold-UI: Deposit/Withdraw. | BANK |
| wizardrepeater | Wizard | repeater | shellsisland (-190,26) | Repeater-/Flavor-NPC; kein eigener kritischer Servicehandler in diesem Pass bestätigt. | AMBIENT / UNGEKLAERT |
| wnpc | Wizard | thesearch | woffice (32,-178,3) | `glitch`-Quest; im Hardcore-Modus zusätzlich Teleport-Interaktion. | QUEST / TRAVEL |
| craftsman | Leo | craftsman | main (92,670) | Reguläres Crafting und Dismantling/Recycling. | CRAFT |
| basics | Gabriel | merchant | main (-89,-165) | Basis-Ausrüstungshändler: frühe Waffen/Rüstung. | NPC_SHOP |
| premium | Garwyn | merchant | main (192,-564) | Händler u.a. für Booster, Tome, Offering, Qubics; Preis/Currency live prüfen. | NPC_SHOP |
| antip2w | Mr. Dworf | premium | main (274,-554) | Premium/Shell-basierter Kosmetik-Shop. | PREMIUM_SHOP |
| armors | — | merchant | old_main (-20,10); original_main (-106,-211) | Legacy-Rüstungshändler-Definition; aktuelle Mainland-Ausrüstung primär über Gabriel. | NPC_SHOP / LEGACY |
| weapons | — | merchant | old_main (40,10); original_main (61,-220) | Legacy-Waffenhändler-Definition. | NPC_SHOP / LEGACY |
| exchange | Xyn | exchange | original_main (163,-197); main (-25,-478) | Exchange Shrine für exchangeable Items/Eventitems. | EXCHANGE |
| shrine | — | shrine | old_main (4,-155); original_main (319,-178) | Legacy Upgrade Shrine. | UPGRADE / LEGACY |
| compound | — | compound | old_main (46,-155); original_main (362,-178) | Legacy Compound Shrine. | COMPOUND / LEGACY |
| newupgrade | Cue | newupgrade | main (-207,-220) | Aktueller kombinierter Upgrade-/Compound-NPC. | UPGRADE / COMPOUND |
| locksmith | Smith | locksmith | desertland (316,-270) | Item `lock`, `seal`, `unlock`; Seal verhindert sofortiges Entsperren. | ITEM_SAFETY |
| scrollsmith | Sir Bob | scrollsmith | desertland (606,-1590) | De-stat: Stat-Scrolls zurückgewinnen, Item zurücksetzen; Kosten abhängig von Scrolls. | ITEM_IMPROVEMENT |
| transporter | Alia | transport | main (-83,-441); winterland (-73,-393); desertland (-14,-477); halloween (-97,-330); weitere Legacy/Event-Maps | Transporter zwischen Maps; öffentliche `transport`/Travel-Funktionen bevorzugen. | TRAVEL |
| appearance | Haila | cx | main (-361,-832); original_main (792,800) | CX/Cosmetic-Exchange-/Appearance-Interaktion. | COSMETICS |
| lichteaser | — | tease | original_main (1352,64) | Teaser-/Legacy-NPC; kein produktiver V4-Workflow. | AMBIENT / LEGACY |

### Wichtige öffentliche CODE-Bezüge

- Standard-NPC-Shops → `buy(...)` / je nach Shop `buy_with_gold(...)` oder `buy_with_shells(...)`.
- Token Shops → `exchange_buy(token, item)`.
- Secondhands → `get_secondhands()` / `buy_secondhand(rid)`.
- Lost & Found → `get_lost_and_found()` / `buy_lost_and_found(rid)`.
- Home Realm bei Bean → `set_home()`.
- Server Blessing bei Favoré → `bless_server()`.
- Monster Hunt bei Daisy → `interact('monsterhunt')`.
- Holiday Tree → `interact('newyear_tree')`.
- Crafting → `craft`, `auto_craft`, `dismantle`.
- Upgrade/Compound → `upgrade`, `compound`; `newupgrade` ist der aktuelle kombinierte Mainland-Service.
- Locksmith → `lock_item`, `seal_item`, `unlock_item`.
- Scrollsmith → `destat_item`.
- Transport → `transport`, `smart_move`; öffentliche Funktion vor Raw Socket bevorzugen.

## 30.3 Bank-Pack-NPCs

Alle folgenden Definitionen besitzen `role: items` und öffnen den jeweiligen Bank-Pack. Ein Pack ist **kein eigener unabhängiger Bankbestand**; alle Packs gehören zum geteilten Account-Bankzustand.

| NPC-ID / Pack | Name | Map/Position | Funktion |
|---|---|---|---|
| items0 | Gabrielle | bank (-64,-191); old_bank (-24,49) | Zugriff auf Bank-Pack `items0` |
| items1 | Gabriella | bank (64,-191); old_bank (128,49) | Zugriff auf Bank-Pack `items1` |
| items2 | Ledia | bank (-128,-191) | Zugriff auf Bank-Pack `items2` |
| items3 | Lidia | bank (128,-191) | Zugriff auf Bank-Pack `items3` |
| items4 | Christie | bank (-64,-415) | Zugriff auf Bank-Pack `items4` |
| items5 | Christina | bank (64,-415) | Zugriff auf Bank-Pack `items5` |
| items6 | Jane | bank (-128,-415) | Zugriff auf Bank-Pack `items6` |
| items7 | Janet | bank (128,-415) | Zugriff auf Bank-Pack `items7` |
| items8 | X8 | bank_b (-592.5,-300) | Zugriff auf Bank-Pack `items8` |
| items9 | X9 | bank_b (-528,-318) | Zugriff auf Bank-Pack `items9` |
| items10 | X10 | bank_b (-464,-333) | Zugriff auf Bank-Pack `items10` |
| items11 | X11 | bank_b (-400.5,-350) | Zugriff auf Bank-Pack `items11` |
| items12 | X12 | bank_b (-128.5,-429.5) | Zugriff auf Bank-Pack `items12` |
| items13 | X13 | bank_b (-64.5,-413.5) | Zugriff auf Bank-Pack `items13` |
| items14 | X14 | bank_b (-0.5,-398) | Zugriff auf Bank-Pack `items14` |
| items15 | X15 | bank_b (63,-381.5) | Zugriff auf Bank-Pack `items15` |
| items16 | X16 | bank_b (-480.5,50) | Zugriff auf Bank-Pack `items16` |
| items17 | X17 | bank_b (-416.5,65.5) | Zugriff auf Bank-Pack `items17` |
| items18 | X18 | bank_b (-352.5,81.5) | Zugriff auf Bank-Pack `items18` |
| items19 | X19 | bank_b (-288.5,97.5) | Zugriff auf Bank-Pack `items19` |
| items20 | X20 | bank_b (-16.5,-14) | Zugriff auf Bank-Pack `items20` |
| items21 | X21 | bank_b (47.5,-14) | Zugriff auf Bank-Pack `items21` |
| items22 | X22 | bank_b (111,-14) | Zugriff auf Bank-Pack `items22` |
| items23 | X23 | bank_b (175,-14) | Zugriff auf Bank-Pack `items23` |
| items24 | X24 | bank_u (-361,-518) | Zugriff auf Bank-Pack `items24` |
| items25 | X25 | bank_u (-297,-502) | Zugriff auf Bank-Pack `items25` |
| items26 | X26 | bank_u (-232,-502) | Zugriff auf Bank-Pack `items26` |
| items27 | X27 | bank_u (-169,-518) | Zugriff auf Bank-Pack `items27` |
| items28 | X28 | bank_u (-104,-518) | Zugriff auf Bank-Pack `items28` |
| items29 | X29 | bank_u (-41,-502) | Zugriff auf Bank-Pack `items29` |
| items30 | X30 | bank_u (23,-502) | Zugriff auf Bank-Pack `items30` |
| items31 | X31 | bank_u (87,-518) | Zugriff auf Bank-Pack `items31` |
| items32 | X32 | bank_u (-265,-262) | Zugriff auf Bank-Pack `items32` |
| items33 | X33 | bank_u (-200,-278) | Zugriff auf Bank-Pack `items33` |
| items34 | X34 | bank_u (-137,-262) | Zugriff auf Bank-Pack `items34` |
| items35 | X35 | bank_u (-72,-278) | Zugriff auf Bank-Pack `items35` |
| items36 | X36 | bank_u (-8,-262) | Zugriff auf Bank-Pack `items36` |
| items37 | X37 | bank_u (-409,202) | Zugriff auf Bank-Pack `items37` |
| items38 | X38 | bank_u (-345,186) | Zugriff auf Bank-Pack `items38` |
| items39 | X39 | bank_u (-345,218) | Zugriff auf Bank-Pack `items39` |
| items40 | X40 | bank_u (-281,202) | Zugriff auf Bank-Pack `items40` |
| items41 | X41 | bank_u (8,202) | Zugriff auf Bank-Pack `items41` |
| items42 | X42 | bank_u (71,186) | Zugriff auf Bank-Pack `items42` |
| items43 | X43 | bank_u (71,218) | Zugriff auf Bank-Pack `items43` |
| items44 | X44 | bank_u (135,202) | Zugriff auf Bank-Pack `items44` |
| items45 | X45 | bank_u (-201,666) | Zugriff auf Bank-Pack `items45` |
| items46 | X46 | bank_u (-137,650) | Zugriff auf Bank-Pack `items46` |
| items47 | X47 | bank_u (-73,666) | Zugriff auf Bank-Pack `items47` |

**Pack-Gruppierung:** `items0–7` → `bank`; `items8–23` → `bank_b`; `items24–47` → `bank_u`. Jedes Pack wird im aktuellen Client mit 42 Slots behandelt. Unlockstatus und Kosten müssen live geprüft werden.

## 30.4 Citizen-/World-NPCs

| NPC-ID | Name | Map | Verhalten/Funktion | V4-Kategorie |
|---|---|---|---|---|
| citizen0 | Kane | main | Aura: +Luck 200; `seek: thrill` | SUPPORT / AMBIENT |
| citizen1 | Kilgore | winter_inn | Dialog-/Ambient-Citizen | AMBIENT |
| citizen2 | Stewart | main | Dialog-/Ambient-Citizen | AMBIENT |
| citizen3 | Reny | main | Dialog-/Ambient-Citizen | AMBIENT |
| citizen4 | Angel | main | Aura: +Gold 200; `seek: gold` | SUPPORT / AMBIENT |
| citizen5 | Grundur | winter_inn | Dialog-/Ambient-Citizen | AMBIENT |
| citizen6 | Fredric | winter_inn | Dialog-/Ambient-Citizen | AMBIENT |
| citizen7 | Lucy | winterland | Dialog-/Ambient-Citizen | AMBIENT |
| citizen8 | Wyr | winterland | Dialog-/Ambient-Citizen | AMBIENT |
| citizen9 | Lilith | winterland | Dialog-/Ambient-Citizen | AMBIENT |
| citizen10 | Caroline | winterland | Priest-Citizen; Heal 2400; `seek: cuteness` | NPC_SUPPORT |
| citizen11 | Baron | halloween | Priest-Citizen; Attack 1800; `seek: low_hp` | NPC_SUPPORT / COMBAT |
| citizen12 | Marven | halloween | Dialog-/Lore-Citizen | AMBIENT |
| citizen13 | Divian | halloween | Dialog-/Lore-Citizen | AMBIENT |
| citizen14 | Violet | spookytown | Dialog-/Lore-Citizen | AMBIENT |
| citizen15 | Timmy | spookytown | Dialog-/Lore-Citizen | AMBIENT |
| citizen16 | Cunn | level2 | Ranger-Citizen; Attack 1200; `seek: dragondagger` | NPC_COMBAT / AMBIENT |
| citizen17 | Rook | desertland | `wayfinder`: zeigt erste Schritte zu Transporter, Locksmith, Scrollsmith | WAYFINDER |
| citizen18 | Patch | cyberland | `repairer`: repariert idle Mechagnomes, nicht während Kampf | WORLD_BEHAVIOR |
| citizen19 | Moss | mforest | `fairy_echo`: Effekte/Farbe reagieren auf nahe Fairies | WORLD_BEHAVIOR |
| citizen20 | Wick | mtunnel | `lamplighter`: läuft definierte Stops ab und erzeugt Lichtbereiche | WORLD_BEHAVIOR |
| citizen21 | Brio | tavern | `tavern_echo`: reagiert/kopiert bestimmte Emotes | TAVERN / WORLD_BEHAVIOR |
| citizen22 | Merrit | main | `market_patron`: besucht geeignete offene, gefüllte Stände; 2 min Settle; max. 1 Parcel/Account/Stunde; Abstandsregeln | MERCHANT / MARKET_EVENT |
| holo0 | Green | resort | Resort-Ambient/Hologramm | AMBIENT |
| holo1 | Pink | resort | Resort-Ambient/Hologramm | AMBIENT |
| holo2 | Purple | resort | Resort-Ambient/Hologramm | AMBIENT |
| holo3 | Scarf | resort | Resort-Ambient/Hologramm | AMBIENT |
| holo4 | Twig | resort | Resort-Ambient/Hologramm | AMBIENT |
| holo5 | Bobo | resort | Resort-Ambient/Hologramm | AMBIENT |
| princess | Princess | keine statische Platzierung im Snapshot | Dialog-/Ambient-Definition | AMBIENT / DYNAMIC |

### Merrit ist für den Merchant besonders wichtig

`citizen22` / Merrit besitzt im aktuellen offiziellen Datensatz `citizen_behavior: market_patron`. Die Definition enthält u. a. `settle_ms: 120000`, `hour_ms: 3600000`, einen 600er Markt-Radius und Abstandsregeln. Die offizielle NPC-Doku fasst die Regel zusammen: einen offenen, bestückten Stand zwei Minuten stabil an derselben Stelle halten; maximal ein Parcel pro Account und Stunde; kein Parcel zu dicht an stationären NPCs oder anderen offenen Ständen. Diese Mechanik gehört in V4 nicht in „Ambient“, sondern in den Merchant-/Market-Event-Planer.

## 30.5 Vollständiger Eventkatalog

| Event-ID | Name | Typ | Definitionsdauer | `join` | Ort/Eintritt | Funktion / zentrale Mechanik |
|---|---|---:|---:|---:|---|---|
| anniversary | Ten Years of Adventure Land | seasonal | — | nein | Mainland + realmweite Visit-Runden | Alle 30 min wird auf Non-PvP-Realms ein erreichbarer, nicht-AFK Spieler ausgewählt. Bereits online befindliche Charaktere erhalten 5-minütiges `anniversary_visit`; innerhalb 80 Range `ikissyou` → Slice + Gift. Mira craftet Cake/Gifts; Xyn öffnet Cake/Gift per Exchange. Normale eligible Monster können zusätzlich Slices/Gifts droppen. |
| abtesting | A/B Testing | daily | 8 min | ja | eigene Map `abtesting` | Sicheres PvP-Team-Event A vs B. Signup nur in ersten 2 Minuten; Rejoin ins gleiche Team möglich. Am Ende Rücktransport; Gewinner/Verlierer haben unterschiedliche Drop-Tabellen. |
| goobrawl | Goo Brawl | daily | 9 min | ja | eigene Map `goobrawl` | Kooperatives Goo-Event auf Zen-Insel; Goo können Fun Tokens droppen; seltene Rainbow Goo (`rgoo`) möglich. |
| crabxx | Giga Crab | daily | 40 min | ja | Beach/World-Boss | Giga Crab (`crabxx`) nimmt nur 1 Schaden solange Huge Crabs (`crabx`) leben. Server muss Adds fortlaufend räumen. Event kann über 40 min hinaus weiterlaufen, solange Boss engagiert bleibt. |
| franky | Franky | nightly | 40 min | ja | World-Boss | Franky spawnt Nerfed Mummies. Event verlängert sich, wenn Franky in den letzten 20 Sekunden weiter angegriffen wird. |
| icegolem | Ice Golem | nightly | 40 min | ja | World-Boss | Ice Golem wirft Frostballs auf Teilnehmer; Join-Funktion führt zum Event. |
| holidayseason | Holiday Season | seasonal | 30 Tage | nein | Winterland + globale Drops/Bosse | New-Year/Holiday-Drops global. Jayson/Faith/Santa für Turn-ins, New Year Tree für Holiday Spirit. 9 `x0..x8` → `xbox` craften und bei Xyn exchangen. Snowman stündlich als Coop-Boss; Grinch teleportiert, stiehlt Gold und heilt/entkommt. |
| lunarnewyear | Lunar New Year | seasonal | 15 Tage | nein | globale Drops + World-Boss | Brown Envelopes droppen global und werden bei Xyn exchanged. Dragold spawnt laut aktuellem Guide alle 3 Stunden; seltene Crown/Chrysalis-Rewards. |
| valentines | Valentines | seasonal | 10 Tage | nein | globale Drops + random World-Spawn | Candy Pops droppen global, essbar oder bei Xyn exchangebar. Love Goo (`pinkgoo`) spawnt stündlich auf zufälliger Map/in zufälligem Monsterpack und besitzt 98% Avoidance. |
| egghunt | Egg Hunt | seasonal | 15 Tage | nein | globale Sammelitems + random Wabbit | 9 Eier sammeln → `basketofeggs` craften → bei Xyn exchangen. Wabbit spawnt stündlich auf zufälliger Map/in zufälligem Pack; anfangs sehr schwer zu töten; Sieg gibt 100% Luck Buff für 24 h. |
| halloween | Halloween | seasonal | 30 Tage | nein | Map `halloween` + globale Drops/Bosse | Alle Monster droppen Candies, Exchange bei Xyn. Coop-Bosskämpfe, Halloween-Buff, Junior-Bosse und Slenderman; viele saisonale Items. |

## 30.6 Event-Live-State und Bot-Regeln

`G.events` beweist nur, dass ein Event **definiert** ist. Die aktuellen offiziellen Guides weisen für den Realm-Live-State auf `server.status` hin. V4 sollte deshalb Evententscheidungen aus `server.status` + aktueller Map/Entities ableiten und `G.events` nur als Capability-/Definitionsquelle verwenden.

Empfohlene Event-State-Machine:

`UNKNOWN -> SCHEDULED -> LIVE_DISCOVERED -> JOINING/TRAVELLING -> PARTICIPATING -> REWARD/CLAIM -> COMPLETE`

Zusätzliche Zustände:

- `MISSED_WINDOW`
- `DISAPPEARED`
- `REALM_FATIGUE`
- `UNREACHABLE`
- `RECOVERING`

### Eintrittstypen

- **Joinable instanced/special event:** `abtesting`, `goobrawl`, `crabxx`, `franky`, `icegolem` besitzen `join:true` in der aktuellen Definition; aktuelle Guides zeigen `join(event)`.
- **World/seasonal:** Anniversary, Holiday Season, Lunar New Year, Valentines, Egg Hunt und Halloween werden über Live-State, World-Spawns, Drops und NPCs abgewickelt, nicht pauschal über `join`.
- **Eventdefinition ≠ aktive Runde:** Ein geplanter Eventeintrag oder `G.events[id]` ist kein Startsignal.

## 30.7 Event-NPC-Verknüpfungen

- **Anniversary:** Mira (`anniversary_baker`) auf Mainland während des Events; Xyn öffnet Cakes/Gifts.
- **Holiday Season:** Jayson (`ornaments`), Faith (`mistletoe`), Santa, New Year Tree; Guide beschreibt saisonale Platzierungen in Winterland/Tavern/Arctic-Bee-Bereich. Diese sind im statischen `G.maps`-Snapshot nicht alle dauerhaft eingetragen.
- **Lunar New Year:** Xyn für Brown Envelopes; Dragold als periodischer World-Boss.
- **Valentines:** Xyn für Candy Pops; Love Goo als stündlicher Random-Spawn.
- **Egg Hunt:** regulärer Crafting-NPC in Mainland für `basketofeggs`; Xyn für den fertigen Basket; Wabbit als stündlicher Random-Spawn.
- **Halloween:** Xyn für Candies; Witch ist auf `halloween` statisch definiert und besitzt eigene Rezepte.

## 30.8 V4-Relevante neue Wissens-IDs

| ID | Aussage | Klasse | Confidence | V4_ARCHITEKTURRELEVANT |
|---|---|---:|---:|---:|
| AL-NPC-001 | NPC-ID ist die stabile CODE-Identität; Displaynamen können sich ändern. | OFFIZIELL_BESTAETIGT | 0.99 | true |
| AL-NPC-002 | NPC-Definition und NPC-Platzierung sind getrennte Datenebenen; saisonale/servererzeugte NPCs können ohne statische Map-Platzierung existieren. | OFFIZIELL_BESTAETIGT | 0.99 | true |
| AL-NPC-003 | Der geprüfte Snapshot enthält 135 NPC-Definitionen in 46 Rollen. | SPIELDATEN_BESTAETIGT | 0.99 | false |
| AL-NPC-004 | `role: citizen` ist keine Garantie für reine Dekoration; mehrere Citizens besitzen echte Behavior-Logik. | SPIELDATEN_BESTAETIGT | 0.99 | true |
| AL-NPC-005 | Merrit ist ein Market-Patron mit Shop-Settle-, Hourly- und Spacing-Regeln und muss vom Merchant als externer Markt-Workflow behandelt werden. | MEHRFACH_EXTERN_BESTAETIGT | 0.99 | true |
| AL-NPC-006 | Bean mutiert Home-Realm-State; Favoré mutiert realmweiten Blessing-State und darf nicht wie ein harmloser Dialog behandelt werden. | SPIELDATEN_BESTAETIGT | 0.99 | true |
| AL-EVENT-002 | Aktuell sind 11 Events in `G.events` definiert; Eventdefinition allein ist kein Beweis, dass das Event gerade live ist. | MEHRFACH_EXTERN_BESTAETIGT | 0.99 | true |
| AL-EVENT-003 | `server.status` ist für die aktuelle Realm-Eventlage die bevorzugte Live-State-Quelle. | OFFIZIELL_BESTAETIGT | 0.99 | true |
| AL-EVENT-004 | Joinable und World/Seasonal Events benötigen unterschiedliche Eintritts-/Recovery-Strategien. | MEHRFACH_EXTERN_BESTAETIGT | 0.98 | true |

## 30.9 Drift / Revalidierung

Besonders driftgefährdet sind: Eventdauer/Schedule, saisonale NPC-Platzierungen, Shopinventare, Token-Rewards, Blessing-/Home-Kosten und Cooldowns, Merrit-Exchange-Tabelle sowie Bank-Pack-Unlockkosten. V4 sollte diese Werte **nicht** aus diesem Snapshot als ewige Konstanten übernehmen, sondern soweit möglich aus aktuellem `G`, `server.status` und Public-API-Resultaten beziehen.

## 30.10 Primärquellen dieses Blocks

- `design/npcs.js` — NPC-Definitionen/Rollen
- `design/maps.js` — statische und saisonale Platzierungen
- `design/events.js` — Eventdefinitionen
- `js/game.js` — NPC-Interaktionsrouting
- `js/html.js` — Service-UI/Interaktionssemantik
- `js/runner_functions.js` — öffentliche CODE-Funktionen
- `docs/articles/data-npc.html` — offizielles NPC-Datenmodell
- `docs/guide/events-and-home.html` — Live-State/Home/Event-Zugang
- `docs/guide/event-anniversary.html`
- `docs/guide/event-abtesting.html`
- `docs/guide/event-goobrawl.html`
- `docs/guide/event-crabxx.html`
- `docs/guide/event-franky.html`
- `docs/guide/event-icegolem.html`
- `docs/guide/event-holidayseason.html`
- `docs/guide/event-lunarnewyear.html`
- `docs/guide/event-valentines.html`
- `docs/guide/event-egghunt.html`
- `docs/guide/event-halloween.html`

