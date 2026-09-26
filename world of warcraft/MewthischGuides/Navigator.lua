local addonName, MG = ...

local navigator = {}
local UPDATE_INTERVAL = 0.06
local TEXTURE_ZERO_OFFSET = 0

local function savePosition(frame)
    local x, y = frame:GetCenter()
    local ux, uy = UIParent:GetCenter()

    if x and y and ux and uy then
        MG.db.settings.navigatorX = x - ux
        MG.db.settings.navigatorY = y - uy

        MG:Log("INFO", "navigator.moved", "Navigator verschoben.", {
            x = MG.db.settings.navigatorX,
            y = MG.db.settings.navigatorY,
        })
    end
end

local function applyPosition(frame)
    frame:ClearAllPoints()
    frame:SetPoint("CENTER", UIParent, "CENTER",
        tonumber(MG.db.settings.navigatorX) or 0,
        tonumber(MG.db.settings.navigatorY) or 235)
end

local function applyScale(frame)
    local scale = tonumber(MG.db.settings.navigatorScale) or 1.15
    if scale < 0.7 then scale = 0.7 end
    if scale > 1.7 then scale = 1.7 end

    MG.db.settings.navigatorScale = scale
    frame:SetScale(scale)
end

function MG:InitializeNavigator()
    if navigator.frame then
        self:RefreshNavigator()
        return
    end

    local frame = CreateFrame("Frame", "MewthischGuidesNavigatorFrame", UIParent)
    frame:SetSize(124, 132)
    frame:SetClampedToScreen(true)
    frame:SetMovable(true)
    frame:EnableMouse(true)
    frame:EnableMouseWheel(true)
    frame:RegisterForDrag("LeftButton")
    frame:SetFrameStrata("HIGH")
    navigator.frame = frame

    -- Intentionally no background, border or panel.
    local arrow = frame:CreateTexture(nil, "ARTWORK")
    local atlasSet = false
    if arrow.SetAtlas then
        atlasSet = pcall(arrow.SetAtlas, arrow, "UI-HUD-Minimap-Arrow-Player", false)
    end
    if not atlasSet then
        arrow:SetTexture("Interface\\Minimap\\MinimapArrow")
    end
    -- Always force an explicit size. SetAtlas(..., true) previously used the
    -- atlas' tiny native dimensions, making the distance text visually larger
    -- than the direction arrow.
    arrow:SetSize(104, 104)
    arrow:SetPoint("TOP", 0, 4)
    navigator.arrow = arrow

    local distance = frame:CreateFontString(nil, "OVERLAY", "GameFontNormal")
    local distanceFont, _, distanceFlags = distance:GetFont()
    if distanceFont then distance:SetFont(distanceFont, 12, distanceFlags) end
    distance:SetPoint("TOP", arrow, "BOTTOM", 0, 0)
    distance:SetTextColor(0.78, 0.94, 1.0, 1.0)
    distance:SetText("")
    navigator.distance = distance

    frame:SetScript("OnDragStart", function(self)
        if MG.db.settings.navigatorLocked then return end
        if InCombatLockdown and InCombatLockdown() then return end
        self:StartMoving()
    end)

    frame:SetScript("OnDragStop", function(self)
        self:StopMovingOrSizing()
        savePosition(self)
    end)

    frame:SetScript("OnMouseWheel", function(self, delta)
        if MG.db.settings.navigatorLocked then return end

        local scale = (tonumber(MG.db.settings.navigatorScale) or 1.0) +
            (delta > 0 and 0.05 or -0.05)

        MG:SetNavigatorScale(scale)
    end)

    frame:SetScript("OnMouseUp", function(_, button)
        if button == "RightButton" then MG:ToggleSettings() end
    end)

    frame:SetScript("OnEnter", function(self)
        if not GameTooltip then return end

        GameTooltip:SetOwner(self, "ANCHOR_RIGHT")
        GameTooltip:AddLine("Mewthisch Guides Navigator")

        if MG.db.settings.navigatorLocked then
            GameTooltip:AddLine("Navigator ist gesperrt", 1, 0.82, 0.2)
        else
            GameTooltip:AddLine("Ziehen: verschieben", 1, 1, 1)
            GameTooltip:AddLine("Mausrad: skalieren", 1, 1, 1)
        end

        GameTooltip:AddLine("Rechtsklick: Optionen", 1, 1, 1)

        local nav = MG.navigation or {}
        if nav.source then
            GameTooltip:AddLine("Quelle: " .. tostring(nav.source), 0.65, 0.8, 1.0)
        end
        if nav.directionSource then
            GameTooltip:AddLine("Richtung: " .. tostring(nav.directionSource), 0.65, 0.8, 1.0)
        end

        GameTooltip:Show()
    end)

    frame:SetScript("OnLeave", function()
        if GameTooltip then GameTooltip:Hide() end
    end)

    local elapsed = 0

    frame:SetScript("OnUpdate", function(_, delta)
        elapsed = elapsed + delta
        if elapsed < UPDATE_INTERVAL then return end
        elapsed = 0

        MG:Safe("navigator.update", function()
            MG:UpdateNavigationRealtime()
            MG:RefreshNavigator()
        end)
    end)

    applyPosition(frame)
    applyScale(frame)
    self:RefreshNavigator()

    self:Log("INFO", "navigator.initialized",
        "Transparenter Step-2-Navigator initialisiert.")
