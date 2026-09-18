# Block 8 – V4 Produktions-Bootstrap

Status: **Produktions-Bootstrap, autonome Lebensnachweis-Laufzeit, HTTPS+SHA-256-Adventure-Land-Loader und reproduzierbarer Runtime-Build implementiert; Runtime 1.1.3 macht den 2-Sekunden-Gruppenheartbeat zum Produktionsdienst und verlangt die von Adventure Land bestaetigte `send_cm`-Empfaengerliste. Ein neuer immutable Release wird nach Merge automatisch gebaut und verifiziert.**

## Zweck

Der Bootstrap schliesst die bisherige Runtime-Luecke zwischen den getesteten TypeScript-Produktionskomponenten und dem Adventure-Land-Codekontext.

Er erzeugt keine neue Fachlogik und keine manuelle Gruppen-AktionsAnfrage.

Die produktive Kette bleibt:

`Adventure Land -> AdventureLandLesezugriff -> Spielzustand -> Produktions-Safety -> Gruppen-Lebensnachweis -> Gruppenkoordination -> Gruppenaktionsplan -> Whitelist-Uebersetzung -> zentrale AktionsSteuerung -> Live-Smoke -> Ausfuehrung`

## Eine zentrale AktionsSteuerung

`AdventureLandProduktionsBootstrap` besitzt genau eine `AktionsSteuerung`.

Gruppenarbeit wird ausschliesslich ueber:

- `koordiniereGruppe(...)`,
- `planeGruppenAktionen(...)`,
- `uebersetzeEigeneGruppenPlanSchritte(...)`,
- `uebergibGruppenAktionsAnfragenAnSteuerung(...)`

erzeugt und gestartet.

Der Bootstrap konstruiert keine fertige `AktionsAnfrage` und ruft `reicheAnfrageEin(...)` nicht direkt auf.

Fuer Block 8 ist weiterhin nur:

`gemeinsames_ziel_bearbeiten -> GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN`

freigegeben.

## Produktions-Safety

Safety wird nicht aus dem Browser-Schattenkern uebernommen.

Der Bootstrap liest den realen Adventure-Land-Zustand mit `AdventureLandLesezugriff`, erzeugt daraus einen neuen `Spielzustand` und ruft `planeKampfSicherheitsSchritt(...)` auf.

Der `KampfSicherheitsAblaufZustand` bleibt innerhalb derselben Bootstrap-Instanz erhalten.

## Gruppen-Lebensnachweise

Es wird der vorhandene `AdventureLandGruppenLebensnachweisAustausch` verwendet.

- Empfang bleibt namens- und protokollgebunden.
- Fremde `on_cm`-Nachrichten werden weiterhin an den vorherigen Handler weitergereicht.
- Senden ist nur bei aktiv freigegebenem Produktions-Bootstrap moeglich.
- Die eigene Teilnehmermeldung entsteht aus derselben Produktions-Safety wie die lokale Sicherheitsentscheidung.
- Replayte oder zeitlich aeltere Meldungen desselben Charakternamens ersetzen keinen neueren Stand.
- Zwei verschiedene Charakternamen duerfen nicht dieselbe `charakterKennung` beanspruchen; das blockiert die Gruppenplanung.
- Gruppenfaehigkeiten werden explizit konfiguriert; der Bootstrap leitet keine Rolle aus einer Klasse ab.
- Der aktive Gruppenziel-Smoke verlangt mindestens **zwei aktive, frische Teilnehmer**. Solo- oder stale-Peer-Zustaende starten keinen Gruppenauftrag.

## Globale Produktions-Laufzeit

`installiereAdventureLandProduktionsLaufzeit(...)` installiert:

`V4ProduktionsLaufzeit`

Die API ist eingefroren und startet standardmaessig gesperrt.

Wesentliche Methoden:

- `V4ProduktionsLaufzeit.status()`
- `V4ProduktionsLaufzeit.starte()`
- `V4ProduktionsLaufzeit.sendeLebensnachweis()`
- `V4ProduktionsLaufzeit.pausiereLebensnachweisAutomatik()`
- `V4ProduktionsLaufzeit.setzeLebensnachweisAutomatikFort()`
- `V4ProduktionsLaufzeit.bereiteGruppenZielVor(...)`
- `V4ProduktionsLaufzeit.installiereGruppenZielLiveSmoke(...)`
- `V4ProduktionsLaufzeit.stoppe()`

