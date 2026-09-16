# V4 Fahrplan

V4 wird in mittelgrossen, klar abgegrenzten Entwicklungsbloecken aufgebaut. Jeder Block liefert eine zusammenhaengende Faehigkeit vollstaendig: Quellcode, verstaendliche Meldungen, Diagnoseinformationen und passende Pruefungen.

Die Schritte sind bewusst groesser als bei V3. Gleichzeitig darf ein Block nicht mehrere voneinander unabhaengige Hauptbereiche vermischen. Dadurch bleibt nach einer Pruefung klar, welcher Block einen Fehler eingefuehrt haben kann.

## Grundregel fuer die Groesse eines Entwicklungsblocks

Ein Entwicklungsblock ist richtig geschnitten, wenn:

- er eine in sich nutzbare oder pruefbare Faehigkeit liefert
- direkt benoetigte Teile gemeinsam gebaut werden statt als Kleinstaenderungen
- Diagnose, Meldungen und Tests zum selben Block gehoeren
- normalerweise nur ein Hauptbereich oder eng gekoppelter Unterbau geaendert wird
- ein fehlgeschlagener Test auf diesen Block eingegrenzt werden kann
- der naechste Block erst beginnt, wenn der aktuelle wieder vollstaendig gruen ist

Nicht gewuenscht sind einzelne Hilfsfunktionen als eigener Entwicklungsschritt, wenn sie allein keinen Nutzen haben. Ebenfalls nicht gewuenscht sind Riesenbloecke, die Gruppe, Handel, Lernen und Web-Oberflaeche gleichzeitig veraendern.

## Fehlerregel zwischen zwei Bloecken

Nach jedem Entwicklungsblock gilt:

1. Typpruefung und Namenspruefung ausfuehren.
2. Einheitstests des geaenderten Bereichs ausfuehren.
3. alle bestehenden Kernpruefungen ausfuehren.
4. sobald Wiederholungsdaten vorhanden sind, den passenden Wiederholungssatz ausfuehren.
5. bei Laufzeitfunktionen einen begrenzten Adventure-Land-Test durchfuehren.
6. auftretende Fehler innerhalb dieses Blocks beheben.
7. erst danach den naechsten Block beginnen.

Fehlerbehebungen duerfen den Umfang eines Blocks nicht nebenbei auf einen neuen Funktionsbereich erweitern. Wird ein groesseres neues Problem entdeckt, erhaelt es einen eigenen spaeteren Block.

# Entwicklungsbloecke

## Block 1 – Grundlage und gemeinsame Regeln

Ziel: Verstaendliche, testbare Grundbausteine ohne Spiellogik.

Gemeinsam umgesetzt werden:

- deutsche Namensregeln
- `EreignisZentrale`
- `AktionsAnfrage` und `AktionsAuswahl`
- `RessourcenVergabe`
- `Spielzustand`
- `BotMeldung`
- `TagesBericht` und `TagesBerichtEinstellung` als feste Datenvertraege
- feste Schemata
- eigene V4-Pruefung in GitHub

Abschlusspruefung:

- Typpruefung
- Einheitstests
- Namenspruefung
- Strukturpruefung
- alle Tagesbericht-Schemata sind gueltig und versioniert

## Block 2 – Adventure-Land-Lesezugriff und Spielzustand

Ziel: Das Spiel vollstaendig beobachten koennen, ohne eine aktive Spielaktion auszufuehren.

Gemeinsam umgesetzt werden:

- eine einzige Schnittstelle zu Adventure-Land-Daten
- unveraenderliche Spielzustaende
- Charakter, Monster, Gruppe, Inventar, Karte und wichtige Spielwerte
- beobachtetes, abgeleitetes und gelerntes Wissen getrennt halten
- unbekannte und fehlende Werte ausdruecklich kennzeichnen
- Aufzeichnung von Spielzustaenden fuer spaetere Tests

Abschlusspruefung:

- gleiche Eingangsdaten erzeugen gleiche Spielzustaende
- fehlende Werte fuehren nicht zu erfundenen Annahmen
- aufgezeichnete Spielzustaende koennen offline geladen werden
- mehrstuendiger Beobachtungstest ohne aktive Spielaktion

## Block 3 – Zentrale Aktionssteuerung und Ressourcensperren

Ziel: Keine Spielfunktion darf eigenmaechtig handeln.

Gemeinsam umgesetzt werden:

- AktionsAnfragen
- Vorrangstufen `notfall`, `sicherheit`, `normal`, `hintergrund`
- exklusive Sperren fuer Bewegung, Inventar, Bank, Handel, Kampfziel, Gruppe und Ausruestung
- Unterbrechung niedrigerer Arbeit durch wichtigere Arbeit
- Abbruch laufender Arbeit
- Schattenausfuehrung ohne echte Spielaktion

