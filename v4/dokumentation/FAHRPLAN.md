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

## Durchgehende Freigabestufen fuer Laufzeitfaehigkeiten

Ab Block 8.5 wird jede neue oder wesentlich geaenderte Laufzeitfaehigkeit stufenweise freigegeben:

1. Wiederholung, Simulation oder deterministischer Offline-Test
2. Schattenbetrieb ohne echte Spielaktion
3. begrenzter kontrollierter Live-Test
4. laengerer Soak-Test mit Telemetrie, Recovery-Nachweis und anschliessender Gesamtauswertung

Eine Stufe darf nur beginnen, wenn die vorherige gruen ist. Sicherheitsrelevante Aenderungen duerfen keine Stufe ueberspringen. Die bereits vorgesehenen 24-Stunden-, 72-Stunden- und 7-Tage-Kampagnen bleiben als uebergeordnete Systemfreigaben bestehen und werden durch diese Zwischenstufen nicht ersetzt.

## Recovery als Querschnittsregel

Jede neue Laufzeitfaehigkeit muss neben ihrem normalen Ablauf auch ihren Wiederanlauf beschreiben und pruefen. Mindestens betrachtet werden:

- Verbindungsabbruch und Wiederverbindung
- Neustart waehrend laufender Arbeit
- veraltete oder widerspruechliche Daten
- blockierte oder abgebrochene Bewegung
- ausgefallene Gruppenmitglieder
- unterbrochene mehrstufige Vorgaenge
- sichere Rueckkehr in einen eindeutigen Zustand

Recovery darf keine Sicherheitspruefung umgehen und keine halbfertige Aktion stillschweigend als erfolgreich behandeln.

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
- `BedienAnfrage`, `BedienRisiko` und `BedienSicherung`
- `DienstProfil`, `DienstGrenze`, `DienstAnfrage` und `KontingentWaechter`
- `TagesBericht` und `TagesBerichtEinstellung` als feste Datenvertraege
- feste Schemata
- eigene V4-Pruefung in GitHub

Abschlusspruefung:

- Typpruefung
- Einheitstests
- Namenspruefung
- Strukturpruefung
- kritische Bedienaktionen werden ohne vorgesehene Freigabe blockiert
- unbekannte oder abgelaufene Dienstgrenzen werden blockiert
- Sicherheitspuffer externer Dienste kann nicht von normaler Arbeit verbraucht werden
- alle Bedien-, Dienst- und Tagesbericht-Schemata sind gueltig und versioniert

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
- 30-minuetiger Beobachtungstest ohne aktive Spielaktion

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
- versionierte EntscheidungsDatensaetze mit Situation, erkannten Ereignissen, betrachteten oder zulaessigen Aktionen, gewaehlter Aktion, Begruendung, erwartetem Ergebnis und tatsaechlichem Ergebnis
- eindeutige Verknuepfung einer Entscheidung mit den daraus entstandenen AktionsAnfragen und Ergebnissen
- Ringpuffer fuer die letzten Minuten
- dauerhafte, zeitgestempelte Leistungsdaten fuer Erfahrung, Gold, Laufzeit, Tode, Rueckzuege, Verbindungsabbrueche und Neustarts
- Daten so speichern, dass Neustarts den spaeteren 24-Stunden-Bericht nicht unterbrechen
- abgeschlossene Wiederholungssegmente mit Sequenzbereich, Groesse und SHA-256 fuer spaetere Archivierung
- lokaler und vom Anbieter gemeldeter Verbrauch externer Dienste wird nachvollziehbar aufgezeichnet
- Kontingent-Schutzstufen und blockierte externe Anfragen werden als erklaerbare Ereignisse gespeichert
- lokale Puffer besitzen feste Eintrags-, Byte- und Altersgrenzen
- erkennbare Stillstaende, Schleifen, Zeitueberschreitungen und unerwartete Zustandswechsel
- Vorfallpakete mit relevanten Daten vor und nach einem Fehler
- klare BotMeldungen fuer jeden erkannten Vorfall

Abschlusspruefung:

- absichtlich erzeugter Stillstand wird erkannt
- die Meldung erklaert Ursache, Bot-Reaktion und Nutzeraktion
- ein Vorfallpaket enthaelt alle benoetigten Daten zur Untersuchung
- zeitgestempelte Leistungsdaten lassen sich ueber einen frei gewaehlten 24-Stunden-Zeitraum korrekt zusammenfassen
- ein Neustart erzeugt keine Luecke oder doppelte Zaehlerwerte
- abgeschlossene Wiederholungssegmente sind pruefbar und unvollstaendige Segmente werden nicht als dauerhaft archiviert behandelt
- blockierter externer Dienst beeintraechtigt die lokale Spielsicherheit nicht
- kein lokaler Puffer kann unbegrenzt wachsen

