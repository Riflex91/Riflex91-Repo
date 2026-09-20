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

    if guide.verification == "RESTEDXP_PUBLIC" and MG.RestEDXPImport and
       not MG.RestEDXPImport:GuideMatches(guide, profile) then
        return false
    end

    return true
end

local function autoSelectable(guide)
    if not MG.SupportedRoutes or not MG.SupportedRoutes:IsSupportedGuide(guide) then
        return false
    end
    if guide.verification ~= "RESTEDXP_PUBLIC" then return false end
    if guide.rxpAutoSelect == false then return false end
    if not tonumber(guide.minLevel) and not tonumber(guide.maxLevel) then
        return false
    end
    return true
end

local function guidePriority(guide, profile)
    local score = 0

    if guide.verification == "RESTEDXP_PUBLIC" then
        score = 300
        local group = tostring(guide.group or "")
        local subgroup = tostring(guide.subgroup or "")

        local hardcore = MG.db and MG.db.settings and MG.db.settings.rxpHardcoreMode
        if string.find(group, "Forever Guide", 1, true) then
            score = score + (hardcore and 10 or 40)
        end
        if string.find(group, "Survival Guide", 1, true) then
            score = score + (hardcore and 70 or -20)
        end
        if string.find(group, "ADV AoE", 1, true) then score = score - 10 end
        if string.find(subgroup, "Mage", 1, true) and profile.class == "MAGE" then
            score = score + 25
        end
        if guide.races then score = score + 10 end
        if guide.classes then score = score + 20 end
    elseif guide.verification == "RECORDED" then
        score = 200
    else
        score = 100
    end

    local minLevel = tonumber(guide.minLevel)
    local maxLevel = tonumber(guide.maxLevel)
    if minLevel and maxLevel then
        local span = math.max(0, maxLevel - minLevel)
        score = score + math.max(0, 20 - span)
    end

    return score
end

function Loader:Load()
    local raw = {}
    if MG.Data then
        if type(MG.Data.guides) == "table" then
            for _, guide in ipairs(MG.Data.guides) do raw[#raw + 1] = guide end
        end
        if type(MG.Data.guide) == "table" then raw[#raw + 1] = MG.Data.guide end
    end

    local rxpStats = nil
    if MG.RestEDXPImport then
        for _, guide in ipairs(MG.RestEDXPImport:BuildGuides() or {}) do
            raw[#raw + 1] = guide
        end
        rxpStats = MG.RestEDXPImport:GetStats()
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
    local supportedStatus = MG.SupportedRoutes and
        MG.SupportedRoutes:Validate(
            self.guides,
            rxpStats and rxpStats.sourceCommit or nil) or {
                ready = false,
                requiredRoutes = 0,
                resolvedRoutes = 0,
            }

    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        MG.db.runtime.restedXP = rxpStats
        MG.db.runtime.supportedRoutes = supportedStatus
    end

    if MG.db and MG.db.settings and
       MG.db.settings.routeMode == "auto" and
       not supportedStatus.ready then
        MG.db.settings.routeMode = "manual"
    end

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
                restedXP = rxpStats,
                autoRouteReady = supportedStatus.ready,
                requiredRoutes = supportedStatus.requiredRoutes,
                resolvedRoutes = supportedStatus.resolvedRoutes,
            })
    end

    return report
end

function Loader:SelectActiveGuide()
    local profile = MG:GetPlayerProfile()
    local preferred = MG.db and MG.db.settings and MG.db.settings.preferredGuideID or nil
    local selected = preferred and self.byID[preferred] or nil

    if selected and
       (not guideApplicable(selected, profile) or
        not (MG.SupportedRoutes and MG.SupportedRoutes:IsSupportedGuide(selected))) then
        selected = nil
    end

    if not selected then
        local bestScore = nil
        for _, guide in ipairs(self.guides) do
            if autoSelectable(guide) and guideApplicable(guide, profile) then
                local score = guidePriority(guide, profile)
                if bestScore == nil or score > bestScore then
                    selected = guide
                    bestScore = score
                end
            end
        end
    end

    self.activeGuide = selected

    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        MG.db.runtime.dataLoader = {
            guides = #self.guides,
            activeGuideID = selected and selected.id or nil,
            activeGuideVerification = selected and selected.verification or nil,
            activeGuideTitle = selected and selected.title or nil,
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

function Loader:IsAutoRouteReady()
    local status = MG.SupportedRoutes and MG.SupportedRoutes:GetStatus() or nil
    return status and status.ready and true or false
end

function Loader:GetSupportedGuides(category)
    if not MG.SupportedRoutes then return {} end
    return MG.SupportedRoutes:GetGuides(category)
end

function Loader:IsGuideApplicable(guide)
    return guide and guideApplicable(guide, MG:GetPlayerProfile()) and true or false
end

function Loader:SelectGuide(id)
    local guide = self:GetGuide(id)
    if not guide or not MG.SupportedRoutes or
       not MG.SupportedRoutes:IsSupportedGuide(guide) then
        return false, "unsupported_guide"
    end
    if not guideApplicable(guide, MG:GetPlayerProfile()) then
        return false, "guide_not_applicable"
    end

    MG.db.settings.preferredGuideID = guide.id
    self.activeGuide = guide
    MG.manualOffset = 0
    return true, guide
end

function MG:GetActiveGuideDefinition()
    return Loader:GetActiveGuide() or (self.Data and self.Data.guide) or nil
end