end

function MG:SetNavigatorScale(scale)
    scale = tonumber(scale) or 1.15
    if scale < 0.7 then scale = 0.7 end
    if scale > 1.7 then scale = 1.7 end

    self.db.settings.navigatorScale = scale

    if navigator.frame then applyScale(navigator.frame) end
    self:RefreshSettings()

    self:Log("INFO", "navigator.scale", "Navigator-Skalierung geändert.", {
        scale = scale,
    })
end

function MG:ResetNavigatorPosition()
    self.db.settings.navigatorX = 0
    self.db.settings.navigatorY = 235
    self.db.settings.navigatorScale = 1.15

    if navigator.frame then
        applyPosition(navigator.frame)
        applyScale(navigator.frame)
    end

    self:Log("INFO", "navigator.reset", "Navigator-Position zurückgesetzt.")
end

function MG:ToggleNavigator()
    self.db.settings.showNavigator = not self.db.settings.showNavigator
    self:RefreshNavigator()
    self:RefreshSettings()

    self:Log("INFO", "navigator.toggle", "Navigator umgeschaltet.", {
        shown = self.db.settings.showNavigator,
    })
end

function MG:RefreshNavigator()
    if not navigator.frame or not self.db then return end

    if not self.db.settings.showNavigator then
        navigator.frame:Hide()
        return
    end

    local step = self.currentStep
    local nav = self.navigation or {}

    if not step then
        navigator.frame:Hide()
        return
    end

    navigator.frame:Show()

    if nav.distanceMeters then
        if nav.distanceMeters >= 1000 then
            navigator.distance:SetText(string.format("%.2f km", nav.distanceMeters / 1000))
        else
            navigator.distance:SetText(string.format("%.0f m", nav.distanceMeters))
        end
    else
        navigator.distance:SetText("")
    end

    if nav.directionReliable and nav.relativeAngle ~= nil and navigator.arrow.SetRotation then
        navigator.arrow:Show()
        navigator.arrow:SetAlpha(1.0)

        local rotation = nav.relativeAngle + TEXTURE_ZERO_OFFSET
        local rotated, err = pcall(navigator.arrow.SetRotation, navigator.arrow, rotation)
        if not rotated then
            MG:Log("WARN", "navigator.rotation_failed", tostring(err), {
                relativeAngle = nav.relativeAngle,
                directionSource = nav.directionSource,
            })
        end

        navigator.frame:EnableMouse(true)
    else
        -- Never show a guessed direction.
        navigator.arrow:Hide()
        navigator.frame:EnableMouse(true)
    end
end