## Block 5 – Wiederholungsmaschine und Vorher-Nachher-Vergleich

Ziel: Echte Fehler muessen ohne laufendes Adventure Land nachstellbar werden.

Gemeinsam umgesetzt werden:

- Laden aufgezeichneter Spielzustaende und Ereignisse
- deterministische Wiederholung
- Mehrcharakter-Wiederholung
- Vergleich zweier V4-Staende mit denselben Eingangsdaten
- Erkennung geaenderter Entscheidungen
- Kennzeichnung von Verbesserungen, Verschlechterungen und Sicherheitsverletzungen
- Wiederholung gespeicherter Kontingententscheidungen
- goldener Wiederholungssatz mit geschuetzten seltenen, sicherheitsrelevanten und regressionskritischen Situationen

Abschlusspruefung:

- der in Block 4 erzeugte Teststillstand wird offline reproduziert
- eine Korrektur kann mit denselben Eingangsdaten vorher und nachher verglichen werden
- wiederholte Laeufe liefern dasselbe Ergebnis
- historische Daten koennen fuer spaetere Tagesberichte reproduzierbar ausgewertet werden
- gleiche Dienstprofile und Verbrauchsstaende erzeugen die gleiche Kontingententscheidung
- der goldene Wiederholungssatz wird durch normale Speicherbereinigung nicht entfernt

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

Status: **abgeschlossen am 17. September 2026**. Der detaillierte Abschlussnachweis steht in `BLOCK-7-ABSCHLUSS.md`.

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

- absichtlich erzeugte Gefahrensituationen werden sicher behandelt — **erfuellt**
- keine normale Aktion blockiert einen Rueckzug — **erfuellt**
- Fehler-Einspritztests fuer niedrige Lebenspunkte, fehlendes Mana, falsche Reichweite und blockierte Bewegung — **erfuellt**
- 10-Minuten-Read-only-Schattenlauf mit 601/601 Schritten und 100 % Sampling-Abdeckung — **erfuellt**
- reale Adventure-Land-Angriffsbereitschaft ohne unbekannte Bereitschaftszustaende im Abschlusslauf — **erfuellt**
- kontrollierter one-shot Live-Smoke-Test mit exakt einem Sicherheits-`move`, 0 sonstigen Spielaktionen und automatischer Wiedersperrung — **erfuellt**

Hinweis: Der fuer Block 8 auf 10 Minuten reduzierte Gruppentest ersetzt nicht die spaeteren allgemeinen 24-Stunden-, 72-Stunden- und 7-Tage-Systemtests der gesamten V4.

## Block 8 – Gruppenkoordination

Status: **abgeschlossen am 18. September 2026**. Der detaillierte Abschlussnachweis steht in `BLOCK-8-ABSCHLUSS.md`. Vor Block 9 folgt verbindlich Block 8.5.

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

- Mehrcharakter-Wiederholungen — **erfuellt**
- gezielte Ausfalltests einzelner Gruppenmitglieder — **automatisiert und read-only live erfuellt**
- Wiederaufbau nach Verbindungsabbruch — **erfuellt**
- anschliessender 10-Minuten-Gruppentest — **erfuellt; beide Ranger PASS auf Runtime 1.1.4**

Der finale Nachweisstand steht in `BLOCK-8-ABSCHLUSSSTATUS.md` und `BLOCK-8-ABSCHLUSS.md`. Der fuer Block 8 bewusst auf 10 Minuten reduzierte Gruppentest ist bestanden; die spaeteren allgemeinen 24-Stunden-, 72-Stunden- und 7-Tage-Systemtests bleiben unveraendert bestehen.

## Block 8.5 – Instrumentierung, Ingame-HUD-Basis und Recovery-Vereinheitlichung

Status: **Schritte 8.5.1 bis 8.5.8 implementiert; 8.5.9-Freigabe-Gate implementiert, operative Schatten-/Live-/Soak-Freigabe fuer den finalen Block-8.5-Aenderungsstand noch offen. Block 9 bleibt bis dahin gesperrt.**

Ziel: Die bereits vorhandenen V4-Faehigkeiten werden vor Haendler-, Bank- und Wirtschaftslogik einheitlich beobachtbar, erklaerbar, sicher bedienbar und wiederanlauffaehig gemacht.

