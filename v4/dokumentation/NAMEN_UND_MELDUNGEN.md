# Deutsche Namen und narrensichere Meldungen

> **Status:** Verbindlicher V4-Architekturstandard  
> **Gilt fuer:** Quellcode, Typen, Klassen, Funktionen, Variablen, Zustaende, Ereignisse, Fehlerkennungen, Ordner, Dateien und Dokumentation  
> **Ziel:** V4 soll seine Absicht bereits durch seine Namen erklaeren.

## 1. Grundsatz

Alle von uns kontrollierten V4-Bezeichnungen sind deutsch. Dazu gehoeren Klassen, Funktionen, Variablen, Zustaende, Ereignisse, Fehlerkennungen, Warnungen, Ordner und Dokumente.

Technisch vorgegebene Namen externer Werkzeuge wie `package.json`, TypeScript-Schluesselwoerter, Node.js-APIs, GitHub-Actions-Felder oder Adventure-Land-Rohfelder sind davon ausgenommen.

Umlaute werden im Quellcode und in Dateinamen als `ae`, `oe`, `ue` und `ss` geschrieben. Nutzertexte duerfen normale Umlaute enthalten.

Die wichtigste Formel lautet:

```text
Verb + eindeutiger Fachbegriff + optionaler Zusatz
```

Beispiele:

```ts
berechneKampfRisiko()
findeNaechstenHaendler()
waehleBestesFarmziel()
erstelleMerchantProduktionsplan()
erfasseKampfErgebnis()
gleicheGruppenZustandAb()
```

V4 optimiert nicht auf moeglichst kurze Namen. V4 optimiert auf **minimale Mehrdeutigkeit**.

---

## 2. Namen muessen ausserhalb ihrer Datei verstaendlich sein

Nicht verwenden:

```ts
planer.ordne()
verwaltung.aktualisiere()
gehirn.verarbeite()
steuerung.starte()
dienst.behandle()
```

Bevorzugt:

```ts
farmzielPlaner.bewerteUndOrdneFarmziele()
charakterRegister.fuehreCharakterBeobachtungZusammen()
strategieEntscheidung.waehleNaechsteAktion()
gruppenLebenszyklus.gleicheGruppenZustandAb()
merchantDienst.fuehreVersorgungsplanAus()
```

Ein Name darf laenger sein, wenn dadurch unklarer Kontext verschwindet.

Wer einen Funktionsaufruf liest, soll moeglichst nicht zuerst die Implementierung oeffnen muessen, um seine Bedeutung zu verstehen.

---

## 3. Schreibweisen

### Funktionen und Variablen

`camelCase`

```ts
berechneKampfRisiko()
ausgewaehltesFarmziel
aktuellerGruppenZustand
```

### Klassen, Typen und Schnittstellen

`PascalCase`

```ts
FarmzielPlaner
KampfRisikoBewerter
GruppenLebenszyklusKoordinator
CharakterBeobachtung
```

### Konstanten

`SCREAMING_SNAKE_CASE`

```ts
MAXIMALE_GRUPPENGROESSE
STANDARD_GOLD_RESERVE
FARM_BEWERTUNGS_INTERVALL_MS
```

### Quellcodedateien

`kebab-case`, deutsch und ohne Umlaute.

```text
farmziel-planer.ts
kampf-risiko-bewerter.ts
gruppen-lebenszyklus-koordinator.ts
merchant-produktions-ausfuehrer.ts
```

### Dokumente

Bestehende V4-Dokumente verwenden gut sichtbare deutsche Namen in Grossbuchstaben mit Unterstrichen.

```text
ARCHITEKTUR.md
NAMEN_UND_MELDUNGEN.md
ENTWICKLUNGSABLAUF.md
```

### Ereignisnamen und Fehlerkennungen

`SCREAMING_SNAKE_CASE`, deutsch und ohne Umlaute.

```text
FARMZIEL_AUSGEWAEHLT
GRUPPENMITGLIED_NICHT_VERFUEGBAR
KAMPF_RUECKZUG_AUSGELOEST
MERCHANT_PRODUKTION_ABGESCHLOSSEN
```

---

## 4. Verbindliche Funktionsverben

Jedes wichtige Verb besitzt in V4 eine feste Bedeutung. Diese Bedeutungen duerfen nicht beliebig vermischt werden.

