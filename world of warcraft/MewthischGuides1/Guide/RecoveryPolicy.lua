local addonName, MG = ...

MG.RecoveryPolicy = MG.RecoveryPolicy or {}
local R = MG.RecoveryPolicy

local function objectiveFor(goal, quest)
    return quest and quest.objectives and goal.objectiveIndex and
        quest.objectives[tonumber(goal.objectiveIndex)] or nil
end

local function actionableActiveGoal(goal, quest, facts)
    if not goal then return false, 0, "missing_goal" end
    local action = goal.action

    if action == "turnin" then
        if quest and quest.active and quest.readyForTurnIn then
            return true, 500, "ready_turnin"
        end
        return false, 0, "turnin_not_ready"
    end

    if action == "accept" then
        -- Recovery must never jump to a future accept while the same quest
        -- is already active. Accept steps are reached by normal progression.
        return false, 0, quest and quest.active and "already_active" or "accept_not_recovery_anchor"
    end

    if action == "complete" then
        if not (quest and quest.active) then return false, 0, "quest_not_active" end
        if quest.readyForTurnIn then return false, 0, "quest_ready_for_turnin" end
        local objective = objectiveFor(goal, quest)
        if objective then
            if objective.finished then return false, 0, "objective_finished" end
            return true, 450, "unfinished_objective"
        end
        -- Some Forever quest APIs omit objective detail briefly. An active,
        -- not-ready quest is still a better anchor than its later turn-in.
        return true, 350, "active_objective_unknown"
    end

    if action == "collect" then
        if quest and quest.active then
            if quest.readyForTurnIn then return false, 0, "quest_ready_for_turnin" end
            local objective = objectiveFor(goal, quest)
            if objective and objective.finished then return false, 0, "collect_finished" end
            return true, 430, objective and "unfinished_collect_objective" or "active_collect"
        end

        local itemID = tonumber(goal.itemID)
        local required = tonumber(goal.required)
        local current = itemID and facts and facts.inventory and
            tonumber(facts.inventory[itemID]) or 0
        if itemID and required and current < required then
            return true, 250, "inventory_collect"
        end
        return false, 0, "collect_not_active"
    end

    if quest and quest.active and action ~= "accept" then
        if quest.readyForTurnIn then return false, 0, "prefer_turnin" end
        return true, 200, "active_quest_action"
    end

    return false, 0, "not_actionable"
end

function R:FindResumeIndex(guide, facts)
    if not guide or #(guide.steps or {}) == 0 then return 1, "empty_guide" end

    facts = facts or {
        quests = MG.QuestFacts:Snapshot(),
        inventory = MG.InventoryFacts and MG.InventoryFacts:Snapshot() or {},
    }
    local quests = facts.quests or {}

    local bestIndex, bestScore, bestReason = nil, -1, nil
    local highestCompleted = 0

    for index, step in ipairs(guide.steps or {}) do
        for _, goal in ipairs(step.goals or {}) do
            local questID = tonumber(goal.questID)
            local quest = questID and quests[questID] or nil

            if quest and quest.completed then
                highestCompleted = math.max(highestCompleted, index)
            else
                local actionable, baseScore, reason =
                    actionableActiveGoal(goal, quest, facts)
                if actionable then
                    -- Prefer semantically stronger candidates first, then the
                    -- latest matching RestedXP occurrence of that same state.
                    local score = baseScore * 100000 + index
                    if score > bestScore then
                        bestScore = score
                        bestIndex = index
                        bestReason = reason
                    end
                end
            end
        end
    end

    if bestIndex then return bestIndex, bestReason or "active_goal" end
    if highestCompleted > 0 then
        return math.min(#guide.steps, highestCompleted + 1), "after_completed_quest"
    end
    return 1, "guide_start"
end
