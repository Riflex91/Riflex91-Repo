local addonName, MG = ...

MG.GuideViewer = MG.GuideViewer or {}
local V = MG.GuideViewer
local UI = MG.UICompat

local FRAME_WIDTH = 400
local MAX_ROWS = 12
local ROW_HEIGHT = 22
local ROW_START = 76
local FOOTER_HEIGHT = 36

local function solid(parent,layer,r,g,b,a)
    local t=parent:CreateTexture(nil,layer or "BACKGROUND")
    UI:SetSolid(t,r,g,b,a);return t
end

local function shadow(font)
    if not font then return end
    if font.SetShadowColor then font:SetShadowColor(0,0,0,1) end
    if font.SetShadowOffset then font:SetShadowOffset(1,-1) end
end

local function flatButton(parent,text,width,height,callback)
    local b=CreateFrame("Button",nil,parent);UI:SetSize(b,width,height)
    local bg=solid(b,"BACKGROUND",.10,.07,.03,.98);bg:SetAllPoints()
    local top=solid(b,"BORDER",.82,.49,.07,.9)
    top:SetPoint("TOPLEFT");top:SetPoint("TOPRIGHT");top:SetHeight(1)
    local l=b:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormal","GameFontNormal"))
    l:SetPoint("CENTER");l:SetText(text);shadow(l)
    if l.SetTextColor then l:SetTextColor(1,.74,.10) end
    b:SetScript("OnEnter",function() UI:SetSolid(bg,.19,.11,.03,1) end)
    b:SetScript("OnLeave",function() UI:SetSolid(bg,.10,.07,.03,.98) end)
    b:SetScript("OnClick",callback);b.label=l
    return b
end

local function markerFor(row)
    if row.stickyHeader then return "",1,.74,.08 end
    if row.navigated then return ">",1,.74,.08 end
    if row.status=="complete" or row.status=="complete_hidden" then return "v",.3,.9,.45 end
    if row.status=="warning" or row.warning then return "!",1,.48,.10 end
    if row.passive then return "i",.4,.72,1 end
    if row.optional then return "~",.75,.75,.75 end
    return "o",.82,.82,.82
end

local function textColor(row)
    if row.stickyHeader then return 1,.74,.08 end
    if row.status=="complete" or row.status=="complete_hidden" then return .55,.75,.58 end
    if row.status=="warning" or row.warning then return 1,.68,.25 end
    if row.passive then return .70,.82,1 end
    if row.optional then return .76,.76,.76 end
    return .95,.95,.95
end

local function savePosition(frame)
    if not MG.db or not frame.GetCenter or not UIParent or not UIParent.GetCenter then return end
    local x,y=frame:GetCenter();local ux,uy=UIParent:GetCenter()
    if x and y and ux and uy then
        MG.db.ui.viewerX=x-ux;MG.db.ui.viewerY=y-uy
    end
end

function V:ResetPosition()
    local frame=self:Create()
    if frame.ClearAllPoints then frame:ClearAllPoints() end
    frame:SetPoint("LEFT",UIParent,"LEFT",24,80)
    if MG.db and MG.db.ui then MG.db.ui.viewerX=nil;MG.db.ui.viewerY=nil end
end

local function applyPosition(frame)
    local x=MG.db and MG.db.ui and tonumber(MG.db.ui.viewerX)
    local y=MG.db and MG.db.ui and tonumber(MG.db.ui.viewerY)
    if frame.ClearAllPoints then frame:ClearAllPoints() end
    if x and y then frame:SetPoint("CENTER",UIParent,"CENTER",x,y)
    else frame:SetPoint("LEFT",UIParent,"LEFT",24,80) end
end

