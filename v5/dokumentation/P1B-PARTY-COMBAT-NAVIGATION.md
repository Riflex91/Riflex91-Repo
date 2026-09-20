# P1B – Party, Combat, Farming und Navigation

**Status:** GESCHLOSSEN  
**Stand:** 2026-09-20  
**Zielphase:** R16 – Party, Combat, Farming und Navigation  
**Offizieller Source-Snapshot:** kaansoral/adventureland_mongodb@ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4

## Forschungsfragen

R1.3 verlangt vor autonomem Party/Combat:

- Party freshness/liveness;
- Skill-/Cooldown-Matrix live;
- Aggro/Threat/CC;
- death/respawn/rejoin;
- Group-composition capability calculation.

Zusaetzlich sind die R16-Weltinvarianten verbindlich:

- Movement-/Travel-Return ist kein Arrival-Beweis;
- Moving-Target-Work benoetigt motion-aware Freshness;
- Raw Game Target ist nicht automatisch fachliche Target-Ownership.

## Revalidierte aktuelle Fakten

### Party und Character-Sicht

Die aktuelle CODE-Funktion `get_party()` liefert `parent.party` und ist im offiziellen Runner ausdruecklich als **infrequently updated object** dokumentiert.

Party-Serverupdates enthalten fuer aktuell verbundene Mitglieder unter anderem Name/Typ/Level sowie Map/Instanz/Position und `rip`. Server-seitig werden fehlende Party-Spieler beim Update aus der Party entfernt.

Konsequenz fuer V5:

- Party-Objekte sind Beobachtung, keine dauerhafte Authority;
- Party-Mitglieder werden mit Beobachtungszeit und Roster-/Session-Bindung gepinnt;
- fehlende oder zu alte Party-Evidence macht eine Gruppenfaehigkeit nicht automatisch verfuegbar;
- CM-/Roster-Liveness aus R14 bleibt die staerkere Character-Identitaetsgrenze.

### Entity- und Moving-Target-Freshness

Der aktuelle Runner weist in `is_in_range()` explizit darauf hin, dass eine Entity-Referenz nach Verlassen des Sichtbereichs nicht weiter aktualisiert wird; `.visible` wird false.

`is_moving(entity)` betrachtet sowohl den normalen Entity-Moving-State als auch fuer den eigenen Character `smart.moving`.

Konsequenz fuer V5:

- ein gespeichertes Entity-Objekt darf nicht spaeter als aktuelle Target-Wahrheit verwendet werden;
- bewegte Ziele werden an Entity-/Spawn-Fingerprint, Map/Instanz, Position und Beobachtungszeit gebunden;
- vor Combat/Movement-Entscheidungen ist eine neue Zielbeobachtung Pflicht;
- Positiondrift ueber dem erlaubten Budget fuehrt zu Replan statt zum Weiterarbeiten auf alten Koordinaten.

### smart_move und Arrival

Der aktuelle `smart_move()`-Runner resolved seinen Deferred mit `{success:true}`, sobald sein interner Plot abgearbeitet ist und `smart.on_done(true)` aufgerufen wird.

Das ist V5 trotzdem **kein fachlicher Arrival-Beweis**. Zwischen Movement-Completion und dem beabsichtigten fachlichen Ziel koennen Zielbewegung, Map-/Instanzwechsel, Eventende, Positionkorrektur oder neue Situation liegen.

Konsequenz fuer V5:

- Movement-Return beendet hoechstens den Transportversuch;
- Arrival benoetigt danach eine frische beobachtete Postcondition fuer Map/Instanz/Position bzw. einen fachlichen Arrival-Praedikat;
- ohne Arrival-Evidence bleibt Travel `ARRIVAL_AUSSTEHEND`.

### Skill- und Cooldown-Wahrheit

Der aktuelle Runner implementiert `is_on_cooldown(skill)` ueber `parent.next_skill`. Besitzt ein Skill `G.skills[skill].share`, wird der geteilte Cooldown geprueft.

Die Clientfunktion `skill_timeout()` propagiert einen Shared-Cooldown auf den Shared-Key und alle Skills, die denselben Share-Key besitzen.

`can_attack()` prueft unter anderem:

- Target vorhanden;
- Character nicht disabled;
- Target in Range;
- Attack-Cooldown abgelaufen.

`G.skills` definiert Skill-spezifische Voraussetzungen wie Klasse, Level, MP, Range, Weapon/Slot-Anforderungen, Cooldown, Shared-Cooldown, Target-/Hostile-Eigenschaften und Conditions.

Konsequenz fuer V5:

- statische `G.skills`-Definition ist nur der Capability-Vertrag;
- Nutzbarkeit entsteht erst aus frischer Character-/Equipment-/MP-/Condition-/Cooldown-Evidence;
- Shared-Cooldowns werden als gemeinsame Cooldown-Domaene modelliert;
- Promise-/Request-Erfolg wird nicht zu langfristiger Skill-Authority.

### Aggro, Threat und CC

Monster besitzen in der Live-Entity-Sicht ein `target`. `get_target_of(entity)` loest dieses Target gegen die aktuell sichtbaren Entities auf.

Aktuelle Serverpfade zeigen, dass Taunt/Agitate Monster-Aggro umleiten koennen. `stomp` setzt serverseitig die Condition `stunned`, wenn das Ziel nicht immun ist.

Monsterdefinitionen besitzen unter anderem `range`, `frequency`, `aggro`, Schadenstyp, Armor/Resistance und optionale Abilities.

Konsequenz fuer V5:

