local addonName, MG = ...

MG.Themes = MG.Themes or {}

MG.Themes.definitions = {
    ["Forever Classic"] = { accent = {0.96, 0.73, 0.20}, text = {1.00, 0.93, 0.78} },
    ["Obsidian"] = { accent = {0.60, 0.72, 0.86}, text = {0.92, 0.95, 1.00} },
    ["Arcane"] = { accent = {0.62, 0.42, 1.00}, text = {0.92, 0.86, 1.00} },
    ["Warcraft"] = { accent = {0.95, 0.55, 0.15}, text = {1.00, 0.88, 0.67} },
    ["Skyborne"] = { accent = {0.38, 0.84, 1.00}, text = {0.82, 0.95, 1.00} },
}

function MG.Themes:Get(name)
    return self.definitions[name] or self.definitions["Forever Classic"]
end

function MG.Themes:GetCurrent()
    local name = MG.db and MG.db.settings and MG.db.settings.theme or "Forever Classic"
    return self:Get(name), name
end

function MG.Themes:Set(name)
    if not self.definitions[name] then return false end
    MG.db.settings.theme = name
    MG:Log("INFO", "theme.changed", "Theme geändert.", { theme = name })
    if MG.RefreshTheme then MG:RefreshTheme() end
    return true
end
