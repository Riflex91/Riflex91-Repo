# V4 Testplan

## Allgemeine Bedienregel fuer zeitlich begrenzte Live-Tests

Jeder zeitlich begrenzte Live-Test mit V4-Testkonsole zeigt waehrend des Laufs eine sichtbare Restzeit in der Titelleiste der GUI. Der Countdown wird mindestens sekundenweise aktualisiert und darf den eigentlichen Testablauf nicht beeinflussen. Nach Abschluss oder manuellem Stopp zeigt die Titelleiste einen eindeutigen Endzustand.

## Dokumentierter Block-7-Abschluss

Block 7 – Kampfsicherheit und Rueckzug – ist am 17. September 2026 technisch abgeschlossen worden. Der Abschluss beruht auf der Kombination aus:

- bestandenem 10-Minuten-Read-only-Schattenlauf mit 601/601 Schritten, 100 % Sampling-Abdeckung, maximal 1016 ms Tick-Luecke, 0 Fehlern, 0 Stillstaenden und 0 echten Spielaktionen,
- realer Adventure-Land-Angriffsbereitschaft mit 601/601 bekannten `bereit`-Beobachtungen,
- gruener integrierter Produktionscode-Abnahmesuite `block7-abnahme.test.mjs`,
- bestandenem one-shot Adventure-Land-Live-Smoke-Test mit exakt einem `move`, 0 sonstigen Spielaktionen, 8 Einheiten beobachteter Sicherheitsbewegung und automatischer Wiedersperrung.

Der detaillierte Nachweis steht in `BLOCK-7-ABSCHLUSS.md`.

Dieser Block-7-Abschluss ersetzt **nicht** die allgemeinen spaeteren V4-Systemtests. Insbesondere bleiben der 24-Stunden-Schattenbetrieb, aktive Einzelcharakter- und Gruppenlaeufe sowie der 7-Tage-Dauertest eigenstaendige Freigabestufen.

## Stufe 1 – statische Pruefung

- TypeScript streng
- deutsche Namenspruefung
- Struktur- und Geheimnispruefung
- `KontingentWaechter`, `DienstProfil` und Dienstgrenzen sind Pflichtbestandteile
- `BedienSicherung`, `BedienAnfrage` und Bedienregeln sind Pflichtbestandteile
- `NutzerAuftrag`, `AuftragsPruefung` und Auftragsvorschlaege sind Pflichtbestandteile
- `SpeicherLernZyklus` und sein Datenvertrag sind Pflichtbestandteile
- spaeter Abhaengigkeitsgrenzen, die direkte externe Dienstaufrufe ausserhalb des Dienst-Tores verhindern

## Stufe 2 – Einheitstests

Jeder Kernbaustein wird isoliert getestet. Fehlertexte und Grenzfaelle gehoeren zum Vertrag.

Fuer den Tagesbericht werden insbesondere Zeitraum, Aggregation, Vergleichswerte, Handlungsangabe und eindeutige Berichtskennung getestet.

Fuer externe Dienste werden mindestens getestet:

- kein DienstProfil -> blockiert
- abgelaufenes DienstProfil -> blockiert
- unbekannter Maximalverbrauch -> blockiert
- fehlendes Zeitfenster -> blockiert
- Sicherheitspuffer kann nicht verbraucht werden
- hoeherer Anbieter-Verbrauch gewinnt gegen niedrigeren lokalen Wert
- mehrere gleichzeitig benoetigte Kontingente werden gemeinsam oder gar nicht reserviert

Fuer den Speicher-Lern-Zyklus werden mindestens getestet:

- unter der Vorbereitungsgrenze wird nur gesammelt
- ab der Vorbereitungsgrenze wird ein Lerndatensatz angefordert
- ein Lernlauf startet erst mit bestaetigtem Datensatz
- Rohdatenfreigabe bleibt gesperrt, solange Datensatzbildung, Lernen, Evaluation oder dauerhafte Wissensspeicherung nicht bestaetigt sind
- nur bereits verarbeitete loeschbare Rohdaten werden freigegeben
- in der Notfallstufe wird Datenerfassung reduziert statt unverarbeitete Daten automatisch zu loeschen
- nach erfolgreichem Zyklus wird nur bis zum festgelegten sicheren Zielstand freigegeben

Fuer die Bedienung werden mindestens getestet:

- unkritische Aktion mit erfuellten Voraussetzungen -> erlaubt
- fehlende Voraussetzung -> blockiert mit konkreter Hilfe
- vorsichtige Aktion ohne ausdrueckliche Bestaetigung -> blockiert
- kritische Aktion ohne exakten Bestaetigungstext -> blockiert
- unvollstaendig erklaerte Aktion -> blockiert
- doppelte Vorgangskennung fuehrt spaeter nicht zu doppelter Ausfuehrung
- veraltete Konfigurationsversion darf keine neuere Einstellung ueberschreiben

