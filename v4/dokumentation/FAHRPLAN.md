# V4 Fahrplan

V4 wird in mittelgrossen, klar abgegrenzten Entwicklungsbloecken aufgebaut. Ein Block soll eine zusammenhaengende Faehigkeit vollstaendig liefern: Quellcode, verstaendliche Meldungen, Diagnoseinformationen und passende Pruefungen.

Die Schritte werden bewusst groesser als bei V3. Gleichzeitig darf ein Block nicht mehrere voneinander unabhaengige Hauptbereiche vermischen. Dadurch bleibt nach einer Pruefung klar, welcher Block einen Fehler eingefuehrt haben kann.

## Grundregel fuer die Groesse eines Entwicklungsblocks

Ein Entwicklungsblock ist richtig geschnitten, wenn alle folgenden Punkte gelten:

- er liefert eine in sich nutzbare oder pruefbare Faehigkeit
- alle direkt benoetigten Teile werden gemeinsam gebaut statt auf viele Kleinstaenderungen verteilt
- Diagnose, Meldungen und Tests gehoeren zum selben Block
- ein Block veraendert normalerweise nur einen Hauptbereich oder einen eng gekoppelten technischen Unterbau
- ein fehlgeschlagener Test kann auf diesen Block eingegrenzt und dort behoben werden
- der naechste Block beginnt erst, wenn der aktuelle Block wieder vollstaendig gruen ist

Nicht gewuenscht sind Kleinstaenderungen wie eine einzelne Hilfsfunktion mit eigenem Entwicklungsschritt, wenn sie ohne die restliche Faehigkeit keinen Nutzen hat.

Ebenfalls nicht gewuenscht sind Riesenbloecke wie Gruppensteuerung, Handel, Lernen und Web-Oberflaeche gleichzeitig. Solche Fehler waeren nach einem Test nur schwer zuzuordnen.

## Fehlerregel zwischen zwei Bloecken

Nach jedem Entwicklungsblock gilt:

1. Typpruefung und Namenspruefung ausfuehren.
2. Einheitstests des geaenderten Bereichs ausfuehren.
3. alle bereits vorhandenen Kernpruefungen ausfuehren.
4. sobald Wiederholungsdaten vorhanden sind, den gesamten passenden Wiederholungssatz ausfuehren.
5. bei Laufzeitfunktionen einen begrenzten Adventure-Land-Test durchfuehren.
6. auftretende Fehler innerhalb dieses Blocks beheben.
7. erst danach den naechsten Block beginnen.

Fehlerbehebungen duerfen den Umfang des Blocks nicht nebenbei auf einen neuen Funktionsbereich ausweiten. Wird dabei ein neues groesseres Problem entdeckt, bekommt es einen eigenen spaeteren Block.

# Entwicklungsbloecke

## Block 1 – Grundlage und gemeinsame Regeln

Ziel: Verstaendliche, testbare Grundbausteine ohne Spiellogik.

Gemeinsam umgesetzt werden:

- deutsche Namensregeln
- EreignisZentrale
- AktionsAnfrage und AktionsAuswahl
- RessourcenVergabe
- Spielzustand-Vertrag
- BotMeldung-Vertrag
- feste Schemata
- eigene V4-Pruefung in GitHub

Abschlusspruefung:

- Typpruefung
- Einheitstests
- Namenspruefung
- Strukturpruefung

## Block 2 – Adventure-Land-Lesezugriff und Spielzustand

Ziel: Das Spiel vollstaendig beobachten koennen, ohne eine einzige aktive Spielaktion auszufuehren.

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
- mehrstuendiger reiner Beobachtungstest ohne aktive Spielaktion

## Block 3 – Zentrale Aktionssteuerung und Ressourcensperren

Ziel: Keine Spielfunktion darf spaeter eigenmaechtig handeln.

Gemeinsam umgesetzt werden:

- AktionsAnfragen
- Vorrangstufen `notfall`, `sicherheit`, `normal`, `hintergrund`
- exklusive Sperren fuer Bewegung, Inventar, Bank, Handel, Kampfziel, Gruppe und Ausruestung
- Unterbrechung niedrigerer Arbeit durch wichtigere Arbeit
- Abbruch laufender Arbeit
- Schattenausfuehrung ohne echte Spielaktion

Abschlusspruefung:

- konkurrierende Funktionen koennen keine Ressource gleichzeitig besitzen
- eine teilweise Ressourcenvergabe ist ausgeschlossen
- Notfallarbeit kann normale Arbeit sicher unterbrechen
- Schattenbetrieb zeigt die geplanten Aktionen nachvollziehbar an

## Block 4 – Telemetrie, Flugschreiber und Vorfallerkennung

Ziel: Ein Lauf muss sich spaeter erklaeren lassen.

Gemeinsam umgesetzt werden:

- strukturierte BotEreignisse
- fortlaufende Entscheidungs- und Aktionsspuren
- Ringpuffer fuer die letzten Minuten
- erkennbare Stillstaende, Schleifen, Zeitueberschreitungen und unerwartete Zustandswechsel
- Vorfallpakete mit relevanten Daten vor und nach einem Fehler
- klare BotMeldungen fuer jeden erkannten Vorfall

Abschlusspruefung:

- absichtlich erzeugter Stillstand wird erkannt
- die Meldung erklaert Ursache, Bot-Reaktion und Nutzeraktion
- ein Vorfallpaket enthaelt alle benoetigten Daten zur Untersuchung

