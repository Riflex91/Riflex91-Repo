local addonName, MG = ...

local LegacyInitializeUI=MG.InitializeUI
local LegacyRefreshTheme=MG.RefreshTheme
local LegacyRefreshInfo=MG.RefreshInfo

MG.UI2=MG.UI2 or {}
local U=MG.UI2
local MAIN_W,MAIN_H=390,230
local SETTINGS_W,SETTINGS_H=720,560
local BROWSER_W,BROWSER_H=600,520
local PAGE_SIZE=6

U.frames,U.labels,U.buttons,U.checks=U.frames or {},U.labels or {},U.buttons or {},U.checks or {}
U.settingRows,U.browserRows=U.settingRows or {},U.browserRows or {}
U.settingsCategory=U.settingsCategory or "general"
U.browserTab=U.browserTab or "recommended"
U.browserSearch=U.browserSearch or ""
U.browserClass=U.browserClass or "ALL"
U.browserCategory=U.browserCategory or "all"
U.browserPage=U.browserPage or 1

local function L(k,...) return MG.L and MG:L(k,...) or tostring(k) end
local function show(f,on) if not f then return end if on then f:Show() else f:Hide() end end
local function color(t,fallback) t=type(t)=="table" and t or fallback or {1,1,1,1}; return t[1] or 1,t[2] or 1,t[3] or 1,t[4] or 1 end
local function theme()
  return MG.Themes and MG.Themes.GetCurrent and MG.Themes:GetCurrent() or {
    background={0.02,0.03,0.04,0.98},panel={0.04,0.055,0.07,0.98},header={0.02,0.03,0.04,1},
    border={0.30,0.23,0.08,1},accent={0.95,0.72,0.08,1},text={0.94,0.94,0.94,1},
    muted={0.60,0.64,0.68,1},active={0.09,0.17,0.22,1},danger={0.45,0.06,0.04,1}
  }
end
local function setTex(tex,c) if tex and tex.SetColorTexture then tex:SetColorTexture(color(c)) end end
local function makeBorders(f)
  if f._mg2Borders then return end; f._mg2Borders={}
  for _,n in ipairs({"top","bottom","left","right"}) do f._mg2Borders[n]=f:CreateTexture(nil,"BORDER") end
  local b=f._mg2Borders;b.top:SetPoint("TOPLEFT");b.top:SetPoint("TOPRIGHT");b.top:SetHeight(1)
  b.bottom:SetPoint("BOTTOMLEFT");b.bottom:SetPoint("BOTTOMRIGHT");b.bottom:SetHeight(1)
  b.left:SetPoint("TOPLEFT");b.left:SetPoint("BOTTOMLEFT");b.left:SetWidth(1)
  b.right:SetPoint("TOPRIGHT");b.right:SetPoint("BOTTOMRIGHT");b.right:SetWidth(1)
