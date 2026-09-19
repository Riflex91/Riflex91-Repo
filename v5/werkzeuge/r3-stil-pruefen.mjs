import fs from "node:fs";
import path from "node:path";

const wurzel = process.cwd();
const ziele = [
  path.join(wurzel, "grundlage"),
  path.join(wurzel, "werkzeuge"),
];

function sammle(verzeichnis) {
  if (!fs.existsSync(verzeichnis)) return [];
  const ergebnis = [];
  for (const eintrag of fs.readdirSync(verzeichnis, { withFileTypes: true })) {
    const voll = path.join(verzeichnis, eintrag.name);
    if (eintrag.isDirectory()) ergebnis.push(...sammle(voll));
    else if (eintrag.isFile() && /\.(?:ts|mjs)$/.test(eintrag.name)) ergebnis.push(voll);
  }
  return ergebnis;
}

const dateien = ziele.flatMap(sammle).filter(datei =>
  datei.includes(path.sep + "grundlage" + path.sep)
  || path.basename(datei).startsWith("r3-"));

const fehler = [];
for (const datei of dateien) {
  const text = fs.readFileSync(datei, "utf8");
  const relativ = path.relative(wurzel, datei).replaceAll("\\", "/");
  if (text.includes("\r")) fehler.push(relativ + ": CRLF_NICHT_ERLAUBT");
  if (text.includes("\t")) fehler.push(relativ + ": TAB_NICHT_ERLAUBT");
  if (!text.endsWith("\n")) fehler.push(relativ + ": ABSCHLUSS_NEWLINE_FEHLT");
  text.split("\n").forEach((zeile, index) => {
    if (/\s+$/.test(zeile)) fehler.push(relativ + ":" + (index + 1) + ": TRAILING_WHITESPACE");
  });
}

if (fehler.length) throw new Error("[V5-R3-STIL]\n" + fehler.join("\n"));
console.log("[V5-R3-STIL] OK");
