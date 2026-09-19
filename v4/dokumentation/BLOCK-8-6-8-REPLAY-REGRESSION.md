# Block 8.6.8 – Replay und Regression

Status: **implementiert; noch nicht gemergt oder operativ freigegeben.**

## Ziel

Block 8.6.8 macht den kompletten Capability-Truth-Pfad aus Block 8.6 reproduzierbar.

Gleiche aufgezeichnete Eingaben muessen unabhaengig von Testreihenfolge, aktueller Uhrzeit oder Browserzustand dieselben Ergebnisse liefern fuer:

- Skill-Katalog-Audit,
- Recovery/Revalidierung,
- SkillPolicy,
- technische Skill-Readiness,
- CharakterFaehigkeiten,
- Capability-Sync,
- Remote-Vertrauen,
- capability-basierte Leader-/Aufgabenwahl,
- Status und Diagnose.

Die Wiederholung fuehrt keine Adventure-Land-Spielaktion aus.

## Neue Laufzeitbausteine

Vertrag:

`v4/laufzeit/quelle/vertraege/capability-wiederholung.ts`

Wiederholungsmaschine:

`v4/laufzeit/quelle/wiederholung/capability-wiederholung.ts`

Regression:

`v4/laufzeit/tests/capability-wiederholung.test.mjs`

Die Implementierung verwendet den bestehenden V4-Unterbau fuer:

- kanonisches JSON,
- SHA-256,
- deterministische Zeitpunkte,
- getrennte Variantenkennung,
- fail-closed Replay-Eingaben.

## Kein Live-Spielzugriff

Ein `CapabilityWiederholungsDatensatz` enthaelt ausschliesslich serialisierbare aufgezeichnete Werte.

Die Replay-Maschine erzeugt daraus ein isoliertes Adventure-Land-Lesefenster pro Charakter.

Dieses Fenster enthaelt nur read-only benoetigte Beobachtungsoberflaechen:

- `character`,
- `G.skills`,
- `G.items`,
- Serverregion/-kennung,
- `next_skill`,
- read-only `is_on_cooldown`,
- read-only `can_use`.

Es besitzt insbesondere keine:

- `use_skill`,
- `attack`,
- `move`,
- `smart_move`,
- `send_cm`.

## Persistenter Charakterzustand im Replay

Pro Charakter bleiben ueber Replay-Schritte hinweg getrennt erhalten:

- Skill-Katalog-Audit-Zustand,
- Revalidierungsprofil,
- SkillPolicy-Persistenz,
- Capability-Generation/Fingerprint,
- letzter erfolgreich gebildeter Capability-Snapshot.

Damit koennen echte Mehrschrittfolgen reproduziert werden statt nur unabhaengige Einzel-Snapshots zu vergleichen.

## Replay-Eingabe

Ein Charakterschritt enthaelt mindestens:

- Charakterkennung und Name,
- Klasse und Level,
- HP/MP,
- Server, Karte und Instanz,
- Ziel und Gefahrenstufe,
- rohe `G.skills`,
- rohe `G.items`,
- Equipment-Slots,
- Inventar,
- aktive Cooldowns,
- beobachtetes `can_use`,
- Connection-Gap ja/nein,
- Revalidierung ja/nein,
- geordnete SkillPolicy-Aenderungen,
- Lebensnachweis-Laufnummer,
- Remote-Snapshot-Quelle,
- explizite Gruppenkoordinationsautoritaet.

## Bounded Replay

Feste Obergrenzen:

- maximal 256 Replay-Schritte,
- maximal 16 Charaktere pro Schritt.

Replay-Schritte benoetigen:

- streng steigende laufende Nummer,
- streng steigenden Zeitpunkt,
- eindeutige Charakterkennungen,
- vorhandene eigene Teilnehmerkennung.

Nicht serialisierbare Eingaben werden ueber den bestehenden kanonischen JSON-Pfad abgewiesen.

## Remote-Snapshot-Quellen

Fuer jeden Remote-Teilnehmer kann aufgezeichnet werden:

- `aktuell`,
- `vorheriger`,
- `fehlend`.

### aktuell

