local addonName, MG = ...

MG.Themes = MG.Themes or {}
local Themes = MG.Themes

Themes.order = {
    "ElvUI",
    "EllesmereUI",
    "ToxiUI",
    "Forever Classic",
    "Obsidian",
    "Arcane",
    "Warcraft Heritage",
}

Themes.definitions = {
    ["ElvUI"] = {
        description = "Passt sich automatisch an die Standard-Skins von ElvUI an",
        background = {0.055, 0.055, 0.055, 0.96},
        panel = {0.085, 0.085, 0.085, 0.98},
        header = {0.045, 0.045, 0.045, 1.00},
        border = {0.15, 0.15, 0.15, 1.00},
        accent = {0.10, 0.64, 0.82, 1.00},
        text = {0.90, 0.90, 0.90, 1.00},
        muted = {0.58, 0.58, 0.58, 1.00},
        active = {0.10, 0.10, 0.10, 1.00},
        complete = {0.08, 0.30, 0.17, 1.00},
        danger = {0.40, 0.10, 0.10, 1.00},
        progress = {0.10, 0.64, 0.82, 1.00},
        borderSize = 1,
        rowGap = 1,
        adaptiveElvUI = true,
    },

    ["EllesmereUI"] = {
        description = "Passt sich an EllesmereUI-Fenster, Akzentfarbe und Schrift an",
        background = {0.035, 0.045, 0.055, 0.98},
        panel = {0.050, 0.065, 0.080, 0.98},
        header = {0.025, 0.035, 0.045, 1.00},
        border = {0.10, 0.12, 0.14, 1.00},
        accent = {0.047, 0.824, 0.616, 1.00},
        text = {0.95, 0.97, 0.98, 1.00},
        muted = {0.58, 0.64, 0.68, 1.00},
        active = {0.055, 0.115, 0.105, 1.00},
        complete = {0.045, 0.31, 0.22, 1.00},
        danger = {0.42, 0.10, 0.12, 1.00},
        progress = {0.047, 0.824, 0.616, 1.00},
        borderSize = 1,
        rowGap = 1,
        adaptiveEllesmereUI = true,
    },

    ["ToxiUI"] = {
        description = "Dunkler ToxiUI-Look mit Toxi-Blau und ElvUI-Profilfarben",
        background = {0.102, 0.102, 0.102, 0.98},
        panel = {0.161, 0.161, 0.161, 0.98},
        header = {0.060, 0.060, 0.060, 1.00},
        border = {0.00, 0.00, 0.00, 1.00},
        accent = {0.094, 0.659, 1.00, 1.00},
        text = {0.96, 0.96, 0.96, 1.00},
        muted = {0.56, 0.59, 0.62, 1.00},
        active = {0.07, 0.12, 0.16, 1.00},
        complete = {0.08, 0.30, 0.18, 1.00},
        danger = {0.45, 0.11, 0.12, 1.00},
        progress = {0.094, 0.659, 1.00, 1.00},
        borderSize = 1,
        rowGap = 1,
        adaptiveToxiUI = true,
    },

    ["Forever Classic"] = {
        description = "Warmer, klassischer Forever-Look",
        background = {0.055, 0.035, 0.020, 0.98},
        panel = {0.105, 0.070, 0.035, 0.98},
        header = {0.155, 0.100, 0.040, 1.00},
        border = {0.62, 0.43, 0.16, 1.00},
        accent = {1.00, 0.78, 0.20, 1.00},
        text = {1.00, 0.93, 0.78, 1.00},
        muted = {0.76, 0.66, 0.50, 1.00},
        active = {0.28, 0.20, 0.06, 1.00},
        complete = {0.10, 0.36, 0.12, 1.00},
        danger = {0.46, 0.10, 0.08, 1.00},
        progress = {0.92, 0.62, 0.10, 1.00},
        borderSize = 2,
        rowGap = 1,
    },

    ["Obsidian"] = {
        description = "Minimalistisches Schwarz-Grau-Theme",
        background = {0.018, 0.020, 0.024, 0.99},
        panel = {0.045, 0.050, 0.058, 0.99},
        header = {0.025, 0.028, 0.034, 1.00},
        border = {0.18, 0.20, 0.23, 1.00},
        accent = {0.72, 0.78, 0.86, 1.00},
        text = {0.94, 0.96, 0.98, 1.00},
        muted = {0.52, 0.57, 0.63, 1.00},
        active = {0.12, 0.16, 0.20, 1.00},
        complete = {0.08, 0.29, 0.20, 1.00},
        danger = {0.38, 0.10, 0.12, 1.00},
        progress = {0.48, 0.66, 0.82, 1.00},
        borderSize = 1,
        rowGap = 2,
    },

    ["Arcane"] = {
        description = "Leuchtendes violett-blaues Arkan-Theme",
        background = {0.035, 0.020, 0.075, 0.98},
        panel = {0.075, 0.045, 0.135, 0.98},
        header = {0.095, 0.045, 0.175, 1.00},
        border = {0.45, 0.27, 0.78, 1.00},
        accent = {0.72, 0.48, 1.00, 1.00},
        text = {0.95, 0.90, 1.00, 1.00},
        muted = {0.67, 0.59, 0.82, 1.00},
        active = {0.19, 0.09, 0.34, 1.00},
        complete = {0.08, 0.31, 0.27, 1.00},
        danger = {0.48, 0.08, 0.30, 1.00},
        progress = {0.55, 0.27, 0.95, 1.00},
        borderSize = 2,
        rowGap = 2,
    },

    ["Warcraft Heritage"] = {
        description = "Kräftiger Warcraft-Look mit Rot und Bronze",
        background = {0.075, 0.025, 0.018, 0.98},
        panel = {0.135, 0.045, 0.025, 0.98},
        header = {0.20, 0.055, 0.025, 1.00},
        border = {0.66, 0.32, 0.08, 1.00},
        accent = {1.00, 0.55, 0.12, 1.00},
        text = {1.00, 0.88, 0.67, 1.00},
        muted = {0.74, 0.56, 0.40, 1.00},
        active = {0.38, 0.12, 0.04, 1.00},
        complete = {0.10, 0.34, 0.10, 1.00},
        danger = {0.55, 0.05, 0.04, 1.00},
        progress = {0.95, 0.34, 0.06, 1.00},
        borderSize = 2,
        rowGap = 1,
    },
}

