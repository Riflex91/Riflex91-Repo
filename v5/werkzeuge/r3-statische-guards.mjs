import fs from "node:fs";
import path from "node:path";
import { pruefeQuelltext } from "./r3-guard-regeln.mjs";

const wurzel = process.cwd();
const quellWurzeln = [
  "grundlage/quelle",
  "laufzeit/quelle",
  "ausfuehrung/quelle",
  "module/quelle",
  "scheduler/quelle",
  "lernen/quelle",
  "host/quelle",
].map(pfad => path.join(wurzel, pfad));

function sammle(verzeichnis) {
  if (!fs.existsSync(verzeichnis)) return [];
  const ergebnis = [];
  for (const eintrag of fs.readdirSync(verzeichnis, { withFileTypes: true })) {
    const voll = path.join(verzeichnis, eintrag.name);
    if (eintrag.isDirectory()) ergebnis.push(...sammle(voll));
    else if (eintrag.isFile() && /\.(?:ts|mts|cts)$/.test(eintrag.name)) ergebnis.push(voll);
  }
  return ergebnis;
}

const fehler = [];
for (const basis of quellWurzeln) {
  for (const datei of sammle(basis)) {
    const relativ = path.relative(basis, datei).replaceAll("\\", "/");
    const text = fs.readFileSync(datei, "utf8");
    for (const grund of pruefeQuelltext(relativ, text)) {
      fehler.push(path.relative(wurzel, datei).replaceAll("\\", "/") + ": " + grund);
    }
  }
}

if (fehler.length > 0) {
  throw new Error("[V5-R3-GUARD]\n" + fehler.join("\n"));
}

console.log("[V5-R3-GUARD] OK");
