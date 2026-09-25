# CAP-022 – Production Material Acquisition / Handoff

**Status:** PREPARED / NO-WRITE  
**Zweck:** V5-native Verbindung zwischen Production-`FARM`-Planung und spaeterer produktiver Farmer-Ausfuehrung.

## Ausgangslage

Der V5 Production Planner kann bereits `FARM`-Nodes in einem bounded Production-Graph planen. PR20.9 Craft wartet aktuell jedoch auf einen natuerlich vorhandenen `NORMAL_CRAFT_ONLY`-Kandidaten. Die produktiven Farmer-Aktionen Movement, Combat und Loot werden laut Post-R19-Roadmap erst in PR23 ratifiziert; deren Multi-Character-Transport/Koordination haengt wiederum von PR22 ab.

CAP-022 schliesst deshalb jetzt nur die **NO-WRITE-Planungsluecke**. Sie erzeugt keine Crafting-Materialien, fuehrt keine Farmer-Aktion aus und darf den aktuellen PR20.9-Blocker nicht umgehen.

## V5-native Implementierung

Quelle:

- `grundlage/quelle/koordination/production-material-acquisition.ts`

Vertrag:

- `grundlage/vertraege/runtime/pr22-23-production-material-acquisition-foundation.json`

Tests:

- `grundlage/tests/pr22-23-production-material-acquisition.test.mjs`

Handoff-Planung:

- `grundlage/quelle/koordination/production-material-handoff.ts`
- `grundlage/vertraege/runtime/pr22-23-production-material-handoff-foundation.json`
- `grundlage/tests/pr22-23-production-material-handoff.test.mjs`

Der Handoff wird erst aus `MATERIAL_READY_FOR_HANDOFF` geplant. Er nutzt die bestehende V5-`COLLECTION`-/Rendezvous-Logistik, pinnt einen einzelnen physischen Stack samt Item-Fingerprint und besitzt weiterhin keine Transfer- oder Gameplay-Authority.


Post-Settlement-Craft-Rescan:

- `grundlage/quelle/koordination/production-material-craft-rescan.ts`
- `grundlage/vertraege/runtime/pr22-23-production-material-craft-rescan-foundation.json`
- `grundlage/tests/pr22-23-production-material-craft-rescan.test.mjs`

Die Rescan-Bruecke akzeptiert nur ein korreliertes `COLLECTION`-`SETTLED` mit positivem Recipient-Mengen-Delta und einen **nach** diesem Settlement frisch beobachteten Merchant-Inventarstand. Das uebergebene Material muss Bestandteil des erneut geprueften NORMAL-Craft-Rezepts sein. Danach wird ausschliesslich der bestehende PR20.9 Read-only-Preflight erneut ausgefuehrt.


Persistenter Lifecycle / Restart-Recovery:

- `grundlage/quelle/koordination/production-material-lifecycle.ts`
- `grundlage/vertraege/runtime/pr22-23-production-material-lifecycle-foundation.json`
- `grundlage/tests/pr22-23-production-material-lifecycle.test.mjs`

Der Lifecycle persistiert ausschliesslich Evidence- und Phasenmetadaten kritisch. Jeder nichtterminale Zustand wird nach Restart zu `RECOVERY_PENDING`; eine Fortsetzung ist erst nach exakter Reconciliation der vorherigen Phase erlaubt. Same-Farm-Objective-, Same-Handoff- und Same-Craft-Rescan-Retry bleiben immer `false`.


Multi-Farmer-Objective / Aggregation:

- `grundlage/quelle/koordination/production-material-team-coordination.ts`
- `grundlage/vertraege/runtime/pr22-23-production-material-team-objective-foundation.json`
- `grundlage/tests/pr22-23-production-material-team-coordination.test.mjs`

