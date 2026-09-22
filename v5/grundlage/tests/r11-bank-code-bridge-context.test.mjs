import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Bank-Observer pruefen CODE-Bridge ueber Page und Parent statt nur den ersten Spiel-Root", () => {
  for (const file of [
    "werkzeuge/bank-item-transfer-produktions-browser.mjs",
    "werkzeuge/bank-swap-produktions-browser.mjs",
  ]) {
    const source = fs.readFileSync(file, "utf8");
    assert.match(source, /for\(const (r|kandidat) of roots\)/, file);
    assert.match(source, /call_code_function_f/, file);
    assert.doesNotMatch(
      source,
      /bridge(?:FunctionAvailable)?=typeof root\.call_code_function_f/,
      file,
    );
  }
});

test("Bank-Shadows pinnen den CDP-Kontext auf call_code_function_f", () => {
  for (const file of [
    "werkzeuge/bank-item-transfer-real-browser-shadow.mjs",
    "werkzeuge/bank-swap-real-browser-shadow.mjs",
  ]) {
    const source = fs.readFileSync(file, "utf8");
    assert.match(
      source,
      /requiredGlobalFunction\s*:\s*["']call_code_function_f["']/,
      file,
    );
  }
});
