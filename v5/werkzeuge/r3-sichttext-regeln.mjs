export function pruefeSichttext({
  kategorie,
  deutscherText,
  rohwert,
  offizielleDeutscheMonsterbezeichnungVorhanden = false,
}) {
  const deutsch = String(deutscherText ?? "").trim();
  const roh = String(rohwert ?? "").trim();

  if (kategorie === "monster") {
    if (offizielleDeutscheMonsterbezeichnungVorhanden) {
      return deutsch.length > 0
        ? { erlaubt: true, text: deutsch }
        : { erlaubt: false, grund: "DEUTSCHE_MONSTERBEZEICHNUNG_FEHLT" };
    }

    if (deutsch.length > 0) return { erlaubt: true, text: deutsch };
    if (roh.length > 0) return { erlaubt: true, text: roh, ausnahme: "MONSTER_ORIGINALNAME" };
    return { erlaubt: false, grund: "MONSTERNAME_FEHLT" };
  }

  if (deutsch.length === 0) {
    return { erlaubt: false, grund: "DEUTSCHE_UEBERSETZUNG_FEHLT" };
  }

  if (/^[a-z0-9_:-]+$/.test(deutsch) && deutsch === roh) {
    return { erlaubt: false, grund: "TECHNISCHE_ROHKENNUNG_IN_UI" };
  }

  return { erlaubt: true, text: deutsch };
}
