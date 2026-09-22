local addonName, MG = ...

MG.GuideBrowser = MG.GuideBrowser or {}
local B = MG.GuideBrowser
local UI = MG.UICompat
local PAGE_SIZE = 12

local function solid(parent, layer, r,g,b,a)
    local t=parent:CreateTexture(nil,layer or "BACKGROUND")
    UI:SetSolid(t,r,g,b,a)
    return t
end

local function publicGroup(value)
    local group=tostring(value or "")
    local lower=string.lower(group)
    if string.find(lower,"survival guide",1,true) then return "Hardcore" end
    if string.find(lower,"restedxp",1,true) or string.find(lower,"forever guide",1,true) then
        return "Leveling"
    end
    group=group:gsub("RestedXP",""):gsub("^%s+",""):gsub("%s+$","")
    return group~="" and group or "Guides"
end

local function shadow(font)
    if font.SetShadowColor then font:SetShadowColor(0,0,0,1) end
    if font.SetShadowOffset then font:SetShadowOffset(1,-1) end
end

local function button(parent,text,width,callback)
    local b=CreateFrame("Button",nil,parent)
    UI:SetSize(b,width,24)
    local bg=solid(b,"BACKGROUND",0.10,0.07,0.03,1);bg:SetAllPoints()
    local l=b:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormal","GameFontNormal"))
    l:SetPoint("CENTER");l:SetText(text);shadow(l)
    if l.SetTextColor then l:SetTextColor(1,.74,.12) end
    b:SetScript("OnEnter",function() UI:SetSolid(bg,.20,.12,.03,1) end)
    b:SetScript("OnLeave",function() UI:SetSolid(bg,.10,.07,.03,1) end)
    b:SetScript("OnClick",callback)
    b.label=l
    return b
end