- `target`, Threat-/Aggro-Sicht und CC sind volatile Combat-Evidence;
- Threat-Safety wird nicht aus einer einzigen historischen Target-Zeichenkette abgeleitet;
- CC-Planung benoetigt frische Condition-/Immunity-/Skill-Evidence;
- Taunt/Agitate veraendern Aggro und invalidieren entsprechend alte Threat-Annahmen.

### Death, Respawn und Rejoin

`respawn()` sendet einen eigenen Respawn-Request. Der aktuelle Server akzeptiert diesen nur bei `player.rip`, erzwingt gegebenenfalls die Respawn-Wartezeit, setzt HP voll, MP auf die Haelfte, setzt `rip=false`, transportiert zum Death-/Startpunkt und sendet danach die Response.

Party-Updates werden beim Respawn erneut gesendet, sofern der Character in einer Party ist.

Konsequenz fuer V5:

- `rip=true` entzieht Combat-/Movement-Authority;
- Respawn-Request/Promise allein reaktiviert den Character nicht;
- Rejoin benoetigt frische Character-, Roster-/Session- und gegebenenfalls Party-Evidence nach `rip=false`;
- ein Restart waehrend Death/Respawn/Rejoin geht in Reconciliation, nicht in Blind-Resume.

### Group-Composition Capability

Party-Daten alleine sind nicht frisch genug, um Skills oder Rollen dauerhaft zu autorisieren.

V5 berechnet Group Capabilities aus:

- frischer Roster-/Session-Bindung aus R14;
- frischer Party-Beobachtung;
- frischer Character-Liveness;
- frischer Skill-/Cooldown-/Equipment-Evidence;
- `rip`/CC-Zustand.

Fehlt ein benoetigter frischer Nachweis, ist die entsprechende Group Capability nicht verfuegbar.

## R16-Entscheidungen

### Arrival

Travel besitzt einen expliziten Ziel-Pin und einen getrennten Arrival-Verifier. Movement-Return kann `TRANSPORT_ABGESCHLOSSEN` setzen, aber niemals direkt `ANGEKOMMEN`.

### Motion-Aware Target Pin

Combat- und Kiting-Ziele besitzen:

- Entity-ID;
- Spawn-/Entity-Fingerprint;
- Map und Instanz;
- Position;
- Beobachtungszeit;
- maximale Altersgrenze;
- maximales Driftbudget.

Vor Nutzung muss eine neue Beobachtung dieselbe Entity-Identitaet bestaetigen und innerhalb Freshness/Drift liegen.

### Combat Target Ownership

Raw `get_target()`, `get_nearest_monster()` oder Entity-`target` sind nur Beobachtung.

V5 erteilt eine eigene gebundene Target-Ownership mit Owner-Workflow, Character, Entity-/Spawn-Fingerprint, Epoche und TTL. Nur ein aktuelles Fencing-Token kann fachliche Ownership nachweisen.

### Movement Ownership

Ein Character besitzt gleichzeitig nur einen normalen Movement-Owner. Travel, Rendezvous und Combat/Kiting duerfen nicht gegenseitig Movement uebernehmen, solange der aktuelle Owner aktiv ist. Safety/Notfall kann explizit mit neuer Epoche preempten.

Nach Lease-Ablauf oder Restart ist erst Reconciliation noetig. Damit werden Movement-Pingpong und Thrash fail-closed begrenzt.

### Party Truth

Party-Snapshots sind bounded, zeitgestempelt und Roster-/Session-gebunden. Sie werden nicht als langlebige Wahrheit persistiert und nach Restart nicht als frisch importiert.

### Skill Capability

Eine Skill-Freigabe ist an Character-Session, Skilldefinition, Equipment-/Condition-/MP-Evidence und aktuelle Cooldown-Domaene gebunden. Shared-Cooldowns werden gemeinsam gefenced.

### Death / Respawn / Rejoin

Der Character-Lifecycle ist explizit. `TOT`, `RESPAWN_AUSSTEHEND` und `REJOIN_AUSSTEHEND` duerfen keine normale Combat-/Movement-Authority tragen.

### Farmer / AoE / Encounter

Der R16-Farmer bleibt ein bounded Workflow ueber vorhandene Scheduler-/Authority-Grenzen. Adaptive-/Learning-Empfehlungen duerfen Hard Caps fuer Zielanzahl, Risk, Freshness, HP/MP oder Safety nie lockern.

Encounter-Outcomes werden per Encounter-ID dedupliziert, auch nach Restart.

## P1B-Abschluss

Die offenen R1.3-Punkte sind fuer die R16-Foundation geschlossen:

- Party freshness/liveness: zeitgebundene Party Truth + R14 Roster/Liveness;
- Skill-/Cooldown-Matrix live: frische Skill-Evidence + Shared-Cooldown-Domaene;
- Aggro/Threat/CC: volatile Target-/Condition-Evidence, kein historisches Raw-Target als Authority;
- death/respawn/rejoin: expliziter Lifecycle mit frischer Rejoin-Evidence;
- Group-composition capability: nur aus frischen gebundenen Member-/Skill-Nachweisen.

Die breite Gameplay-Runtime bleibt `GESPERRT`. R16 baut zunaechst no-write Planning-/Safety-/Ownership-Primitiven.

## Offizielle Referenzen

- Adventure Land Docs: https://adventure.land/docs/code/functions
- Adventure MCP Guide: https://adventure.land/docs/guide/tracktrix/null/adventure-mcp
- `kaansoral/adventureland_mongodb@ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4`
- `js/runner_functions.js@2faeff269d84e421441052dd439473ac9bffdaed`
- `js/functions.js@59c755f6ac7d7fad8204be3295e6538b28642cb8`
- `node/server.js@857fbe09e98d643ecb7cfd97e56fac0f14c893d2`
- `design/skills.js@9f9a3eb3d391ece3406227f0082fc6a6410c6e6a`
