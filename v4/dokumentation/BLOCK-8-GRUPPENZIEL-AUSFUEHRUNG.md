# Block 8 – minimaler Gruppenziel-Ausfuehrungspfad

Status: **Adapter, gebundene Einmal-Freigabe, feste Ausfuehrungsbruecke, one-shot Live-Bindung und kontrollierte Live-Smoke-Huelle implementiert und offline getestet; echter Live-Smoke noch nicht ausgefuehrt**.

## Entscheidung fuer die erste Aktion

Als erster und einziger aktiver Block-8-Adapter wird `GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN` vorbereitet.

`GRUPPE_UNTERSTUETZEN`, Heilen, Schutz und Aggro werden bewusst noch nicht aktiv umgesetzt. Deren konkrete Adventure-Land-Skill-Semantik ist noch nicht eng genug festgelegt, um ohne Raten einen sicheren Aufruf zu erlauben.

Der gemeinsame Zielschaden besitzt dagegen eine eindeutige minimale Abbildung:

`GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN -> attack(sichtbaresGemeinsamesZiel)`

## Harte Freigabegrenzen

`AdventureLandGruppenZielAusfuehrung` liegt ausschliesslich unter `laufzeit/quelle/ausfuehrung/` und startet mit `aktivFreigegeben: false`.

Eine persistente boolesche Freigabe reicht nicht mehr aus. Zusaetzlich ist eine `AdventureLandGruppenZielEinmalFreigabe` erforderlich. Sie wird mit dem exakten Text `BLOCK8-GRUPPENZIEL-EINMAL-FREIGEBEN` an genau eine AktionsAnfrage-Kennung gebunden und beim ersten Ausfuehrungsversuch **vor allen weiteren dynamischen Checks** verbraucht. Damit bleibt der Adapter nach Erfolg, Safety-Wechsel, Ressourcenverlust oder anderem Fehler automatisch wieder gesperrt.

Auch mit expliziter Aktivierung und gebundener Einmal-Freigabe wird vor `attack(...)` erneut verlangt:

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

## One-shot Testwerkzeug

`v4/werkzeuge/block8-gruppenziel-one-shot.js` stellt `V4Block8GruppenZielOneShot` bereit.

Das Werkzeug:

- startet gesperrt,
- erzeugt zuerst eine read-only Vorschau ueber den vorhandenen zentralen Block-8-Schattenpfad,
- laesst nur `gemeinsames_ziel_bearbeiten` / `GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN` zu,
- prueft aktuelle Block-7-Safety, Angriffsbereitschaft, Ziel und Reichweite erneut read-only,
- verlangt den exakten Freigabetext,
- bindet die Freigabe an genau die in der Vorschau gestartete AktionsAnfrage und ihr Ziel,
- sperrt **vor** jeder spaeteren Delegation automatisch wieder,
- besitzt selbst keinen Adventure-Land-Aktionsaufruf.

Eine echte Delegation ist nur an die feste API `V4Block8GruppenZielAusfuehrungsBruecke` erlaubt. Diese muss sich mit `quelleBereich: "ausfuehrung"` und dem exakt erlaubten Aktionsnamen ausweisen.

## Feste Produktionsbruecke

`v4/laufzeit/quelle/ausfuehrung/adventure-land-gruppen-ziel-ausfuehrungs-bruecke.ts` implementiert diesen Vertrag jetzt als Produktionsklasse.

Die Bruecke ist selbst standardmaessig gesperrt und jede aktivierte Instanz besitzt genau **einen** Ausfuehrungsversuch. Dieser Versuch wird vor der weiteren Auftragsvalidierung verbraucht. Die Bruecke:

- akzeptiert nur `schemaVersion: 1`, den exakten Aktionsnamen und den exakten One-shot-Freigabetext,
- verwirft alte oder zukuenftige Freigaben,
- rekonstruiert die Anfrage ausschliesslich aus der zentralen `AktionsSteuerung`,
- verlangt weiterhin den Zustand `laeuft`, Herkunft `gruppen-aktionsplanung` und ein noch gueltiges Zeitfenster,
- vergleicht die Zielkennung des Browserauftrags mit der zentral laufenden Anfrage,
- **ignoriert Browser-Vorpruefungen als Autoritaet**,
- verlangt stattdessen eine neue Produktions-`KampfSicherheitsEntscheidung`, die nicht aelter als die explizite One-shot-Freigabe ist,
- erzeugt intern eine frische gebundene `AdventureLandGruppenZielEinmalFreigabe`,
- delegiert danach ausschliesslich an `AdventureLandGruppenZielAusfuehrung`,
- ruft selbst keine Adventure-Land-Spielaktion direkt auf,
- bricht eine passende noch laufende zentrale Anfrage fail-safe ab, wenn der verbrauchte Brueckenversuch scheitert.

## One-shot Live-Bindung

