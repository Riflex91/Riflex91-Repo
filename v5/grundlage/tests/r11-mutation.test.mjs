import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { pruefeSafetyQuelltexte } from "../../werkzeuge/r11-safety-source-checks.mjs";

const basis = {
  admission: fs.readFileSync("grundlage/quelle/ausfuehrung/admission.ts", "utf8"),
  recovery: fs.readFileSync("grundlage/quelle/recovery/recovery-kernel.ts", "utf8"),
  restart: fs.readFileSync("grundlage/quelle/recovery/wiederanlauf.ts", "utf8"),
  health: fs.readFileSync("grundlage/quelle/operations/health.ts", "utf8"),
  alerts: fs.readFileSync("grundlage/quelle/operations/alerts.ts", "utf8"),
};

test("unveraenderte Safety-Quelltexte bestehen den Mutation-Guard", () => {
  assert.deepEqual(pruefeSafetyQuelltexte(basis), []);
});

test("Mutation: Runtime-Gate-Inversion wird erkannt", () => {
  const mutiert = {
    ...basis,
    admission: basis.admission.replace(
      'if (!runtime.freigegeben) throw new Error("LAUFZEIT_GATE_GESPERRT");',
      'if (runtime.freigegeben) throw new Error("LAUFZEIT_GATE_GESPERRT");',
    ),
  };
  assert.ok(pruefeSafetyQuelltexte(mutiert).includes("MUTATION_ADMISSION_RUNTIME_GATE"));
});

test("Mutation: UNKNOWN Same-Intent-Freigabe wird erkannt", () => {
  const mutiert = {
    ...basis,
    recovery: basis.recovery.replace("sameIntentErneutSenden: false", "sameIntentErneutSenden: true"),
  };
  assert.ok(pruefeSafetyQuelltexte(mutiert).includes("MUTATION_RECOVERY_SAME_INTENT"));
});

test("Mutation: Restart-Authority wird erkannt", () => {
  const mutiert = {
    ...basis,
    restart: basis.restart.replaceAll("executionAuthority: false", "executionAuthority: true"),
  };
  assert.ok(pruefeSafetyQuelltexte(mutiert).includes("MUTATION_RESTART_AUTHORITY"));
});

test("Mutation: fehlende Health wird nicht still auf gesund invertierbar", () => {
  const mutiert = {
    ...basis,
    health: basis.health.replace(
      'mutationErlaubt: zustand === "GESUND"',
      'mutationErlaubt: zustand !== "KRITISCH"',
    ),
  };
  assert.ok(pruefeSafetyQuelltexte(mutiert).includes("MUTATION_HEALTH_FAIL_CLOSED"));
});

test("Mutation: Alert-Claim vor Persistenz wird erkannt", () => {
  const persist = "const bestaetigung = await this.#spool.speichereDurable(alert);";
  const claim = "const claim = await this.#spool.claimDurable(alert.alertId);";
  const mutiert = {
    ...basis,
    alerts: basis.alerts
      .replace(persist, "__PERSIST__")
      .replace(claim, persist)
      .replace("__PERSIST__", claim),
  };
  assert.ok(pruefeSafetyQuelltexte(mutiert).includes("MUTATION_ALERT_PERSIST_BEFORE_CLAIM"));
});
