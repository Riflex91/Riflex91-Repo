from pathlib import Path
import json

ROOT=Path('.')
bot_p=ROOT/'bot.js'
ver_p=ROOT/'version.json'
readme_p=ROOT/'README.md'
botreadme_p=ROOT/'BOT_README.md'
verify_p=ROOT/'scripts/verify-release.js'
merchant_smoke_p=ROOT/'scripts/smoke-merchant-stability.js'
smoke2144_p=ROOT/'scripts/smoke-2144-merchant-party-ui.js'
smoke2145_p=ROOT/'scripts/smoke-2145-merchant-path-dashboard-ui.js'

bot=bot_p.read_text(encoding='utf-8')
assert "var VERSION = '2.14.5';" in bot
assert 'v2144NpcValue(it)' in bot
bot=bot.replace('Adventure Land • AiO Bot 2.14.5 | 2026-09-10','Adventure Land • AiO Bot 2.14.6 | 2026-09-10',1)
bot=bot.replace("var VERSION = '2.14.5';","var VERSION = '2.14.6';",1)
bot=bot.replace('v2144NpcValue(it)','itemValueSafe(it)')

marker='  // Preserve references so dispose can distinguish our CM handler on engines that support function identity.\n'
assert marker in bot
block=r'''  // ---------------------------------------------------------------------------
  // 2.14.6 Merchant crash + manual update UX hotfix.
  // ---------------------------------------------------------------------------
  function v2146UpdateLabel(){
    if(S.update.applying)return C.language==='de'?'Update wird installiert …':'Installing update …';
    if(S.update.checking)return C.language==='de'?'Prüfe auf Updates …':'Checking for updates …';
    return C.language==='de'?'Auf Updates prüfen':'Check for update';
  }
  function v2146UpdateStatusHTML(){
    var checked=Number(S.update.checkedAt)||0,label=C.language==='de'?'Update-Status':'Update status';
    var value=S.update.applying?(C.language==='de'?'Update wird installiert …':'Installing update …'):
      S.update.checking?(C.language==='de'?'Prüfung läuft …':'Check in progress …'):
      S.update.error?(C.language==='de'?'Fehler: ':'Error: ')+esc(S.update.error):
      checked?(C.language==='de'?'Letzte Prüfung: ':'Last check: ')+new Date(checked).toLocaleTimeString():(C.language==='de'?'Noch nicht geprüft':'Not checked yet');
    var cls=S.update.error?'bad':(S.update.checking||S.update.applying?'warn':'good');
    return '<div class="card update-manual-status"><div class="line"><span>'+esc(label)+'</span><strong class="'+cls+'">'+value+'</strong></div></div>';
  }
  var v2146SettingsHTMLBase=settingsHTML;
  settingsHTML=function(){
    var html=v2146SettingsHTMLBase();
    var re=/(<button class="btn primary" data-action="update-check"[^>]*>)[\s\S]*?(<\/button>)/;
    html=html.replace(re,function(_m,a,b){return a+esc(v2146UpdateLabel())+b;});
    if(html.indexOf('update-manual-status')<0){
      var p=html.indexOf('<div class="card"><div class="line"><span>'+esc(T('current_version'))+'</span>');
      if(p>=0)html=html.slice(0,p)+v2146UpdateStatusHTML()+html.slice(p);
      else html+=v2146UpdateStatusHTML();
    }
    if(S.update.checking||S.update.applying)html=html.replace('data-action="update-check"','data-action="update-check" disabled');
    return html;
  };
  var v2146UiClickBase=uiClick;
  uiClick=function(e){
    var t=e&&e.target&&e.target.closest?e.target.closest('button'):null;
    if(t&&t.dataset&&t.dataset.action==='update-check'){
      if(S.update.checking||S.update.applying){if(S.toolWindows.settings)renderTool('settings');return;}
      S.update.checkedAt=0;S.update.error='';
      audit('update_manual_check',C.language==='de'?'Manuelle Update-Prüfung gestartet':'Manual update check started',{version:VERSION,repo:defaults.updateRepositoryUrl});
      var started=updateCheckTick(true);
      if(!started)audit('update_manual_check_blocked',C.language==='de'?'Manuelle Update-Prüfung konnte nicht gestartet werden':'Manual update check could not start',{checking:S.update.checking,applying:S.update.applying},'warning');
      if(S.toolWindows.settings)renderTool('settings');
      return;
    }
    return v2146UiClickBase(e);
  };

'''
bot=bot.replace(marker,block+marker,1)
bot_p.write_text(bot,encoding='utf-8')

