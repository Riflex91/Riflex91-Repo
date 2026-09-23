import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("werkzeuge");
const files = fs.readdirSync(dir)
  .filter((name) => name.endsWith(".js"))
  .filter((name) =>
    name.endsWith("-test-paket.js")
    || name.includes("-autonomous-")
    || name === "pr20-6-updater-recovery-bootstrap.js"
    || name === "pr20-7-gear-occupied-slot-readonly-live.js"
    || name === "pr20-7-gear-occupied-slot-readonly-worker.js"
    || name === "v5-autonomous-test-ingame-updater.js"
  )
  .sort();

if (files.length === 0) {
  throw new Error("V5_PERFORMANCE_TRICK_GUARD_NO_TEST_RUNTIMES_FOUND");
}

const missing = [];
for (const name of files) {
  const source = fs.readFileSync(path.join(dir, name), "utf8");
  if (!source.includes("performance_trick")) missing.push(name);
}

if (missing.length > 0) {
  throw new Error(
    "V5_TEST_RUNTIME_PERFORMANCE_TRICK_MISSING:" + missing.join(",")
  );
}

console.log(JSON.stringify({
  status: "BESTANDEN",
  rule: "ALL_V5_TEST_RUNTIMES_REQUIRE_PERFORMANCE_TRICK",
  checked: files
}, null, 2));
