local addonName, MG = ...

MG.NavigatorFrame = MG.NavigatorFrame or {}
local N = MG.NavigatorFrame
local UI = MG.UICompat
local UPDATE_INTERVAL = 0.06
local TEXTURE_ZERO_OFFSET = 0

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

local function setFontShadow(font)
    if not font then return end
    if font.SetShadowColor then font:SetShadowColor(0, 0, 0, 1) end
    if font.SetShadowOffset then font:SetShadowOffset(1, -1) end
end

function N:Create()
    if self.frame then return self.frame end

    local frame = CreateFrame("Frame", "MewthischGuides1Navigator", UIParent)
    UI:SetSize(frame, 150, 112)
    frame:SetPoint("CENTER", UIParent, "CENTER", 330, 210)
    frame:SetMovable(true)
    UI:SetClampedToScreen(frame, true)
    UI:SetFrameStrata(frame, "HIGH")
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

    -- Deliberately no opaque panel. The navigator should float above the
    -- world like Zygor/TomTom rather than cover gameplay.
    local glow = frame:CreateTexture(nil, "BACKGROUND")
    glow:SetPoint("CENTER", 0, 12)
    UI:SetSize(glow, 82, 82)
    UI:SetSolid(glow, 0, 0, 0, 0.24)

    local arrow = frame:CreateTexture(nil, "ARTWORK")
    local atlasSet = false
    if arrow.SetAtlas then
        atlasSet = pcall(arrow.SetAtlas, arrow, "UI-HUD-Minimap-Arrow-Player", true)
    end
    if not atlasSet then
        arrow:SetTexture("Interface\Minimap\MinimapArrow")
        UI:SetSize(arrow, 64, 64)
    end
    if arrow.GetWidth and (not arrow:GetWidth() or arrow:GetWidth() < 48) then
        UI:SetSize(arrow, 64, 64)
    end
    arrow:SetPoint("TOP", 0, 4)

    local unavailable = frame:CreateFontString(nil, "OVERLAY",
        UI:SafeFont("GameFontNormalLarge", "GameFontNormal"))
    unavailable:SetPoint("TOP", 0, -10)
    unavailable:SetText("")
    if unavailable.SetTextColor then unavailable:SetTextColor(1, 0.72, 0.08) end
    setFontShadow(unavailable)

    local distance = frame:CreateFontString(nil, "OVERLAY",
        UI:SafeFont("GameFontNormalLarge", "GameFontNormal"))
    distance:SetPoint("TOP", 0, -58)
    if distance.SetTextColor then distance:SetTextColor(1, 0.82, 0.18) end
    setFontShadow(distance)

    local target = frame:CreateFontString(nil, "OVERLAY",
        UI:SafeFont("GameFontHighlightSmall", "GameFontNormalSmall"))
    target:SetPoint("TOP", distance, "BOTTOM", 0, -3)
    target:SetWidth(148)
    target:SetJustifyH("CENTER")
    setFontShadow(target)

    self.frame = frame
    self.arrow = arrow
    self.glow = glow
    self.unavailable = unavailable
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
        self.glow:Hide()
        self.unavailable:SetText("")
        self.distance:SetText("")
        self.target:SetText("")
        UI:SetShown(frame, false)
        return
    end

    local position = MG.PositionFacts and MG.PositionFacts:Snapshot() or {}
    local distance, distanceMode, distanceDetail
    if MG.NavigationDistance then
        distance, distanceMode, distanceDetail =
            MG.NavigationDistance:Between(position, nav.waypoint)
    end

    if distance and (
        distanceMode == "restedxp_world_coordinates" or
        distanceMode == "world_coordinates" or
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

    local bearing, bearingReason
    if MG.NavigationBearing then
        bearing, bearingReason =
            MG.NavigationBearing:Resolve(position, nav.waypoint, facing)
    end

    local arrowUsable = bearing and bearing.reliable and
        bearing.relative ~= nil and self.arrow.SetRotation

    if arrowUsable then
        local ok = pcall(
            self.arrow.SetRotation,
            self.arrow,
            bearing.relative + TEXTURE_ZERO_OFFSET)
        if ok then
            self.unavailable:SetText("")
            self.glow:Show()
            self.arrow:Show()
            if self.arrow.SetAlpha then self.arrow:SetAlpha(1) end
        else
            self.arrow:Hide()
            self.glow:Hide()
            self.unavailable:SetText("?")
        end
    else
        self.arrow:Hide()
        self.glow:Hide()
        -- Do not pretend a guessed direction is valid. A small '?' is less
        -- misleading than a static arrow pointing somewhere arbitrary.
        self.unavailable:SetText("?")
    end

    local row = findNavigatedRow(runtime)
    self.target:SetText(row and row.text or
        (nav.waypoint.mapName and ("Ziel: " .. tostring(nav.waypoint.mapName)) or
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
            distanceDetail = distanceDetail,
            playerFacing = facing,
            arrowHasSetRotation = self.arrow.SetRotation and true or false,
            arrowShown = arrowUsable and true or false,
            bearing = bearing,
            bearingReason = bearingReason,
            targetText = row and row.text or nil,
        }
        MG.db.runtime.navigator = diagnostic

        local signature = table.concat({
            tostring(diagnostic.runtimeRevision or "-"),
            tostring(diagnostic.stepID or "-"),
            tostring(diagnostic.goalID or "-"),
            tostring(diagnostic.distanceMode or "-"),
            tostring(bearing and bearing.reason or bearingReason or "-"),
            tostring(diagnostic.arrowHasSetRotation),
            tostring(diagnostic.arrowShown),
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