Dieser Block baut keine neue fachliche Spielstrategie. Er schliesst die Instrumentierungs- und Bedienluecke zwischen Gruppenkoordination und den zustandsreichen Vorgaengen aus Block 9 und 10.

Verbindliche Arbeitsgrundlagen:

- `BLOCK-8-5-WISSENSTRANSFER-V3-V4.md` – welche V3-Erkenntnisse uebernommen, neu modelliert oder bewusst spaeter behandelt werden,
- `BLOCK-8-5-PLAN.md` – Reihenfolge der Block-8.5-Implementierung,
- `BLOCK-8-5-FREIGABESTUFEN.md` – sequenzielles Block-9-Gate und aktueller operativer Freigabestand.

Gemeinsam umgesetzt werden:

- verbindliche EntscheidungsDatensaetze fuer wichtige Gruppenentscheidungen gemaess dem in Block 4 definierten Format
- vorhandene Block-1-bis-8-Daten werden nur dort nachtraeglich in das neue Format ueberfuehrt, wo dies eindeutig und ohne erfundene Informationen moeglich ist
- gemeinsame Status- und SteuerSchnittstelle zwischen V4-Kern und Oberflaechen
- strikte Trennung: Ingame-HUD und spaetere Web-Oberflaeche enthalten keine Bot-Fachlogik
- schlankes Ingame-HUD fuer Charakter- und Gruppenstatus, aktuellen Auftrag, aktuelle Entscheidung, Sicherheitslage, Warnungen und Diagnose
- sichere Basisbedienung wie Pausieren, Fortsetzen und Diagnose ausschliesslich ueber die bestehenden Bedien- und Aktionssicherungen
- einheitliche Recovery- und Fehlerzustaende fuer die bereits vorhandenen Laufzeitmodule
- nachvollziehbarer Umgang mit Reconnect, veralteten Daten, unterbrochener Arbeit und Wiederaufnahme
- das Ingame-HUD bleibt austauschbar; Ausfall oder Schliessen der Anzeige darf die Bot-Laufzeit nicht beeinflussen
- das vollstaendige Web-Command-Center bleibt Bestandteil von Block 12

Abschlusspruefung:

- wichtige Gruppenentscheidungen erzeugen einen versionierten, nachvollziehbaren EntscheidungsDatensatz
- Entscheidung, daraus entstandene AktionsAnfrage und tatsaechliches Ergebnis lassen sich eindeutig zusammenfuehren
- Wiederholung derselben fachlichen Eingaben erzeugt dieselbe fachliche Entscheidung; Zeitstempel oder reine Laufzeitkennungen duerfen den Vergleich nicht verfaelschen
- das Ingame-HUD kann den V4-Kern beobachten, ohne Fachlogik zu duplizieren
- jede veraendernde HUD-Aktion durchlaeuft BedienSicherung und die zentrale Aktionssteuerung
- Schliessen oder Fehler des HUD veraendert die laufende Bot-Logik nicht
- Reconnect, Neustart, veraltete Daten und unterbrochene Arbeit besitzen einen getesteten sicheren Recovery-Pfad
- alle bestehenden Block-1-bis-8-Pruefungen bleiben gruen
- vor Beginn von Block 9 werden Offline, Schattenbetrieb, begrenzter kontrollierter Live-Test und Soak fuer denselben finalen Aenderungsstand nachgewiesen; das read-only Freigabe-Gate darf keine Stufe ueberspringen

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

## Block 11 – Lernen, Schattenentscheidungen und kontrollierte Versuche

Ziel: V4 darf aus Erfahrungen besser werden, ohne Sicherheitsgrenzen oder Produktionslogik unkontrolliert selbst zu veraendern.

Gemeinsam umgesetzt werden:

- die EntscheidungsDatensaetze aus Block 4 und 8.5 bilden die primaere nachvollziehbare Lernquelle
- Situation -> Moeglichkeiten -> Entscheidung -> erwartetes Ergebnis -> tatsaechliches Ergebnis
- Erfahrungsablage
- versionierte Lerndatensaetze als reproduzierbare Ableitung aus Rohdaten
- neue Strategien werden zuerst offline bewertet und danach als Schattenentscheidung parallel zur produktiven Entscheidung berechnet
- eine Schattenentscheidung darf keine Adventure-Land-Aktion ausloesen
- erst nach bestandener Offline- und Schattenbewertung sind begrenzte kontrollierte Versuche zulaessig
- kontrollierte Versuche
- Vergleich bestehender und neuer Strategie
- Mindestmenge an Belegen vor einer Aenderung
- Ruecknahme schlechter Strategien
- `SpeicherLernZyklus` mit den Phasen Sammeln, Vorbereiten, Lernen, Pruefen, Bereinigen und Notfall
- Rohdatenfreigabe nur nach bestaetigter Datensatzbildung, erfolgreichem Lernen, bestandener Evaluation und dauerhafter Wissensspeicherung
- Schutz goldener Wiederholungen, seltener Situationen und wichtiger Vorfaelle vor normaler Bereinigung

