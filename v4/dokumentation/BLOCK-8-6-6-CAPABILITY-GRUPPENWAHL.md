# Block 8.6.6 – Capability-basierte Leader- und Aufgabenwahl

Status: **implementiert; noch nicht gemergt oder operativ freigegeben.**

## Ziel

Block 8.6.6 ersetzt fuer den neuen Block-8.6-Pfad statische Klassenannahmen und die rein grobe Capability-Auswahl durch eine deterministische, read-only Rollenentscheidung aus:

- bestehender Block-8-Safety,
- bestehender Block-8-Liveness/Freshness,
- in 8.6.5 vertrauten Capability-Snapshots,
- aktueller Skill-Readiness,
- expliziter Koordinationsautoritaet.

Die bereits freigegebene Block-8-Gruppenkoordination wird dabei **nicht veraendert**.

## Neue Laufzeitbausteine

Vertrag:

`v4/laufzeit/quelle/vertraege/capability-gruppenwahl.ts`

Entscheidungslogik:

`v4/laufzeit/quelle/spiellogik/capability-gruppenwahl.ts`

Regressionen:

`v4/laufzeit/tests/capability-gruppenwahl.test.mjs`

## Sicherheitsgrenze zur bestehenden Block-8-Runtime

8.6.6 ist eine neue read-only Schicht oberhalb der bestehenden `GruppenKoordinationsEntscheidung`.

Die alte Funktion `koordiniereGruppe` bleibt unveraendert.

Sie bleibt verantwortlich fuer:

- Liveness,
- Freshness,
- Welt-/Instanzkompatibilitaet,
- Lebendig-/Ausfallstatus,
- gemeinsame Gefahrenstufe,
- Betriebsart `normal`, `sicherheit` oder `blockiert`.

8.6.6 darf diese Entscheidung nicht aufweichen.

Wenn die Basisentscheidung nicht `normal` ist:

- wird kein normaler Capability-Leader gewaehlt,
- werden keine normalen Capability-Aufgaben vergeben,
- bleibt `aktionsAutoritaet=false`.

## Keine statische Klassenprioritaet

Es gibt keine Reihenfolge wie:

`warrior > paladin > ranger > ...`

Klasse und Level werden nicht als Ranking-Merkmale verwendet.

Die Klasse dient nur der Identitaets-/Konsistenzpruefung zwischen Capability-Snapshot und Block-8-Lebensnachweis.

Ein Ranger kann deshalb einen Warrior als Leader oder Schadens-Traeger uebertreffen, wenn seine **realen aktuell automatisierbaren Capabilities** dafuer besser passen.

## Explizite Koordinationsautoritaet

Jeder Teilnehmer benoetigt zusaetzlich:

`gruppenKoordinationErlaubt=true`

Diese Autoritaet wird als eigener Input geliefert.

Sie ist **nicht** identisch mit Adventure-Land-Spielaktionsautoritaet.

Ein Capability-Snapshot darf niemals selbst Autoritaet erzeugen.

Fehlende, doppelte, widerspruechliche oder explizit verweigerte Koordinationsautoritaet fuehrt fail-closed zum Ausschluss des Kandidaten.

## Vertrauensbasis

Ein Teilnehmer ist fuer die neue Rollenwahl nur verwendbar, wenn:

1. seine Charakterkennung in der bestehenden Block-8-Entscheidung aktiv ist,
2. seine aktuelle Block-8-Teilnehmerbewertung `aktiv` ist,
3. ein aktueller Lebensnachweis vorhanden ist,
4. explizite Koordinationsautoritaet vorhanden ist,
5. fuer Remote-Teilnehmer ein in 8.6.5 bereits als `vertraut` bewerteter Snapshot vorliegt,
6. lokaler bzw. Remote-Snapshot exakt zur Charakterkennung, zum Namen und zur Klasse des Lebensnachweises passt,
7. `lebensnachweisGesendetAm` und `lebensnachweisLaufendeNummer` exakt mit dem aktuell aktiven Lebensnachweis uebereinstimmen.

Fehlende Capability-Daten werden nicht durch Klasse oder alte grobe `faehigkeiten` des Lebensnachweises ersetzt.

## Aufgaben

Die bestehende stabile Aufgabenschnittstelle bleibt:

- `heilen`,
- `schaden`,
- `aggro`,
- `schutz`,
- `unterstuetzung`.

Fuer jede Aufgabe werden nur Skills betrachtet, bei denen gleichzeitig gilt:

- `aktuellAutomatisierbar=true`,
- `enabled=true`,
- `configuredReady=true`,
- mindestens ein Capability-Tag passt zur Aufgabe.

Das Mapping verwendet dieselbe `GRUPPEN_CAPABILITY_TAGS`-Quelle wie Block 8.6.4. Es wird keine zweite statische Skill-/Klassenliste eingefuehrt.

## Leader

Ein Leader-Kandidat muss:

- alle Vertrauens-/Autoritaetsgates bestehen,
- mindestens eine Aufgabenkategorie mit realen aktuell automatisierbaren Skills abdecken,
- mindestens einen aktuell automatisierbaren Skill besitzen.

Es gibt keinen Leader allein aufgrund einer Klasse oder eines Levels.

## Deterministische lexikographische Auswahl

Es wird **kein einzelner versteckter Gesamtscore** gebildet.

Harte Gates kommen zuerst:

