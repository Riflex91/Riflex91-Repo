local addonName, MG = ...

MG.StepStateResolver = MG.StepStateResolver or {}
local S = MG.StepStateResolver

function S:Resolve(step, goalStates, prior)
    local blockers, completeBlockers, unknownBlockers = 0, 0, 0
    local possibleSemantic, optionalGoals, visibleGoals = 0, 0, 0
    local anyWasCompletable = prior and prior.anyWasCompletable or false

    for _, state in ipairs(goalStates or {}) do
        if state.visible then visibleGoals = visibleGoals + 1 end
        if state.possible and (state.role == "goal" or state.role == "condition") then
            possibleSemantic = possibleSemantic + 1
        end
        if state.optional and state.role == "goal" then optionalGoals = optionalGoals + 1 end
        if state.blocking then
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
    if blockers == 0 and anyWasCompletable then complete = true end

    local skipSafe =
        blockers == 0 and
        not anyWasCompletable and
        possibleSemantic == 0 and
        #(goalStates or {}) > 0

    return {
        id=step and step.id or nil,
        complete=complete,
        blockingGoals=blockers,
        completedBlockingGoals=completeBlockers,
        unknownBlockingGoals=unknownBlockers,
        possibleSemanticGoals=possibleSemantic,
        optionalGoals=optionalGoals,
        visibleGoals=visibleGoals,
        anyWasCompletable=anyWasCompletable,
        skipSafe=skipSafe,
        autoAdvanceSafe=complete and unknownBlockers == 0,
        reason=
            skipSafe and "requirements_make_step_irrelevant" or
            blockers == 0 and anyWasCompletable and "previously_completable" or
            blockers == 0 and optionalGoals > 0 and "optional_only" or
            blockers == 0 and "no_blocking_goals" or
            unknownBlockers > 0 and "unknown_completion" or
            complete and "all_blocking_goals_complete" or
            "blocking_goals_incomplete",
    }
end
