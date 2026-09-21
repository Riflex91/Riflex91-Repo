# V5 Post-R19 Produktiv-Roadmap

**Status:** AKTIV / POST-R19 PRODUKTIVIERUNG  
**Stand:** 2026-09-21  
**Basis-main:** `04dbc2cf5ab70992ec0dac9c7952cafb1ca4a0db`  
**Vorgaenger:** `dokumentation/V5-MASTER-ROADMAP.md` (R0-R19 abgeschlossen)  

## 1. Zweck

Die historische V5-Master-Roadmap R0-R19 ist abgeschlossen und bleibt unveraendert der Nachweis fuer Architektur, Safety, Recovery, Readiness und die globale Runtime-Freigabe.

Diese Post-R19-Roadmap beschreibt die verbindliche Reihenfolge fuer die anschliessende Produktivierung: vorhandene no-write Foundations werden schrittweise mit echten Adventure-Land-Aktionen verbunden, real getestet und erst danach zu autonomem Multi-Character-Betrieb erweitert.

Die verbindliche Reihenfolge lautet:

`Merchant produktiv -> Merchant Integration -> Farmer produktiv -> Gruppenrobustheit -> reale Gruppen-Live-Evidence -> Task-/Party-Optimierung -> Account-Balance -> World-/24/7-Autonomie -> Langzeitbetrieb -> Plattformportierung`.

**Keine spaetere Stufe darf eine fruehere Stufe ueberspringen.**

## 2. Betriebsziel: Wochen- und monatelanger unbeaufsichtigter Betrieb

Das Endziel dieser Roadmap ist nicht nur ein funktionierender Bot, sondern ein System, das ueber **Wochen bis Monate unbeaufsichtigt** laufen kann, ohne dass schleichende Fehler, Ressourcenwachstum oder unklare Transaktionen zu unsicherem Verhalten fuehren.

Dafuer gilt zusaetzlich:

- kurze 5m-/15m-Tests bleiben schnelle Capability- und Integrationsgates, ersetzen aber keine Langzeit-Evidence;
- jeder produktive Bereich muss Restart, Browser-/CDP-Verlust, Netzwerk-/Serverdrift, stale Evidence und partiell beobachtete Ergebnisse sicher ueberstehen;
- RAM, SSD, Journale, Telemetrie, Dedupe-Tabellen, Queues und Historien muessen bounded bleiben;
- Watchdog und Restart-Budget duerfen keinen Restart-Loop erzeugen;
- nach Prozess-, Browser- oder Host-Neustart darf keine alte Gameplay-Authority wiederaufleben;
- offene oder UNKNOWN-Transaktionen muessen vor neuer gleichartiger Mutation reconciliiert werden;
- schleichende Party-, World-, Bank-, Market-, Inventory- und Session-Drift muss erkannt werden;
- Fehler duerfen einzelne Capabilities blockieren, ohne fachfremde Bereiche unsicher mitzureissen;
- fuer Langzeitbetrieb muessen Alerts und Evidence ausreichen, um einen spaeter entdeckten Fehler reproduzierbar zu erklaeren.

Die Langzeitreife wird stufenweise nachgewiesen:

1. Funktionsgate: 5 Minuten;
2. Integrationsgate: 15 Minuten;
3. mehrere Stunden;
4. ueber Nacht;
5. mehrere Tage;
6. **7 Tage unbeaufsichtigt** als Wochenbetriebs-Abnahme;
7. **30 Tage unbeaufsichtigt** als Monatsbetriebs-Burn-in.

Ein 7- oder 30-Tage-Lauf darf nur als bestanden gelten, wenn keine manuellen Eingriffe zur Aufrechterhaltung des normalen Betriebs erforderlich waren. Ein bewusst ausgeloester Operator-Deny/NOTHALT-Test zaehlt nicht als Stoerung des unbeaufsichtigten Betriebs.

## 2. Globale Regeln

Fuer alle Post-R19-Stufen gelten unveraendert:

- Operator-Deny und NOTHALT haben Vorrang;
- keine neue Authority durch persistierte Evidence allein;
- irreversible oder wertveraendernde Aktion: durable Intent vor Send;
- UNKNOWN ist kein normales FAILURE und erzeugt keinen Blind-Retry;
- Same-Intent-Retry bleibt fuer nicht sicher idempotente Mutationen verboten;
- Action Contract, Admission, Freshness, Fencing, Ressourcen-/Socket-Budget und fachliche Postcondition bleiben Pflicht;
- Restart/Disconnect fuehrt zu Reconciliation statt Blind-Resume;
- neue produktive Gameplay-Write-Pfade werden einzeln ratifiziert;
- V3/V4 bleiben Wissens-/Testquellen, aber keine Runtime-Abhaengigkeit;
- pro neuer/geaenderter laufzeitrelevanter Capability gilt mindestens der ratifizierte 5-Minuten-Funktionstest;
- fuer Integrations-, Meilenstein- und Release-Gates gilt mindestens der ratifizierte 15-Minuten-Test;
- ein spaeter entdeckter Defekt oeffnet die betroffene Capability bzw. Integration erneut.

## 4. Statusuebersicht

| Stufe | Ziel | Status | Harte Voraussetzung |
|---|---|---|---|
| PR20 | Merchant produktiv vervollstaendigen | IN_PROGRESS | aktueller Equip-Live-Nachweis |
| PR21 | Merchant Gesamtintegration zertifizieren | BLOCKED_BY_PR20 | PR20 komplett |
| PR22 | Produktive Multi-Character-Koordination | BLOCKED_BY_PR21 | stabiler Merchant |
| PR23 | Farmer Movement/Combat/Loot/AoE produktiv | BLOCKED_BY_PR22 | produktive Character-Koordination |
| PR24 | Umfangreiche Gruppen-Konstellationsmatrix | BLOCKED_BY_PR23 | produktive Farmer |
| PR25 | Reale Gruppen-Live-Evidence | BLOCKED_BY_PR24 | gruene Gruppenmatrix |
| PR26 | Allgemeiner Task-/Party-Optimizer | BLOCKED_BY_PR25 | belastbare Gruppen-Evidence |
| PR27 | Account Progression Balancer | BLOCKED_BY_PR26 | stabiler Task-/Party-Optimizer |
| PR28 | World Autonomy produktiv verbinden | BLOCKED_BY_PR27 | stabile Taskauswahl und Farmer |
| PR29 | 24/7 Host/Watchdog/Update/Control | BLOCKED_BY_PR28 | produktive Gesamtintegration |
| PR30 | Langzeit-/24x7-Soak-Evidence | BLOCKED_BY_PR29 | stabiler unattended Betrieb |
| PR31 | Linux-Kompatibilitaet | BLOCKED_BY_PR30 | stabiler Windows-Produktivbetrieb |
| PR32 | Mobile/Android-Bedienung | OPTIONAL_AFTER_PR31 | stabile Host-API |

## 5. PR20 – Merchant produktiv vervollstaendigen

**Status:** IN_PROGRESS.

### PR20.1 – Equip-Produktionsnachweis

Aktueller naechster Schritt:

1. read-only Preflight auf dem realen Merchant;
2. erwarteter Preflight: kein Gameplay-Write;
3. danach exakt ein explizit bestaetigter produktiver `equipment.equip`-Write;
4. Transaction Journal, Adapteraufrufe, Gameplay-Writes, Postcondition, Authority-Lifecycle und Recovery auswerten;
5. bei UNKNOWN/BLOCKED/offener Transaktion kein erneuter Send, sondern Evidence-Analyse.

**Exit Gate:**
- Preflight sauber;
- exakt ein erwarteter Write im Live-Lauf;
- `sameIntentRetry=false`;
- fachliche Postcondition bestaetigt;
- keine offene Transaktion;
- keine unerwartete Authority;
- Evidence im Repo dokumentiert.

### PR20.2 – Bank-Autonomie produktiv

**Vorbereitung:** `VORBEREITET_NO_WRITE`. Die sichere Vorarbeit ist bereits unter
`dokumentation/PR20-2-BANK-PRODUKTIV-VORBEREITUNG.md` und
`grundlage/vertraege/runtime/bank-production-preparation.json` festgehalten.
Sie bleibt hinter `PR20.1_EQUIP_PRODUKTIONSNACHWEIS` blockiert und registriert
weder Bank-Mutationsauthority noch einen Gameplay-Write-Pfad.

