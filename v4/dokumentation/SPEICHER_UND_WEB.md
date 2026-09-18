# Speicher, Web-Oberflaeche und Objektspeicher

## Aufgabenteilung

- Live-Daten: Cloud-/Datenbank-Speicher fuer schnelle Abfragen
- Web-Oberflaeche: HTTPS
- grosse historische Daten: lokaler begrenzter Puffer und S3-kompatibler Objektspeicher
- Tagesberichte: serverseitig erzeugen, speichern und versenden
- Quellcode: GitHub

Adventure Land spricht ausschliesslich per HTTPS mit einer begrenzten Schnittstelle. Es kennt keine Objektspeicher-Zugangsdaten und keine E-Mail-Versandgeheimnisse.


## Lokale 1-TB-SSD

Die vorhandene 1-TB-SSD ist eine feste V4-Speicherstufe. Sie dient als lokaler Hot-/Warm-Speicher und entkoppelt die Adventure-Land-Laufzeit von Netzwerk, Plattform und Objektspeicher.

Die SSD uebernimmt insbesondere:

- `outbox` – noch nicht bestaetigt uebertragene Segmente und Metadaten
- `sitzungen` und `telemetrie` – aktuelle Rohdaten und abgeschlossene lokale Segmente
- `blackbox` – rollierende Detailaufzeichnung fuer die Zeit vor und nach Stoerungen
- `vorfaelle` und `wiederholungen` – geschuetzte Fehlerfaelle und lokal schnell verfuegbare Replays
- `lerndaten` – Arbeitsbereich fuer vorbereitete und validierte Lerndatensaetze
- `verarbeitung` – temporaere, erneut erzeugbare Zwischenprodukte

Als erster Planwert werden ungefaehr 750 GB fuer V4 aktiv eingeplant. Mindestens 15 bis 20 Prozent der real nutzbaren SSD-Kapazitaet bleiben als Reserve frei. Die genaue Verteilung wird konfigurierbar umgesetzt und spaeter anhand gemessener Datenmengen angepasst.

Die lokale Speicherverwaltung unterscheidet drei Schutzklassen:

- Klasse A `kritisch`: Outbox, noch nicht replizierte Daten, Vorfallpakete und Manifeste; niemals allein wegen Speicherknappheit automatisch loeschen
- Klasse B `wertvoll`: Rohsitzungen, Wiederholungen, Lerndaten und Experimente; nur nach bestaetigtem Sicherungs- beziehungsweise Lernzyklus freigeben
- Klasse C `wiederherstellbar`: Caches, temporaere Dateien und neu erzeugbare Ableitungen; bei Speicherknappheit zuerst bereinigen

Die SSD ist kein alleiniger Backup-Speicher. Kritische und wertvolle Daten muessen zusaetzlich auf der Plattform, im Objektspeicher oder einem getrennten Langzeitarchiv vorhanden sein. Ein SSD- oder Rechnerausfall darf nicht alle historischen Daten vernichten.

Lokale Schreibvorgaenge werden gebuendelt und segmentiert. V4 erzeugt nicht fuer jedes Ereignis eine einzelne Datei. Abgeschlossene Segmente erhalten Groesse, Sequenzbereich und SHA-256, bevor sie asynchron uebertragen werden.

Eine bestaetigte Uebertragung fuehrt nicht automatisch zur sofortigen Loeschung der lokalen Kopie. Die Freigabe richtet sich nach Schutzklasse, Aufbewahrungsregel und dem Speicher-Lern-Zyklus.


Der Objektspeicher wird provider-neutral ueber eine S3-kompatible Schnittstelle angebunden. Die erste vorgesehene Konfiguration ist Backblaze B2 Cloud Storage. Ein spaeterer Wechsel zu einem anderen S3-kompatiblen Anbieter darf keine Aenderung an Wiederholungs-, Lern- oder Fachlogik erfordern.

## Datenklassen

Das Archiv trennt Daten nach Lebensdauer und Zweck:

- `roh` – vollstaendige Wiederholungs- und Beobachtungsdaten; gross und grundsaetzlich temporaer
- `lerndatensatz` – versionierte, aus Rohdaten abgeleitete Lernbeispiele
- `wissen` – dauerhaft gesicherte Modelle, Gewichtungen, Statistiken und zugehoerige Metadaten
- `goldene_wiederholung` – kleiner dauerhaft erhaltener Wiederholungssatz fuer Regressionstests
- `vorfall` – seltene Fehler-, Todes-, Wiederherstellungs- und Sicherheitsfaelle mit hoeherer Aufbewahrungsprioritaet
- `bericht` – Tagesberichte und ihre Zustellungszustaende

Rohdaten und Lerndaten werden niemals als dieselbe Datenklasse behandelt. Ein spaeter neu benoetigtes Lernmerkmal soll soweit moeglich aus unveraenderten Rohdaten neu abgeleitet werden koennen.

## Speicher-Lern-Zyklus

Der sichere nutzbare Speicher ist kleiner als das Anbietermaximum. Der `KontingentWaechter` reserviert den Anbieter-Sicherheitspuffer; der Speicher-Lern-Zyklus arbeitet ausschliesslich mit dem danach noch sicheren Budget.

