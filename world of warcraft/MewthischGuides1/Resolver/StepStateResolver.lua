local addonName, MG = ...

MG.StepStateResolver = MG.StepStateResolver or {}
local S = MG.StepStateResolver

function S:Resolve(step, goalStates, prior)
    local blockers, completeBlockers, unknownBlockers = 0, 0, 0
    local anyWasCompletable = prior and prior.anyWasCompletable or false

    for _, state in ipairs(goalStates or {}) do
        if state.visible and state.possible and not state.passive and not state.optional then
            blockers = blockers + 1
            if state.complete then
                completeBlockers = completeBlockers + 1
            elseif not state.completionKnown then
                unknownBlockers = unknownBlockers + 1
            else
                anyWasCompletable = true
            end
        end
    end

    local complete = blockers > 0 and completeBlockers == blockers
    return {
        id = step and step.id or nil,
        complete = complete,
        blockingGoals = blockers,
        completedBlockingGoals = completeBlockers,
        unknownBlockingGoals = unknownBlockers,
        anyWasCompletable = anyWasCompletable,
        autoAdvanceSafe = complete and unknownBlockers == 0,
        reason =
            blockers == 0 and "no_blocking_goals" or
            unknownBlockers > 0 and "unknown_completion" or
            complete and "all_blocking_goals_complete" or
            "blocking_goals_incomplete",
    }
end