Vorhandene Bankplanung, Bank-Lease, Fencing und Bankkatalog-Fundamente werden mit echten Bankmutationen verbunden.

Abzudecken:

- Einlagern;
- Auslagern;
- Konsolidieren;
- Capacity-/Workspace-Preflight;
- accountweite Bank-Lease;
- stale Bank-Evidence;
- Restart waehrend Operation;
- UNKNOWN-Reconciliation;
- voller Bank-/Inventarzustand;
- keine doppelte Bankmutation.

**Exit Gate:**
- alle freigegebenen Bankaktionen besitzen Action/Recovery/Verifier;
- reale 5m-Funktionsevidence;
- keine Duplicate-Wirkung;
- keine Mutation auf stale Bank-Wahrheit.

### PR20.3 – Markt, Kaufen und Verkaufen produktiv

**Vorbereitung:** `VORBEREITET_NO_WRITE`. Die sichere Vorarbeit ist bereits unter
`dokumentation/PR20-3-MARKT-PRODUKTIV-VORBEREITUNG.md` und
`grundlage/vertraege/runtime/market-production-preparation.json` festgehalten.
Die produktive Freigabe bleibt hinter PR20.1 und dem Abschluss von PR20.2 blockiert.

Abzudecken:

- Buy;
- Sell;
- Trade-/RID-/Mengenbindung;
- frische Preis-/Market-Evidence;
- Gold-/Budget-Ledger;
- Schutz vor falschem Verkauf;
- Postcondition fuer Item- und Goldveraenderung;
- UNKNOWN/Reconciliation;
- kein Doppeltrade.

**Exit Gate:**
- echte Buy-/Sell-Pfade ratifiziert;
- reale 5m-Funktionsevidence je mutierender Capability;
- keine unverified action usage;
- kein falscher Verkauf und kein Doppeltrade.

### PR20.4 – Transfers, Supply, Collection und Rendezvous produktiv

**Vorbereitung:** `VORBEREITET_NO_WRITE`. Die sichere Vorarbeit ist bereits unter
`dokumentation/PR20-4-LOGISTIK-TRANSFER-PRODUKTIV-VORBEREITUNG.md` und
`grundlage/vertraege/runtime/logistics-transfer-production-preparation.json`
festgehalten. Dabei ist eine konkrete Restluecke bewusst offen markiert:
`send_gold` benoetigt vor Produktivierung noch einen typisierten
Empfaenger-Gold-Settlement-Vertrag.

CAP-038 und die vorhandenen Logistik-Fundamente werden mit echten Item-/Gold-Transfers verbunden.

Abzudecken:

- Supply Delivery;
- Collection;
- Itemtransfer;
- Goldtransfer;
- Rendezvous;
- Source-Pinning;
- Recipient Settlement;
- offline/stale Recipient;
- Restart/Reconciliation;
- Partial-/UNKNOWN-Outcome.

**Exit Gate:**
- finaler Empfaengerzustand wird verifiziert;
- kein Blind-Retry;
- kein duplicate transfer;
- stale Character-/Session-Ziele werden blockiert.

### PR20.5 – Merchant-Pingpong- und Starvation-Schutz

**Vorbereitung:** `CORE_VORBEREITET_NO_WRITE` unter
`grundlage/quelle/merchant/dienst-stabilitaet.ts` mit automatischen Tests.
Die Integration in produktive Arbeit bleibt hinter PR20.1–PR20.4 blockiert.

Der produktive Scheduler muss verhindern, dass der Merchant ohne ausreichenden Grund zwischen Bank, NPC, Farmer, Markt und anderen Diensten pendelt.

Abzudecken:

- Prioritaetsklassen;
- Aging;
- Arbeitsbuendelung;
- Mindesthaltedauer bzw. Hysterese;
- Preemption nur bei begruendeter hoeherer Dringlichkeit;
- Blocked-/failed Rendezvous darf Home-Service nicht verhungern lassen;
- Supply/Collection darf nicht dauerhaft verhungern.

