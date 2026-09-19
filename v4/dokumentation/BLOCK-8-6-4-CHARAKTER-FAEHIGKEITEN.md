# Block 8.6.4 – CharakterFaehigkeiten

Status: **implementiert; noch nicht gemergt oder operativ freigegeben.**

## Ziel

Block 8.6.4 leitet aus dem Live-`SkillKatalog`, der charakterbezogenen technischen Readiness und der persistenten `SkillPolicy` eine reproduzierbare Capability Truth pro Charakter ab.

Die Ableitung ist read-only. Sie darf weder `use_skill` noch andere Adventure-Land-Spielaktionen aufrufen und besitzt immer:

`aktionsAutoritaet=false`

## Neue Laufzeitbausteine

Vertrag:

`v4/laufzeit/quelle/vertraege/charakter-faehigkeiten.ts`

Technische Skill-Readiness:

`v4/laufzeit/quelle/adventure-land/adventure-land-skill-technik.ts`

Capability-Ableitung:

`v4/laufzeit/quelle/spiellogik/charakter-faehigkeiten.ts`

Regressionen:

- `v4/laufzeit/tests/adventure-land-skill-technik.test.mjs`
- `v4/laufzeit/tests/charakter-faehigkeiten.test.mjs`

Der bestehende `AdventureLandKampfBereitschaftLesezugriff` wird unveraendert wiederverwendet. Seine Cooldown-/`can_use`-Logik wird nicht ein zweites Mal implementiert.

## Vier getrennte Ebenen

Jeder charakterrelevante Skill weist mindestens getrennt aus:

1. **strukturellVorhanden** – Klasse und Level erlauben den Skill laut Live-Katalog,
2. **technischBereit** – Equipment, Material, Mana und aktuelle Adventure-Land-Nutzbarkeit sind bestaetigt,
3. **vomNutzerFreigegeben** – die persistierte Per-Character SkillPolicy steht auf EIN,
4. **automatisierungKonfiguriert** – die aktuelle SkillPolicy ist fuer den bereit validierten Katalog vollstaendig und fail-closed gueltig.

Zusaetzlich wird abgeleitet:

`aktuellAutomatisierbar`

Das ist nur dann wahr, wenn Katalog, Validierung, Struktur, technische Readiness und Nutzer-Policy gleichzeitig passen.

Auch `aktuellAutomatisierbar=true` ist **keine** Ausfuehrungsautoritaet.

## Technische Readiness

Die technische Auswertung prueft read-only:

- katalogisierte Waffen-`wtype`,
- Nebenhandtyp,
- katalogisierte Slot-/Gegenstands-Voraussetzungen,
- `consume` und bekannte Inventar-Voraussetzungen,
- aktuelles Mana gegen katalogisierte MP-Kosten,
- Cooldown und `can_use` ueber den bestehenden Kampfbereitschaftsleser.

Zustaende:

- `bereit`,
- `abklingzeit`,
- `blockiert`,
- `unbekannt`.

### Equipment

Waffen- und Nebenhandtypen werden aus dem aktuell ausgeruesteten Gegenstand plus `G.items` abgeleitet.

Fehlende Equipment-Metadaten werden nicht als passend geraten.

Eine explizite Slot-Voraussetzung wie `belt=knifebelt` muss aktuell erfuellt sein.

### Material

Explizite `consume`- und Inventar-Gegenstaende muessen im aktuellen `character.items` vorhanden sein.

Generische, nicht sicher interpretierte `requirements` werden in 8.6.4 nicht geraten. Sie bleiben `unbekannt` und damit fail-closed.

### Mana

Wenn der Katalog MP-Kosten nennt, muss aktuelles `character.mp` sicher lesbar und ausreichend sein.

### Cooldown und can_use

8.6.4 veraendert den vorhandenen `AdventureLandKampfBereitschaftLesezugriff` nicht.

Die technische Skill-Readiness ruft ausschliesslich dessen bestehende `liesAktionsBereitschaft`-API auf. Dadurch bleiben die bereits freigegebenen Regeln unveraendert:

1. `is_on_cooldown` und Shared-Cooldown-Aufloesung werden bevorzugt,
2. `can_use` bleibt der vorhandene positive Fallback, wenn keine Cooldown-Schnittstelle verfuegbar ist,
3. `can_use=false` wird ohne geratene Ursache als `unbekannt` behandelt.

Damit wird weder ein zweiter Cooldown-/`can_use`-Pfad noch eine Aenderung an der immutable Block-8.5-Runtime eingefuehrt.

## Unbekannte neue Skills

Ein neuer unbekannter Skill kann weiterhin strukturell sichtbar sein und beobachtete Capability-Tags besitzen.

Wenn `automationValidated=false` gilt:

- kann er nicht aktuell automatisierbar werden,
- zaehlt er nicht als validierte Capability,
- zaehlt er nicht in die groben Gruppenfaehigkeiten,
- erzeugt er keine neue Autoritaet.

## Capability-Auswertung

Fuer jeden `SkillCapabilityTag` werden getrennt gezaehlt:

