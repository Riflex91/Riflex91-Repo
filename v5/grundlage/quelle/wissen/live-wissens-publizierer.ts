import { kanonischSerialisieren } from "../kern/kanonische-serialisierung.js";
import type {
  LiveWissensFaktDatei,
  LiveWissensSchreibErgebnis,
  LiveWissensSpeicherPort,
} from "../persistenz/ports.js";
import type { LiveVerifizierterFakt } from "./typen.js";

export interface ZeitTextPort {
  zuIsoUtc(zeitMs: number): string;
}

export class LiveWissensPublizierer {
  readonly #speicher: LiveWissensSpeicherPort;
  readonly #zeitText: ZeitTextPort;

  public constructor(
    speicher: LiveWissensSpeicherPort,
    zeitText: ZeitTextPort,
  ) {
    this.#speicher = speicher;
    this.#zeitText = zeitText;
  }

  public async publiziereGeneration(
    generation: number,
    aktualisiertAm: string,
    fakten: readonly LiveVerifizierterFakt[],
  ): Promise<LiveWissensSchreibErgebnis> {
    if (!Number.isSafeInteger(generation) || generation < 1) {
      throw new Error("LIVE_WISSEN_GENERATION_UNGUELTIG");
    }
    if (aktualisiertAm.trim().length === 0) {
      throw new Error("LIVE_WISSEN_AKTUALISIERUNGSZEIT_FEHLT");
    }

    let dateien: readonly LiveWissensFaktDatei[] = Object.freeze([]);
    for (const fakt of fakten) {
      if (fakt.art !== "LIVE_VERIFIZIERTER_FAKT"
          || fakt.status !== "LIVE_VERIFIZIERT"
          || fakt.quelle.art !== "LIVE_SPIEL"
          || fakt.quelle.methode.trim().length === 0
          || fakt.ausfuehrungsAutoritaet !== false) {
        throw new Error("LIVE_WISSEN_NUR_VERIFIZIERTE_FAKTEN");
      }
      if (!/^[A-Za-z0-9._-]+$/.test(fakt.kennung)) {
        throw new Error("LIVE_WISSEN_FAKT_KENNUNG_UNGUELTIG");
      }

      const beobachtetAm = this.#zeitText.zuIsoUtc(fakt.beobachtetAmMs).trim();
      const verifiziertAm = this.#zeitText.zuIsoUtc(fakt.verifiziertAmMs).trim();
      if (beobachtetAm.length === 0 || verifiziertAm.length === 0) {
        throw new Error("LIVE_WISSEN_ZEITFORMAT_UNGUELTIG");
      }

      const json = kanonischSerialisieren({
        schemaVersion: 1,
        spiel: fakt.spiel,
        kennung: fakt.kennung,
        domaene: fakt.domaene,
        status: "LIVE_VERIFIZIERT",
        beobachtetAm,
        verifiziertAm,
        quelle: {
          art: "LIVE_SPIEL",
          methode: fakt.quelle.methode,
        },
        wert: fakt.wert,
      });
      dateien = Object.freeze([
        ...dateien,
        Object.freeze({
          relativerPfad: fakt.domaene.toLowerCase() + "/" + fakt.kennung + ".json",
          json,
        }),
      ]);
    }

    return this.#speicher.schreibeGenerationDurable(Object.freeze({
      schemaVersion: 1,
      generation,
      aktualisiertAm,
      fakten: dateien,
    }));
  }
}
