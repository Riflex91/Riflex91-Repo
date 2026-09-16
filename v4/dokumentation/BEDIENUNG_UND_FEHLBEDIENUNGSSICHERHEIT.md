# Bedienung und Fehlbedienungssicherheit

## Ziel

V4 soll ohne technisches Spezialwissen sicher bedienbar sein. Der Nutzer soll zu jedem Zeitpunkt verstehen koennen:

- laeuft der Bot sicher?
- was macht er gerade?
- gibt es ein Problem?
- muss ich etwas tun?
- was passiert, wenn ich diese Schaltflaeche druecke?

Eine mathematisch absolute Garantie gegen jede denkbare Fehlbedienung ist bei Software nicht moeglich. V4 wird deshalb nach dem Prinzip `sicher scheitern statt gefaehrlich raten` aufgebaut. Fehlerhafte Eingaben, Doppelklicks, veraltete Ansichten, fehlende Voraussetzungen und unvollstaendige Einstellungen duerfen nicht stillschweigend zu gefaehrlichen Aktionen fuehren.

## Standardansicht

Die normale Web-Oberflaeche zeigt nur Informationen und Aktionen, die fuer den Betrieb wirklich notwendig sind.

Ganz oben steht immer ein eindeutiger Gesamtzustand:

```text
BOT-ZUSTAND

GRUEN  Alles in Ordnung. Keine Aktion notwendig.
GELB   Bot arbeitet weiter, aber etwas wird beobachtet oder eingeschraenkt.
ROT    Eine Funktion wurde aus Sicherheitsgruenden gestoppt. Nutzeraktion erforderlich.
```

Neben der Farbe steht immer ein normaler deutscher Satz. Farbe allein darf niemals die einzige Information sein.

## Startpruefung

Der Bot darf nicht einfach starten, wenn wesentliche Voraussetzungen fehlen.

Vor `Bot starten` wird automatisch geprueft:

- Adventure-Land-Sitzung ist vorhanden
- Charakterdaten sind lesbar
- benoetigte V4-Konfiguration ist gueltig
- keine widerspruechlichen Einstellungen
- lokale Speicherbereiche sind beschreibbar
- notwendige Sicherheitsregeln sind geladen
- externe Dienste sind nur dann freigegeben, wenn ein gueltiges DienstProfil vorhanden ist

Die Startschaltflaeche ist bei einem blockierenden Problem deaktiviert. Direkt daneben steht der konkrete Grund und die benoetigte Loesung.

## Keine technischen Raetsel

Nicht verwenden:

```text
HTTP 429
D1_LIMIT
ERR_CFG_42
Timeout
undefined
```

Stattdessen:

```text
Cloudflare kann im Moment keine weiteren normalen Telemetriedaten annehmen.
Der Bot hat die Uebertragung automatisch reduziert.
Die Spiellogik laeuft sicher weiter.
Du musst nichts tun.
```

Technische Details duerfen unter `Technische Einzelheiten anzeigen` zusaetzlich sichtbar sein.

## BedienRisiko

Jede Nutzeraktion wird vor der Ausfuehrung in eine von drei Klassen eingeteilt:

### unkritisch

Beispiele:

- Bericht anzeigen
- Ansicht wechseln
- Vorfall oeffnen
- aktuellen Status aktualisieren

Diese Aktionen duerfen direkt ausgefuehrt werden, wenn alle Voraussetzungen erfuellt sind.

### vorsicht

Beispiele:

- Strategie fuer den naechsten Lauf aendern
- automatische Berichtszeit aendern
- einen Dienst voruebergehend deaktivieren

Vor der Ausfuehrung zeigt V4:

- Was wird geaendert?
- Welcher Wert gilt vorher?
- Welcher Wert gilt danach?
- Welche Auswirkung ist zu erwarten?

Der Nutzer muss anschliessend ausdruecklich bestaetigen.

### kritisch

Beispiele:

- historische Daten endgueltig loeschen
- Sicherheitsgrenzen lockern
- einen Rueckfallpunkt entfernen
- eine irreversible Wirtschaftsaktion ausserhalb normaler Botregeln manuell freigeben

Kritische Aktionen brauchen:

1. alle Voraussetzungen erfuellt,
2. eine vollstaendige Folgenbeschreibung,
3. eine ausdrueckliche Warnung,
4. einen eindeutigen Bestaetigungstext,
5. soweit moeglich einen vorhandenen Rueckfallpunkt oder eine Sicherung.