function V:Create()
    if self.frame then return self.frame end

    local frame=CreateFrame("Frame","MewthischGuides1Viewer",UIParent)
    UI:SetSize(frame,FRAME_WIDTH,134)
    UI:SetFrameStrata(frame,"HIGH");UI:SetClampedToScreen(frame,true)
    frame:SetMovable(true);frame:EnableMouse(true)
    if frame.RegisterForDrag then frame:RegisterForDrag("LeftButton") end
    applyPosition(frame)
    frame:SetScript("OnDragStart",function(self)
        if not (InCombatLockdown and InCombatLockdown()) and self.StartMoving then self:StartMoving() end
    end)
    frame:SetScript("OnDragStop",function(self)
        if self.StopMovingOrSizing then self:StopMovingOrSizing() end
        savePosition(self)
    end)

    local bg=solid(frame,"BACKGROUND",.008,.010,.014,.985);bg:SetAllPoints()
    local header=solid(frame,"BORDER",.028,.032,.040,1)
    header:SetPoint("TOPLEFT",1,-1);header:SetPoint("TOPRIGHT",-1,-1);header:SetHeight(30)
    local top=solid(frame,"ARTWORK",.96,.57,.05,1)
    top:SetPoint("TOPLEFT",1,-1);top:SetPoint("TOPRIGHT",-1,-1);top:SetHeight(1)

    local title=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormalLarge","GameFontNormal"))
    title:SetPoint("TOPLEFT",10,-8);title:SetText("Mewthisch Guides 1.0");shadow(title)
    if title.SetTextColor then title:SetTextColor(1,.74,.08) end

    local close=flatButton(frame,"x",22,20,function()
        MG:EnsureDB().settings.showViewer=false;frame:Hide()
    end);close:SetPoint("TOPRIGHT",-5,-5)
    local opt=flatButton(frame,"OPT",34,20,function()
        if MG.SettingsWindow then MG.SettingsWindow:Toggle() end
    end);opt:SetPoint("TOPRIGHT",-31,-5)
    local log=flatButton(frame,"LOG",34,20,function()
        if MG.ErrorLogWindow then MG.ErrorLogWindow:Toggle() end
    end);log:SetPoint("TOPRIGHT",-69,-5)

    local guideTitle=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormal","GameFontNormal"))
    guideTitle:SetPoint("TOPLEFT",10,-38);guideTitle:SetPoint("RIGHT",-82,0)
    guideTitle:SetJustifyH("LEFT");shadow(guideTitle)
    if guideTitle.SetTextColor then guideTitle:SetTextColor(1,.72,.1) end

    local stepText=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
    stepText:SetPoint("TOPRIGHT",-10,-39);stepText:SetWidth(68);stepText:SetJustifyH("RIGHT");shadow(stepText)
    if stepText.SetTextColor then stepText:SetTextColor(.75,.75,.75) end

    local barBg=solid(frame,"BACKGROUND",.07,.07,.07,1)
    barBg:SetPoint("TOPLEFT",10,-57);UI:SetSize(barBg,FRAME_WIDTH-20,5)
    local bar=solid(frame,"ARTWORK",.18,.78,.32,1)
    bar:SetPoint("TOPLEFT",barBg,"TOPLEFT");bar:SetHeight(5)

    local rows={}
    for i=1,MAX_ROWS do
        local rf=CreateFrame("Frame",nil,frame)
        rf:SetPoint("TOPLEFT",7,-(ROW_START+(i-1)*ROW_HEIGHT))
        rf:SetPoint("TOPRIGHT",-7,-(ROW_START+(i-1)*ROW_HEIGHT))
        rf:SetHeight(ROW_HEIGHT)

        local hi=solid(rf,"BACKGROUND",.95,.60,.08,.09);hi:SetAllPoints();hi:Hide()
        local marker=rf:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormal","GameFontNormal"))
        marker:SetPoint("LEFT",3,0);marker:SetWidth(16);marker:SetJustifyH("CENTER");shadow(marker)
        local text=rf:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlight","GameFontNormal"))
        text:SetPoint("LEFT",marker,"RIGHT",4,0);text:SetPoint("RIGHT",-4,0)
        text:SetJustifyH("LEFT");UI:SetWordWrap(text,false);shadow(text)
        rows[i]={frame=rf,highlight=hi,marker=marker,text=text}
    end

    local prev=flatButton(frame,"<",30,22,function()
        if MG.RuntimeEngine then MG.RuntimeEngine:MoveStep(-1,"viewer_prev") end
        if MG.RefreshUI then MG:RefreshUI() end
    end);prev:SetPoint("BOTTOMLEFT",8,7)

    local guides=flatButton(frame,"GUIDES",66,22,function()
        if MG.GuideBrowser then MG.GuideBrowser:Toggle() end
    end);guides:SetPoint("BOTTOM",0,7)

    local nextB=flatButton(frame,">",30,22,function()
        if MG.RuntimeEngine then MG.RuntimeEngine:MoveStep(1,"viewer_next") end
        if MG.RefreshUI then MG:RefreshUI() end
    end);nextB:SetPoint("BOTTOMRIGHT",-8,7)

    local footer=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
    footer:SetPoint("BOTTOM",0,31);footer:SetWidth(FRAME_WIDTH-80);footer:SetJustifyH("CENTER");shadow(footer)

    self.frame=frame;self.guideTitle=guideTitle;self.stepText=stepText
    self.bar=bar;self.barBg=barBg;self.rows=rows;self.footer=footer
    self.themeBackground=bg;self.themeHeader=header;self.themeTop=top;self.themeTitle=title
    if MG.ThemeManager then MG.ThemeManager:ApplyViewer(self) end
    UI:SetShown(frame,true)
    return frame