end
local function decorate(f,kind)
  f._mg2Kind=kind or "panel";f._mg2Background=f:CreateTexture(nil,"BACKGROUND");f._mg2Background:SetAllPoints();makeBorders(f);U.frames[#U.frames+1]=f;return f
end
local function panel(parent,w,h,kind) local f=CreateFrame("Frame",nil,parent);if w then f:SetWidth(w) end;if h then f:SetHeight(h) end;return decorate(f,kind) end
local function label(parent,size,role)
  local fs=parent:CreateFontString(nil,"OVERLAY","GameFontNormal");local font,_,flags=fs:GetFont();if font then fs:SetFont(font,size or 11,flags) end
  fs:SetJustifyH("LEFT");fs:SetWordWrap(true);fs._mg2Role=role or "text";U.labels[#U.labels+1]=fs;return fs
end
local function button(parent,text,w,h,cb)
  local b=CreateFrame("Button",nil,parent);b:SetSize(w or 80,h or 22);b._mg2Background=b:CreateTexture(nil,"BACKGROUND");b._mg2Background:SetAllPoints();makeBorders(b)
  b._mg2Label=label(b,10,"button");b._mg2Label:SetPoint("CENTER");b._mg2Label:SetJustifyH("CENTER");b._mg2Label:SetText(text or "")
  function b:SetText(v) self._mg2Label:SetText(v or "") end
  b:SetScript("OnClick",cb);b:SetScript("OnEnter",function(self) self._mg2Hover=true;MG:RefreshTheme() end);b:SetScript("OnLeave",function(self) self._mg2Hover=false;MG:RefreshTheme() end)
  U.buttons[#U.buttons+1]=b;return b
end
local function enabled(b,on) if b then b:SetEnabled(on and true or false);b:SetAlpha(on and 1 or 0.4) end end
local function edit(parent,w,h)
  local e=CreateFrame("EditBox",nil,parent);e:SetSize(w,h or 24);e:SetAutoFocus(false);e:SetFontObject(GameFontHighlightSmall);e:SetTextInsets(8,8,0,0);decorate(e,"panel");return e
end
local function check(parent,key,text,x,y)
  local b=CreateFrame("Button",nil,parent);b:SetSize(22,22);b:SetPoint("TOPLEFT",x,y);b._mg2Background=b:CreateTexture(nil,"BACKGROUND");b._mg2Background:SetAllPoints();makeBorders(b)
  b._mg2Mark=b:CreateTexture(nil,"ARTWORK");b._mg2Mark:SetTexture("Interface\\Buttons\\UI-CheckBox-Check");b._mg2Mark:SetPoint("TOPLEFT",2,-2);b._mg2Mark:SetPoint("BOTTOMRIGHT",-2,2)
  local t=label(parent,11,"text");t:SetPoint("LEFT",b,"RIGHT",8,0);t:SetPoint("RIGHT",parent,-10,0);t:SetWordWrap(false);t:SetText(text or "")
  b._mg2SettingKey=key;b._mg2Text=t
  function b:SetChecked(v) self._mg2Checked=v and true or false;show(self._mg2Mark,self._mg2Checked) end
  function b:GetChecked() return self._mg2Checked and true or false end
  b:SetScript("OnClick",function(self) self:SetChecked(not self:GetChecked());MG.db.settings[key]=self:GetChecked();MG:RefreshSettings();MG:RefreshGuide("settings_"..key) end)
  U.checks[#U.checks+1]=b;return b,t
end
local function styleFrame(f,t)
  local bg=t.panel;if f._mg2Kind=="background" then bg=t.background elseif f._mg2Kind=="header" then bg=t.header elseif f._mg2Kind=="active" then bg=t.active elseif f._mg2Kind=="danger" then bg=t.danger end
  setTex(f._mg2Background,bg);if f._mg2Borders then for _,b in pairs(f._mg2Borders) do setTex(b,t.border) end end
end
local function styleButton(b,t)
  local bg=b._mg2Danger and t.danger or (b._mg2Selected and t.active or t.panel);if b._mg2Hover then bg={t.accent[1]*0.28,t.accent[2]*0.28,t.accent[3]*0.28,1} end
  setTex(b._mg2Background,bg);if b._mg2Borders then for _,x in pairs(b._mg2Borders) do setTex(x,b._mg2Selected and t.accent or t.border) end end
end
local function styleLabel(f,t)
  local c=t.text;if f._mg2Role=="muted" then c=t.muted elseif f._mg2Role=="accent" then c=t.accent elseif f._mg2Role=="danger" then c=t.danger end;f:SetTextColor(color(c))
end
local function hideLegacy()
  for _,n in ipairs({"MewthischGuidesMainFrame","MewthischGuidesSettingsFrame","MewthischGuidesGuideSelectFrame"}) do local f=_G[n];if f then f:Hide() end end
end
local function saveMain(f)
  local x,y=f:GetCenter();local ux,uy=UIParent:GetCenter();if x and y and ux and uy then MG.db.settings.viewerX=math.floor(x-ux+0.5);MG.db.settings.viewerY=math.floor(y-uy+0.5) end
end
local function stepIcon(step)
  local k=step and ((step.goal and step.goal.type) or step.phase)
  if k=="collect" or k=="collect_currency" then return "Interface\\Icons\\INV_Misc_Bag_08"
  elseif k=="kill" or k=="kill_player" then return "Interface\\Icons\\Ability_DualWield"
  elseif k=="turnin" then return "Interface\\GossipFrame\\ActiveQuestIcon"
  elseif k=="accept" then return "Interface\\GossipFrame\\AvailableQuestIcon"
  elseif k=="interact" then return "Interface\\Icons\\INV_Misc_Gear_01" end
  return "Interface\\Icons\\INV_Misc_Map_01"
end
local function actionGlyph(step)
  local tex=stepIcon(step)
  return "|T"..tex..":18:18:0:0|t "
end
local function instructionContext(step)
  if not step or not step.definition or not MG.RestEDXPImport or
     not MG.RestEDXPImport.GetInstructionContext then return {} end
  return MG.RestEDXPImport:GetInstructionContext(
    step.definition,step.phase,MG:GetPlayerProfile(),
    step.goal and step.goal.index or nil) or {}
end
local function instruction(step)
  if not step then return L("target_missing") end
  local ctx=instructionContext(step);local title=tostring(step.title or "")
  local goal=step.goal or {};local typ=tostring(goal.type or step.phase or "")
  local text
  if step.phase=="accept" then
    text=ctx.questGiver and L("accept_quest_at",title,ctx.questGiver) or L("accept_quest",title)
  elseif step.phase=="turnin" then
    text=ctx.questGiver and L("turnin_quest_at",title,ctx.questGiver) or L("turnin_quest",title)
  elseif typ=="kill" or typ=="kill_player" then
    text=goal.required and L("kill_count",goal.required,goal.name or "") or L("kill_target",goal.name or "")
  elseif typ=="collect" or typ=="collect_currency" then
    if goal.required and ctx.source then text=L("collect_count_from",goal.required,goal.name or "",ctx.source)
    elseif goal.required then text=L("collect_count",goal.required,goal.name or "")
    elseif ctx.source then text=L("collect_from",goal.name or "",ctx.source)
    else text=L("collect_target",goal.name or "") end
  elseif typ=="interact" then text=L("interact_with",goal.name or "")
  elseif typ=="progress" then text=L("continue_quest",title)
  else text=L("continue_quest",title) end
  return actionGlyph(step)..text
end
local function details(step)
  local out={};local ctx=instructionContext(step)
  if ctx.questGiver then out[#out+1]=L("quest_giver")..": "..ctx.questGiver end
  if ctx.source and ctx.source~=ctx.questGiver then out[#out+1]=L("source")..": "..ctx.source end
  if ctx.location then out[#out+1]=L("location")..": "..ctx.location end
  if #out==0 and step and step.title and step.title~="" then out[#out+1]=L("quest")..": "..step.title end
  while #out<3 do out[#out+1]="" end;return out
end

local function createMain()
  if U.main then return end
  local f=CreateFrame("Frame","MewthischGuidesMainFrameV2",UIParent);f:SetSize(MAIN_W,MAIN_H);f:SetPoint("CENTER",UIParent,"CENTER",MG.db.settings.viewerX or 260,MG.db.settings.viewerY or 80);f:SetFrameStrata("HIGH");f:SetClampedToScreen(true);f:SetMovable(true);f:EnableMouse(true);f:RegisterForDrag("LeftButton")
  f:SetScript("OnDragStart",function(self) self:StartMoving() end);f:SetScript("OnDragStop",function(self) self:StopMovingOrSizing();saveMain(self) end);decorate(f,"background");U.main=f
  local h=panel(f,nil,28,"header");h:SetPoint("TOPLEFT",1,-1);h:SetPoint("TOPRIGHT",-1,-1)
  U.mainTitle=label(h,13,"accent");U.mainTitle:SetPoint("LEFT",10,0);U.mainTitle:SetText("Mewthisch Guides")
  local set=button(h,"O",28,22,function() MG:ToggleSettings() end);set:SetPoint("RIGHT",-36,0);local close=button(h,"X",28,22,function() MG:HideWindow() end);close:SetPoint("RIGHT",-4,0)
  local g=panel(f,nil,38,"active");g:SetPoint("TOPLEFT",7,-34);g:SetPoint("TOPRIGHT",-7,-34);g:EnableMouse(true);g:SetScript("OnMouseUp",function() MG:ToggleGuideBrowser(true) end)
  U.guideIcon=g:CreateTexture(nil,"ARTWORK");U.guideIcon:SetSize(24,24);U.guideIcon:SetPoint("LEFT",8,0);U.guideIcon:SetTexture("Interface\\Icons\\INV_Misc_Map_01")
  U.guideTitle=label(g,13,"text");U.guideTitle:SetPoint("LEFT",U.guideIcon,"RIGHT",8,0);U.guideTitle:SetPoint("RIGHT",-78,0);U.guideTitle:SetWordWrap(false)
  local prev=button(g,"<",30,26,function() MG:SelectRelativeStep(-1,"ui2_prev") end);prev:SetPoint("RIGHT",-39,0);local nxt=button(g,">",30,26,function() MG:SelectRelativeStep(1,"ui2_next") end);nxt:SetPoint("RIGHT",-5,0)
  local body=panel(f,nil,144,"panel");body:SetPoint("TOPLEFT",7,-78);body:SetPoint("TOPRIGHT",-7,-78)
  U.stepCounter=label(body,14,"accent");U.stepCounter:SetPoint("TOPLEFT",10,-9)
  U.instruction=label(body,14,"text");U.instruction:SetPoint("TOPLEFT",10,-35);U.instruction:SetPoint("RIGHT",-72,0);U.instruction:SetHeight(44)
  U.bigStepIcon=body:CreateTexture(nil,"ARTWORK");U.bigStepIcon:SetSize(48,48);U.bigStepIcon:SetPoint("TOPRIGHT",-14,-29)
  U.stepProgress=label(body,10,"text");U.stepProgress:SetPoint("TOP",U.bigStepIcon,"BOTTOM",0,-2);U.stepProgress:SetJustifyH("CENTER")
  U.detailLines={}
  for i=1,3 do local bullet=label(body,10,i==1 and "accent" or "muted");bullet:SetPoint("TOPLEFT",14,-88-(i-1)*19);bullet:SetText(i==1 and ">" or "-");local tx=label(body,11,i==1 and "text" or "muted");tx:SetPoint("LEFT",bullet,"RIGHT",7,0);tx:SetPoint("RIGHT",-10,0);tx:SetWordWrap(false);U.detailLines[i]=tx end
  U.footer={}

end

local function guideIcon(g)
  if MG.GuideRegistry and MG.GuideRegistry:HasCategory(g,"mage") then return "Interface\\Icons\\Spell_Frost_FrostBolt02" end
  return g and g.faction=="Alliance" and "Interface\\Icons\\INV_BannerPVP_02" or "Interface\\Icons\\INV_BannerPVP_01"
end
local function browserGuides()
  local o={};local p=MG:GetPlayerProfile();local faction=U.browserFaction or p.faction;local cat=U.browserCategory or "all";local q=U.browserSearch or ""
  for _,g in ipairs(MG.DataLoader and MG.DataLoader.guides or {}) do
    if MG.SupportedRoutes and MG.SupportedRoutes:IsSupportedGuide(g) then
      local mageFaction=MG.SupportedRoutes:HasCategory(g,"mage") and g.faction==faction
      local fm=faction=="ALL" or (faction=="Horde" and MG.SupportedRoutes:HasCategory(g,"horde")) or (faction=="Alliance" and MG.SupportedRoutes:HasCategory(g,"ally")) or mageFaction
      local cm=cat=="all" or MG.SupportedRoutes:HasCategory(g,cat);local cl=U.browserClass=="ALL" or (U.browserClass=="MAGE" and MG.SupportedRoutes:HasCategory(g,"mage"))
      local sm=not MG.GuideRegistry or MG.GuideRegistry:MatchesSearch(g,q);local fav=MG.GuideRegistry and MG.GuideRegistry:IsFavorite(g.id)
      local tm=U.browserTab=="all" or U.browserTab=="recommended" or (U.browserTab=="favorites" and fav)
      if fm and cm and cl and sm and tm and MG.DataLoader:IsGuideSelectable(g,cat~="all" and cat or nil) then o[#o+1]=g end
    end
  end
  table.sort(o,function(a,b) if U.browserTab=="recommended" and MG.GuideRegistry then local sa,sb=MG.GuideRegistry:RecommendedScore(a,p),MG.GuideRegistry:RecommendedScore(b,p);if sa~=sb then return sa>sb end end local x,y=tonumber(a.minLevel) or 999,tonumber(b.minLevel) or 999;if x~=y then return x<y end return tostring(a.title or "")<tostring(b.title or "") end)
  return o
end
local function cycle(values,current)
  local idx=1;for i,v in ipairs(values) do if v==current then idx=i break end end;idx=idx+1;if idx>#values then idx=1 end;return values[idx]
end
local function createBrowser()
  if U.browser then return end
  local f=CreateFrame("Frame","MewthischGuidesGuideBrowserV2",UIParent);f:SetSize(BROWSER_W,BROWSER_H);f:SetPoint("CENTER");f:SetFrameStrata("FULLSCREEN_DIALOG");f:SetFrameLevel(200);if f.SetToplevel then f:SetToplevel(true) end;f:SetClampedToScreen(true);decorate(f,"background");U.browser=f;f:Hide()
  local h=panel(f,nil,30,"header");h:SetPoint("TOPLEFT",1,-1);h:SetPoint("TOPRIGHT",-1,-1);local title=label(h,13,"accent");title:SetPoint("LEFT",10,0);title:SetText("Mewthisch Guides")
  local close=button(h,"X",28,22,function() MG:ToggleGuideBrowser(false) end);close:SetPoint("RIGHT",-4,0)
  U.browserTabs={};local tabs={{"recommended","recommended"},{"all","all_guides"},{"favorites","favorites"}}
  for i,d in ipairs(tabs) do local tabID,tabKey=d[1],d[2];local b=button(f,L(tabKey),112,24,function() U.browserTab=tabID;U.browserPage=1;MG:RefreshGuideBrowser() end);b:SetPoint("TOPLEFT",12+(i-1)*118,-40);b._mg2TabID=tabID;b._mg2LabelKey=tabKey;U.browserTabs[#U.browserTabs+1]=b end
  U.search=edit(f,BROWSER_W-24,24);U.search:SetPoint("TOPLEFT",12,-72);U.search:SetScript("OnTextChanged",function(self,user) if user then U.browserSearch=self:GetText() or "";U.browserPage=1;MG:RefreshGuideBrowser() end end)
  U.faction=button(f,"",180,24,function() U.browserFaction=cycle({MG:GetPlayerProfile().faction,"ALL"},U.browserFaction or MG:GetPlayerProfile().faction);U.browserPage=1;MG:RefreshGuideBrowser() end);U.faction:SetPoint("TOPLEFT",12,-104)
  U.class=button(f,"",180,24,function() U.browserClass=cycle({"ALL","MAGE"},U.browserClass);U.browserPage=1;MG:RefreshGuideBrowser() end);U.class:SetPoint("LEFT",U.faction,"RIGHT",8,0)
  U.category=button(f,"",180,24,function() U.browserCategory=cycle({"all","horde","ally","mage"},U.browserCategory);U.browserPage=1;MG:RefreshGuideBrowser() end);U.category:SetPoint("LEFT",U.class,"RIGHT",8,0)
  U.browserRows={}
  for i=1,PAGE_SIZE do local row=panel(f,BROWSER_W-24,50,"panel");row:SetPoint("TOPLEFT",12,-136-(i-1)*53);row:EnableMouse(true);row:SetScript("OnMouseUp",function(self) if self.guideID then U.browserSelection=self.guideID;MG:RefreshGuideBrowser() end end)
    row.icon=row:CreateTexture(nil,"ARTWORK");row.icon:SetSize(42,38);row.icon:SetPoint("LEFT",6,0);row.title=label(row,12,"text");row.title:SetPoint("TOPLEFT",row.icon,"TOPRIGHT",8,-4);row.title:SetPoint("RIGHT",-120,0);row.title:SetWordWrap(false)
    row.desc=label(row,9,"muted");row.desc:SetPoint("TOPLEFT",row.title,"BOTTOMLEFT",0,-2);row.desc:SetPoint("RIGHT",-120,0);row.desc:SetWordWrap(false);row.levels=label(row,9,"muted");row.levels:SetPoint("RIGHT",-42,7);row.levels:SetJustifyH("RIGHT")
    row.badge=label(row,8,"accent");row.badge:SetPoint("RIGHT",-42,-9);row.badge:SetJustifyH("RIGHT");row.star=button(row,"*",28,28,function(self) local p=self:GetParent();if p.guideID and MG.GuideRegistry then MG.GuideRegistry:ToggleFavorite(p.guideID);MG:RefreshGuideBrowser() end end);row.star:SetPoint("RIGHT",-6,0);U.browserRows[i]=row
  end
  U.pagePrev=button(f,"<",32,24,function() U.browserPage=math.max(1,U.browserPage-1);MG:RefreshGuideBrowser() end);U.pagePrev:SetPoint("BOTTOMLEFT",12,46)
  U.pageLabel=label(f,10,"muted");U.pageLabel:SetPoint("LEFT",U.pagePrev,"RIGHT",10,0);U.pageNext=button(f,">",32,24,function() U.browserPage=U.browserPage+1;MG:RefreshGuideBrowser() end);U.pageNext:SetPoint("LEFT",U.pageLabel,"RIGHT",10,0)
  U.favoriteButton=button(f,L("favorite_add"),170,28,function() if U.browserSelection and MG.GuideRegistry then MG.GuideRegistry:ToggleFavorite(U.browserSelection);MG:RefreshGuideBrowser() end end);U.favoriteButton:SetPoint("BOTTOMLEFT",12,12)
  U.startButton=button(f,L("start_guide"),190,28,function() if not U.browserSelection then return end local ok=MG.DataLoader and MG.DataLoader:SelectGuide(U.browserSelection);if ok then MG:SetRouteMode("auto");MG:ToggleGuideBrowser(false);MG:RefreshGuide("browser_start") end end);U.startButton:SetPoint("BOTTOMRIGHT",-12,12)
end

local function clearRows() for _,x in ipairs(U.settingRows) do if x and x.Hide then x:Hide() end end;U.settingRows={} end
local function remember(...) for i=1,select("#",...) do U.settingRows[#U.settingRows+1]=select(i,...) end end
local function doAction(c)
  if c.action=="openGuides" then MG:ToggleGuideBrowser(true) elseif c.action=="resetNavigator" and MG.ResetNavigatorPosition then MG:ResetNavigatorPosition()
  elseif c.action=="refreshTalent" then if MG.TalentAdvisor then MG.TalentAdvisor:Refresh("settings") end;if MG.TrainerAdvisor then MG.TrainerAdvisor:Refresh("settings") end
  elseif c.action=="openInfo" then MG:ToggleInfo() elseif c.action=="refreshData" then if MG.DataLoader then MG.DataLoader:Load() end;MG:RefreshGuide("data_refresh")
  elseif c.action=="resetSettings" then MewthischGuidesDB.settings={};MG:EnsureDB();MG:RefreshSettings();MG:RefreshGuide("settings_reset") end
end
local function buildSettings()
  if not U.settingsContent or not MG.SettingsSchema then return end;clearRows();local content=U.settingsContent;local cat=MG.SettingsSchema:GetCategory(U.settingsCategory)
  U.settingsPageTitle:SetText(L(cat.labelKey));U.settingsPageDesc:SetText(L(cat.descriptionKey));local y=-74
  if U.settingsCategory=="navigation" then local box=panel(content,175,165,"panel");box:SetPoint("TOPRIGHT",-8,-8);remember(box);local tx=label(box,10,"muted");tx:SetPoint("TOP",0,-10);tx:SetText(L("preview"));remember(tx);local ar=box:CreateTexture(nil,"ARTWORK");ar:SetSize(92,92);ar:SetPoint("CENTER",0,-10);if MG.ApplyNavigatorArrowSkinPreview then MG:ApplyNavigatorArrowSkinPreview(ar,92) else ar:SetTexture("Interface\\AddOns\\MewthischGuides\\Assets\\ArrowBlue") end;U.previewArrow=ar end
  for _,c in ipairs(MG.SettingsSchema:GetControls(U.settingsCategory)) do
    local control=c
    if control.type=="check" then local b,t=check(content,control.key,L(control.labelKey),10,y);b:SetChecked(MG.db.settings[control.key]);if U.settingsCategory=="navigation" then t:SetPoint("RIGHT",content,-195,0) end;remember(b,t);y=y-29
    elseif control.type=="language" then local tx=label(content,11,"text");tx:SetPoint("TOPLEFT",10,y);tx:SetText(L(control.labelKey));local b=button(content,"",230,25,function() MG:ToggleLanguageMenu() end);b:SetPoint("TOPLEFT",210,y+7);U.languageButton=b;remember(tx,b);y=y-38
    elseif control.type=="routeMode" then local tx=label(content,11,"text");tx:SetPoint("TOPLEFT",10,y);tx:SetText(L(control.labelKey));local m=button(content,L("manual_mode"),95,24,function() MG:SetRouteMode("manual") end);m:SetPoint("TOPLEFT",210,y+7);local a=button(content,L("auto_mode"),95,24,function() MG:SetRouteMode("auto") end);a:SetPoint("LEFT",m,"RIGHT",8,0);U.manualButton,U.autoButton=m,a;remember(tx,m,a);y=y-38
    elseif control.type=="arrowSkin" then local tx=label(content,11,"text");tx:SetPoint("TOPLEFT",10,y);tx:SetText(L(control.labelKey));local b=button(content,"",195,24,function() MG:NextNavigatorArrowSkin() end);b:SetPoint("TOPLEFT",210,y+7);U.arrowSkinButton=b;remember(tx,b);y=y-38
    elseif control.type=="scale" then local tx=label(content,11,"text");tx:SetPoint("TOPLEFT",10,y);tx:SetText(L(control.labelKey));local mn=button(content,"-",28,22,function() MG:SetNavigatorScale(math.max(0.6,(MG.db.settings.navigatorScale or 1)-0.1)) end);mn:SetPoint("TOPLEFT",210,y+6);local v=label(content,10,"accent");v:SetPoint("LEFT",mn,"RIGHT",12,0);U.scaleValue=v;local pl=button(content,"+",28,22,function() MG:SetNavigatorScale(math.min(2,(MG.db.settings.navigatorScale or 1)+0.1)) end);pl:SetPoint("LEFT",v,"RIGHT",12,0);remember(tx,mn,v,pl);y=y-34
    elseif control.type=="theme" then local tx=label(content,11,"text");tx:SetPoint("TOPLEFT",10,y);tx:SetText(L(control.labelKey));local b=button(content,"",220,24,function() MG.Themes:Next();MG:RefreshSettings();MG:RefreshTheme() end);b:SetPoint("TOPLEFT",210,y+7);U.themeButton=b;remember(tx,b);y=y-38
    elseif control.type=="transparency" then local tx=label(content,11,"text");tx:SetPoint("TOPLEFT",10,y);tx:SetText(L(control.labelKey));local mn=button(content,"-",28,22,function() MG.db.settings.windowTransparency=math.max(0,(MG.db.settings.windowTransparency or 0)-0.05);MG:RefreshTheme();MG:RefreshSettings() end);mn:SetPoint("TOPLEFT",210,y+6);local v=label(content,10,"accent");v:SetPoint("LEFT",mn,"RIGHT",12,0);U.transparencyValue=v;local pl=button(content,"+",28,22,function() MG.db.settings.windowTransparency=math.min(0.8,(MG.db.settings.windowTransparency or 0)+0.05);MG:RefreshTheme();MG:RefreshSettings() end);pl:SetPoint("LEFT",v,"RIGHT",12,0);remember(tx,mn,v,pl);y=y-34
    elseif control.type=="action" then local b=button(content,L(control.labelKey),280,25,function() doAction(control) end);b:SetPoint("TOPLEFT",10,y+5);b._mg2Danger=control.danger and true or false;remember(b);y=y-35
    elseif control.type=="info" then local st=MG.SupportedRoutes and MG.SupportedRoutes:GetStatus() or {};local q=MG.ForeverQuestDB and MG.ForeverQuestDB:GetStats() or {};local tx=label(content,10,"muted");tx:SetPoint("TOPLEFT",10,y);tx:SetPoint("RIGHT",-10,0);tx:SetText(string.format("%s: %d/%d • QuestDB %d/%d",L(control.labelKey),tonumber(st.resolvedRoutes) or 0,tonumber(st.requiredRoutes) or 0,tonumber(q.quests) or 0,tonumber(q.points) or 0));remember(tx);y=y-40 end
  end
end
local function createLanguageMenu()
  if U.languageMenu then return end
  local f=panel(UIParent,250,8+#(MG.Localization.order or {})*27,"background");f:SetFrameStrata("TOOLTIP");U.languageMenu=f;f:Hide();U.languageRows={}
  for i,code in ipairs(MG.Localization.order) do local languageCode=code;local b=button(f,MG.Localization:GetLanguageLabel(languageCode),234,24,function() MG.Localization:SetLanguage(languageCode);show(U.languageMenu,false) end);b:SetPoint("TOPLEFT",8,-5-(i-1)*27);U.languageRows[#U.languageRows+1]={button=b,code=languageCode} end
end
function MG:ToggleLanguageMenu()
  createLanguageMenu();U.languageMenu:ClearAllPoints();U.languageMenu:SetPoint("TOPLEFT",U.languageButton,"BOTTOMLEFT",0,-3);show(U.languageMenu,not U.languageMenu:IsShown())
end
local function createSettings()
  if U.settings then return end
  local f=CreateFrame("Frame","MewthischGuidesSettingsV2",UIParent);f:SetSize(SETTINGS_W,SETTINGS_H);f:SetPoint("CENTER",UIParent,"CENTER",tonumber(MG.db.settings.settingsX) or 0,tonumber(MG.db.settings.settingsY) or 0);f:SetFrameStrata("FULLSCREEN_DIALOG");f:SetFrameLevel(190);if f.SetToplevel then f:SetToplevel(true) end;f:SetClampedToScreen(true);f:SetMovable(true);decorate(f,"background");U.settings=f;f:Hide()
  local h=panel(f,nil,32,"header");h:SetPoint("TOPLEFT",1,-1);h:SetPoint("TOPRIGHT",-1,-1);h:EnableMouse(true);h:RegisterForDrag("LeftButton");h:SetScript("OnDragStart",function() if not (InCombatLockdown and InCombatLockdown()) then f:StartMoving() end end);h:SetScript("OnDragStop",function() f:StopMovingOrSizing();local x,y=f:GetCenter();local ux,uy=UIParent:GetCenter();if x and y and ux and uy then MG.db.settings.settingsX=math.floor(x-ux+0.5);MG.db.settings.settingsY=math.floor(y-uy+0.5) end end);U.settingsTitle=label(h,13,"accent");U.settingsTitle:SetPoint("LEFT",12,0);local close=button(h,"X",28,22,function() MG:ToggleSettings(false) end);close:SetPoint("RIGHT",-5,0)
  local side=panel(f,190,nil,"panel");side:SetPoint("TOPLEFT",8,-40);side:SetPoint("BOTTOMLEFT",8,8);U.categoryButtons={};local y=-8
  for _,c in ipairs(MG.SettingsSchema:GetCategories()) do local categoryID,categoryKey=c.id,c.labelKey;local b=button(side,L(categoryKey),174,28,function() U.settingsCategory=categoryID;MG:RefreshSettings() end);b:SetPoint("TOPLEFT",8,y);b._mg2CategoryID=categoryID;b._mg2LabelKey=categoryKey;U.categoryButtons[#U.categoryButtons+1]=b;y=y-31 end
  local content=panel(f,nil,nil,"panel");content:SetPoint("TOPLEFT",side,"TOPRIGHT",8,0);content:SetPoint("BOTTOMRIGHT",-8,8);U.settingsContent=content
  U.settingsPageTitle=label(content,16,"text");U.settingsPageTitle:SetPoint("TOPLEFT",10,-12);U.settingsPageDesc=label(content,10,"muted");U.settingsPageDesc:SetPoint("TOPLEFT",10,-38);U.settingsPageDesc:SetPoint("RIGHT",-10,0)
end
local function noticeAnchor() local n=_G.MewthischGuidesAutoEquipNotice;if n and U.main then n:ClearAllPoints();n:SetPoint("TOP",U.main,"BOTTOM",0,-8) end end

function MG:InitializeUI()
  if LegacyInitializeUI then LegacyInitializeUI(self) end;hideLegacy();createMain();createBrowser();createSettings();noticeAnchor();self:RefreshLocalizedUI();self:RefreshTheme();self:RefreshSettings();self:RefreshUI()
end
function MG:RefreshTheme()
  if LegacyRefreshTheme then LegacyRefreshTheme(self) end;local t=theme();local alpha=1-math.max(0,math.min(0.8,tonumber(self.db and self.db.settings.windowTransparency) or 0))
  for _,f in ipairs(U.frames) do styleFrame(f,t) end;for _,b in ipairs(U.buttons) do styleButton(b,t) end;for _,l in ipairs(U.labels) do styleLabel(l,t) end
  for _,b in ipairs(U.checks) do local bg=b._mg2Checked and {t.accent[1]*0.28,t.accent[2]*0.28,t.accent[3]*0.28,1} or t.panel;setTex(b._mg2Background,bg);if b._mg2Borders then for _,x in pairs(b._mg2Borders) do setTex(x,b._mg2Checked and t.accent or t.border) end end;if b._mg2Mark and b._mg2Mark.SetVertexColor then b._mg2Mark:SetVertexColor(color(t.accent)) end end
  if U.main then U.main:SetAlpha(alpha) end;if U.settings then U.settings:SetAlpha(alpha) end;if U.browser then U.browser:SetAlpha(alpha) end
end
function MG:RefreshLocalizedUI()
  if U.settingsTitle then U.settingsTitle:SetText(L("settings_title")) end
  for _,b in ipairs(U.footer or {}) do if b._mg2LabelKey then b:SetText(L(b._mg2LabelKey)) end end
  for _,b in ipairs(U.categoryButtons or {}) do if b._mg2LabelKey then b:SetText(L(b._mg2LabelKey)) end end
  for _,b in ipairs(U.browserTabs or {}) do if b._mg2LabelKey then b:SetText(L(b._mg2LabelKey)) end end
  if U.startButton then U.startButton:SetText(L("start_guide")) end
  if U.settings then self:RefreshSettings() end;if U.browser then self:RefreshGuideBrowser() end;self:RefreshUI()
end
function MG:RefreshUI()
  if not U.main then return end;local step=self.currentStep;local guide=self.GetActiveGuideDefinition and self:GetActiveGuideDefinition();local mode=self.GetRouteMode and self:GetRouteMode() or "manual"
  U.guideTitle:SetText(mode=="manual" and L("manual_mode_title") or (guide and guide.title or L("all_guides")));local count=#(self.steps or {});local idx=tonumber(self.currentStepIndex) or 0
  U.stepCounter:SetText(L("step").." "..idx.." "..L("of").." "..count);local icon=stepIcon(step);U.bigStepIcon:SetTexture(icon);if U.bigStepIcon.SetVertexColor then if step and step.goal and (step.goal.type=="kill" or step.goal.type=="kill_player") then U.bigStepIcon:SetVertexColor(1,0.2,0.2,1) else U.bigStepIcon:SetVertexColor(1,1,1,1) end end
  U.instruction:SetText(instruction(step));U.stepProgress:SetText(step and step.goal and step.goal.progressText or "")
  local d=details(step);for i=1,3 do U.detailLines[i]:SetText(d[i] or "") end;show(U.main,self.db.settings.showWindow~=false);self:RefreshTheme()
end
function MG:RefreshGuideBrowser()
  if not U.browser then return end;local p=self:GetPlayerProfile();U.browserFaction=U.browserFaction or p.faction
  U.faction:SetText(L("faction")..": "..(U.browserFaction=="ALL" and L("all") or (U.browserFaction=="Horde" and L("horde") or L("alliance"))));U.class:SetText(L("class")..": "..(U.browserClass=="ALL" and L("all") or "Mage"))
  local cat=U.browserCategory=="all" and L("all") or U.browserCategory=="horde" and L("horde") or U.browserCategory=="ally" and L("alliance") or L("mage_aoe");U.category:SetText(L("category")..": "..cat)
  for _,b in ipairs(U.browserTabs) do b._mg2Selected=b._mg2TabID==U.browserTab end
  local gs=browserGuides();local pages=math.max(1,math.ceil(#gs/PAGE_SIZE));U.browserPage=math.max(1,math.min(U.browserPage,pages));local first=(U.browserPage-1)*PAGE_SIZE+1
  local exists=false;for _,g in ipairs(gs) do if g.id==U.browserSelection then exists=true break end end;if not exists then U.browserSelection=gs[first] and gs[first].id or nil end
  for i,row in ipairs(U.browserRows) do local g=gs[first+i-1];if g then row:Show();row.guideID=g.id;row._mg2Kind=g.id==U.browserSelection and "active" or "panel";row.icon:SetTexture(guideIcon(g));local c=MG.GuideRegistry and MG.GuideRegistry:GetCard(g) or {}
    row.title:SetText(c.title or g.title or g.id);row.desc:SetText(c.description or "");row.levels:SetText(g.minLevel and g.maxLevel and (L("levels").." "..g.minLevel.." - "..g.maxLevel) or "");local sc=MG.GuideRegistry and MG.GuideRegistry:RecommendedScore(g,p) or 0;row.badge:SetText(U.browserTab=="recommended" and sc>=80 and L("recommended_badge") or "");row.star:SetText(MG.GuideRegistry and MG.GuideRegistry:IsFavorite(g.id) and "*" or "+")
    else row.guideID=nil;row:Hide() end end
  U.pageLabel:SetText(L("page").." "..U.browserPage.."/"..pages);enabled(U.pagePrev,U.browserPage>1);enabled(U.pageNext,U.browserPage<pages)
  local fav=U.browserSelection and MG.GuideRegistry and MG.GuideRegistry:IsFavorite(U.browserSelection);U.favoriteButton:SetText(fav and L("favorite_remove") or L("favorite_add"));enabled(U.startButton,U.browserSelection~=nil);self:RefreshTheme()
end
function MG:RefreshSettings()
  if not U.settings then return end;buildSettings();for _,b in ipairs(U.categoryButtons) do b._mg2Selected=b._mg2CategoryID==U.settingsCategory end
  if U.languageButton then U.languageButton:SetText(self.Localization:GetLanguageLabel(self.db.settings.language or "auto")) end
  if U.manualButton then local m=self:GetRouteMode();U.manualButton._mg2Selected=m=="manual";U.autoButton._mg2Selected=m=="auto";enabled(U.autoButton,self.DataLoader and self.DataLoader:IsAutoRouteReady()) end
  if U.arrowSkinButton and self.GetNavigatorArrowSkinName then U.arrowSkinButton:SetText(self:GetNavigatorArrowSkinName()) end
  if U.scaleValue then U.scaleValue:SetText(string.format("%d%%",math.floor((self.db.settings.navigatorScale or 1)*100+0.5))) end
  if U.transparencyValue then U.transparencyValue:SetText(string.format("%d%%",math.floor((1-(self.db.settings.windowTransparency or 0))*100+0.5))) end
  if U.themeButton and self.Themes then local _,name=self.Themes:GetCurrent();U.themeButton:SetText(name or "Theme") end;self:RefreshTheme()
end
function MG:ToggleWindow() self.db.settings.showWindow=not self.db.settings.showWindow;self:RefreshUI() end
function MG:ShowWindow() self.db.settings.showWindow=true;if U.main then U.main:Show() end end
function MG:HideWindow() self.db.settings.showWindow=false;if U.main then U.main:Hide() end end
function MG:ToggleSettings(force) if not U.settings then return end;local on=force;if on==nil then on=not U.settings:IsShown() end;show(U.settings,on);self.db.settings.showSettings=on and true or false;if on then self:RefreshSettings() end end
function MG:ToggleGuideBrowser(force) if not U.browser then return end;local on=force;if on==nil then on=not U.browser:IsShown() end;show(U.browser,on);if on then if U.browser.Raise then U.browser:Raise() end;U.browserFaction=self:GetPlayerProfile().faction;U.browserSearch="";U.browserPage=1;if U.search then U.search:SetText("") end;self:RefreshGuideBrowser() end end
function MG:ToggleGuideSelector(force) return self:ToggleGuideBrowser(force) end
if LegacyRefreshInfo then function MG:RefreshInfo() return LegacyRefreshInfo(self) end end
