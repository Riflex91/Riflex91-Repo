local addonName, MG = ...

MG.BuildWindow = MG.BuildWindow or {}
local B = MG.BuildWindow
local UI = MG.UICompat

local function solid(parent,layer,r,g,b,a)
    local t=parent:CreateTexture(nil,layer or "BACKGROUND")
    UI:SetSolid(t,r,g,b,a);return t
end

local function shadow(font)
    if font.SetShadowColor then font:SetShadowColor(0,0,0,1) end
    if font.SetShadowOffset then font:SetShadowOffset(1,-1) end
end

local function button(parent,text,width,callback)
    local b=CreateFrame("Button",nil,parent);UI:SetSize(b,width,24)
    local bg=solid(b,"BACKGROUND",.10,.07,.03,1);bg:SetAllPoints()
    local l=b:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormal","GameFontNormal"))
    l:SetPoint("CENTER");l:SetText(text);shadow(l)
    if l.SetTextColor then l:SetTextColor(1,.74,.12) end
    b:SetScript("OnClick",callback);b.label=l;return b
end

function B:Create()
    if self.frame then return self.frame end
    local frame=CreateFrame("Frame","MewthischGuides1BuildWindow",UIParent)
    UI:SetSize(frame,430,350);frame:SetPoint("CENTER",0,30)
    UI:SetFrameStrata(frame,"FULLSCREEN_DIALOG");UI:SetClampedToScreen(frame,true)
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
    title:SetPoint("TOPLEFT",14,-11);title:SetText("Build & Training");shadow(title)
    if title.SetTextColor then title:SetTextColor(1,.74,.1) end

    local close=button(frame,"x",26,function() frame:Hide() end);close:SetPoint("TOPRIGHT",-7,-7)

    local summary=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlight","GameFontNormal"))
    summary:SetPoint("TOPLEFT",14,-52);summary:SetPoint("RIGHT",-14,0);summary:SetJustifyH("LEFT");shadow(summary)

    local note=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
    note:SetPoint("TOPLEFT",14,-78);note:SetPoint("RIGHT",-14,0);note:SetJustifyH("LEFT")
    note:SetText("Training basiert auf RestedXP-Direktiven. Es werden keine proprietären Talent-Builds übernommen.")
    if note.SetTextColor then note:SetTextColor(.66,.66,.66) end;shadow(note)

    local rows={}
    for i=1,8 do
        local row=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlight","GameFontNormal"))
        row:SetPoint("TOPLEFT",20,-112-(i-1)*27);row:SetPoint("RIGHT",-20,0);row:SetJustifyH("LEFT");shadow(row)
        rows[i]=row
    end

    self.frame=frame;self.summary=summary;self.rows=rows
    frame:SetScript("OnShow",function() B:Refresh() end)
    frame:Hide();return frame
end

function B:Refresh()
    self:Create()
    local snapshot=MG.BuildAdvisor and MG.BuildAdvisor:Snapshot() or {}
    self.summary:SetText(
        "Klasse: "..tostring(snapshot.class or "-")..
        "   Level: "..tostring(snapshot.level or "-")..
        "   Spezialisierung: "..tostring(snapshot.specialization or "-")..
        "   Freie Talentpunkte: "..tostring(snapshot.unspentTalentPoints or 0))

    local talent=snapshot.talentRecommendation
    if talent then
        self.rows[1]:SetText("Talent: "..tostring(talent.name or talent.spellID)..
            "  |cff55dd77("..tostring(talent.confidence or "data-backed")..")|r")
    else
        self.rows[1]:SetText("Talent: keine datenbasierte Empfehlung verfügbar")
    end
    for i=2,#self.rows do
        local row=self.rows[i]
        local item=snapshot.upcomingTraining and snapshot.upcomingTraining[i-1]
        if item then
            row:SetText(
                tostring(item.stepIndex)..".  "..tostring(item.name)..
                "  |cff777777("..tostring(item.spellID)..")|r")
        else
            row:SetText("")
        end
    end
end

function B:Toggle(force)
    local frame=self:Create()
    local show=force;if show==nil then show=not frame:IsShown() end
    if show then self:Refresh();frame:Show() else frame:Hide() end
end
