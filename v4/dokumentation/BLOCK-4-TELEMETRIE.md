# Block 4 – Telemetrie, Flugschreiber und Vorfallerkennung

## Ziel

Ein V4-Lauf muss sich spaeter erklaeren lassen. Dazu werden Entscheidungen, Aktionsphasen, Laufzeitwerte, Dienstverbrauch und erkennbare Stoerungen strukturiert erfasst, lokal begrenzt gepuffert und so vorbereitet, dass Block 5 dieselben Daten offline wiedergeben kann.

Block 4 fuehrt keine Adventure-Land-Spielaktion aus.

## Zentrale Regeln

- Kein lokaler Puffer waechst unbegrenzt.
- Kein Telemetriefehler darf die lokale Spielsicherheit blockieren.
- Keine Laufzeit wird wegen ueberlappender Intervalle doppelt gezaehlt.
- Keine bereits bekannte Telemetrie-Kennung wird nach einem Neustart erneut gezaehlt.
- Kein abgeschlossenes Wiederholungssegment gilt ohne Sequenzbereich, Bytegroesse und SHA-256 als pruefbar.
- Kein offenes Wiederholungssegment wird als abgeschlossenes Segment gespeichert.
- Kein geschuetztes Wiederholungssegment und kein Vorfallpaket wird allein wegen Speicherknappheit automatisch geloescht.
- Ist der geschuetzte lokale Speicher voll, wird neues geschuetztes Material abgewiesen und als nicht dauerhaft gespeichert gemeldet. Die sichere Spiellogik laeuft weiter.
- Jeder erkannte Vorfall erzeugt eine BotMeldung mit Ursache, Bot-Reaktion und Nutzeraktion.

## Fortlaufende BotEreignisse

`FortlaufenderEreignisSchreiber` erzeugt innerhalb einer Sitzung streng steigende Ereignisnummern und uebergibt die Ereignisse an die bestehende `EreignisZentrale`.

Zeitpunkte werden von der aufrufenden Laufzeit uebergeben. Block 4 verwendet fuer fachliche Daten weder `Date.now()` noch Zufall als versteckte Eingabe. Damit bleiben Aufzeichnung und spaetere Wiederholung nachvollziehbar.

Ein fehlerhafter Ereignisempfaenger stoppt die Ereignisverteilung nicht. Die bestehende EreignisZentrale isoliert Empfaengerfehler; Telemetrie darf dadurch keine sichere Spielfunktion blockieren.

## Entscheidungs- und Aktionsspuren

`EntscheidungsAktionsSpur` schreibt zwei klar getrennte Ereignisarten:

- `entscheidung_getroffen`
- `aktionsphase`

Eine Entscheidung enthaelt mindestens Kennung, Ablauf, Quelle, Entscheidung und Grund. Eine Aktionsphase enthaelt mindestens Aktionskennung, Ablauf, Phase und Grund. Fachdetails koennen als strukturierte Details ergaenzt werden.

Damit koennen spaetere Wiederholungen nicht nur sehen, welcher Spielzustand vorlag, sondern auch welche Entscheidung daraus entstand und wie sich die zugehoerige Aktion entwickelte.

## Flugschreiber

`Flugschreiber` besitzt zwei begrenzte Ebenen:

1. einen Ringpuffer fuer die letzten Minuten beziehungsweise die konfigurierten Eintrags-, Byte- und Altersgrenzen,
2. ein offenes Wiederholungssegment mit eigener Eintrags-, Byte- und Altersgrenze.

Der Ringpuffer behaelt bevorzugt die neuesten Eintraege. Zu alte Eintraege oder alte normale Diagnoseeintraege duerfen aus diesem Kurzzeitpuffer entfernt werden, weil der Ringpuffer nur die unmittelbare Diagnoseumgebung darstellt.

Wiederholungssegmente werden dagegen erst nach einem sauberen Abschluss ausgegeben. Jedes Segment enthaelt:

- `segmentKennung`
- `sitzungKennung`
- Erstellzeit
- ZeitraumStart und ZeitraumEnde
- SequenzStart und SequenzEnde
- Ereignisanzahl
- Bytegroesse
- SHA-256
- den tatsaechlichen zeilenweisen JSON-Inhalt

Der SHA-256 wird ueber exakt den gespeicherten Segmentinhalt gebildet. Dadurch kann der spaetere Archiv-Abgleich pruefen, ob dieselben Bytes angekommen sind.

