from pathlib import Path
import json,re
root=Path('.')
p=root/'bot.js';s=p.read_text(encoding='utf-8')
start=s.find("\n  var v21411ToolDefsBase=toolDefs;");end=s.find("\n  function v21411ModulesHTML",start)
assert start>=0 and end>start,(start,end);s=s[:start]+s[end:]
old="['brain','spark',(C.language==='de'?'Gehirn':'Brain'),'Lebendiges Lernsystem · Teacher, Champion & Challenger']";new="['brain','spark',(C.language==='de'?'Bot-Gehirn':'Bot Brain'),'Versteht, plant, lernt und erklärt Entscheidungen']"
assert old in s;s=s.replace(old,new,1);p.write_text(s,encoding='utf-8')
pkgp=root/'cloudflare-dashboard/package.json';pkg=json.loads(pkgp.read_text(encoding='utf-8'));pkg['version']='2.14.11';pkgp.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# This is a dashboard-changing release, so retained tests that explicitly pin dashboardVersion must advance too.
for sp in (root/'scripts').glob('*.js'):
    t=sp.read_text(encoding='utf-8')
    t=t.replace("dashboardVersion, '2.14.5'","dashboardVersion, '2.14.11'").replace('dashboardVersion, "2.14.5"','dashboardVersion, "2.14.11"')
    t=t.replace("dashboardVersion === '2.14.5'","dashboardVersion === '2.14.11'").replace('dashboardVersion === "2.14.5"','dashboardVersion === "2.14.11"')
    t=t.replace("dashboardVersion,'2.14.5'","dashboardVersion,'2.14.11'").replace('dashboardVersion,"2.14.5"','dashboardVersion,"2.14.11"')
    sp.write_text(t,encoding='utf-8')
vp=root/'scripts/verify-release.js';v=vp.read_text(encoding='utf-8')
v=v.replace('dashboard version must remain 2.14.5 for bot-only release','dashboard version must be 2.14.11 for layered brain/dashboard release').replace('version.dashboardVersion === "2.14.5"','version.dashboardVersion === "2.14.11"').replace('dash.includes("🧠 Gehirn")','dash.includes("🧠 Bot-Gehirn")');vp.write_text(v,encoding='utf-8')
sp=root/'scripts/smoke-21411-brain-world.js';t=sp.read_text(encoding='utf-8');t=t.replace("assert(s.includes(\"r[2]=C.language==='de'?'Bot-Gehirn'\"),'button renamed');","assert(s.includes(\"C.language==='de'?'Bot-Gehirn':'Bot Brain'\"),'button renamed');");sp.write_text(t,encoding='utf-8')
print('release verifier and dashboard smoke alignment fixed')