Die Team-Foundation behaelt den urspruenglich gebundenen Farmer als Anchor, waehlt weitere frische Farmer bounded und deterministisch auf demselben Account/Server und bindet **alle** an exakt dieselbe `objectiveId`. Frische Inventory-Evidence wird accountweit fuer das Material aggregiert. Solange Material fehlt, wird die Restmenge bounded auf die ausgewaehlten Farmer verteilt; sobald die aggregierte Zielmenge erreicht ist, wird fuer alle `farmStopRequired=true` und ein spaeterer Multi-Source-COLLECTION-Handoff verlangt.


Multi-Source-COLLECTION-Handoff:

- `grundlage/quelle/koordination/production-material-team-handoff.ts`
- `grundlage/vertraege/runtime/pr22-23-production-material-team-handoff-foundation.json`
- `grundlage/tests/pr22-23-production-material-team-handoff.test.mjs`

Nach Aggregate-READY pinnt der Batchplan die tatsaechlichen physischen Materialstacks je Quell-Character und exakt die insgesamt benoetigte Menge. Transfers bleiben strikt sequenziell: vor jedem Transfer muessen Merchant-Rendezvous und Recipient-Baseline frisch erhoben werden, und ein vorheriger Transfer muss settled sein. Paralleltransfer und Same-Transfer-Retry sind ausgeschlossen. Dadurch kann der Inventar-Delta eines frueheren Transfers nicht versehentlich den Settlement-Nachweis eines spaeteren Transfers erfuellen.


Multi-Source-Batch-Settlement / Recovery:

- `grundlage/quelle/koordination/production-material-team-settlement-recovery.ts`
- `grundlage/vertraege/runtime/pr22-23-production-material-team-settlement-recovery-foundation.json`
- `grundlage/tests/pr22-23-production-material-team-settlement-recovery.test.mjs`

Der persistente Batch-Controller aktiviert immer nur **ein** Transfer-Leg. Nach jedem verifizierten Recipient-Settlement werden Merchant-Inventar-Fingerprint und Materialmenge als neue Baseline des Folge-Legs uebernommen. Ein Restart setzt `BATCH_BEREIT` oder `TRANSFER_AKTIV` auf `RECOVERY_PENDING`; ein aktiver Transfer darf danach nicht neu geplant oder erneut gesendet werden, sondern kann nur ueber sein bestehendes Settlement reconciled oder fail-closed beendet werden. Erst `ALLE_SETTLED` erlaubt den spaeteren frischen Craft-Rescan.

Zusaetzlich verifiziert der gemeinsame Logistik-Settlement-Pfad mehrere physische Stacks desselben Item/Levels nun **aggregiert** gegen die Recipient-Baseline. Damit kann ein partieller Delta nicht mehr mehrere Einzel-Stack-Anforderungen gleichzeitig erfuellen.


Multi-Source-ALL_SETTLED-Craft-Rescan:

- `grundlage/quelle/koordination/production-material-team-craft-rescan.ts`
- `grundlage/vertraege/runtime/pr22-23-production-material-team-craft-rescan-foundation.json`
- `grundlage/tests/pr22-23-production-material-team-craft-rescan.test.mjs`

Die Team-Bruecke akzeptiert ausschliesslich einen terminalen Batchzustand `ALLE_SETTLED` mit vollstaendiger, geordneter Transfer-ID-Kette, ohne aktiven Transfer und mit finalem Settlement-Fingerprint. Der Merchant-Inventar-Snapshot muss **nach** dem finalen Settlement frisch beobachtet worden sein und exakt dessen finalen Inventar-Fingerprint tragen. Das aggregiert uebergebene Material muss als NORMAL-Craft-Rezeptinput auftauchen. Danach laeuft nur der bestehende PR20.9 Read-only-Preflight.

Auch `TEAM_CRAFT_RESCAN_KANDIDAT_BEREIT_NO_WRITE` ist **keine** Craft-Ratifizierung. Es entstehen weder Craft-Authority noch Gameplay-/Raw-Write-Authority oder Normal-Runtime-Freigabe.


