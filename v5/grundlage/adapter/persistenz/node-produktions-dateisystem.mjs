import fs from "node:fs/promises";
import path from "node:path";

export const STANDARD_PRODUKTIONS_WURZEL =
  String.raw`D:\AdventureLand-V5`;

function normalisiereProduktionsWurzel(wurzel) {
  return String(wurzel).replaceAll("/", "\\").replace(/\\+$/, "").toUpperCase();
}

export function mappeProduktionsDateisystemFehler(fehler) {
  const code = fehler && typeof fehler === "object" ? fehler.code : undefined;
  if (code === "ENOSPC") return new Error("SPEICHER_VOLL");
  if (code === "EACCES" || code === "EPERM") return new Error("ZUGRIFF_VERWEIGERT");
  if (code === "EROFS") return new Error("DATEISYSTEM_NUR_LESEN");
  if (code === "EIO") return new Error("DATEISYSTEM_IO_FEHLER");
  return fehler instanceof Error
    ? fehler
    : new Error("DATEISYSTEM_UNBEKANNTER_FEHLER");
}

function validiereRelativenPfad(relativerPfad) {
  const normalisiert = String(relativerPfad).replaceAll("\\", "/");
  if (normalisiert.length === 0
      || normalisiert.startsWith("/")
      || normalisiert.startsWith("../")
      || normalisiert.includes("/../")
      || normalisiert.includes(":")) {
    throw new Error("DATEISYSTEM_RELATIVER_PFAD_UNGUELTIG");
  }
  return normalisiert;
}

export class NodeProduktionsDateisystem {
  #wurzel;

  constructor({
    wurzel = STANDARD_PRODUKTIONS_WURZEL,
    testmodus = false,
  } = {}) {
    if (!testmodus
        && normalisiereProduktionsWurzel(wurzel)
          !== normalisiereProduktionsWurzel(STANDARD_PRODUKTIONS_WURZEL)) {
      throw new Error("PRODUKTIONS_DATEISYSTEM_WURZEL_UNGUELTIG");
    }
    this.#wurzel = path.resolve(wurzel);
  }

  get wurzel() {
    return this.#wurzel;
  }

  async schreibeAtomarDurable(relativerPfad, inhalt, tempKennung) {
    const ziel = this.#ziel(relativerPfad);
    const tempName = "." + path.basename(ziel) + ".tmp-" + this.#tempKennung(tempKennung);
    const temp = path.join(path.dirname(ziel), tempName);
    let handle;

    try {
      await fs.mkdir(path.dirname(ziel), { recursive: true });
      await fs.rm(temp, { force: true });
      handle = await fs.open(temp, "wx");
      await handle.writeFile(inhalt, "utf8");
      await handle.sync();
      await handle.close();
      handle = undefined;
      await fs.rename(temp, ziel);
      await this.#syncVerzeichnisBestEffort(path.dirname(ziel));
    } catch (fehler) {
      try {
        if (handle !== undefined) await handle.close();
      } catch {
        // Best effort cleanup only.
      }
      try {
        await fs.rm(temp, { force: true });
      } catch {
        // Original error wins.
      }
      throw mappeProduktionsDateisystemFehler(fehler);
    }
  }

  async haengeTextDurable(relativerPfad, inhalt) {
    const ziel = this.#ziel(relativerPfad);
    let handle;
    try {
      await fs.mkdir(path.dirname(ziel), { recursive: true });
      handle = await fs.open(ziel, "a");
      await handle.writeFile(inhalt, "utf8");
      await handle.sync();
      await handle.close();
      handle = undefined;
      await this.#syncVerzeichnisBestEffort(path.dirname(ziel));
    } catch (fehler) {
      try {
        if (handle !== undefined) await handle.close();
      } catch {
        // Original error wins.
      }
      throw mappeProduktionsDateisystemFehler(fehler);
    }
  }

  async erstelleExklusivDurable(relativerPfad, inhalt) {
    const ziel = this.#ziel(relativerPfad);
    let handle;
    try {
      await fs.mkdir(path.dirname(ziel), { recursive: true });
      handle = await fs.open(ziel, "wx");
      await handle.writeFile(inhalt, "utf8");
      await handle.sync();
      await handle.close();
      handle = undefined;
      await this.#syncVerzeichnisBestEffort(path.dirname(ziel));
      return true;
    } catch (fehler) {
      try {
        if (handle !== undefined) await handle.close();
      } catch {
        // Original error wins.
      }
      if (fehler && typeof fehler === "object" && fehler.code === "EEXIST") {
        return false;
      }
      throw mappeProduktionsDateisystemFehler(fehler);
    }
  }

  async liesText(relativerPfad) {
    try {
      return await fs.readFile(this.#ziel(relativerPfad), "utf8");
    } catch (fehler) {
      if (fehler && typeof fehler === "object" && fehler.code === "ENOENT") {
        return undefined;
      }
      throw mappeProduktionsDateisystemFehler(fehler);
    }
  }

  async #syncVerzeichnisBestEffort(verzeichnis) {
    if (process.platform === "win32") return;
    let handle;
    try {
      handle = await fs.open(verzeichnis, "r");
      await handle.sync();
    } catch {
      // Temp-Datei ist bereits fsync't; Verzeichnis-fsync ist POSIX-Haertung.
    } finally {
      if (handle !== undefined) await handle.close();
    }
  }

  #ziel(relativerPfad) {
    const normalisiert = validiereRelativenPfad(relativerPfad);
    const ziel = path.resolve(this.#wurzel, ...normalisiert.split("/"));
    const prefix = this.#wurzel.endsWith(path.sep)
      ? this.#wurzel
      : this.#wurzel + path.sep;
    if (ziel !== this.#wurzel && !ziel.startsWith(prefix)) {
      throw new Error("DATEISYSTEM_PFAD_AUSSERHALB_WURZEL");
    }
    return ziel;
  }

  #tempKennung(wert) {
    const sauber = String(wert).replace(/[^A-Za-z0-9._-]/g, "_");
    if (sauber.length === 0 || sauber.length > 120) {
      throw new Error("TEMP_KENNUNG_UNGUELTIG");
    }
    return sauber;
  }
}
