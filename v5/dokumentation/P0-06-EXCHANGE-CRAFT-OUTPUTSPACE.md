# P0-06 – Exchange, Craft, Dismantle und Outputspace

**Status:** DONE  
**Stand:** 2026-09-19  
**Source:** kaansoral/adventureland_mongodb@ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4  
**Live-Client revalidiert:** functions.js / runner_functions.js

## Ziel

P0-06 schließt die Sonderfälle von exchange, exchange_buy, craft, auto_craft und dismantle, insbesondere Inputverbrauch, Outputspace, Placeholder/q, zufällige Ausgaben und Recovery.

## Globale Outputspace-Erkenntnis

Der Server-Helper add_item versucht zuerst einen kompatiblen Stack, danach den ersten leeren Slot. Gibt es beides nicht, hängt er das Item trotzdem an player.items an und reduziert esize weiter.

Damit gilt für V5:

**Server-Overflow ist kein regulärer Kapazitätsmechanismus.**

Jede geplante Transformation muss vor dem Send konservativ beweisen, dass ihr terminaler Output in den vorgesehenen Inventarzustand passt.

## Exchange

exchange ist mehrphasig.

Vor Mutation prüft der Server unter anderem:
- kein bestehendes q.exchange;
- nicht in Bank;
- Input vorhanden und nicht gelockt;
- gültige Exchange-Definition/Drop-Tabelle;
- Reichweite;
- erforderliche Menge;
- Outputspace-Sonderregel.

Bei vollem Inventar wird abgelehnt, wenn der Input-Stack nicht exakt Menge 1 hat. Das gilt auch dann, wenn def.e theoretisch einen größeren Stack vollständig verbrauchen würde.

Bei akzeptiertem Start:
1. def.e Input wird verbraucht;
2. ein Placeholder wird eingefügt;
3. massexchange / massexchangepp kann verbraucht werden;
4. q.exchange wird angelegt;
5. initiale Antwort ist in_progress.

Beim Timerende:
1. q.exchange wird entfernt;
2. Placeholder wird entfernt;
3. die Drop-Tabelle wird aufgelöst;
4. der Reward wird in seiner tatsächlichen Domäne verbucht.

Mögliche Reward-Domänen:
- Item;
- Gold;
- Shells;
- Account-Cosmetics;
- Empty;
- rekursiv geöffnete Drop-Tabelle.

Zusätzlich existieren spezielle Multi-Output-Effekte, z. B. sixcake mit mehreren Anniversary-Gifts und möglichem zusätzlichen cxjar.

### Wichtig: Public Promise ist kein vollständiges Reward-Ledger

Der CODE-Wrapper wartet auf q/Placeholder und gibt danach ungefähr reward/name + num des ursprünglichen Placeholder-Slots zurück.

Ein Itemreward kann aber in einen bereits vorhandenen Stack eines anderen Slots gemerged werden. Gold, Shells, Cosmetics und Empty besitzen überhaupt keinen Itemnamen. Rekursive/spezielle Rewards können mehrere Effekte erzeugen.

Daher:

**exchange().reward / num ist nur unterstützende Evidence.**

Settlement benötigt den vollständigen Diff aller für die gepinnte Drop-Tabelle möglichen Reward-Domänen.

## Exchange Outputspace

V5 berechnet vor dem Send aus der gepinnten D.drops-Struktur einen konservativen, endlichen Reward-/Slot-Bound.

Kann der rekursive Drop-Graph nicht sicher begrenzt werden oder ist er gegenüber dem verifizierten Snapshot gedriftet, bleibt die betreffende Exchange-Automation gesperrt.

Generic add_item overflow darf niemals absichtlich eingeplant werden.

## exchange_buy

Der Public Wrapper sucht einen Token-Stack und sendet:
- Inventory-Index;
- Zielreward;
- die komplette aktuell beobachtete Token-Stack-Menge q.