Abschlusspruefung:

- konkurrierende Funktionen koennen keine Ressource gleichzeitig besitzen
- teilweise Ressourcenvergabe ist ausgeschlossen
- Notfallarbeit kann normale Arbeit sicher unterbrechen
- Schattenbetrieb zeigt geplante Aktionen nachvollziehbar an

## Block 4 – Telemetrie, Flugschreiber und Vorfallerkennung

Ziel: Ein Lauf muss sich spaeter erklaeren und ueber beliebige 24-Stunden-Zeitraeume auswerten lassen.

Gemeinsam umgesetzt werden:

- strukturierte BotEreignisse
- fortlaufende Entscheidungs- und Aktionsspuren
- Ringpuffer fuer die letzten Minuten
- dauerhafte, zeitgestempelte Leistungsdaten fuer Erfahrung, Gold, Laufzeit, Tode, Rueckzuege, Verbindungsabbrueche und Neustarts
- Daten so speichern, dass Neustarts den spaeteren 24-Stunden-Bericht nicht unterbrechen
- erkennbare Stillstaende, Schleifen, Zeitueberschreitungen und unerwartete Zustandswechsel
- Vorfallpakete mit relevanten Daten vor und nach einem Fehler
- klare BotMeldungen fuer jeden erkannten Vorfall

Abschlusspruefung:

- absichtlich erzeugter Stillstand wird erkannt
- die Meldung erklaert Ursache, Bot-Reaktion und Nutzeraktion
- ein Vorfallpaket enthaelt alle benoetigten Daten zur Untersuchung
- zeitgestempelte Leistungsdaten lassen sich ueber einen frei gewaehlten 24-Stunden-Zeitraum korrekt zusammenfassen
- ein Neustart erzeugt keine Luecke oder doppelte Zaehlerwerte

## Block 5 – Wiederholungsmaschine und Vorher-Nachher-Vergleich

Ziel: Echte Fehler muessen ohne laufendes Adventure Land nachstellbar werden.

Gemeinsam umgesetzt werden:

- Laden aufgezeichneter Spielzustaende und Ereignisse
- deterministische Wiederholung
- Mehrcharakter-Wiederholung
- Vergleich zweier V4-Staende mit denselben Eingangsdaten
- Erkennung geaenderter Entscheidungen
- Kennzeichnung von Verbesserungen, Verschlechterungen und Sicherheitsverletzungen

Abschlusspruefung:

- der in Block 4 erzeugte Teststillstand wird offline reproduziert
- eine Korrektur kann mit denselben Eingangsdaten vorher und nachher verglichen werden
- wiederholte Laeufe liefern dasselbe Ergebnis
- historische Daten koennen fuer spaetere Tagesberichte reproduzierbar ausgewertet werden

## Block 6 – Grundlegendes Farmen als erste vollstaendige Spielfunktion

Ziel: Ein einzelner Charakter kann einen einfachen Farmablauf vollstaendig ausfuehren.

Gemeinsam umgesetzt werden:

- Zielauswahl
- Bewegung zum Ziel
- normaler Angriff
- Lebens- und Manawiederherstellung
- Beuteaufnahme
- einfache Inventarbehandlung
- Erfahrung und Gold pro Zeit
- verstaendliche Meldungen fuer Stillstand und fehlende Voraussetzungen

Abschlusspruefung:

- Wiederholungstests fuer alle Teilablaeufe
- 24 Stunden Schattenbetrieb ohne ungefangenen Fehler
- danach begrenzter aktiver Einzelcharakter-Test
- Leistungswerte sind fuer Tagesberichte nutzbar

## Block 7 – Kampfsicherheit und Rueckzug

Ziel: Sicherheit hat immer Vorrang vor Leistung.

Gemeinsam umgesetzt werden:

- Gefahrenbewertung
- Rueckzug
- Reichweitenpruefung
- Abklingzeiten
- Ausweichen und Abstandhalten
- Schutz vor aussichtslosen Angriffen
- Notfallvorrang gegenueber normalen Aktionen

Abschlusspruefung:

- absichtlich erzeugte Gefahrensituationen werden sicher behandelt
- keine normale Aktion blockiert einen Rueckzug
- Fehler-Einspritztests fuer niedrige Lebenspunkte, fehlendes Mana, falsche Reichweite und blockierte Bewegung

## Block 8 – Gruppenkoordination

Ziel: Mehrere eigene Charaktere arbeiten als Gruppe zusammen.