local function copyColor(value, fallback)
    local source = type(value) == "table" and value or fallback
    if type(source) ~= "table" then return {1, 1, 1, 1} end
    return {
        tonumber(source[1] or source.r) or 1,
        tonumber(source[2] or source.g) or 1,
        tonumber(source[3] or source.b) or 1,
        tonumber(source[4] or source.a) or 1,
    }
end

local function cloneTheme(theme)
    local out = {}
    for key, value in pairs(theme or {}) do
        if type(value) == "table" then out[key] = copyColor(value)
        else out[key] = value end
    end
    return out
end

local function validColor(value)
    return type(value) == "table" and
        tonumber(value[1] or value.r) ~= nil and
        tonumber(value[2] or value.g) ~= nil and
        tonumber(value[3] or value.b) ~= nil
end

local function darken(value, multiplier, alpha)
    local color = copyColor(value)
    multiplier = tonumber(multiplier) or 0.75
    return {
        math.max(0, color[1] * multiplier),
        math.max(0, color[2] * multiplier),
        math.max(0, color[3] * multiplier),
        tonumber(alpha) or color[4] or 1,
    }
end

local function getElvUIEngine()
    if type(_G.ElvUI) ~= "table" or type(unpack) ~= "function" then return nil end

    local ok, engine = pcall(function()
        local E = unpack(_G.ElvUI)
        return E
    end)

    if ok and type(engine) == "table" then return engine end
    return nil
end

local function getToxiUI()
    local addon = _G.ElvUI_ToxiUI or _G.ToxiUI
    if type(addon) ~= "table" or type(unpack) ~= "function" then return nil end

    local ok, TXUI, _, E, I = pcall(function()
        local txui, funcs, engine, internal = unpack(addon)
        return txui, funcs, engine, internal
    end)

    if not ok or type(TXUI) ~= "table" then return nil end
    return TXUI, E, I
end

Themes.ellesmereSkin = Themes.ellesmereSkin or nil
Themes.ellesmereRegistered = Themes.ellesmereRegistered or false

function Themes:RegisterEllesmereSkin()
    if self.ellesmereRegistered then return end

    local EUI = _G.EllesmereUI
    if type(EUI) ~= "table" or type(EUI.RegisterSkin) ~= "function" then return end

    self.ellesmereRegistered = true
    EUI.RegisterSkin("MewthischGuides", function(S)
        Themes.ellesmereSkin = S

        if S and S.OnLooksChanged then
            S.OnLooksChanged(function()
                if MG.db and MG.db.settings and
                   MG.db.settings.theme == "EllesmereUI" and MG.RefreshTheme then
                    MG:RefreshTheme()
                end
            end)
        end

        if MG.db and MG.db.settings and
           MG.db.settings.theme == "EllesmereUI" and MG.RefreshTheme then
            MG:RefreshTheme()
        end
    end)
end

function Themes:IsElvUIAvailable()
    return getElvUIEngine() ~= nil
end

function Themes:IsEllesmereUIAvailable()
    return type(_G.EllesmereUI) == "table"
end

function Themes:IsToxiUIAvailable()
    local TXUI = getToxiUI()
    return TXUI ~= nil
end

function Themes:Get(name)
    return self.definitions[name] or self.definitions["ElvUI"]
end

