# Asset-Kompatibilitätsregeln

1. **Originalsemantik ist Autorität.** Kein HD-Asset darf Änderungen an Gameplay-State, Movement, Pathfinding, Combat, Hitbox/Range, Loot, Quests, Events, Netzwerk, Persistenz oder Servercode erfordern.
2. **Originalpfad bleibt logische Identität.** HD wird als Override mit Original-Fallback gedacht.
3. **Sprite-Sheets:** Vor Ersatz müssen Gesamtmaß, Frame-Raster, Framefolge, Richtungen/Posen, Pivot/Anchor und Sidecars wie `.pxm` bekannt sein.
4. **Tiles:** Keine Änderung an Map-Geometrie, Collision, Spawnpunkten, Türen, Teleports oder Pathfinding.
5. **VFX:** Keine neue Timing-, Radius-, Ziel- oder Skillsemantik.
6. **UI/Fonts:** Die erste HD-Stufe bevorzugt maßkompatible Ersetzungen; Interaktionsflächen dürfen nicht stillschweigend verändert werden.
7. **Fallback:** Fehlendes oder ungültiges HD-Asset muss auf das Original zurückfallen.
8. **Freigabe:** Jedes spätere HD-Asset erhält Originalpfad, Original-Blob-SHA, HD-Datei, Skalierungsfaktor, Validatorstatus und visuellen Review-Status.
