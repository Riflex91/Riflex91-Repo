local addonName, MG = ...

MG.NavigatorFrame = MG.NavigatorFrame or {}
local N = MG.NavigatorFrame
local UI = MG.UICompat
local UPDATE_INTERVAL = 0.08

local function findNavigatedRow(runtime)
    for _, candidate in ipairs(runtime and runtime.presentation and
        runtime.presentation.rows or {}) do
        if candidate.navigated then return candidate end
    end
    for _, sticky in ipairs(runtime and runtime.presentation and
        runtime.presentation.stickies or {}) do
        for _, candidate in ipairs(sticky.rows or {}) do
            if candidate.navigated then return candidate end
        end
    end
    return nil
end

function N:Create()
    if self.frame then return self.frame end

    local frame = CreateFrame("Frame", "MewthischGuides1Navigator", UIParent)
    UI:SetSize(frame, 176, 108)
    frame:SetPoint("CENTER", UIParent, "CENTER", 330, 210)
    frame:SetMovable(true)
    UI:SetClampedToScreen(frame, true)
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

    local bg = frame:CreateTexture(nil, "BACKGROUND")
    bg:SetAllPoints()
    UI:SetSolid(bg, 0.02, 0.025, 0.03, 0.88)

    local arrow = frame:CreateTexture(nil, "ARTWORK")
    arrow:SetTexture("Interface\\Minimap\\MinimapArrow")
    UI:SetSize(arrow, 46, 46)
    arrow:SetPoint("TOP", 0, -5)

    local noDirection = frame:CreateFontString(nil, "OVERLAY",
        UI:SafeFont("GameFontHighlightSmall", "GameFontNormalSmall"))
    noDirection:SetPoint("TOP", 0, -18)
    noDirection:SetText("")
    if noDirection.SetTextColor then noDirection:SetTextColor(1, 0.75, 0.1) end

    local distance = frame:CreateFontString(nil, "OVERLAY",
        UI:SafeFont("GameFontNormal", "GameFontNormal"))
    distance:SetPoint("TOP", 0, -53)

    local target = frame:CreateFontString(nil, "OVERLAY",
        UI:SafeFont("GameFontHighlightSmall", "GameFontNormalSmall"))
    target:SetPoint("TOP", distance, "BOTTOM", 0, -4)
    target:SetWidth(164)
    target:SetJustifyH("CENTER")

    self.frame = frame
    self.arrow = arrow
    self.noDirection = noDirection
    self.distance = distance
    self.target = target

    local elapsed = 0
    frame:SetScript("OnUpdate", function(_, delta)
        elapsed = elapsed + (tonumber(delta) or 0)
        if elapsed < UPDATE_INTERVAL then return end
        elapsed = 0
        N:RefreshLive()
    end)

    return frame
end

function N:RefreshLive()
    local frame = self:Create()
    local runtime = MG.RuntimeStore and MG.RuntimeStore:Get() or nil
    local nav = runtime and runtime.navigation

    if not nav or not nav.waypoint then
        self.arrow:Hide()
        self.noDirection:SetText("")
        self.distance:SetText("")
        self.target:SetText("Kein Navigationsziel")
        UI:SetShown(frame, MG.db and MG.db.settings and
            MG.db.settings.showNavigator ~= false)
        return
    end

    local position = MG.PositionFacts and MG.PositionFacts:Snapshot() or {}
    local distance, distanceMode
    if MG.NavigationDistance then
        distance, distanceMode = MG.NavigationDistance:Between(
            position, nav.waypoint)
    end

    if distance and (distanceMode == "world_coordinates" or
       distanceMode == "map_world_size") then
        local meters = distance * 0.9144
        if meters >= 1000 then
            self.distance:SetText(string.format("%.2f km", meters / 1000))
        else
            self.distance:SetText(string.format("%.0f m", meters))
        end
    elseif distance and distanceMode == "normalized_map_distance" then
        self.distance:SetText(string.format("%.1f%% Karte", distance * 100))
    else
        self.distance:SetText("")
    end

    local facing
    if GetPlayerFacing then
        local ok, value = pcall(GetPlayerFacing)
        if ok then facing = value end
    end

    local bearing
    if MG.NavigationBearing then
        bearing = MG.NavigationBearing:Resolve(position, nav.waypoint, facing)
    end

    if bearing and bearing.reliable and bearing.relative ~= nil and
       self.arrow.SetRotation then
        self.noDirection:SetText("")
        self.arrow:Show()
        local ok = pcall(self.arrow.SetRotation, self.arrow, bearing.relative)
        if not ok then
            self.arrow:Hide()
            self.noDirection:SetText("Richtung ?")
        end
    else
        self.arrow:Hide()
        self.noDirection:SetText("Richtung ?")
    end

    local row = findNavigatedRow(runtime)
    self.target:SetText(row and row.text or
        (nav.waypoint.mapName and ("Ziel in " .. tostring(nav.waypoint.mapName)) or
         "Aktuelles Ziel"))

    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        local diagnostic = {
            build = MG.BUILD,
            runtimeRevision = runtime.revision,
            stepID = runtime.stepID,
            stepIndex = runtime.stepIndex,
            goalID = nav.goalState and nav.goalState.id or nil,
            goalAction = nav.goalState and nav.goalState.action or nil,
            position = position,
            waypoint = nav.waypoint,
            distance = distance,
            distanceMode = distanceMode,
            playerFacing = facing,
            arrowHasSetRotation = self.arrow.SetRotation and true or false,
            bearing = bearing,
            targetText = row and row.text or nil,
        }
        MG.db.runtime.navigator = diagnostic

        local signature = table.concat({
            tostring(diagnostic.runtimeRevision or "-"),
            tostring(diagnostic.stepID or "-"),
            tostring(diagnostic.goalID or "-"),
            tostring(diagnostic.distanceMode or "-"),
            tostring(bearing and bearing.reason or "-"),
            tostring(diagnostic.arrowHasSetRotation),
        }, "|")
        if self.lastDiagnosticSignature ~= signature then
            self.lastDiagnosticSignature = signature
            MG:Log("INFO", "navigator.snapshot",
                "Live-Navigatorzustand erfasst.", diagnostic)
        end
    end

    UI:SetShown(frame, MG.db and MG.db.settings and
        MG.db.settings.showNavigator ~= false)
end

function N:Refresh()
    self:Create()
    self:RefreshLive()
end