Fuer Nutzerauftraege werden mindestens getestet:

- gueltiger Sammelauftrag wird angenommen
- unbekannter Gegenstand wird blockiert
- Zielmenge muss eine positive ganze Zahl sein
- `zusaetzlich` und `gesamtbestand` bleiben eindeutig getrennt
- Freitext wird niemals direkt ausgefuehrt
- bekannte Auftragsarten werden beim Tippen vorgeschlagen
- bekannte Gegenstaende werden ueber Namen und Suchwoerter vorgeschlagen
- unbekannte Eingaben erzeugen keinen scheinbar gueltigen Vorschlag
- ein Vorschlag startet niemals direkt eine veraendernde Aktion

## Stufe 3 – Eigenschaftstests

Kerninvarianten werden mit vielen automatisch erzeugten Eingaben geprueft, insbesondere Ressourcenbesitz, Prioritaeten und deterministische Auswahl.

Fuer Kontingente gilt zusaetzlich: Keine automatisch erzeugte Folge erlaubter Reservierungen darf das um den Sicherheitspuffer reduzierte V4-Budget ueberschreiten.

Fuer den Speicher-Lern-Zyklus gilt zusaetzlich: Keine Kombination aus Speicherauslastung und unvollstaendigen Lernnachweisen darf eine positive automatische Rohdatenfreigabe erzeugen.

Fuer BedienAnfragen gilt: Keine Kombination fehlender Voraussetzungen oder fehlender Bestaetigungen darf zu einer erlaubten kritischen Aktion fuehren.

Fuer Nutzerauftraege gilt: Kein automatisch erzeugter ungueltiger Auftrag darf vor erfolgreicher AuftragsPruefung und BedienSicherung eine veraendernde AktionsAnfrage ausloesen.

Fuer Berichte gilt zusaetzlich: derselbe Datenbestand und derselbe Zeitraum muessen denselben Bericht ergeben; Ereignisse ausserhalb des 24-Stunden-Zeitraums duerfen nicht einfliessen.

## Stufe 4 – Wiederholungstests

Echte historische Situationen werden offline gegen neue Versionen abgespielt. Unterschiede werden automatisch ausgewiesen.

Mehrcharakter-Wiederholungen muessen die beteiligten Charaktere eindeutig unterscheiden, damit Zustandsdaten nicht vermischt werden.

Historische Daten muessen auch zur reproduzierbaren Erzeugung eines Tagesberichts verwendet werden koennen.

Kontingententscheidungen werden mit gespeicherten Anbieter- und lokalen Verbrauchsstaenden reproduzierbar wiederholt.

Auftragsplaene muessen bei gleichem Spielzustand dieselben vorhandenen und noch benoetigten Mengen sowie dieselben blockierenden Voraussetzungen ergeben.

Goldene Wiederholungen muessen auch nach mehreren erfolgreichen Speicher-Lern-Zyklen weiterhin vorhanden und reproduzierbar sein.

## Stufe 5 – Fehler-Einspritzung

Netzwerkausfall, langsame Antworten, fehlende Spielwerte, Zeitueberschreitungen, Neustarts, teilweise Daten und verspaetete Gruppenmeldungen werden absichtlich erzeugt.

Fuer externe Dienste werden zusaetzlich getestet:

- Anbieter-Verbrauchswerte kommen verspaetet
- Anbieterwert springt unerwartet nach oben
- Anbietergrenze aendert sich
- DienstProfil laeuft waehrend des Betriebs ab
- HTTP 429, 402 und Dienstfehler
- Wiederholungsversuche verursachen keine Anfrageflut
- lokaler Puffer erreicht Eintrags-, Byte- und Altersgrenze
- Dienst ist komplett nicht erreichbar
- lokale Spiellsicherheit arbeitet trotzdem weiter

Fuer Objektspeicher und Lernzyklus werden zusaetzlich getestet:

- Upload bricht waehrend eines Segments ab
- Multipart-Uebertragung bleibt unvollstaendig
- Objektspeicher ist komplett nicht erreichbar
- lokaler Puffer erreicht seine harte Byte-Grenze
- Speicher erreicht Vorbereitungs-, Lern-, Bereinigungs- und Notfallstufe
- Lernlauf schlaegt fehl
- Evaluation schlaegt fehl
- Wissen kann nach erfolgreichem Lernen nicht dauerhaft gespeichert werden
- Neustart erfolgt zwischen Lernen und Bereinigung
- kein Fehlerfall gibt unverarbeitete Rohdaten zur automatischen Loeschung frei

Fuer die Bedienung werden zusaetzlich getestet:

- Doppelklick auf eine veraendernde Aktion
- Browser-Neuladen waehrend einer Aktion
- dieselbe Anfrage wird durch das Netzwerk wiederholt
- zwei Browseransichten bearbeiten dieselbe Einstellung
- zweite Ansicht ist veraltet und wird blockiert
- Nutzer gibt Minimal-, Maximal- und ungueltige Zahlenwerte ein
- kritische Aktion wird abgebrochen
- kritische Aktion wird mit falschem Bestaetigungstext versucht
- Speichern wird waehrend des Vorgangs unterbrochen
- Rueckfall auf die vorherige gueltige Konfiguration funktioniert

Fuer Nutzerauftraege werden zusaetzlich getestet:

- ein Gegenstand wird waehrend der Planung unbekannt oder nicht mehr verfuegbar
- Zutaten eines Herstellungsauftrags sind unvollstaendig
- ein geschuetzter Gegenstand waere fuer Herstellung erforderlich
- Auftrag wird waehrend einer Teilaufgabe pausiert
- Neustart waehrend eines laufenden Auftrags
- Doppelklick auf `Auftrag starten`
- veraltete Browseransicht versucht einen bereits geaenderten Auftrag erneut zu starten
- ein zuvor angezeigter Vorschlag ist zum Startzeitpunkt nicht mehr verfuegbar

Fuer den Tagesbericht werden zusaetzlich getestet:

- Neustart waehrend des 24-Stunden-Zeitraums
- Neustart unmittelbar vor dem Versand
- Serverausfall beim Erstellen des Berichts
- E-Mail-Ausfall beim Versand
- erneuter Versandversuch ohne doppelten Bericht
- fehlende Messwerte werden als fehlend behandelt und nicht als Null erfunden
- Zeitumstellung veraendert nicht die ausgewertete Dauer von exakt 24 Stunden

## Stufe 6 – Adventure-Land-Schattenbetrieb

Mindestens 24 Stunden ohne echte Aktionen. Entscheidungen werden nur beobachtet und mit der laufenden Produktionslogik verglichen.

Nach dem ersten vollstaendigen 24-Stunden-Schattenlauf muss aus den aufgezeichneten Daten ein gueltiger Tagesbericht erzeugt werden koennen.

Auch bei simuliert blockierten Cloudflare-, Supabase- oder Objektspeicher-Kontingenten muss die lokale Sicherheitslogik ununterbrochen weiterarbeiten.

Nutzerauftraege werden im Schattenbetrieb bis zu den geplanten AktionsAnfragen durchgespielt, ohne echte Spielaktionen auszufuehren.

## Stufe 7 – kontrollierter Aktivbetrieb

Zuerst ein einzelner Charakter, danach mehrere eigene Charaktere als Gruppe, danach Haendler und Wirtschaft. Jede Erweiterung besitzt eine ausdrueckliche Rueckfallmoeglichkeit.

Die Gruppenpruefung umfasst mindestens:

- gemeinsames Ziel
- Ausfall eines Gruppenmitglieds
- Wiederaufbau der Gruppe
- sichere Gegenstandsuebergabe
- veraltete Gruppendaten werden verworfen

Der Tagesbericht muss die aktiven Charaktere getrennt ausweisen und gemeinsame Vorfaelle nachvollziehbar zusammenfassen.

Vor dem ersten aktiven Lauf wird die gefuehrte Startpruefung mit absichtlich fehlenden und fehlerhaften Einstellungen durchgespielt. Der Bot darf erst freigegeben werden, wenn alle blockierenden Voraussetzungen erfuellt sind.

Sammel- und Herstellungsauftraege werden erst aktiv freigegeben, wenn die jeweils benoetigte Spiellogik separat bestanden hat.

## Stufe 8 – Dauertest

Vor einer Produktionsabloesung: sieben Tage 24/7 mit Neustart-, Update-, Netz- und Plattformausfalltests.

Waehrend des Dauertests muss an jedem geplanten Versandtag genau ein automatischer Tagesbericht entstehen. Fehlgeschlagene Zustellungen duerfen nachgeholt werden, ohne Berichte doppelt zu erzeugen.

Zusaetzliche Abnahmebedingungen:

- kein externes sicheres V4-Budget wurde ueberschritten
- kein Anbieter-Sicherheitspuffer wurde von normaler Arbeit verbraucht
- keine lokale Warteschlange ist unbegrenzt gewachsen
- kein Objektspeicher-Ausfall hat die lokale Spielsicherheit blockiert
- keine unverarbeiteten Rohdaten wurden allein wegen Speicherknappheit automatisch geloescht
- keine kritische Bedienaktion wurde ohne vorgesehene Freigabe ausgefuehrt
- kein Doppelklick oder Netzwerk-Wiederholungsversuch fuehrte zu doppelter Ausfuehrung
- kein Freitext oder Auftragsvorschlag wurde direkt als Spielaktion ausgefuehrt
- laufende Nutzerauftraege ueberstehen Neustarts oder wechseln eindeutig in einen sicheren pausierten beziehungsweise blockierten Zustand
- jede nutzersichtbare Stoerung enthielt Ursache, Bot-Reaktion, Handlungsbedarf und naechsten Schritt
