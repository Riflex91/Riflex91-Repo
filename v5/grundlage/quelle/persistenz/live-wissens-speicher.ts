import type {
  LiveWissensGeneration,
  LiveWissensSchreibErgebnis,
  LiveWissensSpeicherPort,
} from "./ports.js";
import { utf8ByteLaenge } from "./begrenztes-json.js";

export const STANDARD_LIVE_WISSENS_WURZEL =
  "D:\\AdventureLand-V5\\wissensdatenbank";

export interface LiveWissensDateisystemPort {
  schreibeAtomarDurable(
    relativerPfad: string,
    inhalt: string,
    tempKennung: string,
  ): Promise<void>;
  entferneDurable(relativerPfad: string): Promise<void>;
  listeAktuellJson(): Promise<readonly string[]>;
}

export type LiveWissensSchritt =
  | "VOR_STATUS_SCHREIBT"
  | "VOR_MANIFEST"
  | "VOR_FAKTEN"
  | "VOR_STALE_ENTFERNUNG"
  | "VOR_STATUS_BEREIT";

export interface LiveWissensSpeicherOptionen {
  readonly maximaleDateien: number;
  readonly maximaleEinzelBytes: number;
  readonly maximaleGesamtBytes: number;
  readonly vorSchritt?: (schritt: LiveWissensSchritt) => void | Promise<void>;
}

const SECRET_MUSTER =
  /(?:secret|token|password|passwort|credential|cookie|session|api[_-]?key|access[_-]?key)/i;

function normalisiereRelativenJsonPfad(pfad: string): string {
  const normalisiert = pfad.replaceAll("\\", "/").replace(/^\/+/, "");
  if (normalisiert.length === 0
      || normalisiert.startsWith("../")
      || normalisiert.includes("/../")
      || normalisiert.includes("/./")
      || normalisiert.endsWith("/..")
      || normalisiert.includes(":")
      || !normalisiert.endsWith(".json")
      || !/^[A-Za-z0-9._/-]+$/.test(normalisiert)) {
    throw new Error("LIVE_WISSEN_PFAD_UNGUELTIG");
  }
  return normalisiert;
}

function pruefeSecrets(wert: unknown, tiefe = 0): void {
  if (tiefe > 64) throw new Error("LIVE_WISSEN_JSON_ZU_TIEF");
  if (wert === null || typeof wert !== "object") return;

  if (Array.isArray(wert)) {
    for (const eintrag of wert) pruefeSecrets(eintrag, tiefe + 1);
    return;
  }

  for (const [schluessel, feld] of Object.entries(wert as Record<string, unknown>)) {
    if (SECRET_MUSTER.test(schluessel)) throw new Error("LIVE_WISSEN_SECRET_FELD_VERBOTEN");
    pruefeSecrets(feld, tiefe + 1);
  }
}

function validiereFaktJson(text: string): void {
  let wert: unknown;
  try {
    wert = JSON.parse(text);
  } catch {
    throw new Error("LIVE_WISSEN_JSON_KORRUPT");
  }
  if (wert === null || typeof wert !== "object" || Array.isArray(wert)) {
    throw new Error("LIVE_WISSEN_JSON_FORMAT_UNGUELTIG");
  }
  pruefeSecrets(wert);
}

function eindeutigePfade(pfade: readonly string[]): void {
  const sortiert = [...pfade].sort();
  for (let index = 1; index < sortiert.length; index += 1) {
    if (sortiert[index] === sortiert[index - 1]) {
      throw new Error("LIVE_WISSEN_DOPPELTER_PFAD");
    }
  }
}

export class LiveWissensDateispeicher implements LiveWissensSpeicherPort {
  readonly #dateisystem: LiveWissensDateisystemPort;
  readonly #optionen: LiveWissensSpeicherOptionen;

  public constructor(
    dateisystem: LiveWissensDateisystemPort,
    optionen: LiveWissensSpeicherOptionen,
  ) {
    if (!Number.isInteger(optionen.maximaleDateien) || optionen.maximaleDateien < 1) {
      throw new Error("LIVE_WISSEN_DATEIGRENZE_UNGUELTIG");
    }
    if (!Number.isInteger(optionen.maximaleEinzelBytes) || optionen.maximaleEinzelBytes < 1) {
      throw new Error("LIVE_WISSEN_EINZELGRENZE_UNGUELTIG");
    }
    if (!Number.isInteger(optionen.maximaleGesamtBytes) || optionen.maximaleGesamtBytes < 1) {
      throw new Error("LIVE_WISSEN_GESAMTGRENZE_UNGUELTIG");
    }
    this.#dateisystem = dateisystem;
    this.#optionen = optionen;
  }