`starte()` installiert den Lebensnachweis-Empfang und startet bei aktiv freigegebener Runtime den **autonomen Produktionsheartbeat**. Der Standardtakt ist **2000 ms** und kann nur innerhalb von 500 bis 10000 ms konfiguriert werden. Der Heartbeat fuehrt keine Kampf- oder Gruppenaktion aus.

Der Runtime-Status weist `lebensnachweisAutomatikAktiv`, `lebensnachweisAutomatikPausiert`, Intervall, Sendeversuche, bestaetigte Erfolge, Fehler, offene Sends, Maximalzahl offener Sends sowie letzten Erfolg/Fehler aus. Pause/Fortsetzen dient kontrolliertem Recovery-/Stoerungstest; `stoppe()` entfernt Timer und Empfang fail-safe.

Ein Sendeversuch gilt nur dann als erfolgreich, wenn Adventure Lands `send_cm(...)` den Zielnamen in `receivers` oder `locals` bestaetigt. Ein aufgeloestes Promise ohne bestaetigten Zielcharakter wird als Fehler gewertet.

Eine aktiv freigegebene Runtime benoetigt ein explizites `faehigkeiten`-Profil. Fehlende Faehigkeiten werden im aktiven Modus nicht geraten.

## Explizite Block-8-Freigaben

Gruppenziel vorbereiten:

`BLOCK8-PRODUKTIONS-GRUPPENZIEL-VORBEREITEN`

Live-Smoke-Fassade installieren:

`BLOCK8-PRODUKTIONS-LIVE-SMOKE-INSTALLIEREN`

Danach gelten weiterhin die separaten Freigaben der Live-Smoke-Huelle und des Browser-Runners.

Damit sind Bootstrap, Gruppenplanung, Live-Smoke und Smoke-Start voneinander getrennte Gates. Die Produktions-Gruppenziel-Vorbereitung selbst ist zusaetzlich one-shot: Nach dem ersten korrekten Vorbereitungsversuch muss fuer einen weiteren Versuch eine neue Runtime-Instanz erzeugt werden.

## Runtime-Bundle

`werkzeuge/produktions-runtime-bauen.mjs` baut die Abhaengigkeitsmenge des Produktions-Einstiegs aus den vorhandenen TypeScript-Quellen.

Es wird keine neue Bundler-Abhaengigkeit eingefuehrt. Der bereits vorhandene TypeScript-Compiler transpiliert die Module in eine lokale CommonJS-Modulregistrierung innerhalb eines einzelnen IIFE-Bundles.

Pruefen ohne Datei:

`npm run produktions-runtime:pruefen`

Bundle erzeugen:

`npm run produktions-runtime:bauen`

Ausgabe:

`dist/aio-v4-runtime.js`

und der dazugehoerige Hashnachweis:

`dist/aio-v4-runtime.sha256`

Die Datei enthaelt ausschliesslich den 64-stelligen lowercase SHA-256-Hexwert der Runtime, ohne Dateinamen oder `sha256sum -c`-Metadaten.

CI prueft Reproduzierbarkeit, Mindest-/Maximalgroesse, Runtime-Marker, den unabhaengig nachberechneten SHA-256 und eine passive Installation im simulierten Browserkontext.

## Adventure-Land-Loader

`werkzeuge/adventure-land-v4-bootstrap.js` ist der kleine Loader fuer den Adventure-Land-Codeplatz.

Er erwartet **beides**:

- `AIO_V4_BOOTSTRAP_CONFIG.runtimeUrl`
- `AIO_V4_BOOTSTRAP_CONFIG.runtimeSha256`

Es gibt absichtlich **keine Standard-URL und keinen Standard-Hash**.

Die URL muss HTTPS verwenden. Ohne explizite URL oder ohne exakt 64-stelligen SHA-256 bleibt die Runtime ungeladen.

Der Loader:

- ueberschreibt keine bestehende `V4ProduktionsLaufzeit`,
- verwendet `fetch(..., { cache: "no-store" })`,
- begrenzt die akzeptierte Bundlegroesse,
- verlangt den Produktionsruntime-Marker,
- berechnet den SHA-256 der heruntergeladenen Datei mit Web Crypto und vergleicht ihn exakt mit `runtimeSha256`,
- evaluiert erst nach erfolgreicher Hashpruefung die explizit konfigurierte Runtime-Datei,
- erlaubt pro Loader-Instanz nur einen Ladeversuch,
- besitzt keine Adventure-Land-Spielaktion.

## Fail-safe Stop

`V4ProduktionsLaufzeit.stoppe()`:

- entfernt den eigenen Lebensnachweis-Empfang,
- sperrt und entfernt die eigene Smoke-Fassade, wenn sie noch die eigene ist,
- bricht wartende, blockierte oder laufende Gruppenarbeit der Bootstrap-Steuerung zentral ab,
- gibt dadurch gehaltene Ressourcen frei.

Fremde globale Runtime- oder Smoke-Objekte werden nicht ueberschrieben.

## Noch offen vor dem echten Live-Smoke

Die Runtime-Veroeffentlichung ist fuer `6e63d2f8b12fd27bba3b9db50d91c4100bedc9ec` abgeschlossen und in `BLOCK-8-RUNTIME-RELEASE-NACHWEIS.md` festgehalten.

Offen sind jetzt:

1. exakt diesen immutable Release mit `aktivFreigegeben: false` im echten Adventure-Land-Codekontext laden,
2. nur `V4Bootstrap.status()` und `V4ProduktionsLaufzeit.status()` pruefen,
3. nachweisen, dass keine Gruppenanfrage, keine Ressourcensperre und keine Spielaktion entstanden ist,
4. erst danach den Lebensnachweis-Empfang kontrolliert starten und mindestens zwei frische Produktionsmeldungen pruefen,
5. danach die bestehende one-shot Gruppenziel-Live-Smoke-Abfolge ausfuehren.

Der echte Live-Smoke bleibt bis zum read-only Runtime-PASS offen.


## Immutable Cloudflare-Veroeffentlichung

Die V4-Produktionsruntime wird nicht unter einem beweglichen `latest`-Pfad veroeffentlicht.

Der Release-Vertrag ist an den exakten 40-stelligen Git-Commit-SHA gebunden:

`https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/<release-sha>/aio-v4-runtime.js`

Hashdatei:

`https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/<release-sha>/aio-v4-runtime.sha256`

Die zugehoerigen R2-Objekte liegen unter:

`releases/v4/<release-sha>/aio-v4-runtime.js`

`releases/v4/<release-sha>/aio-v4-runtime.sha256`

Der Cloudflare-Worker akzeptiert nur lowercase Git-SHAs mit exakt 40 Hex-Zeichen und nur diese beiden Dateinamen.

Der Deploy-Workflow:

1. checkt exakt den vorgesehenen Release-Commit aus,
2. baut die V4-Produktionsruntime mit dem strikten TypeScript-Build,
3. liest den rohen 64-stelligen Hash aus `aio-v4-runtime.sha256`, berechnet `sha256sum` fuer die Runtime und vergleicht beide Werte exakt,
4. deployt zuerst den Worker mit der V4-Release-Route,
5. schreibt Runtime und Hashdatei unter den immutable R2-Schluessel,
6. liest beide Artefakte aus R2 zurueck und vergleicht sie bytegenau,
7. laedt beide Artefakte ueber den oeffentlichen HTTPS-Worker,
8. vergleicht auch diese Antworten bytegenau mit den lokal gebauten Dateien,
9. prueft CORS, `no-store`, Content-Type und `x-aio-v4-release-sha`,
10. prueft den oeffentlich geladenen SHA-256 erneut gegen die oeffentlich geladene Runtime.

Erst ein Deployment, das diese komplette Kette besteht, gilt als veroeffentlicht.

Fuer Adventure Land werden danach exakt diese Werte verwendet:

`AIO_V4_BOOTSTRAP_CONFIG.runtimeUrl = "<immutable-runtime-url>"`

`AIO_V4_BOOTSTRAP_CONFIG.runtimeSha256 = "<64-stelliger-sha256-aus-der-veroeffentlichten-hashdatei>"`
