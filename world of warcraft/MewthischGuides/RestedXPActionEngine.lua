local addonName, MG = ...
MG.RestEDXPActionEngine=MG.RestEDXPActionEngine or {}; local E=MG.RestEDXPActionEngine
local QUEST={accept=true,turnin=true,complete=true}
local TRAVEL={goto=true,waypoint=true,fly=true,fp=true,hs=true,home=true,bindlocation=true,deathskip=true,zoneskip=true,subzoneskip=true}
local TRAIN={train=true,trainer=true,skill=true,cast=true,usespell=true,engrave=true}
local ECON={vendor=true,bankdeposit=true,bankwithdraw=true,money=true}
local GATE={xp=true,skill=true,reputation=true,maxlevel=true,itemcount=true,isOnQuest=true,isNotOnQuest=true,isQuestComplete=true,isQuestNotComplete=true,isQuestTurnedIn=true,isQuestAvailable=true}
local function split(a) local l,r=tostring(a or ""):match("^(.-)%s+<<%s*(.-)%s*$"); return l or tostring(a or ""),r end
local function cat(k) if TRAVEL[k] then return "travel" elseif TRAIN[k] then return "trainer" elseif ECON[k] then return "economy" elseif GATE[k] then return "gate" elseif k=="timer" then return "timer" elseif k=="equip" or k=="use" or k=="collect" or k=="destroy" then return "item" elseif k=="gossipoption" or k=="skipgossip" or k=="skipgossipid" or k=="emote" or k=="macro" then return "interaction" end return "other" end
local function occ(step) return step and step.definition and MG.RestEDXPImport and MG.RestEDXPImport:GetProgressOccurrence(step.definition,step.phase,MG:GetPlayerProfile(),step.goal and step.goal.index) or nil end
local function applies(rs,a,p)
  if not MG.RestEDXPImport then return true end
  if rs.selector and rs.selector~="" and not MG.RestEDXPImport:SelectorMatches(rs.selector,p) then return false end
  if rs.tags and not MG.RestEDXPImport:TagsMatch(rs.tags,p) then return false end
  local _,sel=split(a.args); if sel and sel~="" and not MG.RestEDXPImport:SelectorMatches(sel,p) then return false end
  return true
end
function E:BuildPlan(step)
  local o=occ(step); if not o or not MG.RestEDXPImport then return {} end
  local rg=MG.RestEDXPImport:ParseRaw()[tonumber(o.rawGuideIndex or 0)]; if not rg then return {} end
  local p=MG:GetPlayerProfile(); local first=math.max(1,tonumber(o.leadFromStep) or tonumber(o.sourceStep) or 1); local last=math.max(first,tonumber(o.sourceStep) or first); local plan={}
  for si=first,last do local rs=rg.steps and rg.steps[si]; if rs then for ai,a in ipairs(rs.actions or {}) do local k=tostring(a.kind or "")
    if not QUEST[k] and applies(rs,a,p) then local args=split(a.args); local fmt=MG.RestEDXPActionCatalog and MG.RestEDXPActionCatalog:Format(k,args); local def=MG.RestEDXPActionCatalog and MG.RestEDXPActionCatalog:Get(k)
      if fmt or (def and def.visible) then plan[#plan+1]={kind=k,args=args,text=fmt or tostring(def and def.label or k),category=cat(k),sourceStep=si,sourceAction=ai,
        safeAutomatic=k=="goto" or k=="waypoint" or k=="fly" or k=="fp" or k=="home" or k=="hs"} end end end end end
  return plan
end
function E:Refresh(step)
  local p=self:BuildPlan(step); MG.actionPlan=p
  if MG.db then MG.db.runtime=MG.db.runtime or {}; MG.db.runtime.actions={questID=step and step.questID,phase=step and step.phase,count=#p,actions=p} end
  return p
end
local function byCat(c) local o={} for _,a in ipairs(MG.actionPlan or {}) do if a.category==c then o[#o+1]=a end end return o end
function E:GetTravelActions() return byCat("travel") end
function E:GetTrainerActions() return byCat("trainer") end
function E:GetEconomyActions() return byCat("economy") end
function E:GetGateActions() return byCat("gate") end
