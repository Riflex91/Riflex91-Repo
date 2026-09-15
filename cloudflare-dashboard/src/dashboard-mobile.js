export const MOBILE_STYLE = `
.view-switch{border:1px solid #2d5165;border-radius:10px;background:#0c202c;color:#c8dce7;padding:8px 10px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}
.view-switch:hover{border-color:#4b7c91;color:#fff}
.mobile-bottom-nav,.mobile-more-sheet,.mobile-sheet-backdrop{display:none}
body.mobile-ui{min-width:0;background:linear-gradient(180deg,#06111a 0,#03070c 100%)}
body.mobile-ui:before{background-size:34px 34px;opacity:.14}
body.mobile-ui .top{padding:9px 10px;gap:8px;flex-wrap:nowrap;min-height:58px}
body.mobile-ui .brand{min-width:0;flex:1}.mobile-ui .brandmark{width:36px;height:36px;border-radius:11px}.mobile-ui .brand small{display:none}
body.mobile-ui .nav{display:none}.mobile-ui .topstatus{display:flex;margin:0}.mobile-ui .topstatus .pill{display:none}.mobile-ui .topstatus .btn{display:none}
body.mobile-ui .view-switch{padding:8px 9px}
body.mobile-ui .wrap{max-width:760px;padding:12px 11px 94px}
body.mobile-ui .login{margin:4vh auto;padding:22px 18px;border-radius:19px}
body.mobile-ui .login h1{font-size:26px}
body.mobile-ui .pagehead{align-items:flex-start;flex-direction:column;margin:4px 0 13px;gap:7px}
body.mobile-ui .pagehead h1{font-size:24px}.mobile-ui .pagehead p{font-size:12px}.mobile-ui #overviewTime{font-size:10px}
body.mobile-ui .capacity-deck{gap:10px;margin-top:4px}
body.mobile-ui .capacity-strip{padding:13px 13px 12px;border-radius:16px}
body.mobile-ui .capacity-head{display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:10px;align-items:center}
body.mobile-ui .capacity-icon{width:38px;height:38px;border-radius:11px;font-size:18px}
body.mobile-ui .capacity-title b{font-size:13px}.mobile-ui .capacity-title small{font-size:9px;line-height:1.35}
body.mobile-ui .capacity-value strong{font-size:18px}.mobile-ui .capacity-value small{font-size:9px}
body.mobile-ui .capacity-track{height:14px;margin-top:11px}.mobile-ui .capacity-foot{font-size:9px;flex-direction:column;gap:2px;margin-top:7px}
body.mobile-ui .chargrid,body.mobile-ui .grid,body.mobile-ui .data-categories,body.mobile-ui .brain-panels,body.mobile-ui .settingsgrid{grid-template-columns:1fr}
body.mobile-ui .card{padding:13px;border-radius:15px}.mobile-ui .chargrid{gap:10px}.mobile-ui .triple{grid-template-columns:repeat(3,1fr)}
body.mobile-ui .brain-stage{padding:15px;border-radius:17px;min-height:0}.mobile-ui .brain-layout{grid-template-columns:1fr;gap:12px}.mobile-ui .neural-core{width:150px;height:150px}.mobile-ui .core-brain{font-size:55px}.mobile-ui .brain-copy h2{font-size:24px}.mobile-ui .signal-flow{grid-template-columns:1fr}.mobile-ui .signal-step:not(:last-child):after{content:"↓";right:50%;top:auto;bottom:-13px;transform:translate(50%,50%)}
body.mobile-ui .command-banner{grid-template-columns:1fr}.mobile-ui .command-lights{justify-content:flex-start}.mobile-ui .command-toolbar{top:62px;padding:8px}.mobile-ui .settings-search{min-width:100%;max-width:none}.mobile-ui .settings-actions{width:100%;display:grid;grid-template-columns:1fr 1fr}.mobile-ui .settings-actions .btn{width:100%}
body.mobile-ui .event{grid-template-columns:58px 1fr;gap:7px;padding:11px}.mobile-ui .event .sev{grid-column:2}.mobile-ui .event .component{display:none}
body.mobile-ui .mobile-bottom-nav{display:grid;grid-template-columns:repeat(5,1fr);position:fixed;z-index:75;left:8px;right:8px;bottom:max(8px,env(safe-area-inset-bottom));padding:6px;border:1px solid #29495c;border-radius:17px;background:#06131df2;backdrop-filter:blur(22px);box-shadow:0 18px 46px #000c}
body.mobile-ui .mobile-bottom-nav button{border:0;background:transparent;color:#708b9d;border-radius:12px;padding:7px 2px 6px;font-size:9px;font-weight:750;display:grid;gap:2px;place-items:center;cursor:pointer}
body.mobile-ui .mobile-bottom-nav button i{font-style:normal;font-size:17px;line-height:1}
body.mobile-ui .mobile-bottom-nav button.active{color:#dffefa;background:#10303a;box-shadow:inset 0 0 0 1px #2b5c66}
body.mobile-ui .mobile-sheet-backdrop.open{display:block;position:fixed;z-index:78;inset:0;background:#0009;backdrop-filter:blur(3px)}
body.mobile-ui .mobile-more-sheet.open{display:grid;position:fixed;z-index:79;left:10px;right:10px;bottom:86px;gap:7px;padding:12px;border:1px solid #315367;border-radius:17px;background:#081722f8;box-shadow:0 24px 60px #000d}
body.mobile-ui .mobile-more-sheet button{border:1px solid #24475a;border-radius:11px;background:#0b202c;color:#d6e8f2;padding:11px;text-align:left;font-weight:750;cursor:pointer}.mobile-ui .mobile-more-sheet button.danger{color:#ffb8c1;border-color:#65343e;background:#281218}
@media(max-width:680px){.view-switch{display:inline-flex;align-items:center}.top>.view-switch{margin-left:auto}}
`;