### `ist...`

Prueft einen Zustand und gibt normalerweise einen Wahrheitswert zurueck.

```ts
istCharakterAmLeben()
istZielErreichbar()
istGruppeVollstaendig()
istInventarVoll()
```

Keine Seiteneffekte.

### `hat...`

Prueft Besitz oder Vorhandensein.

```ts
hatErforderlicheMaterialien()
hatGenugGold()
hatGueltigesFarmziel()
hatAktiveSteuerBerechtigung()
```

Keine Seiteneffekte.

### `kann...`

Prueft, ob eine Aktion moeglich oder erlaubt ist.

```ts
kannCharakterGegenstandTragen()
kannGegenstandHerstellen()
kannZielErreichen()
kannProduktionsplanAusfuehren()
```

`kann...` fuehrt die Aktion niemals selbst aus.

### `soll...`

Trifft eine Regel-, Strategie- oder Richtlinienentscheidung.

```ts
sollHeilen()
sollSichZurueckziehen()
sollFarmzielWechseln()
sollZurBankZurueckkehren()
```

Nicht erlaubt:

```ts
function sollHeilen() {
  benutzeFertigkeit('heal');
  return true;
}
```

Bevorzugt:

```ts
if (kampfRegeln.sollHeilen(zustand)) {
  kampfAusfuehrer.wirkeHeilung();
}
```

### `lies...`

Liest einen bereits bekannten Wert oder Zustand ohne aufwendige Suche.

```ts
liesCharakterStufe()
liesAktuellesFarmziel()
liesAusgeruestetenGegenstand()
liesDauerhaftenSpeicher()
```

Keine versteckte Aktion und keine umfangreiche Suche.

### `finde...`

Sucht etwas, das moeglicherweise nicht existiert.

```ts
findeNaechstenHaendler()
findeVerfuegbaresGruppenmitglied()
findePassendenInventarGegenstand()
findeBestenBankStapel()
```

Das Ergebnis darf `null` sein.

### `liste...`

Liefert mehrere Elemente.

```ts
listeRegistrierteCharaktere()
listeVerfuegbareFarmgebiete()
listeBankStapel()
listeNaheGegner()
```

Bevorzugt wird `[]` statt `null`.

### `zaehle...`

Ermittelt eine Anzahl.

```ts
zaehleFreieInventarPlaetze()
zaehleNaheGegner()
zaehleGegenstandsMenge()
```

### `erstelle...`

Baut eine strukturierte Datenrepraesentation oder einen Plan zusammen.

```ts
erstelleFarmplan()
erstelleKampfKontext()
erstelleMerchantProduktionsplan()
erstelleCharakterMomentaufnahme()
```

`erstelle...` bedeutet noch nicht, dass eine Aktion im Spiel ausgefuehrt wird.

### `erzeuge...`

Erzeugt eine neue technische oder fachliche Identitaet.

```ts
erzeugeProduktionsplanId()
erzeugeLernEpisode()
erzeugeGruppenOperation()
```

### `berechne...`

Fuehrt eine deterministische Berechnung durch.

```ts
berechneKampfRisiko()
berechneReiseDistanz()
berechneErwartetenSchaden()
berechneFarmzielBewertung()
```

Gleicher Eingabestand soll denselben Ausgabewert erzeugen.

### `schaetze...`

Berechnet einen angenaeherten oder prognostizierten Wert.

```ts
schaetzeToetungsDauer()
schaetzeReiseDauer()
schaetzeErwarteteErfahrungProStunde()
schaetzeTrankVerbrauch()
```

Der Name macht sichtbar, dass es sich nicht um einen sicheren Messwert handelt.

### `bewerte...`

Erzeugt eine Bewertung fuer genau einen Kandidaten oder einen Zustand.

```ts
bewerteFarmziel()
bewerteAusruestungsVerbesserung()
bewerteGruppenZusammenstellung()
```

Wenn die Funktion eine komplexe fachliche Beurteilung statt nur einer Zahl liefert, soll der Rueckgabetyp das ebenfalls klar benennen.

### `beurteile...`

Analysiert einen Zustand und erzeugt eine fachliche Klassifikation oder begruendete Beurteilung.

