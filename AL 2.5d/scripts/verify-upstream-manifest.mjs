import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "docs", "upstream-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const requiredCategories = [
  "preserveServerSemantics",
  "preserveGameplayDataSemantics",
  "mixedLogicAndPresentation",
  "preservePublicCodeApi",
  "replacePresentation"
];

for (const category of requiredCategories) {
  if (!Array.isArray(manifest.categories?.[category]) || manifest.categories[category].length === 0) {
    throw new Error(`Missing or empty manifest category: ${category}`);
  }
}

const exactPaths = new Map();

for (const [category, entries] of Object.entries(manifest.categories)) {
  for (const entry of entries) {
    if (entry.endsWith("/")) continue;

    const existing = exactPaths.get(entry);
    if (existing) {
      // runner_functions.js is intentionally both mixed and API-critical.
      const allowed =
        entry === "js/runner_functions.js" &&
        new Set([existing, category]).size === 2 &&
        [existing, category].every((name) =>
          ["mixedLogicAndPresentation", "preservePublicCodeApi"].includes(name)
        );

      if (!allowed) {
        throw new Error(`Path appears in multiple incompatible categories: ${entry}`);
      }
    }

    exactPaths.set(entry, category);
  }
}

if (!/^[0-9a-f]{40}$/.test(manifest.upstream.commit)) {
  throw new Error("Upstream commit must be a full 40-character SHA");
}

if (manifest.policy.gameplayChangesAllowedByDefault !== false) {
  throw new Error("Gameplay lock must remain enabled");
}

console.log(
  `AL 2.5D upstream manifest OK: ${exactPaths.size} exact paths, ${manifest.criticalLegacyHooks.length} bridge hooks`
);