Die Standardstufen des Zyklus sind:

- unter 60 Prozent – normal sammeln
- ab 60 Prozent – Lerndatensatz vorbereiten
- ab 75 Prozent – Lernlauf starten, sobald der Datensatz bestaetigt ist
- ab 85 Prozent – Datenerfassung bei Bedarf reduzieren und verarbeitete Daten nach erfolgreichem Zyklus freigeben
- ab 95 Prozent – Notfallstufe; Datenerfassung reduzieren oder pausieren, aber keine unverarbeiteten Rohdaten automatisch loeschen
- nach erfolgreicher Bereinigung – Zielwert 50 Prozent des sicheren Budgets

Die Prozentwerte beziehen sich auf das sichere V4-Budget und nicht direkt auf das Anbietermaximum. Bei einem kostenlosen Anbieterwechsel bleibt dieselbe Logik bestehen; nur das gepruefte `DienstProfil` und damit das sichere Byte-Budget aendern sich.

Eine Rohdatei darf erst als loeschbar markiert werden, wenn fuer den zugehoerigen Lernzyklus alle vier Nachweise vorliegen:

1. der versionierte Lerndatensatz wurde erfolgreich erstellt,
2. der Lernlauf wurde erfolgreich abgeschlossen,
3. die Evaluation hat bestanden,
4. das resultierende Wissen wurde dauerhaft gespeichert.

Fehlt nur einer dieser Nachweise, bleibt die automatische Datenfreigabe gesperrt. Speicherknappheit darf dann die Aufzeichnung reduzieren, aber nicht stillschweigend unverarbeitete Belege vernichten.

Goldene Wiederholungen, ausgewaehlte seltene Situationen und wichtige Vorfaelle werden unabhaengig vom normalen Rohdaten-Zyklus geschuetzt. Sie duerfen nicht durch die normale Speicherbereinigung entfernt werden.

## Archivuebertragung

Wiederholungsdaten werden lokal zuerst in begrenzten Segmenten abgeschlossen. Fuer jedes abgeschlossene Segment werden mindestens Groesse, Sequenzbereich und SHA-256 festgehalten. Erst danach wird das Segment asynchron in den Objektspeicher uebertragen.

Die Spiellogik wartet niemals auf den Objektspeicher. Netzwerkfehler fuehren zu begrenzter lokaler Pufferung und exponentieller Wiederholung. Eine volle lokale Warteschlange darf die sichere Spiellogik nicht blockieren.

Unvollstaendige Multipart-Uebertragungen gelten nicht als archivierte Daten. Ein Segment wird erst nach erfolgreicher Uebertragung und Pruefung im Sitzungsmanifest als dauerhaft vorhanden markiert. Dadurch wird kein halbfertiger Datensatz analysiert oder geloescht.

## Zugangsdaten

Objektspeicher-Zugangsdaten existieren ausschliesslich auf der Plattformseite. Sie werden weder in Adventure Land noch an die Web-Oberflaeche ausgeliefert und niemals in Git eingecheckt.

Die Plattformkonfiguration enthaelt nur serverseitig unter anderem Anbieter, S3-Endpunkt, Region, Bucket und Zugangsschluessel. Anbietergrenzen wie Speicher oder API-Anfragen werden nicht als geheime Umgebungswerte geraten, sondern ueber ein geprueftes und zeitlich begrenztes `DienstProfil` verwaltet.

Fuer Backblaze B2 werden ein eigener Bucket und ein eingeschraenkter Application Key verwendet. Der Master-Schluessel wird nicht fuer die S3-kompatible Schnittstelle eingesetzt.

## Tagesbericht

Der Server erzeugt aus den gespeicherten strukturierten Laufzeitdaten einmal taeglich einen Bericht ueber die vergangenen exakt 24 Stunden.

Der Bericht wird mindestens in der Web-Oberflaeche gespeichert. Optional wird er zusaetzlich per E-Mail verschickt.

Versandzeit, Zeitzone, Versandarten und Empfaengeradresse sind konfigurierbar. E-Mail-Zugangsdaten oder Versandschluessel existieren ausschliesslich serverseitig.

Ein Versandfehler darf die Adventure-Land-Laufzeit nicht beeinflussen. Bericht und Versandstatus werden getrennt gespeichert, damit eine fehlgeschlagene Zustellung wiederholt werden kann, ohne denselben Bericht doppelt zu erzeugen.

## Web-Oberflaeche

Die Web-Oberflaeche greift ueber die Server-Schnittstelle auf Daten zu. Der Browser liest keine Objektspeicher-Dateien direkt und erhaelt keine S3- oder Anbieter-Schluessel.

Die Web-Oberflaeche zeigt spaeter den aktuellen Tagesbericht, historische Berichte, den Vergleich zum vorherigen Zeitraum und die eindeutige Angabe `Nutzer muss handeln: JA/NEIN`. Zusaetzlich ist eine Funktion `Bericht jetzt erstellen` vorgesehen.

Fuer den Speicher-Lern-Zyklus soll sie mindestens sichere Speicherauslastung, aktuelle Zyklusphase, letzten erfolgreichen Lernzyklus, geschuetzte Datenmenge und die Menge bereits verarbeiteter loeschbarer Rohdaten anzeigen.
