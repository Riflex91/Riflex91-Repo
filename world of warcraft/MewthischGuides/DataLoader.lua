local addonName, MG = ...

MG.DataLoader = MG.DataLoader or {}
local Loader = MG.DataLoader

Loader.guides = Loader.guides or {}
Loader.byID = Loader.byID or {}
Loader.activeGuide = nil

local function contains(list, value)
    if type(list) ~= "table" then return true end
    for _, item in ipairs(list) do
        if item == value then return true end
    end
    return false
end

local function guideApplicable(guide, profile)
    if guide.faction and guide.faction ~= profile.faction then return false end
    if guide.races and not contains(guide.races, profile.race) then return false end
    if guide.classes and not contains(guide.classes, profile.class) then return false end

    local level = tonumber(profile.level) or 0
    local minLevel = tonumber(guide.minLevel)
    local maxLevel = tonumber(guide.maxLevel)
    if minLevel and level < minLevel then return false end
    if maxLevel and level > maxLevel then return false end
    return true
end

function Loader:Load()
    local raw = {}
    if MG.Data then
        if type(MG.Data.guides) == "table" then
            for _, guide in ipairs(MG.Data.guides) do raw[#raw + 1] = guide end
        end
        if type(MG.Data.guide) == "table" then raw[#raw + 1] = MG.Data.guide end
    end

    local parsed, rejected = MG.GuideParser:ParseMany(raw)
    self.guides, self.byID = {}, {}

    for _, guide in ipairs(parsed) do
        if not self.byID[guide.id] then
            self.guides[#self.guides + 1] = guide
            self.byID[guide.id] = guide
        end
    end

    local report = MG.Validation:ValidateAll(self.guides)
    self:SelectActiveGuide()

    if MG.Log then
        MG:Log(report.valid and "INFO" or "WARN", "data.guides_loaded",
            "Guide-Daten geladen und validiert.", {
                guides = #self.guides,
                rejected = #rejected,
                valid = report.valid,
                errors = #report.errors,
                warnings = #report.warnings,
                activeGuideID = self.activeGuide and self.activeGuide.id or nil,
            })
    end

    return report
end

function Loader:SelectActiveGuide()
    local profile = MG:GetPlayerProfile()
    local preferred = MG.db and MG.db.settings and MG.db.settings.preferredGuideID or nil
    local selected = preferred and self.byID[preferred] or nil

    if selected and not guideApplicable(selected, profile) then selected = nil end

    if not selected then
        for _, guide in ipairs(self.guides) do
            if guideApplicable(guide, profile) then
                selected = guide
                break
            end
        end
    end

    self.activeGuide = selected

    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        MG.db.runtime.dataLoader = {
            guides = #self.guides,
            activeGuideID = selected and selected.id or nil,
        }
    end

    return selected
end

function Loader:GetActiveGuide()
    if not self.activeGuide then return self:SelectActiveGuide() end
    return self.activeGuide
end

function Loader:GetGuide(id)
    return id and self.byID[id] or nil
end

function MG:GetActiveGuideDefinition()
    return Loader:GetActiveGuide() or (self.Data and self.Data.guide) or nil
end
