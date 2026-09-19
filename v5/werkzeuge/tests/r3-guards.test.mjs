import test from "node:test";
import assert from "node:assert/strict";
import { pruefeQuelltext } from "../r3-guard-regeln.mjs";

const erwartet = (pfad, text, grund) => {
  assert.ok(pruefeQuelltext(pfad, text).includes(grund), grund);
};

test("Legacy-Runtime-Import wird blockiert", () => {
  erwartet("kern/test.ts", 'import x from "../../../v4/laufzeit/x.js";', "LEGACY_RUNTIME_IMPORT");
});

test("Monkey-Patch wird blockiert", () => {
  erwartet("kern/test.ts", "Ziel.prototype.schreiben = () => 1;", "MONKEY_PATCH");
});

test("Raw Game Write wird blockiert", () => {
  erwartet("kern/test.ts", 'socket.emit("bank", {});', "RAW_GAME_WRITE");
});

test("Direkter Dateisystemzugriff im Fachcode wird blockiert", () => {
  erwartet("kern/test.ts", 'import fs from "node:fs";', "DIREKTER_DATEISYSTEMZUGRIFF");
});

test("Direkter Netzwerkzugriff wird blockiert", () => {
  erwartet("kern/test.ts", 'fetch("https://example.test");', "DIREKTER_NETZWERKZUGRIFF");
});

test("Roh-Snapshot-Zugriff wird blockiert", () => {
  erwartet("kern/test.ts", 'const p = "wissensbasis/datenbank/aktuell/x.json";', "ROH_SNAPSHOT_ZUGRIFF");
});

test("Unbegrenzte Sammlung wird blockiert", () => {
  erwartet("kern/test.ts", "const x = new Map();", "UNBEGRENZTE_SAMMLUNG");
});

test("Englischer neuer Domaenenbezeichner wird blockiert", () => {
  erwartet("kern/test.ts", "export interface ActionRequest {}", "ENGLISCHER_DOMAENENBEZEICHNER:ActionRequest");
});

test("Generischer Host-Aufruf wird blockiert", () => {
  erwartet("host/quelle/test.ts", "evaluate('1+1');", "GENERISCHER_HOST_AUFRUF");
});

test("Hart codiertes Geheimnis wird blockiert", () => {
  erwartet("kern/test.ts", 'const password = "super-secret-value";', "GEHEIMNIS_LITERAL");
});

test("Typisierter Persistenzadapter darf Dateisystem importieren", () => {
  assert.ok(!pruefeQuelltext("persistenz/quelle/adapter/datei.ts", 'import fs from "node:fs";')
    .includes("DIREKTER_DATEISYSTEMZUGRIFF"));
});

test("Raw Game Write ist spaeter nur im Ausfuehrungsadapter statisch erlaubt", () => {
  assert.ok(!pruefeQuelltext("ausfuehrung/quelle/adapter/game.ts", 'socket.emit("bank", {});')
    .includes("RAW_GAME_WRITE"));
});

test("Direkte Systemzeit wird blockiert", () => {
  erwartet("grundlage/quelle/kern/test.ts", "const jetzt = Date.now();", "DIREKTE_SYSTEMZEIT");
});

test("Unkontrollierte Zufallsquelle wird blockiert", () => {
  erwartet("grundlage/quelle/kern/test.ts", "const x = Math.random();", "DIREKTE_UNKONTROLLIERTE_ZUFALLSQUELLE");
});

test("Determinismusadapter darf spaeter Systemzeit kapseln", () => {
  assert.ok(!pruefeQuelltext(
    "grundlage/quelle/determinismus/adapter/system-uhr.ts",
    "const jetzt = Date.now();",
  ).includes("DIREKTE_SYSTEMZEIT"));
});
