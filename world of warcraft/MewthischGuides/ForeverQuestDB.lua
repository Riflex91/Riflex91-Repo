local addonName, MG = ...
MG.ForeverQuestDB=MG.ForeverQuestDB or {}; local D=MG.ForeverQuestDB
D.index=D.index or {}; D.guides=D.guides or {}
local function cp(p) if type(p)~="table" then return nil end return {mapID=tonumber(p.mapID),floor=tonumber(p.floor),x=tonumber(p.x),y=tonumber(p.y),worldX=tonumber(p.worldX),worldY=tonumber(p.worldY),radius=tonumber(p.radius),source="ForeverQuestDB",verification=p.verification or "RESTEDXP_PUBLIC",phaseMatch=true} end
local function valid(p) return p and tonumber(p.mapID) and ((tonumber(p.x) and tonumber(p.y)) or (tonumber(p.worldX) and tonumber(p.worldY))) end
function D:Rebuild(guides)
  self.index={}; self.guides=guides or {}; local points=0
  for _,g in ipairs(guides or {}) do for _,def in ipairs(g.steps or {}) do local q=tonumber(def.questID); if q then self.index[q]=self.index[q] or {}
    for _,o in ipairs(def.rxpOccurrences or {}) do if valid(o.coordinate) then local ph=tostring(o.phase or "any"); self.index[q][ph]=self.index[q][ph] or {}; self.index[q][ph][#self.index[q][ph]+1]={coordinate=cp(o.coordinate),occurrence=o,guideID=g.id,sourceFile=g.sourceFile}; points=points+1 end end end end end
  self.stats={quests=0,points=points}; for _ in pairs(self.index) do self.stats.quests=self.stats.quests+1 end; return self.stats
end
local function match(e,p) return not (e and e.occurrence) or not (MG.RestEDXPImport and MG.RestEDXPImport.OccurrenceMatches) or MG.RestEDXPImport:OccurrenceMatches(e.occurrence,p) end
function D:Resolve(q,ph,p,player)
  q=tonumber(q); if not q then return nil end; p=p or MG:GetPlayerProfile(); player=player or (MG.ForeverAPI and MG.ForeverAPI:GetPlayerPosition())
  local b=self.index[q]; if not b then return self:GetLearned(q,ph) end; local c={}
  local function add(l) for _,e in ipairs(l or {}) do if match(e,p) then c[#c+1]=e end end end
  add(b[ph]); if #c==0 and ph=="objectives" then add(b.complete) end; if #c==0 then for _,l in pairs(b) do add(l) end end
  local best,rank=nil,nil
  for _,e in ipairs(c) do local pt=e.coordinate; local dist=MG.RouteEngine and MG.RouteEngine:EstimateDistanceToTarget(pt,player); local same=player and tonumber(player.mapID)==tonumber(pt.mapID); local r=(same and 0 or 100000000)+(dist or 99999999); if not rank or r<rank then best=e;rank=r end end
  if best then local pnt=cp(best.coordinate); pnt.questDBGuideID=best.guideID;pnt.questDBSourceFile=best.sourceFile; return pnt end
  return self:GetLearned(q,ph)
end
function D:Learn(q,ph,t) if not MG.db or not valid(t) then return false end MG.db.runtime=MG.db.runtime or {}; MG.db.runtime.learnedQuestCoordinates=MG.db.runtime.learnedQuestCoordinates or {}; local k=tostring(q)..":"..tostring(ph or "any"); MG.db.runtime.learnedQuestCoordinates[k]=cp(t); MG.db.runtime.learnedQuestCoordinates[k].verification="RUNTIME_LEARNED"; return true end
function D:GetLearned(q,ph) local s=MG.db and MG.db.runtime and MG.db.runtime.learnedQuestCoordinates; local v=s and s[tostring(q)..":"..tostring(ph or "any")]; return v and cp(v) or nil end
function D:GetStats() return self.stats or {quests=0,points=0} end
function D:Search(query)
  query=tostring(query or ""):lower(); local o={}; if query=="" then return o end
  for _,g in ipairs(self.guides or {}) do for _,d in ipairs(g.steps or {}) do if tostring(d.title or ""):lower():find(query,1,true) then o[#o+1]={questID=d.questID,title=d.title,guideID=g.id,sourceFile=g.sourceFile}; if #o>=50 then return o end end end end
  return o
end