```ts
beurteileFarmgebiet()
beurteileKampfSituation()
beurteileGruppenGesundheit()
beurteileMerchantGelegenheit()
```

Beispiel:

```ts
{
  klassifikation: 'GEBIET_UEBERFUELLT',
  sicherheit: 0.87,
  belege: { ... }
}
```

### `bewerteUndOrdne...`

Bewertet mehrere Kandidaten und ordnet sie nach ihrer Guete.

```ts
bewerteUndOrdneFarmziele()
bewerteUndOrdneAusruestungsVerbesserungen()
bewerteUndOrdneGruppenKandidaten()
```

Diese Funktion waehlt noch keinen Kandidaten verbindlich aus.

### `waehle...`

Waehlt genau eine Option aus einer bekannten Menge.

```ts
waehleBestesFarmziel()
waehleGruppenErsatz()
waehleHeilZiel()
waehleNaechsteAktion()
```

### `plane...`

Legt zukuenftige Aktionen fest.

```ts
planeFarmRoute()
planeGruppenWechsel()
planeMerchantProduktion()
planeWiederherstellung()
```

Eine `plane...`-Funktion fuehrt die geplanten Aktionen niemals selbst aus.

### `fuehre...Aus`

Fuehrt eine bereits entschiedene oder geplante Aktion aus.

```ts
fuehreFarmplanAus()
fuehreGruppenWechselAus()
fuehreProduktionsplanAus()
fuehreWiederherstellungsAktionAus()
```

Diese Funktionen duerfen Adventure-Land-Aktionen ausloesen.

### `fordere...An`

Fordert eine Aktion oder Entscheidung von einer anderen Komponente an.

```ts
fordereNeuesFarmzielAn()
fordereGruppenNeuplanungAn()
fordereMerchantDienstAn()
```

### `erfasse...`

Speichert eine Beobachtung, ein Ereignis oder ein Ergebnis.

```ts
erfasseKampfErgebnis()
erfasseFarmgebietBewertung()
erfasseCharakterBeobachtung()
erfasseMerchantTransaktion()
```

Dieses Verb ist besonders fuer das lernende V4-System wichtig.

### `beobachte...`

Nimmt Informationen aus der Spielwelt auf.

```ts
beobachteCharakterZustand()
beobachteNaheEinheiten()
beobachteGruppenZustand()
beobachteMarktAngebote()
```

Beobachtung ist noch keine Entscheidung.

### `lerne...`

Aktualisiert explizit dauerhaftes Wissen oder ein Lernmodell.

```ts
lerneAusKampfErgebnis()
lerneFarmgebietLeistung()
lerneMarktpreisMuster()
```

`lerne...` darf nur verwendet werden, wenn tatsaechlich Wissen oder Modellzustand veraendert wird. Eine normale Statistik ist noch kein Lernen.

### `lade...`

Laedt persistenten Zustand.

```ts
ladeFarmWissen()
ladeStrategieZustand()
ladeCharakterHistorie()
```

### `speichere...`

Speichert persistenten Zustand.

```ts
speichereFarmWissen()
speichereStrategieZustand()
speichereCharakterHistorie()
```

### `gleiche...Ab`

Vergleicht beobachteten Ist-Zustand mit erwartetem Soll-Zustand.

```ts
gleicheGruppenZustandAb()
gleicheUnterbrochenenGruppenWechselAb()
gleicheMerchantInventarAb()
```

Dieses Verb wird bevorzugt fuer Neustart-, Wiederherstellungs- und verteilte Zustandslogik verwendet.

### `normalisiere...`

Wandelt externe oder inkonsistente Daten in unsere V4-Darstellung um.

```ts
normalisiereCharakterMomentaufnahme()
normalisiereInventarGegenstand()
normalisiereMonsterDaten()
```

### `validiere...`

Prueft eine vollstaendige Datenstruktur gegen definierte Anforderungen.

```ts
validiereProduktionsplan()
validiereGruppenZusammenstellung()
validiereCharakterMomentaufnahme()
```

Ein Validator repariert Daten nicht stillschweigend.

### `setze...Zurueck`

Setzt einen bekannten Zustand bewusst zurueck.

```ts
setzeFarmgebietVerfolgungZurueck()
setzeKampfSitzungZurueck()
setzeWiederherstellungsZustandZurueck()
```

---

