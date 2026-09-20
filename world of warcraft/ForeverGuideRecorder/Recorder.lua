local addonName, FGR = ...

local frame = CreateFrame("Frame")
local events = {
    "PLAYER_LOGIN",
    "PLAYER_LOGOUT",
    "PLAYER_LEVEL_UP",
    "QUEST_ACCEPTED",
    "QUEST_REMOVED",
    "QUEST_TURNED_IN",
    "QUEST_LOG_UPDATE",
    "GOSSIP_SHOW",
    "QUEST_GREETING",
    "PLAYER_DEAD",
    "ZONE_CHANGED_NEW_AREA",
}
for _, event in ipairs(events) do frame:RegisterEvent(event) end

local objectiveHashes = {}
local questUpdatePending = false

local function objectiveSnapshot(questID)
    if not C_QuestLog or not C_QuestLog.GetQuestObjectives then return nil end
    local objectives = C_QuestLog.GetQuestObjectives(questID)
    if not objectives then return nil end

    local result, hashParts = {}, {}
    for i, objective in ipairs(objectives) do
        local row = {
            index = i,
            text = objective.text,
            type = objective.type,
            finished = objective.finished,
            numFulfilled = objective.numFulfilled,
            numRequired = objective.numRequired,
        }
        result[#result + 1] = row
        hashParts[#hashParts + 1] = table.concat({
            tostring(row.text), tostring(row.finished), tostring(row.numFulfilled), tostring(row.numRequired)
        }, ":")
    end
    return result, table.concat(hashParts, "|")
end

local function scanQuestLog()
    if not C_QuestLog or not C_QuestLog.GetNumQuestLogEntries then return end

    local count = C_QuestLog.GetNumQuestLogEntries()
    for index = 1, count do
        local info = C_QuestLog.GetInfo(index)
        if info and not info.isHeader and info.questID then
            local objectives, hash = objectiveSnapshot(info.questID)
            local completed = C_QuestLog.IsComplete and C_QuestLog.IsComplete(info.questID) or false
            local combined = tostring(completed) .. "|" .. tostring(hash)
            if objectiveHashes[info.questID] ~= combined then
                objectiveHashes[info.questID] = combined
                FGR:Record("quest.snapshot", info.questID, {
                    title = info.title,
                    level = info.level,
                    suggestedGroup = info.suggestedGroup,
                    frequency = info.frequency,
                    isComplete = completed,
                    objectives = objectives,
                    position = FGR:GetPosition(),
                })
            end
        end
    end
end

local function recordGossip()
    if not C_GossipInfo then return end

    local available, active = {}, {}
    if C_GossipInfo.GetAvailableQuests then
        for _, q in ipairs(C_GossipInfo.GetAvailableQuests() or {}) do
            available[#available + 1] = {
                questID = q.questID,
                title = q.title,
                level = q.level,
                isTrivial = q.isTrivial,
                frequency = q.frequency,
            }
        end
    end
    if C_GossipInfo.GetActiveQuests then
        for _, q in ipairs(C_GossipInfo.GetActiveQuests() or {}) do
            active[#active + 1] = {
                questID = q.questID,
                title = q.title,
                level = q.level,
                isComplete = q.isComplete,
            }
        end
    end

    FGR:Record("npc.gossip", nil, {
        npc = FGR:GetNpc(),
        position = FGR:GetPosition(),
        availableQuests = available,
        activeQuests = active,
    })
end

frame:SetScript("OnEvent", function(_, event, ...)
    if event == "PLAYER_LOGIN" then
        FGR:StartSession()
        FGR:Record("player.login", nil, { position = FGR:GetPosition() })
        C_Timer.After(2, scanQuestLog)

    elseif event == "PLAYER_LOGOUT" then
        FGR:Record("player.logout", nil, { position = FGR:GetPosition() })
        if FGR.session then FGR.session.endedUtc = date("!%Y-%m-%dT%H:%M:%SZ") end

    elseif event == "PLAYER_LEVEL_UP" then
        local newLevel = ...
        FGR:Record("player.level_up", newLevel, {
            level = newLevel,
            position = FGR:GetPosition(),
        })

    elseif event == "QUEST_ACCEPTED" then
        local questLogIndex, questID = ...
        FGR:Record("quest.accepted", questID, {
            questLogIndex = questLogIndex,
            npc = FGR:GetNpc(),
            position = FGR:GetPosition(),
        })

    elseif event == "QUEST_REMOVED" then
        local questID, wasReplayQuest = ...
        FGR:Record("quest.removed", questID, {
            wasReplayQuest = wasReplayQuest,
            position = FGR:GetPosition(),
        })

    elseif event == "QUEST_TURNED_IN" then
        local questID, xpReward, moneyReward = ...
        FGR:Record("quest.turned_in", questID, {
            xpReward = xpReward,
            moneyReward = moneyReward,
            npc = FGR:GetNpc(),
            position = FGR:GetPosition(),
        })

    elseif event == "QUEST_LOG_UPDATE" then
        if not questUpdatePending then
            questUpdatePending = true
            C_Timer.After(0.4, function()
                questUpdatePending = false
                scanQuestLog()
            end)
        end

    elseif event == "GOSSIP_SHOW" or event == "QUEST_GREETING" then
        recordGossip()

    elseif event == "PLAYER_DEAD" then
        FGR:Record("player.death", nil, {
            position = FGR:GetPosition(),
        }, "gameplay-event")

    elseif event == "ZONE_CHANGED_NEW_AREA" then
        FGR:Record("player.zone", nil, {
            position = FGR:GetPosition(),
        })
    end
end)
