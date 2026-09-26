# Mainland / `main` HD scope

Dieser Scope ist aus dem gepinnten Originalclient
`kaansoral/adventureland_mongodb@90052162eb3ebda36c893e1eb4af643913c8f984`
abgeleitet. Gameplay, Spawnlogik, Kollisionsdaten, NPC-Rollen und Monsterwerte
bleiben Originalautoritaet. Adventure Land HD ersetzt weiterhin nur visuelle
Dateireferenzen.

## Gepinnter Umfang

- Map-ID: `main`
- Name: **Mainland**
- Map-Key: `jayson_ALMap2_v2`
- Geometrie: `MP_jayson_ALMap2_v2`
- 1.002 Tile-Definitionen
- 10.791 Geometrie-Platzierungen
- 14 verwendete Map-Tilesets
- 30 NPC-Platzierungen, davon 1 saisonal (Mira / `anniversary_baker`)
- 38 Monster-, Tier- und Target-Typen
- 42 Monster-Spawn-Platzierungen
- 48 eindeutige visuelle Quelldateien

Der Runtime-Zusatz `wabbit` aus `js/old_common_functions.js` gehoert
ausdruecklich zum Scope und wird nicht uebersehen.

Die maschinenlesbare Wahrheit liegt in
`manifests/main-map-scope.json`. CI rekonstruiert den Scope mit
`tools/verify-main-map-scope.mjs` direkt aus dem gepinnten Originalcheckout.

## World / Terrain

Die Mainland-Geometrie benutzt diese 14 Tilesets:

`castle`, `custom`, `custom2`, `custom_a`, `doors`, `dungeon`,
`fort`, `house`, `inside`, `lights`, `new`, `outside`, `puzzle`,
`water`.

Auch animierbare Map-Elemente werden bei der Ableitung beruecksichtigt.

## NPCs

Alle festen Mainland-NPCs, der nachgeladene `dreamkeeper` und der saisonale
Mira-Pilot gehoeren zum Scope. Zusammengesetzte NPCs ziehen ihre benoetigten
Body-, Head-, Hair-, Hat-, Beard- und Back-Sheets automatisch mit ein.

Bekannte Upstream-Anomalie: `dreamkeeper.cx.back` referenziert
`backpacks202`, obwohl dieser Key in den exportierten Sprite-Matrizen des
gepinnten Originals nicht existiert. Adventure Land HD erfindet dafuer keinen
Ersatz und veraendert das Originalverhalten nicht.

## Monster / Tiere / Targets

Der Scope umfasst alle im `main`-Block definierten Typen sowie Runtime-
Ergaenzungen. Dazu gehoeren unter anderem Goo, Bee, Crab, Tortoise, Croc,
Armadillo, Snake, Spider, Scorpion, Phoenix, die drei Fairies, Puppies,
Kitties, Hennen/Rooster, Trainings-Targets und Wabbit.

## Produktionsreihenfolge

1. **Terrain/Map-Tilesets** – zuerst die 14 World-Sheets, damit die gesamte
   Mainland-Flaeche visuell konsistent wird.
2. **NPC-Sheets** – feste NPCs und ihre zusammengesetzten Cosmetics in
   kontrollierten Batches.
3. **Monster-Sheets** – gruppiert nach gemeinsam genutzten Sprite-Sheets,
   damit ein Sheet-Override nie unbemerkt weitere Kreaturen veraendert.
4. **Live-A/B-Abnahme** – jede Gruppe mit `?alhd=on` / `?alhd=off`,
   Original-Fallback und unveraenderten logischen Abmessungen.

8x bleibt der Standard. Abweichungen benoetigen weiterhin einen dokumentierten
technischen Ausnahmegrund.
