# Block 8.6.1 – Skill-Katalog-Vertrag und Live-Lesequelle

Status: **implementiert; noch nicht gemergt oder operativ freigegeben.**

## Ziel

Adventure Lands live beobachtetes `G.skills` ist die technische Source of Truth. V4 liest diese Daten read-only, normalisiert die fuer Automatisierung relevanten Eigenschaften und erzeugt daraus einen versionierten, reproduzierbaren `SkillKatalog`.

Der Katalog ist Wissen, keine Spielaktionsfreigabe. Er besitzt immer `spielAutoritaet: false`.
Block 8.6.1 fuehrt keine neue Spielaktionsautoritaet ein.

## Neue Laufzeitbausteine

Vertrag:

`v4/laufzeit/quelle/vertraege/skill-katalog.ts`

Live-Lesequelle:

`v4/laufzeit/quelle/adventure-land/adventure-land-skill-katalog.ts`

Die Live-Lesequelle verwendet die bestehende read-only Adventure-Land-Datenquelle. Es wird keine Funktion aus `ausfuehrung/` importiert und es werden weder `use_skill(...)` noch andere Adventure-Land-Spielaktionen aufgerufen.

## Versionierter Vertrag

`SkillKatalog` Schema-Version 1 enthaelt mindestens:

- Quelle `adventure-land-g-skills`,
- Aufnahmezeitpunkt,
- stabile Generation,
- Katalogzustand,
- fachlichen Katalog-Fingerprint,
- vorherigen Fingerprint bei Drift,
- normalisierte Skills,
- Anzahl explizit automationsvalidierter Skills,
- Fehler und Revalidierungsbedarf,
- `spielAutoritaet: false`.

Jeder `SkillKatalogEintrag` enthaelt mindestens:

- Skill-ID, Name, Art und Klassen,
- Level-, MP-, Cooldown- und Range-Daten,
- Range-/Damage-/Cooldown-Multiplikatoren, soweit live beobachtbar,
- Waffen-, Nebenhand- und Slot-Voraussetzungen,
- Verbrauchs-/Inventar-/Materialanforderungen,
- Target-Capacity,
- beobachtete technische Merkmale wie `multi`, `list`, `party`, `heal`, `hostile`, `target`, `share`,
- Capability-Tags,
- `automationValidated`,
- expliziten Validierungsgrund,
- unbekannte Adventure-Land-Rohfelder,
- einen fachlichen Skill-Fingerprint,
- `technischeReadiness` als explizit unbekannt und `aktionsFreigabe: false`.

## Technische Readiness

8.6.1 darf aus statischen Skilldefinitionen nicht behaupten, ein konkreter Charakter koenne einen Skill jetzt wirklich einsetzen.

Deshalb ist die charakterbezogene `technischeReadiness` in 8.6.1 absichtlich:

- `zustand: unbekannt`,
- mit erklaertem Grund,
- `aktionsFreigabe: false`.

Die echte technische Readiness wird in 8.6.4 aus Live-Charakterzustand, Level, Equipment, Material, aktuellem Zustand und SkillPolicy abgeleitet. Diese Trennung verhindert, dass der Katalog selbst neue Aktionsautoritaet erzeugt.

## Normalisierung und fachlicher Fingerprint

V4 normalisiert nur fachlich relevante Skillwerte. Listen wie Klassen und Waffenarten werden deterministisch sortiert und dedupliziert. Skill-Eintraege werden nach Skill-ID sortiert.

Der Fingerprint verwendet den bereits in V4 etablierten zentralen Pfad `kanonisiereJson(...)` -> `berechneSha256(...)`. Damit fuehrt Block 8.6.1 weder eine zweite Kanonisierung noch eine eigene Hash-Implementierung ein. Der SHA-256-Wert dient hier als reproduzierbarer fachlicher Fingerprint; er erzeugt keine zusaetzliche Spielautoritaet.

Nicht fachliche Werte wie Aufnahmezeitpunkte, visuelle Beschreibungen oder reine Laufzeitwerte gehen nicht in den fachlichen Fingerprint ein. Neue unbekannte Feldnamen bleiben sichtbar; ihre wechselnden unbekannten Werte werden nicht geraten und erzeugen keinen Fingerprint-Churn.

## Zustandsmodell

Der Katalog kennt exakt:

- `bereit` – strukturell gueltiger Live-Snapshot ohne offene Katalog-Revalidierung,
- `veraltet` – zuvor gueltiger Katalog darf bis zur Revalidierung nicht als aktuelle Wahrheit gelten,
- `drift` – der fachliche Fingerprint oder eine explizit validierte Skill-Semantik hat sich geaendert,
- `blockiert` – die Live-Quelle ist nicht sicher lesbar oder strukturell ungueltig.

Eine echte fachliche Aenderung erhoeht die Generation genau einmal. Ein zweiter identischer Snapshot nach Drift macht den Katalog **nicht** automatisch wieder `bereit`. Erst eine ausdrueckliche Revalidierung des exakt aktuellen Fingerprints darf den Zustand wieder auf `bereit` setzen.

