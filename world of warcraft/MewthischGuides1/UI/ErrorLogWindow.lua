local addonName, MG = ...

MG.ErrorLogWindow = MG.ErrorLogWindow or {}
local E = MG.ErrorLogWindow
local UI = MG.UICompat

local function makeButton(parent, text, width, callback)
    local button = CreateFrame("Button", nil, parent, "UIPanelButtonTemplate")
    UI:SetSize(button, width, 24)
    button:SetText(text)
    button:SetScript("OnClick", callback)
    return button
end

function E:Create()
    if self.frame then return self.frame end

    local frame = CreateFrame("Frame", "MewthischGuides1ErrorLog", UIParent)
    UI:SetSize(frame, 760, 520)
    frame:SetPoint("CENTER")
    UI:SetFrameStrata(frame, "FULLSCREEN_DIALOG")
    if frame.SetFrameLevel then frame:SetFrameLevel(250) end
    frame:SetMovable(true)
    UI:SetClampedToScreen(frame, true)
    frame:EnableMouse(true)

    local bg = frame:CreateTexture(nil, "BACKGROUND")
    bg:SetAllPoints()
    UI:SetSolid(bg, 0.02, 0.025, 0.03, 0.98)

    local title = frame:CreateFontString(nil, "OVERLAY", UI:SafeFont("GameFontNormalLarge", "GameFontNormal"))
    title:SetPoint("TOPLEFT", 14, -12)
    title:SetText("Mewthisch Guides 1.0 - Fehler & Diagnose")

    local hint = frame:CreateFontString(nil, "OVERLAY", UI:SafeFont("GameFontHighlightSmall", "GameFontNormalSmall"))
    hint:SetPoint("TOPLEFT", 14, -38)
    hint:SetText("Strg+A und Strg+C kopieren den kompletten Diagnoseblock.")

    local drag = CreateFrame("Frame", nil, frame)
    drag:SetPoint("TOPLEFT")
    drag:SetPoint("TOPRIGHT")
    drag:SetHeight(34)
    drag:EnableMouse(true)
    if drag.RegisterForDrag then drag:RegisterForDrag("LeftButton") end
    drag:SetScript("OnDragStart", function()
        if not (InCombatLockdown and InCombatLockdown()) and frame.StartMoving then frame:StartMoving() end
    end)
    drag:SetScript("OnDragStop", function()
        if frame.StopMovingOrSizing then frame:StopMovingOrSizing() end
    end)

    local scroll = CreateFrame("ScrollFrame", nil, frame, "UIPanelScrollFrameTemplate")
    scroll:SetPoint("TOPLEFT", 14, -64)
    scroll:SetPoint("BOTTOMRIGHT", -34, 50)

    local edit = CreateFrame("EditBox", nil, scroll)
    edit:SetMultiLine(true)
    edit:SetAutoFocus(false)
    if ChatFontNormal and edit.SetFontObject then edit:SetFontObject(ChatFontNormal) end
    edit:SetWidth(690)
    edit:SetHeight(4000)
    UI:SetTextInsets(edit, 4, 4, 4, 4)
    edit:SetScript("OnEscapePressed", function(self) self:ClearFocus() end)
    scroll:SetScrollChild(edit)

    local refresh = makeButton(frame, "Aktualisieren", 110, function() E:Refresh() end)
    refresh:SetPoint("BOTTOMLEFT", 14, 14)

    local selectAll = makeButton(frame, "Alles markieren", 120, function()
        edit:SetFocus()
        if edit.HighlightText then edit:HighlightText() end
    end)
    selectAll:SetPoint("LEFT", refresh, "RIGHT", 8, 0)

    local clear = makeButton(frame, "Log leeren", 100, function()
        MG.db.logs = {}
        MG.db.logSequence = 0
        MG:Log("INFO", "log.cleared", "Diagnoselog geleert.")
        E:Refresh()
    end)
    clear:SetPoint("LEFT", selectAll, "RIGHT", 8, 0)

    local close = makeButton(frame, "Schliessen", 100, function() frame:Hide() end)
    close:SetPoint("BOTTOMRIGHT", -14, 14)

    self.frame = frame
    self.edit = edit
    frame:Hide()
    return frame
end

function E:Refresh()
    self:Create()
    self.edit:SetText(MG:GetErrorLogText(true))
    if self.edit.SetCursorPosition then self.edit:SetCursorPosition(0) end
end

function E:Toggle(force)
    local frame = self:Create()
    local show = force
    if show == nil then show = not frame:IsShown() end
    if show then
        self:Refresh()
        frame:Show()
    else
        frame:Hide()
    end
end
