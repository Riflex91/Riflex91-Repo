local addonName, MG = ...

MG.SettingsWindow = MG.SettingsWindow or {}
local S = MG.SettingsWindow
local UI = MG.UICompat

local WIDTH = 360
local ROW_HEIGHT = 34

local OPTIONS = {
    { key="showNavigator", label="Navigator anzeigen" },
    { key="autoAdvance", label="Schritte automatisch weiterschalten" },
    { key="showPassiveHints", label="Passive Hinweise anzeigen" },
    { key="showCompletedGoals", label="Abgeschlossene Ziele anzeigen" },
    { key="diagnostics", label="Diagnoseprotokoll aktivieren" },
}

local function makeSolid(parent, layer, r, g, b, a)
    local t = parent:CreateTexture(nil, layer or "BACKGROUND")
    UI:SetSolid(t, r, g, b, a)
    return t
end

local function setFontShadow(font)
    if not font then return end
    if font.SetShadowColor then font:SetShadowColor(0, 0, 0, 1) end
    if font.SetShadowOffset then font:SetShadowOffset(1, -1) end
end

local function makeButton(parent, text, width, height, callback)
    local button = CreateFrame("Button", nil, parent)
    UI:SetSize(button, width, height)

    local bg = makeSolid(button, "BACKGROUND", 0.10, 0.07, 0.03, 1)
    bg:SetAllPoints()

    local border = makeSolid(button, "BORDER", 0.78, 0.47, 0.08, 0.9)
    border:SetPoint("TOPLEFT")
    border:SetPoint("TOPRIGHT")
    border:SetHeight(1)

    local label = button:CreateFontString(nil, "OVERLAY",
        UI:SafeFont("GameFontNormal", "GameFontNormal"))
    label:SetPoint("CENTER")
    label:SetText(text)
    if label.SetTextColor then label:SetTextColor(1, 0.74, 0.12) end
    setFontShadow(label)

    button:SetScript("OnEnter", function()
        UI:SetSolid(bg, 0.19, 0.11, 0.03, 1)
    end)
    button:SetScript("OnLeave", function()
        UI:SetSolid(bg, 0.10, 0.07, 0.03, 1)
    end)
    button:SetScript("OnClick", callback)
    button.label = label
    return button
end

function S:Create()
    if self.frame then return self.frame end

    local height = 92 + #OPTIONS * ROW_HEIGHT + 58
    local frame = CreateFrame("Frame", "MewthischGuides1Settings", UIParent)
    UI:SetSize(frame, WIDTH, height)
    frame:SetPoint("CENTER", UIParent, "CENTER", 0, 20)
    UI:SetFrameStrata(frame, "FULLSCREEN_DIALOG")
    UI:SetClampedToScreen(frame, true)
    frame:SetMovable(true)
    frame:EnableMouse(true)
    if frame.RegisterForDrag then frame:RegisterForDrag("LeftButton") end
    frame:SetScript("OnDragStart", function(self)
        if not (InCombatLockdown and InCombatLockdown()) and self.StartMoving then
            self:StartMoving()
        end
    end)
    frame:SetScript("OnDragStop", function(self)
        if self.StopMovingOrSizing then self:StopMovingOrSizing() end
    end)

    local bg = makeSolid(frame, "BACKGROUND", 0.012, 0.015, 0.020, 1)
    bg:SetAllPoints()

    local header = makeSolid(frame, "BORDER", 0.035, 0.040, 0.050, 1)
    header:SetPoint("TOPLEFT", 1, -1)
    header:SetPoint("TOPRIGHT", -1, -1)
    header:SetHeight(34)

    local topLine = makeSolid(frame, "ARTWORK", 0.95, 0.56, 0.06, 1)
    topLine:SetPoint("TOPLEFT", 1, -1)
    topLine:SetPoint("TOPRIGHT", -1, -1)
    topLine:SetHeight(1)

    local title = frame:CreateFontString(nil, "OVERLAY",
        UI:SafeFont("GameFontNormalLarge", "GameFontNormal"))
    title:SetPoint("TOPLEFT", 12, -9)
    title:SetText("Mewthisch Guides - Einstellungen")
    if title.SetTextColor then title:SetTextColor(1, 0.74, 0.10) end
    setFontShadow(title)

    local close = makeButton(frame, "x", 24, 22, function() frame:Hide() end)
    close:SetPoint("TOPRIGHT", -6, -6)

    local subtitle = frame:CreateFontString(nil, "OVERLAY",
        UI:SafeFont("GameFontHighlightSmall", "GameFontNormalSmall"))
    subtitle:SetPoint("TOPLEFT", 12, -48)
    subtitle:SetText("Änderungen werden sofort gespeichert.")
    if subtitle.SetTextColor then subtitle:SetTextColor(0.72, 0.72, 0.72) end
    setFontShadow(subtitle)

    local rows = {}
    for i, option in ipairs(OPTIONS) do
        local y = -76 - (i - 1) * ROW_HEIGHT

        local label = frame:CreateFontString(nil, "OVERLAY",
            UI:SafeFont("GameFontHighlight", "GameFontNormal"))
        label:SetPoint("TOPLEFT", 14, y)
        label:SetWidth(245)
        label:SetJustifyH("LEFT")
        label:SetText(option.label)
        setFontShadow(label)

        local toggle = makeButton(frame, "", 68, 24, function()
            local db = MG:EnsureDB()
            db.settings[option.key] = not db.settings[option.key]
            S:Refresh()
            if MG.RefreshUI then MG:RefreshUI() end
        end)
        toggle:SetPoint("TOPRIGHT", -14, y + 5)
        rows[#rows + 1] = { option=option, button=toggle }
    end

    local reset = makeButton(frame, "Fensterpositionen zurücksetzen", 230, 26, function()
        local db = MG:EnsureDB()
        db.ui = {}
        if MG.GuideViewer and MG.GuideViewer.frame then
            local f = MG.GuideViewer.frame
            if f.ClearAllPoints then f:ClearAllPoints() end
            f:SetPoint("LEFT", UIParent, "LEFT", 24, 80)
        end
        if MG.NavigatorFrame and MG.NavigatorFrame.frame then
            local f = MG.NavigatorFrame.frame
            if f.ClearAllPoints then f:ClearAllPoints() end
            f:SetPoint("CENTER", UIParent, "CENTER", 330, 210)
        end
    end)
    reset:SetPoint("BOTTOM", 0, 16)

    self.frame = frame
    self.rows = rows
    frame:Hide()
    return frame
end

function S:Refresh()
    self:Create()
    local db = MG:EnsureDB()
    for _, row in ipairs(self.rows or {}) do
        local enabled = db.settings[row.option.key] and true or false
        row.button.label:SetText(enabled and "AN" or "AUS")
        if row.button.label.SetTextColor then
            if enabled then
                row.button.label:SetTextColor(0.35, 0.95, 0.48)
            else
                row.button.label:SetTextColor(0.95, 0.42, 0.32)
            end
        end
    end
end

function S:Toggle(force)
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
