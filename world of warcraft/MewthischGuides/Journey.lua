local addonName, MG = ...
MG.Journey=MG.Journey or {}; local J=MG.Journey
local function store() if not MG.db then return nil end MG.db.journey=MG.db.journey or {}; return MG.db.journey end
local function zoneName()
  if GetRealZoneText then local z=GetRealZoneText(); if z and z~="" then return z end end
  if GetZoneText then local z=GetZoneText(); if z and z~="" then return z end end
  return nil
end
function J:Record(event,questID,title,extra)
  local s=store(); if not s then return end
  extra=type(extra)=="table" and extra or {}
  local pos=MG.GetPosition and MG:GetPosition() or nil
  local e={at=time and time() or 0,event=event,questID=tonumber(questID),title=title,level=tonumber(extra.level) or (UnitLevel and UnitLevel("player") or nil),mapID=pos and pos.mapID or nil,zone=zoneName()}
  s[#s+1]=e; while #s>500 do table.remove(s,1) end
  if MG.db then MG.db.runtime=MG.db.runtime or {}; MG.db.runtime.journey={entries=#s,last=e} end
end
function J:GetEntries(limit) local s=store() or {}; local out={}; local first=math.max(1,#s-(tonumber(limit) or #s)+1); for i=first,#s do out[#out+1]=s[i] end return out end
function J:GetSummary()
  local s=store() or {}; local a,t,l=0,0,0
  for _,e in ipairs(s) do if e.event=="accepted" then a=a+1 elseif e.event=="turned_in" then t=t+1 elseif e.event=="level" then l=l+1 end end
  return {entries=#s,accepted=a,turnedIn=t,levelUps=l,lastLevel=s[#s] and s[#s].level or nil}
end
