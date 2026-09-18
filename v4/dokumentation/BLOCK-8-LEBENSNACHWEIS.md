# Block 8 – read-only Lebensnachweis-Austausch

## Ziel

Dieser Schritt verbindet das Block-8-Gruppenfundament mit echten Adventure-Land-Charakteren, ohne Kampf-, Bewegungs-, Skill-, Heil-, Loot-, Handels- oder Party-Aktionen auszufuehren.

Der Austausch verwendet ausschliesslich adressierte `send_cm`-Nachrichten zwischen explizit vertrauten Charakternamen. `command_character` wird absichtlich nicht verwendet.

## Runtime

`erstelleGruppenTeilnehmerMeldungAusSpielzustand(...)` erzeugt einen `GruppenTeilnehmerMeldung` direkt aus einem V4-`Spielzustand` und bleibt fuer Replay, Tests und explizite Adapter erhalten.

Fuer autonome Gruppenarbeit ist `erstelleGruppenTeilnehmerMeldungAusKampfsicherheit(...)` massgeblich. Diese Funktion uebernimmt `gefahrenBewertung.stufe` aus einer Block-7-`KampfSicherheitsEntscheidung` desselben Spielzustandszeitpunkts. Eine alte oder fremde Sicherheitsentscheidung wird fail-safe blockiert.

Verbindliche Identitaets- und Weltwerte werden nicht geraten. Fehlen Charakterkennung, Charaktername, Klasse, Serverregion, Serverkennung, Karte oder Instanz, ist das Ergebnis `blockiert` und es wird keine Meldung erzeugt.

HP-/MP-Anteile duerfen dagegen `null` bleiben, wenn Adventure Land diese Werte nicht sicher liefert. Zeit und Sequenz stammen deterministisch aus `spielzustand.aufgenommenAm` und `spielzustand.laufendeNummer`.

`AdventureLandGruppenLebensnachweisAustausch` liegt an der Ausfuehrungsgrenze. Senden ist standardmaessig gesperrt und muss explizit freigegeben werden. Ziele ausserhalb der Vertrauensliste werden vor `send_cm` blockiert. Ab Produktionsruntime **1.1.3** reicht ein aufgeloestes `send_cm`-Promise nicht mehr als Erfolg: Der Zielcharakter muss in Adventure Lands Rueckgabe `receivers` oder `locals` enthalten sein, sonst bleibt `gesendet=false`.

## Adventure-Land-Kontext

Adventure Land trennt den Charakter-Codekontext von Spiel-Funktionen, die je nach Laufumgebung im Parent-Kontext liegen koennen. Deshalb gilt fuer den Lebensnachweis verbindlich:

- `on_cm` wird im lokalen Charakter-Codekontext installiert,
- `send_cm` darf lokal oder im Parent-Kontext gefunden werden,
- der Parent-`on_cm` wird nicht als Ersatz fuer den lokalen Empfang verwendet.

Eingehende V4-Umschlaege werden nur akzeptiert, wenn:

- der Absender in der Vertrauensliste steht,
- der Adventure-Land-Absendername dem Umschlag-Absender entspricht,
- `meldung.charakterName` demselben Absender entspricht,
- der Umschlag das Protokoll `v4-gruppen-lebensnachweis-v1` verwendet.

Nicht-V4-`on_cm`-Nachrichten werden an einen bereits vorhandenen lokalen Empfaenger weitergereicht.

## Live-Sicherheitsquelle

Vor `block8-lebensnachweis-schatten.js` wird auf jedem beteiligten Charakter geladen:

```text
v4/werkzeuge/block7-kampfsicherheits-quelle.js
```

Die API lautet:

```js
V4Block7KampfsicherheitsQuelle.bewerte()
```

Die Quelle ist read-only, fuehrt keine Adventure-Land-Spielaktion aus und ist ueber ihren `quellBlobSha` an den exakten Produktionskern `v4/laufzeit/quelle/spiellogik/kampfsicherheit.ts` gebunden. Der Strukturguard wird rot, wenn sich der Produktionskern aendert, ohne dass die Browserquelle bewusst nachgezogen wird.

## Mehrcharakter-Schattennachweis ab Version 1.1.0

Danach laden:

```text
v4/werkzeuge/block8-lebensnachweis-schatten.js
```

Eine manuelle `gefahrenStufe` ist seit Version `1.1.0` verboten. Vor jedem Sendevorgang wird synchron eine frische Block-7-Bewertung gelesen. Fehlt die Quelle, ist die Bewertung ungueltig oder aelter als `sicherheitsMaximalAlterMillisekunden`, wird vor `send_cm` blockiert.

Beispiel fuer einen Schadenscharakter:

```js
V4Block8Lebensnachweis.konfiguriere({
  vertrauensNamen: ["CharA", "CharB"],
  faehigkeiten: {
    heilen: 0,
    schaden: 1,
    aggro: 0,
    schutz: 0,
    unterstuetzung: 0
  },
  intervallMillisekunden: 1000
})
```