Der Server verlangt anschließend:

current item.q == data.q

Andernfalls: safety_check.

data.q ist damit ein Optimistic-Concurrency-Snapshot des ganzen Token-Stacks, nicht die gewünschte Kaufmenge.

Outputspace wird vor Mutation geprüft, sofern der Token-Stack nach dem Kauf bestehen bleibt. Wird der Stack vollständig verbraucht, kann sein frei werdender Slot den Output aufnehmen.

Mutation ist synchron:
Validate -> Consume Token -> Add Reward -> Resend -> Success.

## Normaler Craft

craft sendet bis zu neun [GridPosition, InventoryIndex]-Paare.

Der Server:
1. liest die physischen Items der angegebenen Slots;
2. bildet aus sortierten Namen/Leveln einen Craft-Key;
3. löst den Recipe-Namen über D.craftmap auf;
4. prüft Range, Gold, Mengen und Outputspace;
5. zieht Gold ab;
6. konsumiert Inputs;
7. erzeugt genau einen Hauptoutput.

Aktuell enthalten die verifizierten normalen G.craft-Rezepte **keine doppelten Ingredient-Namen**.

Das ist sicherheitsrelevant, weil der normale Serverpfad quantity und place nach Itemname keyed. Taucht später ein Rezept mit doppeltem Ingredient-Namen auf, wird Craft für dieses neue Schema quarantined, bis die Semantik neu geprüft wurde.

### Outputspace

Wenn mindestens ein ausgewählter Ingredient-Stack exakt vollständig konsumiert wird, betrachtet der Server den frei werdenden Slot als ausreichend für den einen Output.

Sonst muss can_add_item(output) vor Mutation erfolgreich sein.

### Output-Eigenschaften

Nicht-misc p-Eigenschaften der Inputitems können gesammelt werden; eine davon kann zufällig auf den Craft-Output übertragen werden.

add_item wird außerdem mit r:1 aufgerufen, wodurch geeignete Upgrade-/Compound-Outputs unabhängig selten shiny werden können.

Postcondition darf deshalb nicht nur Name/Menge prüfen, sondern muss die erlaubten Properties des Outputs erfassen.

## auto_craft

auto_craft sucht clientseitig für jede Rezeptkomponente vom kleinen Inventory-Index aufwärts den ersten passenden:
- unlocked;
- unblocked;
- non-giveaway;
- Name/Level passend;
- ein einzelner Stack enthält die komplette benötigte Menge.

V5 repliziert diese Auswahl unmittelbar vor Send und pinnt die exakten physischen Stack-Identitäten.

## Anniversary-Craft

Rezepte mit quest == anniversary_baker werden im normalen Craft-Handler an anniversary_craft delegiert.

Dieser Pfad ist fachlich separat.

Der Server:
- prüft Season/NPC/Recipe;
- ignoriert nach Recipe-Identifikation die Client-Mengenbehauptung;
- plant gegen das vollständige aktuelle Inventar;
- kann eine einzelne Recipe-Anforderung über mehrere Stacks verteilen;
- prüft Outputspace;
- konsumiert den vollständigen Plan;
- erzeugt genau einen konfigurierten Output.

Aktuell existieren 10 Anniversary-Rezepte.

recipe.output kann Name/Data des Outputs überschreiben, z. B. makeawishjar -> cxjar mit data=makeawish.

Daher speichert V5 im Journal den gewählten Craft-Pfad:

NORMAL_CRAFT oder ANNIVERSARY_TRUSTED_PLAN.

## Dismantle – zwei verschiedene Pfade

### Leveled Compound Special

Wenn das Item Level > 0 besitzt und compound-fähig ist, greift vor dem normalen Dismantle-Pfad ein Sonderfall.

Ausnahme: Booster.

Kosten:
min(50.000.000, calculate_item_value(item) * 10)

Outputspace:
Vorher mindestens zwei freie Slots.

