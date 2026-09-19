# P0-05 – Upgrade- und Compound-Semantik

**Status:** DONE  
**Stand:** 2026-09-19  
**Offizieller Source-Snapshot:** kaansoral/adventureland_mongodb@ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4  
**Live-Revalidierung:** aktuell deployte functions.js und runner_functions.js

## Forschungsfrage

Wie funktionieren Upgrade und Compound exakt – inklusive Preview, Chance, Scroll-/Offering-Regeln, Grace, Platzhalter/q-Zwischenzustand, Resultcodes und Recovery?

## Gemeinsame Grundregel

Beide Public Functions sind mehrphasige, wertverändernde Transaktionen.

Der sichere Ablauf ist nicht:

request -> Promise -> fertig

sondern:

INTENT
-> Precondition
-> durable Journal
-> Send
-> Consumable-/Input-Mutation
-> q + Placeholder
-> Timer
-> terminale Servermutation
-> Response
-> frische Postcondition
-> COMMIT

Sobald ein echter Versuch akzeptiert wurde, darf derselbe Versuch nach Timeout oder Disconnect niemals blind erneut gesendet werden.

## Preview / calculate=true

upgrade(..., true) und compound(..., true) führen die serverseitige Validierung und Chancenberechnung aus, kehren aber vor der realen Mutation zurück.

Preview:
- verbraucht keinen Scroll;
- verbraucht kein Offering;
- erzeugt kein q;
- erzeugt keinen Placeholder;
- startet keinen echten Versuch.

Die serverseitige Preview-Chance ist Planning Evidence. Sie ist keine ExecutionAuthority. Vor dem echten Send werden alle physischen Inputs erneut live geprüft.

## Item Grade

calculate_item_grade arbeitet mit den Item-spezifischen grades oder standardmäßig [9,10,11,12].

Grade:
- 0 unter erster Schwelle;
- 1 ab grades[0];
- 2 ab grades[1];
- 3 ab grades[2];
- 4 ab grades[3].

Grade 4 ist für normale Upgrade-/Compound-Pfade max_level.

---

# Upgrade

## Öffentlicher Contract

upgrade(item_num, scroll_num, offering_num, only_calculate)

Channel:
upgrade

Transport:
socket event upgrade

Korrelation:
FIFO deferred, keine Request-ID.

## Normales Upgrade mit Upgrade Scroll

Basischance kommt aus design/upgrades.js über:

D.upgrades[item_def.igrade][new_level]

Verifizierte Basistabellen:

Grade-0-Basis:
1: 0.9999999
2: 0.98
3: 0.95
4: 0.70
5: 0.60
6: 0.40
7: 0.25
8: 0.15
9: 0.07
10: 0.024
11: 0.14
12: 0.11

Grade-1-Basis:
1: 0.99998
2: 0.97
3: 0.94
4: 0.68
5: 0.58
6: 0.38
7: 0.24
8: 0.14
9: 0.066
10: 0.018
11: 0.13
12: 0.10

Grade-2-Basis:
1: 0.97
2: 0.94
3: 0.92
4: 0.64
5: 0.52
6: 0.32
7: 0.232
8: 0.13
9: 0.062
10: 0.015
11: 0.12
12: 0.09

Die finale Chance wird zusätzlich durch:
- item.grace;
- player.p.ugrace;
- serverweites S.ugrace;
- item_def.igrace;
- player.p.ograce;
- Scroll-Grade;
- Offering-Grade

verändert.

Ein höhergradiger Scroll kann die Chance erhöhen. Offerings besitzen je nach Grade-Differenz unterschiedliche Multiplikatoren und Grace-Effekte.

Die finale Chance wird gegen die ursprüngliche Basischance gecappt:
- high-Pfad: maximal min(base+0.36, base*3);
- normal: maximal min(base+0.24, base*2).

## Zusätzlicher serverseitiger Roll-Modifier

Der Source enthält einen weiteren Effekt:

Wenn der Target-Inventarslot gleich player.p.item_num ist und ein separater 60%-Roll trifft, wird der ursprüngliche Zufallswert serverseitig zugunsten des Versuchs transformiert.

player.p.item_num wird serverseitig auf einen zufälligen Slot 0..41 gesetzt, wenn noch nicht vorhanden.

Konsequenz:

Die Preview liefert den Chance-Threshold, aber unter dieser Bedingung entspricht der angezeigte Threshold nicht zwingend der vollständigen effektiven Erfolgswahrscheinlichkeit.

V5 darf daher keine exakte langfristige Expected-Value-Berechnung allein aus preview.chance ableiten, ohne diesen Source-Mechanismus zu berücksichtigen.

## Mutation beginnt vor dem Timerende

Bei einem echten normalen Upgrade:
1. Scroll wird verbraucht;
2. Chance/Roll/Grace-Zustände werden berechnet;
3. optionales Offering wird verbraucht;
4. serverseitiger Outcome-State wird in player.p gespeichert;
5. character.q.upgrade wird erstellt;
6. der Target-Slot wird zu placeholder.