local function resolveElvUI(theme)
    local E = getElvUIEngine()
    if not E then return theme end

    local media = type(E.media) == "table" and E.media or {}
    local db = type(E.db) == "table" and E.db or {}
    local general = type(db.general) == "table" and db.general or {}

    local backdrop = media.backdropfadecolor
    if not validColor(backdrop) then backdrop = general.backdropfadecolor end
    if validColor(backdrop) then
        theme.background = copyColor(backdrop, theme.background)
        theme.panel = copyColor(backdrop, theme.panel)
        theme.header = darken(theme.background, 0.75, 1)
    end

    local border = media.bordercolor
    if not validColor(border) then border = general.bordercolor end
    if validColor(border) then theme.border = copyColor(border, theme.border) end

    local valueColor = media.rgbvaluecolor
    if not validColor(valueColor) then valueColor = general.valuecolor end
    if validColor(valueColor) then
        theme.accent = copyColor(valueColor, theme.accent)
        theme.progress = copyColor(valueColor, theme.progress)
    end

    if type(media.normFont) == "string" and media.normFont ~= "" then
        theme.font = media.normFont
    end

    theme.elvUIDetected = true
    return theme
end

local function resolveEllesmereUI(theme)
    local S = Themes.ellesmereSkin

    if S and S.IsEnabled and not S.IsEnabled() then
        S = nil
    end

    if S and S.GetAccentColor then
        local r, g, b = S.GetAccentColor()
        if tonumber(r) and tonumber(g) and tonumber(b) then
            theme.accent = {r, g, b, 1}
            theme.progress = {r, g, b, 1}
            theme.active = {r * 0.16, g * 0.16, b * 0.16, 1}
            theme.complete = {r * 0.12, math.max(g * 0.34, 0.24), b * 0.22, 1}
        end
    end

    if S and S.GetPanelColor then
        local r, g, b, a = S.GetPanelColor()
        if tonumber(r) and tonumber(g) and tonumber(b) then
            theme.panel = {r, g, b, tonumber(a) or 0.98}
            theme.background = {r * 0.82, g * 0.82, b * 0.82, tonumber(a) or 0.98}
            theme.header = {r * 0.58, g * 0.58, b * 0.58, 1}
            theme.border = {r * 1.55, g * 1.55, b * 1.55, 1}
        end
    end

    if S and S.GetFont then
        local font = S.GetFont()
        if type(font) == "string" and font ~= "" then theme.font = font end
    end

    theme.ellesmereUIDetected = Themes:IsEllesmereUIAvailable()
    theme.ellesmereSkinAPI = S ~= nil
    return theme
end

local function resolveToxiUI(theme)
    local TXUI, E, I = getToxiUI()

    if type(E) == "table" then
        local db = type(E.db) == "table" and E.db or {}
        local general = type(db.general) == "table" and db.general or {}
        local media = type(E.media) == "table" and E.media or {}

        if validColor(general.backdropfadecolor) then
            theme.background = copyColor(general.backdropfadecolor, theme.background)
        end
        if validColor(general.backdropcolor) then
            theme.panel = copyColor(general.backdropcolor, theme.panel)
        end
        if validColor(general.bordercolor) then
            theme.border = copyColor(general.bordercolor, theme.border)
        end

        theme.header = darken(theme.panel, 0.55, 1)

        if type(media.normFont) == "string" and media.normFont ~= "" then
            theme.font = media.normFont
        end
    end

    local brand = I and I.Strings and I.Strings.Branding and
        I.Strings.Branding.ColorRGB or nil
    if validColor(brand) then
        theme.accent = copyColor(brand, theme.accent)
        theme.progress = copyColor(brand, theme.progress)
    else
        theme.accent = {0.094, 0.659, 1.00, 1}
        theme.progress = {0.094, 0.659, 1.00, 1}
    end

    theme.toxiUIDetected = TXUI ~= nil
    theme.elvUIDetected = E ~= nil
    return theme
end

function Themes:Resolve(name)
    name = self.definitions[name] and name or "ElvUI"
    local theme = cloneTheme(self.definitions[name])

    if name == "ElvUI" and theme.adaptiveElvUI then
        theme = resolveElvUI(theme)
    elseif name == "EllesmereUI" and theme.adaptiveEllesmereUI then
        theme = resolveEllesmereUI(theme)
    elseif name == "ToxiUI" and theme.adaptiveToxiUI then
        theme = resolveToxiUI(theme)
    end

    return theme, name
end

function Themes:GetCurrent()
    local name = MG.db and MG.db.settings and MG.db.settings.theme or "ElvUI"
    return self:Resolve(name)
end

function Themes:Set(name)
    if not self.definitions[name] then return false end
    MG.db.settings.theme = name

    MG:Log("INFO", "theme.changed", "Theme geändert.", {
        theme = name,
        elvUIAvailable = self:IsElvUIAvailable(),
        ellesmereUIAvailable = self:IsEllesmereUIAvailable(),
        toxiUIAvailable = self:IsToxiUIAvailable(),
    })

    if MG.RefreshTheme then MG:RefreshTheme() end
    if MG.RefreshInfo then MG:RefreshInfo() end
    return true
end

function Themes:Next()
    local _, current = self:GetCurrent()
    local index = 1

    for i, name in ipairs(self.order) do
        if name == current then
            index = i
            break
        end
    end

    index = index + 1
    if index > #self.order then index = 1 end
    self:Set(self.order[index])
    return self.order[index]
end

Themes:RegisterEllesmereSkin()
