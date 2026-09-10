from pathlib import Path
import json


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise RuntimeError(f"Expected {label} marker not found")
    return text.replace(old, new, 1)

botp = Path('bot.js')
bot = botp.read_text(encoding='utf-8')

if "var VERSION = '2.14.2';" not in bot:
    bot = replace_once(bot,
        '/* Adventure Land • AiO Bot 2.14.1 | 2026-09-10',
        '/* Adventure Land • AiO Bot 2.14.2 | 2026-09-10',
        'header version')
    bot = replace_once(bot,
        "var VERSION = '2.14.1';",
        "var VERSION = '2.14.2';",
        'VERSION')

    old_inv = "function v290InventoryPressureTick(){if(character.ctype!=='merchant'||freeSlots()>Math.max(1,C.merchantInventoryReserve))return false;if(v273CompoundTick())return true;if(v273StoreTrashBankTick())return true;if(S.bankFull&&v273SellTrashTick())return true;S.status='Inventar voll · sichere Bereinigung nötig';S.mode='Merchant · Inventar';return false;}"
    new_inv = """function v290InventoryPressureTick(){
    if(character.ctype!=='merchant'||freeSlots()>Math.max(1,C.merchantInventoryReserve))return false;
    if(S.inventoryPressureBusy){S.status='Inventarbereinigung läuft · Re-Entry blockiert';S.mode='Merchant · Inventar';return true;}
    S.inventoryPressureBusy=true;
    try{
      if(v273StoreTrashBankTick())return true;
      if(S.bankFull&&v273SellTrashTick())return true;
      var hasCombineScroll=['cscroll0','cscroll1','cscroll2','cscroll3','cscroll4'].some(function(n){return slot(n)>=0;});
      if((freeSlots()>0||hasCombineScroll)&&v273CompoundTick())return true;
      S.status='Inventar voll · sichere Bereinigung nötig';S.mode='Merchant · Inventar';
      if(clock()>(S.times.inventoryPressureWarn||0)){S.times.inventoryPressureWarn=clock()+15000;audit('inventory_pressure_blocked','Merchant-Inventar unter Reserve · rekursiver Scroll/Compound-Pfad blockiert',{free:freeSlots(),reserve:Number(C.merchantInventoryReserve)||0,hasCombineScroll:hasCombineScroll},'warning');}
      return true;
    }finally{S.inventoryPressureBusy=false;}
  }"""
    bot = replace_once(bot, old_inv, new_inv, 'inventory pressure function')

    old_ensure = "S.mode='Merchant · Inventar';v290InventoryPressureTick();return -1;"
    new_ensure = "S.mode='Merchant · Inventar';return -1;"
    bot = replace_once(bot, old_ensure, new_ensure, 'recursive ensure-scroll call')

    old_wrap = "merchantTick=function(){if(v273CompoundTick())return;if(v290InventoryPressureTick())return;var before=S.lastActionAt||0,r=v290MerchantBase();"
    new_wrap = "merchantTick=function(){if(v290InventoryPressureTick())return;if(v273CompoundTick())return;var before=S.lastActionAt||0,r=v290MerchantBase();"
    bot = replace_once(bot, old_wrap, new_wrap, 'merchant wrapper order')

    bot = replace_once(bot,
        "audit('feature_contract','2.14.1 Stabilitäts-Hotfix + Brain-v2 + Research Bridge Kernfunktionen geprüft'",
        "audit('feature_contract','2.14.2 Merchant-Rekursionsschutz + Brain-v2 + Research Bridge Kernfunktionen geprüft'",
        'feature contract label')
    botp.write_text(bot, encoding='utf-8')
else:
    print('2.14.2 bot patch already applied')