v=json.loads(ver_p.read_text(encoding='utf-8'))
v['version']='2.14.6'
v['build']='2026-09-10'
# Dashboard is unchanged in this bot-only hotfix.
v['dashboardVersion']='2.14.5'
ver_p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

for p in (readme_p,botreadme_p):
    s=p.read_text(encoding='utf-8')
    s=s.replace('2.14.5','2.14.6',1)
    note='\n### 2.14.6 Merchant-/Update-Button-Hotfix\n- Behebt den Merchant-Absturz `v2144NpcValue is not defined`; die 2.14.5-Verkaufslogik nutzt jetzt den vorhandenen sicheren `itemValueSafe()`-Helfer.\n- Der manuelle Update-Button zeigt auf Deutsch **„Auf Updates prüfen“**, während der Prüfung **„Prüfe auf Updates …“**, und zeigt den letzten Prüfstatus direkt in den Einstellungen.\n- Dashboard/Worker und Brain bleiben unverändert auf dem 2.14.5-Stand.\n'
    if '2.14.6 Merchant-/Update-Button-Hotfix' not in s:
        s += note
    p.write_text(s,encoding='utf-8')

# Version expectations in persistent tests.
for p in (verify_p,merchant_smoke_p,smoke2144_p,smoke2145_p):
    if not p.exists(): continue
    s=p.read_text(encoding='utf-8')
    s=s.replace('2.14.5','2.14.6')
    s=s.replace('2\\.14\\.5','2\\.14\\.6')
    # 2.14.6 is bot-only; keep dashboard expectation at 2.14.5.
    if p==verify_p:
        s=s.replace('dashboard version must remain 2.14.6','dashboard version must remain 2.14.5')
        s=s.replace('version.dashboardVersion === "2.14.6"','version.dashboardVersion === "2.14.5"')
    p.write_text(s,encoding='utf-8')

# Add explicit regression checks without relying on runtime mocks.
s=verify_p.read_text(encoding='utf-8')
insert='''\nok(!bot.includes("v2144NpcValue(it)"), "2.14.6 undefined Merchant NPC value helper reference remains");\nok(bot.includes("itemValueSafe(it)"), "2.14.6 Merchant sell decision must use itemValueSafe");\nok(bot.includes("function v2146UpdateLabel"), "2.14.6 localized update label helper missing");\nok(bot.includes("Auf Updates prüfen") && bot.includes("Prüfe auf Updates"), "2.14.6 German manual update labels missing");\nok(bot.includes("update_manual_check") && bot.includes("updateCheckTick(true)"), "2.14.6 manual update click wiring missing");\nok(bot.includes("update-manual-status"), "2.14.6 visible manual update status missing");\n'''
needle='if (!process.exitCode) console.log('
assert needle in s
s=s.replace(needle,insert+'\n'+needle,1)
verify_p.write_text(s,encoding='utf-8')

smoke=ROOT/'scripts/smoke-2146-merchant-update-button.js'
smoke.write_text(r'''#!/usr/bin/env node
"use strict";
const fs=require('fs'),assert=require('assert/strict');
const bot=fs.readFileSync('bot.js','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(version.version,'2.14.6');
assert.equal(version.dashboardVersion,'2.14.5');
assert.match(bot,/var VERSION = ['"]2\.14\.6['"]/);
assert.ok(!bot.includes('v2144NpcValue(it)'),'undefined v2144NpcValue reference must be gone');
assert.ok(bot.includes('itemValueSafe(it)'),'sell decision must use existing safe item value helper');
assert.ok(bot.includes("C.language==='de'?'Auf Updates prüfen':'Check for update'"),'German update button label missing');
assert.ok(bot.includes("C.language==='de'?'Prüfe auf Updates …':'Checking for updates …'"),'checking state label missing');
assert.ok(bot.includes("audit('update_manual_check'"),'manual update click audit missing');
assert.ok(bot.includes('var started=updateCheckTick(true);'),'manual update button must force the checker');
assert.ok(bot.includes('update-manual-status'),'manual update status UI missing');
console.log('2.14.6 Merchant crash / manual update UX smoke OK');
''',encoding='utf-8')

print('2.14.6 patch prepared')