Ein Leseausfall setzt den Katalog fail-closed auf `blockiert`. Nach Rueckkehr derselben Daten bleibt er zunaechst `veraltet`, bis der aktuelle Fingerprint revalidiert wurde.

Die automatischen Audit-Ausloeser fuer Runtime-Start, Reconnect, Server-/Charakterwechsel, Level-/Skill-Aenderung und periodische Kontrolle folgen in 8.6.2.

## automationValidated

Live-Erkennung und Automationsfreigabe sind strikt getrennt.

Ein neuer oder unbekannter Skill wird:

- im Katalog sichtbar,
- normalisiert,
- anhand beobachtbarer Merkmale analysiert,
- aber mit `automationValidated=false` markiert.

Capability-Tags eines unbekannten Skills sind nur beobachtete Analyseinformationen. Sie duerfen spaeter nur zusammen mit `automationValidated=true`, Katalogzustand `bereit`, technischer Readiness und SkillPolicy Autoritaet erhalten.

Fuer eine begrenzte Menge bereits fachlich gepruefter Skills besitzt V4 explizite Semantikregeln. Aendert Adventure Land an einem solchen Skill ein bisher unbekanntes Rohfeld oder eine sicherheitsrelevante Kernsemantik, wird `automationValidated` fuer diesen Skill entzogen und der Katalog geht auf `drift`. Eine reine Fingerprint-Bestaetigung kann eine fehlgeschlagene Semantikvalidierung nicht ueberstimmen.

Explizit validierte Kernskills in 8.6.1:

`heal`, `partyheal`, `cleave`, `stomp`, `agitate`, `taunt`, `hardshell`, `3shot`, `5shot`, `supershot`, `huntersmark`, `fanofknives`, `cburst`, `burst`, `energize`, `darkblessing`, `absorb`, `revive`, `mshield`, `mluck`.

Weitere beobachtete Skills bleiben sichtbar und fail-closed, bis ihre V4-Semantik bewusst validiert wurde.

## Target-Capacity

Eine explizite Live-Angabe `max_targets` hat Vorrang.

Fuer die explizit validierten Ranger-Skills `3shot` und `5shot` ist zusaetzlich ein semantisch validierter Fallback von 3 beziehungsweise 5 Zielen erlaubt, weil Adventure Land diese Skills als Mehrzielskills definiert, aber in der aktuellen Live-Definition nicht zwingend `max_targets` liefert.

Dieser Fallback gilt ausschliesslich fuer die beiden explizit validierten Skill-IDs. Unbekannte Skillnamen erhalten keine aus ihrem Namen geratene Target-Capacity.

## Adventure-Land-Referenzpruefung

Zur Implementierung wurde am 19. September 2026 zusaetzlich der aktuelle offizielle Adventure-Land-Quellstand als Schema-/Plausibilitaetsreferenz gelesen:

- Repository: `kaansoral/adventureland_mongodb`
- Datei: `design/skills.js`
- gepruefter Commit: `ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4`

Diese Referenz ist **nicht** die Runtime-Source-of-Truth. V4 liest im Betrieb weiterhin ausschliesslich die tatsaechlich vorhandenen Live-Daten aus `G.skills`. Der Referenzstand dient nur dazu, die initial explizit validierten Semantikregeln und bekannten Feldnamen nachvollziehbar zu pruefen.

## Tests

Die Regressionen pruefen mindestens:

- Live-Lesen ohne Spielaktion,
- stabile Fingerprints und Generationen bei gleichen fachlichen Daten,
- Nutzung des zentralen V4-Kanonisierungs- und SHA-256-Pfads ohne zweite Hash-Implementierung,
- Unabhaengigkeit von Aufnahmezeit und Feldreihenfolge,
- Ranger `3shot`/`5shot` mit Target-Capacity 3/5,
- Equipment-/Materialvoraussetzungen,
- unbekannter neuer Skill bleibt sichtbar und `automationValidated=false`,
- unbekannte Laufzeitwerte erzeugen keinen Fingerprint-Churn,
- neues unbekanntes Rohfeld an einem validierten Skill entzieht Validierung,
- fachliche Drift bleibt auch nach zweitem identischem Snapshot `drift`,
- exakte Fingerprint-Revalidierung,
- Leseausfall -> `blockiert` -> Rueckkehr -> `veraltet` -> Revalidierung,
- `spielAutoritaet: false` in allen Pfaden.

## Nicht Bestandteil von 8.6.1

Noch nicht implementiert werden:

- automatische Audit-Trigger und Connection-Gap-Timer aus 8.6.2,
- persistente SkillPolicy/Slider aus 8.6.3,
- charakterbezogene technische Readiness und Character Capabilities aus 8.6.4,
- Cross-Client Capability Sync,
- capability-basierte Leaderwahl,
- Smart AoE,
- Lernen,
- irgendeine neue Spielaktionsautoritaet.

Damit bleibt die bestehende V4-Sicherheitsgrenze unveraendert.
