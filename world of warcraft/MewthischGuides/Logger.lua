local addonName, MG = ...

local MAX_LOGS = 5000

local DEFAULT_SETTINGS = {
    enabled = true,
    showWindow = true,
    showInfo = false,
    showSettings = false,
    viewerCollapsed = false,
    diagnostics = true,
    autoSuperTrack = true,
    showWorldMapMarker = true,
    routeMode = "preset",
    autoAcceptQuests = true,
    autoTurnInQuests = true,
    autoSelectSingleReward = true,
    showMinimapButton = true,
    showNavigator = true,
    navigatorLocked = false,
    navigatorScale = 1.15,
    viewerX = 260,
    viewerY = 80,
    navigatorX = 0,
    navigatorY = 235,
    minimapAngle = 215,
    windowTransparency = 0.05,
    theme = "ElvUI",
    gearAutoEquip = false,
    gearSafeMode = true,
    gearAutoEquipWeapons = false,
    gearProtectBoE = true,
    gearRequireHighConfidence = true,
    gearAutoEquipItemLevelFallback = true,
    telemetryLocal = true,
    rxpSeason = 0,
    rxpRate = 1.0,
    rxpHardcoreMode = false,
    rxpSoDMode = false,
}

local function isoNow()
    return date("!%Y-%m-%dT%H:%M:%SZ")
end

local function sanitize(value, depth, seen)
    local valueType = type(value)

    if valueType == "nil" or valueType == "string" or
       valueType == "number" or valueType == "boolean" then
        return value
    end

    if valueType ~= "table" then
        return tostring(value)
    end

    depth = depth or 0
    if depth >= 4 then return "<max-depth>" end

    seen = seen or {}
    if seen[value] then return "<cycle>" end
    seen[value] = true

    local out = {}
    local count = 0

    for k, v in pairs(value) do
        count = count + 1
        if count > 64 then
            out["<truncated>"] = true
            break
        end

        local keyType = type(k)
        local safeKey = (keyType == "string" or keyType == "number") and k or tostring(k)
        out[safeKey] = sanitize(v, depth + 1, seen)
    end

    seen[value] = nil
    return out
end

function MG:EnsureDB()
    MewthischGuidesDB = MewthischGuidesDB or {}
    local db = MewthischGuidesDB

    db.version = self.VERSION
    db.schemaVersion = "fgds-1.0"
    db.createdUtc = db.createdUtc or isoNow()
    db.updatedUtc = isoNow()
    db.settings = db.settings or {}

    for key, value in pairs(DEFAULT_SETTINGS) do
        if db.settings[key] == nil then
            db.settings[key] = value
        end
    end

    db.logs = db.logs or {}
    db.logSequence = db.logSequence or 0
    db.sessions = db.sessions or {}
    db.runtime = db.runtime or {}

    self.db = db
    return db
end

function MG:Log(level, event, message, data)
    local db = self:EnsureDB()
    db.logSequence = db.logSequence + 1
    db.updatedUtc = isoNow()

    db.logs[#db.logs + 1] = {
        seq = db.logSequence,
        at = isoNow(),
        level = level or "INFO",
        event = event or "unknown",
        message = message or "",
        data = sanitize(data),
    }

    while #db.logs > MAX_LOGS do
        table.remove(db.logs, 1)
    end

    if db.settings.diagnostics and (level == "ERROR" or level == "WARN") then
        print("|cff62d6ffMewthisch Guides|r " .. tostring(level) .. ": " .. tostring(message))
    end
end

function MG:Safe(eventName, fn)
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

function MG:StartLogSession()
    local db = self:EnsureDB()
    local version, build, buildDate, interfaceVersion = GetBuildInfo()

    local session = {
        id = tostring(time()) .. "-" .. tostring(math.random(100000, 999999)),
        startedUtc = isoNow(),
        startedEpoch = time(),
        addonVersion = self.VERSION,
        addonName = self.NAME,
        build = {
            version = version,
            buildNumber = tostring(build or ""),
            buildDate = buildDate,
            interfaceVersion = interfaceVersion,
        },
        character = self:GetPlayerProfile(),
    }

    db.sessions[#db.sessions + 1] = session
    self.session = session

    self:Log("INFO", "session.start", "Mewthisch Guides gestartet.", {
        sessionId = session.id,
        build = tostring(build or ""),
        interfaceVersion = interfaceVersion,
        addonVersion = self.VERSION,
    })
end

function MG:EndLogSession(reason)
    if not self.session then return end

    self.session.endedUtc = isoNow()
    self.session.endedEpoch = time()
    self.session.durationSeconds = math.max(0, time() - (self.session.startedEpoch or time()))
    self.session.reason = reason or "logout"

    self:Log("INFO", "session.end", "Mewthisch Guides Session beendet.", {
        reason = self.session.reason,
        durationSeconds = self.session.durationSeconds,
    })
end

function MG:GetLogSummary()
    local db = self:EnsureDB()
    local errors, warnings = 0, 0

    for _, entry in ipairs(db.logs) do
        if entry.level == "ERROR" then errors = errors + 1 end
        if entry.level == "WARN" then warnings = warnings + 1 end
    end

    return {
        total = #db.logs,
        errors = errors,
        warnings = warnings,
        lastSeq = db.logSequence,
    }
end
