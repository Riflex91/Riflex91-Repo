# Entscheidung 0005 – Lokale 1-TB-SSD als feste Speicherstufe

Die vorhandene 1-TB-SSD wird fester Bestandteil der V4-Speicherarchitektur. Sie ist kein alleiniger Backup-Speicher, sondern die lokale schnelle und ausfallsichere Speicherstufe zwischen Adventure-Land-Laufzeit und serverseitiger Plattform beziehungsweise Objektspeicher.

## Verbindliche Aufgaben der SSD

Die SSD nimmt mindestens folgende Datenklassen auf:

- lokale Outbox fuer noch nicht bestaetigt uebertragene Daten
- aktuelle Rohtelemetrie und abgeschlossene Sitzungssegmente
- rollierende Blackbox-Daten fuer Vorfallanalyse
- geschuetzte Vorfallpakete und Wiederholungsdaten
- lokaler Arbeitsbereich fuer Lerndatensaetze und deren Aufbereitung
- temporaere Verarbeitungsdaten, die jederzeit neu erzeugt werden koennen

## Kapazitaetsregel

Von der real nutzbaren Kapazitaet werden standardmaessig hoechstens etwa 80 bis 85 Prozent fuer V4 eingeplant. Mindestens 15 bis 20 Prozent bleiben frei, damit Dateisystem, SSD und Verarbeitung auch unter Dauerbetrieb Reserve besitzen.

Als erster Planwert wird ein V4-Arbeitsbudget von ungefaehr 750 GB verwendet. Die genaue Aufteilung bleibt konfigurierbar und wird spaeter anhand realer Schreibmengen angepasst.

## Schutzklassen

- Klasse A `kritisch`: Outbox, noch nicht replizierte Daten, Vorfaelle und Manifeste; niemals allein wegen Speicherknappheit automatisch loeschen.
- Klasse B `wertvoll`: Rohsitzungen, Wiederholungen, Lerndaten und Experimente; erst freigeben, wenn die vorgeschriebenen Sicherungs- und Lernnachweise vorliegen.
- Klasse C `wiederherstellbar`: Caches, temporaere Dateien, abgeleitete Zwischenprodukte und neu erzeugbare Berichte; duerfen bei Speicherknappheit zuerst entfernt werden.

## Betriebsregel

Die Spiellogik darf niemals auf langsame Archiv- oder Cloud-Uebertragungen warten. Daten werden lokal segmentiert gespeichert, mit Integritaetsmerkmalen versehen und asynchron uebertragen. Erst eine bestaetigte Uebertragung beziehungsweise ein bestaetigter Sicherungszustand darf die lokale Freigabe erlauben.

Die SSD ersetzt keine zweite Kopie. Ein Defekt des Bot-Rechners oder der SSD darf nicht zum Verlust aller historischen Daten fuehren; wertvolle und kritische Daten muessen daher zusaetzlich auf der Plattform beziehungsweise im Objektspeicher oder Langzeitarchiv vorhanden sein.
