local addonName, MG = ...

_G.MewthischGuides1 = MG
MG.NAME = "Mewthisch Guides"
MG.VERSION = "1.0.0-dev"
MG.BUILD = "2026-09-22-full-1.0-dev1"
MG.INTERFACE = 16001

MG.Util = MG.Util or {}

function MG.Util:Trim(value)
    value = tostring(value or "")
    return value:gsub("^%s+", ""):gsub("%s+$", "")
end

function MG.Util:Slug(value)
    value = string.lower(tostring(value or "guide"))
    value = value:gsub("[^%w]+", "-")
    value = value:gsub("^%-+", ""):gsub("%-+$", "")
    return value ~= "" and value or "guide"
end

function MG.Util:Copy(value, seen)
    if type(value) ~= "table" then return value end
    seen = seen or {}
    if seen[value] then return seen[value] end
    local out = {}
    seen[value] = out
    for key, child in pairs(value) do
        out[self:Copy(key, seen)] = self:Copy(child, seen)
    end
    return out
end

function MG.Util:SplitCondition(value)
    value = self:Trim(value)
    local pos = string.find(value, "<<", 1, true)
    if not pos then return value, nil end
    return self:Trim(string.sub(value, 1, pos - 1)),
        self:Trim(string.sub(value, pos + 2))
end

function MG:GetPlayerProfile()
    local classFile, classID
    local raceFile, raceID

    if UnitClass then
        local _
        _, classFile, classID = UnitClass("player")
    end
    if UnitRace then
        local _
        _, raceFile, raceID = UnitRace("player")
    end

    return {
        level = UnitLevel and UnitLevel("player") or 1,
        class = classFile,
        classID = classID,
        race = raceFile,
        raceID = raceID,
        faction = UnitFactionGroup and UnitFactionGroup("player") or nil,
    }
end

function MG:EnsureDB()
    MewthischGuides1DB = MewthischGuides1DB or {}
    local db = MewthischGuides1DB
    db.settings = db.settings or {}
    local defaults = {
        rxpSeason = 0,
        rxpRate = 1,
        rxpHardcoreMode = false,
        rxpSoDMode = false,
        rxpEraMode = true,
        rxpSoMMode = false,
        rxpSSFMode = false,
        rxpHardcoreServer = false,
        rxpPhase = 6,
        allowAuctionHouse = true,
        theme = "Forever Classic",
        showViewer = true,
        showNavigator = true,
        showMinimapButton = true,
        minimapAngle = 215,
        navigatorLocked = false,
        navigatorScale = 1,
        autoSuperTrack = true,
        showWorldMapMarker = true,
        showActionBar = true,
        showGearAdvisor = true,
        showBuildAdvisor = true,
        showCompletedGoals = false,
        showPassiveHints = true,
        respectHideWindow = true,
        autoAdvance = true,
        autoAcceptQuests = false,
        autoTurnInQuests = false,
        autoSelectSingleReward = false,
        diagnostics = true,
    }
    for key, value in pairs(defaults) do
        if db.settings[key] == nil then db.settings[key] = value end
    end
    db.logs = db.logs or {}
    db.logSequence = db.logSequence or 0
    db.guide = db.guide or {}
    db.ui = db.ui or {}
    db.runtime = db.runtime or {}
    db.runtime.build = self.BUILD
    db.browser = db.browser or {}
    db.automation = db.automation or {}
    self.db = db
    return db
end
