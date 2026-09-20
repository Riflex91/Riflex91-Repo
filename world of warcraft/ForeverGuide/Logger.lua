local addonName, FG = ...

local MAX_LOGS = 3000
local function isoNow() return date("!%Y-%m-%dT%H:%M:%SZ") end

local function shallowCopy(value)
    if type(value) ~= "table" then return value end
    local out = {}
    for k, v in pairs(value) do
        if type(v) ~= "table" then out[k] = v end
    end
    return out
end

function FG:EnsureDB()
    ForeverGuideDB = ForeverGuideDB or {}
    local db = ForeverGuideDB
    db.version = self.VERSION
    db.schemaVersion = "fgds-1.0"
    db.createdUtc = db.createdUtc or isoNow()
    db.updatedUtc = isoNow()
    db.settings = db.settings or {
        enabled = true, showWindow = true, showInfo = false,
        diagnostics = true, autoSuperTrack = true,
    }
    db.logs = db.logs or {}
    db.logSequence = db.logSequence or 0
    db.sessions = db.sessions or {}
    self.db = db
    return db
end

function FG:Log(level, event, message, data)
    local db = self:EnsureDB()
    db.logSequence = db.logSequence + 1
    db.updatedUtc = isoNow()
    db.logs[#db.logs + 1] = {
        seq = db.logSequence, at = isoNow(), level = level or "INFO",
        event = event or "unknown", message = message or "", data = shallowCopy(data),
    }
    while #db.logs > MAX_LOGS do table.remove(db.logs, 1) end
    if db.settings.diagnostics and (level == "ERROR" or level == "WARN") then
        print("|cff62d6ffForeverGuide|r " .. tostring(level) .. ": " .. tostring(message))
    end
end

function FG:Safe(eventName, fn)
    local ok, err = xpcall(fn, function(errorMessage)
        local stack = debugstack and debugstack(2, 8, 8) or nil
        self:Log("ERROR", eventName, tostring(errorMessage), { stack = stack })
        return errorMessage
    end)
    if not ok and geterrorhandler then
        local handler = geterrorhandler()
        if handler then pcall(handler, err) end
    end
    return ok
end

function FG:StartLogSession()
    local db = self:EnsureDB()
    local version, build, buildDate, interfaceVersion = GetBuildInfo()
    local session = {
        id = tostring(time()) .. "-" .. tostring(math.random(100000, 999999)),
        startedUtc = isoNow(), startedEpoch = time(), addonVersion = self.VERSION,
        build = { version = version, buildNumber = tostring(build or ""), buildDate = buildDate, interfaceVersion = interfaceVersion },
        character = self:GetPlayerProfile(),
    }
    db.sessions[#db.sessions + 1] = session
    self.session = session
    self:Log("INFO", "session.start", "ForeverGuide gestartet.", {
        sessionId = session.id, build = tostring(build or ""),
        interfaceVersion = interfaceVersion, addonVersion = self.VERSION,
    })
end

function FG:EndLogSession(reason)
    if not self.session then return end
    self.session.endedUtc = isoNow()
    self.session.endedEpoch = time()
    self.session.durationSeconds = math.max(0, time() - (self.session.startedEpoch or time()))
    self.session.reason = reason or "logout"
    self:Log("INFO", "session.end", "ForeverGuide Session beendet.", {
        reason = self.session.reason, durationSeconds = self.session.durationSeconds,
    })
end

function FG:GetLogSummary()
    local db = self:EnsureDB()
    local errors, warnings = 0, 0
    for _, entry in ipairs(db.logs) do
        if entry.level == "ERROR" then errors = errors + 1 end
        if entry.level == "WARN" then warnings = warnings + 1 end
    end
    return { total = #db.logs, errors = errors, warnings = warnings, lastSeq = db.logSequence }
end