function B:Create()
    if self.frame then return self.frame end
    local frame=CreateFrame("Frame","MewthischGuides1GuideBrowser",UIParent)
    UI:SetSize(frame,620,520)
    frame:SetPoint("CENTER",0,20)
    UI:SetFrameStrata(frame,"FULLSCREEN_DIALOG")
    UI:SetClampedToScreen(frame,true)
    frame:SetMovable(true);frame:EnableMouse(true)
    if frame.RegisterForDrag then frame:RegisterForDrag("LeftButton") end
    frame:SetScript("OnDragStart",function(self)
        if not (InCombatLockdown and InCombatLockdown()) and self.StartMoving then self:StartMoving() end
    end)
    frame:SetScript("OnDragStop",function(self) if self.StopMovingOrSizing then self:StopMovingOrSizing() end end)

    local bg=solid(frame,"BACKGROUND",.012,.015,.02,1);bg:SetAllPoints()
    local header=solid(frame,"BORDER",.035,.04,.05,1)
    header:SetPoint("TOPLEFT",1,-1);header:SetPoint("TOPRIGHT",-1,-1);header:SetHeight(38)
    local top=solid(frame,"ARTWORK",.95,.56,.06,1)
    top:SetPoint("TOPLEFT",1,-1);top:SetPoint("TOPRIGHT",-1,-1);top:SetHeight(1)

    local title=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormalLarge","GameFontNormal"))
    title:SetPoint("TOPLEFT",14,-11);title:SetText("Mewthisch Guides - Guide-Browser");shadow(title)
    if title.SetTextColor then title:SetTextColor(1,.74,.1) end

    local close=button(frame,"x",26,function() frame:Hide() end);close:SetPoint("TOPRIGHT",-7,-7)

    local search=CreateFrame("EditBox",nil,frame,"InputBoxTemplate")
    UI:SetSize(search,360,28);search:SetPoint("TOPLEFT",16,-52)
    search:SetAutoFocus(false)
    if search.SetTextInsets then search:SetTextInsets(8,8,0,0) end
    search:SetScript("OnEscapePressed",function(self) self:ClearFocus() end)
    search:SetScript("OnTextChanged",function(self,user)
        if not user then return end
        B.query=self:GetText() or "";B.page=1
        if MG.db then MG.db.browser.query=B.query end
        B:Refresh()
    end)

    local mode=button(frame,"Nur passend",112,function()
        B.includeAll=not B.includeAll;B.page=1;B:Refresh()
    end)
    mode:SetPoint("LEFT",search,"RIGHT",10,0)

    local rows={}
    for i=1,PAGE_SIZE do
        local row=CreateFrame("Button",nil,frame)
        UI:SetSize(row,588,30)
        row:SetPoint("TOPLEFT",16,-92-(i-1)*31)
        local rowBg=solid(row,"BACKGROUND",.03,.035,.045,.92);rowBg:SetAllPoints()
        local name=row:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormal","GameFontNormal"))
        name:SetPoint("LEFT",8,4);name:SetPoint("RIGHT",-118,4);name:SetJustifyH("LEFT");shadow(name)
        local meta=row:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
        meta:SetPoint("LEFT",8,-9);meta:SetPoint("RIGHT",-8,-9);meta:SetJustifyH("LEFT");shadow(meta)
        if meta.SetTextColor then meta:SetTextColor(.62,.62,.62) end
        local state=row:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormal","GameFontNormal"))
        state:SetPoint("RIGHT",-8,2);state:SetWidth(100);state:SetJustifyH("RIGHT");shadow(state)
        row:SetScript("OnEnter",function() UI:SetSolid(rowBg,.11,.08,.03,.95) end)
        row:SetScript("OnLeave",function()
            if B.selectedRow~=row then UI:SetSolid(rowBg,.03,.035,.045,.92) end
        end)
        row:SetScript("OnClick",function()
            B.selected=row.guide
            if B.selectedRow and B.selectedRow~=row then
                UI:SetSolid(B.selectedRow.bg,.03,.035,.045,.92)
            end
            B.selectedRow=row;UI:SetSolid(rowBg,.16,.10,.03,.98)
            B:UpdateFooter()
        end)
        row.bg=rowBg;row.name=name;row.meta=meta;row.state=state
        rows[i]=row
    end

    local prev=button(frame,"<",34,function() B.page=math.max(1,(B.page or 1)-1);B:Refresh() end)
    prev:SetPoint("BOTTOMLEFT",16,15)
    local pageText=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
    pageText:SetPoint("LEFT",prev,"RIGHT",10,0);pageText:SetWidth(130);pageText:SetJustifyH("LEFT")
    local nextB=button(frame,">",34,function() B.page=(B.page or 1)+1;B:Refresh() end)
    nextB:SetPoint("LEFT",pageText,"RIGHT",4,0)

    local suggested=button(frame,"Empfohlen",96,function()
        local guide=MG.GuideCatalog:Suggest()
        if guide then MG.GuideController:Start(guide,"browser_suggested",true);frame:Hide() end
    end)
    suggested:SetPoint("BOTTOM", -118,15)

    local start=button(frame,"Guide starten",112,function()
        if B.selected then
            MG.GuideController:Start(B.selected,"browser",true)
            frame:Hide()
        end
    end)
    start:SetPoint("BOTTOM",10,15)

    local current=button(frame,"Aktueller Guide",112,function()
        local g=MG.GuideController:CurrentGuide()
        if g then B.query=g.title or "";search:SetText(B.query);B.page=1;B:Refresh() end
    end)
    current:SetPoint("BOTTOM",138,15)

    local footer=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
    footer:SetPoint("BOTTOMRIGHT",-16,18);footer:SetWidth(180);footer:SetJustifyH("RIGHT")

    self.frame=frame;self.search=search;self.modeButton=mode;self.rows=rows
    self.pageText=pageText;self.footer=footer;self.page=1;self.includeAll=false
    local db=MG:EnsureDB();self.query=db.browser.query or "";search:SetText(self.query)
    frame:SetScript("OnShow",function() B:Refresh() end)
    frame:Hide()
    return frame
end

function B:UpdateFooter()
    if not self.footer then return end
    self.footer:SetText(self.selected and tostring(self.selected.title or "") or "Kein Guide gewählt")
end

function B:Refresh()
    self:Create()
    local results=MG.GuideCatalog:Search(self.query or "",MG:GetPlayerProfile(),self.includeAll)
    local pages=math.max(1,math.ceil(#results/PAGE_SIZE))
    self.page=math.max(1,math.min(self.page or 1,pages))
    self.pageText:SetText("Seite "..self.page.." / "..pages.."  ("..#results..")")
    self.modeButton.label:SetText(self.includeAll and "Alle Guides" or "Nur passend")

    local start=(self.page-1)*PAGE_SIZE+1
    for i,row in ipairs(self.rows) do
        local item=results[start+i-1]
        row.guide=item and item.guide or nil
        if item then
            row:Show()
            row.name:SetText(tostring(item.guide.title or item.guide.id))
            row.meta:SetText(table.concat({
                publicGroup(item.guide.group),
                tostring(item.guide.subgroup or ""),
            },"  -  "))
            row.state:SetText(item.applicable and "|cff55dd77PASSEND|r" or "|cffdd8844ANDERER|r")
        else
            row:Hide()
        end
    end
    self:UpdateFooter()
end

function B:Toggle(force)
    local frame=self:Create()
    local show=force;if show==nil then show=not frame:IsShown() end
    if show then self:Refresh();frame:Show() else frame:Hide() end
end
