# Speicher, Web-Oberflaeche und Objektspeicher

## Aufgabenteilung

- Live-Daten: Cloud-/Datenbank-Speicher fuer schnelle Abfragen
- Web-Oberflaeche: HTTPS
- grosse historische Daten: lokaler begrenzter Puffer und S3-kompatibler Objektspeicher
- Tagesberichte: serverseitig erzeugen, speichern und versenden
- Quellcode: GitHub

Adventure Land spricht ausschliesslich per HTTPS mit einer begrenzten Schnittstelle. Es kennt keine Objektspeicher-Zugangsdaten und keine E-Mail-Versandgeheimnisse.

Der Objektspeicher wird provider-neutral ueber eine S3-kompatible Schnittstelle angebunden. Die erste vorgesehene Konfiguration ist Oracle Cloud Infrastructure Object Storage. Ein spaeterer Wechsel zu einem anderen S3-kompatiblen Anbieter darf keine Aenderung an Wiederholungs-, Lern- oder Fachlogik erfordern.

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

Die Prozentwerte beziehen sich auf das sichere V4-Budget und nicht direkt auf das Anbietermaximum.

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

## Tagesbericht

Der Server erzeugt aus den gespeicherten strukturierten Laufzeitdaten einmal taeglich einen Bericht ueber die vergangenen exakt 24 Stunden.

Der Bericht wird mindestens in der Web-Oberflaeche gespeichert. Optional wird er zusaetzlich per E-Mail verschickt.

Versandzeit, Zeitzone, Versandarten und Empfaengeradresse sind konfigurierbar. E-Mail-Zugangsdaten oder Versandschluessel existieren ausschliesslich serverseitig.

Ein Versandfehler darf die Adventure-Land-Laufzeit nicht beeinflussen. Bericht und Versandstatus werden getrennt gespeichert, damit eine fehlgeschlagene Zustellung wiederholt werden kann, ohne denselben Bericht doppelt zu erzeugen.

## Web-Oberflaeche

Die Web-Oberflaeche greift ueber die Server-Schnittstelle auf Daten zu. Der Browser liest keine Objektspeicher-Dateien direkt und erhaelt keine S3- oder Anbieter-Schluessel.

Die Web-Oberflaeche zeigt spaeter den aktuellen Tagesbericht, historische Berichte, den Vergleich zum vorherigen Zeitraum und die eindeutige Angabe `Nutzer muss handeln: JA/NEIN`. Zusaetzlich ist eine Funktion `Bericht jetzt erstellen` vorgesehen.

Fuer den Speicher-Lern-Zyklus soll sie mindestens sichere Speicherauslastung, aktuelle Zyklusphase, letzten erfolgreichen Lernzyklus, geschuetzte Datenmenge und die Menge bereits verarbeiteter loeschbarer Rohdaten anzeigen.
