import fs from "node:fs";
import path from "node:path";

const wurzel = process.cwd();
const fehler = [];

const domaenenWurzeln = [
  "module/quelle",
  "merchant/quelle",
  "gruppe/quelle",
  "kampf/quelle",
  "bewegung/quelle",
  "navigation/quelle",
  "welt/quelle",
  "lernen/quelle",
  "oberflaeche/quelle",
];

function sammle(verzeichnis) {
  if (!fs.existsSync(verzeichnis)) return [];
  const ergebnis = [];
  for (const eintrag of fs.readdirSync(verzeichnis, { withFileTypes: true })) {
    const voll = path.join(verzeichnis, eintrag.name);
    if (eintrag.isDirectory()) ergebnis.push(...sammle(voll));
    else if (eintrag.isFile() && /\.(?:ts|mts|cts|mjs)$/.test(eintrag.name)) ergebnis.push(voll);
  }
  return ergebnis;
}

function normalisiere(pfad) {
  return pfad.replaceAll("\\", "/");
}

for (const quellWurzel of domaenenWurzeln) {
  const basis = path.join(wurzel, quellWurzel);
  const eigenesTop = quellWurzel.split("/")[0];
  for (const datei of sammle(basis)) {
    const relativ = normalisiere(path.relative(wurzel, datei));
    const text = fs.readFileSync(datei, "utf8");
    const importMuster = /(?:from\s+|import\s*\()\s*["']([^"']+)["']/g;
    for (const treffer of text.matchAll(importMuster)) {
      const ziel = treffer[1];
      if (ziel === undefined) continue;
      for (const fremd of domaenenWurzeln) {
        const fremdesTop = fremd.split("/")[0];
        if (fremdesTop === eigenesTop) continue;
        if (new RegExp("(?:^|/)" + fremdesTop + "/quelle(?:/|$)").test(ziel)) {
          fehler.push(relativ + ": DIREKTER_FREMDMODUL_IMPORT:" + fremdesTop);
        }
      }
    }
  }
}

const capabilityPfad = path.join(
  wurzel,
  "grundlage/quelle/autoritaet/faehigkeits-register.ts",
);
if (fs.existsSync(capabilityPfad)) {
  const text = fs.readFileSync(capabilityPfad, "utf8");
  if (!text.includes('definition.modus === "MUTIEREN" && definition.standardAktiv')) {
    fehler.push("FAEHIGKEITSREGISTER_DEFAULT_DENY_FEHLT");
  }
  if (!text.includes("MUTIERENDER_OWNER_BEREITS_VERGEBEN")) {
    fehler.push("FAEHIGKEITSREGISTER_SINGLE_OWNER_GUARD_FEHLT");
  }
  if (!text.includes("R7_MUTIERENDE_AKTIVIERUNG_GESPERRT")) {
    fehler.push("R7_MUTIERENDE_AKTIVIERUNG_NICHT_GESPERRT");
  }
}

const modulPfad = path.join(
  wurzel,
  "grundlage/quelle/autoritaet/modul-register.ts",
);
if (fs.existsSync(modulPfad)) {
  const text = fs.readFileSync(modulPfad, "utf8");
  if (!text.includes("R7_MODUL_STANDARD_AKTIV_VERBOTEN")) {
    fehler.push("MODULREGISTER_DEFAULT_DENY_FEHLT");
  }
  if (!text.includes("MODUL_ID_BEREITS_AKTIV")) {
    fehler.push("MODULREGISTER_SINGLE_VERSION_GUARD_FEHLT");
  }
  if (!text.includes("gleicherPortVertrag")) {
    fehler.push("MODULREGISTER_TYPISIERTE_PORTPRUEFUNG_FEHLT");
  }
}

const bedienerPfad = path.join(
  wurzel,
  "grundlage/quelle/autoritaet/bediener-richtlinie.ts",
);
if (fs.existsSync(bedienerPfad)) {
  const text = fs.readFileSync(bedienerPfad, "utf8");
  if (/NOTHALT_(?:DEAKTIVIEREN|ZURUECKSETZEN)|FAEHIGKEIT_(?:ERLAUBEN|FREIGEBEN)/.test(text)) {
    fehler.push("BEDIENER_RICHTLINIE_DARF_AUTHORITY_NICHT_ERHOEHEN");
  }
  if (!text.includes("gameplayAutoritaetErhoeht: false")
      || !text.includes("safetyUmgangen: false")) {
    fehler.push("BEDIENER_AUDIT_SAFETY_MARKER_FEHLT");
  }
}

if (fehler.length > 0) {
  throw new Error("[V5-R7-GUARD]\n" + [...new Set(fehler)].join("\n"));
}
console.log("[V5-R7-GUARD] OK");
