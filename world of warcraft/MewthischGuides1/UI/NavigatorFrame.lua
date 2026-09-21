local addonName, MG = ...

MG.NavigatorFrame = MG.NavigatorFrame or {}
local N = MG.NavigatorFrame

function N:Create()
    if self.frame then return self.frame end
    local frame = CreateFrame("Frame", "MewthischGuides1Navigator", UIParent)
    frame:SetSize(190, 126)
    frame:SetPoint("CENTER", UIParent, "CENTER", 330, 210)
    frame:SetMovable(true)
    frame:EnableMouse(true)
    frame:RegisterForDrag("LeftButton")
    frame:SetScript("OnDragStart", function(self)
        if not (InCombatLockdown and InCombatLockdown()) then self:StartMoving() end
    end)
    frame:SetScript("OnDragStop", function(self) self:StopMovingOrSizing() end)

    local bg = frame:CreateTexture(nil, "BACKGROUND")
    bg:SetAllPoints()
    bg:SetColorTexture(0.02, 0.025, 0.03, 0.94)

    local title = frame:CreateFontString(nil, "OVERLAY", "GameFontNormal")
    title:SetPoint("TOPLEFT", 8, -8)
    title:SetText("Navigator")

    local arrow = frame:CreateFontString(nil, "OVERLAY", "GameFontNormalHuge")
    arrow:SetPoint("TOP", 0, -25)
    arrow:SetText("↑")
    arrow:SetTextColor(1, 0.75, 0.1)

    local distance = frame:CreateFontString(nil, "OVERLAY", "GameFontNormalLarge")
    distance:SetPoint("TOP", arrow, "BOTTOM", 0, 0)

    local target = frame:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
    target:SetPoint("TOP", distance, "BOTTOM", 0, -4)
    target:SetWidth(174)
    target:SetJustifyH("CENTER")

    self.frame, self.arrow, self.distance, self.target = frame, arrow, distance, target
    return frame
end

function N:Refresh()
    local frame = self:Create()
    local runtime = MG.RuntimeStore:Get()
    local nav = runtime and runtime.navigation
    if not nav or not nav.waypoint then
        self.distance:SetText("")
        self.target:SetText("Kein Navigationsziel")
        frame:SetShown(MG.db.settings.showNavigator ~= false)
        return
    end

    local yards = MG.NavigationDistance:Between(
        runtime.facts and runtime.facts.position, nav.waypoint)
    self.distance:SetText(yards and string.format("%.0f m", yards * 0.9144) or "")
    local row
    for _, candidate in ipairs(runtime.presentation and runtime.presentation.rows or {}) do
        if candidate.navigated then row = candidate break end
    end
    self.target:SetText(row and row.text or "Aktuelles Ziel")
    frame:SetShown(MG.db.settings.showNavigator ~= false)
end
