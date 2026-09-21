local addonName, MG = ...

MG.NavigatorFrame = MG.NavigatorFrame or {}
local N = MG.NavigatorFrame
local UI = MG.UICompat

function N:Create()
    if self.frame then return self.frame end

    local frame = CreateFrame("Frame", "MewthischGuides1Navigator", UIParent)
    UI:SetSize(frame, 190, 126)
    frame:SetPoint("CENTER", UIParent, "CENTER", 330, 210)
    frame:SetMovable(true)
    UI:SetClampedToScreen(frame, true)
    frame:EnableMouse(true)
    if frame.RegisterForDrag then frame:RegisterForDrag("LeftButton") end
    frame:SetScript("OnDragStart", function(self)
        if not (InCombatLockdown and InCombatLockdown()) and self.StartMoving then self:StartMoving() end
    end)
    frame:SetScript("OnDragStop", function(self)
        if self.StopMovingOrSizing then self:StopMovingOrSizing() end
    end)

    local bg = frame:CreateTexture(nil, "BACKGROUND")
    bg:SetAllPoints()
    UI:SetSolid(bg, 0.02, 0.025, 0.03, 0.94)

    local title = frame:CreateFontString(nil, "OVERLAY", UI:SafeFont("GameFontNormal", "GameFontNormal"))
    title:SetPoint("TOPLEFT", 8, -8)
    title:SetText("Navigator")

    local arrow = frame:CreateFontString(nil, "OVERLAY", UI:SafeFont("GameFontNormalLarge", "GameFontNormal"))
    arrow:SetPoint("TOP", 0, -28)
    arrow:SetText("^")
    if arrow.SetTextColor then arrow:SetTextColor(1, 0.75, 0.1) end

    local distance = frame:CreateFontString(nil, "OVERLAY", UI:SafeFont("GameFontNormalLarge", "GameFontNormal"))
    distance:SetPoint("TOP", arrow, "BOTTOM", 0, 0)

    local target = frame:CreateFontString(nil, "OVERLAY", UI:SafeFont("GameFontHighlightSmall", "GameFontNormalSmall"))
    target:SetPoint("TOP", distance, "BOTTOM", 0, -4)
    target:SetWidth(174)
    target:SetJustifyH("CENTER")

    self.frame, self.arrow, self.distance, self.target = frame, arrow, distance, target
    return frame
end

function N:Refresh()
    local frame = self:Create()
    local runtime = MG.RuntimeStore and MG.RuntimeStore:Get() or nil
    local nav = runtime and runtime.navigation

    if not nav or not nav.waypoint then
        self.distance:SetText("")
        self.target:SetText("Kein Navigationsziel")
        UI:SetShown(frame, MG.db and MG.db.settings and MG.db.settings.showNavigator ~= false)
        return
    end

    local yards = MG.NavigationDistance and MG.NavigationDistance:Between(
        runtime.facts and runtime.facts.position, nav.waypoint)
    self.distance:SetText(yards and string.format("%.0f m", yards * 0.9144) or "")

    local row
    for _, candidate in ipairs(runtime.presentation and runtime.presentation.rows or {}) do
        if candidate.navigated then row = candidate break end
    end
    self.target:SetText(row and row.text or "Aktuelles Ziel")
    UI:SetShown(frame, MG.db.settings.showNavigator ~= false)
end
