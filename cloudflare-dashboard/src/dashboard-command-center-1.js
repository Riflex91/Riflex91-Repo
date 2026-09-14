export const DASHBOARD_FRAGMENT_1 = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>AiO Bot v3 Control Center</title>
<style>
:root{
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  --bg:#03070c;--bg2:#071019;--panel:#09151f;--panel2:#0d1d29;--panel3:#112735;
  --line:#173244;--line2:#27536b;--text:#eefaff;--muted:#7792a5;--muted2:#a8bdca;
  --cyan:#68e8e0;--mint:#6cf0b9;--green:#62e6a7;--yellow:#ffd166;--red:#ff667c;
  --purple:#a989ff;--blue:#73a9ff;--shadow:0 24px 70px #000a;--soft:0 15px 42px #0006;
  --radius:18px;--ease:cubic-bezier(.2,.8,.2,1)
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0;min-height:100vh;color:var(--text);
  background:
    radial-gradient(circle at 12% -10%,#0f3850 0,transparent 30%),
    radial-gradient(circle at 88% 2%,#1b234b 0,transparent 28%),
    linear-gradient(180deg,#06111a 0,#03070c 54%,#050a10 100%);
  background-attachment:fixed
}
body:before{
  content:"";position:fixed;inset:0;pointer-events:none;opacity:.22;
  background-image:linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px);
  background-size:42px 42px;mask-image:linear-gradient(to bottom,#000,transparent 76%)
}
body:after{
  content:"";position:fixed;inset:0;pointer-events:none;opacity:.16;
  background:radial-gradient(circle at 50% 30%,#66e8dd18,transparent 24%);
  animation:ambient 8s ease-in-out infinite
}
button,input,select{font:inherit}.hidden{display:none!important}
.top{
  position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:14px;padding:11px 18px;
  border-bottom:1px solid #1a394b;background:#050e16e8;backdrop-filter:blur(24px) saturate(1.35);
  box-shadow:0 10px 36px #0005
}
.brand{display:flex;align-items:center;gap:11px;min-width:215px}
.brandmark{
  position:relative;width:40px;height:40px;border-radius:13px;display:grid;place-items:center;
  background:linear-gradient(145deg,#174c5a,#17304e);box-shadow:inset 0 0 24px #69eee044,0 8px 22px #0007;
  font-size:20px
}
.brandmark:after{content:"";position:absolute;inset:-3px;border:1px solid #68e8e033;border-radius:16px;animation:brandPulse 3s ease-in-out infinite}
.brand b{display:block;letter-spacing:-.02em}.brand small{display:block;color:var(--muted);margin-top:1px}
.nav{display:flex;gap:5px;overflow:auto;flex:1;padding:2px;scrollbar-width:none}.nav::-webkit-scrollbar{display:none}
.nav button{
  position:relative;border:0;background:transparent;color:#89a5b7;padding:9px 11px;border-radius:10px;cursor:pointer;
  white-space:nowrap;transition:.2s var(--ease)
}
.nav button:hover{color:#e4f4ff;background:#0c202c}
.nav button.active{color:white;background:linear-gradient(180deg,#123044,#0c2231);box-shadow:inset 0 0 0 1px #28536a}
.nav button.active:after{content:"";position:absolute;left:20%;right:20%;bottom:-2px;height:2px;border-radius:5px;background:var(--cyan);box-shadow:0 0 14px var(--cyan)}
.topstatus{display:flex;gap:7px;align-items:center}
.pill{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border:1px solid var(--line);border-radius:999px;background:#0b1b27;color:#a9bdcc;font-size:11px;white-space:nowrap}
.pill.good{color:var(--green);border-color:#285d51;background:#09221b}.pill.warn{color:var(--yellow);border-color:#6a5527;background:#231c0b}.pill.bad{color:var(--red);border-color:#67303a;background:#271014}
.dot{width:7px;height:7px;border-radius:50%;background:currentColor;box-shadow:0 0 9px currentColor}
.pill.good .dot{animation:livePulse 1.8s ease-in-out infinite}
.wrap{position:relative;max-width:1580px;margin:auto;padding:22px}
.login{position:relative;overflow:hidden;max-width:560px;margin:8vh auto;padding:30px;border:1px solid #244354;border-radius:24px;background:linear-gradient(155deg,#0d1c29ed,#08131ded);box-shadow:var(--shadow);animation:rise .55s var(--ease) both}
.login:before{content:"";position:absolute;width:280px;height:280px;right:-110px;top:-120px;border-radius:50%;background:#68e8e013;filter:blur(2px)}
.login h1{margin:0 0 7px;font-size:30px;letter-spacing:-.04em}.login p{color:var(--muted2);line-height:1.6}
.field{display:grid;gap:7px;margin:14px 0}.field label{font-size:12px;color:#adc0ce}
.field input,.field select,.control input,.control select{
  width:100%;border:1px solid #2b4b5e;border-radius:11px;background:#050f17;color:#fff;padding:10px 11px;outline:0;transition:.2s var(--ease)
}
.field input:focus,.field select:focus,.control input:focus,.control select:focus{border-color:#4d948b;box-shadow:0 0 0 3px #68e8e010}
.btn{
  border:0;border-radius:10px;padding:9px 13px;background:linear-gradient(180deg,#78efe0,#55d7c9);color:#04201e;
  font-weight:850;cursor:pointer;box-shadow:0 8px 18px #22b9aa22;transition:.2s var(--ease)
}
.btn:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.05);box-shadow:0 11px 26px #22b9aa30}
.btn:active:not(:disabled){transform:translateY(0) scale(.99)}
.btn.alt{background:#112838;color:#d8e8f2;border:1px solid #31536a;box-shadow:none}
.btn.ghost{background:transparent;color:#a9bfce;border:1px solid #29475a;box-shadow:none}
.btn.danger{background:#4a2029;color:#ffb3bb;border:1px solid #6c303c}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
.page{display:none}.page.active{display:block;animation:pageIn .34s var(--ease) both}
.pagehead{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:3px 0 18px}
.pagehead h1{font-size:29px;margin:0;letter-spacing:-.04em}.pagehead p{margin:6px 0 0;color:var(--muted);font-size:13px;line-height:1.5}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(265px,1fr));gap:13px}
.card{position:relative;overflow:hidden;background:linear-gradient(155deg,#0d1d29f5,#07131cf5);border:1px solid var(--line);border-radius:var(--radius);padding:15px;box-shadow:var(--soft);transition:.22s var(--ease)}
.card:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 5%,#ffffff05 35%,transparent 62%);transform:translateX(-110%);transition:.65s var(--ease)}
.card:hover{transform:translateY(-2px);border-color:#2b4d61;box-shadow:0 18px 42px #0006}.card:hover:after{transform:translateX(110%)}
.card h3{margin:0 0 9px;font-size:14px;color:#d6e8f2}.metric{font-size:29px;font-weight:900;letter-spacing:-.04em}.sub{font-size:11px;color:var(--muted);margin-top:3px;line-height:1.5}
.line{display:flex;justify-content:space-between;gap:14px;margin:8px 0;font-size:12px}.line span:first-child{color:var(--muted)}.line b{text-align:right}
.section{margin:19px 0}.sectiontitle{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:15px}
.empty,.notice,.error{border:1px solid var(--line);border-radius:13px;padding:13px;background:#08151f;color:#9db4c4;font-size:12px;line-height:1.5}
.notice{border-color:#6a5527;background:#201a0c;color:#f5d88d}.error{border-color:#71333d;background:#260e14;color:#ffb6c0}

/* OVERVIEW: capacity deck only */
.capacity-deck{display:grid;gap:14px;max-width:1160px;margin:10px auto 0}
.capacity-strip{
  position:relative;overflow:hidden;border:1px solid #234658;border-radius:22px;padding:18px 20px 17px;
  background:linear-gradient(135deg,#091923,#0b202b 55%,#08141e);box-shadow:0 18px 50px #0006;
  isolation:isolate
}
.capacity-strip:before{content:"";position:absolute;inset:-80% -20%;z-index:-1;background:linear-gradient(110deg,transparent 42%,#6ce8df0f 49%,transparent 57%);animation:sweep 5s linear infinite}
.capacity-strip.unknown:before{background:linear-gradient(110deg,transparent 42%,#7993a20d 49%,transparent 57%)}
.capacity-head{display:flex;align-items:center;gap:13px}
.capacity-icon{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:#07131c;border:1px solid #295269;font-size:21px;box-shadow:inset 0 0 20px #66e8e00d}
.capacity-title{min-width:0;flex:1}.capacity-title b{display:block;font-size:15px}.capacity-title small{display:block;color:var(--muted);margin-top:3px}
.capacity-value{text-align:right}.capacity-value strong{display:block;font-size:24px;letter-spacing:-.04em}.capacity-value small{display:block;color:var(--muted)}
.capacity-track{position:relative;height:18px;margin-top:15px;border-radius:999px;overflow:hidden;background:#02090e;border:1px solid #173342;box-shadow:inset 0 2px 8px #000c}
.capacity-fill{position:relative;height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,#2ecb9a,#6cf0b9 55%,#95f7d0);box-shadow:0 0 22px #59e7b866;transition:width 1.1s var(--ease)}
.capacity-fill:after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 20%,#ffffff55 48%,transparent 68%);transform:translateX(-100%);animation:barShine 2.4s linear infinite}
.capacity-strip.warn .capacity-fill{background:linear-gradient(90deg,#e3a72e,#ffd166,#ffe49b);box-shadow:0 0 22px #ffd16655}
.capacity-strip.bad .capacity-fill{background:linear-gradient(90deg,#d7445c,#ff667c,#ff9dac);box-shadow:0 0 24px #ff667c55}
.capacity-strip.unknown .capacity-fill{width:100%!important;opacity:.38;background:repeating-linear-gradient(120deg,#2f5261 0 18px,#3c6d7b 18px 34px);animation:unknownFlow 1.7s linear infinite;box-shadow:none}
.capacity-foot{display:flex;justify-content:space-between;gap:12px;margin-top:9px;color:#829cae;font-size:11px}
.capacity-foot strong{color:#c6d9e4;font-weight:700}

/* CHARACTER / COMBAT / ECONOMY */
.chargrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:13px}
.charhead{display:flex;gap:10px;align-items:center}.avatar{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(145deg,#173149,#102334);box-shadow:inset 0 0 0 1px #2b4c61;font-size:21px}
`;