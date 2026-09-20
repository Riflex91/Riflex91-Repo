import test from "node:test";
import assert from "node:assert/strict";

import {
  importReferenzen,
  pruefeArchitekturGraph,
  pruefeDeklariertenLayerGraph,
} from "../r3-architekturgraph-regeln.mjs";

function hat(fehler, prefix) {
  assert.ok(
    fehler.some(x => x.startsWith(prefix)),
    "Erwarteter Fehler fehlt: " + prefix + "\n" + fehler.join("\n"),
  );
}

test("CAP-046 erkennt direkten Importgraph-Zyklus", () => {
  const fehler = pruefeArchitekturGraph({
    "grundlage/quelle/kern/a.ts": 'import { b } from "./b.js"; export const a=b;',
    "grundlage/quelle/kern/b.ts": 'import { c } from "./c.js"; export const b=c;',
    "grundlage/quelle/kern/c.ts": 'import { a } from "./a.js"; export const c=a;',
  });
  hat(fehler, "IMPORT_GRAPH_ZYKLUS:");
});

test("CAP-046 erlaubt azyklischen Core-Importgraph", () => {
  const fehler = pruefeArchitekturGraph({
    "grundlage/quelle/kern/a.ts": 'import { b } from "./b.js"; export const a=b;',
    "grundlage/quelle/kern/b.ts": "export const b=1;",
  });
  assert.deepEqual(fehler, []);
});

test("CAP-046 blockiert Account-Owner zu Character-Owner Value-Import", () => {
  const fehler = pruefeArchitekturGraph({
    "grundlage/quelle/merchant/plan.ts":
      'import { skill } from "../kampf/skill.js"; export const x=skill;',
    "grundlage/quelle/kampf/skill.ts": "export const skill=1;",
  });
  hat(fehler, "CROSS_OWNER_VALUE_IMPORT:ACCOUNT->CHARACTER:");
});

test("CAP-046 blockiert Character-Owner zu Account-Owner Value-Import", () => {
  const fehler = pruefeArchitekturGraph({
    "grundlage/quelle/farmer/plan.ts":
      'import { bank } from "../merchant/bank.js"; export const x=bank;',
    "grundlage/quelle/merchant/bank.ts": "export const bank=1;",
  });
  hat(fehler, "CROSS_OWNER_VALUE_IMPORT:CHARACTER->ACCOUNT:");
});

test("CAP-046 erlaubt reinen Type-Import ueber Owner-Grenze", () => {
  const fehler = pruefeArchitekturGraph({
    "grundlage/quelle/merchant/plan.ts":
      'import type { SkillEvidence } from "../kampf/skill.js"; export type X=SkillEvidence;',
    "grundlage/quelle/kampf/skill.ts":
      "export interface SkillEvidence { readonly ok: boolean }",
  });
  assert.deepEqual(fehler, []);
});

test("CAP-046 erlaubt import { type ... } ueber Owner-Grenze", () => {
  const fehler = pruefeArchitekturGraph({
    "grundlage/quelle/gruppe/cap.ts":
      'import { type SkillEvidence, type SkillId } from "../kampf/skill.js"; export type X=SkillEvidence & { id: SkillId };',
    "grundlage/quelle/kampf/skill.ts":
      "export interface SkillEvidence { readonly ok: boolean }\nexport type SkillId=string;",
  });
  assert.deepEqual(fehler, []);
});

test("CAP-046 blockiert Legacy-Runtime-Altpfad", () => {
  const fehler = pruefeArchitekturGraph({
    "grundlage/quelle/kern/a.ts":
      'import x from "../../../v3/src/runtime.js"; export { x };',
  });
  hat(fehler, "LEGACY_ODER_ALTPFAD_IMPORT:");
});

test("CAP-046 blockiert Test-, Werkzeug-, erzeugte- und Dist-Abhaengigkeiten", () => {
  for (const ziel of [
    "../../../werkzeuge/hilfe.mjs",
    "../../tests/hilfe.js",
    "../../../erzeugt/index.js",
    "../../../dist/bundle.js",
  ]) {
    const fehler = pruefeArchitekturGraph({
      "grundlage/quelle/kern/a.ts":
        'import x from "' + ziel + '"; export { x };',
    });
    hat(fehler, "LEGACY_ODER_ALTPFAD_IMPORT:");
  }
});

test("CAP-046 blockiert relativen Import ausserhalb der Core-Quellwurzel", () => {
  const fehler = pruefeArchitekturGraph({
    "grundlage/quelle/kern/a.ts":
      'import x from "../../../architektur/verfassung.json"; export { x };',
  });
  hat(fehler, "RELATIVER_CORE_IMPORT_VERLAESST_QUELLWURZEL:");
});

test("CAP-046 blockiert direkten Runtime-Nebenpfad aus Fachdomaene", () => {
  const fehler = pruefeArchitekturGraph({
    "grundlage/quelle/merchant/a.ts":
      'import { V5ProduktionsRuntime } from "../runtime/produktions-runtime.js"; export const X=V5ProduktionsRuntime;',
    "grundlage/quelle/runtime/produktions-runtime.ts":
      "export class V5ProduktionsRuntime {}",
  });
  hat(fehler, "ALTERNATIVER_RUNTIME_EINSTIEG:");
});

test("CAP-046 erlaubt Runtime-interne Komposition und Index-Reexport", () => {
  const fehler = pruefeArchitekturGraph({
    "grundlage/quelle/runtime/helper.ts":
      'import { V5ProduktionsRuntime } from "./produktions-runtime.js"; export const X=V5ProduktionsRuntime;',
    "grundlage/quelle/runtime/produktions-runtime.ts":
      "export class V5ProduktionsRuntime {}",
    "grundlage/quelle/index.ts":
      'export * from "./runtime/produktions-runtime.js";',
  });
  assert.deepEqual(fehler, []);
});

test("CAP-046 import parser erkennt dynamic import und require als Value-Abhaengigkeit", () => {
  const refs = importReferenzen(
    'const a=import("./a.js"); const b=require("./b.js");',
  );
  assert.deepEqual(
    refs.map(x => [x.ziel, x.typOnly]),
    [["./a.js", false], ["./b.js", false]],
  );
});

test("CAP-046 validiert ratifizierten LayerGraph als azyklisch", () => {
  const fehler = pruefeDeklariertenLayerGraph({
    azyklisch: true,
    layer: [
      { id: "WISSEN", darfAbhaengenVon: [] },
      { id: "BEOBACHTUNG", darfAbhaengenVon: ["WISSEN"] },
      { id: "PLANUNG", darfAbhaengenVon: ["BEOBACHTUNG"] },
    ],
  });
  assert.deepEqual(fehler, []);
});

test("CAP-046 erkennt Zyklus im deklarierten LayerGraph", () => {
  const fehler = pruefeDeklariertenLayerGraph({
    azyklisch: true,
    layer: [
      { id: "A", darfAbhaengenVon: ["B"] },
      { id: "B", darfAbhaengenVon: ["A"] },
    ],
  });
  hat(fehler, "LAYER_GRAPH_ZYKLUS:");
});

test("CAP-046 erkennt unbekannte Layer-Referenz", () => {
  const fehler = pruefeDeklariertenLayerGraph({
    azyklisch: true,
    layer: [
      { id: "A", darfAbhaengenVon: ["NICHT_DA"] },
    ],
  });
  hat(fehler, "LAYER_GRAPH_UNBEKANNTE_REFERENZ:");
});
