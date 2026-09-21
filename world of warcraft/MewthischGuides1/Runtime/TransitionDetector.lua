local addonName, MG = ...

MG.TransitionDetector = MG.TransitionDetector or {}
local T = MG.TransitionDetector

local function mapStates(snapshot)
    local out = {}
    for _, state in ipairs(snapshot and snapshot.goalStates or {}) do out[state.id] = state end
    for _, sticky in ipairs(snapshot and snapshot.stickies or {}) do
        for _, state in ipairs(sticky.goalStates or {}) do out[state.id] = state end
    end
    return out
end

function T:Detect(previous, current)
    local events = {}
    if not previous or not previous.stepID then return events end

    if previous.stepID ~= current.stepID then
        events[#events + 1] = {
            type="STEP_CHANGED", from=previous.stepID, to=current.stepID,
        }
    end

    local old = mapStates(previous)
    local new = mapStates(current)
    for id, state in pairs(new) do
        local prior = old[id]
        if prior then
            if prior.complete ~= state.complete then
                events[#events + 1] = {
                    type=state.complete and "GOAL_COMPLETED" or "GOAL_UNCOMPLETED",
                    goalID=id,
                }
            elseif prior.visible ~= state.visible then
                events[#events + 1] = {type="GOAL_VISIBILITY_CHANGED",goalID=id}
            elseif prior.current ~= state.current or prior.required ~= state.required then
                events[#events + 1] = {type="GOAL_PROGRESS",goalID=id}
            end
        end
    end

    if previous.stepState and current.stepState and
       not previous.stepState.complete and current.stepState.complete then
        events[#events + 1] = {type="STEP_COMPLETE",stepID=current.stepID}
    end
    return events
end