## 5. Verbindlicher Ablauf fuer autonome Entscheidungen

Die V4-Architektur trennt Beobachtung, Beurteilung, Entscheidung, Ausfuehrung und Lernen sichtbar voneinander.

Der bevorzugte Ablauf lautet:

```text
beobachten
    ↓
normalisieren
    ↓
beurteilen
    ↓
bewerten / ordnen
    ↓
auswaehlen
    ↓
planen
    ↓
berechtigen
    ↓
ausfuehren
    ↓
pruefen / abgleichen
    ↓
erfassen
    ↓
lernen
```

Beispiel:

```ts
const beobachtungen = weltBeobachter.beobachteNaheEinheiten();

const weltZustand =
  weltNormalisierung.normalisiereWeltBeobachtung(beobachtungen);

const kandidaten =
  farmzielBeurteiler.beurteileFarmzielKandidaten(weltZustand);

const geordneteZiele =
  farmzielPlaner.bewerteUndOrdneFarmziele(kandidaten);

const ausgewaehltesZiel =
  farmzielPlaner.waehleBestesFarmziel(geordneteZiele);

const plan =
  farmPlaner.planeFarmSitzung(ausgewaehltesZiel);

if (aktionsBerechtigung.kannFarmplanAusfuehren(plan)) {
  await farmAusfuehrer.fuehreFarmplanAus(plan);
}

const ergebnis =
  farmPruefung.pruefeFarmplanErgebnis(plan);

farmLernen.erfasseFarmErgebnis(ergebnis);
farmLernen.lerneAusFarmErgebnis(ergebnis);
```

Der Ablauf soll bereits durch die Namen lesbar sein.

---

## 6. Generische und nichtssagende Namen sind verboten

Ohne eindeutigen Fachbegriff nicht verwenden:

```text
process()
handle()
manage()
do()
run()
check()
update()
apply()
perform()
thing()
data()
info()
helper()
util()
misc()
```

Ebenso nicht verwenden:

```ts
verarbeite()
behandle()
verwalte()
mache()
starte()
pruefe()
aktualisiere()
hilfsfunktion()
daten()
info()
```

Wenn ein solches Verb wirklich notwendig ist, muss der Fachgegenstand im Namen eindeutig sein. Meist existiert jedoch ein genaueres Verb aus Abschnitt 4.

Schlecht:

```ts
aktualisiere()
behandleEreignis()
verarbeiteDaten()
```

Besser:

```ts
erfasseCharakterBeobachtung()
behandleCharakterTodEreignis()
normalisiereSpielDaten()
```

Noch besser, wenn passend:

```ts
erfasseCharakterTod()
fuehreCharakterBeobachtungZusammen()
normalisiereSpielZustand()
```

---

## 7. Keine kryptischen Abkuerzungen

Nicht verwenden:

```text
char
inv
qty
cfg
ctx
mgr
exec
coord
eval
calc
tmp
prev
```

Bevorzugt:

```text
charakter
inventar
menge
konfiguration
kontext
verwaltung oder genauer Fachbegriff
ausfuehrer
koordinator
bewertung
berechnung
vorherig
```

Allgemein etablierte technische oder spielseitige Abkuerzungen bleiben erlaubt:

```text
id
api
url
http
json
xp
hp
mp
npc
pvp
pve
```

Adventure-Land-Eigennamen und Klassenbezeichnungen wie `Merchant`, `Warrior`, `Mage`, `Paladin`, `Priest`, `Ranger` oder `Rogue` duerfen als Spielbegriffe erhalten bleiben.

---

## 8. Adventure-Land-Rohdaten bleiben an der Systemgrenze

Adventure-Land-spezifische Kurzfelder duerfen nur in der Spielanbindung beziehungsweise im Adapter-/Normalisierungsbereich vorkommen.

Beispiele:

```text
Adventure-Land-Rohfeld    V4-Domaenenname

ctype                     charakterKlasse
mtype                     monsterTyp
q                         menge
isize                     inventarKapazitaet
rip                       istTot
s                         statusEffekte
items                     inventarGegenstaende
```

Erlaubt an der Grenze:

```ts
normalisiereCharakterAusSpielApi(roherCharakter)
```

Danach arbeitet V4 mit unserer eigenen Sprache:

```ts
charakter.charakterKlasse
charakter.inventarKapazitaet
charakter.istTot
```

Die Rohsyntax der Spiel-API darf sich nicht durch die gesamte V4-Codebasis verteilen.

---

## 9. Wahrheitswerte lesen sich wie Fragen

Nicht verwenden:

```ts
alive
ready
merchant
possible
valid
danger
```

Bevorzugt:

```ts
istAmLeben
istBereit
istMerchant
istMoeglich
istGueltig
istGefaehrlich
```

Fuer Besitz oder Vorhandensein:

```ts
hatTrank
hatZiel
hatBerechtigung
```

Fuer Faehigkeit:

```ts
kannAngreifen
kannHerstellen
kannBewegen
```

Fuer Entscheidungen:

```ts
sollAngreifen
sollSichZurueckziehen
sollNeuPlanen
```

---

## 10. Sammlungen sind Mehrzahl

Sammlungen erhalten immer einen Namen im Plural.

Schlecht:

```ts
const charakter = listeRegistrierteCharaktere();
const ziel = listeFarmziele();
```

Gut:

```ts
const charaktere = listeRegistrierteCharaktere();
const farmziele = listeFarmziele();
const gruppenMitglieder = listeGruppenMitglieder();
```

Map-, Set- und Index-Strukturen duerfen ihren Zweck im Namen tragen:

```ts
charakterNachName
haendlerNachGegenstand
bekannteGebiete
reservierteRessourcen
```

---

## 11. Klassen benennen Verantwortung, nicht Wichtigkeit

Verbotene oder unerwuenschte Klassenbestandteile:

```text
Manager
Super
Advanced
Ultimate
Smart
Intelligent
New
Old
V2
V3
V4
Alpha
Beta
Hotfix
Patch
```

Die Verantwortung soll im Namen stehen.

Schlecht:

```text
AdvancedPartyMovement
StrategicBrainV2
FarmAreaPressureHotfix
SuperMerchantManager
```

V4:

```text
GruppenBewegungsPlaner
StrategieEntscheidung
FarmgebietDruckModell
MerchantProduktionsKoordinator
```

Versionsgeschichte gehoert in Git, Releases und Migrationen, nicht dauerhaft in fachliche Kernnamen.

---

## 12. Kein `controlled`-/`kontrolliert`-Prefix als Sicherheitsersatz

In V4 ist kontrolliertes Handeln der Normalzustand. Sicherheit und Berechtigung werden als eigene Verantwortung modelliert.

Nicht:

```text
ControlledMerchantProductionExecutor
ControlledPartyLifecycleCoordinator
KontrollierterMerchantAusfuehrer
```

Sondern:

```text
MerchantProduktionsAusfuehrer
GruppenLebenszyklusKoordinator
AktionsBerechtigung
SicherheitsPruefung
```

Beispiel:

```ts
if (!aktionsBerechtigung.kannProduktionsplanAusfuehren(plan)) {
  return;
}

await merchantProduktionsAusfuehrer.fuehreProduktionsplanAus(plan);
```

Der Name beschreibt die Verantwortung, nicht ein unscharfes Sicherheitsversprechen.

---

## 13. Bevorzugte deutsche Bausteine fuer Klassen

Diese Begriffe sollen projektweit moeglichst gleich verwendet werden:

| Bedeutung | V4-Begriff |
|---|---|
| Planner | `Planer` |
| Executor | `Ausfuehrer` |
| Coordinator | `Koordinator` |
| Registry | `Register` |
| Observer | `Beobachter` |
| Evaluator | `Bewerter` oder `Beurteiler` je nach Aufgabe |
| Controller | `Steuerung` |
| Service | `Dienst` |
| Store | `Speicher` |
| State | `Zustand` |
| Snapshot | `Momentaufnahme` |
| Policy | `Regeln` oder `Richtlinie` |
| Guard | `Waechter` oder `Pruefung` |
| Recovery | `Wiederherstellung` |
| Authority | `Berechtigung` |
| Lifecycle | `Lebenszyklus` |
| Event | `Ereignis` |
| Outcome | `Ergebnis` |
| Target | `Ziel` |
| Candidate | `Kandidat` |

Wo zwei deutsche Begriffe moeglich sind, soll innerhalb eines Fachbereichs **ein Begriff dauerhaft beibehalten** werden.

