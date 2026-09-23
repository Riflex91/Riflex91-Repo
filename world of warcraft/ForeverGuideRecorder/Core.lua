local addonName, FGR = ...
_G.ForeverGuideRecorder = FGR

FGR.SCHEMA_VERSION = "fgds-1.0"
FGR.ADDON_VERSION = "0.2.0"

local function nowISO()
    return date("!%Y-%m-%dT%H:%M:%SZ")
end

local function getBuild()
    local version, build, buildDate, interfaceVersion = GetBuildInfo()
    return {
        version = tostring(version or ""),
        buildNumber = tostring(build or ""),
        buildDate = tostring(buildDate or ""),
        interfaceVersion = tonumber(interfaceVersion),
        product = "wow_forever",
    }
end

local function getProfile()
    local _, classFile, classID = UnitClass("player")
    local _, raceFile, raceID = UnitRace("player")
    return {
        level = UnitLevel("player"),
        class = classFile,
        classID = classID,
        race = raceFile,
        raceID = raceID,
        faction = UnitFactionGroup("player"),
    }
end

function FGR:GetPosition()
    if not C_Map or not C_Map.GetBestMapForUnit then return nil end
    local mapID = C_Map.GetBestMapForUnit("player")
    if not mapID then return nil end
    local p = C_Map.GetPlayerMapPosition(mapID, "player")
    if not p then return { mapID = mapID } end
    return { mapID = mapID, x = p.x, y = p.y }
end

function FGR:GetNpc()
    local guid = UnitGUID("npc")
    if not guid then return nil end
    local unitType, _, _, _, _, id = strsplit("-", guid)
    return {
        guidType = unitType,
        id = tonumber(id),
        name = UnitName("npc"),
    }
end

function FGR:EnsureDB()
    ForeverGuideRecorderDB = ForeverGuideRecorderDB or {}
    local db = ForeverGuideRecorderDB

    db.schemaVersion = self.SCHEMA_VERSION
    db.source = "recorder"
    db.addonVersion = self.ADDON_VERSION
    db.createdUtc = db.createdUtc or nowISO()
    db.updatedUtc = nowISO()
    db.build = getBuild()
    db.profile = getProfile()
    db.records = db.records or {}
    db.sessions = db.sessions or {}

    self.db = db
end

function FGR:Record(kind, id, data, evidence)
    if not self.db then self:EnsureDB() end
    self.db.updatedUtc = nowISO()
    table.insert(self.db.records, {
        kind = kind,
        id = id,
        observedAt = nowISO(),
        evidence = evidence or "gameplay-api",
        data = data or {},
    })
end

function FGR:StartSession()
    self:EnsureDB()
    local session = {
        id = tostring(time()) .. "-" .. tostring(math.random(100000, 999999)),
        startedUtc = nowISO(),
        build = self.db.build,
        profile = getProfile(),
    }
    table.insert(self.db.sessions, session)
    self.session = session
    self:Record("session.start", session.id, {
        profile = session.profile,
        position = self:GetPosition(),
    })
end

function FGR:Status()
    self:EnsureDB()
    print("|cff67d8efFGR|r schema=" .. self.db.schemaVersion ..
        " build=" .. tostring(self.db.build.buildNumber) ..
        " records=" .. tostring(#self.db.records))
end

SLASH_FOREVERGUIDERECORDER1 = "/fgr"
SlashCmdList.FOREVERGUIDERECORDER = function(msg)
    msg = strtrim(msg or "")
    local command, rest = msg:match("^(%S+)%s*(.-)$")
    command = string.lower(command or "status")

    if command == "status" then
        FGR:Status()
    elseif command == "danger" or command == "wait" or command == "bug" or command == "good" or command == "note" then
        FGR:Record("user.marker", command, {
            marker = command,
            note = rest,
            position = FGR:GetPosition(),
            npc = FGR:GetNpc(),
        }, "tester-marker")
        print("|cff67d8efFGR|r marker saved: " .. command)
    elseif command == "clear" and rest == "CONFIRM" then
        ForeverGuideRecorderDB = nil
        FGR:EnsureDB()
        FGR:StartSession()
        print("|cff67d8efFGR|r recorder data cleared.")
    else
        print("|cff67d8efFGR|r /fgr status | danger | wait | bug | good | note <text> | clear CONFIRM")
    end
end