**Exit Gate:**
- kein reproduzierbares Merchant-Pingpong in Fault-/Replay-Tests;
- Starvation-Tests gruen;
- 15m-Integrationslauf ohne Thrash.

### PR20.6 – MLuck-Service produktiv

**Vorbereitung:** Planung sowie der enge same-account
`AL-ACTION-MLUCK-SAME-ACCOUNT` / Recovery / Verifier sind ratifiziert.
Es existieren weiterhin **keine** produktive MLuck-Mutations-Capability,
Authority, Adapter oder Live-Runner.

Abzudecken:

- frischer Empfaenger;
- Session-/Serverbindung;
- Range/Skill/MP/Cooldown-Evidence;
- Priorisierung gegen wichtigere Merchant-Arbeit;
- kein MLuck-Pingpong;
- kein Service auf stale/offline Ziel.

**Exit Gate:**
- sicherer Live-Pfad;
- 5m-Funktionsevidence;
- MLuck kann kritischere Arbeit nicht verdraengen.

### PR20.7 – Gear-Autonomie produktiv erweitern

**Vorbereitung:** Gear-Allokation, Gear-Progression, physische
Einmalreservierung, Recipient-Slot-Reservierung und Restart-Recovery sind
NO-WRITE vorhanden. Belegte Slots/Waffen/Offhand bleiben absichtlich
produktive Spaeter-Gates.

Aufbauend auf dem sicheren Equip-Pfad:

- belegte Slots und kontrollierte Swaps;
- Waffen-/Offhand-Faelle;
- Gear-Allokation an Farmer;
- physische Itemreservierung;
- Recipient-Slot-Reservierung;
- Gear-Rollback/Reconciliation bei unklarem Ergebnis.

**Exit Gate:**
- keine doppelte physische Itemreservierung;
- kein falsches Item/Slot-Mapping;
- echte 5m-Funktionsevidence fuer neue Mutationsklassen.

### PR20.8 – Upgrade, Compound und Exchange produktiv

**Vorbereitung:** Action/Recovery/Verifier fuer alle drei, der
Werttransaktions-Ledger sowie der authority-freie Upgrade/Compound-Planer
sind vorhanden. Exchange bleibt fuer seine spezialisierte Produktivplanung
separat offen; es gibt keinen Live-Adapter.

Fuer jede Mutation separat:

- exakte Itemidentitaet;
- benoetigte Materialien/Scrolls;
- Gold-/Workspace-Budget;
- durable Intent;
- Serverresultat-Klassifikation;
- Postcondition;
- UNKNOWN/Reconcile;
- kein Same-Intent-Blind-Retry.

**Exit Gate:**
- Upgrade, Compound und Exchange jeweils einzeln ratifiziert und 5m live getestet;
- keine doppelte wertveraendernde Wirkung;
- Exchange-Autonomie ist produktiv nachgewiesen.

### PR20.9 – Craft/Production produktiv

**Vorbereitung:** Planner, bounded Graph, persistenter Controller,
Operation-Schluessel, Workspace-/Gate-Pruefung und Recipient Settlement
sind NO-WRITE vorhanden. Eine breite Graph-Execution-Authority bleibt
ausdruecklich verboten.

Der bestehende Production Planner/Controller/Graph wird mit den produktiven Mutationspfaden verbunden.

Moegliche Kette:

`Bestand -> Bank -> Buy/Farm/Quest/Event -> Exchange/Upgrade/Compound/Craft -> Delivery -> Recipient Settlement`.

Die harte Regel bleibt:

`CRAFT_COMMITTED != PRODUCTION_COMMITTED`.

**Exit Gate:**
- kein verwaister Production-Schritt;
- Restart jeder nichtterminalen Phase reconciliert;
- finaler Production-Commit erst nach positivem Recipient Settlement;
- 5m-Funktionsevidence fuer neue produktive Schritte.

## 6. PR21 – Merchant Gesamtintegration

**NO-WRITE-Testplan vorbereitet:** `dokumentation/PR21-MERCHANT-INTEGRATION-TESTPLAN.md`.

**Status:** BLOCKED_BY_PR20.

Der Merchant muss als ein zusammenhaengender autonomer Dienst laufen:

- Task-Koordination;
- Bank;
- Markt;
- Supply;
- Collection;
- Rendezvous;
- MLuck;
- Gear;
- Upgrade/Compound/Exchange/Craft;
- Production;
- Restart-/UNKNOWN-Reconciliation;
- Pingpong-/Starvation-Schutz.

**Exit Gate:**
- 15m realer Merchant-Integrationslauf;
- 0 unerwartete Gameplay-Writes;
- 0 duplicate irreversible effects;
- 0 unresolved transactions ausser explizit FAILED_SAFE/OPERATOR_REQUIRED;
- 0 Merchant-Thrash/Pingpong;
- keine Starvation;
- Stop/NOTHALT/Deny funktionieren fail-closed.

Erst nach PR21 gilt: **Merchant laeuft rund.**

## 7. PR22 – Produktive Multi-Character-Koordination

**Status:** BLOCKED_BY_PR21.

Die R14-no-write Foundations werden produktiv:

- echter CM-Transport;
- ACK/Settlement;
- TTL/Dedupe;
- Roster-/Session-Epochen;
- serverlokale Bindung;
- Liveness;
- Restart-Fencing;
- stale Character bekommt keine neue Authority.

**Exit Gate:**
- Duplicate/Out-of-order/Loss/Delay auch produktiv fail-closed;
- kein stale Recipient/Character;
- Restart erzeugt keinen Blind-Resume.

## 8. PR23 – Farmer produktiv

**Status:** BLOCKED_BY_PR22.

### PR23.1 Movement
- Travel;
- Arrival-Verifikation;
- Kiting;
- Anti-Stuck;
- Movement Ownership;
- Anti-Thrash.

### PR23.2 Combat/Skills
- Target Ownership;
- Attack;
- freigegebene Skills;
- Shared Cooldowns;
- MP/Equipment/Condition-Evidence;
- Threat/CC;
- Safety-Preemption.

### PR23.3 Loot/Lifecycle
- Loot;
- Zielwechsel;
- Death;
- Respawn;
- Rejoin;
- Restart in jeder Farmer-Phase.

### PR23.4 AoE
- AoE-Hard-Caps;
- Targetzahl;
- erwarteter Schaden;
- HP/MP-Grenzen;
- Aggro-/CC-Drift;
- Safe Abort/Recovery.

**Exit Gate PR23:**
- jede reale Farmer-Aktion separat ratifiziert;
- 5m-Funktionsevidence je Capability;
- keine stale target action;
- kein Movement Thrash;
- kein Blind-Resume nach Tod/Restart;
- AoE kann Hard Caps nicht ueberschreiten.

## 9. PR24 – Gruppen-Konstellationsmatrix

**Status:** BLOCKED_BY_PR23.

Diese Stufe kommt **vor jeder automatischen Gruppenoptimierung**.

Pflichtfaelle:

- Solo;
- zwei Farmer;
- drei Farmer;
- Tank + Heal;
- Tank + DPS;
- Tank + AoE;
- Heal + DPS;
- Tank + Heal + Single Target;
- Tank + Heal + AoE;
- mehrere DPS;
- doppelte Klassen;
- ohne Tank;
- ohne Heal;
- ohne AoE;
- unterschiedliche Kombinationen aus Warrior, Priest, Mage, Ranger, Rogue und weiteren unterstuetzten Klassen;
- schwache/starke Gearstaende;
- unterschiedliche Level/Skill-Unlocks.

Fault-Matrix:

- Tank stirbt;
- Heiler stirbt;
- DPS stirbt;
- Disconnect;
- Rejoin;
- MP-Mangel;
- Skill-/Shared-Cooldown;
- Equipmentwechsel;
- Gruppenfaehigkeit faellt weg;
- Aggro-Wechsel;
- CC/Immunity;
- Member fehlt;
- fremdes Party-Mitglied;
- Roster-/Session-Drift;
- Map-/Instanz-Drift;
- Leader-/Movement-Drift;
- Restart in jeder relevanten Farmer-Phase.

**Exit Gate:**
- alle Pflichtklassen von Topologien besitzen Replay/Fault-Tests;
- keine Konstellation erfindet fehlende Group Capabilities;
- Safety-Verlust invalidiert die bisherige Gruppenfreigabe;
- kein Deadlock/Pingpong/Thrash.

