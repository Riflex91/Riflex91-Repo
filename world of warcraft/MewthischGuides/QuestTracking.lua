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

function Tracking:Refresh(reason)
    local snapshot = {}

    if C_QuestLog and C_QuestLog.GetNumQuestLogEntries and C_QuestLog.GetInfo then
        local okCount, count = pcall(C_QuestLog.GetNumQuestLogEntries)
        count = okCount and tonumber(count) or 0

        for index = 1, count do
            local okInfo, info = pcall(C_QuestLog.GetInfo, index)
            if okInfo and info and not info.isHeader and info.questID then
                local objectives = {}
                if C_QuestLog.GetQuestObjectives then
                    local ok, value = pcall(C_QuestLog.GetQuestObjectives, info.questID)
                    if ok and type(value) == "table" then objectives = value end
                end

                local ready = false
                if C_QuestLog.ReadyForTurnIn then
                    local ok, value = pcall(C_QuestLog.ReadyForTurnIn, info.questID)
                    ready = ok and value and true or false
                elseif C_QuestLog.IsComplete then
                    local ok, value = pcall(C_QuestLog.IsComplete, info.questID)
                    ready = ok and value and true or false
                elseif info.isComplete ~= nil then
                    ready = info.isComplete and true or false
                end

                snapshot[info.questID] = {
                    questID = info.questID,
                    title = info.title,
                    level = info.level,
                    questLogIndex = index,
                    objectives = objectives,
                    readyForTurnIn = ready,
                    completed = safeCompleted(info.questID),
                }
            end
        end
    end

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
