# Block 8 – minimaler Gruppenziel-Ausfuehrungspfad

Status: **implementiert, standardmaessig gesperrt, nur offline getestet; keine Live-Freigabe**.

## Entscheidung fuer die erste Aktion

Als erster und einziger aktiver Block-8-Adapter wird `GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN` vorbereitet.

`GRUPPE_UNTERSTUETZEN`, Heilen, Schutz und Aggro werden bewusst noch nicht aktiv umgesetzt. Deren konkrete Adventure-Land-Skill-Semantik ist noch nicht eng genug festgelegt, um ohne Raten einen sicheren Aufruf zu erlauben.

Der gemeinsame Zielschaden besitzt dagegen eine eindeutige minimale Abbildung:

`GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN -> attack(sichtbaresGemeinsamesZiel)`

## Harte Freigabegrenzen

`AdventureLandGruppenZielAusfuehrung` liegt ausschliesslich unter `laufzeit/quelle/ausfuehrung/` und startet mit `aktivFreigegeben: false`.

Auch mit expliziter Aktivierung wird vor `attack(...)` erneut verlangt:

- die Anfrage wurde von der zentralen `AktionsSteuerung` gestartet und ist weiterhin `laeuft`,
- `angefordertVon` ist exakt `gruppen-aktionsplanung`,
- der Aktionsname ist exakt `GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN`,
- die Details beschreiben einen geplanten Schadensschritt auf ein Gegnerziel,
- die Anfrage benoetigt exakt `gruppe` und `kampfziel`,
- beide Ressourcen gehoeren unmittelbar vor der Ausfuehrung weiterhin derselben Anfrage,
- eine Kampfsicherheitsentscheidung ist nicht in der Zukunft, nicht aelter als der Gruppenplan und hoechstens 1500 ms alt,
- `normalAktionenErlaubt` ist wahr, die Sicherheitsaktion ist `keine` und die Gefahrenstufe ist exakt `sicher`,
- Adventure Land meldet den normalen Angriff explizit als `bereit`,
- das gemeinsame Ziel ist weiterhin sichtbar und bestaetigt lebendig,
- der lokale Charakter ist bestaetigt lebendig,
- Ziel und Charakter liegen, soweit beobachtbar, auf derselben Karte,
- das Ziel befindet sich unmittelbar vor dem Aufruf in aktueller Angriffsreichweite.

Jede fehlende oder widerspruechliche Voraussetzung bricht die zentrale Gruppenanfrage ab und gibt deren Ressourcen frei. Es wird nichts geraten.

## Aktueller Freigabestand

Die neue Ausfuehrungsgrenze besitzt noch **keinen Browser-Live-Runner und keine one-shot-Freigabe**. Der Produktionsadapter allein macht deshalb keinen Live-Smoke moeglich.

Automatisiert werden unter anderem geprueft:

- Default-Lock bleibt reiner Schatten und ruft `attack` nicht auf,
- der exakt freigegebene Erfolgsfall ruft `attack` genau einmal auf,
- verlorener Ressourcenbesitz blockiert,
- Safety-Wechsel und stale Safety blockieren,
- unbekannte Angriffsbereitschaft blockiert,
- unsichtbares, totes oder zu weit entferntes Ziel blockiert,
- alle anderen `GRUPPE_*`-Aktionsnamen besitzen keinen aktiven Pfad.

Der naechste Schritt nach gruenem Merge ist ein getrenntes read-only/one-shot Testwerkzeug mit automatischer Wiedersperrung. Erst danach darf ein kontrollierter Live-Smoke stattfinden.
