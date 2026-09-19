# P0-04 – Trade Listing Lifecycle, RID und Partial Sale

**Status:** DONE  
**Stand:** 2026-09-19  
**Offizieller Source-Snapshot:** kaansoral/adventureland_mongodb@ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4  
**Live-Revalidierung:** aktuell deployte runner_functions.js und functions.js

## Forschungsfrage

Wie funktionieren Sell Listings, Wishlists, RID, Partial Fills und konkurrierende Player-Market-Requests so exakt, dass V5 weder stale Listings kauft noch das falsche physische Item verkauft?

## Sell Listing – trade

Der öffentliche Pfad ist trade -> parent.trade -> Deferred-Channel "equip" -> Socket-Event "equip".

Der Server verlangt einen aktuell erlaubten Trade-Slot, einen leeren Zielslot, ein vorhandenes zulässiges Item und ausreichende Menge. Beim neuen Listing wird rid = randomStr(4) erzeugt.

Stackbare Items können mit Teilmenge gelistet werden. Die gewünschte Menge wird aus dem Inventar in ein neues Listing verschoben. Nicht-stackbare Items werden physisch in den Trade-Slot bewegt.

Ein vorhandenes Sell Listing kann nicht direkt überschrieben werden; der Server antwortet mit slot_occuppied.

## Buy Listing – wishlist

Der Pfad ist wishlist -> parent.wishlist -> Deferred-Channel "trade_wishlist" -> Socket-Event "trade_wishlist".

Wishlist ist ein virtuelles Listing mit b=true, Name, Preis, Menge, optional Level und neuer RID.

Ein vorhandenes b=true Wishlist-Listing darf direkt ersetzt werden. Das Replacement erhält eine neue RID.

Allgemeine Menge: 1..9999. Bei Upgrade-/Compound-Items maximal 99. Level wird auf 0..12 begrenzt.

## Listing entfernen

unequip(tradeSlot) entfernt ein Listing.

Bei einem Sell Listing wird der Slot geleert und das physische Item ins Inventar zurückgelegt; dafür muss Inventarplatz vorhanden sein.

Bei einer Wishlist wird der Slot geleert, aber wegen b=true kein physisches Item erzeugt.

Damit besitzt unequip für Trade-Slots zwei fachlich verschiedene Varianten.

## Trade-Slot-Verfügbarkeit

get_trade_slots(player) entscheidet serverseitig, welche Slots aktuell erlaubt sind.

Ohne Stand, aber bei sichtbaren Trades: trade1 bis trade4.

Mit Stand: standardmäßig 16 Slots; Merchant Level >=70 oder cstand: 24; Merchant Level >=80: 30.

Die Erlaubnis wird bei Listing-Erstellung erneut geprüft.

## RID-Semantik

Die öffentlichen trade_buy- und trade_sell-Wrapper lesen target.slots[trade_slot].rid und senden diese RID mit.

Der Server lehnt mit item_gone ab, wenn data.rid vorhanden ist und nicht zur aktuellen Slot-RID passt.

Wichtig: Der rohe Serverhandler erzwingt das RID-Feld nicht, wenn es fehlt. Deshalb gilt für V5 strenger: Raw trade_buy oder trade_sell ohne nichtleere RID ist verboten.

RID ist ein Optimistic-Concurrency-Guard gegen Slot-Replacement. RID ist keine Transaction-ID, kein Idempotency-Key, keine Quantity-Version und keine global eindeutige Listing-ID.

V5 bindet ein Listing mindestens an Target-Character, Slot, RID, Side, Itemname, Level falls relevant und Unit Price. Die Menge ist eine separat frische mutable Observation.

## Partial Fill

Bei trade_buy und trade_sell gilt: Ist requested q größer als current q, schlägt die Anfrage fehl. Der Server reduziert die Anfrage nicht automatisch.

Ist requested q kleiner als current q, wird exakt requested q übertragen und listing.q um genau diese Menge reduziert.

Entscheidend: Listing-RID und Preis bleiben beim Partial Fill unverändert. Erst bei vollständigem Fill wird der Slot null.

Daraus folgt: RID-Match bedeutet nicht, dass die Menge noch frisch ist. Jeder Folge-Fill braucht eine neue Live-Beobachtung und einen neuen Intent.

## trade_buy

Der Server revalidiert Seller, Bankzustand, Reichweite/Map, Slot/RID, Listing-Seite, Restmenge, Buyer-Gold und Inventarplatz.

Danach werden Buyer-Gold, Trade-Historie, Seller-Gold, Steuer, Listing-Menge und Buyer-Inventar innerhalb des synchronen Handlers aktualisiert.

Für Recovery sind eigenes Buyer-Gold und eigenes Buyer-Inventar primäre Evidence. Ein Remote-Listing-Delta ist nur unterstützend, weil ein anderer Buyer dieselbe Menge verändern kann.