- strukturell vorhanden,
- validiert,
- technisch bereit,
- vom Nutzer freigegeben,
- fuer Automatisierung konfiguriert,
- aktuell automatisierbar.

Zusaetzlich bleiben explizit sichtbar:

- maximale strukturelle Target-Capacity,
- maximale aktuell automatisierbare Target-Capacity.

Multi-Target-/AoE-Faehigkeit wird dadurch nicht in einem einzelnen allgemeinen Score versteckt.

## Bestehende Gruppenfaehigkeiten

Die bestehende Block-8-Schnittstelle bleibt unveraendert:

- `heilen`,
- `schaden`,
- `aggro`,
- `schutz`,
- `unterstuetzung`.

8.6.4 leitet dafuer pro Charakter ein `GruppenFaehigkeitsProfil` aus **aktuell automatisierbaren konkreten Skills** ab.

Der Wert ist die Anzahl verschiedener aktuell geeigneter Skills, die zur jeweiligen groben Faehigkeit beitragen. Ein Skill wird innerhalb derselben groben Kategorie hoechstens einmal gezaehlt.

Es gibt keine statische Klassenprioritaet.

### Mapping

`heilen`:

- Einzelziel-Heilung,
- Gruppen-Heilung,
- Gruppen-Erhaltung.

`schaden`:

- Einzelziel-Schaden,
- Einzelziel-Spitzenschaden,
- Mehrziel-Schaden,
- Fernkampf-Mehrziel-Schaden,
- variabler Mehrziel-Schaden,
- Flaechen-Schaden.

`aggro`:

- Aggro-Kontrolle,
- Flaechen-Aggro-Kontrolle,
- Pull-Kontrolle.

`schutz`:

- persoenlicher Schutz,
- Einzelziel-Kontrolle,
- Flaechen-Kontrolle.

`unterstuetzung`:

- Einzelziel-Debuff,
- Gruppen-Erhaltung,
- Gruppen-Unterstuetzung,
- Gruppen-Schadensunterstuetzung,
- Ressourcen-Unterstuetzung,
- Mobilitaet,
- Wiederbelebung,
- Nichtkampf-Unterstuetzung.

Die konkreten Capability-Tags und Target-Capacities bleiben parallel erhalten. 8.6.6 darf deshalb spaeter Aufgaben nicht allein aus dem groben Zahlenprofil waehlen.

## Generation und Fingerprint

`CharakterFaehigkeiten` besitzt:

- eine charaktergebundene Generation,
- einen SHA-256-Fingerprint ueber den kanonischen V4-JSON-Pfad.

Der Fingerprint umfasst relevante semantische Zustaende wie:

- Kataloggeneration/-fingerprint/-zustand,
- Klasse und Level,
- strukturelle Freischaltung,
- technische Readiness-Zustaende,
- Equipment-/Material-/Mana-Readiness,
- SkillPolicy-Freigabe und bounded Parameter,
- aktuell automatisierbare Capabilities.

Reine Zeitstempel und herunterzaehlende Cooldown-Restmillisekunden sind **nicht** Teil des Fingerprints.

Damit erzeugt ein Cooldown-Zustandswechsel eine neue Generation, das blosse Ticken derselben Cooldown-Phase aber nicht.

## Drift und stale Katalog

Bei `veraltet`, `drift` oder `blockiert` gilt:

- historische Nutzerfreigabe bleibt sichtbar,
- `automatisierungKonfiguriert=false`,
- `aktuellAutomatisierbar=false`,
- grobe Gruppenfaehigkeiten fallen fuer diese Skills auf 0,
- keine historische Capability-Generation wird still als aktuell vertraut.

## Abnahme

Die Regressionen decken mindestens ab:

1. vier getrennte Capability-Ebenen,
2. SkillPolicy AUS trotz technischer Readiness,
3. zwei echte Ranger-Multishots mit Target-Capacity 3 und 5,
4. Equipmentverlust entzieht Readiness ohne Nutzerfreigabe zu vergessen,
5. fehlendes Material,
6. zu wenig Mana,
7. `can_use=false` fail-closed,
8. geteilter Cooldown ueber den bestehenden Kampfbereitschaftsleser,
9. identische Cooldown-Phase ohne Fingerprint-Churn,
10. Level-Up schaltet bekannten Skill strukturell frei,
11. unbekannter Skill bleibt sichtbar aber nicht automatisierbar,
12. stale Katalog entzieht aktuelle Automatisierbarkeit,
13. grobe Gruppenfaehigkeiten werden aus konkreten Skills statt aus Klassenheuristiken abgeleitet,
14. keine neue Spielaktionsautoritaet.

## Nicht Bestandteil von 8.6.4

Noch nicht umgesetzt werden:

- Cross-Client Capability Sync,
- Remote-Freshness-/Fingerprint-Vertrauen,
- capability-basierte Leader-/Aufgabenwahl,
- HUD-/Diagnose-Rendering,
- Smart AoE,
- Lernen,
- neue Spielaktionsautoritaet.

## Naechster Schritt

**8.6.5 – Cross-Client Capability Sync.**