Gemeinsam umgesetzt werden:

- Faehigkeiten statt hart verdrahteter Rollen
- Heilen, Schaden, Aggro, Schutz und Unterstuetzung
- Gruppenrollen aus aktuellen Faehigkeiten ableiten
- gemeinsames Ziel und gemeinsame Sicherheitslage
- Spielwelt-, Server- und Gruppenabgleich
- Lebensnachweise und Ablauf veralteter Teilnehmerdaten
- Wiederverbindung und Gruppenwiederaufbau
- Aufgaben neu verteilen, wenn ein Charakter ausfaellt

Abschlusspruefung:

- Mehrcharakter-Wiederholungen
- gezielte Ausfalltests einzelner Gruppenmitglieder
- Wiederaufbau nach Verbindungsabbruch
- anschliessender 72-Stunden-Gruppentest

## Block 9 – Haendlerdienste und Bank

Ziel: Gegenstaende koennen nachvollziehbar zwischen Charakteren und Bank bewegt werden.

Gemeinsam umgesetzt werden:

- Dienstauftraege
- Weg zum anfragenden Charakter
- Gegenstaende empfangen und zurueckgeben
- Bankeinlagerung und Bankentnahme
- Gegenstandsreservierungen
- eindeutige Zustandsfolge jedes Dienstauftrags
- Schutz gegen Endlosschleifen und gegenseitige Blockierung

Abschlusspruefung:

- jeder Dienstauftrag besitzt einen nachvollziehbaren Anfang und Abschluss
- Neustarts mitten in einem Dienstauftrag werden getestet
- keine doppelte Besitzannahme eines Gegenstands
- kein rekursiver Dienstablauf

## Block 10 – Handel und Gegenstandsverarbeitung

Ziel: Wirtschaftliche Aktionen werden auf der stabilen Haendler- und Bankgrundlage aufgebaut.

Gemeinsam umgesetzt werden:

- Kaufen
- Verkaufen
- Aufwerten
- Kombinieren
- benoetigte Materialien und Schriftrollen beschaffen
- Schutz wichtiger und reservierter Gegenstaende
- vollstaendige Nachverfolgung jeder wirtschaftlichen Aktion

Abschlusspruefung:

- absichtliche Abbrueche in jeder Verarbeitungsstufe
- Neustarttests
- keine unbeabsichtigte Gegenstandsvernichtung
- frisch beschaffte Arbeitsgegenstaende werden nicht versehentlich wieder eingelagert

## Block 11 – Lernen und kontrollierte Versuche

Ziel: V4 darf aus Erfahrungen besser werden, ohne Sicherheitsgrenzen selbst zu veraendern.

Gemeinsam umgesetzt werden:

- Situation -> Moeglichkeiten -> Entscheidung -> erwartetes Ergebnis -> tatsaechliches Ergebnis
- Erfahrungsablage
- kontrollierte Versuche
- Vergleich bestehender und neuer Strategie
- Mindestmenge an Belegen vor einer Aenderung
- Ruecknahme schlechter Strategien

Abschlusspruefung:

- Lernen kann Auswahl und Gewichtung einer Strategie veraendern
- Lernen kann keine direkte Adventure-Land-Aktion ausfuehren
- Sicherheitsregeln bleiben unveraendert
- gleiche Erfahrungsdaten ergeben nachvollziehbare Entscheidungen

## Block 12 – Web-Oberflaeche, Tagesbericht, Schnittstelle und Archiv

Ziel: Laufzeit, historische Daten, Tagesberichte und Entwicklung werden an einer Stelle sichtbar und koennen sicher zugestellt werden.

Gemeinsam umgesetzt werden:

- Live-Ansicht
- Charakter- und Gruppenstatus
- Vorfaelle
- Wiederholungen
- Versuche
- Entwicklungswarteschlange
- Schnittstelle zwischen Laufzeit und Server
- serverseitiger Archivabgleich per SFTP
- `TagesBerichtErstellung` aus den vergangenen exakt 24 Stunden
- kurze Zusammenfassung mit `Nutzer muss handeln: JA/NEIN`
- Charakterwerte und Gesamtwerte
- wichtige Vorfaelle und automatische Erholung
- Entwicklungsstatus
- Vergleich mit den unmittelbar vorherigen 24 Stunden
- konfigurierbare Versandzeit und Zeitzone
- Speicherung in der Web-Oberflaeche
- optionaler E-Mail-Versand
- Schaltflaeche `Bericht jetzt erstellen`
- eindeutige Berichtskennung und Versandstatus gegen doppelten Versand
- E-Mail-Geheimnisse ausschliesslich serverseitig

