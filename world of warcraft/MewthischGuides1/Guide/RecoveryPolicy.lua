local addonName, MG = ...

MG.RecoveryPolicy = MG.RecoveryPolicy or {}
local R = MG.RecoveryPolicy

function R:FindResumeIndex(guide, facts)
    if not guide or #(guide.steps or {}) == 0 then return 1, "empty_guide" end
    facts = facts or { quests = MG.QuestFacts:Snapshot() }
    local quests = facts.quests or {}
    local bestActive, bestActivePriority = nil, -1
    local highestCompleted = 0

    for index, step in ipairs(guide.steps) do
        for _, goal in ipairs(step.goals or {}) do
            local questID = tonumber(goal.questID)
            local quest = questID and quests[questID] or nil

            if quest and quest.completed then
                highestCompleted = math.max(highestCompleted, index)
            elseif quest and quest.active then
                local priority = index * 10
                if goal.action == "turnin" and quest.readyForTurnIn then
                    priority = priority + 4
                elseif goal.action == "complete" then
                    local objective = quest.objectives and goal.objectiveIndex and
                        quest.objectives[goal.objectiveIndex]
                    if not objective or not objective.finished then priority = priority + 3 end
                elseif goal.action ~= "accept" then
                    priority = priority + 2
                end
                if priority > bestActivePriority then
                    bestActivePriority = priority
                    bestActive = index
                end
            end
        end
    end

    if bestActive then return bestActive, "active_quest" end
    if highestCompleted > 0 then
        return math.min(#guide.steps, highestCompleted + 1), "after_completed_quest"
    end
    return 1, "guide_start"
end
