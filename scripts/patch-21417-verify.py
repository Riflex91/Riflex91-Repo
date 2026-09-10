#!/usr/bin/env python3
from pathlib import Path

# Align verify-release assertions that protect the same behavior but whose exact implementation changed in 2.14.17.
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

# Keep the retained 2.14.16 regression smoke meaningful after the implementation was generalized.
p=Path('scripts/smoke-21416-config-merchant.js')
s=p.read_text(encoding='utf-8')
repls=[
("assert(bot.includes(\"if(k==='config')writeRaw(V21416_STABLE_CONFIG_KEY\"));",
 "assert(bot.includes(\"writeRaw(KEY+'configAt'\")&&bot.includes(\"writeRaw(V21416_STABLE_CONFIG_KEY\"));"),
("assert(bot.includes(\"v21416ConfigRecoverySource='stable-mirror'\"));",
 "assert(bot.includes(\"source:'stable-mirror'\")&&bot.includes('function v21417PickConfig'));"),
("assert(bot.includes(\"v21416ConfigRecoverySource='update-backup'\"));",
 "assert(bot.includes(\"source:'update-backup'\")&&bot.includes(\"chosen21417.source!=='current'\"));"),
("assert(bot.includes(\"character.q&&character.q.compound\"));",
 "assert(bot.includes('function v21417EconomicFlightKind')&&bot.includes(\"q.upgrade?'upgrade':q.compound?'compound':q.exchange?'exchange':q.craft?'craft'\"));"),
("assert(bot.includes(\"S.times['merchant-compound']\"));",
 "assert(bot.includes(\"flight==='compound'?'Merchant · Combine'\"));"),
("console.log('2.14.17 config preservation / Merchant guards smoke OK');",
 "console.log('2.14.17 retained config preservation / Merchant guards smoke OK');")
]
for old,new in repls:
    if old not in s: raise SystemExit('retained smoke marker missing: '+old[:90])
    s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('Aligned 2.14.17 verify + retained 2.14.16 smoke assertions')
