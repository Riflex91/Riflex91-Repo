# V4 Fahrplan

V4 wird in klaren Stufen aufgebaut. Eine Stufe gilt erst als abgeschlossen, wenn ihre Tests und Sicherheitsbedingungen erfuellt sind.

## M0 – Grundlage

Ziel: Verstaendliche, testbare Grundbausteine ohne Spiellogik.

- deutsche Namensregeln
- EreignisZentrale
- AktionsAnfrage und AktionsAuswahl
- RessourcenVergabe
- Spielzustand-Vertrag
- BotMeldung-Vertrag
- feste Schemata
- eigene V4-Pruefung in GitHub

Abschluss: Typpruefung, Einheitstests, Namenspruefung und Strukturpruefung sind gruen.

## M1 – Adventure-Land-Lesezugriff

Ziel: Das Spiel sicher beobachten, ohne Aktionen auszufuehren.

- eine einzige Schnittstelle zu Adventure-Land-Daten
- unveraenderliche Spielzustaende
- beobachtetes, abgeleitetes und gelerntes Wissen getrennt halten
- fehlende oder unbekannte Werte ausdruecklich markieren

Abschluss: Aufgezeichnete Spielzustaende sind deterministisch und koennen offline geladen werden.

## M2 – Zentrale Arbeitssteuerung

Ziel: Jede Spielfunktion stellt nur Anfragen; nur der Kern entscheidet und fuehrt spaeter aus.

- AktionsAnfragen
- Prioritaeten `notfall`, `sicherheit`, `normal`, `hintergrund`
- exklusive Ressourcensperren
- Abbruch und Unterbrechung
- Schattenbetrieb ohne echte Spielaktionen

Abschluss: konkurrierende Funktionen koennen sich nicht gegenseitig Bewegung, Inventar oder Bankzugriff wegnehmen.

## M3 – Telemetrie, Flugschreiber und Wiederholung

Ziel: Fehler muessen nach einem echten Lauf offline reproduzierbar sein.

- strukturierte Ereignisse
- Ringpuffer fuer die letzten Minuten
- Vorfall-Erkennung
- Vorfallpakete
- Wiederholungsmaschine
- Vergleich vorher/nachher

Abschluss: Ein absichtlich erzeugter Stillstand wird erkannt, gespeichert und offline reproduziert.

## M4 – Farmer-Grundfunktion

- Zielauswahl
- Bewegung
- normaler Angriff
- HP/MP-Erholung
- Beute
- Leistungswerte

Abschluss: 24 Stunden Schattenbetrieb ohne ungefangenen Fehler; danach kontrollierter aktiver Einzel-Farmer-Test.

## M5 – Kampfsicherheit

- Rueckzug
- Risikopruefung
- Reichweite
- Abklingzeiten
- Kiten
- Notfallvorrang

Abschluss: absichtlich erzeugte Gefahrensituationen werden sicher behandelt; keine normale Aktion darf Notfallarbeit blockieren.

## M6 – Gruppenkoordination

- Faehigkeiten statt fest verdrahteter Klassen
- Heilen, Schaden, Aggro, Schutz und Unterstuetzung
- Gruppenrollen aus aktuellen Faehigkeiten ableiten
- Server- und Gruppenabgleich

Abschluss: Mehrcharakter-Wiederholungen und 72-Stunden-Gruppentest.

## M7 – Merchant und Wirtschaft

- Serviceauftraege
- Bank
- Kaufen und Verkaufen
- Aufwerten und Kombinieren
- Gegenstandsreservierungen
- nachvollziehbare Wirtschaftsvorgaenge

Abschluss: kein rekursiver Serviceablauf, kein doppelter Besitz einer Ressource, keine unbeabsichtigte Gegenstandsvernichtung in Fehler- und Neustarttests.

## M8 – Lernen und Experimente

- Situation -> Optionen -> Entscheidung -> erwartetes Ergebnis -> echtes Ergebnis
- kontrollierte Experimente
- Vergleich von Ausgangs- und Herausfordererstrategie
- Sicherheitsgrenzen koennen vom Lernen nicht veraendert werden

Abschluss: Lernen kann eine Strategie verbessern, aber keine direkte Adventure-Land-Aktion ausfuehren.

## M9 – Web-Oberflaeche, Schnittstelle und SFTP-Archiv

- Live-Ansicht
- Vorfaelle
- Wiederholungen
- Experimente
- Entwicklungswarteschlange
- serverseitiger Archivabgleich per SFTP

Abschluss: Browser und Adventure Land besitzen keinerlei SFTP-Zugangsdaten.

## M10 – Automatisierter Entwicklungsablauf

- wiederkehrende Fehler gruppieren
- Vorfaelle automatisch einer Entwicklungsaufgabe zuordnen
- Wiederholung als Beweis verlangen
- Tests vor Codeaenderung
- Branch und Pull Request vorbereiten
- keine automatische Verschmelzung sicherheitsrelevanter Spiellogik

Abschluss: Ein Testfehler kann vom Laufzeitvorfall bis zum geprueften Pull Request verfolgt werden.

## M11 – Auslieferung und Rueckfall

- kleiner Startlader
- versionierte Laufzeit
- SHA-256-Pruefung
- zuletzt funktionierende Version
- atomare Veroeffentlichung
- Rueckfall bei fehlerhaftem Start

Abschluss: Update-, Netzwerkausfall-, Neustart- und Rueckfalltests sind erfolgreich.

# Abschliessende Freigabekampagne

V4 ersetzt V3 erst nach dieser Reihenfolge:

1. komplette statische und architektonische Pruefung
2. alle Einheitstests
3. Eigenschaftstests fuer Kerninvarianten
4. gesamter Wiederholungskorpus
5. Fehler-Einspritztests fuer Netzwerk, Zeitueberschreitungen und Neustarts
6. 24 Stunden Adventure Land im Schattenbetrieb
7. 24 Stunden aktiver Einzel-Farmer
8. 72 Stunden aktive Farmer-Gruppe
9. 72 Stunden Merchant/Wirtschaft
10. Update-, Rueckfall- und Serverausfalltest
11. 7 Tage ununterbrochener Dauertest
12. Vergleich mit der aktuellen Produktionsversion anhand Sicherheit, Stillstaenden, Todesfaellen, EXP/h und Gold/h
13. menschliche Entscheidung ueber die Ablösung von V3
