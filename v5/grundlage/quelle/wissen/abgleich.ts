import type { UhrPort } from "../determinismus/ports.js";
import { kanonischSerialisieren } from "../kern/kanonische-serialisierung.js";
import { istFrisch } from "../kern/zeit.js";
import type {
  AbgeglicheneWeltWahrheit,
  DefinitionsWissen,
  LiveVerifizierterFakt,
} from "./typen.js";

function ergebnis<T>(
  definition: DefinitionsWissen<T>,
  status: AbgeglicheneWeltWahrheit<T>["status"],
  begruendung: string,
  wert?: T,
  beobachtetAmMs?: number,
): AbgeglicheneWeltWahrheit<T> {
  return Object.freeze({
    art: "ABGEGLICHENE_WELTWAHRHEIT",
    kennung: definition.kennung,
    domaene: definition.domaene,
    status,
    ...(wert === undefined ? {} : { wert }),
    begruendung,
    ...(beobachtetAmMs === undefined ? {} : { beobachtetAmMs }),
    autoritaet: "PLANUNGSNACHWEIS",
    ausfuehrungsAutoritaet: false,
    mutationAutorisiert: false,
  });
}

export function gleicheWeltWahrheitAb<T>(
  definition: DefinitionsWissen<T>,
  beobachtung: LiveVerifizierterFakt<T> | undefined,
  uhr: UhrPort,
): AbgeglicheneWeltWahrheit<T> {
  if (definition.art !== "DEFINITION" || definition.ausfuehrungsAutoritaet !== false) {
    throw new Error("WELTWAHRHEIT_DEFINITION_UNGUELTIG");
  }
  if (beobachtung === undefined) return ergebnis(definition, "UNBEKANNT", "KEINE_LIVE_BEOBACHTUNG");
  if (beobachtung.kennung !== definition.kennung || beobachtung.domaene !== definition.domaene) {
    return ergebnis(definition, "UNBEKANNT", "BEOBACHTUNG_PASST_NICHT_ZUR_DEFINITION");
  }
  if (beobachtung.status !== "LIVE_VERIFIZIERT" || beobachtung.ausfuehrungsAutoritaet !== false) {
    return ergebnis(definition, "UNBEKANNT", "BEOBACHTUNG_NICHT_FACHLICH_VERIFIZIERT");
  }
  if (!istFrisch(beobachtung, uhr)) {
    return ergebnis(definition, "VERALTET", "LIVE_BEOBACHTUNG_ZU_ALT",
      beobachtung.wert, beobachtung.beobachtetAmMs);
  }
  if (kanonischSerialisieren(definition.wert) !== kanonischSerialisieren(beobachtung.wert)) {
    return ergebnis(definition, "WIDERSPRUCH",
      "DEFINITION_UND_BEOBACHTUNG_WIDERSPRECHEN_SICH",
      beobachtung.wert, beobachtung.beobachtetAmMs);
  }
  return ergebnis(definition, "BESTAETIGT",
    "FRISCHE_LIVE_BEOBACHTUNG_BESTAETIGT_DEFINITION",
    beobachtung.wert, beobachtung.beobachtetAmMs);
}

export function darfWissenslageMutationAutorisieren(
  _weltWahrheit: AbgeglicheneWeltWahrheit,
): false {
  return false;
}
