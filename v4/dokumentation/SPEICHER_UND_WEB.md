# Speicher, Web-Oberflaeche und SFTP

## Aufgabenteilung

- Live-Daten: Cloud-/Datenbank-Speicher fuer schnelle Abfragen
- Web-Oberflaeche: HTTPS
- grosse historische Daten: Server-Dateisystem und SFTP-Archiv
- Tagesberichte: serverseitig erzeugen, speichern und versenden
- Quellcode: GitHub

Adventure Land spricht ausschliesslich per HTTPS mit einer begrenzten Schnittstelle. Es kennt keine SFTP-Zugangsdaten und keine E-Mail-Versandgeheimnisse.

## Archivinhalt

Das Archiv ist fuer Sitzungen, Vorfallpakete, Wiederholungen, Experimente, Lerndaten, Tagesberichte und Sicherungen vorgesehen.

Unvollstaendige Uebertragungen erhalten zuerst eine temporaere Endung. Erst nach erfolgreicher Pruefung wird das Paket als vollstaendig markiert. Dadurch wird niemals ein halbfertiger Datensatz analysiert.

## Tagesbericht

Der Server erzeugt aus den gespeicherten strukturierten Laufzeitdaten einmal taeglich einen Bericht ueber die vergangenen exakt 24 Stunden.

Der Bericht wird mindestens in der Web-Oberflaeche gespeichert. Optional wird er zusaetzlich per E-Mail verschickt.

Versandzeit, Zeitzone, Versandarten und Empfaengeradresse sind konfigurierbar. E-Mail-Zugangsdaten oder Versandschluessel existieren ausschliesslich serverseitig.

Ein Versandfehler darf die Adventure-Land-Laufzeit nicht beeinflussen. Bericht und Versandstatus werden getrennt gespeichert, damit eine fehlgeschlagene Zustellung wiederholt werden kann, ohne denselben Bericht doppelt zu erzeugen.

## Web-Oberflaeche

Die Web-Oberflaeche greift ueber die Server-Schnittstelle auf Daten zu. Der Browser liest keine SFTP-Dateien direkt und erhaelt keine SFTP-Schluessel.

Die Web-Oberflaeche zeigt spaeter den aktuellen Tagesbericht, historische Berichte, den Vergleich zum vorherigen Zeitraum und die eindeutige Angabe `Nutzer muss handeln: JA/NEIN`. Zusaetzlich ist eine Funktion `Bericht jetzt erstellen` vorgesehen.