Abschlusspruefung:

- Lernen kann Auswahl und Gewichtung einer Strategie veraendern
- Lernen kann keine direkte Adventure-Land-Aktion ausfuehren
- Lernen kann weder BedienSicherung noch KontingentWaechter umgehen
- Sicherheitsregeln bleiben unveraendert
- gleiche Erfahrungsdaten ergeben nachvollziehbare Entscheidungen
- Speicherknappheit allein kann keine unverarbeiteten Rohdaten loeschen
- bei Notfallauslastung wird Datenerfassung reduziert, solange der Lern- und Sicherungsnachweis nicht vollstaendig ist
- nach vollstaendig bestaetigtem Lernzyklus werden ausschliesslich bereits verarbeitete loeschbare Rohdaten bis zum sicheren Zielstand freigegeben

## Block 12 – Web-Command-Center, Tagesbericht, Schnittstelle und Archiv

Ziel: Laufzeit, historische Daten, Tagesberichte und Entwicklung werden an einer Stelle sichtbar und fehlbedienungssicher bedienbar. Das Web-Command-Center ist die umfangreiche Verwaltungs- und Analyseoberflaeche; das fruehe Ingame-HUD aus Block 8.5 bleibt bewusst schlank.

Gemeinsam umgesetzt werden:

- gemeinsame Status- und SteuerSchnittstelle aus Block 8.5 wiederverwenden; keine Bot-Fachlogik im Web-Command-Center

- eindeutiger Gesamtzustand `GRUEN`, `GELB` oder `ROT` immer zusammen mit normalem deutschen Text
- gefuehrte Ersteinrichtung mit automatischer Pruefung jedes Schrittes
- Startpruefung; `Bot starten` bleibt bei blockierenden Problemen deaktiviert
- Standardansicht mit nur den wirklich notwendigen Bedienaktionen
- getrennte `Erweiterte Einstellungen`
- feste Auswahllisten statt freier Texteingabe, wenn moeglich
- Zahlenfelder mit Einheit, Mindestwert, Hoechstwert und empfohlenem Bereich
- Aenderungsvorschau fuer vorsichtige und kritische Aktionen
- jede veraendernde Aktion laeuft durch `BedienAnfrage` und `BedienSicherung`
- Vorgangskennung gegen Doppelklick und Netzwerk-Wiederholung
- Konfigurationsversion gegen Ueberschreiben durch veraltete Browseransichten
- atomare Konfigurationsspeicherung und Rueckfallpunkt fuer kritische Aenderungen
- `Sichere Standardwerte wiederherstellen`
- Bedienprotokoll ohne Geheimnisse
- Dienststatus fuer Supabase, Cloudflare, Objektspeicher und spaetere Dienste mit einfachem Handlungsbedarf statt Anbieterjargon
- zentrale Dienst-Tore; keine Fachlogik darf externe Anbieter direkt aufrufen
- `DienstProfil` pro Anbieter/Tarif mit offizieller Quelle, Gueltigkeit und Sicherheitsreserve
- automatische Schutzstufen `normal`, `beobachten`, `sparen`, `blockiert`
- Live-Ansicht
- Charakter- und Gruppenstatus
- Vorfaelle
- Wiederholungen
- Versuche
- Entwicklungswarteschlange
- Schnittstelle zwischen Laufzeit und Server
- serverseitiger Archivabgleich ueber eine provider-neutrale S3-kompatible Objektspeicher-Schnittstelle; erste vorgesehene Konfiguration Backblaze B2 Cloud Storage
- Anzeige von sicherer Speicherauslastung, aktueller Speicher-Lern-Phase, geschuetzten Daten und bereits verarbeiteten loeschbaren Rohdaten
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