## trade_sell – besonders kritisch

Der Client gibt keinen Inventarslot an.

Der Server scannt das Seller-Inventar von Index 0 aufwärts und wählt das erste Item mit gleichem Namen, ausreichender Menge, gleichem Level und ohne Lock. Erst nach dieser Auswahl wird zusätzlich geprüft, ob das ausgewählte Item blockiert ist.

Eine vom Bot gedachte physische Item-Identität ist kein Serverparameter.

V5 muss deshalb unmittelbar vor trade_sell den echten Server-Scan auf dem frischen Inventar reproduzieren und beweisen, dass genau das vom Server ausgewählte physische Item verkauft werden darf.

Sind mehrere server-eligible Items vorhanden, die nach V5-Policy nicht fungibel sind, wird der Verkauf verweigert oder vorher kontrolliert neu geplant.

## Partial Wishlist Fill

Bei Verkauf an eine Wishlist erhält der Seller Netto-Gold, der Buyer verliert Brutto-Gold, Seller-Inventar verliert exakt q, Buyer erhält exakt q. Bei Vollfüllung verschwindet das Listing; bei Teilfüllung sinkt nur q und die RID bleibt gleich.

Auch hier beweist ein Wishlist-q-Delta nach UNKNOWN nicht, dass unser Character verkauft hat. Ein anderer Spieler kann dieselbe Wishlist gefüllt haben.

Primäre Recovery-Evidence ist daher eigenes Seller-Gold plus der gepinnte physische Server-Auswahlkandidat.

## Concurrency

trade_buy und trade_sell sind im geprüften Servercode synchrone Handler ohne asynchrones Yield in der Mutationssequenz. Der Target-Player wird aus dem aktuellen Serverprozess gelesen und muss live/nah sein.

Jeder Request wird gegen den dann aktuellen Listingzustand geprüft. Ein späterer Request sieht die bereits reduzierte Menge oder den geleerten Slot.

Der Server schützt dadurch gegen simples Overselling aus stale Menge: ausreichende Menge führt zu exakt q; zu geringe Menge führt zu Failure.

Zwischen V5-Beobachtung und Serververarbeitung bleibt trotzdem ein Race mit anderen Spielern. Korrekt ist deshalb Revalidation + serverseitiger RID/q-Check + Reconciliation, nicht die Annahme einer Reservierung.

## V5 Execution Admission

Vor jedem trade_buy/trade_sell werden frisch geprüft: Target-Identität und Liveness, Map/Reichweite, Slot, RID, Side, Itemname, Level falls relevant, Unit Price, aktuelle Restmenge, exakt gewünschte Menge, eigenes Gold/Inventarplatz und bei trade_sell die exakte serverseitige physische Item-Auswahl.

Ändert sich RID oder der gepinnte Listing-Fingerprint, wird die Action verweigert und neu geplant.

## Quantity Policy

Ein Intent enthält genau eine feste Menge.

Ein Failure wegen inzwischen zu kleiner Restmenge darf nicht in einen automatisch verkleinerten Request desselben Intents verwandelt werden. Stattdessen folgen frische Beobachtung, neue wirtschaftliche Entscheidung und ein neuer Intent.

## Recovery

Nach UNKNOWN bei trade_buy sind eigenes Gold und eigenes Inventar primäre Evidence.

Nach UNKNOWN bei trade_sell sind eigenes Gold und der exakt gepinnte Server-Auswahlkandidat primäre Evidence.

Remote-RID/q ist nur Sekundärevidence, weil andere Spieler denselben Listingzustand verändern können.

## Harte Invarianten

1. Kein raw trade_buy/trade_sell ohne RID.
2. RID ist kein Idempotency-Key.
3. RID ist keine Quantity-Version.
4. Partial Fill rotiert RID nicht.
5. Ein Intent besitzt eine feste Menge.
6. Failure wegen Restmenge führt zu Replan, nicht kleinerem Auto-Retry.
7. Jeder Folge-Fill ist neuer Intent aus frischer Listing Truth.
8. Remote Quantity Delta allein darf UNKNOWN nie committen.
9. trade_sell simuliert vor Send die echte Server-Itemauswahl.
10. Nicht-fungible mehrdeutige Kandidaten blockieren trade_sell.
11. Listing Replacement invalidiert alte Pläne.
12. FIFO-Action-Channels ersetzen keine V5 Resource Claims über Gold, Inventar und Listing.

## Ergebnis

P0-04 ist geschlossen.

Die wichtigste Erkenntnis für Merchant V5 ist: **RID schützt vor ausgetauschtem Listing, aber nicht vor geänderter Restmenge. Und bei trade_sell bestimmt der Server das physische Item.**

## Maschinenlesbare Quelle

v5/wissensbasis/vertraege/trade-lifecycle.json
