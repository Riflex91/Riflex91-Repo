local addonName, MG = ...

MG.QuestFacts = MG.QuestFacts or {}
local Q = MG.QuestFacts

local function flaggedCompleted(questID)
    questID = tonumber(questID)
    if not questID then return false end
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

local function questTitle(questID)
    if C_QuestLog and C_QuestLog.GetTitleForQuestID then
        local ok, value = pcall(C_QuestLog.GetTitleForQuestID, questID)
        if ok and value and value ~= "" then return value end
    end
    return nil
end

local function modernObjectives(questID)
    if not C_QuestLog or not C_QuestLog.GetQuestObjectives then return nil end
    local ok, values = pcall(C_QuestLog.GetQuestObjectives, questID)
    if not ok or type(values) ~= "table" then return nil end
    local out = {}
    for index, objective in ipairs(values) do
        out[index] = {
            text = objective.text,
            type = objective.type,
            finished = objective.finished and true or false,
            current = tonumber(objective.numFulfilled),
            required = tonumber(objective.numRequired),
        }
    end
    return out
end

local function legacyObjectives(questLogIndex)
    if not GetNumQuestLeaderBoards or not GetQuestLogLeaderBoard then return {} end
    local ok, count = pcall(GetNumQuestLeaderBoards, questLogIndex)
    if not ok then return {} end
    local out = {}
    for objective = 1, tonumber(count) or 0 do
        local good, text, objectiveType, finished = pcall(
            GetQuestLogLeaderBoard, objective, questLogIndex)
        if good then
            local current, required = tostring(text or ""):match("(%d+)%s*/%s*(%d+)")
            out[objective] = {
                text = text,
                type = objectiveType,
                finished = finished and true or false,
                current = tonumber(current),
                required = tonumber(required),
            }
        end
    end
    return out
end

function Q:Snapshot(relevantQuestIDs)
    local out = {}

    if C_QuestLog and C_QuestLog.GetNumQuestLogEntries and C_QuestLog.GetInfo then
        local ok, count = pcall(C_QuestLog.GetNumQuestLogEntries)
        if ok then
            for index = 1, tonumber(count) or 0 do
                local good, info = pcall(C_QuestLog.GetInfo, index)
                if good and info and not info.isHeader and info.questID then
                    local questID = tonumber(info.questID)
                    local ready = false
                    if C_QuestLog.ReadyForTurnIn then
                        local rOk, rValue = pcall(C_QuestLog.ReadyForTurnIn, questID)
                        ready = rOk and rValue and true or false
                    end
                    out[questID] = {
                        questID=questID,
                        active=true,
                        completed=flaggedCompleted(questID),
                        readyForTurnIn=ready,
                        title=info.title,
                        level=info.level,
                        questLogIndex=index,
                        objectives=modernObjectives(questID) or legacyObjectives(index),
                    }
                end
            end
        end
    elseif GetNumQuestLogEntries and GetQuestLogTitle then
        local ok, entries = pcall(GetNumQuestLogEntries)
        if ok then
            for index = 1, tonumber(entries) or 0 do
                local good, title, level, _, isHeader, _, _, _, questID =
                    pcall(GetQuestLogTitle, index)
                if good and not isHeader and questID then
                    questID = tonumber(questID)
                    local ready = false
                    if IsQuestComplete then
                        local rOk, rValue = pcall(IsQuestComplete, questID)
                        ready = rOk and rValue and true or false
                    end
                    out[questID] = {
                        questID=questID,
                        active=true,
                        completed=flaggedCompleted(questID),
                        readyForTurnIn=ready,
                        title=title,
                        level=level,
                        questLogIndex=index,
                        objectives=legacyObjectives(index),
                    }
                end
            end
        end
    end

    for questID in pairs(relevantQuestIDs or {}) do
        questID = tonumber(questID)
        if questID and not out[questID] then
            local completed = flaggedCompleted(questID)
            out[questID] = {
                questID=questID,
                active=false,
                completed=completed,
                readyForTurnIn=false,
                title=questTitle(questID),
                objectives={},
                synthetic=true,
            }
        end
    end

    return out
end

function Q:IsCompleted(questID, snapshot)
    snapshot = snapshot or {}
    local quest = snapshot[tonumber(questID)]
    if quest and quest.completed then return true end
    return flaggedCompleted(tonumber(questID))
end