vp = Path('version.json')
v = json.loads(vp.read_text(encoding='utf-8'))
v['version'] = '2.14.2'
vp.write_text(json.dumps(v, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

rp = Path('README.md')
r = rp.read_text(encoding='utf-8')
r = r.replace('# Adventure Land – AiO Bot 2.14.1', '# Adventure Land – AiO Bot 2.14.2', 1)
if '> **2.14.2 Merchant-Freeze-Hotfix:**' not in r:
    marker = '> **2.14.1 Stabilitäts-Hotfix:**'
    note = "> **2.14.2 Merchant-Freeze-Hotfix:** verhindert eine synchrone Rekursion zwischen Inventardruck, Compound-Prüfung und fehlendem Combine-Scroll. Inventarbereinigung läuft jetzt vor Compound, Scroll-Beschaffung ruft die Bereinigung nicht rekursiv auf und ein Re-Entry-Guard blockiert künftige Rückkopplungen.\n\n"
    if marker not in r:
        raise RuntimeError('README 2.14.1 note marker not found')
    r = r.replace(marker, note + marker, 1)
r = r.replace('> Aktueller Stand: **2.14.1** · Build **2026-09-10**', '> Aktueller Stand: **2.14.2** · Build **2026-09-10**', 1)
rp.write_text(r, encoding='utf-8')

bp = Path('BOT_README.md')
br = bp.read_text(encoding='utf-8')
br = br.replace('# Adventure Land – AiO Bot 2.14.1 · technische Notizen', '# Adventure Land – AiO Bot 2.14.2 · technische Notizen', 1)
if '## 2.14.2 Merchant-Freeze-Hotfix' not in br:
    marker = '## 2.14.1 Stabilitäts-Hotfix'
    section = "## 2.14.2 Merchant-Freeze-Hotfix\n\nBehebt einen synchronen Merchant-Freeze bei vollem Inventar: Inventardruck wird vor Compound behandelt, fehlende Combine-Scrolls lösen keine rekursive Inventarbereinigung mehr aus und ein Re-Entry-Guard verhindert Rückkopplungen. Brain/Teacher und Cloudflare bleiben unverändert.\n\n"
    if marker not in br:
        raise RuntimeError('BOT_README 2.14.1 section marker not found')
    br = br.replace(marker, section + marker, 1)
bp.write_text(br, encoding='utf-8')

verify = Path('scripts/verify-release.js')
t = verify.read_text(encoding='utf-8')
t = t.replace('ok(version.version === "2.14.1", "prepared release must be 2.14.1");', 'ok(version.version === "2.14.2", "prepared release must be 2.14.2");', 1)
t = t.replace('ok(bot.includes("merchantTick=function(){if(v273CompoundTick())return"), "compound priority missing");', 'ok(bot.includes("merchantTick=function(){if(v290InventoryPressureTick())return;if(v273CompoundTick())return;"), "inventory pressure must precede compound");', 1)
extra = '''ok(bot.includes("S.inventoryPressureBusy") && bot.includes("Re-Entry blockiert"), "2.14.2 inventory-pressure re-entry guard missing");\nok(!bot.includes("S.mode='Merchant · Inventar';v290InventoryPressureTick();return -1;"), "2.14.2 recursive ensure-scroll path still present");\nok(bot.includes("merchantTick=function(){if(v290InventoryPressureTick())return;if(v273CompoundTick())return;"), "2.14.2 inventory pressure must run before compound");\n'''
if '2.14.2 recursive ensure-scroll path still present' not in t:
    marker = 'ok(!fs.existsSync("tools"), "temporary tools directory must not ship");\n'
    if marker not in t:
        raise RuntimeError('verify-release tail marker not found')
    t = t.replace(marker, marker + extra, 1)
verify.write_text(t, encoding='utf-8')

sp = Path('scripts/smoke-research.js')
s = sp.read_text(encoding='utf-8')
s = s.replace("VERSION:'2.14.1'", "VERSION:'2.14.2'", 1)
sp.write_text(s, encoding='utf-8')

mp = Path('scripts/smoke-merchant-stability.js')
m = mp.read_text(encoding='utf-8')
m = m.replace("assert.match(bot,/var VERSION = ['\"]2\\.14\\.1['\"]/);", "assert.match(bot,/var VERSION = ['\"]2\\.14\\.2['\"]/);", 1)
if 'recursive inventory-pressure call must be removed' not in m:
    insert = '''assert.ok(bot.includes('S.inventoryPressureBusy'),'inventory-pressure re-entry guard missing');\nassert.ok(!bot.includes("S.mode='Merchant · Inventar';v290InventoryPressureTick();return -1;"),'recursive inventory-pressure call must be removed');\nassert.ok(bot.includes("merchantTick=function(){if(v290InventoryPressureTick())return;if(v273CompoundTick())return;"),'inventory pressure must run before compound');\n'''
    marker = 'function goldTransfer'
    if marker not in m:
        raise RuntimeError('merchant smoke goldTransfer marker not found')
    m = m.replace(marker, insert + marker, 1)
mp.write_text(m, encoding='utf-8')

print('2.14.2 merchant recursion fix prepared')
