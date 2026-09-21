local addonName, MG = ...

_G.MewthischGuides1 = MG

MG.NAME = "Mewthisch Guides"
MG.VERSION = "1.0.0-dev"
MG.SCHEMA = "mg1-1"
MG.ADDON_NAME = addonName
MG.runtime = MG.runtime or {}
MG.modules = MG.modules or {}

local function now()
    if time then return time() end
    if os and os.time then return os.time() end
    return 0
end

function MG:Now()
    return now()
end

function MG:GetPlayerProfile()
    local _, classFile, classID = UnitClass and UnitClass("player") or nil
    local _, raceFile, raceID = UnitRace and UnitRace("player") or nil
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
    db.schema = db.schema or self.SCHEMA
    db.settings = db.settings or {
        showViewer = true,
        autoAdvance = true,
        showCompletedGoals = false,
        showPassiveHints = true,
        showNavigator = true,
        showWorldMapMarker = true,
        showDistance = true,
        showETA = true,
        autoAcceptQuests = false,
        autoTurnInQuests = false,
        diagnostics = true,
    }
    db.logs = db.logs or {}
    db.logSequence = db.logSequence or 0
    db.guide = db.guide or {}
    db.runtime = {}
    self.db = db
    return db
end

function MG:CopyTable(value, seen)
    if type(value) ~= "table" then return value end
    seen = seen or {}
    if seen[value] then return seen[value] end
    local out = {}
    seen[value] = out
    for key, child in pairs(value) do
        out[self:CopyTable(key, seen)] = self:CopyTable(child, seen)
    end
    return out
end
