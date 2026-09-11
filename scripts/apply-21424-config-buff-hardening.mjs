#!/usr/bin/env node
import fs from 'fs';
const p='bot.js';let s=fs.readFileSync(p,'utf8');
if(s.includes('/* 2.14.24 config + buff telemetry hardening */')){console.log('v2.14.24 hardening already applied');process.exit(0);}
if(!s.includes('/* 2.14.24 group buffs + catalog details + item permissions + terrain tiles */'))throw Error('v2.14.24 base missing');
const def="    merchantBuffRequestRepeatSeconds: 60, merchantBuffConfirmSeconds: 15,\n";
if(!s.includes(def))throw Error('buff defaults anchor missing');
s=s.replace(def,def+"    groupBuffAssignments: {}, merchantItemPermissions: {},\n");
const norm="    out.showSettingHelp = out.showSettingHelp !== false;";
if(!s.includes(norm))throw Error('cleanConfig anchor missing');
const clean=`    if(!out.groupBuffAssignments||typeof out.groupBuffAssignments!=='object'||Array.isArray(out.groupBuffAssignments))out.groupBuffAssignments={};
    else{var ga21424={};Object.keys(out.groupBuffAssignments).slice(0,8).forEach(function(caster){var rows=out.groupBuffAssignments[caster];if(!rows||typeof rows!=='object'||Array.isArray(rows))return;var cr={};Object.keys(rows).slice(0,32).forEach(function(skill){var targets=Array.isArray(rows[skill])?rows[skill]:[];targets=targets.map(function(n){return safeString(n,80).trim();}).filter(function(n,i,a){return !!n&&a.indexOf(n)===i;}).slice(0,8);if(targets.length)cr[safeString(skill,80)]=targets;});if(Object.keys(cr).length)ga21424[safeString(caster,80)]=cr;});out.groupBuffAssignments=ga21424;}
    if(!out.merchantItemPermissions||typeof out.merchantItemPermissions!=='object'||Array.isArray(out.merchantItemPermissions))out.merchantItemPermissions={};
    else{var ip21424={};Object.keys(out.merchantItemPermissions).slice(0,2500).forEach(function(name){var r=out.merchantItemPermissions[name];if(!r||typeof r!=='object'||Array.isArray(r))return;var x={};['sell','bank','compound','upgrade'].forEach(function(a){if(typeof r[a]==='boolean')x[a]=r[a];});if(Object.keys(x).length)ip21424[safeString(name,120)]=x;});out.merchantItemPermissions=ip21424;}
`;
s=s.replace(norm,clean+norm);
const tail="  audit('feature_contract','2.14.24 Gruppen-Buffs + Detail-Bestiarium + Itemrechte + echte Terrain-Tiles + Update-Contract-Fix geprüft',{features:FEATURE_CONTRACT});\n";
if(!s.includes(tail))throw Error('v2.14.24 tail missing');
const hard=`

  /* 2.14.24 config + buff telemetry hardening */
  function v21424ObservableBuffSkills(){
    var out=v21424TrackedBuffIds();Object.keys(GD.skills||{}).forEach(function(id){if(out.length>=96||out.indexOf(id)>=0)return;var d=GD.skills[id]||{},target=String(d.target||'').toLowerCase();if(!d.condition||d.hostile||target==='monster'||target==='enemy')return;out.push(id);});return out;
  }
  v21424BuffSnapshot=function(){var out={};v21424ObservableBuffSkills().forEach(function(id){var cond=v21424BuffCondition(id),x=character.s&&character.s[cond];out[id]={condition:cond,active:!!x,ms:x&&isFinite(Number(x.ms))?Math.max(0,Number(x.ms)):null,from:x&&x.f||''};});return out;};
  audit('feature_contract','2.14.24 Config-/Buff-Telemetrie-Härtung geprüft',{groupBuffAssignments:Object.keys(v21424Assignments()).length,itemPermissionRules:Object.keys(C.merchantItemPermissions||{}).length});
`;
s=s.replace(tail,tail+hard);
fs.writeFileSync(p,s);
console.log('Applied v2.14.24 config and buff telemetry hardening');
