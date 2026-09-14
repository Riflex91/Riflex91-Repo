export const DASHBOARD_FRAGMENT_2 = `.charhead strong{font-size:16px}.charhead small{display:block;color:var(--muted);margin-top:2px}.charstate{margin-left:auto}
.bars{display:grid;gap:9px;margin:14px 0}.barrow{font-size:10px;color:#9fb1bf}.bar{height:8px;border-radius:99px;background:#1b2b37;overflow:hidden;margin-top:4px;box-shadow:inset 0 1px 3px #0008}
.bar i{display:block;height:100%;background:linear-gradient(90deg,#45d6a8,#82f0cd);transition:width .5s var(--ease)}.bar.hp i{background:linear-gradient(90deg,#d75668,#ff8290)}.bar.mp i{background:linear-gradient(90deg,#5f8dec,#82b0ff)}
.triple{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.mini{background:#050f17;border:1px solid #162b3a;border-radius:10px;padding:8px;text-align:center;font-size:10px;color:var(--muted)}.mini b{display:block;color:white;font-size:14px;margin-top:2px}

/* BRAIN: cognitive theatre */
.brain-stage{
  position:relative;overflow:hidden;min-height:330px;border:1px solid #245c62;border-radius:24px;padding:24px;
  background:
    radial-gradient(circle at 50% 50%,#285d6338 0,transparent 22%),
    radial-gradient(circle at 20% 10%,#723f9f1c 0,transparent 30%),
    linear-gradient(145deg,#07121b,#091c27 55%,#07111a);
  box-shadow:0 28px 70px #0008
}
.brain-stage:before{content:"";position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(#71e7df08 1px,transparent 1px),linear-gradient(90deg,#71e7df08 1px,transparent 1px);background-size:28px 28px;mask-image:radial-gradient(circle,#000 0,transparent 74%)}
.brain-stage:after{content:"";position:absolute;left:0;right:0;height:1px;top:20%;background:linear-gradient(90deg,transparent,#6fece1aa,transparent);box-shadow:0 0 18px #6fece199;animation:scan 4.5s ease-in-out infinite}
.brain-layout{position:relative;z-index:2;display:grid;grid-template-columns:minmax(260px,.85fr) minmax(320px,1.3fr) minmax(230px,.85fr);gap:20px;align-items:center}
.neural-core{position:relative;width:225px;height:225px;margin:auto;display:grid;place-items:center}
.core-shell,.core-shell:before,.core-shell:after{position:absolute;border-radius:50%;border:1px solid #6ce8df66}
.core-shell{inset:28px;box-shadow:inset 0 0 45px #5fe8da24,0 0 35px #5fe8da22;animation:corePulse 2.4s ease-in-out infinite}
.core-shell:before{content:"";inset:-24px;border-style:dashed;animation:spin 9s linear infinite}.core-shell:after{content:"";inset:17px;border-color:#ae8cff66;animation:spinReverse 6s linear infinite}
.core-brain{position:relative;z-index:4;font-size:76px;filter:drop-shadow(0 0 18px #70eee0aa);animation:float 2.4s ease-in-out infinite}
.synapse{position:absolute;width:7px;height:7px;border-radius:50%;background:var(--cyan);box-shadow:0 0 13px var(--cyan);animation:synapse 2s ease-in-out infinite}
.s1{top:18px;left:56px}.s2{top:40px;right:28px;animation-delay:-.5s}.s3{right:12px;bottom:66px;animation-delay:-1s}.s4{bottom:22px;left:55px;animation-delay:-1.4s}.s5{left:10px;top:96px;animation-delay:-.8s}
.brain-copy small{text-transform:uppercase;letter-spacing:.16em;color:#78a7aa;font-size:10px}.brain-copy h2{font-size:31px;margin:6px 0 8px;letter-spacing:-.05em}
.thought-live{position:relative;padding:14px 15px;border:1px solid #28545a;border-radius:14px;background:#041017cc;color:#d5efeb;font-size:13px;line-height:1.55;min-height:70px}
.thought-live:before{content:"THOUGHT STREAM";position:absolute;top:-8px;left:12px;padding:0 6px;background:#071822;color:#67cfc8;font-size:8px;letter-spacing:.15em}
.thought-cursor{display:inline-block;width:7px;height:13px;margin-left:5px;vertical-align:-2px;background:var(--cyan);box-shadow:0 0 8px var(--cyan);animation:blink 1s steps(1) infinite}
.brain-quality{text-align:center;padding:18px 14px;border:1px solid #273d57;border-radius:18px;background:#07131fbb}
.brain-quality .score{font-size:42px;font-weight:900;letter-spacing:-.06em}.brain-quality .label{font-size:11px;color:var(--muted)}
.signal-flow{position:relative;z-index:2;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:21px}
.signal-step{position:relative;padding:12px;border:1px solid #1c4050;border-radius:13px;background:#06131dbb}
.signal-step:not(:last-child):after{content:"→";position:absolute;right:-10px;top:50%;transform:translate(50%,-50%);color:#67e4da;z-index:3;text-shadow:0 0 9px #67e4da}
.signal-step small{display:block;color:#6e8f9d;font-size:9px;letter-spacing:.12em;text-transform:uppercase}.signal-step b{display:block;margin-top:4px;font-size:13px}
.brain-panels{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-top:13px}
.brainmetrics{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.diary{max-height:360px;overflow:auto;display:grid;gap:7px;padding-right:2px}
.diaryrow{display:grid;grid-template-columns:30px 1fr;gap:8px;padding:9px;background:#06131c;border:1px solid #20394a;border-radius:10px}.diaryrow .ico{display:grid;place-items:center}.diaryrow b{font-size:11px}.diaryrow p{margin:3px 0;color:#9eb2c1;font-size:10px;line-height:1.4}

/* SETTINGS: command deck */
.command-shell{display:grid;gap:13px}
.command-banner{
  position:relative;overflow:hidden;display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;padding:17px 18px;
  border:1px solid #244c61;border-radius:17px;background:linear-gradient(120deg,#091722,#0d2634 60%,#0a1720);box-shadow:var(--soft)
}
.command-banner:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,transparent 0,#67e7de08 50%,transparent 100%);animation:sweep 6s linear infinite}
.command-title{position:relative}.command-title small{display:block;color:#6f97a8;text-transform:uppercase;letter-spacing:.14em;font-size:9px}.command-title b{display:block;margin-top:3px;font-size:18px}
.command-lights{position:relative;display:flex;gap:7px;align-items:center}
.command-toolbar{
  position:sticky;top:72px;z-index:22;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px;
  border:1px solid #1f3b4e;border-radius:14px;background:#07151fe8;backdrop-filter:blur(16px);box-shadow:0 10px 30px #0006
}
.settings-search{position:relative;min-width:230px;flex:1;max-width:520px}.settings-search:before{content:"⌕";position:absolute;left:11px;top:50%;transform:translateY(-52%);color:#6f8ca0;font-size:17px}
.settings-search input{width:100%;border:1px solid #30485a;border-radius:10px;background:#050f17;color:white;padding:9px 11px 9px 34px;outline:0}
.settings-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.settings-summary{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.settingscat{margin:0;border:1px solid var(--line);border-radius:15px;overflow:hidden;background:#08141d;box-shadow:0 10px 28px #0003}
.settingscat[open]{border-color:#285166}
.settingscat summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:auto 1fr auto auto;gap:10px;align-items:center;padding:13px 14px;background:linear-gradient(180deg,#0f2431,#0a1a25);user-select:none}
.settingscat summary::-webkit-details-marker{display:none}.cat-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:#06121b;border:1px solid #274459;font-size:15px}
.cat-title b{display:block;font-size:14px}.cat-title small{display:block;margin-top:2px;color:var(--muted);font-size:10px}.cat-count{font-size:10px;color:#96adbd;padding:4px 7px;border:1px solid #2a4658;border-radius:999px;background:#07141e}
.chev{width:27px;height:27px;border-radius:8px;display:grid;place-items:center;border:1px solid #29485b;color:#9bb2c2;transition:.22s var(--ease)}.settingscat[open] .chev{transform:rotate(180deg);color:var(--cyan);border-color:#2c6460}
.settingsgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:1px;background:var(--line)}
.setting{position:relative;background:#07131c;padding:13px;min-height:134px}.setting:hover{background:#091924}.setting.dirty{box-shadow:inset 3px 0 0 var(--yellow);background:#161b12}
.settingtop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.setting label{font-size:12px;font-weight:780}.setting p{margin:6px 0 10px;color:#7994a6;font-size:10px;line-height:1.45}
.tag{display:inline-flex;padding:3px 6px;border-radius:999px;font-size:8px;text-transform:uppercase;letter-spacing:.08em;border:1px solid #294658;color:#88a5b6}.tag.hot{color:var(--green);border-color:#285d51}.tag.lock{color:var(--red);border-color:#63313a}.tag.restart{color:var(--yellow);border-color:#66532d}
.control{display:grid;gap:5px}.toggle-row{display:flex;align-items:center;justify-content:space-between}
.switch{position:relative;width:44px;height:24px}.switch input{opacity:0;width:0;height:0}.slider{position:absolute;inset:0;border-radius:99px;background:#1e3341;border:1px solid #2c4d60;transition:.2s}.slider:before{content:"";position:absolute;width:16px;height:16px;left:3px;top:3px;border-radius:50%;background:#8fa6b5;transition:.2s}
.switch input:checked+.slider{background:#124c43;border-color:#2e7c6c}.switch input:checked+.slider:before{transform:translateX(20px);background:#74efcb;box-shadow:0 0 10px #74efcb77}
.rangehint{display:flex;justify-content:space-between;color:#587487;font-size:8px}.settingkey{margin-top:8px;color:#506b7c;font-size:8px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.dirtydot{display:inline-block;width:6px;height:6px;margin-right:5px;border-radius:50%;background:var(--yellow);box-shadow:0 0 8px var(--yellow)}

/* EVENTS */
.events{display:grid;gap:9px;max-width:1180px;margin:auto}
.event{
  position:relative;overflow:hidden;display:grid;grid-template-columns:76px 88px 150px minmax(0,1fr);gap:11px;align-items:center;
  padding:13px 14px;border:1px solid #23404f;border-left:4px solid var(--green);border-radius:14px;background:linear-gradient(90deg,#0a1c17,#07151d 55%);
  box-shadow:0 10px 28px #0004;animation:eventIn .38s var(--ease) both
}
.event:after{content:"";position:absolute;width:90px;height:90px;right:-50px;top:-45px;border-radius:50%;background:#65e3a619;filter:blur(1px);animation:eventHalo 2.3s ease-out both}
.event.warn,.event.warning{border-left-color:var(--yellow);background:linear-gradient(90deg,#241c0c,#07151d 55%)}.event.warn:after,.event.warning:after{background:#ffd1661f}
.event.error,.event.critical,.event.fatal,.event.emergency,.event.alert{border-left-color:var(--red);background:linear-gradient(90deg,#281016,#07151d 55%)}.event.error:after,.event.critical:after,.event.fatal:after,.event.emergency:after,.event.alert:after{background:#ff667c22}
.event .sev{font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:900}.event .component{font-size:10px;color:#7f9cac}.event .muted{font-size:10px;color:#678294}.event-main b{font-size:12px}.event-main span{font-size:10px;color:#8da5b4}
.event-empty{text-align:center;padding:34px 20px;border:1px dashed #264657;border-radius:16px;color:#7894a4;background:#07131b}

/* DATA */
.data-categories{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:13px}
.data-category{position:relative;overflow:hidden;border:1px solid var(--line);border-radius:18px;background:linear-gradient(145deg,#0b1a25,#07131c);padding:15px;box-shadow:var(--soft)}
.data-category .head{display:flex;align-items:center;gap:10px;margin-bottom:12px}.data-category .head i{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:#06121b;border:1px solid #285068;font-style:normal}
.data-category .head b{display:block;font-size:14px}.data-category .head small{display:block;color:var(--muted);margin-top:2px;font-size:10px}
.db-list{display:grid;gap:7px}.dbbox{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #173142;border-radius:11px;background:#051018;padding:10px}
.dbbox span{font-size:10px;color:#7794a6}.dbbox b{font-size:17px}.dbbox em{font-style:normal;font-size:9px;color:#5f7a8d}

/* responsive */
@media(max-width:980px){.top{flex-wrap:wrap}.brand{min-width:0}.nav{order:3;width:100%}.brain-layout{grid-template-columns:1fr}.brain-quality{max-width:280px;margin:auto;width:100%}.brain-panels{grid-template-columns:1fr}.event{grid-template-columns:70px 75px 1fr}.event .component{display:none}}
@media(max-width:680px){.wrap{padding:14px}.topstatus{display:none}.pagehead{align-items:flex-start;flex-direction:column}.capacity-head{align-items:flex-start}.capacity-value{margin-left:auto}.capacity-foot{flex-direction:column;gap:3px}.signal-flow{grid-template-columns:1fr}.signal-step:not(:last-child):after{content:"↓";right:50%;top:auto;bottom:-13px;transform:translate(50%,50%)}.settingsgrid{grid-template-columns:1fr}.event{grid-template-columns:60px 1fr}.event .sev{grid-column:2}.event .component{display:none}.triple{grid-template-columns:1fr 1fr 1fr}}
.toast{position:fixed;right:18px;bottom:18px;z-index:90;padding:11px 14px;border-radius:11px;border:1px solid #2e695c;background:#0b211c;color:#9af1d1;box-shadow:var(--shadow);font-size:12px}.toast.bad{border-color:#6d3340;background:#2b1118;color:#ffb6c0}

@keyframes pageIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
@keyframes rise{from{opacity:0;transform:translateY(14px) scale(.99)}to{opacity:1;transform:none}}
@keyframes livePulse{50%{opacity:.35;transform:scale(.75)}}
@keyframes brandPulse{50%{opacity:.25;transform:scale(1.06)}}
@keyframes ambient{50%{opacity:.28;transform:scale(1.05)}}
@keyframes sweep{from{transform:translateX(-25%)}to{transform:translateX(25%)}}
@keyframes barShine{to{transform:translateX(120%)}}
@keyframes unknownFlow{to{background-position:70px 0}}
@keyframes scan{0%,100%{top:12%;opacity:0}20%,80%{opacity:.8}50%{top:87%;opacity:.55}}
@keyframes corePulse{50%{transform:scale(1.05);box-shadow:inset 0 0 55px #5fe8da38,0 0 48px #5fe8da38}}
@keyframes spin{to{transform:rotate(360deg)}}@keyframes spinReverse{to{transform:rotate(-360deg)}}@keyframes float{50%{transform:translateY(-5px) scale(1.025)}}
@keyframes synapse{50%{transform:scale(1.8);opacity:.35}}@keyframes blink{50%{opacity:0}}
@keyframes eventIn{from{opacity:0;transform:translateX(10px) scale(.99)}to{opacity:1;transform:none}}@keyframes eventHalo{from{transform:scale(.2);opacity:1}to{transform:scale(1.35);opacity:.05}}
</style>
</head>
<body>
<header class="top hidden" id="top">
  <div class="brand"><div class="brandmark">◈</div><div><b>AiO Bot v3</b><small>Command Center</small></div></div>
  <nav class="nav" id="nav"></nav>
  <div class="topstatus"><span class="pill" id="syncPill"><i class="dot"></i>warte</span><button class="btn ghost" id="logout">Abmelden</button></div>
</header>

<main class="wrap">
<section class="login" id="login">
  <h1>Control Center</h1>
`;