export const MOBILE_SCRIPT = `<script>
(function(){
  var STORAGE_KEY='aioV3PreferredView';
  var params=new URLSearchParams(location.search);
  var explicit=params.get('view');
  var stored='';try{stored=localStorage.getItem(STORAGE_KEY)||''}catch(e){}
  var mobile=explicit==='mobile'||(explicit!=='desktop'&&(stored==='mobile'||(!stored&&matchMedia('(max-width:760px)').matches)));
  var top=document.getElementById('top');
  var switcher=document.createElement('button');
  switcher.type='button';switcher.className='view-switch';
  if(top)top.appendChild(switcher);
  var bottom=document.createElement('nav');bottom.className='mobile-bottom-nav';bottom.setAttribute('aria-label','Mobile Navigation');
  bottom.innerHTML='<button data-mobile-page="overview"><i>◈</i>Übersicht</button><button data-mobile-page="characters"><i>👥</i>Charaktere</button><button data-mobile-page="combat"><i>⚔</i>Kampf</button><button data-mobile-page="brain"><i>🧠</i>Gehirn</button><button data-mobile-more="1"><i>•••</i>Mehr</button>';
  document.body.appendChild(bottom);
  var backdrop=document.createElement('div');backdrop.className='mobile-sheet-backdrop';document.body.appendChild(backdrop);
  var sheet=document.createElement('div');sheet.className='mobile-more-sheet';sheet.innerHTML='<button data-mobile-page="economy">🧳 Merchant & Economy</button><button data-mobile-page="settings">⚙ Einstellungen</button><button data-mobile-page="events">⚠ Events</button><button data-mobile-page="data">☁ Daten & Datenbanken</button><button class="danger" data-mobile-logout="1">↪ Abmelden</button>';document.body.appendChild(sheet);
  function closeMore(){sheet.classList.remove('open');backdrop.classList.remove('open')}
  function activePage(){var page=document.querySelector('.page.active');return page&&page.dataset.page||'overview'}
  function syncActive(){var page=activePage(),main=['overview','characters','combat','brain'].indexOf(page)>=0;bottom.querySelectorAll('button').forEach(function(b){b.classList.toggle('active',b.dataset.mobilePage===page||(!main&&b.dataset.mobileMore==='1'))})}
  function go(page){var b=document.querySelector('#nav button[data-page="'+page+'"]');if(b)b.click();closeMore();syncActive();window.scrollTo({top:0,behavior:'smooth'})}
  function setMobile(on){mobile=!!on;document.body.classList.toggle('mobile-ui',mobile);switcher.textContent=mobile?'🖥 Desktop':'📱 Mobil';switcher.title=mobile?'Zur Desktop-Ansicht wechseln':'Mobile Ansicht öffnen';try{localStorage.setItem(STORAGE_KEY,mobile?'mobile':'desktop')}catch(e){}var url=new URL(location.href);url.searchParams.set('view',mobile?'mobile':'desktop');history.replaceState(null,'',url.pathname+url.search+url.hash);if(!mobile)closeMore();syncActive()}
  switcher.addEventListener('click',function(){setMobile(!mobile)});
  bottom.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.mobileMore){sheet.classList.toggle('open');backdrop.classList.toggle('open',sheet.classList.contains('open'));return}if(b.dataset.mobilePage)go(b.dataset.mobilePage)});
  sheet.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.mobilePage)go(b.dataset.mobilePage);if(b.dataset.mobileLogout){var logout=document.getElementById('logout');if(logout)logout.click()}});
  backdrop.addEventListener('click',closeMore);
  var nav=document.getElementById('nav');if(nav)new MutationObserver(syncActive).observe(nav,{attributes:true,subtree:true,attributeFilter:['class']});
  setMobile(mobile);
})();
</script>`;
