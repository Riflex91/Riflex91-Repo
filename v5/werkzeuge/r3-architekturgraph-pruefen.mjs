import fs from "node:fs";
import path from "node:path";
import {
  pruefeArchitekturGraph,
  pruefeDeklariertenLayerGraph,
} from "./r3-architekturgraph-regeln.mjs";

const wurzel = process.cwd();
const coreWurzel = path.join(wurzel, "grundlage", "quelle");

function sammle(verzeichnis) {
  if (!fs.existsSync(verzeichnis)) return [];
  const ergebnis = [];
  for (const eintrag of fs.readdirSync(verzeichnis, { withFileTypes: true })) {
    const voll = path.join(verzeichnis, eintrag.name);
    if (eintrag.isDirectory()) {
      ergebnis.push(...sammle(voll));
    } else if (eintrag.isFile() && /\.(?:ts|mts|cts)$/.test(eintrag.name)) {
      ergebnis.push(voll);
    }
  }
  return ergebnis;
}

const dateien = Object.fromEntries(
  sammle(coreWurzel)
    .map(voll => {
      const relativ = path.relative(wurzel, voll).replaceAll("\\", "/");
      return [relativ, fs.readFileSync(voll, "utf8")];
    })
    .sort((a, b) => a[0].localeCompare(b[0])),
);

const verfassung = JSON.parse(
  fs.readFileSync(path.join(wurzel, "architektur", "verfassung.json"), "utf8"),
);

const fehler = [
  ...pruefeArchitekturGraph(dateien),
  ...pruefeDeklariertenLayerGraph(verfassung.layerGraph),
];

if (fehler.length > 0) {
  throw new Error("[V5-R3-ARCHITEKTURGRAPH]\n" + fehler.join("\n"));
}

console.log(
  "[V5-R3-ARCHITEKTURGRAPH] OK",
  Object.keys(dateien).length,
  "Core-Dateien",
);