  public async schreibeGenerationDurable(
    generation: LiveWissensGeneration,
  ): Promise<LiveWissensSchreibErgebnis> {
    if (generation.schemaVersion !== 1
        || !Number.isSafeInteger(generation.generation)
        || generation.generation < 1) {
      throw new Error("LIVE_WISSEN_GENERATION_UNGUELTIG");
    }
    if (generation.fakten.length > this.#optionen.maximaleDateien) {
      throw new Error("LIVE_WISSEN_ZU_VIELE_DATEIEN");
    }

    const normalisierte = generation.fakten.map(fakt => {
      const relativerPfad = normalisiereRelativenJsonPfad(fakt.relativerPfad);
      const bytes = utf8ByteLaenge(fakt.json);
      if (bytes > this.#optionen.maximaleEinzelBytes) {
        throw new Error("LIVE_WISSEN_DATEI_ZU_GROSS");
      }
      validiereFaktJson(fakt.json);
      return Object.freeze({
        relativerPfad,
        zielPfad: "aktuell/" + relativerPfad,
        json: fakt.json,
        bytes,
      });
    });

    eindeutigePfade(normalisierte.map(fakt => fakt.zielPfad));
    const gesamtBytes = normalisierte.reduce((summe, fakt) => summe + fakt.bytes, 0);
    if (gesamtBytes > this.#optionen.maximaleGesamtBytes) {
      throw new Error("LIVE_WISSEN_GESAMT_ZU_GROSS");
    }

    const manifest = JSON.stringify({
      schemaVersion: 1,
      format: "ADVENTURE_LAND_V5_LIVE_WISSEN",
      spiel: "Adventure Land - The Code MMORPG",
      aktuellVerzeichnis: "aktuell",
    }, null, 2) + "\n";

    const statusSchreibt = JSON.stringify({
      schemaVersion: 1,
      spiel: "Adventure Land - The Code MMORPG",
      generation: generation.generation,
      zustand: "SCHREIBT",
      aktualisiertAm: generation.aktualisiertAm,
    }, null, 2) + "\n";

    const statusBereit = JSON.stringify({
      schemaVersion: 1,
      spiel: "Adventure Land - The Code MMORPG",
      generation: generation.generation,
      zustand: "BEREIT",
      aktualisiertAm: generation.aktualisiertAm,
    }, null, 2) + "\n";

    const tempPraefix = "generation-" + generation.generation;

    await this.#vor("VOR_STATUS_SCHREIBT");
    await this.#dateisystem.schreibeAtomarDurable(
      "status.json",
      statusSchreibt,
      tempPraefix + "-status-schreibt",
    );

    await this.#vor("VOR_MANIFEST");
    await this.#dateisystem.schreibeAtomarDurable(
      "manifest.json",
      manifest,
      tempPraefix + "-manifest",
    );

    await this.#vor("VOR_FAKTEN");
    let index = 0;
    for (const fakt of normalisierte) {
      index += 1;
      await this.#dateisystem.schreibeAtomarDurable(
        fakt.zielPfad,
        fakt.json.endsWith("\n") ? fakt.json : fakt.json + "\n",
        tempPraefix + "-fakt-" + index,
      );
    }

    await this.#vor("VOR_STALE_ENTFERNUNG");
    const soll = normalisierte.map(fakt => fakt.zielPfad).sort();
    const vorhanden = [...await this.#dateisystem.listeAktuellJson()].sort();
    for (const pfad of vorhanden) {
      if (!soll.includes(pfad)) {
        await this.#dateisystem.entferneDurable(pfad);
      }
    }

    await this.#vor("VOR_STATUS_BEREIT");
    await this.#dateisystem.schreibeAtomarDurable(
      "status.json",
      statusBereit,
      tempPraefix + "-status-bereit",
    );

    return Object.freeze({
      durable: true,
      bestaetigungsId: "LIVE_WISSEN:" + generation.generation,
      generation: generation.generation,
      zustand: "BEREIT",
      dateien: normalisierte.length,
    });
  }

  async #vor(schritt: LiveWissensSchritt): Promise<void> {
    await this.#optionen.vorSchritt?.(schritt);
  }
}
