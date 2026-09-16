# Speicher, Web-Oberflaeche und SFTP

## Aufgabenteilung

- Live-Daten: Cloud-/Datenbank-Speicher fuer schnelle Abfragen
- Web-Oberflaeche: HTTPS
- grosse historische Daten: Server-Dateisystem und SFTP-Archiv
- Quellcode: GitHub

Adventure Land spricht ausschliesslich per HTTPS mit einer begrenzten Schnittstelle. Es kennt keine SFTP-Zugangsdaten.

## Archivinhalt

Das Archiv ist fuer Sitzungen, Vorfallpakete, Wiederholungen, Experimente, Lerndaten und Sicherungen vorgesehen.

Unvollstaendige Uebertragungen erhalten zuerst eine temporaere Endung. Erst nach erfolgreicher Pruefung wird das Paket als vollstaendig markiert. Dadurch wird niemals ein halbfertiger Datensatz analysiert.

## Web-Oberflaeche

Die Web-Oberflaeche greift ueber die Server-Schnittstelle auf Daten zu. Der Browser liest keine SFTP-Dateien direkt und erhaelt keine SFTP-Schluessel.
