local addonName, MG = ...

MG.NavigationTargetResolver = MG.NavigationTargetResolver or {}
local N = MG.NavigationTargetResolver

local function candidate(states, source)
    for _, state in ipairs(states or {}) do
        if state.navigationEligible then
            return {
                goalState = state,
                source = source,
                waypoint = state.waypoint,
                reason = "first_visible_incomplete_waypoint",
            }
        end
    end
    return nil
end

function N:Resolve(stepStates, stickyStates)
    local current = candidate(stepStates, "current_step")
    if current then return current end

    for _, sticky in ipairs(stickyStates or {}) do
        local found = candidate(sticky.goalStates, "sticky")
        if found then
            found.stickyStepID = sticky.step and sticky.step.id or nil
            return found
        end
    end

    return nil
end