1. Block-8-Betriebsart muss `normal` sein,
2. Teilnehmer muss aktiv sein,
3. Capability-Snapshot muss vertraut/gebunden sein,
4. explizite Koordinationsautoritaet muss vorhanden sein,
5. fuer die Aufgabe muss reale aktuelle Skill-Readiness vorhanden sein.

Danach erfolgt die sortierte Auswahl.

### Aufgabenwahl

Reihenfolge:

1. bessere aktuelle Safety-Stufe,
2. hoeherer Lebensanteil,
3. mehr passende aktuell automatisierbare Skills,
4. groessere relevante Target-Capacity,
5. frischere bestehende Block-8-Liveness,
6. Charakterkennung,
7. Charaktername.

### Leaderwahl

Reihenfolge:

1. bessere aktuelle Safety-Stufe,
2. hoeherer Lebensanteil,
3. mehr abgedeckte Aufgabenkategorien,
4. mehr aktuell automatisierbare Skills,
5. groessere Target-Capacity,
6. frischere bestehende Block-8-Liveness,
7. Charakterkennung,
8. Charaktername.

Charakterkennung und Name sind dadurch **nur finale Tie-Breaker**.

## Safety

`sicher` wird vor `angespannt` bevorzugt.

`gefaehrlich`, `kritisch` oder `unbekannt` fuehren bereits ueber die bestehende Block-8-Basisentscheidung aus dem normalen Betrieb heraus und koennen deshalb keine normale 8.6.6-Rollenwahl erzwingen.

Der aktuelle Lebensanteil wird als zusaetzliche Safety-Evidenz verwendet.

## Freshness

8.6.6 besitzt keinen eigenen Freshness-Timer.

Es verwendet ausschliesslich:

`GruppenTeilnehmerBewertung.alterMillisekunden`

aus der bestehenden Block-8-Liveness.

Freshness ist ein Ranking-Merkmal erst **nach** Safety und realer Capability-Eignung.

Ein alter, aber noch gerade aktiver Heartbeat kann deshalb nicht allein eine bessere Capability schlagen.

## Readiness

Readiness wird nicht erneut berechnet.

8.6.6 verwendet die aus 8.6.4/8.6.5 uebertragene Wahrheit:

`aktuellAutomatisierbar`

Damit wird kein zweiter Equipment-, Mana-, Material-, Cooldown- oder `can_use`-Pfad gebaut.

## Zwei gleiche Klassen

Zwei Ranger bleiben getrennt durch:

- Charakterkennung,
- Charaktername,
- eigenen Lebensnachweis,
- eigenen Capability-Snapshot,
- eigene SkillPolicy,
- eigene technische Readiness,
- eigene Capability-Generation/Fingerprint.

Die gemeinsame Klasse erzeugt keine Gleichsetzung und keine Prioritaet.

## Alte grobe Lebensnachweiswerte

Die alten `GruppenTeilnehmerMeldung.faehigkeiten` bleiben fuer den bestehenden Block-8-Pfad bestehen.

8.6.6 verwendet sie **nicht** als Fallback fuer fehlende konkrete Capability-Snapshots.

Beispiel:

Ein Remote-Lebensnachweis kann historisch `schaden: 1` melden. Fehlt aber ein vertrauter 8.6.5-Snapshot, erhaelt dieser Teilnehmer in 8.6.6 keine Schadensaufgabe.

## Ergebnis

Die neue Entscheidung enthaelt:

- Leaderkennung und -name,
- nachvollziehbaren Leadergrund,
- sortierte Leader-Kandidaten,
- pro Aufgabe gewaehlten Charakter,
- pro Aufgabe sortierte Kandidaten,
- kompatible `GruppenAufgabenZuordnung`,
- vertraute Teilnehmerkennungen,
- ausgeschlossene Teilnehmer mit Grund,
- `aktionsAutoritaet=false`.

Damit ist die Auswahl erklaerbar und fuer 8.6.7 direkt diagnostizierbar.

## Abnahme

Die Regressionen pruefen mindestens:

1. keine statische Warrior-vor-Ranger-Prioritaet,
2. Ranger gewinnt aufgrund mehr realer Damage-Capabilities,
3. Heal/Support/Aggro/Damage werden aus konkreten Tags verteilt,
4. aktuelle Safety hat Vorrang,
5. Capability-Eignung kommt vor Freshness,
6. Freshness kommt vor Identitaets-Tie-Breakern,
7. Charakterkennung ist nur letzter deterministischer Tie-Breaker,
8. fehlende Koordinationsautoritaet sperrt,
9. blockierte Remote-Capability wird nicht durch grobe Altwerte ersetzt,
10. Safety-Betrieb vergibt keinen normalen Leader und keine normalen Aufgaben,
11. alter lokaler Snapshot mit neuer Liveness wird ausgeschlossen,
12. zwei Ranger derselben Klasse bleiben getrennte Kandidaten,
13. Ergebnis besitzt keine Spielaktionsautoritaet.

## Nicht Bestandteil von 8.6.6

Noch nicht umgesetzt werden:

- HUD-/Status-Rendering der neuen Entscheidung,
- Aenderung des alten Block-8-Produktionspfads,
- direkte Adventure-Land-Aktionsausfuehrung,
- Smart AoE,
- Lernen,
- automatische Autoritaetserweiterung.

## Naechster Schritt

**8.6.7 – Status, HUD und Diagnose.**
