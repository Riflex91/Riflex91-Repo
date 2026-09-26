local addonName, MGR = ...
_G.MewthischGuidesRecorder = MGR

MGR.SCHEMA_VERSION = "fgds-1.0"
MGR.ADDON_VERSION = "0.5.0"
MGR.AUTO_RECORDING = true

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
        product = "wow_classic_beta",
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

function MGR:GetPosition()
    if not C_Map or not C_Map.GetBestMapForUnit or not C_Map.GetPlayerMapPosition then return nil end
    local mapID = C_Map.GetBestMapForUnit("player")
    if not mapID then return nil end
    local p = C_Map.GetPlayerMapPosition(mapID, "player")
    if not p then return { mapID = mapID } end
    return { mapID = mapID, x = p.x, y = p.y }
end

function MGR:GetUnitRef(unit)
    if not unit or not UnitExists or not UnitExists(unit) then return nil end

    local guid = UnitGUID(unit)
    local result = {
        unit = unit,
        isPlayer = UnitIsPlayer and UnitIsPlayer(unit) and true or false,
        level = UnitLevel and UnitLevel(unit) or nil,
    }

    if guid then
        local unitType, _, _, _, _, id = strsplit("-", guid)
        result.guidType = unitType
        result.id = tonumber(id)
    end

    -- Avoid collecting other players' names. NPC names are useful route evidence.
    if not result.isPlayer and UnitName then
        result.name = UnitName(unit)
    end

    return result
end

function MGR:GetNpc()
    local npc = self:GetUnitRef("npc")
    if npc then return npc end

    local target = self:GetUnitRef("target")
    if target and not target.isPlayer then return target end
    return nil
end

function MGR:EnsureDB()
    MewthischGuidesRecorderDB = MewthischGuidesRecorderDB or {}
    local db = MewthischGuidesRecorderDB

    db.schemaVersion = self.SCHEMA_VERSION
    db.source = "recorder"
    db.addonName = "Mewthisch Guides Recorder"
    db.addonVersion = self.ADDON_VERSION
    db.createdUtc = db.createdUtc or nowISO()
    db.updatedUtc = nowISO()
    db.build = getBuild()
    db.profile = getProfile()
    db.records = db.records or {}
    db.sessions = db.sessions or {}
    db.health = db.health or {}

    db.health.autoRecording = true
    db.health.recordCount = #db.records

    self.db = db
end

function MGR:Record(kind, id, data, evidence)
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
    self.db.health.autoRecording = true
    self.db.health.recordCount = #self.db.records
end

function MGR:StartSession()
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
        autoRecording = true,
    }

    table.insert(self.db.sessions, session)
    self.session = session

    self.db.health.currentSessionId = session.id
    self.db.health.currentSessionStartedUtc = session.startedUtc
    self.db.health.currentSessionStartedEpoch = startedEpoch
    self.db.health.lastHeartbeatUtc = nil
    self.db.health.lastHeartbeatEpoch = nil
    self.db.health.heartbeatCount = 0
    self.db.health.autoRecording = true

    self:Record("session.start", session.id, {
        profile = session.profile,
        position = self:GetPosition(),
        addonVersion = self.ADDON_VERSION,
        mode = "automatic",
    })
end

function MGR:Heartbeat(reason)
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

function MGR:EndSession(reason)
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

function MGR:Status()
    self:EnsureDB()

    local elapsed = elapsedSeconds(self.session)
    local heartbeatCount = self.db.health and self.db.health.heartbeatCount or 0
    local lastHeartbeat = self.db.health and self.db.health.lastHeartbeatUtc or "noch keiner"

    print("|cff67d8efMGR|r |cff33ff99AUTO RECORDING|r v" .. self.ADDON_VERSION ..
        " build=" .. tostring(self.db.build.buildNumber) ..
        " session=" .. tostring(elapsed) .. "s" ..
        " heartbeats=" .. tostring(heartbeatCount) ..
        " records=" .. tostring(#self.db.records))
    print("|cff67d8efMGR|r letzter Heartbeat: " .. tostring(lastHeartbeat))
    print("|cff67d8efMGR|r Keine Commands noetig. Fuer eine aktuelle Datei /reload oder normal ausloggen.")
end

SLASH_MEWTHISCHGUIDESRECORDER1 = "/mgr"
SlashCmdList.MEWTHISCHGUIDESRECORDER = function(msg)
    msg = strtrim(msg or "")
    local command, rest = msg:match("^(%S+)%s*(.-)$")
    command = string.lower(command or "status")

    if command == "status" then
        MGR:Status()
    elseif command == "check" then
        MGR:Heartbeat("manual_check")
        MGR:Status()
    elseif command == "note" then
        MGR:Record("user.marker", "note", {
            note = rest,
            position = MGR:GetPosition(),
            npc = MGR:GetNpc(),
        }, "tester-marker")
        print("|cff67d8efMGR|r optionale Notiz gespeichert.")
    else
        print("|cff67d8efMGR|r Auto-Aufzeichnung laeuft ohne Commands. Optional: /mgr status | check | note <text>")
    end
end