Der Roll ist also bereits gewählt, bevor der sichtbare Timer endet.

Placeholder bedeutet:

ACCEPTED + IN FLIGHT

nicht:

ROLL NOCH UNENTSCHIEDEN

## Normaler Fehlschlag

Bei normalen Upgrade-Scrolls wird das Zielitem auf einem fehlgeschlagenen Roll vernichtet.

## Scroll4-Sonderfall

scroll4 besitzt Grade 3.6.

Bei fehlgeschlagenem Roll:
- Item wird NICHT vernichtet;
- Item wird wiederhergestellt;
- u_fail=true;
- terminale Response ist trotzdem upgrade_fail / success:false.

Deshalb gilt:

upgrade_fail != Item zerstört

Die tatsächliche Inventory-Postcondition entscheidet.

## Stat Scroll / pscroll

pscroll verändert stat_type, nicht das Itemlevel.

Benötigte Scrollmenge je Grade:

[1, 10, 100, 1000, 9999, 9999, 9999]

Chance:
0.99999

Mit Offering:
- Offering wird verbraucht;
- item.grace += 1;
- Erfolg wird erzwungen.

Terminaler spezialisierter Resultcode:
upgrade_success_stat

Der Server kann danach zusätzlich generisches upgrade_success senden. Für V5 ist der Pfad-Contract maßgeblich: Stat-Upgrade bedeutet keine Levelerhöhung.

## Offering-only: Primordial-Type Offering

Wird ohne Scroll ein normales Item vom type=offering verwendet:
- Offering wird verbraucht;
- item.grace += 0.5;
- Chance = 1;
- Itemlevel bleibt unverändert;
- q/placeholder werden trotzdem verwendet.

Spezialisierte Response:
upgrade_offering_success

Auch hier darf ein zusätzliches generisches upgrade_success nicht als Level+1 interpretiert werden.

## Offering-only: Material Offering

Bestimmte Materialien besitzen ein numerisches Feld offering.

Dieser Pfad ist nur für Itemlevel 0 erlaubt.

Chance:
- Start 0.16;
- unter bestimmten Offering-/Itemwertbedingungen 0.32;
- danach Multiplikator [2.8, 1.6, 1] nach Originalgrade.

Bei Erfolg:
- Item bleibt;
- Item erhält p="shiny".

Bei Fehlschlag:
- Item bleibt ebenfalls erhalten;
- terminale Response ist upgrade_fail.

Damit existiert ein zweiter bestätigter Fall:

upgrade_fail != Itemverlust

## Timer

Normal:
500 * new_level * sqrt(new_level) * tmult

tmult:
- Originalgrade 0 -> 1
- Originalgrade 1 -> 1.5
- Originalgrade 2 -> 2

Hardcore:
500 ms

massproduction:
Dauer halbiert und Condition verbraucht.

massproductionpp:
Dauer /10 und Condition verbraucht.

Stat-Scroll:
2000 * tmult^2

Primordial Offering-only:
1000 ms

Material Offering-only:
2000 ms

## Upgrade Terminalzustände

Mögliche fachliche Erfolge:
- normales Level +1;
- Stat-Änderung;
- Grace-Infusion;
- Shiny-Proc.

Mögliche fachliche Fehlschläge:
- Item zerstört;
- Item trotz upgrade_fail erhalten, bei scroll4;
- Item trotz upgrade_fail erhalten, bei Material-Shiny-Pfad.

Daher ist die Promise-Antwort alleine niemals ausreichend.

---

# Compound

## Öffentlicher Contract

compound(item0,item1,item2,scroll_num,offering_num,only_calculate)

Channel:
compound

Transport:
socket event compound

Korrelation:
FIFO deferred, keine Request-ID.

## Preconditions

Server prüft:
- genau drei verschiedene Integer-Indizes;
- alle drei Items vorhanden;
- gleicher Name;
- gleiches Level;
- Item compound-fähig;
- nicht Grade 4;
- cscroll;
- Scroll-Grade >= aktueller Item-Grade;
- keine der drei Items gelockt;
- optionales Offering muss type=offering sein;
- außerhalb Bank;
- Service-Reichweite, sofern nicht Computer.

## Basischancen

Grade-0-Basis:
1: 0.99
2: 0.75
3: 0.40
4: 0.25
5: 0.20
6: 0.10
7: 0.08
8: 0.05
9: 0.05
10: 0.05

Grade-1-Basis:
1: 0.90
2: 0.70
3: 0.40
4: 0.20
5: 0.15
6: 0.08
7: 0.05
8: 0.05
9: 0.05
10: 0.03

Grade-2-Basis:
1: 0.80
2: 0.60
3: 0.32
4: 0.16
5: 0.10
6: 0.05
7: 0.03
8: 0.03
9: 0.03
10: 0.02

Ab Itemlevel 3 wird die für die Basistabelle verwendete Grade-Klasse auf Basis von level-2 erneut bestimmt.

