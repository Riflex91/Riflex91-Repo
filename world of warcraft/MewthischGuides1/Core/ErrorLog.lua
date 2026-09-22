local addonName, MG = ...

local MAX_LOGS = 600

local function timestamp()
    if date then return date("!%Y-%m-%dT%H:%M:%SZ") end
    if os and os.date then return os.date("!%Y-%m-%dT%H:%M:%SZ") end
    return tostring(time and time() or 0)
end

local function sanitize(value, depth, seen)
    depth = depth or 0
    if depth > 6 then return "<max-depth>" end
    if type(value) ~= "table" then
        if type(value) == "function" then return "<function>" end
        if type(value) == "userdata" then return "<userdata>" end
        if type(value) == "thread" then return "<thread>" end
        return value
    end
    seen = seen or {}
    if seen[value] then return "<cycle>" end
    seen[value] = true
    local out = {}
    for key, child in pairs(value) do
        out[tostring(key)] = sanitize(child, depth + 1, seen)
    end
    seen[value] = nil
    return out
end

local function safeCall(fn, ...)
    if type(fn) ~= "function" then return nil end
    local ok, a, b, c = pcall(fn, ...)
    if not ok then return nil end
    return a, b, c
end

function MG:Log(level, event, message, data)
    local db = self:EnsureDB()
    if db.settings and db.settings.diagnostics == false and
       tostring(level or "INFO") == "INFO" then
        return
    end

    db.logSequence = db.logSequence + 1
    db.logs[#db.logs + 1] = {
        seq = db.logSequence,
        at = timestamp(),
        level = tostring(level or "INFO"),
        event = tostring(event or "unknown"),
        message = tostring(message or ""),
        data = sanitize(data or {}),
        runtimeRevision = self.RuntimeStore and self.RuntimeStore:GetRevision() or 0,
    }
    while #db.logs > MAX_LOGS do table.remove(db.logs, 1) end
end

function MG:Safe(eventName, fn)
    local ok, result = xpcall(fn, function(err)
        local stack = debugstack and debugstack(2, 16, 16) or nil
        self:Log("ERROR", eventName, tostring(err), { stack = stack })

        local message = "|cffff4040Mewthisch Guides Fehler|r " ..
            tostring(eventName) .. ": " .. tostring(err) .. "  (/mg1 errors)"
        if DEFAULT_CHAT_FRAME and DEFAULT_CHAT_FRAME.AddMessage then
            pcall(DEFAULT_CHAT_FRAME.AddMessage, DEFAULT_CHAT_FRAME, message)
        elseif print then
            pcall(print, message)
        end
        return err
    end)
    if not ok and geterrorhandler then
        local handler = geterrorhandler()
        if handler then pcall(handler, result) end
    end
    return ok, result
end

