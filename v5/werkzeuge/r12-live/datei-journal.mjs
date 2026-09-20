import fs from "node:fs";
import path from "node:path";

const TERMINAL_ARTEN = new Set(["COMMIT", "ABBRUCH", "SICHER_FEHLGESCHLAGEN"]);

export function pruefeDatenRoot(dataRoot) {
  const resolved = path.resolve(dataRoot);
  if (process.platform !== "win32") throw new Error("R12_LIVE_RUNNER_NUR_WINDOWS");
  const volumeRoot = path.parse(resolved).root;
  if (!/^[A-Za-z]:\\$/.test(volumeRoot)) throw new Error("R12_DATENROOT_VOLUME_UNGUELTIG");

  const stat = fs.statfsSync(volumeRoot);
  const total = Number(stat.blocks) * Number(stat.bsize);
  const frei = Number(stat.bavail) * Number(stat.bsize);
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(frei) || frei < 0) {
    throw new Error("R12_DATENROOT_STAT_UNGUELTIG");
  }
  const freiProzent = frei / total * 100;
  if (freiProzent < 15) throw new Error("R12_DATENROOT_RESERVE_UNTER_15_PROZENT");

  fs.mkdirSync(resolved, { recursive: true });
  const journalRoot = path.join(resolved, "journal", "r12-controlled-live");
  fs.mkdirSync(journalRoot, { recursive: true });

  const probe = path.join(journalRoot, ".durability-probe-" + process.pid);
  const fd = fs.openSync(probe, "wx");
  try {
    fs.writeFileSync(fd, "r12", "utf8");
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.unlinkSync(probe);
  return { dataRoot: resolved, journalRoot, freiProzent };
}

export class DurablesDateiJournal {
  constructor(root) {
    this.root = root;
  }

  #dir(transaktionsId) {
    return path.join(this.root, transaktionsId.replace(/[^A-Za-z0-9._-]/g, "_"));
  }

  async haengeDurableAn(eintrag) {
    const dir = this.#dir(eintrag.transaktionsId);
    fs.mkdirSync(dir, { recursive: true });
    const name = String(eintrag.sequenz).padStart(6, "0") + "-" + eintrag.art + ".json";
    const ziel = path.join(dir, name);
    const temp = ziel + ".tmp-" + process.pid;
    const fd = fs.openSync(temp, "wx");
    try {
      fs.writeFileSync(fd, JSON.stringify(eintrag, null, 2) + "\n", "utf8");
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(temp, ziel);
    const dirFd = fs.openSync(dir, "r");
    try { fs.fsyncSync(dirFd); } finally { fs.closeSync(dirFd); }
    return {
      durable: true,
      bestaetigungsId: "DATEI:" + name,
      journalId: eintrag.journalId,
      transaktionsId: eintrag.transaktionsId,
      sequenz: eintrag.sequenz,
    };
  }

  async liesTransaktion(transaktionsId) {
    const dir = this.#dir(transaktionsId);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(name => /^\d{6}-[A-Z_]+\.json$/.test(name))
      .sort()
      .map(name => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")));
  }
}

export function pruefeKeineOffeneV5Transaktion(journalRoot) {
  if (!fs.existsSync(journalRoot)) return;
  const dirs = fs.readdirSync(journalRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .slice(0, 512);
  for (const entry of dirs) {
    const dir = path.join(journalRoot, entry.name);
    const files = fs.readdirSync(dir)
      .filter(name => /^\d{6}-[A-Z_]+\.json$/.test(name))
      .sort()
      .slice(0, 64);
    const eintraege = files.map(name => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")));
    if (eintraege.some(x => x.art === "INTENT")
        && !eintraege.some(x => TERMINAL_ARTEN.has(x.art))) {
      throw new Error("R12_OFFENE_V5_TRANSAKTION:" + entry.name);
    }
  }
}