Scroll- und Offering-Grade sowie die Grace der drei Inputs und player.p.ograce verändern danach die Chance.

Für normale Items wird die finale Chance gegen die ursprüngliche Basischance gecappt.

## Realer Mutation-Start

Bei echtem Compound:

1. Compound Scroll wird verbraucht;
2. Basis-Roll wird gewählt;
3. Offering wird gegebenenfalls verbraucht;
4. Outcome wird serverseitig in player.p.c_item oder c_itemx gespeichert;
5. character.q.compound wird erzeugt;
6. Item 0 wird Placeholder;
7. Item 1 wird sofort null;
8. Item 2 wird sofort null.

Das bedeutet:

Zwei der drei physischen Inputs sind bereits verschwunden, obwohl der sichtbare Compound-Timer noch läuft.

Das ist ein erwarteter IN-FLIGHT-Zustand und niemals ein Retry-Signal.

## Erfolg

Bei Erfolg:
- ein Output-Item bleibt;
- Level steigt grundsätzlich um 1;
- zwei weitere Inputs bleiben verbraucht;
- ausgewählte Eigenschaften werden aus den drei Inputs zusammengeführt;
- Grace wird neu berechnet.

## Fehlschlag

Bei normalem Fehlschlag:
- alle drei Input-Items sind verloren;
- erster Placeholder wird terminal gelöscht.

## Booster-Sonderfall

Bei Booster-Compound:
- Basis-Erfolgschance wird auf praktisch 100% gesetzt;
- mit Offering startet zusätzlich ein 12%-Proc;
- jeder erfolgreiche Extra-Proc erhöht das Item um ein weiteres Level;
- danach wird die Proc-Chance halbiert und erneut geprüft.

Also:

12%
-> 6%
-> 3%
-> 1.5%
-> ...

Die finale Boosterstufe wird daher immer aus dem tatsächlich beobachteten Output gelesen.

Preview kann die near-certain Compound-Basischance anzeigen, sagt aber nicht voraus, wie viele Bonuslevel der rekursive Proc erzeugt.

## Timer

Normal:
10000 ms

Hardcore:
1200 ms

massproduction:
Dauer halbiert.

massproductionpp:
Dauer /10.

Die jeweilige Condition wird beim Start verbraucht.

---

# Resultcodes und Promise-Semantik

Preview:
- upgrade_chance
- compound_chance

Upgrade terminal:
- upgrade_success
- upgrade_fail
- upgrade_success_stat
- upgrade_offering_success

Compound terminal:
- compound_success
- compound_fail

Normale Roll-Failures sind fachliche Ergebnisse und keine simple Transport-Validation.

Validation-Rejections dürfen nicht mit ausgeführten Roll-Failures verwechselt werden.

## Recovery-Grenze

Sobald q/placeholder oder entsprechende Consumable-Deltas sichtbar sind:

ACTION ACCEPTED

Nach Crash/Disconnect/Timeout gilt:

UNKNOWN
-> fresh inventory
-> q/placeholder
-> scroll/offering delta
-> path-spezifische Itempostcondition
-> RECONCILE

Nie:

UNKNOWN
-> retry original upgrade/compound

## NOT_APPLIED

NOT_APPLIED ist nur erlaubt, wenn positive frische Evidence beweist:

- alle gepinnten physischen Inputs existieren unverändert;
- Scroll/Offering-Mengen sind unverändert;
- relevante Conditions sind unverändert;
- kein attributable q/placeholder existiert.

Fehlende Response oder fehlender Output beweisen kein NOT_APPLIED.

## Harte Invarianten

1. Preview ist Planning Evidence, keine ExecutionAuthority.
2. Physische Inputs werden unmittelbar vor echtem Send erneut geprüft.
3. Placeholder bedeutet angenommene laufende Mutation.
4. Der Roll kann bereits vor Timerende feststehen.
5. Kein Same-Intent-Retry nach möglichem Send.
6. upgrade_fail wird nur zusammen mit der Pfad-Postcondition interpretiert.
7. scroll4-Failure erhält das Item.
8. Material-Offering-Failure erhält das Item.
9. Offering-only Grace-Infusion erhöht kein Level.
10. Stat-Scroll ändert stat_type, nicht Level.
11. Compound-Failure zerstört alle drei Inputs.
12. Compound-Success liefert genau einen Hauptoutput.
13. massproduction/massproductionpp gehören zum Action-State.
14. Booster-Bonuslevel werden aus finalem Output reconciliert.
15. Server-Preview-Threshold wird nicht blind als vollständige effektive Erfolgswahrscheinlichkeit behandelt, solange der dokumentierte Slot-Roll-Modifier relevant sein kann.

## Ergebnis

P0-05 ist geschlossen.

Die zentrale Recovery-Erkenntnis lautet:

**q/placeholder ist Beweis für einen akzeptierten Wertvorgang, nicht für einen noch unentschiedenen Versuch.**

## Maschinenlesbare Quelle

v5/wissensbasis/vertraege/upgrade-compound.json
