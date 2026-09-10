from pathlib import Path
import json


def replace_once(text, old, new, label):
    if old not in text:
        raise RuntimeError(f'{label} marker not found')
    return text.replace(old, new, 1)

root = Path('.')

# bot.js
p = root / 'bot.js'
s = p.read_text(encoding='utf-8')
s = replace_once(s, 'Adventure Land • AiO Bot 2.14.2', 'Adventure Land • AiO Bot 2.14.3', 'bot header version')
s = replace_once(s, "var VERSION = '2.14.2';", "var VERSION = '2.14.3';", 'bot VERSION')
old_bank = "if(!it||it.l||it.p||isElixir(it)||it.name===C.hpot||it.name===C.mpot)return false;var d=GD.items&&GD.items[it.name]||{};"
new_bank = "if(!it||it.l||it.p||isElixir(it)||it.name===C.hpot||it.name===C.mpot||/^c?scroll[0-4]$/.test(String(it.name||'')))return false;var d=GD.items&&GD.items[it.name]||{};"
s = replace_once(s, old_bank, new_bank, 'bank cleanup scroll protection')
old_range = "var dest=v282VendorForScroll(name);if(dest&&(character.map!==dest.map||dist(character,dest)>260)){S.status='Zum Scroll-Händler für '+name;"
new_range = "var dest=v282VendorForScroll(name);if(dest&&(character.map!==dest.map||dist(character,dest)>180)){S.status='Zum Scroll-Händler für '+name;"
s = replace_once(s, old_range, new_range, 'scroll vendor proximity')
s = replace_once(
    s,
    '2.14.2 Merchant-Rekursionsschutz + Brain-v2 + Research Bridge Kernfunktionen geprüft',
    '2.14.3 Scroll-/Bank-Loop-Schutz + Brain-v2 + Research Bridge Kernfunktionen geprüft',
    'feature contract message'
)
p.write_text(s, encoding='utf-8')

# version.json
p = root / 'version.json'
v = json.loads(p.read_text(encoding='utf-8'))
if v.get('version') != '2.14.2':
    raise RuntimeError(f"version.json expected 2.14.2, got {v.get('version')}")
v['version'] = '2.14.3'
p.write_text(json.dumps(v, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# README.md
p = root / 'README.md'
r = p.read_text(encoding='utf-8')
r = replace_once(r, '# Adventure Land – AiO Bot 2.14.2', '# Adventure Land – AiO Bot 2.14.3', 'README title')
r = replace_once(r, '> Aktueller Stand: **2.14.2** · Build **2026-09-10**', '> Aktueller Stand: **2.14.3** · Build **2026-09-10**', 'README current version')
anchor = '> **2.14.2 Merchant-Freeze-Hotfix:** verhindert eine synchrone Rekursion zwischen Inventardruck, Compound-Prüfung und fehlendem Combine-Scroll. Inventarbereinigung läuft jetzt vor Compound, Scroll-Beschaffung ruft die Bereinigung nicht rekursiv auf und ein Re-Entry-Guard blockiert künftige Rückkopplungen.\n'
extra = '\n> **2.14.3 Merchant-Scroll-Hotfix:** Upgrade- und Compound-Scrolls werden von der Inventar-/Bankbereinigung geschützt. Damit kann ein gerade gekaufter `cscroll` nicht mehr sofort eingelagert und erneut gekauft werden. Scroll-Käufe starten außerdem erst in konservativer Händlernähe, um `distance`-Fehler während laufender Bewegung zu vermeiden.\n'
r = replace_once(r, anchor, anchor + extra, 'README 2.14.2 note')
p.write_text(r, encoding='utf-8')

# BOT_README.md
p = root / 'BOT_README.md'
b = p.read_text(encoding='utf-8')
b = replace_once(b, '# Adventure Land – AiO Bot 2.14.2 · technische Notizen', '# Adventure Land – AiO Bot 2.14.3 · technische Notizen', 'BOT_README title')
marker = '## 2.14.2 Merchant-Freeze-Hotfix\n'
insert = '''## 2.14.3 Scroll-/Bank-Loop-Hotfix\n\n- `scroll0`–`scroll4` und `cscroll0`–`cscroll4` sind für die Bankbereinigung geschützt.\n- Ein für Upgrade/Compound gekaufter Scroll darf dadurch nicht mehr unmittelbar als entbehrliches Bank-Item verschwinden.\n- Der Merchant wartet mit `buy()` bis er höchstens 180 Einheiten vom Scroll-Händler entfernt ist, um Range-Races während `smart_move` zu reduzieren.\n\n'''
b = replace_once(b, marker, insert + marker, 'BOT_README 2.14.2 section')
p.write_text(b, encoding='utf-8')

# Release verification
p = root / 'scripts' / 'verify-release.js'
t = p.read_text(encoding='utf-8')
t = replace_once(t, 'ok(version.version === "2.14.2", "prepared release must be 2.14.2");', 'ok(version.version === "2.14.3", "prepared release must be 2.14.3");', 'verify release version')
verify_marker = 'ok(bot.includes("merchantTick=function(){if(v290InventoryPressureTick())return;if(v273CompoundTick())return;"), "2.14.2 inventory pressure must run before compound");\n'
verify_extra = 'ok(bot.includes("/^c?scroll[0-4]$/.test(String(it.name||\'\'))"), "2.14.3 operational scrolls must be protected from bank cleanup");\nok(bot.includes("dist(character,dest)>180"), "2.14.3 scroll vendor proximity guard missing");\n'
t = replace_once(t, verify_marker, verify_marker + verify_extra, 'verify 2.14.2 guard block')
p.write_text(t, encoding='utf-8')

# Merchant smoke. Insert after the stable inventory-pressure assertion instead of
# relying on older party-backoff wording, which differs between prepared copies.
p = root / 'scripts' / 'smoke-merchant-stability.js'
m = p.read_text(encoding='utf-8')
m = replace_once(m, "assert.match(bot,/var VERSION = ['\"]2\\.14\\.2['\"]/);", "assert.match(bot,/var VERSION = ['\"]2\\.14\\.3['\"]/);", 'merchant smoke version')
smoke_marker = "assert.ok(bot.includes(\"merchantTick=function(){if(v290InventoryPressureTick())return;if(v273CompoundTick())return;\"),'inventory pressure must run before compound');\n"
smoke_extra = "assert.ok(bot.includes(\"/^c?scroll[0-4]$/.test(String(it.name||''))\"),'operational scrolls must never be bank-cleanup trash');\nassert.ok(bot.includes('dist(character,dest)>180'),'scroll buys must wait for conservative vendor range');\n"
m = replace_once(m, smoke_marker, smoke_marker + smoke_extra, 'merchant smoke guard insertion')
p.write_text(m, encoding='utf-8')

print('2.14.3 scroll/bank loop hotfix prepared')
