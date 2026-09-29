import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const ps1=fs.readFileSync(path.join(root,"tools","windows","Prepare-Mainland-Staged-Overlay.ps1"),"utf8");
const cmd=fs.readFileSync(path.join(root,"tools","windows","Prepare-Mainland-Staged-Overlay.cmd"),"utf8");

test("Windows staged updater uses a detached pinned worktree and isolated staging workspace",()=>{
  assert.match(ps1,/worktree","add","--detach"/);
  assert.match(ps1,/prepare-mainland-staged-overlay\.mjs/);
  assert.match(ps1,/UPSTREAM\.lock\.json/);
  assert.match(ps1,/targetHead -ne \$pin/);
});

test("Windows staged updater never performs destructive checkout cleanup",()=>{
  for(const forbidden of [
    /reset\s+--hard/i,
    /clean\s+-[a-z]*f/i,
    /checkout\s+--\s+\./i,
    /config\s+--global/i
  ]) assert.doesNotMatch(ps1,forbidden);
});

test("Windows staged updater copies only ALHD-managed runtime files and verifies the real checkout",()=>{
  assert.match(ps1,/adventure-land-hd-manifest\.js/);
  assert.match(ps1,/adventure-land-hd-bootstrap\.js/);
  assert.match(ps1,/images\\alhd/);
  assert.match(ps1,/verify-runtime-overlay\.mjs/);
  assert.match(ps1,/Expected exactly 48 staged Mainland HD files/);
});

test("Windows staged updater patches index script tags instead of copying the clean index",()=>{
  assert.match(ps1,/Expected exactly one data\.js anchor/);
  assert.match(ps1,/\$patchedIndex = \$withoutAlhd\.Replace/);
  assert.doesNotMatch(ps1,/Copy-Item[^\n]+cleanIndex[^\n]+targetIndex/i);
});

test("Windows staged updater provides rollback and ephemeral safe-directory handling",()=>{
  assert.match(ps1,/rollback/);
  assert.match(ps1,/GIT_CONFIG_COUNT/);
  assert.match(ps1,/Restore-GitEnvironment/);
  assert.match(ps1,/worktree","remove","--force"/);
});

test("CMD launcher delegates to the PowerShell updater and forwards arguments",()=>{
  assert.match(cmd,/Prepare-Mainland-Staged-Overlay\.ps1/);
  assert.match(cmd,/%\*/);
  assert.match(cmd,/exit \/b %EXIT_CODE%/i);
});