- Browser und Adventure Land besitzen keinerlei Objektspeicher-Zugangsdaten
- Browser und Adventure Land besitzen keinerlei E-Mail-Versandgeheimnisse
- unvollstaendige Einrichtung kann den Bot nicht aktiv starten
- ungueltige Eingaben koennen nicht gespeichert werden
- kritische Aktionen sind nicht mit einem einzelnen Klick ausfuehrbar
- Doppelklick und Netzwerk-Wiederholung fuehren nicht zu doppelter Ausfuehrung
- veraltete Browseransicht kann neuere Konfiguration nicht ueberschreiben
- unterbrochenes Speichern hinterlaesst keine halbe Konfiguration
- sichere Standardwerte koennen kontrolliert wiederhergestellt werden
- ein Nutzer kann fuer jede Stoerung ohne Anbieterwissen erkennen, ob er handeln muss
- kein externer Aufruf passiert ohne Kontingentpruefung
- abgelaufenes DienstProfil blockiert externe Nutzung
- Sicherheitspuffer wird nie als normales Budget verwendet
- blockierter externer Dienst stoppt nicht die lokale sichere Spiellogik
- ein Bericht wertet exakt die vorgesehenen 24 Stunden aus
- Neustarts innerhalb des Zeitraums fuehren weder zu Datenverlust noch Doppelzaehlung
- derselbe automatische Zeitraum erzeugt genau einen Bericht
- Vergleichswerte stammen ausschliesslich aus dem vorherigen 24-Stunden-Zeitraum
- fehlende Daten werden nicht als Null erfunden
- ein E-Mail-Ausfall verliert den Bericht nicht und blockiert die Spiellogik nicht
- fehlgeschlagener Versand kann ohne doppelten Bericht wiederholt werden
- `Bericht jetzt erstellen` funktioniert unabhaengig vom automatischen Versand
- Objektspeicher-Uebertragungen koennen nach Abbruch sauber fortgesetzt werden
- unvollstaendige Multipart-Uebertragungen werden niemals als dauerhaft archivierte Segmente behandelt
- ein Anbieterwechsel innerhalb der S3-kompatiblen Speicherschicht veraendert weder Wiederholungs- noch Lernlogik

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
- automatische Entwicklung darf BedienSicherung, KontingentWaechter oder Dienstprofile nicht stillschweigend lockern

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
2. alle Einheitstests inklusive BedienSicherung und KontingentWaechter
3. Eigenschaftstests fuer Kernregeln, Bedienfreigaben und Dienstbudgets
4. gesamter Wiederholungssatz
5. Fehler-Einspritztests fuer Netzwerk, Zeitueberschreitungen, Anbietergrenzen, Doppelklicks, veraltete Ansichten und Neustarts
6. 24 Stunden Adventure Land im Schattenbetrieb inklusive erzeugtem Tagesbericht
7. 24 Stunden aktiver Einzelcharakter
8. 72 Stunden aktive Gruppe
9. 72 Stunden Haendler und Wirtschaft
10. mehrere automatische Tagesberichte inklusive mindestens eines simulierten Versandfehlers
11. vollstaendiger Bedienungstest mit absichtlich falschen Eingaben, fehlenden Voraussetzungen und kritischen Fehlversuchen
12. Supabase-, Cloudflare-, Objektspeicher- und Dienstgrenzentest bis unmittelbar vor das sichere V4-Budget, ohne den Sicherheitspuffer anzutasten
13. Speicher-Lern-Zyklus bis in die Notfallstufe testen; unverarbeitete Daten duerfen dabei nicht automatisch geloescht werden
14. Update-, Rueckfall- und Serverausfalltest
15. 7 Tage ununterbrochener Dauertest mit genau einem automatischen Bericht pro geplantem Versandtag, begrenzten Puffern und eingehaltenen Dienstbudgets
16. Vergleich mit der aktuellen Produktionsversion anhand Sicherheit, Stillstaenden, Todesfaellen, Erfahrung pro Stunde und Gold pro Stunde
17. menschliche Entscheidung ueber die Abloesung von V3

# Entscheidungsregel fuer spaetere Planung

Wenn wir uns bei einem neuen Thema fragen, ob es in denselben Entwicklungsblock gehoert, verwenden wir eine einfache Frage:

> Kann ein Fehler in diesem neuen Teil mit hoher Wahrscheinlichkeit die gleichen Ursachen, Ressourcen und Tests haben wie der bestehende Block?

Wenn ja, wird er in denselben Block aufgenommen. Wenn nein, wird daraus der naechste Block.

So vermeiden wir sowohl die vielen kleinen Entwicklungsschritte aus V3 als auch unuebersichtliche Grossaenderungen, bei denen nach einem Test niemand mehr weiss, welcher Teil den Fehler verursacht hat.