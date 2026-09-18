# Block 8 – V4 Produktions-Bootstrap

Status: **Produktions-Bootstrap, passive Laufzeit-Fassade, HTTPS+SHA-256-Adventure-Land-Loader und reproduzierbarer Runtime-Build implementiert; noch nicht live veroeffentlicht.**

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
- `V4ProduktionsLaufzeit.bereiteGruppenZielVor(...)`
- `V4ProduktionsLaufzeit.installiereGruppenZielLiveSmoke(...)`
- `V4ProduktionsLaufzeit.stoppe()`

`starte()` installiert nur den vorhandenen Lebensnachweis-Empfang. Es fuehrt keine Kampf- oder Gruppenaktion aus.

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

1. Runtime-Bundle aus dem finalen Main bauen.
2. Bundle an einen kontrollierten, versionierten HTTPS-Endpunkt veroeffentlichen.
3. CORS/no-store und exakte Datei pruefen.
4. `AIO_V4_RUNTIME_CONFIG` fuer den vorgesehenen Charakter explizit setzen.
5. `AIO_V4_BOOTSTRAP_CONFIG.runtimeUrl` auf genau diese Version setzen.
6. Den von `produktions-runtime:bauen` erzeugten SHA-256 unveraendert als `AIO_V4_BOOTSTRAP_CONFIG.runtimeSha256` setzen.
7. Runtime laden und nur Read-only-`status()` pruefen.
8. Lebensnachweis-Empfang starten und mindestens zwei frische Produktionsmeldungen pruefen.
9. Erst dann den bereits dokumentierten one-shot Gruppenziel-Live-Smoke ausfuehren.

Der echte Live-Smoke bleibt bis zu dieser Veroeffentlichung offen.
