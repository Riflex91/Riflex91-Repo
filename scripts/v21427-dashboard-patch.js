
/* v2.14.27 inline player arrow + packed group terrain recovery */
function v21427DecodeRows(s){if(typeof s!=='string'||!s)return [];return s.split(';').filter(Boolean).map(r=>r.split(',').map(v=>v===''?null:parseInt(v,36)));}
function v21427HydrateTerrain(t){
  if(!t||t.omitted||!Array.isArray(t.t))return null;
  if((!Array.isArray(t.p)||!t.p.length)&&typeof t.pc==='string')t.p=v21427DecodeRows(t.pc);
  if((!Array.isArray(t.g)||!t.g.length)&&Array.isArray(t.gc))t.g=t.gc.map(v21427DecodeRows);
  if((!Array.isArray(t.a)||!t.a.length)&&typeof t.ac==='string')t.a=v21427DecodeRows(t.ac);
  return t;
}
terrainData=function(){return v21427HydrateTerrain(terrainMeta());};
terrainPlacements21426=function(t){t=v21427HydrateTerrain(t);return t&&Array.isArray(t.p)?t.p:[];};
terrainSource=function(file){file=String(file||'').trim();if(!file)return '';if(file.startsWith('//'))return 'https:'+file;if(/^https?:/i.test(file))return file;try{return new URL(file,'https://adventure.land/').toString();}catch(e){return 'https://adventure.land'+(file.startsWith('/')?'':'/')+file;}};
terrainImage=function(file){const src=terrainSource(file);if(!src)return Promise.resolve(null);if(terrainImages.has(src))return terrainImages.get(src);const p=new Promise(resolve=>{const im=new Image();im.decoding='async';im.referrerPolicy='no-referrer';im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=src;});terrainImages.set(src,p);return p;};

// Do not hotlink the Brave search result. It was rendered as a broken image in the live page.
// Draw the requested glow-arrow style directly in SVG so it is always available offline/CORS-free.
playerArrow21426=function(size=30){const s=Math.max(18,Number(size)||30),k=s/36;return `<g class="player-arrow21427" transform="scale(${k})"><path d="M0 -17 L12 -3.5 L5 -3.5 L5 15 L-5 15 L-5 -3.5 L-12 -3.5 Z" fill="#9cff70" stroke="#e9ffe2" stroke-width="1.5" vector-effect="non-scaling-stroke" style="filter:drop-shadow(0 0 2px #eaffdf) drop-shadow(0 0 5px #65ff79) drop-shadow(0 0 9px #36d96b)"/></g>`;};
const v21427Style=document.createElement('style');v21427Style.id='aio-v21427-style';v21427Style.textContent=`.pin text.player-name21426{font-size:10px!important;font-weight:700!important;stroke-width:2px!important}.player-arrow21427{pointer-events:none}.mini-live-map .player-arrow21427{pointer-events:none}`;document.head.appendChild(v21427Style);

// Surface live terrain state instead of claiming real terrain when a payload/image is absent.
function v21427TerrainSummary(){const t=terrainMeta();if(!t)return 'Terrain: noch keine Daten';if(t.omitted)return `Terrain: ausgelassen (${Math.round(Number(t.bytes||0)/1024)} KiB)`;const h=v21427HydrateTerrain(t),p=h&&h.p?h.p.length:0,g=h&&h.g?h.g.reduce((n,x)=>n+(Array.isArray(x)?x.length:0),0):0;return `Terrain: ${h&&h.t?h.t.length:0} Tiles · ${p+g} Placements · ${esc(t.encoding||'plain')}`;}
const v21427RenderMapBase=renderMap;renderMap=function(){v21427RenderMapBase();const hint=document.querySelector('.maphint');if(hint)hint.textContent='Mausrad = Zoom · Ziehen = Verschieben · '+v21427TerrainSummary();};
setTimeout(()=>{try{renderCards();if(view)renderMap();renderMiniTerrains();}catch(e){}},0);
