# Automatisierter Entwicklungsablauf

Ziel ist, dass der laufende Bot verwertbare Entwicklungsarbeit vorbereitet, ohne unkontrolliert selbst Code in Produktion zu bringen.

Ablauf:

1. Bot erkennt einen Vorfall oder eine wiederkehrende Auffaelligkeit.
2. Flugschreiber friert relevante Daten vor und nach dem Vorfall ein.
3. Vorfallpaket wird ueber HTTPS an die Plattform uebertragen.
4. Archivdienst speichert grosse Rohdaten serverseitig per SFTP.
5. Entwicklungsdienst gruppiert gleiche Vorfaelle.
6. Eine EntwicklungsAufgabe trennt beobachtete Fakten von Vermutungen.
7. Der Fehler muss nach Moeglichkeit in der Wiederholungsmaschine reproduziert werden.
8. Erst danach wird eine Codeaenderung vorbereitet.
9. Fuer den Fehler wird ein Regressionstest angelegt.
10. Gesamte V4-Pruefung und relevanter Wiederholungskorpus laufen.
11. Ein Branch und Pull Request werden vorbereitet.
12. Sicherheitsrelevante Spiellogik wird nicht ungeprueft automatisch verschmolzen.