Kann ein Ereignis nicht als JSON serialisiert werden oder ist ein einzelner Eintrag groesser als das Segmentlimit, wird der Eintrag mit einem Diagnosegrund abgelehnt. Die Spiellogik wird dadurch nicht angehalten.

## Dauertelemetrie und Neustarts

`TelemetrieSpeicher` arbeitet gegen die kleine Schnittstelle `TelemetrieAblage`. Fuer Browser- beziehungsweise Adventure-Land-nahe Schluessel/Wert-Speicher gibt es `SchluesselWertTelemetrieAblage`.

Der Dauerzustand ist fest versioniert und enthaelt:

- Laufzeitabschnitte
- Leistungszaehler
- Dienstverbrauch
- vollstaendig abgeschlossene Wiederholungssegmente
- fertige Vorfallpakete

Jeder Eintrag besitzt eine eindeutige Kennung. Beim Laden nach einem Neustart werden die bereits vorhandenen Kennungen rekonstruiert. Wird derselbe Eintrag erneut angeboten, wird er nicht ein zweites Mal gezaehlt.

Laufzeit wird nicht als immer weiter erhoehter Einzelzaehler gespeichert, sondern als eindeutig gekennzeichnete Zeitintervalle. Bei der Auswertung werden ueberlappende Intervalle vereinigt. Zwei sich ueberschneidende Laufzeitabschnitte koennen deshalb keine doppelte Laufzeit erzeugen.

## 24-Stunden-Auswertung

`fasseLeistungZusammen(zeitraumStart, zeitraumEnde)` wertet genau den angegebenen Zeitraum aus. Dadurch kann die spaetere Berichtserstellung jeden frei gewaehlten 24-Stunden-Zeitraum verwenden und ist nicht an Kalendertage gebunden.

Erfasst werden mindestens:

- Gesamtlaufzeit
- Verbindungsabbrueche
- automatisch behobene Stoerungen
- ungefangene Fehler
- Neustarts
- Laufzeit je Charakter
- Erfahrung je Charakter
- Gold je Charakter
- Tode je Charakter
- Rueckzuege je Charakter
- Erfahrung pro Stunde
- Gold pro Stunde

Die Zusammenfassung enthaelt zusaetzlich `vollstaendig`, `datenVon` und `datenBis`. Ein unvollstaendig abgedeckter Zeitraum wird damit nicht stillschweigend als vollstaendige Nullmessung dargestellt.

## Geschuetzte Rohdaten

Wiederholungssegmente und Vorfallpakete sind geschuetzte Belege. Die normale Alters- und Platzbereinigung darf sie nicht automatisch entfernen.

Sie koennen erst ueber die ausdruecklichen Methoden

- `entferneWiederholungsSegmentNachArchivierung`
- `entferneVorfallPaketNachArchivierung`

freigegeben werden. Diese Methoden sind fuer den spaeteren bestaetigten Archiv-Abgleich vorgesehen.

Ist die feste Dauertelemetrie-Kapazitaet durch geschuetzte Daten erschoepft, wird ein weiteres geschuetztes Objekt nicht aufgenommen. Bereits vorhandene Belege bleiben erhalten. `TelemetrieZentrale` meldet solche Kennungen in `nichtDauerhaftGespeichert`, damit die Laufzeit die nicht sicherheitskritische Datenerfassung reduzieren kann.

## Externe Dienste und Kontingente

`erstelleDienstVerbrauchsEintrag` verbindet einen lokalen `VerbrauchsStand` mit der zugehoerigen `KontingentEntscheidung`.

Gespeichert werden gleichzeitig:

- lokal reservierter Verbrauch
- vom Anbieter gemeldeter Verbrauch
- Dienst, Grenze und Zeitfenster
- Schutzstufe
- erlaubt oder blockiert
- begruendender Text
- Vorgangskennung

`schreibeDienstVerbrauchsEreignis` erzeugt daraus entweder `dienst_verbrauch_erfasst` oder `dienst_anfrage_blockiert`.

Ein blockierter externer Dienst bleibt damit nachvollziehbar, ohne dass die lokale Spiellogik auf den Anbieter warten muss.

## Vorfallerkennung

`VorfallErkennung` verarbeitet explizite `AblaufBeobachtung`-Werte. Sie erkennt vier Arten:

- `stillstand`
- `schleife`
- `zeitueberschreitung`
- `unerwarteter_zustandswechsel`

### Stillstand

Ein Stillstand liegt vor, wenn seit `letzterFortschrittAm` laenger als die konfigurierte Grenze kein Fortschritt gemeldet wurde.

### Schleife

