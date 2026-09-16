# Nutzerauftraege

V4 soll dem Nutzer erlauben, konkrete Ziele vorzugeben, zum Beispiel:

- `Sammle 200 Bienenfluegel.`
- `Stelle 5 Exemplare von Gegenstand X her.`

Freitext ist dabei ausschliesslich eine Eingabehilfe. Er wird niemals direkt ausgefuehrt. V4 wandelt die Eingabe zuerst in einen strukturierten `NutzerAuftrag` um und zeigt den erkannten Auftrag vor dem Start verstaendlich an.

## Grundregel

`Nutzereingabe -> AuftragsVorschlaege -> strukturierter NutzerAuftrag -> AuftragsPruefung -> AuftragsPlan -> BedienSicherung -> Planung -> AktionsAnfragen`

Ein Nutzerauftrag kann keine Sicherheitsregel, RessourcenSperre, Dienstgrenze oder Schutzregel der Spiellogik umgehen.

## Vorschlaege beim Tippen

Das Eingabefeld `Was soll V4 erledigen?` zeigt bereits waehrend der Eingabe passende, aktuell verfuegbare Auftragsvorschlaege.

Beispiele:

- Eingabe `sam` -> Vorschlag `Sammeln`
- Eingabe `her` -> Vorschlag `Herstellen`
- Eingabe `bee` -> passende bekannte Gegenstaende wie `Bienenfluegel`
- Eingabe `Sammle 200 b` -> bekannte Gegenstaende mit passendem Namen oder Suchwort

Ein `AuftragsVorschlag` enthaelt mindestens:

- einen verstaendlichen Anzeigetext
- den Text, der in das Eingabefeld uebernommen werden kann
- eine kurze Erklaerung
- passende Suchwoerter
- optional die erkannte Auftragsart
- optional die eindeutige Gegenstandskennung

Die Vorschlagsliste zeigt nur Funktionen und Gegenstaende, die V4 aktuell kennt. Ein nicht unterstuetzter Text darf keinen scheinbar gueltigen Vorschlag erzeugen.

Die Vorschau ist nur eine Eingabehilfe. Das Anklicken eines Vorschlags startet niemals direkt einen Auftrag. Zuerst wird die strukturierte Auftragsmaske ausgefuellt und danach der Auftragsplan geprueft.

Die Vorschlagsliste ist eine feste Bedienfunktion von V4 und kein optionaler Komfortzusatz. Neue Auftragsarten sollen erst dann in der Vorschau erscheinen, wenn ihre Vertrage, Pruefungen und benoetigte Spiellogik vorhanden sind.

## Eindeutige Mengen

Die Eingabe `Sammle 200 Bienenfluegel` ist ohne weitere Festlegung mehrdeutig. Deshalb muss V4 vor dem Start eindeutig zwischen zwei Zielarten unterscheiden:

- `zusaetzlich`: Es sollen 200 weitere Gegenstaende beschafft werden, unabhaengig vom aktuellen Bestand.
- `gesamtbestand`: Der Bestand soll auf insgesamt 200 erhoeht werden.

Die Web-Oberflaeche darf diese Entscheidung nicht verstecken oder erraten.

## Auftragsarten

Die erste Ausbaustufe kennt zwei Auftragsarten:

### Sammeln

V4 beschafft eine definierte Menge eines eindeutig bekannten Gegenstands durch die dafuer erlaubten Spielfunktionen. Der Auftrag endet, sobald die vereinbarte Zielmenge erreicht ist.

### Herstellen

V4 erstellt einen Herstellungsplan aus dem bekannten Spielwissen. Der Plan muss vor dem Start mindestens zeigen:

- welches Ergebnis hergestellt werden soll
- welche Menge hergestellt werden soll
- welche Zutaten benoetigt werden
- welche Zutaten bereits vorhanden sind
- welche Zutaten noch fehlen
- welche Teilaufgaben dafuer entstehen
- welche Gegenstaende dabei verbraucht werden
- ob Gold oder andere begrenzte Mittel benoetigt werden
- ob der Auftrag aktuell vollstaendig planbar ist

