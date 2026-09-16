# Archiv-Abgleich

Serverseitiger Dienst fuer grosse Langzeitdaten, Wiederholungen und Lerndatensaetze.

Die Plattform bindet einen S3-kompatiblen Objektspeicher an. Die erste vorgesehene Konfiguration ist Oracle Cloud Infrastructure Object Storage. Die Adventure-Land-Laufzeit kommuniziert niemals direkt mit dem Anbieter und besitzt keine S3-Zugangsdaten.

Der Archiv-Abgleich darf nur abgeschlossene, gepruefte Segmente hochladen. Eine Rohdatei darf erst nach erfolgreichem Lern-, Evaluations- und Sicherungsnachweis als loeschbar markiert werden. Goldene Wiederholungen und geschuetzte Vorfaelle sind von der normalen Bereinigung ausgenommen.
