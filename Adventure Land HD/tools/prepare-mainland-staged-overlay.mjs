import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const upstreamArg=value("--upstream");
const workspaceArg=value("--workspace");
const checkOnly=args.includes("--check-only");
if(!upstreamArg){
  console.error("Usage: node tools/prepare-mainland-staged-overlay.mjs --upstream <clean-pinned-checkout> [--workspace <dir>] [--check-only]");
  process.exit(2);
}

const upstream=path.resolve(process.cwd(),upstreamArg);
const workspace=workspaceArg
  ? path.resolve(process.cwd(),workspaceArg)
  : path.join(os.tmpdir(),"alhd-mainland-staged");
const assetRoot=path.join(workspace,"hd-assets");
const terrainReport=path.join(workspace,"terrain-report.json");
const entityReport=path.join(workspace,"entity-report.json");
const terrainPromotion=path.join(workspace,"terrain-promotion.json");
const entityPromotion=path.join(workspace,"entity-promotion.json");
const stagedManifest=path.join(workspace,"hd-assets-mainland-staged.json");

const run=(tool,...toolArgs)=>execFileSync(process.execPath,[path.join(root,"tools",tool),...toolArgs],{stdio:"inherit"});

fs.rmSync(workspace,{recursive:true,force:true});
fs.mkdirSync(assetRoot,{recursive:true});

run("build-mainland-terrain-candidates.mjs",
  "--upstream",upstream,
  "--output-dir",assetRoot,
  "--report",terrainReport
);
run("verify-mainland-terrain-candidate-report.mjs","--report",terrainReport);

run("build-mainland-entity-candidates.mjs",
  "--upstream",upstream,
  "--output-dir",assetRoot,
  "--report",entityReport
);
run("verify-mainland-entity-candidate-report.mjs","--report",entityReport);

run("build-mainland-terrain-promotion.mjs",
  "--report",terrainReport,
  "--output",terrainPromotion
);
run("build-mainland-entity-promotion.mjs",
  "--report",entityReport,
  "--output",entityPromotion
);
run("build-mainland-staged-manifest.mjs",
  "--terrain-promotion",terrainPromotion,
  "--entity-promotion",entityPromotion,
  "--output",stagedManifest
);
run("validate-hd-assets.mjs",
  "--upstream",upstream,
  "--hd-root",assetRoot,
  "--manifest",stagedManifest
);

if(checkOnly){
  console.log("Mainland staged overlay validated without modifying the upstream checkout:",workspace);
  process.exit(0);
}

run("prepare-runtime-overlay.mjs",
  "--upstream",upstream,
  "--manifest",stagedManifest,
  "--hd-root",assetRoot
);
run("verify-runtime-overlay.mjs",
  "--upstream",upstream,
  "--manifest",stagedManifest,
  "--hd-root",assetRoot
);

console.log("Mainland staged overlay prepared and verified:",workspace);