Ein einzelner Klick reicht fuer eine kritische Aktion niemals aus.

## Zentrale BedienSicherung

Keine Schaltflaeche darf eine kritische Funktion direkt aufrufen.

Der Ablauf lautet:

`Web-Oberflaeche -> BedienAnfrage -> BedienSicherung -> eigentliche Funktion`

Die `BedienSicherung` blockiert die Aktion, wenn:

- Voraussetzungen fehlen,
- Titel, Erklaerung oder Auswirkung fehlen,
- eine notwendige Bestaetigung fehlt,
- bei kritischen Aktionen der Bestaetigungstext nicht exakt stimmt.

Diese Sicherung gilt auch dann, wenn spaeter eine andere Oberflaeche oder mobile Bedienung hinzukommt.

## Sichere Voreinstellungen

Neue oder zurueckgesetzte Einstellungen verwenden immer die sicherste sinnvolle Voreinstellung.

Beispiele:

- neue externe Dienste: deaktiviert
- Lernstrategie: beobachtet zuerst, veraendert nicht sofort
- automatische Loeschung: aus
- Sicherheitsregeln: aktiv
- unbekannte Werte: blockieren oder als unbekannt anzeigen
- Kosten- und Kontingentgrenzen: mit Sicherheitspuffer
- neue aktive Spielfunktion: zuerst Schattenbetrieb, wenn technisch sinnvoll

Eine Funktion darf nicht nur deshalb aktiv werden, weil ein neues Feld einen Standardwert erhalten hat.

## Eingabefelder

Wo eine feste Auswahl moeglich ist, darf V4 kein freies Texteingabefeld verlangen.

Beispiele:

- Uhrzeit -> Zeit-Auswahl
- Meldungsstufe -> feste Auswahl
- Charakter -> bekannte Charakterliste
- Strategie -> bekannte Strategien
- Dienst -> eingerichtete Dienste

Zahlenfelder besitzen:

- Einheit direkt am Feld
- erlaubten Mindestwert
- erlaubten Hoechstwert
- empfohlenen Bereich
- sofortige Pruefung waehrend der Eingabe

Ein ungueltiger Wert kann nicht gespeichert werden.

## Empfohlene Werte

Bei jeder Einstellung, die der Nutzer normalerweise nicht selbst optimieren muss, zeigt V4:

```text
Empfohlen: Automatisch verwalten
```

Technische Grenzwerte werden nicht als normale Bedienaufgabe an den Nutzer delegiert.

Wenn ein Expertenwert geaendert werden kann, liegt er in `Erweiterte Einstellungen` und zeigt vor der Aenderung seine Auswirkung.

## Aenderungsvorschau

Vor einer vorsichtigen oder kritischen Konfigurationsaenderung zeigt V4 immer eine Vorher-Nachher-Vorschau.

Beispiel:

```text
AENDERUNG PRUEFEN

Tagesbericht bisher: 08:05
Tagesbericht danach: 07:30

Auswirkung:
Der naechste automatische Bericht wird um 07:30 erstellt.
Der ausgewertete Zeitraum bleibt exakt 24 Stunden.

[Abbrechen] [Aenderung uebernehmen]
```

## Doppelklick- und Wiederholungsschutz

Jede veraendernde Bedienaktion erhaelt eine eindeutige Vorgangskennung.

Mehrfaches Druecken, Browser-Neuladen, Netzwerk-Wiederholung oder eine verspaetete Antwort duerfen denselben Vorgang nicht zweimal ausfuehren.

Nach dem Ausloesen einer veraendernden Aktion zeigt die Schaltflaeche einen eindeutigen Zustand wie `Wird ausgefuehrt ...` und kann nicht sofort erneut ausgeloest werden.

## Schutz vor veralteten Ansichten

Eine alte geoeffnete Browserseite darf keine inzwischen ungueltige Einstellung ueberschreiben.

Veraendernde Anfragen enthalten deshalb die bekannte Konfigurationsversion. Ist auf dem Server bereits eine neuere Version vorhanden, wird die alte Aenderung blockiert und die Ansicht aktualisiert.

## Speichern und Rueckfall

Konfiguration wird atomar gespeichert: entweder vollstaendig oder gar nicht.

Vor kritischen Konfigurationsaenderungen wird soweit moeglich automatisch ein Rueckfallpunkt gespeichert.

Die Web-Oberflaeche bietet:

```text
Sichere Standardwerte wiederherstellen
```

