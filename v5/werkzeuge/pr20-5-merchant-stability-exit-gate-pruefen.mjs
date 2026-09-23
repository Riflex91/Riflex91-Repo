import fs from "node:fs";

const evidence = JSON.parse(fs.readFileSync(new URL("../roadmap/pr20-5-merchant-stability-evidence.json", import.meta.url), "utf8"));
const gate = JSON.parse(fs.readFileSync(new URL("../roadmap/pr20-5-merchant-stability-exit-gate-status.json", import.meta.url), "utf8"));
const roadmap = JSON.parse(fs.readFileSync(new URL("../roadmap/post-r19-roadmap.json", import.meta.url), "utf8"));

function must(condition, code) {
  if (!condition) throw new Error(code);
}

must(evidence.status === "BESTANDEN_REAL_INGAME_4CHAR_15M", "PR20_5_EVIDENCE_STATUS");
must(evidence.run?.terminalStatus === "BESTANDEN", "PR20_5_TERMINAL");
must(evidence.run?.durationMs >= 15 * 60 * 1000, "PR20_5_DURATION");
must(evidence.run?.samples >= evidence.run?.minimumSamples, "PR20_5_SAMPLES");
must(evidence.roster?.ready === true, "PR20_5_ROSTER");
must(JSON.stringify(evidence.roster?.requiredClasses) === JSON.stringify(["merchant","ranger","priest","mage"]), "PR20_5_CLASSES");
must(evidence.deterministic?.status === "BESTANDEN", "PR20_5_DETERMINISTIC");
must(evidence.deterministic?.scenariosPassed === evidence.deterministic?.scenariosTotal, "PR20_5_SCENARIOS");
must(evidence.safety?.gameplayWrites === 0, "PR20_5_GAMEPLAY_WRITES");
must(evidence.safety?.rawWriteCalls === 0, "PR20_5_RAW_WRITES");
must(evidence.safety?.sameIntentRetry === false, "PR20_5_RETRY");
must(evidence.notification?.completionEmail === "SENT", "PR20_5_EMAIL");
must(gate.status === "ROADMAP_ABGESCHLOSSEN_REAL_INGAME", "PR20_5_GATE_STATUS");
must(gate.nextGate === "PR20.6_MLUCK", "PR20_5_NEXT_GATE");
must(gate.transitionPolicy?.normalRuntimeAutomaticallyAllowed === false, "PR20_5_NORMAL_RUNTIME_BLOCK");
must(roadmap.currentGate !== "PR20.5_MERCHANT_STABILITAET", "PR20_5_ROADMAP_MUST_HAVE_ADVANCED");
must(roadmap.pr20_5?.status === "ROADMAP_ABGESCHLOSSEN_REAL_INGAME", "PR20_5_ROADMAP_STATUS");
must(roadmap.pr20_5?.normalRuntimeAfterAllTestsOnly === true, "PR20_5_ROADMAP_RUNTIME_GATE");

console.log("PR20.5 merchant stability exit gate passed.");