Nach Mutation:
- ein Input wird konsumiert;
- drei Kopien mit Level-1 entstehen;
- jede bekommt grace=floor(originalGrace/3).

Netto werden zwei zusätzliche Slots benötigt.

Wichtig: Dieser Server-Sonderpfad liegt **vor** den normalen Lock-/Block-Checks.

V5 ist absichtlich strenger und verweigert den Vorgang für gelockte, geblockte, Giveaway- oder anderweitig value-protected Items.

Der Sonderpfad kopiert nicht beliebige ursprüngliche p-Eigenschaften auf die drei Rekonstruktionen.

### Normaler Dismantle-Pfad

Der Server prüft:
- Definition vorhanden;
- unlocked;
- unblocked;
- Gold;
- konservativen Outputspace.

can_add_items erhält dabei alle möglichen Outputs. Auch probabilistische Outputs mit Wahrscheinlichkeit <1 werden für die Kapazitätsprüfung konservativ wie ein möglicher Output berücksichtigt.

Erst danach:
- Gold abziehen;
- einen Input konsumieren;
- Output-Rolls durchführen;
- tatsächlich gewonnene Outputs hinzufügen.

Damit ist der Normalpfad synchron, aber zufällig.

## Recovery

### Exchange

Nach q/Placeholder:
- niemals Blind-Retry;
- Inputdelta prüfen;
- vollständigen Inventory-Diff prüfen;
- Gold prüfen;
- Shells prüfen;
- Cosmetics/acx prüfen;
- erlaubten Empty-Fall berücksichtigen;
- massexchange-Condition prüfen.

Fehlender Reward im ursprünglichen Placeholder-Slot beweist nichts.

### Craft / exchange_buy / dismantle

Diese Handler sind synchron, aber nicht idempotent.

Nach unklarer Transportlage gilt weiterhin:
UNKNOWN -> Fresh State -> Reconcile.

NOT_APPLIED erfordert positive Evidence, dass Input, Gold/Token und Outputzustand unverändert sind.

## Harte V5-Regeln

1. Kein geplanter add_item-Overflow.
2. Outputspace wird vor jedem Transformations-Send serveräquivalent oder konservativer bewiesen.
3. Exchange-q/Placeholder bedeutet Input bereits konsumiert / Action accepted.
4. Exchange Promise reward/num ist kein vollständiges Reward-Ledger.
5. Exchange-Recovery umfasst alle vom Drop-Graph erlaubten Reward-Domänen.
6. Rekursive Drop-Graphs müssen bounded und versioniert sein.
7. exchange_buy pinnt den exakten Token-Stack samt vollständigem q.
8. Normal Craft pinnt exakte physische Inputstacks.
9. Neue Duplicate-Ingredient-Rezepte invalidieren die bisherige Normal-Craft-Annahme.
10. auto_craft repliziert die erste passende Single-Stack-Auswahl.
11. Anniversary Craft besitzt einen eigenen trusted multi-stack Serverplan.
12. Dismantle-Leveled-Compound ist ein eigener Drei-Output-Pfad.
13. V5 lockert seine Lock-/Block-/Value-Policy nicht, nur weil der Server-Sonderpfad sie nicht prüft.
14. Normal-Dismantle reserviert Platz für alle möglichen Zufallsoutputs.
15. Numerische Inventory-Indizes werden unmittelbar vor Send aus gepinnten Identitäten neu aufgelöst.
16. Promise-Result allein erzeugt keinen Domain-Commit.

## Ergebnis

P0-06 ist geschlossen.

Zentrale Erkenntnis:

**Outputspace ist Teil der Transaction Safety. Ein Server, der notfalls über die normale Bag-Grenze hinaus addiert, macht eine eigene konservative V5-Kapazitätsprüfung wichtiger – nicht überflüssig.**

## Maschinenlesbare Quelle

v5/wissensbasis/vertraege/exchange-craft.json