PR20.9 Durable-Shadow-Admission aus Team-Rescan:

- `grundlage/quelle/produktion/pr20-9-craft-team-rescan-durable-admission.ts`
- `grundlage/vertraege/runtime/pr20-9-craft-team-rescan-durable-admission-foundation.json`
- `grundlage/tests/pr20-9-craft-team-rescan-durable-admission.test.mjs`

Ein bereiter Team-Rescan wird **nicht** direkt persistiert. Die Admission bindet ihn zuerst exakt an die urspruengliche Read-only-Preflight-Anfrage sowie eine frische Current-Fence aus Character, Session, Server, finalem Merchant-Inventar-Fingerprint, Q-Fingerprint und den Resource-Epochen `inventory/q/socketBudget/actionChannel`. Daraus entstehen ausschliesslich der PR20.9-Durable-Shadow-Plan und der Current-Snapshot. Die Admission selbst schreibt nichts und erzeugt keinen Durable Intent.

Nur der bereits bestehende `persistierePr20_9CraftDurableShadow(...)`-Controller darf danach separat einen kritischen terminalen NO-WRITE-Shadow-Intent persistieren. Ein synthetischer Unit-Test dieser Verbindung ist keine Live-Evidence und gibt keinen PR20.9-Ratification-Credit.


PR21-28 Full-Chain-Orchestration-Readiness:

- `grundlage/quelle/runtime/cap022-foundation-chain-readiness.ts`
- `grundlage/quelle/runtime/pr21-28-shadow-orchestrator.ts`
- `grundlage/vertraege/runtime/pr21-28-accelerated-orchestration.json`
- `grundlage/tests/pr21-28-orchestration.test.mjs`

Die gemeinsame Shadow-Pipeline akzeptiert CAP-022 nicht mehr nur anhand der ersten Material-Acquisition-Foundation. Alle neun vorbereiteten NO-WRITE-Fundamente von `MATERIAL_ACQUISITION` bis `TEAM_RESCAN_DURABLE_ADMISSION` muessen vollstaendig vorhanden und `PREPARED_NO_WRITE` sein. Eine fehlende oder blockierte Komponente sowie Authority- oder Ratification-Drift sperrt die gesamte PR21-28-Shadow-Pipeline fail-closed. Reale `ALL_SETTLED`-/Craft-Evidence wird dadurch nicht vorgetaeuscht oder ersetzt.


PR22/PR23 Feature-Gate-Bindung:

- `grundlage/quelle/runtime/pr21-28-feature-gates.ts`
- `grundlage/vertraege/runtime/pr21-28-deferred-evidence-feature-gates.json`
- `grundlage/tests/pr21-28-evidence-feature-gates.test.mjs`

Fuer PR22 und PR23 reicht ein generisches `orchestrationPrepared=true` nicht mehr aus. Beide produktiven Eligibility-Gates verlangen zusaetzlich `cap022FullChainReady=true`. Fehlt diese Bedingung, erhaelt der jeweilige Stage einen eigenen CAP-022-Blocker und die nachfolgende Produktivkette bleibt geschlossen. Die Gate-Auswertung erteilt weiterhin selbst keine Authority.

Die Implementierung wird neu auf V5-Vertraegen gebaut. `v3/src/party/production-material-acquisition.js` bleibt ausschliesslich Wissens- und Fehlerquelle.

## Ablauf

Der vorbereitete Pfad lautet:

`Production FARM-Node -> gemeinsames MaterialObjective -> Multi-Farmer-Aggregation -> FARM_REQUIRED -> aggregate MATERIAL_READY_FOR_HANDOFF -> PR22-Koordination -> PR23 Movement/Combat/Loot -> gepinnter Multi-Source Collection-Batch -> persistente sequenzielle Settlements/Recovery -> ALLE_SETTLED -> frischer Merchant-Inventar-Snapshot -> TEAM NORMAL_CRAFT_ONLY-Rescan -> frische PR20.9 Durable-Shadow-Admission/Current-Fence -> bestehender Durable-Shadow-Controller -> separate reale PR20.9-Craft-Evidence -> spaeterer produktiver Production-Pfad`