---

## 14. V3 -> V4: konkrete Umbenennungsrichtung

Bei der Uebernahme von V3-Logik wird nicht blind der alte Name kopiert.

Beispiele:

| V3 | V4-Richtung |
|---|---|
| `finite()` | `normalisiereEndlicheZahl()` |
| `clone()` | `kopiereJsonWert()` |
| `levelOf()` | `liesGegenstandsAufwertungsStufe()` |
| `itemKey()` | `erzeugeGegenstandsStapelSchluessel()` |
| `itemQuantity()` | `zaehleGegenstandsMenge()` |
| `recipeFor()` | `liesHerstellungsRezept()` |
| `compatible()` | `kannCharakterGegenstandTragen()` |
| `currentItem()` | `liesAusgeruestetenGegenstand()` |
| `registryCharacters()` | `listeRegistrierteCharaktere()` |
| `bankRows()` | `listeBankStapel()` |
| `vendorIndex()` | `indiziereHaendlerNachGegenstand()` |
| `_id()` | `erzeugeProduktionsplanId()` |
| `_hold()` | `erstelleWartePlan()` |
| `_candidateOutputs()` | `findeAusruestungsVerbesserungsKandidaten()` |
| `_buildCandidate()` | `erstelleProduktionsplanFuerKandidat()` |
| `storageFor()` | `liesDauerhaftenSpeicher()` |
| `serverHourKey()` | `erzeugeServerZeitfensterSchluessel()` |
| `ensure()` | `liesOderErzeugeFarmLernZustand()` |
| `loadHistory()` | `ladeFarmgebietHistorie()` |
| `persistHistory()` | `speichereFarmgebietHistorie()` |
| `updateHistory()` | `erfasseFarmgebietBewertung()` |
| `empiricalBonus()` | `berechneGelerntenFarmgebietBonus()` |
| `rank()` | `bewerteUndOrdneFarmziele()` |
| `_selectPlan()` | `waehleGruppenLebenszyklusPlan()` |
| `reconcile()` | `gleicheUnterbrochenenGruppenWechselAb()` |
| `_merge()` | `fuehreCharakterBeobachtungZusammen()` |

Diese Tabelle ist eine Richtungsvorgabe. Beim tatsaechlichen V4-Umbau gewinnt immer der fachlich praeziseste Name.

---

## 15. Ereignisse benoetigen fachliche Namen

Ereignisse beschreiben, **was fachlich passiert ist**, nicht welche Funktion gerade ausgefuehrt wurde.

Schlecht:

```text
UPDATE_DONE
HANDLER_FAILED
PROCESS_RETRY
STEP_3
```

Gut:

```text
FARMZIEL_GEAENDERT
GRUPPENWECHSEL_ABGEBROCHEN
MERCHANT_BANKWEG_BLOCKIERT
KAMPF_RUECKZUG_AUSGELOEST
LERNMODELL_GESPEICHERT
```

Ereignisnamen sind stabiler Bestandteil unserer Diagnose- und Lerndaten. Sie duerfen nicht leichtfertig umbenannt oder fuer mehrere Bedeutungen wiederverwendet werden.

---

## 16. Regel fuer Warnungen und Fehler

Eine Meldung beantwortet immer diese Fragen:

1. **Was ist passiert?**
2. **Warum ist es passiert?**
3. **Was hat der Bot getan?**
4. **Muss ich etwas tun?**
5. **Was soll ich tun?**

Beispiel:

```text
[WARNUNG] BEWEGUNG_BLOCKIERT – Merchant erreicht die Bank nicht

Was ist passiert: Der Merchant hat sich seit 30 Sekunden nicht zur Bank bewegt.
Warum: Die aktuelle Route hat keinen Fortschritt gemacht.
Bot-Reaktion: Die Bewegung wurde gestoppt. In 5 Sekunden wird eine neue Route versucht.
Nutzer muss handeln: NEIN
Was soll ich tun: Nichts. Nur eingreifen, wenn diese Warnung wiederholt erscheint.
```

Eine Meldung wie `NAV_STALL_RETRY_3` allein ist in V4 verboten.

---

## 17. Meldungsstufen