Der in diesem Replay-Schritt neu abgeleitete Snapshot wird empfangen.

### vorheriger

Der letzte erfolgreiche Snapshot des vorherigen Zustands wird empfangen.

Damit wird insbesondere reproduziert:

> neuer aktiver Lebensnachweis + alter Capability-Snapshot.

Der bestehende Block-8.6.5-Vertrauenspfad muss diesen Snapshot fail-closed blockieren.

### fehlend

Es wird absichtlich kein Capability-Snapshot geliefert.

Fehlende Daten erzeugen keinen Klassenfallback.

## Reihenfolge pro Replay-Schritt

Fuer jeden Charakter:

1. aufgezeichnete Adventure-Land-Lesewerte in isoliertes Fenster uebernehmen,
2. Skill-Katalog-Audit ausfuehren,
3. optional exakt aktuellen Katalog revalidieren,
4. aufgezeichnete SkillPolicy-Aenderungen anwenden,
5. technische Readiness auswerten,
6. `CharakterFaehigkeiten` ableiten,
7. Block-8-Lebensnachweis aus den aufgezeichneten Safety-/Identitaetswerten bauen,
8. Capability-Snapshot bilden.

Danach fuer den eigenen Teilnehmer:

9. bestehende Block-8-Gruppenkoordination ausfuehren,
10. Remote-Snapshots entsprechend der aufgezeichneten Quelle einspeisen,
11. echten Block-8.6.5-Remote-Vertrauenspfad ausfuehren,
12. capability-basierte Gruppenwahl aus 8.6.6 ausfuehren,
13. Status-/Diagnoseprojektion aus 8.6.7 erzeugen.

Die Replay-Schicht erfindet keine alternative Capability-, Trust- oder Leaderlogik.

## Fingerprints

Jeder Lauf besitzt:

- `eingabeFingerabdruck`,
- pro Schritt `schrittFingerabdruck`,
- `ausgabeFingerabdruck`.

Alle Fingerprints sind SHA-256 ueber kanonisches V4-JSON.

Die Variantenkennung fliesst nicht in den Ausgabe-Fingerprint ein.

Dadurch muessen zwei unterschiedlich benannte Replay-Laeufe mit exakt denselben Inputs denselben Ausgabe-Fingerprint besitzen.

## Goldener Pflichtlauf

Die Regression verwendet einen neunstufigen Zwei-Ranger-Lauf.

### Schritt 1 – unterschiedliche Policies

Ranger A:

- Level 74,
- `3shot` EIN,
- `5shot` wegen Level noch nicht strukturell vorhanden.

Ranger B:

- Level 80,
- `3shot` EIN,
- `5shot` EIN.

Erwartung:

- getrennte Per-Character SkillPolicies,
- Ranger B besitzt zwei aktuell automatisierbare Multi-Target-Skills,
- capability-basierte Leader-/Schadenswahl kann Ranger B bevorzugen,
- keine statische Klassenlogik ist beteiligt.

### Schritt 2 – Level-Up und Skill AUS

Ranger A erreicht Level 75.

Erwartung fuer `5shot`:

- strukturell vorhanden,
- technisch bereit,
- Nutzerfreigabe weiterhin AUS,
- nicht automatisierbar.

Damit bleibt `SkillPolicy AUS` auch nach Level-Up harte Sperre.

### Schritt 3 – Equipmentverlust

Ranger B verliert den Bow.

Erwartung:

- historische Policy bleibt erhalten,
- technische Readiness fuer `3shot/5shot` faellt weg,
- aktuelle Automatisierbarkeit faellt weg,
- Leader-/Aufgabenwahl kann deterministisch auf Ranger A wechseln.

### Schritt 4 – unbekannter neuer Skill

Beide Ranger beobachten einen neuen `futureaoe`-Skill.

Der geaenderte Katalog wird explizit revalidiert.

Erwartung:

- Katalog kann wieder `bereit` werden,
- neuer Skill bleibt sichtbar,
- `automationValidated=false`,
- neuer Skill bleibt nicht automatisierbar,
- Diagnose meldet `SKILL_NICHT_VALIDIERT`.

