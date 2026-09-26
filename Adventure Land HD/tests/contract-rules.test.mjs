import test from "node:test";
import assert from "node:assert/strict";
import {normalizeAssetPath,spriteRuntimeGrid,validateUniformIntegerScale,hasResolutionSuffix,replacementPolicyFor} from "../lib/hd-contracts.mjs";

test("cache-busted paths normalize",()=>assert.equal(normalizeAssetPath("/images/tiles/map/water.png?v=14"),"images/tiles/map/water.png"));
test("character runtime grid mirrors original slicing",()=>assert.deepEqual(spriteRuntimeGrid({type:"character",rows:2,columns:4}),{rows:2,columns:4,rowFrames:4,columnFrames:3,totalRows:8,totalColumns:12}));
test("animated hat keeps animation columns",()=>assert.equal(spriteRuntimeGrid({type:"a_hat",rows:1,columns:1,frames:6}).totalColumns,6));
test("4x uniform HD geometry passes",()=>assert.equal(validateUniformIntegerScale({width:100,height:80},{width:400,height:320},4).ok,true));
test("nonuniform and fractional whole-image scale fail",()=>{assert.equal(validateUniformIntegerScale({width:100,height:80},{width:400,height:240},4).ok,false);assert.equal(validateUniformIntegerScale({width:100,height:80},{width:250,height:200},2).ok,false);});
test("@Nx suffix must match declared scale",()=>{assert.equal(hasResolutionSuffix("characters/hero@4x.png",4),true);assert.equal(hasResolutionSuffix("characters/hero@2x.png",4),false);});
test("world atlas uses native resolution bridge, not manual rectangle multiplication",()=>{const p=replacementPolicyFor("images/tiles/map/water_updated.png");assert.equal(p.requiresResolutionAwareTexture,true);assert.equal(p.manualRectScalingRequired,false);});
