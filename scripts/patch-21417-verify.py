#!/usr/bin/env python3
from pathlib import Path
p=Path('scripts/verify-release.js')
s=p.read_text(encoding='utf-8')
repls=[
("ok(bot.includes(\"if(k==='config')writeRaw(V21416_STABLE_CONFIG_KEY\"), \"2.14.17 config writes do not refresh stable mirror\");",
 "ok(bot.includes(\"writeRaw(KEY+'configAt'\") && bot.includes(\"writeRaw(V21416_STABLE_CONFIG_KEY\"), \"2.14.17 config writes do not refresh stable mirror\");"),
("ok(bot.includes(\"v21416ConfigRecoverySource='update-backup'\"), \"2.14.17 prior namespace update backup recovery missing\");",
 "ok(bot.includes(\"backup21417?{source:'update-backup'\") && bot.includes(\"chosen21417.source!=='current'\"), \"2.14.17 prior namespace update backup recovery missing\");"),
("ok(bot.includes(\"character.q&&character.q.compound\") && bot.includes(\"Combine läuft · warte auf Abschluss\"), \"2.14.17 compound flight guard missing\");",
 "ok(bot.includes(\"function v21417EconomicFlightKind\") && bot.includes(\"q.upgrade?'upgrade':q.compound?'compound':q.exchange?'exchange':q.craft?'craft'\"), \"2.14.17 compound/economic flight guard missing\");"),
("Brain v2.14 · Research Bridge · Merchant config + performance + bank/compound guards","Brain v2.14 · Research Bridge · newest config + Merchant serialization/vendor guards")
]
for old,new in repls:
    if old not in s: raise SystemExit('verify marker missing: '+old[:80])
    s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('Aligned 2.14.17 regression assertions')