## 10. PR25 – Reale Gruppen-Live-Evidence

**Status:** BLOCKED_BY_PR24.

Reprasentative Gruppen aus PR24 werden real im Spiel getestet.

Zu messen:

- Killrate;
- XP/Zeiteinheit;
- Schaden;
- Heil-/Tankleistung;
- Tode;
- Potion-/MP-Verbrauch;
- Blocked-/Recovery-Zeit;
- Reise-/Kiting-Verhalten;
- Disconnect/Rejoin;
- Stability-/Safety-Metriken.

**Exit Gate:**
- 5m pro neu gepruefter Gruppenfunktion;
- 15m Integrationslauf fuer die Gruppenrobustheit;
- keine unerwarteten Writes;
- keine Safety-Verletzung;
- belastbare Evidence fuer die spaetere Auswahl zwischen Gruppen.

Erst nach PR25 darf PR26 starten.

## 11. PR26 – Allgemeiner Task-/Party-Optimizer

**Status:** BLOCKED_BY_PR25.

Der Optimierer gilt fuer **jede Aufgabe**, nicht fuer einzelne Spezialbosse.

Ablauf:

`Aufgabe -> Anforderungen -> aktuelle Account-/World-Evidence -> zulaessige Ausfuehrungsvarianten -> Safety-Filter -> Bewertung -> Plan -> Ausfuehrung -> Ergebnis-Evidence`.

Beruecksichtigte Faktoren:

- Erfolg/Safety;
- benoetigte Group Capabilities;
- reale Klassen-/Skill-/Gear-Verfuegbarkeit;
- Single-Target/AoE/CC/Kite/Heal/Tank/Revive;
- Reise-/Rendezvous-Aufwand;
- Gold-/Potion-/MP-Kosten;
- bisherige reale Performance;
- aktuelle World-/Event-/Quest-Evidence.

**Exit Gate:**
- Optimierer waehlt nur aus hard-erlaubten Varianten;
- fehlende Rolle/Capability wird nie erfunden;
- deterministischer Fallback bleibt vorhanden;
- Learning darf nur Ranking innerhalb erlaubter Kandidaten beeinflussen.

## 12. PR27 – Account Progression Balancer

**Status:** BLOCKED_BY_PR26.

Ziel: alle gepflegten Klassen/Charaktere des Accounts langfristig ungefaehr gleich stark halten, ohne Safety oder wichtige Aufgaben zu opfern.

Nicht nur Level betrachten, sondern klassenbezogene Progression:

- Level;
- relevante Ausruestung;
- Skill-Unlocks;
- Survival;
- DPS/Heal/Tank-Leistung;
- reale Performance;
- bisherige Einsatz-/Trainingszeit.

Regeln:

- keine absichtliche Schwaechung starker Charaktere;
- schwache Charaktere bevorzugt foerdern, wenn die Aufgabe weiter sicher bleibt;
- zwingend benoetigte starke Rollen duerfen weiterhin priorisiert werden;
- Gear kann nach groesstem Account-Fortschrittsnutzen verteilt werden;
- Zielkorridor statt Zwang auf identische Staerke.

**Exit Gate:**
- kein Charakter/Class-Progression-Starvation;
- Safety vor Balance;
- Account-Balance beeinflusst nur zulaessige Task-/Party-Kandidaten.

## 13. PR28 – World Autonomy produktiv

**Status:** BLOCKED_BY_PR27.

R17 Foundations werden mit produktivem Movement/Combat/Merchant verbunden:

- Events;
- Quests;
- Rare/Boss;
- Spawn-/Mapgraph;
- Server-Hopping;
- PvP/Hardcore-Policies;
- Content Discovery/Quarantine.

**Exit Gate:**
- Event-/Quest-Drift vor Action revalidiert;
- Unknown Content bleibt fail-closed;
- Serverwechsel nur auf frischer, erlaubter Evidence;
- Task-/Party-Optimizer kann World-Aufgaben sicher planen.

## 14. PR29 – Unattended 24/7 Hostbetrieb

**Status:** BLOCKED_BY_PR28.

