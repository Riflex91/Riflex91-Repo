local addonName, MG = ...

MG.RewardAdvisorFrame = MG.RewardAdvisorFrame or {}
local R = MG.RewardAdvisorFrame
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
    local b=CreateFrame("Button",nil,parent);UI:SetSize(b,width,26)
    local bg=solid(b,"BACKGROUND",.10,.07,.03,1);bg:SetAllPoints()
    local l=b:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormal","GameFontNormal"))
    l:SetPoint("CENTER");l:SetText(text);shadow(l)
    if l.SetTextColor then l:SetTextColor(1,.74,.12) end
    b:SetScript("OnClick",callback);b.label=l;return b
end

function R:Create()
    if self.frame then return self.frame end
    local frame=CreateFrame("Frame","MewthischGuides1RewardAdvisor",UIParent)
    UI:SetSize(frame,390,132);frame:SetPoint("CENTER",0,180)
    UI:SetFrameStrata(frame,"FULLSCREEN_DIALOG");UI:SetClampedToScreen(frame,true)
    local bg=solid(frame,"BACKGROUND",.012,.015,.02,.98);bg:SetAllPoints()
    local top=solid(frame,"ARTWORK",.95,.56,.06,1)
    top:SetPoint("TOPLEFT",1,-1);top:SetPoint("TOPRIGHT",-1,-1);top:SetHeight(1)

    local title=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormalLarge","GameFontNormal"))
    title:SetPoint("TOPLEFT",12,-12);title:SetText("Questbelohnung");shadow(title)
    if title.SetTextColor then title:SetTextColor(1,.74,.1) end

    local text=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlight","GameFontNormal"))
    text:SetPoint("TOPLEFT",12,-45);text:SetPoint("RIGHT",-12,0);text:SetJustifyH("LEFT");shadow(text)

    local detail=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
    detail:SetPoint("TOPLEFT",12,-68);detail:SetPoint("RIGHT",-12,0);detail:SetJustifyH("LEFT");shadow(detail)
    if detail.SetTextColor then detail:SetTextColor(.68,.68,.68) end

    local choose=button(frame,"Empfohlen wählen",130,function()
        local current=MG.RewardAdvisor and MG.RewardAdvisor:Get()
        local best=current and current.recommended
        if best and best.index and GetQuestReward then
            local ok=pcall(GetQuestReward,best.index)
            if ok then
                if MG.ActionMemory then MG.ActionMemory:Record("quest_reward",best.index,{user=true}) end
                frame:Hide()
            end
        end
    end)
    choose:SetPoint("BOTTOMLEFT",12,12)

    local close=button(frame,"Schließen",90,function() frame:Hide() end)
    close:SetPoint("BOTTOMRIGHT",-12,12)

    self.frame=frame;self.text=text;self.detail=detail;self.choose=choose
    frame:Hide();return frame
end

function R:Refresh(show)
    local frame=self:Create()
    local data=MG.RewardAdvisor and MG.RewardAdvisor:Refresh() or nil
    local best=data and data.recommended
    if not best then frame:Hide();return nil end

    self.text:SetText("Empfehlung: "..tostring(best.name or best.link or "Belohnung"))
    self.detail:SetText(
        "Itemlevel "..tostring(best.score or 0)..
        "  |  Ausgerüstet "..tostring(best.equippedScore or 0)..
        "  |  Differenz "..string.format("%+d",tonumber(best.delta) or 0))
    if show~=false then frame:Show() end
    return data
end

function R:Hide()
    if self.frame then self.frame:Hide() end
end