end

function V:Refresh()
    local frame=self:Create()
    local db=MG:EnsureDB()
    local runtime=MG.RuntimeStore and MG.RuntimeStore:Get() or nil

    if db.settings.showViewer==false then frame:Hide();return end
    if runtime and runtime.step and runtime.step.hideWindow and db.settings.respectHideWindow then
        frame:Hide();return
    end

    if not runtime or not runtime.guide then
        self.guideTitle:SetText("Guide wird geladen ...");self.stepText:SetText("")
        self.bar:SetWidth(1)
        for _,row in ipairs(self.rows) do row.frame:Hide() end
        self.rows[1].frame:Show();self.rows[1].marker:SetText("i")
        self.rows[1].text:SetText("RestedXP-Daten werden vorbereitet")
        self.footer:SetText("");UI:SetSize(frame,FRAME_WIDTH,134);frame:Show();return
    end

    self.guideTitle:SetText(tostring(runtime.guide.title or runtime.guideID))
    local total=#(runtime.guide.steps or {});local index=tonumber(runtime.stepIndex) or 1
    self.stepText:SetText(tostring(index).."/"..tostring(total))
    local width=self.barBg.GetWidth and self.barBg:GetWidth() or (FRAME_WIDTH-20)
    self.bar:SetWidth(math.max(1,width*(total>0 and index/total or 0)))

    local visible={}
    for _,row in ipairs(runtime.presentation and runtime.presentation.rows or {}) do
        visible[#visible+1]=row
    end
    for _,sticky in ipairs(runtime.presentation and runtime.presentation.stickies or {}) do
        if #(sticky.rows or {})>0 then
            visible[#visible+1]={text="Zusätzliche Ziele",stickyHeader=true,passive=true}
            for _,row in ipairs(sticky.rows or {}) do visible[#visible+1]=row end
        end
    end

    local count=math.min(MAX_ROWS,#visible)
    local rowCount=math.max(1,count)
    local footerExtra=0
    local state=runtime.stepState or {}
    local footerText=""
    if state.complete then footerText="|cff55dd77Schritt abgeschlossen|r";footerExtra=14
    elseif (state.unknownBlockingGoals or 0)>0 then footerText="|cffffa020Zielstatus wird geprüft|r";footerExtra=14
    elseif state.reason=="optional_only" then footerText="Optionaler Schritt";footerExtra=14 end

    local nextText=runtime.presentation and runtime.presentation.nextStep
    if nextText and nextText~="" then
        local preview="|cff888888Nächster: "..tostring(nextText).."|r"
        footerText=footerText~="" and (footerText.."   "..preview) or preview
        footerExtra=math.max(footerExtra,14)
    end
    self.footer:SetText(footerText)

    local height=ROW_START+rowCount*ROW_HEIGHT+FOOTER_HEIGHT+footerExtra
    UI:SetSize(frame,FRAME_WIDTH,math.max(132,math.min(410,height)))

    for i,uiRow in ipairs(self.rows) do
        local row=visible[i]
        if row then
            uiRow.frame:Show()
            local m,r,g,b=markerFor(row);uiRow.marker:SetText(m)
            if uiRow.marker.SetTextColor then uiRow.marker:SetTextColor(r,g,b) end
            local progress=row.progress and ("  "..row.progress) or ""
            uiRow.text:SetText(tostring(row.text or "")..progress)
            local tr,tg,tb=textColor(row)
            if uiRow.text.SetTextColor then uiRow.text:SetTextColor(tr,tg,tb) end
            if row.navigated then uiRow.highlight:Show() else uiRow.highlight:Hide() end
        else
            uiRow.frame:Hide()
        end
    end
    frame:Show()
end

function MG:RefreshUI()
    if MG.GuideViewer then MG.GuideViewer:Refresh() end
    if MG.NavigatorFrame then MG.NavigatorFrame:Refresh() end
    if MG.ActionBar then MG.ActionBar:Refresh() end
    if MG.WorldMapOverlay then MG.WorldMapOverlay:Refresh() end
end