Die Foundation:

- liest `FARM`-Nodes aus einem bereits validierten V5-Produktionsplan;
- bindet frische Farm-Source-Evidence an Item, Level, Monster, Map und Spawn-Fingerprint;
- waehlt deterministisch nur einen frischen, selben Account/Server gebundenen Farmer;
- verlangt vorbereitete Movement-/Combat-/Loot-Faehigkeiten;
- erzeugt nur ein Planning-Objective;
- bewertet frische Inventory-Evidence fuer den Materialfortschritt;
- fordert bei erreichter Zielmenge sofort `MATERIAL_READY_FOR_HANDOFF`, Farm-Stop und Handoff.

Damit wird das historische CAP-022-Risiko **„Farmer farmt nach READY weiter“** explizit geschlossen.

## Safety-Grenze

Diese Foundation besitzt und erzeugt keine:

- Execution-Authority;
- Gameplay-Authority;
- Raw-Write-Authority;
- `send_cm`-Authority;
- Movement-/Combat-/Loot-Authority;
- breite Production-Graph-Authority;
- Normal-Runtime-Freigabe.

- Blind-Resume nach Restart;
- Same-Intent-Retry fuer Farmziel, Handoff oder Craft-Rescan.

Produktive Materialbeschaffung bleibt gesperrt, bis die dafuer benoetigten PR22-/PR23-Gates mit realer Evidence ratifiziert sind.

## Beziehung zu PR20.9

CAP-022 ist **kein** Mechanismus, um den aktuellen Craft-Test kuenstlich mit Material zu versorgen.

Insbesondere gilt:

- `candidateAcquisitionOrMutationAllowedNow = false`;
- ein geplantes Farmziel ist kein natuerlicher aktueller Inventar-Kandidat;
- die Foundation zaehlt nicht als Craft-Ratifizierung;
- Craft-Authority bleibt geschlossen;
- PR20.9 bleibt `CRAFT_DURABLE_SHADOW_BLOCKED_NO_NORMAL_CANDIDATE`.

- auch ein vorbereiteter `COLLECTION`-Handoff ist noch kein natuerlicher Merchant-Inventar-Kandidat;
- erst ein spaeter produktiv **settled** Handoff darf einen frischen Craft-Rescan ausloesen.

- ein synthetisches, geplantes oder nur im Unit-Test erzeugtes Settlement darf PR20.9 nicht fortschreiben;
- selbst ein erfolgreiches frisches Rescan-Ergebnis gibt noch keine Craft-Authority und zaehlt nicht als Craft-Ratifizierung.

Erst wenn spaeter im normalen produktiven Betrieb Material durch ratifizierte Farmer-Funktionen entsteht und dadurch ein echter `NORMAL_CRAFT_ONLY`-Kandidat im Inventar vorhanden ist, darf PR20.9 erneut beobachtet und nach seinen eigenen Craft-Gates fortgesetzt werden.

## Naechster produktiver Pfad

1. PR20.9 bleibt fail-closed, solange kein natuerlicher Craft-Kandidat existiert.
2. PR22 muss produktive Multi-Character-Koordination ratifizieren.
3. PR23 muss mindestens Movement, Combat und Loot separat produktiv ratifizieren.
4. CAP-022 darf danach Materialziele real ausfuehren lassen und bei Zielmenge in den Handoff wechseln.
5. Ein dadurch im normalen Betrieb entstandener Craft-Kandidat kann einen neuen PR20.9-Shadow-Lauf ausloesen.
6. Erst die separate Craft-Evidence darf Craft-Authority und spaetere Production-Schritte oeffnen.