## Block 5 – Wiederholungsmaschine und Vorher-Nachher-Vergleich

Ziel: Echte Fehler muessen ohne laufendes Adventure Land nachstellbar werden.

Gemeinsam umgesetzt werden:

- Laden aufgezeichneter Spielzustaende und Ereignisse
- deterministische Wiederholung
- Vergleich zweier V4-Staende mit denselben Eingangsdaten
- Erkennung geaenderter Entscheidungen
- Kennzeichnung von Verbesserungen, Verschlechterungen und Sicherheitsverletzungen

Abschlusspruefung:

- der in Block 4 erzeugte Teststillstand wird offline reproduziert
- eine Korrektur kann mit denselben Eingangsdaten vorher und nachher verglichen werden
- wiederholte Laeufe liefern dasselbe Ergebnis

## Block 6 – Grundlegendes Farmen als erste vollstaendige Spielfunktion

Ziel: Ein einzelner Charakter kann einen einfachen Farmablauf vollstaendig ausfuehren.

Gemeinsam umgesetzt werden:

- Zielauswahl
- Bewegung zum Ziel
- normaler Angriff
- Lebens- und Manawiederherstellung
- Beuteaufnahme
- einfache Inventarbehandlung
- Erfahrungs- und Goldwerte pro Zeit
- verstaendliche Meldungen fuer Stillstand und fehlende Voraussetzungen

Abschlusspruefung:

- Wiederholungstests fuer alle Teilablaeufe
- 24 Stunden Schattenbetrieb ohne ungefangenen Fehler
- danach begrenzter aktiver Einzelcharakter-Test

## Block 7 – Kampfsicherheit und Rueckzug

Ziel: Sicherheit hat immer Vorrang vor Leistung.

Gemeinsam umgesetzt werden:

- Gefahrenbewertung
- Rueckzug
- Reichweitenpruefung
- Abklingzeiten
- Ausweichen und Abstandhalten
- Schutz vor aussichtslosen Angriffen
- Notfallvorrang gegenueber allen normalen Aktionen

Abschlusspruefung:

- absichtlich erzeugte Gefahrensituationen werden sicher behandelt
- keine normale Aktion blockiert einen Rueckzug
- Fehler-Einspritztests fuer niedrige Lebenspunkte, fehlendes Mana, falsche Reichweite und blockierte Bewegung

## Block 8 – Gruppenkoordination

Ziel: Mehrere Charaktere arbeiten als Gruppe zusammen, ohne feste Annahmen ueber ihre Rolle im Kern.

Gemeinsam umgesetzt werden:

- Faehigkeiten statt hart verdrahteter Rollen
- Heilen, Schaden, Aggro, Schutz und Unterstuetzung
- Gruppenrollen aus aktuellen Faehigkeiten ableiten
- gemeinsames Ziel und gemeinsame Sicherheitslage
- Server- und Gruppenabgleich
- Wiederverbindung und Gruppenwiederaufbau

Abschlusspruefung:

- Mehrcharakter-Wiederholungen
- gezielte Ausfalltests einzelner Gruppenmitglieder
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

Ziel: Wirtschaftliche Aktionen werden erst auf der stabilen Haendler- und Bankgrundlage aufgebaut.

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
- keine frisch beschafften Arbeitsgegenstaende werden versehentlich wieder eingelagert

## Block 11 – Lernen und kontrollierte Versuche

Ziel: V4 darf aus Erfahrungen besser werden, ohne die Sicherheitsgrenzen selbst zu veraendern.

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

## Block 12 – Web-Oberflaeche, Schnittstelle und Archiv

Ziel: Laufzeit, historische Daten und Entwicklung werden an einer Stelle sichtbar, ohne Zugangsdaten in Adventure Land offenzulegen.

Gemeinsam umgesetzt werden:

- Live-Ansicht
- Vorfaelle
- Wiederholungen
- Versuche
- Entwicklungswarteschlange
- Schnittstelle zwischen Laufzeit und Server
- serverseitiger Archivabgleich per SFTP

Abschlusspruefung:

- Browser und Adventure Land besitzen keinerlei SFTP-Zugangsdaten
- Unterbrechung des Servers stoert die sichere Spiellogik nicht
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
6. 24 Stunden Adventure Land im Schattenbetrieb
7. 24 Stunden aktiver Einzelcharakter
8. 72 Stunden aktive Gruppe
9. 72 Stunden Haendler und Wirtschaft
10. Update-, Rueckfall- und Serverausfalltest
11. 7 Tage ununterbrochener Dauertest
12. Vergleich mit der aktuellen Produktionsversion anhand Sicherheit, Stillstaenden, Todesfaellen, Erfahrung pro Stunde und Gold pro Stunde
13. menschliche Entscheidung ueber die Abloesung von V3

# Entscheidungsregel fuer spaetere Planung

Wenn wir uns bei einem neuen Thema fragen, ob es in denselben Entwicklungsblock gehoert, verwenden wir eine einfache Frage:

> Kann ein Fehler in diesem neuen Teil mit hoher Wahrscheinlichkeit die gleichen Ursachen, Ressourcen und Tests haben wie der bestehende Block?

Wenn ja, wird er in denselben Block aufgenommen.

Wenn nein, wird daraus der naechste Block.

So vermeiden wir sowohl die vielen kleinen Entwicklungsschritte aus V3 als auch unuebersichtliche Grossaenderungen, bei denen nach einem Test niemand mehr weiss, welcher Teil den Fehler verursacht hat.
