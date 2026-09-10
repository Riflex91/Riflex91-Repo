from pathlib import Path
import json,re
root=Path('.')
p=root/'bot.js';s=p.read_text(encoding='utf-8')
# Remove the appended dynamic toolDefs wrapper exactly; keep the verifier-visible static tool list as the final definition.
start=s.find("\n  var v21411ToolDefsBase=toolDefs;")
end=s.find("\n  function v21411ModulesHTML",start)
assert start>=0 and end>start,(start,end)
s=s[:start]+s[end:]
old="['brain','spark',(C.language==='de'?'Gehirn':'Brain'),'Lebendiges Lernsystem · Teacher, Champion & Challenger']"
new="['brain','spark',(C.language==='de'?'Bot-Gehirn':'Bot Brain'),'Versteht, plant, lernt und erklärt Entscheidungen']"
assert old in s
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
# Dashboard package and verifier intentionally advance together for this dashboard-changing release.
pkgp=root/'cloudflare-dashboard/package.json';pkg=json.loads(pkgp.read_text(encoding='utf-8'));pkg['version']='2.14.11';pkgp.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
vp=root/'scripts/verify-release.js';v=vp.read_text(encoding='utf-8')
v=v.replace('dashboard version must remain 2.14.5 for bot-only release','dashboard version must be 2.14.11 for layered brain/dashboard release')
v=v.replace('version.dashboardVersion === "2.14.5"','version.dashboardVersion === "2.14.11"')
v=v.replace('dash.includes("🧠 Gehirn")','dash.includes("🧠 Bot-Gehirn")')
vp.write_text(v,encoding='utf-8')
# Dedicated smoke should assert the final static label rather than the removed wrapper implementation.
sp=root/'scripts/smoke-21411-brain-world.js';t=sp.read_text(encoding='utf-8')
t=t.replace("assert(s.includes(\"r[2]=C.language==='de'?'Bot-Gehirn'\"),'button renamed');","assert(s.includes(\"C.language==='de'?'Bot-Gehirn':'Bot Brain'\"),'button renamed');")
sp.write_text(t,encoding='utf-8')
print('release verifier alignment fixed')
