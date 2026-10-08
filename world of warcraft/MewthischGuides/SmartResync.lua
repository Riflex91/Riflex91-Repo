local addonName, MG = ...
MG.SmartResync=MG.SmartResync or {}; local R=MG.SmartResync
local function p(s) if not s then return 0 end if s.phase=="turnin" then return 5 elseif s.phase=="objectives" then return 4 elseif s.phase=="live" then return 3 elseif s.phase=="accept" then return 2 end return 0 end
function R:Choose(steps,idx,reason)
  if not MG.db or not MG.db.settings.smartResync then return idx or 1,reason or "default" end
  local bi,bs=nil,nil
  for i,s in ipairs(steps or {}) do local pr=p(s); if pr>=3 then local sc=pr*1000000+(tonumber(s.routeOrder) or 0); if not bs or sc>bs then bs=sc;bi=i end end end
  if bi then return bi,"smart_active_progress" end
  local safe=tonumber(idx) or 1; if safe<1 then safe=1 end; if safe>#(steps or {}) then safe=#(steps or {}) end
  if MG.db.settings.skipObsoleteSteps then while safe<#(steps or {}) and steps[safe] and steps[safe].complete do safe=safe+1 end end
  return safe,reason or "smart_safe_resume"
end
function R:Describe() return {enabled=MG.db and MG.db.settings.smartResync and true or false,safeMode=true,levelGuessing=false,strategy="quest-history-and-active-progress"} end