- `hinweis` – normale, hilfreiche Information
- `warnung` – etwas Ungewoehnliches ist passiert, der Bot kann aber weiterarbeiten oder hat sich erholt
- `fehler` – eine Aufgabe ist fehlgeschlagen und normale Arbeit ist beeintraechtigt
- `kritisch` – Sicherheit, Datenintegritaet oder autonomer Weiterbetrieb kann nicht garantiert werden

Die Stufe beschreibt die **Auswirkung**, nicht die Ueberraschung des Entwicklers.

---

## 18. Namen fuer Fehlergruende

Maschinenlesbare Gruende werden ebenfalls deutsch und eindeutig formuliert.

Beispiele:

```text
NICHT_GENUG_GOLD
ZIEL_NICHT_ERREICHBAR
GRUPPENZUSTAND_UNVOLLSTAENDIG
MATERIAL_MUSS_GEFARMT_WERDEN
SICHERHEITSGRENZE_UEBERSCHRITTEN
NEUSTART_ZUSTAND_MEHRDEUTIG
```

Nicht verwenden:

```text
ERR_12
FAIL_A
BAD_STATE
UNKNOWN_2
```

`UNBEKANNT` ist nur erlaubt, wenn der Zustand tatsaechlich unbekannt ist und die fehlende Information ebenfalls protokolliert wird.

---

## 19. Regeln fuer lernende Komponenten

Da V4 langfristig selbstlernend arbeiten soll, muessen Namen besonders klar zwischen Messung, Speicherung und Lernen unterscheiden.

```ts
beobachteFarmgebiet()
erfasseFarmgebietMessung()
berechneFarmgebietLeistung()
speichereFarmgebietHistorie()
lerneAusFarmgebietErgebnis()
```

Nicht alles darf `lernen` heissen.

Ein Lernvorgang muss mindestens eines davon veraendern:

- dauerhaftes Wissen,
- Modellparameter,
- Bewertungsgewichte,
- bekannte Muster,
- zukuenftige Entscheidungsgrundlagen.

Nur dann ist das Verb `lerne...` gerechtfertigt.

---

## 20. Review-Regel fuer jeden neuen Namen

Vor dem Zusammenfuehren neuen V4-Codes werden folgende Fragen beantwortet:

1. Ist der Name deutsch, sofern er von uns kontrolliert wird?
2. Ist er ohne die Implementierung verstaendlich?
3. Beschreibt das Verb die tatsaechliche Wirkung?
4. Ist klar, ob die Funktion nur liest, entscheidet, plant oder wirklich handelt?
5. Vermeidet der Name unnoetige Abkuerzungen?
6. Vermeidet er Versions-, Alpha-, Hotfix- oder Marketingbegriffe?
7. Verwendet er denselben Fachbegriff wie der Rest von V4?
8. Ist ein Wahrheitswert als Frage formuliert?
9. Ist eine Sammlung im Plural benannt?
10. Ist ein externer Adventure-Land-Rohname auf die Systemgrenze beschraenkt?

Wenn eine dieser Fragen mit `NEIN` beantwortet wird, muss der Name vor dem Merge erneut geprueft werden.

---

## 21. Leitbild

Eine zentrale V4-Datei soll sich in ihren Funktionsaufrufen fast wie eine Beschreibung des Bot-Verhaltens lesen lassen.

Beispiel:

```ts
const spielZustand = weltBeobachter.beobachteSpielZustand();
const gefahr = kampfBeurteiler.beurteileKampfSituation(spielZustand);

if (kampfRegeln.sollSichZurueckziehen(gefahr)) {
  const rueckzugsPlan = kampfPlaner.planeSicherenRueckzug(spielZustand);

  if (aktionsBerechtigung.kannRueckzugsPlanAusfuehren(rueckzugsPlan)) {
    await kampfAusfuehrer.fuehreRueckzugsPlanAus(rueckzugsPlan);
  }
}
```

Der Leser soll erkennen koennen:

```text
Was wurde beobachtet?
Was wurde beurteilt?
Welche Entscheidung wurde getroffen?
Was wurde geplant?
Was durfte ausgefuehrt werden?
Was wurde tatsaechlich ausgefuehrt?
```

Genau diese Lesbarkeit ist fuer V4 verbindlich.

**Git speichert unsere Versionsgeschichte. Der Quellcode beschreibt den aktuellen fachlichen Zustand.**