`v4/laufzeit/quelle/ausfuehrung/adventure-land-gruppen-ziel-live-bindung.ts` bindet die feste Produktionsbruecke an genau eine bereits vorhandene zentrale `AktionsSteuerung` und eine injizierte Produktions-Sicherheitsquelle.

Die Bindung:

- startet ebenfalls gesperrt,
- verlangt den separaten exakten Freigabetext `BLOCK8-GRUPPENZIEL-LIVE-BINDUNG-EINMAL`,
- erzeugt keine zweite `AktionsSteuerung`,
- uebernimmt keine Browser-/Schatten-Safety als Produktionsautoritaet,
- ruft die injizierte Produktions-Sicherheitsquelle erst unmittelbar waehrend des delegierten Versuchs auf,
- exponiert ausschliesslich eine eingefrorene Fassade unter `V4Block8GruppenZielAusfuehrungsBruecke`,
- ueberschreibt keine bereits vorhandene globale Laufzeitautoritaet,
- entfernt ihre eigene globale Fassade **vor** der Delegation,
- kann auch ueber eine zuvor behaltene Referenz niemals zweimal delegieren,
- blockiert bei manipulierter/ersetzter Fassade vor der Spielaktion und bricht die passende laufende Gruppenanfrage fail-safe ab,
- besitzt selbst keinen direkten Adventure-Land-Spielaufruf.

## Aktueller Freigabestand

Adapter, Produktionsbruecke und Live-Bindung sind implementiert und offline abgesichert. Der **kontrollierte one-shot Live-Smoke wurde weiterhin nicht ausgefuehrt**. Fuer eine echte Abnahme muss die Bindung im Adventure-Land-Kontext bewusst mit der realen zentralen Steuerung und einer frisch berechneten Produktions-`KampfSicherheitsEntscheidung` instanziiert werden. Bis zu dieser expliziten Aktivierung bleibt keine globale Ausfuehrungsbruecke installiert.

Automatisiert werden unter anderem geprueft:

- Default-Lock bleibt reiner Schatten und ruft `attack` nicht auf,
- der exakt freigegebene Erfolgsfall ruft `attack` genau einmal auf und verbraucht die Einmal-Freigabe vorher,
- verlorener Ressourcenbesitz blockiert,
- Safety-Wechsel und stale Safety blockieren,
- unbekannte Angriffsbereitschaft blockiert,
- unsichtbares, totes oder zu weit entferntes Ziel blockiert,
- abgelaufene, falsch gebundene oder bereits verbrauchte Einmal-Freigaben blockieren,
- die feste Produktionsbruecke akzeptiert pro Instanz hoechstens einen Versuch und vertraut nicht auf Browser-Safety als Autoritaet,
- die Live-Bindung ueberschreibt keine bestehende Autoritaet und entfernt ihre Fassade vor Delegation,
- die Live-Bindung liest Produktions-Safety erst beim Versuch und kann nicht zweimal delegieren,
- das Browser-One-shot delegiert hoechstens einmal und bleibt ohne explizit installierte Live-Bindung gesperrt,
- alle anderen `GRUPPE_*`-Aktionsnamen besitzen keinen aktiven Pfad.

Der naechste Schritt nach gruenem Merge ist die **kontrollierte Vorbereitung und Durchfuehrung des one-shot Live-Smokes** mit exakt definiertem Charakter, Server, Karte und Ziel. Vor der echten Aktion muss die Produktions-Safety frisch berechnet werden; nach dem Versuch muessen globale Fassade, zentrale Aktionsphase und Ressourcensperren ausgewertet werden.


## Kontrollierter Live-Smoke

Die Produktions-Smoke-Huelle `AdventureLandGruppenZielLiveSmoke` bindet den Versuch an exakten Charakter, Server, Karte, Instanz, Ziel und Monsterart sowie an genau eine real laufende zentrale Gruppenanfrage.

Sie besitzt ein Produktions-Aktionsaudit: `attack` wird gezaehlt, jede andere ueber diesen Pfad angeforderte Adventure-Land-Aktion wird vor Ausfuehrung blockiert. Nach Erfolg muessen zentrale Phase `abgeschlossen`, keine verbleibende Ressourcensperre und keine globale Ausfuehrungsbruecke mehr vorhanden sein.

Der Browser-Runner `V4Block8GruppenZielLiveSmokeRunner` zeigt zuerst diese reale Produktionsvorschau und verlangt danach den exakten Starttext `BLOCK8-GRUPPENZIEL-LIVE-SMOKE-STARTEN`. Er besitzt selbst keinen Spielaufruf.

Details und PASS/FAIL-Kriterien: `BLOCK-8-GRUPPENZIEL-LIVE-SMOKE.md`.

Der echte Smoke bleibt offen, weil V4 aktuell noch keinen Produktions-Bootstrap besitzt, der die TypeScript-Laufzeit im Adventure-Land-Kontext instanziiert und die Smoke-Fassade installiert.
