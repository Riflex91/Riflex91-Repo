local addonName, MG = ...

MG.QuestTracking = MG.QuestTracking or {}
local Tracking = MG.QuestTracking

Tracking.snapshot = Tracking.snapshot or {}
Tracking.signature = nil
Tracking.updatedAt = 0

local function now()
    if time then return time() end
    return 0
end

local function safeCompleted(questID)
    if C_QuestLog and C_QuestLog.IsQuestFlaggedCompleted then
        local ok, value = pcall(C_QuestLog.IsQuestFlaggedCompleted, questID)
        if ok then return value and true or false end
    end
    if IsQuestFlaggedCompleted then
        local ok, value = pcall(IsQuestFlaggedCompleted, questID)
        if ok then return value and true or false end
    end
    return false
end

local function parseLegacyCounts(text)
    local current, required = tostring(text or ""):match("(%d+)%s*/%s*(%d+)")
    return tonumber(current), tonumber(required)
end

local function legacyObjectives(index)
    local objectives = {}
    if not GetNumQuestLeaderBoards or not GetQuestLogLeaderBoard then
        return objectives
    end

    local okCount, count = pcall(GetNumQuestLeaderBoards, index)
    count = okCount and tonumber(count) or 0

    for objectiveIndex = 1, count do
        local ok, text, objectiveType, finished =
            pcall(GetQuestLogLeaderBoard, objectiveIndex, index)

        if ok and text then
            local current, required = parseLegacyCounts(text)
            objectives[#objectives + 1] = {
                text = text,
                type = objectiveType,
                finished = finished and true or false,
                numFulfilled = current,
                numRequired = required,
            }
        end
    end

    return objectives
end

local function readyForTurnIn(questID, info)
    if C_QuestLog and C_QuestLog.ReadyForTurnIn then
        local ok, value = pcall(C_QuestLog.ReadyForTurnIn, questID)
        if ok then return value and true or false end
    end

    if C_QuestLog and C_QuestLog.IsComplete then
        local ok, value = pcall(C_QuestLog.IsComplete, questID)
        if ok then return value and true or false end
    end

    if info and info.isComplete ~= nil then
        return info.isComplete == true or info.isComplete == 1
    end

    return false
end

local function signature(snapshot)
    local ids = {}
    for questID in pairs(snapshot) do ids[#ids + 1] = questID end
    table.sort(ids)

    local parts = {}
    for _, questID in ipairs(ids) do
        local row = snapshot[questID]
        parts[#parts + 1] = tostring(questID)
        parts[#parts + 1] = row.readyForTurnIn and "turnin" or "active"
        for _, objective in ipairs(row.objectives or {}) do
            parts[#parts + 1] = tostring(objective.finished and 1 or 0)
            parts[#parts + 1] = tostring(objective.numFulfilled or "")
            parts[#parts + 1] = tostring(objective.numRequired or "")
            parts[#parts + 1] = tostring(objective.text or "")
        end
    end
    return table.concat(parts, "|")
end

local function addModernSnapshot(snapshot)
    if not C_QuestLog or not C_QuestLog.GetNumQuestLogEntries or not C_QuestLog.GetInfo then
        return 0
    end

    local okCount, count = pcall(C_QuestLog.GetNumQuestLogEntries)
    count = okCount and tonumber(count) or 0
    local added = 0

    for index = 1, count do
        local okInfo, info = pcall(C_QuestLog.GetInfo, index)
        if okInfo and info and not info.isHeader and info.questID then
            local objectives = {}
            if C_QuestLog.GetQuestObjectives then
                local ok, value = pcall(C_QuestLog.GetQuestObjectives, info.questID)
                if ok and type(value) == "table" then objectives = value end
            end

            if #objectives == 0 then objectives = legacyObjectives(index) end

            snapshot[info.questID] = {
                questID = info.questID,
                title = info.title,
                level = info.level,
                questLogIndex = index,
                objectives = objectives,
                readyForTurnIn = readyForTurnIn(info.questID, info),
                completed = safeCompleted(info.questID),
                trackingSource = "C_QuestLog",
            }
            added = added + 1
        end
    end

    return added
end

local function addLegacySnapshot(snapshot)
    if not GetNumQuestLogEntries or not GetQuestLogTitle then return 0 end

    local okCount, entries = pcall(GetNumQuestLogEntries)
    entries = okCount and tonumber(entries) or 0
    local added = 0

    for index = 1, entries do
        local ok, title, level, _, isHeader, _, isComplete, _, questID =
            pcall(GetQuestLogTitle, index)

        if ok and not isHeader and tonumber(questID) then
            questID = tonumber(questID)

            if not snapshot[questID] then
                local objectives = legacyObjectives(index)
                local ready = readyForTurnIn(questID, { isComplete = isComplete })

                snapshot[questID] = {
                    questID = questID,
                    title = title,
                    level = level,
                    questLogIndex = index,
                    objectives = objectives,
                    readyForTurnIn = ready,
                    completed = safeCompleted(questID),
                    trackingSource = "LegacyQuestLog",
                }
                added = added + 1
            end
        end
    end

    return added
end

function Tracking:Refresh(reason)
    local snapshot = {}

    local modernAdded = addModernSnapshot(snapshot)
    local legacyAdded = addLegacySnapshot(snapshot)

    local newSignature = signature(snapshot)
    local changed = self.signature ~= nil and self.signature ~= newSignature
    self.snapshot = snapshot
    self.signature = newSignature
    self.updatedAt = now()

    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        local count = 0
        for _ in pairs(snapshot) do count = count + 1 end
        MG.db.runtime.questTracking = {
            activeQuests = count,
            modernQuests = modernAdded,
            legacyQuests = legacyAdded,
            updatedAt = self.updatedAt,
            reason = reason,
            changed = changed,
        }
    end

    return snapshot, changed
end

function Tracking:GetSnapshot()
    if not self.signature then self:Refresh("lazy") end
    return self.snapshot
end

function Tracking:GetQuest(questID)
    return self:GetSnapshot()[tonumber(questID)]
end

function Tracking:GetStatus()
    return MG.db and MG.db.runtime and MG.db.runtime.questTracking or {
        activeQuests = 0,
        updatedAt = 0,
    }
end
