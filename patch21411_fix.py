from pathlib import Path
import json,re
root=Path('.')
# First patch has already generated the candidate files. Keep final toolDefs static shape intact.
p=root/'bot.js';s=p.read_text(encoding='utf-8')
block=re.compile(r"\n  var v21411ToolDefsBase=toolDefs;\n  toolDefs=function\(\)\{.*?\n  \};(?=\n  function v21411ModulesHTML)",re.S)
s,n=block.subn('',s,1);assert n==1,n
old="['brain','spark',(C.language==='de'?'Gehirn':'Brain'),'Lebendiges Lernsystem · Teacher, Champion & Challenger']"
new="['brain','spark',(C.language==='de'?'Bot-Gehirn':'Bot Brain'),'Versteht, plant, lernt und erklärt Entscheidungen']"
assert old in s
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
# Dashboard package and release verifier now intentionally move together to 2.14.11.
pkgp=root/'cloudflare-dashboard/package.json';pkg=json.loads(pkgp.read_text(encoding='utf-8'));pkg['version']='2.14.11';pkgp.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
vp=root/'scripts/verify-release.js';v=vp.read_text(encoding='utf-8')
v=v.replace('dashboard version must remain 2.14.5 for bot-only release','dashboard version must be 2.14.11 for layered brain/dashboard release')
v=v.replace('version.dashboardVersion === "2.14.5"','version.dashboardVersion === "2.14.11"')
v=v.replace('dash.includes("🧠 Gehirn")','dash.includes("🧠 Bot-Gehirn")')
vp.write_text(v,encoding='utf-8')
print('release verifier alignment fixed')