Diese Funktion zeigt vorher exakt, welche Einstellungen zurueckgesetzt werden.

## Selbsterklaerende Fehlerbehebung

Jeder Fehler bietet direkt die naechste sinnvolle Aktion.

Beispiel:

```text
[ROT] TELEMETRIE_DIENST_NICHT_VERFUEGBAR

Was ist passiert:
Die Telemetriedaten konnten nicht an den Server uebertragen werden.

Warum:
Der Server ist derzeit nicht erreichbar.

Was hat der Bot getan:
Die Spiellogik laeuft weiter. Wichtige Daten werden innerhalb des lokalen Sicherheitslimits gepuffert.

Muss ich etwas tun:
NEIN

Was soll ich tun:
Nichts. V4 versucht die Uebertragung spaeter mit groesser werdenden Abstaenden erneut.
```

Wenn Nutzeraktion notwendig ist, nennt die Meldung eine konkrete Schaltflaeche oder Einstellung statt nur einer technischen Beschreibung.

## Keine Endlosschleifen fuer den Nutzer

V4 fragt nicht immer wieder dieselbe Bestaetigung und zeigt nicht bei jedem automatischen Wiederholungsversuch dieselbe Warnung neu.

Gleiche Meldungen werden sinnvoll zusammengefasst. Eskaliert ein Problem, wird die Meldungsstufe erhoeht und der Grund dafuer erklaert.

## Geheimnisse und Zugangsdaten

Geheimnisse werden niemals in normalen Einstellungsfeldern erneut angezeigt.

Die Oberflaeche zeigt stattdessen zum Beispiel:

```text
Cloudflare-Schluessel: eingerichtet
Letzte erfolgreiche Pruefung: heute 08:12
```

Aendern und Anzeigen sind getrennte Aktionen. Protokolle, Tagesberichte und Fehlermeldungen duerfen keine Geheimnisse enthalten.

## Dienstgrenzen in der Bedienung

Der Nutzer soll Anbieterlimits nicht selbst berechnen muessen.

Die Web-Oberflaeche zeigt je Dienst beispielsweise:

```text
SUPABASE
Zustand: GRUEN
Sicheres V4-Budget: 43 % genutzt
Sicherheitspuffer: unangetastet
Aktion notwendig: NEIN
```

oder:

```text
CLOUDFLARE
Zustand: GELB
Sicheres V4-Budget: 87 % genutzt
Bot-Reaktion: Nicht notwendige Telemetrie reduziert
Aktion notwendig: NEIN
```

Die Anzeige nennt niemals nur einen Prozentwert ohne Einordnung.

## Gefuehrte Ersteinrichtung

Die erste Einrichtung ist ein gefuehrter Ablauf. Jeder Schritt wird automatisch geprueft, bevor `Weiter` moeglich ist.

Am Ende folgt eine Gesamtpruefung:

```text
EINRICHTUNG GEPRUEFT

Adventure Land: bereit
Lokale Sicherheitslogik: bereit
Telemetrie: bereit
Cloudflare: bereit
Supabase: bereit
Tagesbericht: bereit
Rueckfallpunkt: vorhanden

Bot kann sicher gestartet werden.
```

Nicht verwendete optionale Dienste werden als `nicht eingerichtet - nicht benoetigt` angezeigt und nicht als Fehler.

## Bedienprotokoll

Jede veraendernde Nutzeraktion wird nachvollziehbar protokolliert:

- Zeitpunkt
- Aktion
- vorheriger Wert
- neuer Wert
- BedienRisiko
- Ergebnis
- bei Blockierung der Grund

Geheimnisse werden dabei entfernt oder maskiert.

## Harte Bedieninvarianten

- Keine kritische Aktion mit einem einzigen Klick.
- Keine veraendernde Aktion ohne zentrale BedienSicherung.
- Keine ungueltige Eingabe kann gespeichert werden.
- Keine alte Browseransicht darf neuere Konfiguration still ueberschreiben.
- Kein Doppelklick darf denselben Vorgang doppelt ausfuehren.
- Keine technische Fehlermeldung ohne normale deutsche Erklaerung.
- Keine Farbe ohne Textbedeutung.
- Kein Geheimnis in Meldungen, Berichten oder Protokollen.
- Keine Einstellung benoetigt Anbieterwissen, wenn V4 sie automatisch sicher verwalten kann.
- Keine blockierte Funktion laesst den Nutzer ohne konkrete Erklaerung und naechsten Schritt zurueck.
