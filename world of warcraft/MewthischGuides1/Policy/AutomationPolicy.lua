local addonName, MG = ...

MG.AutomationPolicy = MG.AutomationPolicy or {}
local A = MG.AutomationPolicy

local function currentGoal()
    local runtime = MG.RuntimeStore and MG.RuntimeStore:Get() or nil
    return runtime and runtime.destinationGoal or nil
end

local function currentQuestID()
    if GetQuestID then
        local ok, value = pcall(GetQuestID)
        if ok then return tonumber(value) end
    end
    return nil
end

local function matchesQuest(goal, questID, action)
    if not goal or tostring(goal.action or "") ~= tostring(action or "") then return false end
    questID = tonumber(questID)
    if goal.questID and tonumber(goal.questID) == questID then return true end
    for _, id in ipairs(goal.questIDs or {}) do
        if tonumber(id) == questID then return true end
    end
    return false
end

function A:OnQuestDetail()
    local db = MG:EnsureDB()
    if not db.settings.autoAcceptQuests then return false, "disabled" end
    local goal, questID = currentGoal(), currentQuestID()
    if not matchesQuest(goal, questID, "accept") then
        return false, "semantic_goal_mismatch"
    end
    if AcceptQuest then
        local ok = pcall(AcceptQuest)
        if ok then
            if MG.ActionMemory then MG.ActionMemory:Record("accept", questID, {automatic=true}) end
            MG:Log("INFO", "automation.quest_accept", "Quest automatisch angenommen.", {
                questID=questID,goalID=goal.id,
            })
            return true, "accepted"
        end
    end
    return false, "api_unavailable"
end

function A:OnQuestProgress()
    local db = MG:EnsureDB()
    if not db.settings.autoTurnInQuests then return false, "disabled" end
    local goal, questID = currentGoal(), currentQuestID()
    if not matchesQuest(goal, questID, "turnin") then
        return false, "semantic_goal_mismatch"
    end
    local completable = true
    if IsQuestCompletable then
        local ok, value = pcall(IsQuestCompletable)
        completable = ok and value and true or false
    end
    if completable and CompleteQuest then
        local ok = pcall(CompleteQuest)
        if ok then return true, "progressed" end
    end
    return false, "not_completable"
end

function A:OnQuestComplete()
    local db = MG:EnsureDB()
    if not db.settings.autoTurnInQuests then return false, "disabled" end
    local goal, questID = currentGoal(), currentQuestID()
    if not matchesQuest(goal, questID, "turnin") then
        return false, "semantic_goal_mismatch"
    end

    local choices = 0
    if GetNumQuestChoices then
        local ok, value = pcall(GetNumQuestChoices)
        if ok then choices = tonumber(value) or 0 end
    end
    if choices > 0 then
        return false, "reward_choice_requires_user"
    end

    if GetQuestReward then
        local ok = pcall(GetQuestReward, 0)
        if ok then
            if MG.ActionMemory then MG.ActionMemory:Record("turnin", questID, {automatic=true}) end
            MG:Log("INFO", "automation.quest_turnin", "Quest automatisch abgegeben.", {
                questID=questID,goalID=goal.id,
            })
            return true, "turned_in"
        end
    end
    return false, "api_unavailable"
end