Optional kann die Freshness-Grenze explizit gesetzt werden:

```js
sicherheitsMaximalAlterMillisekunden: 1500
```

Danach auf jedem beteiligten Charakter:

```js
await V4Block8Lebensnachweis.starte()
```

Status:

```js
V4Block8Lebensnachweis.status()
```

Stoppen:

```js
V4Block8Lebensnachweis.stoppe()
```

## Erwarteter Nachweis

Nach einigen Sekunden sollen auf jedem beteiligten Charakter gelten:

- `aktiv: true`
- `version: "1.1.0"`
- `gesendet > 0`
- `empfangen > 0`
- `verworfen: 0` bei sauberem Test
- `gefahrenQuelle: "V4Block7KampfsicherheitsQuelle"`
- `sicherheitsQuelleVerfuegbar: true`
- `letzteSicherheit.gefahrenStufe` entspricht der aktuell beobachteten Block-7-Lage
- `empfangsKontext: "lokaler_codekontext"`
- `sendeKontext: "lokal"` oder `"parent"`
- mindestens ein fremder Eintrag in `teilnehmer`
- `echteSpielaktionenAusgefuehrt: false`
- `kommunikation: "send_cm"`

Der Austausch darf weder `attack`, `move`, `smart_move`, `use_skill`, `use_hp`, `use_mp`, `loot`, `send_party_invite` noch `command_character` aufrufen. Die Block-7-Sicherheitsquelle darf auch `send_cm` nicht aufrufen.

## Wiederholung nach einem alten Werkzeuglauf

Vor dem Laden der Version `1.1.0` einen noch laufenden alten Austausch auf jedem Charakter zuerst stoppen:

```js
V4Block8Lebensnachweis.stoppe()
```

Danach zuerst die Block-7-Sicherheitsquelle und anschliessend die neue Lebensnachweisdatei laden, erneut konfigurieren und starten. So werden alter Timer und alter `on_cm`-Empfaenger sauber entfernt.

## Autonomer Produktionsheartbeat ab Runtime 1.1.3

Die produktive `V4ProduktionsLaufzeit` besitzt den Gruppenheartbeat nun selbst. `starte()` installiert den Empfang und startet bei aktiver Freigabe standardmaessig einen **2000-ms**-Heartbeat-Timer. Der Block-8-GUI-Test darf diesen Dienst beobachten und fuer die geplante Stoerung pausieren/fortsetzen, taktet ihn aber nicht mehr selbst.

Im Runtime-Status sind Sendeversuche, bestaetigte Erfolge, Fehler, offene Sends und letzter Fehler sichtbar. Damit kann ein kuenftiger Live-Fail unterscheiden zwischen:

- lokalem Timer-/Codekontext-Stall,
- `send_cm` ohne bestaetigten Ziel-Empfaenger,
- echtem Remote-Empfangsausfall,
- sauberem Senden mit spaeterem Stale auf der Gegenseite.

`stoppe()` entfernt den Timer und den `on_cm`-Empfang fail-safe.

## Reconnect-/Stale-Verhalten

Ab Produktionsruntime **1.1.1** trennt der Adapter zwei Zeitbegriffe bewusst:

- `gesendetAm` plus `laufendeNummer` bleiben die unveraenderte Senderreihenfolge und werden fuer Replay-/Rueckwaertspruefung verwendet.
- Die produktive Freshness eines **Remote**-Teilnehmers wird ab dem lokal vertrauenswuerdig erfassten `empfangenAm` bewertet.

Damit werden Server-/Netzwerklatenz und unterschiedliche CODE-Kontext-Uhren nicht mehr faelschlich von der 5-Sekunden-Gruppen-TTL abgezogen. Der reine deterministische Koordinationskern bleibt unveraendert; der Produktionsadapter uebergibt ihm fuer die Freshness eine lokale Empfangsreferenz.

Wird ein beteiligter Charakter oder dessen Werkzeug gestoppt, steigt das Alter seit dem letzten lokalen Empfang. Die Gruppenkoordination stuft den Teilnehmer oberhalb von `lebensnachweisMaximalAlterMillisekunden` als `veraltet` ein und verteilt Aufgaben auf verbleibende aktive Teilnehmer neu.

Nach Neustart liefert der Charakter wieder eine neuere, replay-sichere Meldung; der lokale Empfang macht ihn wieder frisch und die Koordination kann ihn erneut aufnehmen.

## Sicherheitsgrenze

Die Gefahrenstufe ist im Live-Ablauf kein Testparameter mehr. Block 8 darf sie nicht manuell abschwaechen oder auf `sicher` setzen. `unbekannt`, `angespannt`, `gefaehrlich` und `kritisch` werden genauso weitergegeben, wie Block 7 sie fuer den aktuellen Charakterzustand bewertet.