Unbekannte Rezepte, unbekannte Zutaten oder nicht sicher pruefbare Voraussetzungen fuehren zu `blockiert` statt zu geratenen Aktionen.

## Auftragsplan

Vor dem Start eines veraendernden Auftrags erzeugt V4 einen `AuftragsPlan`. Er zeigt in normalem Deutsch:

- Was soll erreicht werden?
- Was ist bereits vorhanden?
- Was fehlt noch?
- Welche Charaktere sollen daran arbeiten?
- Welche Teilaufgaben sind geplant?
- Was wird verbraucht?
- Gibt es Warnungen oder Risiken?
- Kann der Auftrag jetzt sicher gestartet werden?

Ein Auftrag mit fehlender Erklaerung darf nicht gestartet werden.

## Zustaende

Ein Auftrag besitzt genau einen der folgenden Zustaende:

- `entwurf`
- `geprueft`
- `bereit`
- `laeuft`
- `pausiert`
- `blockiert`
- `erledigt`
- `abgebrochen`
- `fehlgeschlagen`

Jeder Zustandswechsel wird als strukturiertes Ereignis aufgezeichnet.

## Bedienung

Die Web-Oberflaeche soll spaeter mindestens anbieten:

- `Neuen Auftrag erstellen`
- Eingabefeld `Was soll V4 erledigen?`
- Vorschlaege waehrend der Eingabe
- `Sammeln`
- `Herstellen`
- Gegenstand ueber bekannte Gegenstandsliste auswaehlen
- Menge festlegen
- `zusaetzlich` oder `gesamtbestand` eindeutig auswaehlen
- Plan pruefen
- Auftrag starten
- Auftrag pausieren
- Auftrag fortsetzen
- Auftrag abbrechen

Das Ergebnis einer Freitexteingabe wird immer in die strukturierte Auftragsmaske uebernommen und sichtbar bestaetigt.

## Vorrang und Sicherheit

Nutzerauftraege besitzen niemals Vorrang vor:

1. Notfalllogik
2. Kampfsicherheit
3. Gegenstandsschutz
4. RessourcenSperren
5. Dienstgrenzen
6. technischen Schutzregeln

Ein Auftrag darf warten oder pausieren, wenn seine sichere Ausfuehrung gerade nicht moeglich ist.

## Schutz wichtiger Gegenstaende

Ein Herstellungsauftrag darf geschuetzte, reservierte oder anderweitig benoetigte Gegenstaende nicht stillschweigend verbrauchen. Ist ein solcher Verbrauch notwendig, muss der Auftrag blockiert werden, bis eine ausdrueckliche und verstaendliche Freigabe vorliegt.

## Nachvollziehbarkeit

Fuer jeden Auftrag werden mindestens gespeichert:

- Auftrag und erkannte Nutzereingabe
- erstellter Plan
- Start- und Endzeit
- Zustandswechsel
- Fortschritt
- ausgefuehrte Teilaufgaben
- aufgetretene Vorfaelle
- verbrauchte Gegenstaende und Mittel
- Abschlussgrund

Der Tagesbericht kann dadurch spaeter beispielsweise ausgeben:

`Auftrag Bienenfluegel: 200 / 200 erreicht, erfolgreich abgeschlossen.`

oder:

`Herstellungsauftrag Gegenstand X: blockiert, weil 3 Zutaten fehlen. Nutzer muss handeln: NEIN. V4 sammelt die fehlenden Zutaten zuerst.`

## Unverhandelbare Regeln

- Kein Freitext wird direkt ausgefuehrt.
- Kein Vorschlag startet direkt eine veraendernde Aktion.
- Kein unbekannter Befehl wird als verfuegbar dargestellt.
- Kein unbekannter Gegenstand wird geraten.
- Keine mehrdeutige Menge wird stillschweigend interpretiert.
- Kein Auftrag umgeht die BedienSicherung.
- Kein Auftrag umgeht die zentrale Aktionssteuerung.
- Kein Auftrag umgeht Sicherheits- oder Dienstgrenzen.
- Kein geschuetzter Gegenstand wird stillschweigend verbraucht.
