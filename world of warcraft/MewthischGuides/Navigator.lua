local addonName, MG = ...

local navigator = {}
local UPDATE_INTERVAL = 0.06
local TEXTURE_ZERO_OFFSET = 0
local ARROW_SIZE = 83

local ARROW_SKIN_ORDER = {
    "arrow-blue",
    "arrow-red",
    "arrow-orange",
    "compass-black",
    "pointer-black",
}

local ARROW_SKINS = {
    ["compass-black"] = {
        label = "Kompass Schwarz",
        atlas = "UI-HUD-Minimap-Arrow-Player",
        fallbackTexture = "Interface\\Minimap\\MinimapArrow",
        tint = {0.04, 0.04, 0.04, 1},
    },
    ["pointer-black"] = {
        label = "Zeiger Schwarz",
        texture = "Interface\\Minimap\\MinimapArrow",
        tint = {0.04, 0.04, 0.04, 1},
    },
    ["arrow-blue"] = {
        label = "Pfeil Blau",
        texture = "Interface\\AddOns\\MewthischGuides\\Assets\\ArrowBlue",
        tint = {1, 1, 1, 1},
    },
    ["arrow-red"] = {
        label = "Pfeil Rot",
        texture = "Interface\\AddOns\\MewthischGuides\\Assets\\ArrowRed",
        tint = {1, 1, 1, 1},
    },
    ["arrow-orange"] = {
        label = "Pfeil Orange",
        texture = "Interface\\AddOns\\MewthischGuides\\Assets\\ArrowOrange",
        tint = {1, 1, 1, 1},
    },
}

local function applyArrowSkin(arrow, size, remember)
    if not arrow or not MG.db or not MG.db.settings then return end

    local skinID = MG.db.settings.navigatorArrowSkin or "arrow-blue"
    local skin = ARROW_SKINS[skinID] or ARROW_SKINS["arrow-blue"]
    if not ARROW_SKINS[skinID] then
        skinID = "arrow-blue"
        MG.db.settings.navigatorArrowSkin = skinID
    end

    local applied = false
    if skin.atlas and arrow.SetAtlas then
        applied = pcall(arrow.SetAtlas, arrow, skin.atlas, false)
    end
    if not applied then
        arrow:SetTexture(skin.texture or skin.fallbackTexture)
    end

    if arrow.SetVertexColor then
        local tint = skin.tint or {1, 1, 1, 1}
        arrow:SetVertexColor(
            tint[1] or 1, tint[2] or 1, tint[3] or 1, tint[4] or 1)
    end

    local appliedSize = tonumber(size) or ARROW_SIZE
    arrow:SetSize(appliedSize, appliedSize)
    if remember ~= false then navigator.arrowSkinID = skinID end
end

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
    frame:SetSize(104, 130)
    frame:SetClampedToScreen(true)
    frame:SetMovable(true)
    frame:EnableMouse(true)
    frame:EnableMouseWheel(true)
    frame:RegisterForDrag("LeftButton")
    frame:SetFrameStrata("HIGH")
    navigator.frame = frame

    -- Intentionally no background, border or panel.
    local arrow = frame:CreateTexture(nil, "ARTWORK")
    arrow:SetPoint("TOP", 0, 4)
    navigator.arrow = arrow
    applyArrowSkin(arrow)

    local distance = frame:CreateFontString(nil, "OVERLAY", "GameFontNormal")
    local distanceFont, _, distanceFlags = distance:GetFont()
    if distanceFont then distance:SetFont(distanceFont, 12, distanceFlags) end
    distance:SetPoint("TOP", arrow, "BOTTOM", 0, 0)
    distance:SetTextColor(0.78, 0.94, 1.0, 1.0)
    distance:SetText("")
    navigator.distance = distance

    local eta = frame:CreateFontString(nil, "OVERLAY", "GameFontNormalSmall")
    local etaFont, _, etaFlags = eta:GetFont()
    if etaFont then eta:SetFont(etaFont, 11, etaFlags) end
    eta:SetPoint("TOP", distance, "BOTTOM", 0, -1)
    eta:SetTextColor(0.75, 0.82, 0.88, 1.0)
    eta:SetText("")
    navigator.eta = eta

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

function MG:GetNavigatorArrowSkinName()
    local skinID = self.db and self.db.settings and
        self.db.settings.navigatorArrowSkin or "arrow-blue"
    local skin = ARROW_SKINS[skinID] or ARROW_SKINS["arrow-blue"]
    return skin.label, skinID
end

function MG:ApplyNavigatorArrowSkinPreview(texture, size)
    if not texture then return false end
    applyArrowSkin(texture, tonumber(size) or 92, false)
    return true
end

function MG:SetNavigatorArrowSkin(skinID)
    if not ARROW_SKINS[skinID] then return false end

    self.db.settings.navigatorArrowSkin = skinID
    if navigator.arrow then applyArrowSkin(navigator.arrow) end
    if self.RefreshSettings then self:RefreshSettings() end

    self:Log("INFO", "navigator.arrow_skin",
        "Navigator-Pfeil-Skin geändert.", {
            skin = skinID,
            label = ARROW_SKINS[skinID].label,
        })
    return true
end

function MG:NextNavigatorArrowSkin()
    local current = self.db.settings.navigatorArrowSkin or "arrow-blue"
    local index = 1
    for i, skinID in ipairs(ARROW_SKIN_ORDER) do
        if skinID == current then index = i break end
    end

    index = index + 1
    if index > #ARROW_SKIN_ORDER then index = 1 end
    return self:SetNavigatorArrowSkin(ARROW_SKIN_ORDER[index])
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
        if navigator.arrow then applyArrowSkin(navigator.arrow) end
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

local function formatETA(seconds)
    seconds = tonumber(seconds)
    if not seconds then return "" end
    seconds = math.max(0, math.floor(seconds + 0.5))
    if seconds >= 3600 then
        local h = math.floor(seconds / 3600)
        local m = math.floor((seconds % 3600) / 60)
        local s = seconds % 60
        return string.format("%d:%02d:%02d", h, m, s)
    end
    return string.format("%d:%02d", math.floor(seconds / 60), seconds % 60)
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

    if navigator.eta then
        if self.db.settings.travelShowEstimatedTime ~= false and nav.etaSeconds ~= nil then
            navigator.eta:SetText("ETA ≈ " .. formatETA(nav.etaSeconds))
        else
            navigator.eta:SetText("")
        end
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
