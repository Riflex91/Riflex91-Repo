local addonName, MG = ...

MG.GuideRegistry = MG.GuideRegistry or {}
local R = MG.GuideRegistry
R.sourceCommit = "a688a75d595f5884dba8044a5ba4e7d7bd859c09"
R.specs, R.byKey = R.specs or {}, R.byKey or {}
R.categories = R.categories or {
  horde={id="horde",label="Horde",order=10},
  ally={id="ally",label="Alliance",order=20},
  mage={id="mage",label="Mage AoE Farm",order=30,class="MAGE"},
}
local function key(file,title) return tostring(file or "").."\031"..tostring(title or "") end
local function clone(t)
  local o={}
  for k,v in pairs(t or {}) do
    if type(v)=="table" then local n={} for nk,nv in pairs(v) do n[nk]=nv end o[k]=n else o[k]=v end
  end
  return o
end
local function description(title)
  local z=tostring(title or ""):gsub("^%d+%-%d+%s+",""):gsub("%s+Mage AoE$","")
  if z=="" then z="Forever" end
  return title and title:find("AoE") and ("Optimierte Magier-AoE-Levelroute durch "..z..".") or ("Levelroute durch "..z..".")
end
function R:RegisterCategory(def) if not def or not def.id then return false end self.categories[def.id]=clone(def) return true end
function R:RegisterRoute(spec)
  if type(spec)~="table" or not spec.sourceFile or not spec.title then return false,"invalid_spec" end
  local k=key(spec.sourceFile,spec.title); if self.byKey[k] then return false,"duplicate_spec" end
  local n=clone(spec); n.categories=n.categories or {}; n.description=n.description or description(n.title); n.provider=n.provider or "RestedXP Forever"; n.routeKey=k
  self.specs[#self.specs+1]=n; self.byKey[k]=n; return true,n
end
function R:GetSpecs() return self.specs end
function R:GetCategory(id) return self.categories[id] end
function R:GetCategories()
  local x={} for _,c in pairs(self.categories) do x[#x+1]=c end
  table.sort(x,function(a,b) return (a.order or 999)<(b.order or 999) end); return x
end
function R:GetSpec(file,title) return self.byKey[key(file,title)] end
function R:GetSpecForGuide(g) return g and self:GetSpec(g.sourceFile,g.title) or nil end
function R:HasCategory(g,id)
  local s=self:GetSpecForGuide(g); for _,v in ipairs(s and s.categories or {}) do if v==id then return true end end return false
end
function R:GetCard(g)
  local s=self:GetSpecForGuide(g) or {}
  return {id=g and g.id,title=g and (g.title or g.id) or s.title,description=s.description or description(g and g.title),provider=s.provider or "RestedXP Forever",
    categories=s.categories or {},minLevel=g and tonumber(g.minLevel),maxLevel=g and tonumber(g.maxLevel),faction=g and g.faction,race=g and g.race,class=g and g.class,
    sourceFile=g and g.sourceFile or s.sourceFile,featured=s.featured and true or false}
end
function R:IsFavorite(id) return MG.db and MG.db.guideFavorites and MG.db.guideFavorites[tostring(id)]==true end
function R:SetFavorite(id,on) if not MG.db then return false end MG.db.guideFavorites=MG.db.guideFavorites or {}; MG.db.guideFavorites[tostring(id)]=on and true or nil return true end
function R:ToggleFavorite(id) local v=not self:IsFavorite(id); self:SetFavorite(id,v); return v end
function R:MatchesSearch(g,q)
  q=tostring(q or ""):lower():gsub("^%s+",""):gsub("%s+$",""); if q=="" then return true end
  local c=self:GetCard(g); return table.concat({c.title or "",c.description or "",c.provider or "",c.sourceFile or ""}," "):lower():find(q,1,true)~=nil
end
function R:RecommendedScore(g,p)
  p=p or {}; local s=0; local l=tonumber(p.level) or 1; local mn,mx=tonumber(g and g.minLevel),tonumber(g and g.maxLevel)
  if mn and mx and l>=mn and l<=mx then s=s+100 elseif mn then s=s-math.abs(l-mn)*3 end
  if g and g.faction==p.faction then s=s+30 end; if g and g.class==p.class then s=s+20 end; if g and g.race==p.race then s=s+10 end
  if self:IsFavorite(g and g.id) then s=s+5 end; return s
end
local function route(file,title,cats,extra) extra=extra or {}; extra.sourceFile=file; extra.title=title; extra.categories=cats; R:RegisterRoute(extra) end
route("Guides/Forever/RestedXP-Skyborne.lua","1-14 Zephras Isle",{"horde","ally"},{description="Fraktionsübergreifende Skyborne-Start- und Levelroute.",featured=true})
route("Guides/forever/Alliance-1-10_NightElf.lua","1-6 Shadowglen",{"ally"})
route("Guides/forever/Alliance-1-10_NightElf.lua","6-11 Teldrassil",{"ally"})
route("Guides/forever/Alliance-1-13_Human.lua","1-6 Northshire",{"ally"})
route("Guides/forever/Alliance-1-13_Human.lua","6-11 Elwynn Forest",{"ally"})
route("Guides/forever/Alliance-1-13_Human.lua","11-13 Loch Modan",{"ally"})
route("Guides/forever/Alliance-1-14_DwarfGnome.lua","1-6 Coldridge Valley",{"ally"})
route("Guides/forever/Alliance-1-14_DwarfGnome.lua","6-11 Dun Morogh",{"ally"})
route("Guides/forever/Alliance-1-14_DwarfGnome.lua","11-12 Voidwalker Quest",{"ally"})
route("Guides/forever/Alliance-1-14_DwarfGnome.lua","11-12 Elwynn (Dwarf/Gnome)",{"ally"})
route("Guides/forever/Alliance-1-14_DwarfGnome.lua","12-14 Loch Modan (Dwarf/Gnome)",{"ally"})
route("Guides/forever/Alliance-1-14_DwarfGnome.lua","6-11 Dun Morogh (Hunter)",{"ally"})
route("Guides/forever/Alliance-1-14_DwarfGnome.lua","11-13 Loch Modan (Hunter)",{"ally"})
route("Guides/forever/Alliance-11-20.lua","13-15 Westfall",{"ally"})
route("Guides/forever/Alliance-11-20.lua","14-16 Darkshore",{"ally"})
route("Guides/forever/Alliance-11-20.lua","16-19 Darkshore",{"ally"})
route("Guides/forever/Alliance-11-20.lua","19-20 Redridge",{"ally"})
route("Guides/forever/Alliance-11-20.lua","19-21 Darkshore/Ashenvale",{"ally"})
route("Guides/forever/Alliance-11-20.lua","20-21 Darkshore/Ashenvale",{"ally"})
route("Guides/forever/Horde-01-12_Durotar.lua","1-6 Durotar",{"horde"})
route("Guides/forever/Horde-01-12_Durotar.lua","6-10 Durotar",{"horde"})
route("Guides/forever/Horde-01-12_Durotar.lua","10-12 Durotar",{"horde"})
route("Guides/forever/Horde-01-12_Durotar.lua","10-12 Tirisfal",{"horde"})
route("Guides/forever/Horde-01-12_Durotar.lua","1-7 Durotar",{"horde"})
route("Guides/forever/Horde-01-12_Durotar.lua","7-13 Durotar",{"horde"})
route("Guides/forever/Horde-01-14_Undead.lua","1-6 Tirisfal Glades",{"horde"})
route("Guides/forever/Horde-01-14_Undead.lua","6-11 Tirisfal Glades",{"horde"})
route("Guides/forever/Horde-01-14_Undead.lua","12-14 Silverpine Forest",{"horde"})
route("Guides/forever/Horde-1-12_Mulgore.lua","1-6 Mulgore",{"horde"},{description="Der klassische Start für Tauren in Mulgore.",featured=true})
route("Guides/forever/Horde-1-12_Mulgore.lua","6-12 Mulgore",{"horde"})
route("Guides/forever/Horde-1-12_Mulgore.lua","1-7 Mulgore",{"horde"})
route("Guides/forever/Horde-1-12_Mulgore.lua","7-13 Mulgore",{"horde"})
route("Guides/forever/Horde-12-22_Barrens.lua","12-17 The Barrens",{"horde"})
route("Guides/forever/Horde-12-22_Barrens.lua","17-22 Stonetalon/Barrens/Ashenvale",{"horde"})
route("Guides/forever/Horde-12-22_Barrens.lua","13-20 The Barrens",{"horde"})
route("Guides/forever/Horde-12-22_Barrens.lua","20-24 Stonetalon/Barrens",{"horde"})
route("Guides/forever/Alliance-Mage-1-12.lua","1-10 Elwynn Forest Mage AoE",{"mage"})
route("Guides/forever/Alliance-Mage-1-12.lua","1-10 Dun Morogh Mage AoE",{"mage"})
route("Guides/forever/Alliance-Mage-1-12.lua","10-12 Loch Modan Mage AoE",{"mage"})
route("Guides/forever/Alliance-Mage-12-21.lua","12-18 Darkshore Mage AoE",{"mage"})
route("Guides/forever/Alliance-Mage-12-21.lua","18-21 Redridge Mage AoE",{"mage"})
route("Guides/forever/Horde-Mage-12-21.lua","12-17 The Barrens AoE",{"mage"})
route("Guides/forever/Horde-Mage-12-21.lua","17-21 Stonetalon/Barrens AoE",{"mage"})
