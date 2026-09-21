local addonName, MG = ...
MG.SupportedRoutes = MG.SupportedRoutes or {}
local R=MG.SupportedRoutes
local function key(f,t) return tostring(f or "").."\031"..tostring(t or "") end
local function has(s,c) for _,v in ipairs(s and s.categories or {}) do if v==c then return true end end return false end
function R:Validate(guides,sourceCommit)
  self.sourceCommit=MG.GuideRegistry and MG.GuideRegistry.sourceCommit or nil
  self.specs=MG.GuideRegistry and MG.GuideRegistry:GetSpecs() or {}
  local by={}; for _,g in ipairs(guides or {}) do local k=key(g.sourceFile,g.title); by[k]=by[k] or {}; by[k][#by[k]+1]=g end
  self.guideToSpec={}; self.available={horde={},ally={},mage={}}; local missing,dupes={},{}
  for _,s in ipairs(self.specs) do
    local m=by[key(s.sourceFile,s.title)] or {}
    if #m==1 then local g=m[1]; self.guideToSpec[g.id]=s; for _,c in ipairs(s.categories or {}) do self.available[c]=self.available[c] or {}; self.available[c][#self.available[c]+1]=g end
    elseif #m==0 then missing[#missing+1]={sourceFile=s.sourceFile,title=s.title} else dupes[#dupes+1]={sourceFile=s.sourceFile,title=s.title,count=#m} end
  end
  local function sort(a,b) local am,bm=tonumber(a.minLevel) or 999,tonumber(b.minLevel) or 999; if am~=bm then return am<bm end; return tostring(a.title or "")<tostring(b.title or "") end
  for _,list in pairs(self.available) do table.sort(list,sort) end
  local ok=tostring(sourceCommit or "")==tostring(self.sourceCommit or "")
  self.status={ready=ok and #missing==0 and #dupes==0,expectedSourceCommit=self.sourceCommit,actualSourceCommit=sourceCommit,commitMatch=ok,
    requiredRoutes=#self.specs,resolvedRoutes=#self.specs-#missing-#dupes,missing=missing,duplicates=dupes}
  return self.status
end
function R:GetStatus() return self.status or {ready=false,expectedSourceCommit=self.sourceCommit,requiredRoutes=0,resolvedRoutes=0,missing={},duplicates={}} end
function R:IsSupportedGuide(g) return g and self.guideToSpec and self.guideToSpec[g.id]~=nil end
function R:GetGuides(c) return self.available and self.available[c] or {} end
function R:GetSpec(g) return g and self.guideToSpec and self.guideToSpec[g.id] or nil end
function R:HasCategory(g,c) return has(self:GetSpec(g),c) end
