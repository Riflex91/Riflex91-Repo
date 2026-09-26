export function normalizeAssetPath(value) {
  if (typeof value !== "string" || !value) return null;
  return value.split("?")[0].split("#")[0].replace(/^\/+/, "") || null;
}
export function spriteRuntimeGrid(def = {}) {
  const rows=Number.isInteger(def.rows)&&def.rows>0?def.rows:1;
  const columns=Number.isInteger(def.columns)&&def.columns>0?def.columns:1;
  let rowFrames=4, columnFrames=3;
  const type=def.type||"full";
  if(type==="animation") rowFrames=1;
  if(type==="tail") columnFrames=4;
  if(["v_animation","head","hair","hat","s_wings","face","makeup","beard"].includes(type)) columnFrames=1;
  if(["a_makeup","a_hat"].includes(type)) columnFrames=Number.isInteger(def.frames)&&def.frames>0?def.frames:3;
  if(type==="head"&&Number.isInteger(def.frames)&&def.frames>0) columnFrames=def.frames;
  if(["emblem","gravestone"].includes(type)){rowFrames=1;columnFrames=1;}
  return {rows,columns,rowFrames,columnFrames,totalRows:rows*rowFrames,totalColumns:columns*columnFrames};
}
export function classifyContractPath(p) {
  if(!p) return "other";
  if(p.startsWith("images/all_characters/")||p.startsWith("images/tiles/characters/")||p.startsWith("images/tiles/monsters/")) return "entity-sprite";
  if(p.startsWith("images/sprites/animations/")||p.startsWith("images/tiles/animations/")) return "vfx";
  if(p.startsWith("images/tiles/map/")) return "world-atlas";
  if(p.startsWith("images/cosmetics/")) return "cosmetic-sprite";
  if(p.startsWith("css/fonts/")) return "font";
  if(p.startsWith("images/cards/")||p.startsWith("images/misc/")||p.startsWith("images/static/")) return "ui-or-misc";
  return "other";
}
export function validateUniformIntegerScale(original,hd,scale) {
  const errors=[];
  for(const k of ["width","height"]){
    if(!Number.isInteger(original?.[k])||original[k]<=0) errors.push("original "+k+" must be a positive integer");
    if(!Number.isInteger(hd?.[k])||hd[k]<=0) errors.push("hd "+k+" must be a positive integer");
  }
  if(!Number.isInteger(scale)||scale<2||scale>8) errors.push("scale must be an integer from 2 through 8");
  if(errors.length) return {ok:false,errors};
  const sx=hd.width/original.width, sy=hd.height/original.height;
  if(sx!==sy) errors.push("HD dimensions must use the same scale on both axes");
  if(!Number.isInteger(sx)) errors.push("HD scale must be an integer");
  if(sx!==scale||sy!==scale) errors.push("declared scale does not match image dimensions");
  return {ok:errors.length===0,errors,scaleX:sx,scaleY:sy};
}
export function replacementPolicyFor(p) {
  const kind=classifyContractPath(p);
  return {kind,requiresOriginalFallback:true,requiresUniformIntegerScale:true,requiresLogicalSizePreservation:true,requiresScaledRectMapping:kind==="world-atlas",activationAllowedBeforeOverrideLayer:false};
}
