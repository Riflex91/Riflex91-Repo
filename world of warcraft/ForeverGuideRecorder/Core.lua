local addonName, FGR = ...
_G.ForeverGuideRecorder = FGR

FGR.SCHEMA_VERSION = "fgds-1.0"
FGR.ADDON_VERSION = "0.4.0"

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

local function elapsedSeconds(session)
    if not session or not session.startedEpoch then return 0 end
    return math.max(0, time() - session.startedEpoch)
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
    db.health = db.health or {
        heartbeatCount = 0,
        recordCount = #db.records,
    }

    self.db = db
end

function FGR:Record(kind, id, data, evidence)
    if not self.db then self:EnsureDB() end

    local observedAt = nowISO()
    self.db.updatedUtc = observedAt

    table.insert(self.db.records, {
        kind = kind,
        id = id,
        observedAt = observedAt,
        evidence = evidence or "gameplay-api",
        data = data or {},
    })

    self.db.health = self.db.health or {}
    self.db.health.recordCount = #self.db.records
end

function FGR:StartSession()
    self:EnsureDB()

    local previous = self.db.sessions[#self.db.sessions]
    if previous and not previous.endedUtc then
        previous.interruptedDetectedUtc = nowISO()
        previous.endedReason = "unclean_or_unflushed_previous_session"
    end

    local startedEpoch = time()
    local session = {
        id = tostring(startedEpoch) .. "-" .. tostring(math.random(100000, 999999)),
        startedUtc = nowISO(),
        startedEpoch = startedEpoch,
        build = self.db.build,
        profile = getProfile(),
        addonVersion = self.ADDON_VERSION,
    }

    table.insert(self.db.sessions, session)
    self.session = session

    self.db.health.currentSessionId = session.id
    self.db.health.currentSessionStartedUtc = session.startedUtc
    self.db.health.currentSessionStartedEpoch = startedEpoch
    self.db.health.lastHeartbeatUtc = nil
    self.db.health.lastHeartbeatEpoch = nil
    self.db.health.heartbeatCount = 0

    self:Record("session.start", session.id, {
        profile = session.profile,
        position = self:GetPosition(),
        addonVersion = self.ADDON_VERSION,
    })
end

function FGR:Heartbeat(reason)
    self:EnsureDB()

    local epoch = time()
    self.db.health.heartbeatCount = (self.db.health.heartbeatCount or 0) + 1
    self.db.health.lastHeartbeatUtc = nowISO()
    self.db.health.lastHeartbeatEpoch = epoch
    self.db.health.currentSessionId = self.session and self.session.id or self.db.health.currentSessionId
    self.db.health.currentSessionElapsedSeconds = elapsedSeconds(self.session)

    self:Record("recorder.heartbeat", self.db.health.heartbeatCount, {
        reason = reason or "timer",
        sessionId = self.session and self.session.id or nil,
        elapsedSeconds = elapsedSeconds(self.session),
        heartbeatCount = self.db.health.heartbeatCount,
        recordCountBeforeHeartbeat = #self.db.records,
        position = self:GetPosition(),
        level = UnitLevel("player"),
    }, "recorder-health")
end

function FGR:EndSession(reason)
    if not self.session then return end

    self.session.endedUtc = nowISO()
    self.session.endedEpoch = time()
    self.session.durationSeconds = elapsedSeconds(self.session)
    self.session.endedReason = reason or "logout"

    if self.db and self.db.health then
        self.db.health.lastCompletedSessionId = self.session.id
        self.db.health.lastCompletedSessionDurationSeconds = self.session.durationSeconds
        self.db.health.currentSessionId = nil
    end
end

function FGR:Status()
    self:EnsureDB()

    local elapsed = elapsedSeconds(self.session)
    local heartbeatCount = self.db.health and self.db.health.heartbeatCount or 0
    local lastHeartbeat = self.db.health and self.db.health.lastHeartbeatUtc or "noch keiner"

    print("|cff67d8efFGR|r |cff33ff99RECORDING|r v" .. self.ADDON_VERSION ..
        " build=" .. tostring(self.db.build.buildNumber) ..
        " session=" .. tostring(elapsed) .. "s" ..
        " heartbeats=" .. tostring(heartbeatCount) ..
        " records=" .. tostring(#self.db.records))
    print("|cff67d8efFGR|r letzter Heartbeat: " .. tostring(lastHeartbeat))
    print("|cff67d8efFGR|r Für eine aktuelle Datei vor dem Kopieren /reload oder normal ausloggen.")
end

SLASH_FOREVERGUIDERECORDER1 = "/fgr"
SlashCmdList.FOREVERGUIDERECORDER = function(msg)
    msg = strtrim(msg or "")
    local command, rest = msg:match("^(%S+)%s*(.-)$")
    command = string.lower(command or "status")

    if command == "status" then
        FGR:Status()
    elseif command == "check" then
        FGR:Heartbeat("manual_check")
        FGR:Status()
    elseif command == "save" then
        FGR:Record("export.requested", nil, {
            sessionId = FGR.session and FGR.session.id or nil,
            elapsedSeconds = elapsedSeconds(FGR.session),
            position = FGR:GetPosition(),
        }, "tester-marker")
        print("|cff67d8efFGR|r Exportmarke gespeichert. Jetzt /reload ausführen oder normal ausloggen, damit SavedVariables auf Platte geschrieben werden.")
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
        FGR.db = nil
        FGR.session = nil
        FGR:EnsureDB()
        FGR:StartSession()
        FGR:Heartbeat("clear_restart")
        print("|cff67d8efFGR|r recorder data cleared and new session started.")
    else
        print("|cff67d8efFGR|r /fgr status | check | save | danger | wait | bug | good | note <text> | clear CONFIRM")
    end
end