Abschlusspruefung:

- Browser und Adventure Land besitzen keinerlei SFTP-Zugangsdaten
- Browser und Adventure Land besitzen keinerlei E-Mail-Versandgeheimnisse
- ein Bericht wertet exakt die vorgesehenen 24 Stunden aus
- Neustarts innerhalb des Zeitraums fuehren weder zu Datenverlust noch Doppelzaehlung
- derselbe automatische Zeitraum erzeugt genau einen Bericht
- Vergleichswerte stammen ausschliesslich aus dem vorherigen 24-Stunden-Zeitraum
- fehlende Daten werden nicht als Null erfunden
- ein E-Mail-Ausfall verliert den Bericht nicht und blockiert die Spiellogik nicht
- fehlgeschlagener Versand kann ohne doppelten Bericht wiederholt werden
- `Bericht jetzt erstellen` funktioniert unabhaengig vom automatischen Versand
- Archivuebertragungen koennen nach Abbruch sauber fortgesetzt werden

## Block 13 – Automatisierter Entwicklungsablauf

Ziel: Wiederkehrende Laufzeitprobleme koennen automatisch fuer die Entwicklung vorbereitet werden.

Gemeinsam umgesetzt werden:

- gleiche Fehler zusammenfassen
- Vorfaelle einer Entwicklungsaufgabe zuordnen
- Belege und Wiederholung verlangen
- passende Tests vorbereiten
- Aenderungszweig und Pull Request vorbereiten
- klare Trennung zwischen Beobachtung, Entwicklung und Freigabe

Abschlusspruefung:

- ein kuenstlich erzeugter Laufzeitfehler kann bis zu einem geprueften Pull Request verfolgt werden
- ohne ausreichende Belege wird keine Codeaenderung vorgeschlagen
- sicherheitsrelevante Spiellogik wird nicht automatisch verschmolzen

## Block 14 – Auslieferung, Aktualisierung und Rueckfall

Ziel: V4 kann sicher aktualisiert und bei einem Fehler auf die letzte funktionierende Fassung zurueckgesetzt werden.

Gemeinsam umgesetzt werden:

- kleiner Startlader
- versionierte Laufzeit
- SHA-256-Pruefung
- zuletzt funktionierende Fassung
- atomare Veroeffentlichung
- Rueckfall bei fehlerhaftem Start
- sichere Wiederaufnahme nach Netzwerk- oder Serverausfall

Abschlusspruefung:

- Update-Test
- absichtlich fehlerhafte neue Fassung
- Netzwerkausfall
- Serverausfall
- Neustart waehrend einer Aktualisierung
- erfolgreicher automatischer Rueckfall auf die letzte funktionierende Fassung

# Abschliessende Freigabekampagne

V4 ersetzt V3 erst nach dieser Reihenfolge:

1. komplette statische und architektonische Pruefung
2. alle Einheitstests
3. Eigenschaftstests fuer Kernregeln
4. gesamter Wiederholungssatz
5. Fehler-Einspritztests fuer Netzwerk, Zeitueberschreitungen und Neustarts
6. 24 Stunden Adventure Land im Schattenbetrieb inklusive erzeugtem Tagesbericht
7. 24 Stunden aktiver Einzelcharakter
8. 72 Stunden aktive Gruppe
9. 72 Stunden Haendler und Wirtschaft
10. mehrere automatische Tagesberichte inklusive mindestens eines simulierten Versandfehlers
11. Update-, Rueckfall- und Serverausfalltest
12. 7 Tage ununterbrochener Dauertest mit genau einem automatischen Bericht pro geplantem Versandtag
13. Vergleich mit der aktuellen Produktionsversion anhand Sicherheit, Stillstaenden, Todesfaellen, Erfahrung pro Stunde und Gold pro Stunde
14. menschliche Entscheidung ueber die Abloesung von V3

# Entscheidungsregel fuer spaetere Planung

Wenn wir uns bei einem neuen Thema fragen, ob es in denselben Entwicklungsblock gehoert, verwenden wir eine einfache Frage:

> Kann ein Fehler in diesem neuen Teil mit hoher Wahrscheinlichkeit die gleichen Ursachen, Ressourcen und Tests haben wie der bestehende Block?

Wenn ja, wird er in denselben Block aufgenommen. Wenn nein, wird daraus der naechste Block.

So vermeiden wir sowohl die vielen kleinen Entwicklungsschritte aus V3 als auch unuebersichtliche Grossaenderungen, bei denen nach einem Test niemand mehr weiss, welcher Teil den Fehler verursacht hat.
