local addonName, MG = ...
MG.TravelPlanner=MG.TravelPlanner or {}; local P=MG.TravelPlanner
P.taxiNodes=P.taxiNodes or {}; local WALK=6.3
local function cd(id) if not GetItemCooldown then return false,nil end local ok,s,d,e=pcall(GetItemCooldown,id); if not ok then return false,nil end s,d=tonumber(s) or 0,tonumber(d) or 0; local rem=math.max(0,(s+d)-(GetTime and GetTime() or 0)); return (e==nil or e~=0) and rem<=0,rem end
function P:CaptureTaxiNodes()
  if not NumTaxiNodes or not TaxiNodeName then return end local ok,n=pcall(NumTaxiNodes); if not ok or not tonumber(n) then return end self.taxiNodes={}
  for i=1,n do local typ=TaxiNodeGetType and TaxiNodeGetType(i); local x,y;if TaxiNodePosition then x,y=TaxiNodePosition(i) end self.taxiNodes[#self.taxiNodes+1]={index=i,name=TaxiNodeName(i),type=typ,x=x,y=y,reachable=typ=="REACHABLE" or typ=="CURRENT"} end
  if MG.db then MG.db.runtime=MG.db.runtime or {}; MG.db.runtime.travelTaxiNodes=self.taxiNodes end
end
local function act(kinds) for _,a in ipairs(MG.actionPlan or {}) do if kinds[a.kind] then return a end end end
function P:GetCapabilities() local ready,rem=cd(6948); return {bindLocation=GetBindLocation and GetBindLocation(),hearthstoneReady=ready,hearthstoneRemaining=rem,flightPaths=#self.taxiNodes,settings={flight=MG.db and MG.db.settings.travelUseFlightPaths,hearth=MG.db and MG.db.settings.travelUseHearthstone,transports=MG.db and MG.db.settings.travelUseTransports,classTeleports=MG.db and MG.db.settings.travelUseClassTeleports}} end
function P:Plan(target,step)
  local m=MG.navigation and tonumber(MG.navigation.distanceMeters); local set=MG.db and MG.db.settings or {}; local plan={{kind="walk",label="Direkt laufen",estimatedSeconds=m and m/WALK or nil,target=target}}
  local f=act({fly=true,fp=true}); if f and set.travelUseFlightPaths~=false then plan[#plan+1]={kind="flight",label=f.text,estimatedSeconds=m and m/(WALK*4)+25 or nil,source="RestedXP"} end
  local h=act({hs=true,home=true}); if h and set.travelUseHearthstone~=false then local r,rem=cd(6948);plan[#plan+1]={kind="hearthstone",label=h.text,available=r,cooldownSeconds=rem,estimatedSeconds=r and 12 or nil,source="RestedXP"} end
  local tr=act({zoneskip=true,subzoneskip=true,deathskip=true}); if tr and set.travelUseTransports~=false then plan[#plan+1]={kind=tr.kind,label=tr.text,estimatedSeconds=45,source="RestedXP"} end
  local best=plan[1]; if set.travelPreferFastest~=false then for _,c in ipairs(plan) do if c.available~=false and c.estimatedSeconds and (not best.estimatedSeconds or c.estimatedSeconds<best.estimatedSeconds) then best=c end end end
  local r={best=best,alternatives=plan,capabilities=self:GetCapabilities(),questID=step and step.questID}; MG.travelPlan=r; if MG.db then MG.db.runtime=MG.db.runtime or {}; MG.db.runtime.travelPlan=r end; return r
end
function P:GetPrimaryHint() local p=MG.travelPlan and MG.travelPlan.best;if not p then return nil end local t=p.label;if p.estimatedSeconds and MG.db and MG.db.settings.travelShowEstimatedTime then t=t.." • ~"..math.max(1,math.floor(p.estimatedSeconds/60+0.5)).." min" end return t end
