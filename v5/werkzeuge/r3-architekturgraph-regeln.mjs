import path from "node:path";

const CORE_ROOT = "grundlage/quelle/";

const ACCOUNT_OWNER = Object.freeze([
  "merchant",
  "produktion",
  "koordination",
]);

const CHARACTER_OWNER = Object.freeze([
  "farmer",
  "kampf",
  "navigation",
  "gruppe",
]);

const VERBOTENE_ALTPFAD_TEILE = Object.freeze([
  "/v3/",
  "/v4/",
  "/tests/",
  "/test/",
  "/werkzeuge/",
  "/erzeugt/",
  "/dist/",
]);

function normalisiere(pfad) {
  return pfad.replaceAll("\\", "/").replace(/^\.\//, "");
}

function fuegeReferenzHinzu(rows, referenz) {
  const vorhanden = rows.find(x =>
    x.ziel === referenz.ziel && x.typOnly === referenz.typOnly);
  if (vorhanden !== undefined) return rows;
  return [...rows, Object.freeze(referenz)];
}

function nurTypenInGeschweiftenKlammern(klausel) {
  const innen = klausel.trim().replace(/^\{/, "").replace(/\}$/, "").trim();
  if (innen.length === 0) return false;
  return innen
    .split(",")
    .map(x => x.trim())
    .filter(Boolean)
    .every(x => /^type\s+/.test(x));
}

export function importReferenzen(quelltext) {
  let rows = [];

  const typeFrom = /\b(?:import|export)\s+type\s+[\s\S]*?\s+from\s+["']([^"']+)["']/g;
  for (const treffer of quelltext.matchAll(typeFrom)) {
    const ziel = treffer[1];
    if (ziel !== undefined) {
      rows = fuegeReferenzHinzu(rows, { ziel, typOnly: true });
    }
  }

  const braceFrom = /\b(import|export)\s+(\{[\s\S]*?\})\s+from\s+["']([^"']+)["']/g;
  for (const treffer of quelltext.matchAll(braceFrom)) {
    const klausel = treffer[2];
    const ziel = treffer[3];
    if (klausel !== undefined && ziel !== undefined) {
      rows = fuegeReferenzHinzu(rows, {
        ziel,
        typOnly: nurTypenInGeschweiftenKlammern(klausel),
      });
    }
  }

  const defaultFrom = /\bimport\s+(?!type\b)(?!\{)([^;"']+?)\s+from\s+["']([^"']+)["']/g;
  for (const treffer of quelltext.matchAll(defaultFrom)) {
    const ziel = treffer[2];
    if (ziel !== undefined) {
      rows = fuegeReferenzHinzu(rows, { ziel, typOnly: false });
    }
  }

  const exportStar = /\bexport\s+\*\s+from\s+["']([^"']+)["']/g;
  for (const treffer of quelltext.matchAll(exportStar)) {
    const ziel = treffer[1];
    if (ziel !== undefined) {
      rows = fuegeReferenzHinzu(rows, { ziel, typOnly: false });
    }
  }

  const sideEffect = /\bimport\s*["']([^"']+)["']/g;
  for (const treffer of quelltext.matchAll(sideEffect)) {
    const ziel = treffer[1];
    if (ziel !== undefined) {
      rows = fuegeReferenzHinzu(rows, { ziel, typOnly: false });
    }
  }

  const dynamic = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
  for (const treffer of quelltext.matchAll(dynamic)) {
    const ziel = treffer[1];
    if (ziel !== undefined) {
      rows = fuegeReferenzHinzu(rows, { ziel, typOnly: false });
    }
  }

  const required = /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g;
  for (const treffer of quelltext.matchAll(required)) {
    const ziel = treffer[1];
    if (ziel !== undefined) {
      rows = fuegeReferenzHinzu(rows, { ziel, typOnly: false });
    }
  }

  return Object.freeze(rows);
}

function zielKandidaten(von, anforderung) {
  const basis = normalisiere(
    path.posix.normalize(
      path.posix.join(path.posix.dirname(von), anforderung),
    ),
  );
  const ohneJs = basis
    .replace(/\.mjs$/, ".mts")
    .replace(/\.cjs$/, ".cts")
    .replace(/\.js$/, ".ts");
  const hatErweiterung = /\.(?:ts|mts|cts)$/.test(ohneJs);
  return Object.freeze(
    hatErweiterung
      ? [ohneJs]
      : [
          ohneJs + ".ts",
          ohneJs + ".mts",
          ohneJs + ".cts",
          path.posix.join(ohneJs, "index.ts"),
        ],
  );
}

function ownerKlasse(pfad) {
  const normalisiert = normalisiere(pfad);
  if (!normalisiert.startsWith(CORE_ROOT)) return null;
  const top = normalisiert.slice(CORE_ROOT.length).split("/")[0];
  if (ACCOUNT_OWNER.includes(top)) return "ACCOUNT";
  if (CHARACTER_OWNER.includes(top)) return "CHARACTER";
  return null;
}

function istVerbotenerAltpfad(anforderung) {
  const n = "/" + normalisiere(anforderung).toLowerCase();
  return VERBOTENE_ALTPFAD_TEILE.some(x => n.includes(x));
}

function zyklusSignatur(zyklus) {
  if (zyklus.length < 2) return zyklus.join(" -> ");
  const ring = zyklus.slice(0, -1);
  const varianten = ring.map((_, index) => [
    ...ring.slice(index),
    ...ring.slice(0, index),
  ]);
  varianten.sort((a, b) => a.join("|").localeCompare(b.join("|")));
  const kanonisch = varianten[0] ?? ring;
  return [...kanonisch, kanonisch[0]].join(" -> ");
}

export function pruefeDeklariertenLayerGraph(layerGraph) {
  const fehler = [];
  if (layerGraph?.azyklisch !== true || !Array.isArray(layerGraph?.layer)) {
    return Object.freeze(["LAYER_GRAPH_UNGUELTIG"]);
  }

  const ids = layerGraph.layer.map(x => x?.id).filter(x => typeof x === "string");
  if (ids.length !== layerGraph.layer.length || new Set(ids).size !== ids.length) {
    fehler.push("LAYER_GRAPH_IDS_UNGUELTIG_ODER_DOPPELT");
    return Object.freeze(fehler);
  }

  const kanten = new Map();
  for (const layer of layerGraph.layer) {
    if (!Array.isArray(layer.darfAbhaengenVon)) {
      fehler.push("LAYER_GRAPH_ABHAENGIGKEITEN_UNGUELTIG:" + layer.id);
      continue;
    }
    const deps = [];
    for (const dep of layer.darfAbhaengenVon) {
      if (!ids.includes(dep)) {
        fehler.push("LAYER_GRAPH_UNBEKANNTE_REFERENZ:" + layer.id + "->" + dep);
      } else if (dep === layer.id) {
        fehler.push("LAYER_GRAPH_SELBSTZYKLUS:" + layer.id);
      } else if (!deps.includes(dep)) {
        deps.push(dep);
      }
    }
    kanten.set(layer.id, deps);
  }

  const status = new Map();
  const stapel = [];
  const gemeldete = new Set();

  const besuche = id => {
    const s = status.get(id) ?? 0;
    if (s === 2) return;
    if (s === 1) return;
    status.set(id, 1);
    stapel.push(id);
    for (const dep of kanten.get(id) ?? []) {
      if ((status.get(dep) ?? 0) === 1) {
        const start = stapel.lastIndexOf(dep);
        const zyklus = [...stapel.slice(start), dep];
        const signatur = zyklusSignatur(zyklus);
        if (!gemeldete.has(signatur)) {
          gemeldete.add(signatur);
          fehler.push("LAYER_GRAPH_ZYKLUS:" + signatur);
        }
      } else {
        besuche(dep);
      }
    }
    stapel.pop();
    status.set(id, 2);
  };

  for (const id of ids) besuche(id);
  return Object.freeze([...fehler].sort());
}

export function pruefeArchitekturGraph(dateien) {
  const pfade = Object.keys(dateien).map(normalisiere).sort();
  const pfadSet = new Set(pfade);
  const fehler = [];
  const kanten = new Map(pfade.map(x => [x, []]));

  for (const von of pfade) {
    const quelltext = String(dateien[von] ?? "");
    for (const ref of importReferenzen(quelltext)) {
      const anforderung = ref.ziel;
      const klein = anforderung.toLowerCase();

      if (istVerbotenerAltpfad(anforderung)
          || /(?:^|\/)v[34](?:\/|$)/.test(klein)) {
        fehler.push("LEGACY_ODER_ALTPFAD_IMPORT:" + von + ":" + anforderung);
      }

      if (!anforderung.startsWith(".")) continue;

      const kandidaten = zielKandidaten(von, anforderung);
      const ziel = kandidaten.find(x => pfadSet.has(x));
      const normalisiertesBasisziel = normalisiere(
        path.posix.normalize(
          path.posix.join(path.posix.dirname(von), anforderung),
        ),
      );

      if (!normalisiertesBasisziel.startsWith(CORE_ROOT)) {
        fehler.push("RELATIVER_CORE_IMPORT_VERLAESST_QUELLWURZEL:"
          + von + ":" + anforderung);
        continue;
      }

      if (ziel === undefined) {
        fehler.push("RELATIVES_IMPORTZIEL_NICHT_AUFLOESBAR:"
          + von + ":" + anforderung);
        continue;
      }

      kanten.get(von)?.push(ziel);

      const vonOwner = ownerKlasse(von);
      const zielOwner = ownerKlasse(ziel);
      if (vonOwner !== null
          && zielOwner !== null
          && vonOwner !== zielOwner
          && ref.typOnly !== true) {
        fehler.push(
          "CROSS_OWNER_VALUE_IMPORT:"
          + vonOwner + "->" + zielOwner + ":"
          + von + "->" + ziel,
        );
      }

      if (ziel === "grundlage/quelle/runtime/produktions-runtime.ts"
          && von !== "grundlage/quelle/index.ts"
          && !von.startsWith("grundlage/quelle/runtime/")) {
        fehler.push("ALTERNATIVER_RUNTIME_EINSTIEG:" + von + "->" + ziel);
      }
    }
  }

  const status = new Map();
  const stapel = [];
  const gemeldete = new Set();

  const besuche = pfad => {
    const s = status.get(pfad) ?? 0;
    if (s === 2) return;
    if (s === 1) return;
    status.set(pfad, 1);
    stapel.push(pfad);
    for (const ziel of kanten.get(pfad) ?? []) {
      if ((status.get(ziel) ?? 0) === 1) {
        const start = stapel.lastIndexOf(ziel);
        const zyklus = [...stapel.slice(start), ziel];
        const signatur = zyklusSignatur(zyklus);
        if (!gemeldete.has(signatur)) {
          gemeldete.add(signatur);
          fehler.push("IMPORT_GRAPH_ZYKLUS:" + signatur);
        }
      } else {
        besuche(ziel);
      }
    }
    stapel.pop();
    status.set(pfad, 2);
  };

  for (const pfad of pfade) besuche(pfad);
  return Object.freeze([...new Set(fehler)].sort());
}