Eine Schleife liegt vor, wenn sich Zustands- und Entscheidungsmuster innerhalb des begrenzten Schleifenfensters mehrfach wiederholen, ohne dass sich die Fortschrittskennung aendert.

### Zeitueberschreitung

Besitzt ein Ablauf ein Zeitlimit, wird eine Ueberschreitung ab Erreichen dieser Grenze erkannt.

### Unerwarteter Zustandswechsel

Eine Beobachtung kann die erlaubten Folgezustaende angeben. Wechselt der naechste Zustand ausserhalb dieser Menge, wird ein Vorfall erzeugt.

Gleiche aktive Bedingungen erzeugen nicht bei jeder Probe einen neuen identischen Vorfall. Erst wenn Fortschritt oder Lauf neu beginnen, kann dieselbe Vorfallart erneut gemeldet werden.

## Vorfallpakete

`VorfallPaketSammler` nimmt beim Erkennen eines Vorfalls einen begrenzten Ausschnitt aus dem Flugschreiber vor dem Fehler auf und sammelt fuer eine ebenfalls begrenzte Zeit Ereignisse nach dem Fehler.

Jedes fertige Paket enthaelt:

- den strukturierten Vorfall
- die erklaerende BotMeldung
- Ereignisse vor dem Erkennungszeitpunkt
- Ereignisse nach dem Erkennungszeitpunkt
- Erstell- und Abschlusszeit
- die Kennzeichnung `gekuerzt`, falls Eintrags- oder Bytegrenzen erreicht wurden

Auch die Anzahl gleichzeitig offener Vorfallpakete ist fest begrenzt. Muss ein altes Paket wegen dieser Grenze vorzeitig geschlossen werden, wird es als gekuerzt markiert und nicht stillschweigend verworfen.

## TelemetrieZentrale

`TelemetrieZentrale` verbindet die einzelnen Bausteine:

- sie abonniert alle `BotEreignis`-Eintraege der `EreignisZentrale`,
- fuehrt sie dem Flugschreiber zu,
- speichert abgeschlossene Wiederholungssegmente begrenzt dauerhaft,
- prueft Ablaufbeobachtungen auf Vorfaelle,
- oeffnet und schliesst Vorfallpakete,
- speichert fertige Vorfallpakete begrenzt dauerhaft,
- nimmt Laufzeit-, Leistungs- und Dienstverbrauchswerte auf.

Sie liefert abgeschlossene Segmente und Vorfallpakete zusaetzlich an den Aufrufer zur spaeteren Plattform- oder Archivverarbeitung zurueck.

## Abschlusspruefung fuer Block 4

Automatisch geprueft werden mindestens:

- SHA-256 gegen einen bekannten Testvektor
- harte Eintrags-, Byte- und Altersgrenzen des Ringpuffers
- Segmentabschluss mit Sequenzbereich, Groesse und passendem SHA-256
- Neustart mit erneutem Laden desselben Dauerzustands
- keine Doppelzaehlung einer bereits bekannten Kennung
- ueberlappende Laufzeitintervalle werden nur einmal gezaehlt
- frei gewaehlter 24-Stunden-Zeitraum wird korrekt zusammengefasst
- Stillstand wird absichtlich erzeugt und erkannt
- Zeitueberschreitung wird erkannt
- unerwarteter Zustandswechsel wird erkannt
- eine wiederholte Entscheidungsschleife wird erkannt
- jede Vorfallmeldung enthaelt Ursache, Bot-Reaktion und Nutzeraktion
- Vorfallpaket enthaelt Daten vor und nach der Erkennung
- blockierte Dienstanfrage speichert lokalen und Anbieter-Verbrauch sowie Schutzstufe
- geschuetzte Wiederholungssegmente werden bei Speicherknappheit nicht automatisch verdraengt
- TelemetrieZentrale speichert abgeschlossene Segmente und Vorfallpakete

## Adventure-Land-Test

Block 4 besitzt weiterhin keinen aktiven Adventure-Land-Aktionsadapter. Die neuen Bausteine arbeiten rein beobachtend beziehungsweise lokal. Die Abschlusspruefung wird daher deterministisch mit synthetischen Laufzeitereignissen und Fehler-Einspritzung ausgefuehrt.

Wenn fuer einen spaeteren Integrationsstand ein zeitlich begrenzter Adventure-Land-Livetest hinzugefuegt wird, gilt die allgemeine Testregel aus `TESTPLAN.md`: Die verbleibende Testzeit wird sichtbar in der Titelleiste der V4-Testkonsole angezeigt.
