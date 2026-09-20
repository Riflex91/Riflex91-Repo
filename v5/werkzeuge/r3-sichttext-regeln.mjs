export function pruefeSichttext({
  kategorie,
  deutscherText,
  rohwert,
  offizielleDeutscheMonsterbezeichnungVorhanden = false,
  monsterQuellenStatus = "",
}) {
  const deutsch = String(deutscherText ?? "").trim();
  const roh = String(rohwert ?? "").trim();

  if (kategorie === "monster") {
    if (offizielleDeutscheMonsterbezeichnungVorhanden) {
      return monsterQuellenStatus === "DEUTSCH_OFFIZIELL" && deutsch.length > 0
        ? { erlaubt: true, text: deutsch }
        : { erlaubt: false, grund: "DEUTSCHE_MONSTERBEZEICHNUNG_FEHLT" };
    }

    if (monsterQuellenStatus === "ORIGINALNAME_ERLAUBT" && roh.length > 0 && deutsch.length === 0) {
      return { erlaubt: true, text: roh, ausnahme: "MONSTER_ORIGINALNAME" };
    }
    if (deutsch.length > 0) {
      return { erlaubt: false, grund: "MONSTER_UEBERSETZUNG_OHNE_OFFIZIELLEN_NACHWEIS" };
    }
    return { erlaubt: false, grund: "MONSTER_ORIGINALNAME_NICHT_REVALIDIERT" };
  }

  if (deutsch.length === 0) {
    return { erlaubt: false, grund: "DEUTSCHE_UEBERSETZUNG_FEHLT" };
  }

  if (/^[a-z0-9_:-]+$/.test(deutsch) && deutsch === roh) {
    return { erlaubt: false, grund: "TECHNISCHE_ROHKENNUNG_IN_UI" };
  }

  return { erlaubt: true, text: deutsch };
}