CAP-042 und vorhandene Host-/Ops-Cores werden produktiv vervollstaendigt:

- enger Hostadapter;
- Browser-/Bot-Start;
- Watchdog;
- Restart-Budget;
- Alerts;
- kontrollierter Reboot-/Restart-Recovery;
- Safe Auto Updater;
- authority-neutrale RemoteConfig/Cloud-Control;
- Secret-Leak-Schutz.

**Exit Gate:**
- Host darf keine generische Gameplay-Authority exponieren;
- Restart-Loops werden bounded blockiert;
- Update nur in sicherem Quiesce-Zustand;
- Alerts/Watchdog real nachgewiesen;
- 15m unattended Integrationslauf.

## 15. PR30 – Langzeit-/24x7-Soak-Evidence

**Status:** BLOCKED_BY_PR29.

Das R19-Profil 5m/10m/15m bleibt gueltige beschleunigte Zertifizierung, ist aber kein Ersatz fuer Dauerbetrieb.

Stufen:

- mehrstuendiger Lauf;
- ueber-Nacht-Lauf;
- 72-Stunden-Lauf;
- **7-Tage-Lauf ohne manuellen Betriebseingriff**;
- **30-Tage-Burn-in ohne manuellen Betriebseingriff**;
- danach fortlaufender 24/7-Regelbetrieb.

Zu beobachten:

- RAM;
- SSD/Retention;
- Journalwachstum;
- offene Transaktionen;
- Retry/Circuit/Budgets;
- Sample-Gaps;
- Browser-/CDP-Stabilitaet;
- Merchant-/Farmer-Thrash;
- Party-/World-Drift;
- autonome Recovery.

**Exit Gate:**
- keine unbounded Ressourcen;
- keine stillen Evidence-Gaps;
- keine Duplicate-Wirkung;
- stabile autonome Recovery ueber Langzeitbetrieb;
- kein Restart-Loop und kein wiederholtes manuelles Wiederanlaufen;
- keine dauerhaft haengende offene/UNKNOWN-Transaktion;
- keine unerkannte Session-/Party-/World-/Bank-/Inventory-Drift;
- 7 Tage unbeaufsichtigt bestanden, bevor Wochenbetrieb als nachgewiesen gilt;
- 30 Tage unbeaufsichtigt bestanden, bevor Monatsbetrieb als nachgewiesen gilt.

## 16. PR31 – Linux-Kompatibilitaet

**Status:** BLOCKED_BY_PR30.

Erst nach stabilem Windows-Produktivbetrieb.

Abzudecken:

- plattformabhaengige Produktionswurzel;
- POSIX-Durability;
- Chromium/CDP;
- Service-/Autostart via systemd oder aequivalent;
- Signal-/Shutdown-Verhalten;
- identische Safety-/Recovery-Vertraege.

**Exit Gate:**
- dieselben Kern- und Produktivtests unter Windows und Linux;
- keine plattformspezifische Authority im Core;
- produktive Linux-Evidence.

## 17. PR32 – Mobile/Android-Bedienung

**Status:** OPTIONAL_AFTER_PR31.

Primaeres Ziel ist zunaechst mobile Bedienung eines stabilen Hosts, nicht ein kompletter Android-Produktionshost.

Moegliche Funktionen:

- Status;
- Alerts;
- read-only Evidence;
- sichere Bedienerbefehle;
- NOTHALT/Deny;
- kontrollierte Test-/Freigabeschritte innerhalb bestehender Authority-Grenzen.

Ein echter Android-/Termux-Host ist eine separate spaetere Entscheidung.

## 18. Aktueller naechster Schritt

Der verbindliche naechste Schritt bleibt PR20.1:

1. realer Merchant;
2. V3/V4 alternative Runtime inaktiv;
3. `equipment-equip-production:preflight`;
4. Ausgabe auswerten;
5. nur bei sauberem Preflight exakt einen produktiven Equip-Write;
6. Evidence auswerten;
7. erst danach PR20.2 Bank-Mutationen beginnen.

Die bestehende Produktionsdokumentation `dokumentation/PRODUKTIONS-KOMPOSITION.md` bleibt fuer diesen unmittelbaren Gate verbindlich.