local function flatten(value, prefix, out, depth)
    out = out or {}
    depth = depth or 0
    if depth > 6 then
        out[#out + 1] = tostring(prefix or "value") .. "=<max-depth>"
        return out
    end
    if type(value) ~= "table" then
        out[#out + 1] = tostring(prefix or "value") .. "=" .. tostring(value)
        return out
    end
    local keys = {}
    for key in pairs(value) do keys[#keys + 1] = key end
    table.sort(keys, function(a,b) return tostring(a) < tostring(b) end)
    for _, key in ipairs(keys) do
        local p = prefix and (prefix .. "." .. tostring(key)) or tostring(key)
        if type(value[key]) == "table" then
            flatten(value[key], p, out, depth + 1)
        else
            out[#out + 1] = p .. "=" .. tostring(value[key])
        end
    end
    return out
end

local function collectQuestIDs(runtime)
    local ids, seen = {}, {}
    local function add(state)
        local id = state and tonumber(state.questID)
        if id and not seen[id] then
            seen[id] = true
            ids[#ids + 1] = id
        end
    end
    for _, state in ipairs(runtime.goalStates or {}) do add(state) end
    for _, sticky in ipairs(runtime.stickies or {}) do
        for _, state in ipairs(sticky.goalStates or {}) do add(state) end
    end
    table.sort(ids)
    return ids
end

function MG:GetLogCounts()
    local db = self:EnsureDB()
    local counts = { INFO=0, WARN=0, ERROR=0, total=0 }
    for _, entry in ipairs(db.logs or {}) do
        local level = tostring(entry.level or "INFO")
        counts[level] = (counts[level] or 0) + 1
        counts.total = counts.total + 1
    end
    return counts
end

function MG:GetDiagnosticSnapshot()
    local db = self:EnsureDB()
    local runtime = self.RuntimeStore and self.RuntimeStore:Get() or {}
    local source = self.RestEDXPForeverRaw and self.RestEDXPForeverRaw.source or {}

    local livePosition = self.PositionFacts and
        safeCall(self.PositionFacts.Snapshot, self.PositionFacts) or nil
    local facing = GetPlayerFacing and safeCall(GetPlayerFacing) or nil

    local relevantQuests = {}
    local facts = runtime.facts or {}
    for _, questID in ipairs(collectQuestIDs(runtime)) do
        local quest = facts.quests and facts.quests[questID] or nil
        relevantQuests[tostring(questID)] = quest or { present=false }
    end

    local parserStats
    if self.RestEDXPParser and self.RestEDXPParser.GetStats then
        parserStats = safeCall(self.RestEDXPParser.GetStats, self.RestEDXPParser)
    end
    local compilerStats
    if self.GuideCompiler and self.GuideCompiler.GetStats then
        compilerStats = safeCall(self.GuideCompiler.GetStats, self.GuideCompiler)
    end

    local currentStep = runtime.guide and runtime.stepIndex and
        runtime.guide.steps and runtime.guide.steps[runtime.stepIndex] or nil

    local snapshot = {
        addon = {
            name = self.NAME,
            version = self.VERSION,
            build = self.BUILD,
            interface = self.INTERFACE,
            loadedAt = timestamp(),
        },
        source = {
            name = source.name,
            repository = source.repository,
            commit = source.commit,
            license = source.license,
            transformed = source.transformed,
            proseCopied = source.proseCopied,
        },
        player = self.GetPlayerProfile and self:GetPlayerProfile() or nil,
        api = {
            C_Map = C_Map ~= nil,
            C_Map_GetBestMapForUnit = C_Map and C_Map.GetBestMapForUnit ~= nil,
            C_Map_GetPlayerMapPosition = C_Map and C_Map.GetPlayerMapPosition ~= nil,
            C_Map_GetWorldPosFromMapPos = C_Map and C_Map.GetWorldPosFromMapPos ~= nil,
            C_Map_GetMapWorldSize = C_Map and C_Map.GetMapWorldSize ~= nil,
            C_QuestLog = C_QuestLog ~= nil,
            GetPlayerFacing = GetPlayerFacing ~= nil,
            CreateVector2D = CreateVector2D ~= nil,
        },
        modules = {
            GuideCatalog = self.GuideCatalog ~= nil,
            GuideCompiler = self.GuideCompiler ~= nil,
            RuntimeEngine = self.RuntimeEngine ~= nil,
            RuntimeStore = self.RuntimeStore ~= nil,
            CoordinateConverter = self.CoordinateConverter ~= nil,
            NavigationDistance = self.NavigationDistance ~= nil,
            NavigationBearing = self.NavigationBearing ~= nil,
            RoutePlanner = self.RoutePlanner ~= nil,
            TravelPlanner = self.TravelPlanner ~= nil,
            GuideController = self.GuideController ~= nil,
            AutomationPolicy = self.AutomationPolicy ~= nil,
            ActionPolicy = self.ActionPolicy ~= nil,
            GearScore = self.GearScore ~= nil,
            RewardAdvisor = self.RewardAdvisor ~= nil,
            BuildAdvisor = self.BuildAdvisor ~= nil,
            GuideViewer = self.GuideViewer ~= nil,
            NavigatorFrame = self.NavigatorFrame ~= nil,
            GuideBrowser = self.GuideBrowser ~= nil,
            ActionBar = self.ActionBar ~= nil,
            WorldMapOverlay = self.WorldMapOverlay ~= nil,
            RewardAdvisorFrame = self.RewardAdvisorFrame ~= nil,
            BuildWindow = self.BuildWindow ~= nil,
            SettingsWindow = self.SettingsWindow ~= nil,
            ErrorLogWindow = self.ErrorLogWindow ~= nil,
        },
        runtime = {
            revision = runtime.revision,
            reason = runtime.reason,
            guideID = runtime.guideID,
            guideTitle = runtime.guide and runtime.guide.title or nil,
            stepID = runtime.stepID,
            stepIndex = runtime.stepIndex,
            stepCount = runtime.guide and runtime.guide.steps and #runtime.guide.steps or nil,
            stepLabel = currentStep and currentStep.label or nil,
            stepSticky = currentStep and currentStep.sticky or nil,
            stepCompleteWith = currentStep and currentStep.completeWith or nil,
            stepState = runtime.stepState,
            destinationGoal = runtime.destinationGoal,
            destinationWaypoint = runtime.destinationWaypoint,
            navigation = runtime.navigation,
            route = runtime.route,
            currentRouteSegment = runtime.currentRouteSegment,
            travel = runtime.travel,
            presentation = runtime.presentation,
            factsPosition = facts.position,
            livePosition = livePosition,
            playerFacing = facing,
            events = runtime.events,
        },
        navigator = db.runtime and db.runtime.navigator or nil,
        worldMap = db.runtime and db.runtime.worldMap or nil,
        actionMemory = self.ActionMemory and self.ActionMemory:Snapshot() or nil,
        buildAdvice = self.BuildAdvisor and self.BuildAdvisor:Snapshot(runtime) or nil,
        rewardAdvice = self.RewardAdvisor and self.RewardAdvisor:Get() or nil,
        relevantQuests = relevantQuests,
        settings = db.settings,
        guideSelection = db.guide,
        ui = db.ui,
        corpus = {
            parser = parserStats,
            compiler = compilerStats,
        },
        logs = self:GetLogCounts(),
    }
    return sanitize(snapshot)
end

local function appendSection(lines, title, value)
    lines[#lines + 1] = title
    if value == nil then
        lines[#lines + 1] = "  <nicht verfügbar>"
    else
        local details = flatten(value)
        if #details == 0 then
            lines[#lines + 1] = "  <leer>"
        else
            for _, detail in ipairs(details) do
                lines[#lines + 1] = "  " .. detail
            end
        end
    end
    lines[#lines + 1] = string.rep("-", 78)
end

function MG:GetErrorLogText(includeInfo)
    local db = self:EnsureDB()
    local snapshot = self:GetDiagnosticSnapshot()
    local counts = self:GetLogCounts()
    local lines = {
        "MEWTHISCH GUIDES 1.0 - FEHLER & DIAGNOSE",
        "Erzeugt=" .. timestamp(),
        "Build=" .. tostring(self.BUILD or "-"),
        "Logs total=" .. tostring(counts.total) ..
            " INFO=" .. tostring(counts.INFO or 0) ..
            " WARN=" .. tostring(counts.WARN or 0) ..
            " ERROR=" .. tostring(counts.ERROR or 0),
        string.rep("=", 78),
    }

    appendSection(lines, "ADDON / QUELLE", {
        addon=snapshot.addon,
        source=snapshot.source,
        corpus=snapshot.corpus,
    })
    appendSection(lines, "PLAYER / API / MODULE", {
        player=snapshot.player,
        api=snapshot.api,
        modules=snapshot.modules,
    })
    appendSection(lines, "RUNTIME", snapshot.runtime)
    appendSection(lines, "NAVIGATOR", snapshot.navigator)
    appendSection(lines, "WELTKARTE / ACTION MEMORY", {
        worldMap=snapshot.worldMap,
        actionMemory=snapshot.actionMemory,
    })
    appendSection(lines, "BUILD / REWARD", {
        buildAdvice=snapshot.buildAdvice,
        rewardAdvice=snapshot.rewardAdvice,
    })
    appendSection(lines, "RELEVANTE QUESTS", snapshot.relevantQuests)
    appendSection(lines, "EINSTELLUNGEN / UI", {
        settings=snapshot.settings,
        guideSelection=snapshot.guideSelection,
        ui=snapshot.ui,
    })

    lines[#lines + 1] = includeInfo and
        "EVENT LOG - INFO/WARN/ERROR" or "EVENT LOG - WARN/ERROR"
    lines[#lines + 1] = string.rep("-", 78)

    local count = 0
    for _, entry in ipairs(db.logs or {}) do
        if includeInfo or entry.level == "WARN" or entry.level == "ERROR" then
            count = count + 1
            lines[#lines + 1] = string.format(
                "[%s] #%s %s %s rev=%s",
                tostring(entry.level), tostring(entry.seq),
                tostring(entry.at), tostring(entry.event),
                tostring(entry.runtimeRevision or 0))
            lines[#lines + 1] = tostring(entry.message)
            for _, detail in ipairs(flatten(entry.data)) do
                lines[#lines + 1] = "  " .. detail
            end
            lines[#lines + 1] = ""
        end
    end
    if count == 0 then lines[#lines + 1] = "Keine passenden Logeinträge." end
    return table.concat(lines, "\n")
end