### Schritt 5 – stale Remote-Capability

Ranger B besitzt wieder aktuelle Readiness, aber der Empfaenger erhaelt absichtlich dessen vorherigen Snapshot.

Erwartung:

- aktueller Lebensnachweis bleibt aktiv,
- alter Snapshot passt nicht zu `gesendetAm/laufendeNummer`,
- Remote-Vertrauen blockiert,
- Ranger B wird aus 8.6.6 ausgeschlossen,
- kein Klassenfallback.

### Schritt 6 – Catalog-Fingerprint-Mismatch

Ranger B beobachtet einen zusaetzlichen nur dort vorhandenen Skill und revalidiert seinen lokalen Katalog.

Erwartung:

- Remote-Snapshot ist intern bereit,
- lokaler und Remote-Katalog-Fingerprint unterscheiden sich,
- Remote-Vertrauen blockiert fail-closed,
- Catalog-Agreement zeigt `abweichend`.

### Schritt 7 – Connection-Gap

Beim eigenen Ranger fehlt die Serverkennung in der aufgezeichneten Adventure-Land-Lesequelle.

Erwartung:

- Katalog `veraltet`,
- `connectionGapAktiv=true`,
- keine aktuelle lokale Capability-Sync-Freigabe,
- keine normale capability-basierte Gruppenwahl.

### Schritt 8 – Recovery ohne Revalidierung

Die Verbindung ist wieder beobachtbar.

Erwartung:

- `recovery` wird erkannt,
- Connection-Gap endet,
- Katalog bleibt `veraltet`,
- alte Capability-Generation wird nicht still wieder freigegeben.

### Schritt 9 – explizite Revalidierung

Der exakt aktuell beobachtete lokale Katalog wird revalidiert.

Erwartung:

- Katalog wieder `bereit`,
- `produktionsbereit=true`,
- Gruppenwahl kann wieder aufgebaut werden.

## Determinismus-Abnahme

Der gleiche goldene Datensatz wird mindestens zweimal mit unterschiedlichen Variantenkennungen ausgefuehrt.

Pflicht:

- identischer Eingabe-Fingerprint,
- identische Schritt-Fingerprints,
- identischer Ausgabe-Fingerprint,
- identische Leaderfolge,
- identische Skill-/Capability-Zustaende.

## Autoritaetsgrenzen

Replay-Ergebnisse besitzen immer:

`aktionsAutoritaet=false`

Zusaetzlich muessen erhalten bleiben:

- `CharakterFaehigkeiten.aktionsAutoritaet=false`,
- Audit `aktionsAutoritaet=false`,
- Audit `automatischerNeustart=false`,
- Capability-Snapshot `aktionsAutoritaet=false`,
- Remote-Vertrauen `aktionsAutoritaet=false`,
- Capability-Gruppenwahl `aktionsAutoritaet=false`,
- CapabilityStatus ohne Spiel-, Bedien- oder Neustartautoritaet.

## Abnahme

Die Regression prueft mindestens:

1. gleiche Inputs -> gleicher Capability-/Leader-/Ausgabe-Fingerprint,
2. zwei Ranger mit unterschiedlichen `3shot/5shot`-Einstellungen,
3. `Skill AUS` trotz technischer Readiness,
4. Level-Up schaltet bekannten Skill strukturell frei,
5. Equipmentverlust entzieht Readiness,
6. unbekannter neuer Skill bleibt fail-closed,
7. stale Remote-Capability,
8. Catalog-Fingerprint-Mismatch,
9. Connection-Gap,
10. Recovery ohne stille Wiederfreigabe,
11. explizite Revalidierung,
12. kein Klassenfallback,
13. keine neue Spielaktionsautoritaet,
14. unbounded oder zeitlich nicht monotone Datensaetze werden abgewiesen.

## Nicht Bestandteil von 8.6.8

Noch nicht umgesetzt werden:

- Schatten-/Live-Freigabe,
- Soak,
- neue Adventure-Land-Aktion,
- Smart AoE,
- Lernen.

## Naechster Schritt

**8.6.9 – Freigabe: Offline → Schatten → kontrolliert live → Soak.**
