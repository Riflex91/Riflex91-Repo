import fs from "node:fs";
import path from "node:path";

const fehler = text => { throw new Error("[V5-GESAMTFREIGABE] " + text); };

function repoWurzel() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "v5", "bereitschaft", "laufzeit-bereitschaft.json"))) return cwd;
  const parent = path.resolve(cwd, "..");
  if (fs.existsSync(path.join(parent, "v5", "bereitschaft", "laufzeit-bereitschaft.json"))) return parent;
  fehler("Repository-Wurzel konnte nicht bestimmt werden.");
}

const erwarteteCiNamen = [
  "v5-vorbereitung",
  "v5-roadmap",
  "v5-wissensgate",
  "v5-r19",
  "windows-bridge",
];

export function pruefeGesamtfreigabe() {
  const root = repoWurzel();
  const lies = rel => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));

  const bereitschaft = lies("v5/bereitschaft/laufzeit-bereitschaft.json");
  const vorbereitung = lies("v5/roadmap/gesamtfreigabe-vorbereitung.json");
  const gates = lies("v5/roadmap/gates.json");
  const r19 = lies("v5/roadmap/r19-abschluss.json");
  const wissen012 = lies("v5/roadmap/v5-wissen-012-autorisierungsnachweis.json");
  const anforderungen = lies("v5/anforderungen/anforderungen.json").anforderungen;
  const trace = lies("v5/anforderungen/nachverfolgbarkeit.json").eintraege;

  if (vorbereitung.schemaVersion !== 1
      || vorbereitung.kennung !== "V5_GESAMTFREIGABE_VORBEREITUNG"
      || vorbereitung.status !== "BEREIT_FUER_BETREIBERBESTAETIGUNG"
      || !/^[0-9a-f]{40}$/.test(vorbereitung.technischeBasisSha ?? "")) {
    fehler("Gesamtfreigabe-Vorbereitung ist formal ungueltig.");
  }

  if (bereitschaft.bereiche?.length !== 10
      || bereitschaft.bereiche.some(x => x.erfuellt !== true)) {
    fehler("Gesamtfreigabe verlangt 10/10 technisch erfuellte Pflichtbereiche.");
  }

  if (anforderungen.length !== 119
      || anforderungen.some(x => x.status === "OFFEN")
      || trace.length !== 119
      || trace.some(x => x.vollstaendig !== true)) {
    fehler("Gesamtfreigabe verlangt 119/119 Anforderungen und 119/119 Traceability.");
  }

  if (vorbereitung.voraussetzungen?.pflichtbereicheErfuellt !== 10
      || vorbereitung.voraussetzungen?.pflichtbereicheGesamt !== 10
      || vorbereitung.voraussetzungen?.anforderungenNachgewiesen !== 119
      || vorbereitung.voraussetzungen?.anforderungenGesamt !== 119
      || vorbereitung.voraussetzungen?.traceabilityVollstaendig !== 119
      || vorbereitung.voraussetzungen?.traceabilityGesamt !== 119
      || vorbereitung.voraussetzungen?.r0R3Reconciliation !== "34_VON_34"
      || vorbereitung.voraussetzungen?.r19Status !== "DONE"
      || vorbereitung.voraussetzungen?.r19Ladder !== "VOLLSTAENDIG_BESTANDEN"
      || vorbereitung.voraussetzungen?.wissen012 !== "NACHGEWIESEN"
      || vorbereitung.voraussetzungen?.windowsBridgeReadiness !== "REALER_PC_NACHWEIS_BESTANDEN") {
    fehler("Gesamtfreigabe-Vorbereitung bildet die technischen Voraussetzungen nicht vollstaendig ab.");
  }

  const phasen = gates.phases ?? [];
  if (phasen.length !== 20
      || phasen.some(x => x.status !== "DONE")
      || gates.currentPhase !== "R19") {
    fehler("Gesamtfreigabe verlangt R0-R19 DONE.");
  }

  if (r19.phase !== "R19"
      || r19.status !== "DONE"
      || r19.ladder?.status !== "VOLLSTAENDIG_BESTANDEN"
      || r19.ladder?.finaleStufe !== "SOAK_15M"
      || r19.breiteRuntimeFreigabe !== false
      || r19.gesamtfreigabe !== "SEPARAT_AUSSTEHEND") {
    fehler("R19-Abschluss ist fuer die separate Gesamtfreigabe nicht gueltig.");
  }

  if (wissen012.status !== "NACHGEWIESEN"
      || wissen012.bewertung?.anforderungErfuellt !== true
      || wissen012.manuellerNachweis?.tokenwertErfasst !== false
      || wissen012.manuellerNachweis?.tokenwertImRepository !== false) {
    fehler("WISSEN-012-Nachweis fehlt oder enthaelt eine unerlaubte Token-Semantik.");
  }

  const ci = vorbereitung.postMergeCi ?? [];
  if (ci.length !== erwarteteCiNamen.length
      || erwarteteCiNamen.some(name => !ci.some(x => x.name === name && x.status === "success" && Number.isInteger(x.runId)))) {
    fehler("Post-Merge-CI-Evidence fuer die Freigabevorbereitung ist unvollstaendig.");
  }

  if (vorbereitung.betreiberfreigabe?.erforderlich !== true
      || vorbereitung.betreiberfreigabe?.bestaetigungText !== "V5 GESAMTFREIGABE ERTEILEN"
      || vorbereitung.sicherheit?.automatischeGesamtfreigabe !== false
      || vorbereitung.sicherheit?.capabilitySafetyBleibtErforderlich !== true
      || vorbereitung.sicherheit?.operatorDenyBleibtWirksam !== true
      || vorbereitung.sicherheit?.killSwitchBleibtWirksam !== true
      || vorbereitung.sicherheit?.actionContractsBleibenErforderlich !== true
      || vorbereitung.sicherheit?.admissionBleibtErforderlich !== true) {
    fehler("Betreiber-/Safety-Vertrag der Gesamtfreigabe ist unvollstaendig.");
  }

  const freigabeRel = vorbereitung.freigabeArtefakt;
  if (freigabeRel !== "v5/roadmap/gesamtfreigabe.json") {
    fehler("Unerwarteter Pfad fuer das finale Gesamtfreigabe-Artefakt.");
  }
  const freigabePfad = path.join(root, freigabeRel);
  const hatFinaleFreigabe = fs.existsSync(freigabePfad);

  if (!hatFinaleFreigabe) {
    if (vorbereitung.betreiberfreigabe.status !== "AUSSTEHEND"
        || bereitschaft.status !== "GESPERRT"
        || bereitschaft.gesamtfreigabe !== "BETREIBERBESTAETIGUNG_AUSSTEHEND"
        || bereitschaft.breiteRuntimeFreigabe !== false
        || bereitschaft.offeneBlocker?.length !== 1) {
      fehler("Ohne finale Betreiberfreigabe muss die breite Runtime fail-closed gesperrt bleiben.");
    }

    console.log("[V5-GESAMTFREIGABE] BEREIT_FUER_BETREIBERBESTAETIGUNG");
    console.log("[V5-GESAMTFREIGABE] Runtime: GESPERRT");
    return Object.freeze({ status: "BEREIT_FUER_BETREIBERBESTAETIGUNG", freigegeben: false });
  }

  const freigabe = lies(freigabeRel);
  if (freigabe.schemaVersion !== 1
      || freigabe.kennung !== "V5_GESAMTFREIGABE"
      || freigabe.status !== "ERTEILT"
      || freigabe.bestaetigungQuelle !== "BETREIBER_INTERAKTIV"
      || freigabe.bestaetigungText !== vorbereitung.betreiberfreigabe.bestaetigungText
      || freigabe.vorbereitung !== "v5/roadmap/gesamtfreigabe-vorbereitung.json"
      || !/^[0-9a-f]{40}$/.test(freigabe.releaseCandidateSha ?? "")
      || freigabe.sicherheit?.capabilitySafetyBleibtErforderlich !== true
      || freigabe.sicherheit?.operatorDenyBleibtWirksam !== true
      || freigabe.sicherheit?.killSwitchBleibtWirksam !== true
      || freigabe.sicherheit?.actionContractsBleibenErforderlich !== true
      || freigabe.sicherheit?.admissionBleibtErforderlich !== true) {
    fehler("Finales Gesamtfreigabe-Artefakt ist unvollstaendig oder lockert Safety.");
  }

  if (bereitschaft.status !== "FREIGEGEBEN"
      || bereitschaft.gesamtfreigabe !== "ERTEILT"
      || bereitschaft.breiteRuntimeFreigabe !== true
      || (bereitschaft.offeneBlocker?.length ?? 0) !== 0) {
    fehler("Finales Freigabeartefakt und Laufzeit-Bereitschaft sind nicht konsistent.");
  }

  console.log("[V5-GESAMTFREIGABE] FREIGEGEBEN");
  console.log("[V5-GESAMTFREIGABE] Runtime: FREIGEGEBEN");
  return Object.freeze({ status: "FREIGEGEBEN", freigegeben: true });
}

if (process.argv[1]?.endsWith("gesamtfreigabe-pruefen.mjs")) {
  pruefeGesamtfreigabe();
}
